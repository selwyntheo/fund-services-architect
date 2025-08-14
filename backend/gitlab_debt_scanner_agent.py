#!/usr/bin/env python3
"""
GitLab Technical Debt Scanner Agent

This AI agent automatically scans GitLab repositories to assess technical debt
across Code Quality, Architecture, Infrastructure, and Operations dimensions.
"""

import asyncio
import json
import logging
import os
import subprocess
import tempfile
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import aiohttp
import yaml
import git
from concurrent.futures import ThreadPoolExecutor
import statistics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DebtMetrics:
    """Data class to hold debt assessment metrics"""
    code_quality_score: float = 0.0
    architecture_score: float = 0.0
    infrastructure_score: float = 0.0
    operations_score: float = 0.0
    overall_score: float = 0.0
    raw_metrics: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.raw_metrics is None:
            self.raw_metrics = {}

@dataclass
class ProjectInfo:
    """GitLab project information"""
    id: int
    name: str
    path: str
    web_url: str
    default_branch: str
    last_activity_at: str
    languages: Dict[str, float] = None
    
class GitLabAPI:
    """GitLab API client"""
    
    def __init__(self, gitlab_url: str, access_token: str):
        self.gitlab_url = gitlab_url.rstrip('/')
        self.access_token = access_token
        self.headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
    
    async def get_projects(self, group_id: Optional[int] = None) -> List[ProjectInfo]:
        """Fetch all accessible projects or projects in a specific group"""
        url = f"{self.gitlab_url}/api/v4/projects"
        params = {
            'membership': 'true',
            'per_page': 100,
            'order_by': 'last_activity_at',
            'sort': 'desc'
        }
        
        if group_id:
            url = f"{self.gitlab_url}/api/v4/groups/{group_id}/projects"
        
        projects = []
        async with aiohttp.ClientSession() as session:
            page = 1
            while True:
                params['page'] = page
                async with session.get(url, headers=self.headers, params=params) as response:
                    if response.status != 200:
                        logger.error(f"Failed to fetch projects: {response.status}")
                        break
                    
                    data = await response.json()
                    if not data:
                        break
                    
                    for project_data in data:
                        project = ProjectInfo(
                            id=project_data['id'],
                            name=project_data['name'],
                            path=project_data['path_with_namespace'],
                            web_url=project_data['web_url'],
                            default_branch=project_data.get('default_branch', 'main'),
                            last_activity_at=project_data['last_activity_at']
                        )
                        projects.append(project)
                    
                    page += 1
                    if len(data) < 100:  # Last page
                        break
        
        return projects
    
    async def get_project_languages(self, project_id: int) -> Dict[str, float]:
        """Get programming languages used in a project"""
        url = f"{self.gitlab_url}/api/v4/projects/{project_id}/languages"
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers) as response:
                if response.status == 200:
                    return await response.json()
                return {}
    
    async def get_project_commits(self, project_id: int, since_days: int = 90) -> List[Dict]:
        """Get recent commits for a project"""
        since_date = (datetime.now() - timedelta(days=since_days)).isoformat()
        url = f"{self.gitlab_url}/api/v4/projects/{project_id}/repository/commits"
        params = {
            'since': since_date,
            'per_page': 100
        }
        
        commits = []
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers, params=params) as response:
                if response.status == 200:
                    commits = await response.json()
                
        return commits
    
    async def get_project_pipelines(self, project_id: int, limit: int = 50) -> List[Dict]:
        """Get recent CI/CD pipelines for a project"""
        url = f"{self.gitlab_url}/api/v4/projects/{project_id}/pipelines"
        params = {'per_page': limit}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers, params=params) as response:
                if response.status == 200:
                    return await response.json()
                return []

class CodeAnalyzer:
    """Code quality analysis using various tools"""
    
    def __init__(self, temp_dir: str):
        self.temp_dir = Path(temp_dir)
    
    async def analyze_code_quality(self, repo_path: Path) -> Dict[str, Any]:
        """Analyze code quality metrics"""
        metrics = {}
        
        # Basic file analysis
        metrics.update(await self._analyze_file_structure(repo_path))
        
        # Language-specific analysis
        languages = self._detect_languages(repo_path)
        
        if 'Python' in languages:
            metrics.update(await self._analyze_python_code(repo_path))
        
        if 'JavaScript' in languages or 'TypeScript' in languages:
            metrics.update(await self._analyze_javascript_code(repo_path))
        
        if 'Java' in languages:
            metrics.update(await self._analyze_java_code(repo_path))
        
        # Generic complexity analysis
        metrics.update(await self._analyze_complexity(repo_path))
        
        return metrics
    
    async def _analyze_file_structure(self, repo_path: Path) -> Dict[str, Any]:
        """Analyze basic file structure metrics"""
        metrics = {}
        
        # Count files and lines
        total_files = 0
        total_lines = 0
        code_files = 0
        test_files = 0
        config_files = 0
        
        code_extensions = {'.py', '.js', '.ts', '.java', '.cpp', '.c', '.cs', '.rb', '.go', '.php'}
        test_patterns = {'test_', '_test', '.test.', '.spec.', '/tests/', '/test/'}
        config_extensions = {'.yml', '.yaml', '.json', '.xml', '.toml', '.ini', '.cfg'}
        
        for file_path in repo_path.rglob('*'):
            if file_path.is_file() and not any(ignore in str(file_path) for ignore in ['.git', 'node_modules', '__pycache__']):
                total_files += 1
                
                try:
                    if file_path.suffix in code_extensions:
                        code_files += 1
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            lines = len(f.readlines())
                            total_lines += lines
                        
                        # Check if it's a test file
                        if any(pattern in str(file_path).lower() for pattern in test_patterns):
                            test_files += 1
                    
                    elif file_path.suffix in config_extensions:
                        config_files += 1
                
                except Exception as e:
                    logger.debug(f"Error reading file {file_path}: {e}")
        
        metrics.update({
            'total_files': total_files,
            'code_files': code_files,
            'test_files': test_files,
            'config_files': config_files,
            'total_lines_of_code': total_lines,
            'test_to_code_ratio': test_files / max(code_files, 1),
            'avg_lines_per_file': total_lines / max(code_files, 1)
        })
        
        return metrics
    
    def _detect_languages(self, repo_path: Path) -> List[str]:
        """Detect programming languages in the repository"""
        language_extensions = {
            'Python': {'.py'},
            'JavaScript': {'.js', '.jsx'},
            'TypeScript': {'.ts', '.tsx'},
            'Java': {'.java'},
            'C++': {'.cpp', '.cc', '.cxx'},
            'C': {'.c'},
            'C#': {'.cs'},
            'Ruby': {'.rb'},
            'Go': {'.go'},
            'PHP': {'.php'},
            'Rust': {'.rs'},
            'Kotlin': {'.kt'},
            'Swift': {'.swift'}
        }
        
        found_languages = set()
        for file_path in repo_path.rglob('*'):
            if file_path.is_file():
                for language, extensions in language_extensions.items():
                    if file_path.suffix in extensions:
                        found_languages.add(language)
        
        return list(found_languages)
    
    async def _analyze_python_code(self, repo_path: Path) -> Dict[str, Any]:
        """Analyze Python-specific metrics using flake8, pylint, and other tools"""
        metrics = {}
        
        # Try to run flake8
        try:
            result = subprocess.run([
                'flake8', '--statistics', '--count', str(repo_path)
            ], capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                # Parse flake8 output
                lines = result.stdout.strip().split('\n')
                total_issues = 0
                for line in lines:
                    if line and line[0].isdigit():
                        count = int(line.split()[0])
                        total_issues += count
                
                metrics['python_flake8_issues'] = total_issues
        
        except (subprocess.TimeoutExpired, FileNotFoundError) as e:
            logger.debug(f"Flake8 analysis failed: {e}")
            metrics['python_flake8_issues'] = -1
        
        # Analyze imports and dependencies
        requirements_files = list(repo_path.glob('**/requirements*.txt')) + list(repo_path.glob('**/Pipfile*')) + list(repo_path.glob('**/pyproject.toml'))
        metrics['python_dependency_files'] = len(requirements_files)
        
        return metrics
    
    async def _analyze_javascript_code(self, repo_path: Path) -> Dict[str, Any]:
        """Analyze JavaScript/TypeScript metrics"""
        metrics = {}
        
        # Check for package.json
        package_json = repo_path / 'package.json'
        if package_json.exists():
            try:
                with open(package_json) as f:
                    package_data = json.load(f)
                    deps = len(package_data.get('dependencies', {}))
                    dev_deps = len(package_data.get('devDependencies', {}))
                    metrics['js_dependencies'] = deps
                    metrics['js_dev_dependencies'] = dev_deps
                    metrics['js_has_scripts'] = len(package_data.get('scripts', {})) > 0
            except Exception as e:
                logger.debug(f"Error parsing package.json: {e}")
        
        # Check for common config files
        config_files = ['eslint', 'prettier', 'jest', 'webpack', 'babel']
        for config in config_files:
            config_exists = any(repo_path.glob(f'**/{config}*'))
            metrics[f'js_has_{config}_config'] = config_exists
        
        return metrics
    
    async def _analyze_java_code(self, repo_path: Path) -> Dict[str, Any]:
        """Analyze Java-specific metrics"""
        metrics = {}
        
        # Check for build files
        has_maven = (repo_path / 'pom.xml').exists()
        has_gradle = any(repo_path.glob('**/build.gradle*'))
        
        metrics['java_has_maven'] = has_maven
        metrics['java_has_gradle'] = has_gradle
        metrics['java_has_build_system'] = has_maven or has_gradle
        
        return metrics
    
    async def _analyze_complexity(self, repo_path: Path) -> Dict[str, Any]:
        """Analyze code complexity using generic metrics"""
        metrics = {}
        
        # File and directory analysis
        max_file_size = 0
        large_files_count = 0
        deep_nesting_count = 0
        
        for file_path in repo_path.rglob('*'):
            if file_path.is_file() and file_path.suffix in {'.py', '.js', '.java', '.cpp', '.c'}:
                try:
                    size = file_path.stat().st_size
                    max_file_size = max(max_file_size, size)
                    
                    if size > 10000:  # Files larger than 10KB
                        large_files_count += 1
                    
                    # Simple nesting analysis
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        max_nesting = self._calculate_max_nesting(content)
                        if max_nesting > 5:
                            deep_nesting_count += 1
                
                except Exception as e:
                    logger.debug(f"Error analyzing file {file_path}: {e}")
        
        metrics.update({
            'max_file_size_bytes': max_file_size,
            'large_files_count': large_files_count,
            'deep_nesting_files': deep_nesting_count
        })
        
        return metrics
    
    def _calculate_max_nesting(self, content: str) -> int:
        """Calculate maximum nesting depth in code"""
        lines = content.split('\n')
        max_depth = 0
        current_depth = 0
        
        for line in lines:
            stripped = line.strip()
            if not stripped or stripped.startswith('#') or stripped.startswith('//'):
                continue
            
            # Count opening braces/blocks
            opens = line.count('{') + line.count('if ') + line.count('for ') + line.count('while ')
            closes = line.count('}')
            
            current_depth += opens - closes
            max_depth = max(max_depth, current_depth)
            current_depth = max(0, current_depth)  # Don't go negative
        
        return max_depth

class ArchitectureAnalyzer:
    """Architecture analysis for design patterns and structure"""
    
    def __init__(self):
        pass
    
    async def analyze_architecture(self, repo_path: Path, languages: List[str]) -> Dict[str, Any]:
        """Analyze architectural patterns and structure"""
        metrics = {}
        
        # Directory structure analysis
        metrics.update(await self._analyze_directory_structure(repo_path))
        
        # Configuration analysis
        metrics.update(await self._analyze_configuration(repo_path))
        
        # API and interface analysis
        metrics.update(await self._analyze_apis(repo_path, languages))
        
        # Documentation analysis
        metrics.update(await self._analyze_documentation(repo_path))
        
        return metrics
    
    async def _analyze_directory_structure(self, repo_path: Path) -> Dict[str, Any]:
        """Analyze directory structure for architectural patterns"""
        metrics = {}
        
        # Count directory depth
        max_depth = 0
        total_dirs = 0
        
        for path in repo_path.rglob('*'):
            if path.is_dir() and '.git' not in str(path):
                depth = len(path.relative_to(repo_path).parts)
                max_depth = max(max_depth, depth)
                total_dirs += 1
        
        # Check for common architectural patterns
        common_patterns = {
            'mvc': ['models', 'views', 'controllers'],
            'layered': ['service', 'repository', 'controller', 'entity'],
            'microservices': ['services', 'api', 'gateway'],
            'clean_architecture': ['domain', 'application', 'infrastructure']
        }
        
        found_patterns = {}
        for pattern_name, pattern_dirs in common_patterns.items():
            matches = 0
            for pattern_dir in pattern_dirs:
                if any(pattern_dir in str(p).lower() for p in repo_path.rglob('*') if p.is_dir()):
                    matches += 1
            found_patterns[f'has_{pattern_name}_pattern'] = matches >= 2
        
        metrics.update({
            'max_directory_depth': max_depth,
            'total_directories': total_dirs,
            **found_patterns
        })
        
        return metrics
    
    async def _analyze_configuration(self, repo_path: Path) -> Dict[str, Any]:
        """Analyze configuration management"""
        metrics = {}
        
        # Check for different types of configuration
        config_types = {
            'docker': ['Dockerfile', 'docker-compose.yml', '.dockerignore'],
            'kubernetes': ['*.yaml', '*.yml', 'kustomization.yaml'],
            'terraform': ['*.tf', '*.tfvars'],
            'ansible': ['playbook.yml', 'inventory.ini', '*.yaml'],
            'environment': ['.env*', 'config.json', 'settings.yml']
        }
        
        for config_type, patterns in config_types.items():
            found = False
            for pattern in patterns:
                if list(repo_path.glob(f'**/{pattern}')):
                    found = True
                    break
            metrics[f'has_{config_type}_config'] = found
        
        # Count configuration files
        config_files = list(repo_path.glob('**/*.yml')) + list(repo_path.glob('**/*.yaml')) + \
                      list(repo_path.glob('**/*.json')) + list(repo_path.glob('**/*.toml'))
        metrics['total_config_files'] = len(config_files)
        
        return metrics
    
    async def _analyze_apis(self, repo_path: Path, languages: List[str]) -> Dict[str, Any]:
        """Analyze API design and interfaces"""
        metrics = {}
        
        # Look for API specification files
        api_specs = list(repo_path.glob('**/openapi.yml')) + list(repo_path.glob('**/swagger.yml')) + \
                   list(repo_path.glob('**/*.proto')) + list(repo_path.glob('**/api.yml'))
        
        metrics['has_api_specifications'] = len(api_specs) > 0
        metrics['api_specification_count'] = len(api_specs)
        
        # Check for REST patterns in common frameworks
        if 'Python' in languages:
            has_flask = any('flask' in str(f).lower() for f in repo_path.rglob('*.py'))
            has_django = any('django' in str(f).lower() for f in repo_path.rglob('*.py'))
            has_fastapi = any('fastapi' in str(f).lower() for f in repo_path.rglob('*.py'))
            metrics['python_web_framework'] = has_flask or has_django or has_fastapi
        
        return metrics
    
    async def _analyze_documentation(self, repo_path: Path) -> Dict[str, Any]:
        """Analyze documentation quality"""
        metrics = {}
        
        # Check for common documentation files
        doc_files = ['README.md', 'README.rst', 'README.txt', 'CHANGELOG.md', 'CONTRIBUTING.md']
        found_docs = []
        
        for doc_file in doc_files:
            if (repo_path / doc_file).exists():
                found_docs.append(doc_file)
                # Analyze README length if it exists
                if doc_file.startswith('README'):
                    try:
                        content = (repo_path / doc_file).read_text(encoding='utf-8', errors='ignore')
                        metrics['readme_length'] = len(content)
                        metrics['readme_has_sections'] = len([line for line in content.split('\n') if line.startswith('#')]) > 3
                    except Exception:
                        pass
        
        metrics['documentation_files'] = len(found_docs)
        metrics['has_readme'] = any('README' in doc for doc in found_docs)
        
        # Check for inline documentation
        code_files = list(repo_path.glob('**/*.py')) + list(repo_path.glob('**/*.js')) + list(repo_path.glob('**/*.java'))
        
        if code_files:
            documented_files = 0
            for code_file in code_files[:50]:  # Sample first 50 files
                try:
                    content = code_file.read_text(encoding='utf-8', errors='ignore')
                    # Simple heuristic for documentation
                    if '"""' in content or '/*' in content or content.count('#') > 5:
                        documented_files += 1
                except Exception:
                    pass
            
            metrics['code_documentation_ratio'] = documented_files / len(code_files[:50])
        
        return metrics

class InfrastructureAnalyzer:
    """Infrastructure and DevOps analysis"""
    
    async def analyze_infrastructure(self, repo_path: Path, project_info: ProjectInfo, 
                                   pipelines: List[Dict]) -> Dict[str, Any]:
        """Analyze infrastructure setup and DevOps maturity"""
        metrics = {}
        
        # CI/CD Analysis
        metrics.update(await self._analyze_cicd(repo_path, pipelines))
        
        # Security Analysis
        metrics.update(await self._analyze_security(repo_path))
        
        # Deployment Analysis
        metrics.update(await self._analyze_deployment(repo_path))
        
        # Monitoring and Observability
        metrics.update(await self._analyze_monitoring(repo_path))
        
        return metrics
    
    async def _analyze_cicd(self, repo_path: Path, pipelines: List[Dict]) -> Dict[str, Any]:
        """Analyze CI/CD setup"""
        metrics = {}
        
        # Check for CI/CD configuration files
        ci_files = list(repo_path.glob('.gitlab-ci.yml')) + list(repo_path.glob('.github/workflows/*.yml')) + \
                  list(repo_path.glob('Jenkinsfile')) + list(repo_path.glob('.travis.yml'))
        
        metrics['has_cicd_config'] = len(ci_files) > 0
        metrics['cicd_config_count'] = len(ci_files)
        
        # Analyze pipeline success rate
        if pipelines:
            successful = sum(1 for p in pipelines if p.get('status') == 'success')
            failed = sum(1 for p in pipelines if p.get('status') == 'failed')
            total = len(pipelines)
            
            metrics['pipeline_success_rate'] = successful / max(total, 1)
            metrics['pipeline_failure_rate'] = failed / max(total, 1)
            metrics['recent_pipeline_count'] = total
            
            # Calculate average pipeline duration (if available)
            durations = []
            for pipeline in pipelines:
                if 'duration' in pipeline and pipeline['duration']:
                    durations.append(pipeline['duration'])
            
            if durations:
                metrics['avg_pipeline_duration'] = statistics.mean(durations)
        
        return metrics
    
    async def _analyze_security(self, repo_path: Path) -> Dict[str, Any]:
        """Analyze security configurations"""
        metrics = {}
        
        # Check for security-related files
        security_files = {
            'SECURITY.md': 'security_policy',
            '.gitignore': 'gitignore',
            'requirements.txt': 'python_deps',
            'package-lock.json': 'npm_lockfile',
            'Gemfile.lock': 'ruby_lockfile'
        }
        
        for file_name, metric_name in security_files.items():
            metrics[f'has_{metric_name}'] = (repo_path / file_name).exists()
        
        # Check for secrets or sensitive data patterns (basic check)
        sensitive_patterns = ['password', 'secret', 'key', 'token', 'api_key']
        config_files = list(repo_path.glob('**/*.yml')) + list(repo_path.glob('**/*.yaml')) + \
                      list(repo_path.glob('**/*.json')) + list(repo_path.glob('**/.env*'))
        
        potential_secrets_found = 0
        for config_file in config_files:
            try:
                content = config_file.read_text(encoding='utf-8', errors='ignore').lower()
                for pattern in sensitive_patterns:
                    if pattern in content and '=' in content:
                        potential_secrets_found += 1
                        break
            except Exception:
                pass
        
        metrics['potential_hardcoded_secrets'] = potential_secrets_found
        
        return metrics
    
    async def _analyze_deployment(self, repo_path: Path) -> Dict[str, Any]:
        """Analyze deployment configurations"""
        metrics = {}
        
        # Check for containerization
        has_dockerfile = (repo_path / 'Dockerfile').exists()
        has_docker_compose = any(repo_path.glob('**/docker-compose*.yml'))
        
        metrics['has_dockerfile'] = has_dockerfile
        metrics['has_docker_compose'] = has_docker_compose
        metrics['is_containerized'] = has_dockerfile or has_docker_compose
        
        # Check for cloud deployment configs
        cloud_configs = {
            'kubernetes': ['*.yaml', '*.yml', 'kustomization.yaml'],
            'helm': ['Chart.yaml', 'values.yaml'],
            'terraform': ['*.tf'],
            'cloudformation': ['*.template', '*.yaml'],
            'serverless': ['serverless.yml', 'serverless.yaml']
        }
        
        for cloud_type, patterns in cloud_configs.items():
            found = any(list(repo_path.glob(f'**/{pattern}')) for pattern in patterns)
            metrics[f'has_{cloud_type}_config'] = found
        
        return metrics
    
    async def _analyze_monitoring(self, repo_path: Path) -> Dict[str, Any]:
        """Analyze monitoring and observability setup"""
        metrics = {}
        
        # Check for monitoring configurations
        monitoring_files = {
            'prometheus': ['prometheus.yml', 'alert*.yml'],
            'grafana': ['grafana.ini', '*.json'],
            'elasticsearch': ['elasticsearch.yml'],
            'logstash': ['logstash.conf', '*.conf'],
            'kibana': ['kibana.yml']
        }
        
        for monitor_type, patterns in monitoring_files.items():
            found = any(list(repo_path.glob(f'**/{pattern}')) for pattern in patterns)
            metrics[f'has_{monitor_type}_config'] = found
        
        # Check for logging libraries usage (basic check)
        code_files = list(repo_path.glob('**/*.py')) + list(repo_path.glob('**/*.js')) + list(repo_path.glob('**/*.java'))
        
        if code_files:
            logging_usage = 0
            for code_file in code_files[:20]:  # Sample
                try:
                    content = code_file.read_text(encoding='utf-8', errors='ignore')
                    if any(pattern in content.lower() for pattern in ['import logging', 'console.log', 'logger.', 'log4j']):
                        logging_usage += 1
                except Exception:
                    pass
            
            metrics['logging_usage_ratio'] = logging_usage / len(code_files[:20])
        
        return metrics

class OperationalAnalyzer:
    """Operational metrics analysis"""
    
    async def analyze_operations(self, repo_path: Path, project_info: ProjectInfo,
                               commits: List[Dict], pipelines: List[Dict]) -> Dict[str, Any]:
        """Analyze operational metrics and practices"""
        metrics = {}
        
        # Development velocity analysis
        metrics.update(await self._analyze_development_velocity(commits))
        
        # Release and deployment frequency
        metrics.update(await self._analyze_release_patterns(pipelines, commits))
        
        # Team collaboration metrics
        metrics.update(await self._analyze_team_collaboration(commits))
        
        # Maintenance indicators
        metrics.update(await self._analyze_maintenance_patterns(commits))
        
        return metrics
    
    async def _analyze_development_velocity(self, commits: List[Dict]) -> Dict[str, Any]:
        """Analyze development velocity and activity"""
        metrics = {}
        
        if not commits:
            return {'commits_per_week': 0, 'avg_commit_size': 0}
        
        # Calculate commits per week
        if commits:
            # Assuming commits are from last 90 days
            commits_per_week = len(commits) / (90 / 7)
            metrics['commits_per_week'] = commits_per_week
        
        # Analyze commit messages
        commit_types = {'fix': 0, 'feat': 0, 'refactor': 0, 'test': 0, 'docs': 0, 'chore': 0}
        
        for commit in commits:
            message = commit.get('message', '').lower()
            for commit_type in commit_types.keys():
                if commit_type in message or f'{commit_type}:' in message:
                    commit_types[commit_type] += 1
                    break
        
        total_commits = len(commits)
        if total_commits > 0:
            metrics['fix_commit_ratio'] = commit_types['fix'] / total_commits
            metrics['feature_commit_ratio'] = commit_types['feat'] / total_commits
            metrics['refactor_commit_ratio'] = commit_types['refactor'] / total_commits
        
        return metrics
    
    async def _analyze_release_patterns(self, pipelines: List[Dict], commits: List[Dict]) -> Dict[str, Any]:
        """Analyze release and deployment patterns"""
        metrics = {}
        
        # Deployment frequency based on successful pipelines
        if pipelines:
            successful_pipelines = [p for p in pipelines if p.get('status') == 'success']
            if successful_pipelines:
                # Assuming pipelines from last 30 days
                deployments_per_week = len(successful_pipelines) / 4
                metrics['deployments_per_week'] = deployments_per_week
                
                # Check if deployments are regular
                pipeline_dates = []
                for pipeline in successful_pipelines:
                    if 'created_at' in pipeline:
                        try:
                            date = datetime.fromisoformat(pipeline['created_at'].replace('Z', '+00:00'))
                            pipeline_dates.append(date)
                        except Exception:
                            pass
                
                if len(pipeline_dates) > 1:
                    pipeline_dates.sort()
                    intervals = []
                    for i in range(1, len(pipeline_dates)):
                        interval = (pipeline_dates[i] - pipeline_dates[i-1]).days
                        intervals.append(interval)
                    
                    if intervals:
                        metrics['avg_deployment_interval_days'] = statistics.mean(intervals)
                        metrics['deployment_regularity'] = statistics.stdev(intervals) if len(intervals) > 1 else 0
        
        return metrics
    
    async def _analyze_team_collaboration(self, commits: List[Dict]) -> Dict[str, Any]:
        """Analyze team collaboration patterns"""
        metrics = {}
        
        if not commits:
            return metrics
        
        # Count unique contributors
        contributors = set()
        for commit in commits:
            if 'author_email' in commit:
                contributors.add(commit['author_email'])
        
        metrics['unique_contributors'] = len(contributors)
        
        # Calculate contribution distribution
        if len(contributors) > 1:
            contributor_commits = {}
            for commit in commits:
                email = commit.get('author_email', 'unknown')
                contributor_commits[email] = contributor_commits.get(email, 0) + 1
            
            commit_counts = list(contributor_commits.values())
            if len(commit_counts) > 1:
                # Calculate Gini coefficient for contribution inequality
                commit_counts.sort()
                n = len(commit_counts)
                cumsum = sum((2 * i + 1) * commit_counts[i] for i in range(n))
                gini = cumsum / (n * sum(commit_counts)) - (n + 1) / n
                metrics['contribution_gini_coefficient'] = gini
        
        return metrics
    
    async def _analyze_maintenance_patterns(self, commits: List[Dict]) -> Dict[str, Any]:
        """Analyze maintenance vs feature development patterns"""
        metrics = {}
        
        if not commits:
            return metrics
        
        # Categorize commits
        maintenance_keywords = ['fix', 'bug', 'patch', 'hotfix', 'security', 'update', 'upgrade']
        feature_keywords = ['feat', 'feature', 'add', 'implement', 'new']
        refactor_keywords = ['refactor', 'cleanup', 'improve', 'optimize', 'restructure']
        
        maintenance_commits = 0
        feature_commits = 0
        refactor_commits = 0
        
        for commit in commits:
            message = commit.get('message', '').lower()
            
            if any(keyword in message for keyword in maintenance_keywords):
                maintenance_commits += 1
            elif any(keyword in message for keyword in feature_keywords):
                feature_commits += 1
            elif any(keyword in message for keyword in refactor_keywords):
                refactor_commits += 1
        
        total = len(commits)
        if total > 0:
            metrics['maintenance_commit_percentage'] = (maintenance_commits / total) * 100
            metrics['feature_commit_percentage'] = (feature_commits / total) * 100
            metrics['refactor_commit_percentage'] = (refactor_commits / total) * 100
        
        return metrics

class DebtScoreCalculator:
    """Calculate debt scores based on collected metrics"""
    
    def __init__(self):
        # Weights for different categories
        self.weights = {
            'code_quality': 0.25,
            'architecture': 0.30,
            'infrastructure': 0.25,
            'operations': 0.20
        }
    
    def calculate_debt_score(self, metrics: Dict[str, Any]) -> DebtMetrics:
        """Calculate overall debt score from metrics"""
        
        # Calculate individual category scores
        code_score = self._calculate_code_quality_score(metrics.get('code_analysis', {}))
        arch_score = self._calculate_architecture_score(metrics.get('architecture_analysis', {}))
        infra_score = self._calculate_infrastructure_score(metrics.get('infrastructure_analysis', {}))
        ops_score = self._calculate_operations_score(metrics.get('operations_analysis', {}))
        
        # Calculate weighted overall score
        overall_score = (
            code_score * self.weights['code_quality'] +
            arch_score * self.weights['architecture'] +
            infra_score * self.weights['infrastructure'] +
            ops_score * self.weights['operations']
        )
        
        return DebtMetrics(
            code_quality_score=code_score,
            architecture_score=arch_score,
            infrastructure_score=infra_score,
            operations_score=ops_score,
            overall_score=overall_score,
            raw_metrics=metrics
        )
    
    def _calculate_code_quality_score(self, metrics: Dict[str, Any]) -> float:
        """Calculate code quality debt score (0-4, higher is worse)"""
        score = 0.0
        
        # Test coverage penalty
        test_ratio = metrics.get('test_to_code_ratio', 0)
        if test_ratio < 0.1:
            score += 1.5
        elif test_ratio < 0.3:
            score += 1.0
        elif test_ratio < 0.5:
            score += 0.5
        
        # File size penalty
        avg_lines = metrics.get('avg_lines_per_file', 0)
        if avg_lines > 500:
            score += 1.0
        elif avg_lines > 300:
            score += 0.5
        
        # Large files penalty
        large_files = metrics.get('large_files_count', 0)
        total_files = max(metrics.get('code_files', 1), 1)
        large_file_ratio = large_files / total_files
        if large_file_ratio > 0.3:
            score += 1.0
        elif large_file_ratio > 0.1:
            score += 0.5
        
        # Deep nesting penalty
        deep_nesting = metrics.get('deep_nesting_files', 0)
        deep_nesting_ratio = deep_nesting / total_files
        if deep_nesting_ratio > 0.2:
            score += 0.5
        
        # Language-specific penalties
        if 'python_flake8_issues' in metrics and metrics['python_flake8_issues'] > 0:
            issues_per_file = metrics['python_flake8_issues'] / total_files
            if issues_per_file > 5:
                score += 1.0
            elif issues_per_file > 2:
                score += 0.5
        
        # Documentation penalty
        doc_ratio = metrics.get('code_documentation_ratio', 1.0)
        if doc_ratio < 0.2:
            score += 1.0
        elif doc_ratio < 0.5:
            score += 0.5
        
        return min(score, 4.0)
    
    def _calculate_architecture_score(self, metrics: Dict[str, Any]) -> float:
        """Calculate architecture debt score (0-4, higher is worse)"""
        score = 0.0
        
        # Directory depth penalty
        max_depth = metrics.get('max_directory_depth', 0)
        if max_depth > 8:
            score += 1.0
        elif max_depth > 6:
            score += 0.5
        
        # Lack of architectural patterns
        patterns = ['has_mvc_pattern', 'has_layered_pattern', 'has_microservices_pattern', 'has_clean_architecture_pattern']
        has_pattern = any(metrics.get(pattern, False) for pattern in patterns)
        if not has_pattern:
            score += 1.0
        
        # Configuration management
        if not metrics.get('has_docker_config', False) and not metrics.get('has_kubernetes_config', False):
            score += 0.5
        
        # API documentation
        if not metrics.get('has_api_specifications', False):
            score += 0.5
        
        # Documentation quality
        if not metrics.get('has_readme', False):
            score += 1.0
        elif metrics.get('readme_length', 0) < 500:
            score += 0.5
        
        if metrics.get('documentation_files', 0) < 2:
            score += 0.5
        
        return min(score, 4.0)
    
    def _calculate_infrastructure_score(self, metrics: Dict[str, Any]) -> float:
        """Calculate infrastructure debt score (0-4, higher is worse)"""
        score = 0.0
        
        # CI/CD setup
        if not metrics.get('has_cicd_config', False):
            score += 2.0
        else:
            # Pipeline success rate
            success_rate = metrics.get('pipeline_success_rate', 1.0)
            if success_rate < 0.7:
                score += 1.5
            elif success_rate < 0.9:
                score += 0.5
        
        # Security issues
        potential_secrets = metrics.get('potential_hardcoded_secrets', 0)
        if potential_secrets > 0:
            score += min(potential_secrets * 0.5, 2.0)
        
        if not metrics.get('has_gitignore', False):
            score += 0.5
        
        # Containerization
        if not metrics.get('is_containerized', False):
            score += 1.0
        
        # Monitoring setup
        monitoring_configs = ['has_prometheus_config', 'has_grafana_config', 'has_elasticsearch_config']
        has_monitoring = any(metrics.get(config, False) for config in monitoring_configs)
        if not has_monitoring:
            score += 1.0
        
        logging_ratio = metrics.get('logging_usage_ratio', 0)
        if logging_ratio < 0.3:
            score += 0.5
        
        return min(score, 4.0)
    
    def _calculate_operations_score(self, metrics: Dict[str, Any]) -> float:
        """Calculate operations debt score (0-4, higher is worse)"""
        score = 0.0
        
        # Development velocity
        commits_per_week = metrics.get('commits_per_week', 0)
        if commits_per_week < 1:
            score += 1.5
        elif commits_per_week < 3:
            score += 0.5
        
        # Deployment frequency
        deployments_per_week = metrics.get('deployments_per_week', 0)
        if deployments_per_week < 0.25:  # Less than once per month
            score += 1.5
        elif deployments_per_week < 1:  # Less than once per week
            score += 1.0
        
        # Maintenance burden
        maintenance_percentage = metrics.get('maintenance_commit_percentage', 0)
        if maintenance_percentage > 60:
            score += 1.5
        elif maintenance_percentage > 40:
            score += 1.0
        elif maintenance_percentage > 70:
            score += 2.0
        
        # Team collaboration
        contributors = metrics.get('unique_contributors', 1)
        if contributors == 1:
            score += 1.0  # Single contributor risk
        
        gini = metrics.get('contribution_gini_coefficient', 0)
        if gini > 0.8:  # Very unequal contribution
            score += 0.5
        
        # Deployment regularity
        deployment_regularity = metrics.get('deployment_regularity', 0)
        if deployment_regularity > 14:  # Very irregular deployments
            score += 0.5
        
        return min(score, 4.0)

class GitLabDebtScannerAgent:
    """Main AI agent for scanning GitLab repositories"""
    
    def __init__(self, gitlab_url: str, access_token: str):
        self.gitlab_api = GitLabAPI(gitlab_url, access_token)
        self.debt_calculator = DebtScoreCalculator()
        self.executor = ThreadPoolExecutor(max_workers=4)
    
    async def scan_projects(self, group_id: Optional[int] = None, 
                          project_filters: Optional[Dict] = None) -> List[Dict]:
        """Scan multiple projects and return debt assessments"""
        
        logger.info("Fetching projects from GitLab...")
        projects = await self.gitlab_api.get_projects(group_id)
        
        if project_filters:
            projects = self._filter_projects(projects, project_filters)
        
        logger.info(f"Found {len(projects)} projects to analyze")
        
        results = []
        for project in projects:
            try:
                logger.info(f"Analyzing project: {project.name}")
                debt_metrics = await self.scan_single_project(project)
                
                result = {
                    'project_info': asdict(project),
                    'debt_metrics': asdict(debt_metrics),
                    'scan_timestamp': datetime.now().isoformat(),
                    'risk_level': self._get_risk_level(debt_metrics.overall_score)
                }
                results.append(result)
                
            except Exception as e:
                logger.error(f"Error analyzing project {project.name}: {e}")
                results.append({
                    'project_info': asdict(project),
                    'error': str(e),
                    'scan_timestamp': datetime.now().isoformat()
                })
        
        return results
    
    async def scan_single_project(self, project: ProjectInfo) -> DebtMetrics:
        """Scan a single project and return debt metrics"""
        
        with tempfile.TemporaryDirectory() as temp_dir:
            repo_path = Path(temp_dir) / project.name
            
            # Clone repository
            logger.info(f"Cloning repository: {project.web_url}")
            repo_url = project.web_url.replace('https://', f'https://gitlab-ci-token:{self.gitlab_api.access_token}@')
            
            try:
                git.Repo.clone_from(repo_url, repo_path, depth=1)
            except Exception as e:
                logger.error(f"Failed to clone repository {project.name}: {e}")
                raise
            
            # Gather additional project data
            languages = await self.gitlab_api.get_project_languages(project.id)
            commits = await self.gitlab_api.get_project_commits(project.id)
            pipelines = await self.gitlab_api.get_project_pipelines(project.id)
            
            # Run analysis
            analyzers = {
                'code_analysis': CodeAnalyzer(temp_dir),
                'architecture_analysis': ArchitectureAnalyzer(),
                'infrastructure_analysis': InfrastructureAnalyzer(),
                'operations_analysis': OperationalAnalyzer()
            }
            
            all_metrics = {}
            
            # Code quality analysis
            code_analyzer = CodeAnalyzer(temp_dir)
            all_metrics['code_analysis'] = await code_analyzer.analyze_code_quality(repo_path)
            
            # Architecture analysis
            arch_analyzer = ArchitectureAnalyzer()
            detected_languages = code_analyzer._detect_languages(repo_path)
            all_metrics['architecture_analysis'] = await arch_analyzer.analyze_architecture(repo_path, detected_languages)
            
            # Infrastructure analysis
            infra_analyzer = InfrastructureAnalyzer()
            all_metrics['infrastructure_analysis'] = await infra_analyzer.analyze_infrastructure(repo_path, project, pipelines)
            
            # Operations analysis
            ops_analyzer = OperationalAnalyzer()
            all_metrics['operations_analysis'] = await ops_analyzer.analyze_operations(repo_path, project, commits, pipelines)
            
            # Calculate debt score
            debt_metrics = self.debt_calculator.calculate_debt_score(all_metrics)
            
            return debt_metrics
    
    def _filter_projects(self, projects: List[ProjectInfo], filters: Dict) -> List[ProjectInfo]:
        """Filter projects based on criteria"""
        filtered = projects
        
        if 'last_activity_days' in filters:
            cutoff_date = datetime.now() - timedelta(days=filters['last_activity_days'])
            filtered = [p for p in filtered if datetime.fromisoformat(p.last_activity_at.replace('Z', '+00:00')) > cutoff_date]
        
        if 'name_pattern' in filters:
            import re
            pattern = re.compile(filters['name_pattern'], re.IGNORECASE)
            filtered = [p for p in filtered if pattern.search(p.name)]
        
        if 'max_projects' in filters:
            filtered = filtered[:filters['max_projects']]
        
        return filtered
    
    def _get_risk_level(self, score: float) -> str:
        """Convert debt score to risk level"""
        if score <= 1.0:
            return 'Low'
        elif score <= 2.0:
            return 'Medium'
        elif score <= 3.0:
            return 'High'
        else:
            return 'Critical'
    
    async def generate_report(self, results: List[Dict], output_path: str = None) -> str:
        """Generate a comprehensive debt assessment report"""
        
        report = {
            'scan_summary': {
                'total_projects': len(results),
                'successful_scans': len([r for r in results if 'debt_metrics' in r]),
                'failed_scans': len([r for r in results if 'error' in r]),
                'scan_date': datetime.now().isoformat()
            },
            'risk_distribution': {},
            'top_debt_projects': [],
            'recommendations': [],
            'detailed_results': results
        }
        
        # Calculate risk distribution
        successful_results = [r for r in results if 'debt_metrics' in r]
        risk_counts = {'Low': 0, 'Medium': 0, 'High': 0, 'Critical': 0}
        
        for result in successful_results:
            risk_level = result.get('risk_level', 'Unknown')
            if risk_level in risk_counts:
                risk_counts[risk_level] += 1
        
        report['risk_distribution'] = risk_counts
        
        # Top debt projects
        debt_projects = [(r['project_info']['name'], r['debt_metrics']['overall_score'], r['risk_level']) 
                        for r in successful_results]
        debt_projects.sort(key=lambda x: x[1], reverse=True)
        report['top_debt_projects'] = debt_projects[:10]
        
        # Generate recommendations
        report['recommendations'] = self._generate_recommendations(successful_results)
        
        # Save report if output path provided
        if output_path:
            with open(output_path, 'w') as f:
                json.dump(report, f, indent=2)
            logger.info(f"Report saved to {output_path}")
        
        return json.dumps(report, indent=2)
    
    def _generate_recommendations(self, results: List[Dict]) -> List[str]:
        """Generate actionable recommendations based on scan results"""
        recommendations = []
        
        if not results:
            return recommendations
        
        # Count common issues
        total_projects = len(results)
        no_cicd = sum(1 for r in results if not r['debt_metrics']['raw_metrics']['infrastructure_analysis'].get('has_cicd_config', False))
        no_tests = sum(1 for r in results if r['debt_metrics']['raw_metrics']['code_analysis'].get('test_to_code_ratio', 0) < 0.1)
        no_docs = sum(1 for r in results if not r['debt_metrics']['raw_metrics']['architecture_analysis'].get('has_readme', False))
        no_containers = sum(1 for r in results if not r['debt_metrics']['raw_metrics']['infrastructure_analysis'].get('is_containerized', False))
        
        if no_cicd / total_projects > 0.5:
            recommendations.append(f"Critical: {no_cicd}/{total_projects} projects lack CI/CD configuration. Implement GitLab CI/CD pipelines.")
        
        if no_tests / total_projects > 0.7:
            recommendations.append(f"High Priority: {no_tests}/{total_projects} projects have insufficient test coverage (<10%). Establish testing standards.")
        
        if no_docs / total_projects > 0.6:
            recommendations.append(f"Medium Priority: {no_docs}/{total_projects} projects lack README documentation. Create documentation templates.")
        
        if no_containers / total_projects > 0.8:
            recommendations.append(f"Medium Priority: {no_containers}/{total_projects} projects are not containerized. Consider Docker adoption.")
        
        # Critical projects
        critical_projects = [r for r in results if r.get('risk_level') == 'Critical']
        if critical_projects:
            recommendations.append(f"Immediate Action: {len(critical_projects)} projects are at critical risk and need urgent remediation.")
        
        return recommendations

# Main execution function
async def main():
    """Main function to run the debt scanner"""
    
    # Configuration
    GITLAB_URL = os.getenv('GITLAB_URL', 'https://gitlab.com')
    ACCESS_TOKEN = os.getenv('GITLAB_ACCESS_TOKEN')
    GROUP_ID = os.getenv('GITLAB_GROUP_ID')  # Optional
    
    if not ACCESS_TOKEN:
        logger.error("GITLAB_ACCESS_TOKEN environment variable is required")
        return
    
    # Initialize agent
    agent = GitLabDebtScannerAgent(GITLAB_URL, ACCESS_TOKEN)
    
    # Configure project filters
    filters = {
        'last_activity_days': 365,  # Only projects active in last year
        'max_projects': 50  # Limit for testing
    }
    
    try:
        # Run scan
        logger.info("Starting GitLab technical debt scan...")
        results = await agent.scan_projects(
            group_id=int(GROUP_ID) if GROUP_ID else None,
            project_filters=filters
        )
        
        # Generate report
        report = await agent.generate_report(results, 'debt_assessment_report.json')
        
        # Print summary
        successful = len([r for r in results if 'debt_metrics' in r])
        failed = len([r for r in results if 'error' in r])
        
        print(f"\n=== Scan Complete ===")
        print(f"Total projects: {len(results)}")
        print(f"Successful scans: {successful}")
        print(f"Failed scans: {failed}")
        
        if successful > 0:
            avg_score = sum(r['debt_metrics']['overall_score'] for r in results if 'debt_metrics' in r) / successful
            print(f"Average debt score: {avg_score:.2f}")
            
            # Risk breakdown
            risk_counts = {}
            for result in results:
                if 'risk_level' in result:
                    level = result['risk_level']
                    risk_counts[level] = risk_counts.get(level, 0) + 1
            
            print("\nRisk Distribution:")
            for level, count in risk_counts.items():
                print(f"  {level}: {count}")
        
        print(f"\nDetailed report saved to: debt_assessment_report.json")
        
    except Exception as e:
        logger.error(f"Scan failed: {e}")
        raise

if __name__ == "__main__":
    # Example usage
    asyncio.run(main())