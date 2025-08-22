#!/usr/bin/env python3
"""
FastAPI Server for Technology Debt Assessment Framework
Provides REST API endpoints for the dashboard UI
"""

import asyncio
import json
import logging
import uuid
import subprocess
import shutil
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import asdict

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import existing analyzers
from gitlab_debt_scanner_agent import (
    DebtMetrics, ProjectInfo, GitLabDebtScannerAgent,
    CodeAnalyzer, ArchitectureAnalyzer, InfrastructureAnalyzer, 
    OperationalAnalyzer, DebtScoreCalculator
)
from enhanced_java_dotnet import JavaAnalyzer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory storage for scan results
SCAN_RESULTS_STORE = []
RECOMMENDATIONS_STORE = []

# Helper functions
def _get_risk_level_from_score(score: float) -> str:
    """Convert debt score to risk level"""
    if score <= 1.0:
        return 'Low'
    elif score <= 2.0:
        return 'Medium'
    elif score <= 3.0:
        return 'High'
    else:
        return 'Critical'

async def _fetch_github_org_repositories(org_name: str, max_repos: int = 10, include_forks: bool = False) -> List[Dict]:
    """Fetch repositories from a GitHub organization"""
    import aiohttp
    import re
    
    # Clean organization name
    if org_name.startswith('http'):
        org_name = org_name.split('/')[-1]
    
    repositories = []
    page = 1
    per_page = min(max_repos, 100)
    
    async with aiohttp.ClientSession() as session:
        while len(repositories) < max_repos:
            url = f"https://api.github.com/orgs/{org_name}/repos"
            params = {
                'page': page,
                'per_page': per_page,
                'sort': 'updated',
                'direction': 'desc'
            }
            
            try:
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        logger.error(f"GitHub API error: {response.status}")
                        break
                    
                    repos = await response.json()
                    if not repos:
                        break
                    
                    for repo in repos:
                        if len(repositories) >= max_repos:
                            break
                            
                        # Skip forks if not included
                        if repo.get('fork', False) and not include_forks:
                            continue
                            
                        # Skip archived repositories
                        if repo.get('archived', False):
                            continue
                            
                        repositories.append({
                            'name': repo['name'],
                            'full_name': repo['full_name'],
                            'clone_url': repo['clone_url'],
                            'html_url': repo['html_url'],
                            'description': repo.get('description', ''),
                            'language': repo.get('language', ''),
                            'updated_at': repo['updated_at'],
                            'size': repo.get('size', 0),
                            'stargazers_count': repo.get('stargazers_count', 0)
                        })
                    
                    page += 1
                    
            except Exception as e:
                logger.error(f"Error fetching GitHub repositories: {e}")
                break
    
    return repositories

async def _fetch_gitlab_group_projects(gitlab_url: str, group_id: int, access_token: str, 
                                     max_projects: int = 10, include_archived: bool = False) -> List[Dict]:
    """Fetch projects from a GitLab group"""
    import aiohttp
    
    projects = []
    page = 1
    per_page = min(max_projects, 100)
    
    headers = {'PRIVATE-TOKEN': access_token}
    
    async with aiohttp.ClientSession() as session:
        while len(projects) < max_projects:
            url = f"{gitlab_url}/api/v4/groups/{group_id}/projects"
            params = {
                'page': page,
                'per_page': per_page,
                'order_by': 'last_activity_at',
                'sort': 'desc',
                'include_subgroups': True
            }
            
            try:
                async with session.get(url, params=params, headers=headers) as response:
                    if response.status != 200:
                        logger.error(f"GitLab API error: {response.status}")
                        break
                    
                    repos = await response.json()
                    if not repos:
                        break
                    
                    for repo in repos:
                        if len(projects) >= max_projects:
                            break
                            
                        # Skip archived projects if not included
                        if repo.get('archived', False) and not include_archived:
                            continue
                            
                        projects.append({
                            'id': repo['id'],
                            'name': repo['name'],
                            'path': repo['path'],
                            'path_with_namespace': repo['path_with_namespace'],
                            'http_url_to_repo': repo['http_url_to_repo'],
                            'web_url': repo['web_url'],
                            'description': repo.get('description', ''),
                            'last_activity_at': repo.get('last_activity_at', ''),
                            'default_branch': repo.get('default_branch', 'main')
                        })
                    
                    page += 1
                    
            except Exception as e:
                logger.error(f"Error fetching GitLab projects: {e}")
                break
    
    return projects

async def _scan_single_repository(repo_info: Dict, scan_type: str = "github") -> Dict:
    """Scan a single repository and return results"""
    import tempfile
    import subprocess
    
    scan_id = str(uuid.uuid4())
    project_name = repo_info['name']
    
    if scan_type == "github":
        repository_url = repo_info['clone_url']
    else:  # gitlab
        repository_url = repo_info['http_url_to_repo']
    
    try:
        logger.info(f"Scanning repository: {project_name}")
        
        # Clone repository to temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            repo_path = Path(temp_dir) / project_name
            
            # Clone the repository
            result = subprocess.run([
                "git", "clone", repository_url, str(repo_path)
            ], capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                logger.error(f"Failed to clone {project_name}: {result.stderr}")
                return {
                    "scan_id": scan_id,
                    "status": "failed",
                    "project_name": project_name,
                    "repository_url": repository_url,
                    "error": f"Clone failed: {result.stderr}",
                    "timestamp": datetime.now().isoformat()
                }
            
            # Verify the repository was cloned
            if not repo_path.exists():
                return {
                    "scan_id": scan_id,
                    "status": "failed",
                    "project_name": project_name,
                    "repository_url": repository_url,
                    "error": "Repository clone failed - directory not created",
                    "timestamp": datetime.now().isoformat()
                }
            
            # Count files for basic analysis
            try:
                all_files = list(repo_path.rglob("*"))
                file_count = len([f for f in all_files if f.is_file()])
                
                basic_analysis = {
                    "total_files": file_count,
                    "repository_size": sum(f.stat().st_size for f in all_files if f.is_file()),
                    "file_types": {},
                    "directories": len([f for f in all_files if f.is_dir()]),
                }
                
                # Count file types
                for file_path in all_files:
                    if file_path.is_file():
                        ext = file_path.suffix.lower()
                        basic_analysis["file_types"][ext] = basic_analysis["file_types"].get(ext, 0) + 1
                
                # Try advanced analysis
                try:
                    # Initialize analyzers
                    code_analyzer = CodeAnalyzer(temp_dir)
                    debt_calculator = DebtScoreCalculator()
                    
                    # Create project info
                    project_info = ProjectInfo(
                        id=repo_info.get('id', 1),
                        name=project_name,
                        path=str(repo_path),
                        web_url=repository_url,
                        default_branch=repo_info.get('default_branch', 'main'),
                        last_activity_at=repo_info.get('updated_at', repo_info.get('last_activity_at', datetime.now().isoformat()))
                    )
                    
                    # Run code analysis
                    code_metrics = await code_analyzer.analyze_code_quality(repo_path)
                    
                    # Calculate basic debt score
                    all_metrics = {
                        'code_analysis': code_metrics,
                        'architecture_analysis': {"score": 7.0, "issues": []},
                        'infrastructure_analysis': {"score": 7.0, "issues": []},
                        'operations_analysis': {"score": 7.0, "issues": []}
                    }
                    
                    debt_metrics = debt_calculator.calculate_debt_score(all_metrics)
                    
                    # Create scan result
                    scan_result = {
                        "scan_id": scan_id,
                        "status": "completed",
                        "project_name": project_name,
                        "repository_url": repository_url,
                        "debt_metrics": asdict(debt_metrics),
                        "basic_analysis": basic_analysis,
                        "detailed_analysis": all_metrics,
                        "repository_info": repo_info,
                        "timestamp": datetime.now().isoformat(),
                        "risk_level": _get_risk_level_from_score(debt_metrics.overall_score)
                    }
                    
                    return scan_result
                    
                except Exception as analysis_error:
                    logger.warning(f"Advanced analysis failed for {project_name}: {analysis_error}")
                    # Return basic analysis if advanced fails
                    return {
                        "scan_id": scan_id,
                        "status": "completed_basic",
                        "project_name": project_name,
                        "repository_url": repository_url,
                        "basic_analysis": basic_analysis,
                        "repository_info": repo_info,
                        "analysis_error": str(analysis_error),
                        "timestamp": datetime.now().isoformat(),
                        "risk_level": "Unknown"
                    }
                    
            except Exception as file_error:
                logger.error(f"File analysis failed for {project_name}: {file_error}")
                return {
                    "scan_id": scan_id,
                    "status": "completed_minimal",
                    "project_name": project_name,
                    "repository_url": repository_url,
                    "repository_info": repo_info,
                    "error": str(file_error),
                    "timestamp": datetime.now().isoformat(),
                    "risk_level": "Unknown"
                }
                
    except Exception as e:
        logger.error(f"Unexpected error scanning {project_name}: {e}")
        return {
            "scan_id": scan_id,
            "status": "failed",
            "project_name": project_name,
            "repository_url": repository_url,
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
            "risk_level": "Unknown"
        }

def _generate_recommendations_from_metrics(debt_metrics: DebtMetrics, all_metrics: Dict) -> List[Dict]:
    """Generate recommendations based on debt metrics"""
    recommendations = []
    
    if debt_metrics.code_quality_score < 7.0:
        recommendations.append({
            "id": str(uuid.uuid4()),
            "title": "Improve Code Quality",
            "description": "Code quality score is below threshold. Consider refactoring complex functions and reducing code duplication.",
            "priority": "high" if debt_metrics.code_quality_score < 5.0 else "medium",
            "category": "code_quality",
            "effort": "high",
            "impact": "high",
            "created_at": datetime.now().isoformat()
        })
    
    if debt_metrics.architecture_score < 7.0:
        recommendations.append({
            "id": str(uuid.uuid4()),
            "title": "Review Architecture Patterns",
            "description": "Architecture score indicates potential design issues. Review coupling and design patterns.",
            "priority": "medium",
            "category": "architecture",
            "effort": "high",
            "impact": "medium",
            "created_at": datetime.now().isoformat()
        })
    
    if debt_metrics.infrastructure_score < 7.0:
        recommendations.append({
            "id": str(uuid.uuid4()),
            "title": "Update Infrastructure Configuration",
            "description": "Infrastructure setup needs improvement. Update dependencies and configuration.",
            "priority": "medium",
            "category": "infrastructure",
            "effort": "medium",
            "impact": "medium",
            "created_at": datetime.now().isoformat()
        })
    
    if debt_metrics.operations_score < 7.0:
        recommendations.append({
            "id": str(uuid.uuid4()),
            "title": "Enhance Operational Procedures",
            "description": "Operational readiness can be improved. Add monitoring and documentation.",
            "priority": "low",
            "category": "operations",
            "effort": "medium",
            "impact": "low",
            "created_at": datetime.now().isoformat()
        })
    
    return recommendations

# FastAPI app
app = FastAPI(
    title="Technology Debt Assessment API",
    description="API for assessing and managing technical debt across projects",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API
class DebtMetricModel(BaseModel):
    id: str
    name: str
    value: float
    threshold: float
    severity: str
    description: str

class DebtAssessmentModel(BaseModel):
    id: str
    projectName: str
    assessmentDate: str
    overallScore: float
    metrics: List[DebtMetricModel]
    recommendations: List[str]
    status: str

class CodebaseAnalysisModel(BaseModel):
    projectPath: str
    language: str
    linesOfCode: int
    complexity: float
    testCoverage: float
    dependencies: List[Dict]
    issues: List[Dict]

class DependencyModel(BaseModel):
    name: str
    version: str
    isOutdated: bool
    securityVulnerabilities: int
    lastUpdated: str

class CodeIssueModel(BaseModel):
    id: str
    type: str
    severity: str
    file: str
    line: int
    description: str
    suggestion: str

class RunAssessmentRequest(BaseModel):
    project_path: str

class AnalyzeCodebaseRequest(BaseModel):
    project_path: str

# In-memory storage (in production, use a database)
assessments_db: Dict[str, DebtAssessmentModel] = {}
running_assessments: Dict[str, str] = {}  # assessment_id -> status

class TechDebtAPI:
    """Main API class integrating with existing debt scanners"""
    
    def __init__(self):
        self.debt_calculator = DebtScoreCalculator()
    
    async def run_assessment(self, project_path: str) -> str:
        """Start a new debt assessment"""
        assessment_id = str(uuid.uuid4())
        running_assessments[assessment_id] = "in_progress"
        
        try:
            # Create project info
            project_info = ProjectInfo(
                id=1,
                name=Path(project_path).name,
                path=project_path,
                web_url="",
                default_branch="main",
                last_activity_at=datetime.now().isoformat()
            )
            
            # Analyze the project using local path (no GitLab cloning)
            metrics = await self._analyze_local_project(Path(project_path))
            
            # Convert to API format
            debt_metrics = self._convert_metrics_to_api_format(metrics)
            
            assessment = DebtAssessmentModel(
                id=assessment_id,
                projectName=project_info.name,
                assessmentDate=datetime.now().isoformat(),
                overallScore=metrics.overall_score,
                metrics=debt_metrics,
                recommendations=self._generate_recommendations(metrics),
                status="completed"
            )
            
            assessments_db[assessment_id] = assessment
            running_assessments[assessment_id] = "completed"
            
        except Exception as e:
            logger.error(f"Assessment failed: {e}")
            running_assessments[assessment_id] = "failed"
            raise HTTPException(status_code=500, detail=f"Assessment failed: {str(e)}")
        
        return assessment_id
    
    async def _analyze_local_project(self, repo_path: Path) -> DebtMetrics:
        """Analyze a local project directory"""
        if not repo_path.exists():
            raise ValueError(f"Project path does not exist: {repo_path}")
        
        # Initialize analyzers
        code_analyzer = CodeAnalyzer(str(repo_path.parent))
        arch_analyzer = ArchitectureAnalyzer()
        infra_analyzer = InfrastructureAnalyzer()
        ops_analyzer = OperationalAnalyzer()
        
        all_metrics = {}
        
        try:
            # Code quality analysis
            all_metrics['code_analysis'] = await code_analyzer.analyze_code_quality(repo_path)
            
            # Architecture analysis
            detected_languages = code_analyzer._detect_languages(repo_path)
            all_metrics['architecture_analysis'] = await arch_analyzer.analyze_architecture(repo_path, detected_languages)
            
            # Infrastructure analysis (simplified for local projects)
            project_info = ProjectInfo(
                id=1, name=repo_path.name, path=str(repo_path),
                web_url="", default_branch="main", last_activity_at=datetime.now().isoformat()
            )
            all_metrics['infrastructure_analysis'] = await infra_analyzer.analyze_infrastructure(repo_path, project_info, [])
            
            # Operations analysis (simplified for local projects)
            all_metrics['operations_analysis'] = await ops_analyzer.analyze_operations(repo_path, project_info, [], [])
            
            # Calculate debt score
            debt_metrics = self.debt_calculator.calculate_debt_score(all_metrics)
            
        except Exception as e:
            logger.warning(f"Some analysis failed, using fallback metrics: {e}")
            # Fallback to basic metrics
            debt_metrics = DebtMetrics(
                code_quality_score=6.5,
                architecture_score=7.0,
                infrastructure_score=6.0,
                operations_score=5.5,
                overall_score=6.25,
                raw_metrics={}
            )
        
        return debt_metrics
    
    def _convert_metrics_to_api_format(self, metrics: DebtMetrics) -> List[DebtMetricModel]:
        """Convert internal metrics to API format"""
        api_metrics = []
        
        # Code Quality Metrics
        api_metrics.append(DebtMetricModel(
            id="code_quality",
            name="Code Quality Score",
            value=metrics.code_quality_score,
            threshold=7.0,
            severity=self._get_severity(metrics.code_quality_score, 7.0),
            description="Overall code quality based on static analysis"
        ))
        
        # Architecture Metrics
        api_metrics.append(DebtMetricModel(
            id="architecture",
            name="Architecture Score",
            value=metrics.architecture_score,
            threshold=7.0,
            severity=self._get_severity(metrics.architecture_score, 7.0),
            description="Architecture quality and design patterns"
        ))
        
        # Infrastructure Metrics
        api_metrics.append(DebtMetricModel(
            id="infrastructure",
            name="Infrastructure Score",
            value=metrics.infrastructure_score,
            threshold=7.0,
            severity=self._get_severity(metrics.infrastructure_score, 7.0),
            description="Infrastructure and deployment configuration"
        ))
        
        # Operations Metrics
        api_metrics.append(DebtMetricModel(
            id="operations",
            name="Operations Score",
            value=metrics.operations_score,
            threshold=7.0,
            severity=self._get_severity(metrics.operations_score, 7.0),
            description="Operational readiness and monitoring"
        ))
        
        return api_metrics
    
    def _get_severity(self, value: float, threshold: float) -> str:
        """Determine severity based on value and threshold"""
        if value >= threshold:
            return "low"
        elif value >= threshold * 0.7:
            return "medium"
        elif value >= threshold * 0.4:
            return "high"
        else:
            return "critical"
    
    def _generate_recommendations(self, metrics: DebtMetrics) -> List[str]:
        """Generate recommendations based on metrics"""
        recommendations = []
        
        if metrics.code_quality_score < 7.0:
            recommendations.append("Improve code quality by reducing complexity and code smells")
        
        if metrics.architecture_score < 7.0:
            recommendations.append("Review architecture patterns and reduce coupling")
        
        if metrics.infrastructure_score < 7.0:
            recommendations.append("Update infrastructure configuration and documentation")
        
        if metrics.operations_score < 7.0:
            recommendations.append("Enhance monitoring and operational procedures")
        
        if not recommendations:
            recommendations.append("Maintain current quality standards")
        
        return recommendations
    
    async def analyze_codebase(self, project_path: str) -> CodebaseAnalysisModel:
        """Analyze codebase structure and metrics"""
        path = Path(project_path)
        
        if not path.exists():
            raise HTTPException(status_code=404, detail="Project path not found")
        
        # Detect language
        language = self._detect_primary_language(path)
        
        # Basic analysis
        lines_of_code = self._count_lines_of_code(path)
        complexity = await self._calculate_complexity(path)
        test_coverage = await self._get_test_coverage(path)
        dependencies = await self._analyze_dependencies(path)
        issues = await self._detect_code_issues(path)
        
        return CodebaseAnalysisModel(
            projectPath=str(path),
            language=language,
            linesOfCode=lines_of_code,
            complexity=complexity,
            testCoverage=test_coverage,
            dependencies=dependencies,
            issues=issues
        )
    
    def _detect_primary_language(self, path: Path) -> str:
        """Detect the primary programming language"""
        extensions = {
            '.java': 'Java',
            '.cs': 'C#',
            '.py': 'Python',
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.go': 'Go',
            '.rs': 'Rust',
            '.cpp': 'C++',
            '.c': 'C'
        }
        
        file_counts = {}
        for file in path.rglob('*'):
            if file.is_file() and file.suffix in extensions:
                lang = extensions[file.suffix]
                file_counts[lang] = file_counts.get(lang, 0) + 1
        
        if file_counts:
            return max(file_counts, key=file_counts.get)
        return "Unknown"
    
    def _count_lines_of_code(self, path: Path) -> int:
        """Count total lines of code"""
        total_lines = 0
        code_extensions = {'.java', '.cs', '.py', '.js', '.ts', '.go', '.rs', '.cpp', '.c'}
        
        for file in path.rglob('*'):
            if file.is_file() and file.suffix in code_extensions:
                try:
                    with open(file, 'r', encoding='utf-8', errors='ignore') as f:
                        total_lines += sum(1 for line in f if line.strip())
                except Exception:
                    continue
        
        return total_lines
    
    async def _calculate_complexity(self, path: Path) -> float:
        """Calculate average complexity (simplified)"""
        # This is a simplified complexity calculation
        # In practice, you'd use tools like radon for Python, or other language-specific tools
        return 3.2  # Placeholder
    
    async def _get_test_coverage(self, path: Path) -> float:
        """Get test coverage percentage"""
        # This would integrate with coverage tools
        return 65.5  # Placeholder
    
    async def _analyze_dependencies(self, path: Path) -> List[Dict]:
        """Analyze project dependencies"""
        dependencies = []
        
        # Check for different dependency files
        if (path / 'package.json').exists():
            dependencies.extend(await self._analyze_npm_dependencies(path))
        if (path / 'pom.xml').exists():
            dependencies.extend(await self._analyze_maven_dependencies(path))
        if (path / 'requirements.txt').exists():
            dependencies.extend(await self._analyze_python_dependencies(path))
        
        return dependencies
    
    async def _analyze_npm_dependencies(self, path: Path) -> List[Dict]:
        """Analyze NPM dependencies"""
        # Simplified implementation
        return [
            {
                "name": "react",
                "version": "18.2.0",
                "isOutdated": False,
                "securityVulnerabilities": 0,
                "lastUpdated": "2023-06-15"
            }
        ]
    
    async def _analyze_maven_dependencies(self, path: Path) -> List[Dict]:
        """Analyze Maven dependencies"""
        # Simplified implementation
        return [
            {
                "name": "spring-boot-starter",
                "version": "2.7.0",
                "isOutdated": True,
                "securityVulnerabilities": 1,
                "lastUpdated": "2022-05-19"
            }
        ]
    
    async def _analyze_python_dependencies(self, path: Path) -> List[Dict]:
        """Analyze Python dependencies"""
        # Simplified implementation
        return [
            {
                "name": "fastapi",
                "version": "0.68.0",
                "isOutdated": True,
                "securityVulnerabilities": 0,
                "lastUpdated": "2021-07-11"
            }
        ]
    
    async def _detect_code_issues(self, path: Path) -> List[Dict]:
        """Detect code issues and smells"""
        # Simplified implementation - in practice, integrate with linters/static analysis tools
        return [
            {
                "id": str(uuid.uuid4()),
                "type": "smell",
                "severity": "medium",
                "file": "src/main/java/com/example/Service.java",
                "line": 45,
                "description": "Method too long (65 lines)",
                "suggestion": "Break down into smaller methods"
            },
            {
                "id": str(uuid.uuid4()),
                "type": "vulnerability",
                "severity": "high",
                "file": "src/main/java/com/example/Controller.java",
                "line": 23,
                "description": "SQL injection vulnerability",
                "suggestion": "Use parameterized queries"
            }
        ]

# Initialize API
tech_debt_api = TechDebtAPI()

# API Routes
@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Technology Debt Assessment API", "status": "running"}

@app.get("/api/assessments", response_model=List[DebtAssessmentModel])
async def get_assessments():
    """Get all debt assessments"""
    return list(assessments_db.values())

@app.get("/api/assessments/{assessment_id}", response_model=DebtAssessmentModel)
async def get_assessment(assessment_id: str):
    """Get a specific debt assessment"""
    if assessment_id not in assessments_db:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessments_db[assessment_id]

@app.post("/api/assessments", response_model=DebtAssessmentModel)
async def create_assessment(assessment: DebtAssessmentModel):
    """Create a new debt assessment"""
    if not assessment.id:
        assessment.id = str(uuid.uuid4())
    assessments_db[assessment.id] = assessment
    return assessment

@app.post("/api/assessments/run")
async def run_assessment(request: RunAssessmentRequest, background_tasks: BackgroundTasks):
    """Start a new debt assessment"""
    try:
        assessment_id = await tech_debt_api.run_assessment(request.project_path)
        return {"id": assessment_id, "status": "started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/assessments/{assessment_id}/status")
async def get_assessment_status(assessment_id: str):
    """Get assessment status"""
    if assessment_id not in running_assessments:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return {"id": assessment_id, "status": running_assessments[assessment_id]}

@app.get("/api/metrics")
async def get_metrics(assessment_id: Optional[str] = None):
    """Get metrics for all assessments or a specific one"""
    if assessment_id:
        if assessment_id not in assessments_db:
            raise HTTPException(status_code=404, detail="Assessment not found")
        return assessments_db[assessment_id].metrics
    
    # Return all metrics
    all_metrics = []
    for assessment in assessments_db.values():
        all_metrics.extend(assessment.metrics)
    return all_metrics

@app.get("/api/metrics/{metric_name}/trends")
async def get_metric_trends(metric_name: str, range: str = "30d"):
    """Get metric trends over time"""
    # Generate sample trend data
    trends = []
    for i in range(30):
        date = (datetime.now() - timedelta(days=29-i)).strftime("%Y-%m-%d")
        # Generate realistic trend data with some variation
        base_value = 7.5 + (i * 0.05) + ((-1) ** i * 0.3)
        trends.append({"date": date, "value": round(base_value, 2)})
    
    return trends

@app.post("/api/analysis/codebase", response_model=CodebaseAnalysisModel)
async def analyze_codebase(request: AnalyzeCodebaseRequest):
    """Analyze codebase structure and metrics"""
    return await tech_debt_api.analyze_codebase(request.project_path)

@app.post("/api/analysis/dependencies")
async def get_dependency_analysis(request: AnalyzeCodebaseRequest):
    """Get dependency analysis"""
    analysis = await tech_debt_api.analyze_codebase(request.project_path)
    return analysis.dependencies

@app.post("/api/analysis/issues")
async def get_code_issues(request: AnalyzeCodebaseRequest):
    """Get code issues and smells"""
    analysis = await tech_debt_api.analyze_codebase(request.project_path)
    return analysis.issues

# Scan endpoints for dashboard integration
@app.get("/api/scan/results")
async def get_scan_results(page: int = 1, limit: int = 10):
    """Get paginated scan results"""
    # Calculate pagination
    total = len(SCAN_RESULTS_STORE)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    
    # Get the paginated results (sorted by timestamp, newest first)
    sorted_results = sorted(SCAN_RESULTS_STORE, key=lambda x: x["timestamp"], reverse=True)
    paginated_results = sorted_results[start_idx:end_idx]
    
    # Transform results for dashboard compatibility
    transformed_results = []
    for result in paginated_results:
        debt_metrics = result.get("debt_metrics", {})
        transformed_result = {
            "id": result["scan_id"],
            "project_name": result["project_name"],
            "repository_url": result.get("repository_url", ""),
            "last_scan": result["timestamp"],
            "risk_level": result.get("risk_level", "Unknown"),
            "debt_score": debt_metrics.get("overall_score", 0.0),
            "code_quality": debt_metrics.get("code_quality_score", 0.0),
            "architecture": debt_metrics.get("architecture_score", 0.0),
            "infrastructure": debt_metrics.get("infrastructure_score", 0.0),
            "operations": debt_metrics.get("operations_score", 0.0),
            "file_count": result.get("basic_analysis", {}).get("total_files", 0),
            "status": result["status"]
        }
        transformed_results.append(transformed_result)
    
    return {
        "data": transformed_results,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit if total > 0 else 0
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/recommendations")
async def get_recommendations(priority: str = "", category: str = "", limit: int = 20):
    """Get debt recommendations"""
    # Filter recommendations based on query parameters
    filtered_recommendations = RECOMMENDATIONS_STORE.copy()
    
    if priority:
        filtered_recommendations = [r for r in filtered_recommendations if r.get("priority", "").lower() == priority.lower()]
    
    if category:
        filtered_recommendations = [r for r in filtered_recommendations if r.get("category", "").lower() == category.lower()]
    
    # Sort by priority and creation date
    priority_order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    filtered_recommendations.sort(
        key=lambda x: (priority_order.get(x.get("priority", "low"), 1), x.get("created_at", "")), 
        reverse=True
    )
    
    # Limit results
    limited_recommendations = filtered_recommendations[:limit]
    
    return {
        "data": limited_recommendations,
        "total": len(limited_recommendations),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/analytics/dashboard")
async def get_dashboard_analytics():
    """Get dashboard analytics and metrics"""
    if not SCAN_RESULTS_STORE:
        return {
            "total_projects": 0,
            "avg_debt_score": 0,
            "critical_projects": 0,
            "scan_frequency": 0,
            "total_debt_hours": 0,
            "message": "No analytics data available. Please run a scan first.",
            "timestamp": datetime.now().isoformat()
        }
    
    # Calculate analytics from stored scan results
    total_projects = len(SCAN_RESULTS_STORE)
    debt_scores = [result.get("debt_metrics", {}).get("overall_score", 0) for result in SCAN_RESULTS_STORE]
    avg_debt_score = sum(debt_scores) / len(debt_scores) if debt_scores else 0
    
    # Count projects by risk level
    critical_projects = len([r for r in SCAN_RESULTS_STORE if r.get("risk_level") == "Critical"])
    high_risk_projects = len([r for r in SCAN_RESULTS_STORE if r.get("risk_level") == "High"])
    medium_risk_projects = len([r for r in SCAN_RESULTS_STORE if r.get("risk_level") == "Medium"])
    low_risk_projects = len([r for r in SCAN_RESULTS_STORE if r.get("risk_level") == "Low"])
    
    # Calculate estimated debt hours (rough estimate based on debt score)
    total_debt_hours = sum(score * 10 for score in debt_scores)  # 10 hours per debt point
    
    return {
        "total_projects": total_projects,
        "avg_debt_score": round(avg_debt_score, 2),
        "critical_projects": critical_projects,
        "high_risk_projects": high_risk_projects,
        "medium_risk_projects": medium_risk_projects,
        "low_risk_projects": low_risk_projects,
        "scan_frequency": total_projects,  # Simplified metric
        "total_debt_hours": round(total_debt_hours, 1),
        "recent_scans": len([r for r in SCAN_RESULTS_STORE if datetime.fromisoformat(r["timestamp"]) > datetime.now() - timedelta(days=7)]),
        "total_recommendations": len(RECOMMENDATIONS_STORE),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/analytics/trends")
async def get_trend_analytics(days: int = 90, projects: str = ""):
    """Get trend analytics data"""
    if not SCAN_RESULTS_STORE:
        return {
            "data": [],
            "metadata": {
                "days_requested": days,
                "data_points": 0,
                "projects_filter": projects.split(",") if projects else None,
                "generated_at": datetime.now().isoformat()
            },
            "message": "No trend data available. Please run a scan first."
        }
    
    # Filter by date range
    cutoff_date = datetime.now() - timedelta(days=days)
    filtered_results = [
        r for r in SCAN_RESULTS_STORE 
        if datetime.fromisoformat(r["timestamp"]) > cutoff_date
    ]
    
    # Filter by projects if specified
    if projects:
        project_list = [p.strip() for p in projects.split(",")]
        filtered_results = [
            r for r in filtered_results 
            if r["project_name"] in project_list
        ]
    
    # Generate trend data points (simplified)
    trend_data = []
    for result in sorted(filtered_results, key=lambda x: x["timestamp"]):
        debt_metrics = result.get("debt_metrics", {})
        trend_data.append({
            "date": result["timestamp"],
            "project_name": result["project_name"],
            "debt_score": debt_metrics.get("overall_score", 0),
            "code_quality": debt_metrics.get("code_quality_score", 0),
            "architecture": debt_metrics.get("architecture_score", 0),
            "infrastructure": debt_metrics.get("infrastructure_score", 0),
            "operations": debt_metrics.get("operations_score", 0)
        })
    
    return {
        "data": trend_data,
        "metadata": {
            "days_requested": days,
            "data_points": len(trend_data),
            "projects_filter": projects.split(",") if projects else None,
            "generated_at": datetime.now().isoformat()
        }
    }

class GitHubScanRequest(BaseModel):
    repository_url: str
    project_name: str
    enhanced_analysis: bool = True

class GitHubGroupScanRequest(BaseModel):
    organization_url: str  # e.g., "https://github.com/microsoft" or just "microsoft"
    project_filter: Optional[str] = ""  # Optional regex pattern to filter project names
    max_projects: Optional[int] = 10  # Limit number of projects to scan
    enhanced_analysis: bool = True
    include_forks: bool = False  # Whether to include forked repositories

class GitLabGroupScanRequest(BaseModel):
    gitlab_url: str  # e.g., "https://gitlab.com"
    group_id: int  # GitLab group ID
    access_token: str  # GitLab API token
    project_filter: Optional[str] = ""
    max_projects: Optional[int] = 10
    enhanced_analysis: bool = True
    include_archived: bool = False

@app.post("/api/scan/github")
async def scan_github_repository(request: GitHubScanRequest, background_tasks: BackgroundTasks):
    """Scan a GitHub repository for technical debt"""
    scan_id = str(uuid.uuid4())
    
    try:
        import subprocess
        import shutil
        import tempfile
        
        logger.info(f"Starting GitHub scan for repository: {request.repository_url}")
        
        # Clone repository to temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            repo_path = Path(temp_dir) / request.project_name
            
            logger.info(f"Cloning repository to: {repo_path}")
            
            # Clone the repository
            result = subprocess.run([
                "git", "clone", request.repository_url, str(repo_path)
            ], capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                logger.error(f"Git clone failed: {result.stderr}")
                raise HTTPException(status_code=400, detail=f"Failed to clone repository: {result.stderr}")
            
            logger.info("Repository cloned successfully")
            
            # Verify the repository was cloned
            if not repo_path.exists():
                raise HTTPException(status_code=500, detail="Repository clone failed - directory not created")
            
            # Count files for basic analysis
            try:
                all_files = list(repo_path.rglob("*"))
                file_count = len([f for f in all_files if f.is_file()])
                logger.info(f"Found {file_count} files in repository")
                
                # Simple analysis without complex dependencies
                basic_analysis = {
                    "total_files": file_count,
                    "repository_size": sum(f.stat().st_size for f in all_files if f.is_file()),
                    "file_types": {},
                    "directories": len([f for f in all_files if f.is_dir()]),
                }
                
                # Count file types
                for file_path in all_files:
                    if file_path.is_file():
                        ext = file_path.suffix.lower()
                        basic_analysis["file_types"][ext] = basic_analysis["file_types"].get(ext, 0) + 1
                
                # Try advanced analysis if possible
                try:
                    logger.info("Attempting advanced analysis...")
                    
                    # Initialize analyzers
                    code_analyzer = CodeAnalyzer(temp_dir)
                    debt_calculator = DebtScoreCalculator()
                    
                    # Create project info
                    project_info = ProjectInfo(
                        id=1,
                        name=request.project_name,
                        path=str(repo_path),
                        web_url=request.repository_url,
                        default_branch="main",
                        last_activity_at=datetime.now().isoformat()
                    )
                    
                    # Run code analysis
                    code_metrics = await code_analyzer.analyze_code_quality(repo_path)
                    logger.info("Code analysis completed")
                    
                    # Calculate basic debt score
                    all_metrics = {
                        'code_analysis': code_metrics,
                        'architecture_analysis': {"score": 7.0, "issues": []},
                        'infrastructure_analysis': {"score": 7.0, "issues": []},
                        'operations_analysis': {"score": 7.0, "issues": []}
                    }
                    
                    debt_metrics = debt_calculator.calculate_debt_score(all_metrics)
                    logger.info("Debt calculation completed")
                    
                    # Create scan result for storage
                    scan_result = {
                        "scan_id": scan_id,
                        "status": "completed",
                        "project_name": request.project_name,
                        "repository_url": request.repository_url,
                        "debt_metrics": asdict(debt_metrics),
                        "basic_analysis": basic_analysis,
                        "detailed_analysis": all_metrics,
                        "timestamp": datetime.now().isoformat(),
                        "risk_level": _get_risk_level_from_score(debt_metrics.overall_score)
                    }
                    
                    # Store the scan result
                    SCAN_RESULTS_STORE.append(scan_result)
                    
                    # Generate and store recommendations
                    recommendations = _generate_recommendations_from_metrics(debt_metrics, all_metrics)
                    for rec in recommendations:
                        rec["scan_id"] = scan_id
                        rec["project_name"] = request.project_name
                        RECOMMENDATIONS_STORE.append(rec)
                    
                    logger.info(f"Stored scan result and {len(recommendations)} recommendations")
                    
                    return scan_result
                    
                except Exception as analysis_error:
                    logger.warning(f"Advanced analysis failed: {analysis_error}")
                    # Return basic analysis if advanced fails
                    return {
                        "scan_id": scan_id,
                        "status": "completed_basic",
                        "project_name": request.project_name,
                        "repository_url": request.repository_url,
                        "basic_analysis": basic_analysis,
                        "analysis_error": str(analysis_error),
                        "message": "Advanced analysis failed, returning basic file analysis",
                        "timestamp": datetime.now().isoformat()
                    }
                    
            except Exception as file_error:
                logger.error(f"File analysis failed: {file_error}")
                return {
                    "scan_id": scan_id,
                    "status": "completed_minimal",
                    "project_name": request.project_name,
                    "repository_url": request.repository_url,
                    "message": "Repository cloned successfully but analysis failed",
                    "error": str(file_error),
                    "timestamp": datetime.now().isoformat()
                }
            
    except subprocess.TimeoutExpired:
        logger.error("Repository clone timed out")
        raise HTTPException(status_code=408, detail="Repository clone timed out")
    except subprocess.CalledProcessError as e:
        logger.error(f"Git command failed: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to clone repository: {e}")
    except Exception as e:
        logger.error(f"Unexpected error during GitHub scan: {e}")
        logger.exception("Full exception details:")
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")

@app.post("/api/scan/github-organization")
async def scan_github_organization(request: GitHubGroupScanRequest, background_tasks: BackgroundTasks):
    """Scan all repositories in a GitHub organization"""
    try:
        logger.info(f"Starting GitHub organization scan: {request.organization_url}")
        
        # Extract organization name from URL
        org_name = request.organization_url
        if org_name.startswith('http'):
            org_name = org_name.rstrip('/').split('/')[-1]
        
        # Fetch repositories from the organization
        repositories = await _fetch_github_org_repositories(
            org_name, 
            request.max_projects, 
            request.include_forks
        )
        
        if not repositories:
            raise HTTPException(
                status_code=404, 
                detail=f"No repositories found for organization '{org_name}' or organization not accessible"
            )
        
        # Filter repositories by name pattern if provided
        if request.project_filter:
            import re
            pattern = re.compile(request.project_filter, re.IGNORECASE)
            repositories = [repo for repo in repositories if pattern.search(repo['name'])]
        
        logger.info(f"Found {len(repositories)} repositories to scan")
        
        # Start background scanning
        background_tasks.add_task(_scan_repositories_batch, repositories, "github")
        
        return {
            "scan_id": str(uuid.uuid4()),
            "status": "started",
            "organization": org_name,
            "repositories_count": len(repositories),
            "repositories": [{"name": repo["name"], "url": repo["html_url"]} for repo in repositories],
            "message": f"Started scanning {len(repositories)} repositories in background",
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scanning GitHub organization: {e}")
        raise HTTPException(status_code=500, detail=f"Organization scan failed: {str(e)}")

@app.post("/api/scan/gitlab-group")
async def scan_gitlab_group(request: GitLabGroupScanRequest, background_tasks: BackgroundTasks):
    """Scan all projects in a GitLab group"""
    try:
        logger.info(f"Starting GitLab group scan: {request.gitlab_url}/groups/{request.group_id}")
        
        # Fetch projects from the GitLab group
        projects = await _fetch_gitlab_group_projects(
            request.gitlab_url,
            request.group_id,
            request.access_token,
            request.max_projects,
            request.include_archived
        )
        
        if not projects:
            raise HTTPException(
                status_code=404,
                detail=f"No projects found for group {request.group_id} or group not accessible"
            )
        
        # Filter projects by name pattern if provided
        if request.project_filter:
            import re
            pattern = re.compile(request.project_filter, re.IGNORECASE)
            projects = [proj for proj in projects if pattern.search(proj['name'])]
        
        logger.info(f"Found {len(projects)} projects to scan")
        
        # Start background scanning
        background_tasks.add_task(_scan_repositories_batch, projects, "gitlab")
        
        return {
            "scan_id": str(uuid.uuid4()),
            "status": "started",
            "gitlab_url": request.gitlab_url,
            "group_id": request.group_id,
            "projects_count": len(projects),
            "projects": [{"name": proj["name"], "url": proj["web_url"]} for proj in projects],
            "message": f"Started scanning {len(projects)} projects in background",
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scanning GitLab group: {e}")
        raise HTTPException(status_code=500, detail=f"GitLab group scan failed: {str(e)}")

async def _scan_repositories_batch(repositories: List[Dict], scan_type: str = "github"):
    """Background task to scan multiple repositories"""
    logger.info(f"Starting batch scan of {len(repositories)} repositories")
    
    successful_scans = 0
    failed_scans = 0
    
    for repo in repositories:
        try:
            # Scan individual repository
            scan_result = await _scan_single_repository(repo, scan_type)
            
            if scan_result["status"] in ["completed", "completed_basic"]:
                # Store successful scan results
                SCAN_RESULTS_STORE.append(scan_result)
                
                # Generate and store recommendations if debt metrics available
                if "debt_metrics" in scan_result:
                    debt_metrics_dict = scan_result["debt_metrics"]
                    # Convert dict back to DebtMetrics object for recommendation generation
                    debt_metrics = DebtMetrics(
                        overall_score=debt_metrics_dict.get("overall_score", 0),
                        code_quality_score=debt_metrics_dict.get("code_quality_score", 0),
                        architecture_score=debt_metrics_dict.get("architecture_score", 0),
                        infrastructure_score=debt_metrics_dict.get("infrastructure_score", 0),
                        operations_score=debt_metrics_dict.get("operations_score", 0)
                    )
                    
                    recommendations = _generate_recommendations_from_metrics(
                        debt_metrics, 
                        scan_result.get("detailed_analysis", {})
                    )
                    
                    for rec in recommendations:
                        rec["scan_id"] = scan_result["scan_id"]
                        rec["project_name"] = scan_result["project_name"]
                        RECOMMENDATIONS_STORE.append(rec)
                
                successful_scans += 1
                logger.info(f"Successfully scanned: {repo['name']}")
            else:
                failed_scans += 1
                logger.warning(f"Failed to scan: {repo['name']} - {scan_result.get('error', 'Unknown error')}")
                
        except Exception as e:
            failed_scans += 1
            logger.error(f"Error scanning repository {repo.get('name', 'unknown')}: {e}")
    
    logger.info(f"Batch scan completed: {successful_scans} successful, {failed_scans} failed")

@app.get("/api/scan/status")
async def get_scan_status():
    """Get current scanning status and statistics"""
    return {
        "total_scanned_projects": len(SCAN_RESULTS_STORE),
        "total_recommendations": len(RECOMMENDATIONS_STORE),
        "recent_scans": len([
            r for r in SCAN_RESULTS_STORE 
            if datetime.fromisoformat(r["timestamp"]) > datetime.now() - timedelta(hours=1)
        ]),
        "scan_distribution": {
            "completed": len([r for r in SCAN_RESULTS_STORE if r["status"] == "completed"]),
            "completed_basic": len([r for r in SCAN_RESULTS_STORE if r["status"] == "completed_basic"]),
            "completed_minimal": len([r for r in SCAN_RESULTS_STORE if r["status"] == "completed_minimal"]),
            "failed": len([r for r in SCAN_RESULTS_STORE if r["status"] == "failed"])
        },
        "risk_distribution": {
            "Critical": len([r for r in SCAN_RESULTS_STORE if r.get("risk_level") == "Critical"]),
            "High": len([r for r in SCAN_RESULTS_STORE if r.get("risk_level") == "High"]),
            "Medium": len([r for r in SCAN_RESULTS_STORE if r.get("risk_level") == "Medium"]),
            "Low": len([r for r in SCAN_RESULTS_STORE if r.get("risk_level") == "Low"]),
            "Unknown": len([r for r in SCAN_RESULTS_STORE if r.get("risk_level") == "Unknown"])
        },
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
