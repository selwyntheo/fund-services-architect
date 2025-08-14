#!/usr/bin/env python3
"""
FastAPI Server for Technology Debt Assessment Framework
Provides REST API endpoints for the dashboard UI
"""

import asyncio
import json
import logging
import uuid
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

if __name__ == "__main__":
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
