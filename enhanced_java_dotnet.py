#!/usr/bin/env python3
"""
Enhanced Java and .NET analyzers for the GitLab Technical Debt Scanner Agent
Provides comprehensive analysis for Java Spring, .NET Core, and enterprise frameworks
"""

import asyncio
import json
import logging
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Optional, Any
import re
from collections import defaultdict

logger = logging.getLogger(__name__)

class JavaAnalyzer:
    """Comprehensive Java project analysis"""
    
    def __init__(self, repo_path: Path):
        self.repo_path = repo_path
        self.java_files = list(repo_path.rglob('*.java'))
        self.build_files = self._detect_build_system()
    
    def _detect_build_system(self) -> Dict[str, Any]:
        """Detect Java build system and configuration"""
        build_info = {
            'has_maven': (self.repo_path / 'pom.xml').exists(),
            'has_gradle': bool(list(self.repo_path.glob('**/build.gradle*'))),
            'has_ant': (self.repo_path / 'build.xml').exists(),
            'has_sbt': bool(list(self.repo_path.glob('**/build.sbt')))
        }
        
        # Find all build files
        build_info['maven_files'] = list(self.repo_path.glob('**/pom.xml'))
        build_info['gradle_files'] = list(self.repo_path.glob('**/build.gradle*'))
        
        return build_info
    
    async def analyze_java_project(self) -> Dict[str, Any]:
        """Main Java analysis entry point"""
        metrics = {}
        
        # Basic project structure
        metrics.update(await self._analyze_project_structure())
        
        # Build system analysis
        metrics.update(await self._analyze_build_configuration())
        
        # Framework detection
        metrics.update(await self._detect_frameworks())
        
        # Code quality analysis
        metrics.update(await self._analyze_code_quality())
        
        # Architecture patterns
        metrics.update(await self._analyze_architecture_patterns())
        
        # Testing analysis
        metrics.update(await self._analyze_testing())
        
        # Security analysis
        metrics.update(await self._analyze_security())
        
        # Performance analysis
        metrics.update(await self._analyze_performance_patterns())
        
        return metrics
    
    async def _analyze_project_structure(self) -> Dict[str, Any]:
        """Analyze Java project structure and conventions"""
        metrics = {}
        
        # Package structure analysis
        packages = set()
        main_classes = 0
        test_classes = 0
        abstract_classes = 0
        interfaces = 0
        enums = 0
        
        for java_file in self.java_files:
            try:
                content = java_file.read_text(encoding='utf-8', errors='ignore')
                
                # Extract package
                package_match = re.search(r'package\s+([\w\.]+);', content)
                if package_match:
                    packages.add(package_match.group(1))
                
                # Count class types
                if 'public class ' in content or 'class ' in content:
                    if '/test/' in str(java_file) or 'src/test/' in str(java_file):
                        test_classes += 1
                    else:
                        main_classes += 1
                
                if 'abstract class' in content:
                    abstract_classes += 1
                
                if 'interface ' in content:
                    interfaces += 1
                
                if 'enum ' in content:
                    enums += 1
                    
            except Exception as e:
                logger.debug(f"Error analyzing Java file {java_file}: {e}")
        
        # Calculate metrics
        total_classes = main_classes + test_classes
        metrics.update({
            'java_total_packages': len(packages),
            'java_main_classes': main_classes,
            'java_test_classes': test_classes,
            'java_abstract_classes': abstract_classes,
            'java_interfaces': interfaces,
            'java_enums': enums,
            'java_test_to_main_ratio': test_classes / max(main_classes, 1),
            'java_avg_classes_per_package': total_classes / max(len(packages), 1)
        })
        
        # Check for standard Maven/Gradle directory structure
        has_standard_structure = (
            (self.repo_path / 'src' / 'main' / 'java').exists() and
            (self.repo_path / 'src' / 'test' / 'java').exists()
        )
        metrics['java_follows_standard_structure'] = has_standard_structure
        
        return metrics
    
    async def _analyze_build_configuration(self) -> Dict[str, Any]:
        """Analyze build configuration and dependencies"""
        metrics = {}
        
        if self.build_files['has_maven']:
            metrics.update(await self._analyze_maven_config())
        
        if self.build_files['has_gradle']:
            metrics.update(await self._analyze_gradle_config())
        
        return metrics
    
    async def _analyze_maven_config(self) -> Dict[str, Any]:
        """Analyze Maven configuration"""
        metrics = {}
        
        for pom_file in self.build_files['maven_files']:
            try:
                tree = ET.parse(pom_file)
                root = tree.getroot()
                
                # Remove namespace for easier parsing
                for elem in root.iter():
                    if elem.tag.startswith('{'):
                        elem.tag = elem.tag.split('}')[1]
                
                # Java version
                java_version = self._extract_java_version(root)
                if java_version:
                    metrics['java_version'] = java_version
                
                # Dependencies analysis
                dependencies = root.findall('.//dependency')
                metrics['maven_dependency_count'] = len(dependencies)
                
                # Framework detection from dependencies
                frameworks = self._detect_frameworks_from_maven(dependencies)
                metrics.update(frameworks)
                
                # Plugin analysis
                plugins = root.findall('.//plugin')
                metrics['maven_plugin_count'] = len(plugins)
                
                # Check for common quality plugins
                plugin_artifacts = [p.find('artifactId').text for p in plugins if p.find('artifactId') is not None]
                metrics['has_checkstyle_plugin'] = 'maven-checkstyle-plugin' in plugin_artifacts
                metrics['has_spotbugs_plugin'] = 'spotbugs-maven-plugin' in plugin_artifacts
                metrics['has_jacoco_plugin'] = 'jacoco-maven-plugin' in plugin_artifacts
                metrics['has_surefire_plugin'] = 'maven-surefire-plugin' in plugin_artifacts
                
                # Multi-module project
                modules = root.findall('.//module')
                metrics['is_maven_multimodule'] = len(modules) > 0
                metrics['maven_module_count'] = len(modules)
                
            except Exception as e:
                logger.debug(f"Error parsing Maven POM {pom_file}: {e}")
        
        return metrics
    
    async def _analyze_gradle_config(self) -> Dict[str, Any]:
        """Analyze Gradle configuration"""
        metrics = {}
        
        gradle_files = self.build_files['gradle_files']
        
        dependencies = []
        plugins = []
        
        for gradle_file in gradle_files:
            try:
                content = gradle_file.read_text(encoding='utf-8', errors='ignore')
                
                # Extract dependencies
                dep_matches = re.findall(r'implementation\s+[\'"]([^\'"]+)[\'"]', content)
                dependencies.extend(dep_matches)
                
                # Extract plugins
                plugin_matches = re.findall(r'id\s+[\'"]([^\'"]+)[\'"]', content)
                plugins.extend(plugin_matches)
                
                # Java version
                java_match = re.search(r'sourceCompatibility\s*=\s*[\'"]?([0-9\.]+)[\'"]?', content)
                if java_match:
                    metrics['java_version'] = java_match.group(1)
                
            except Exception as e:
                logger.debug(f"Error parsing Gradle file {gradle_file}: {e}")
        
        metrics['gradle_dependency_count'] = len(dependencies)
        metrics['gradle_plugin_count'] = len(plugins)
        
        # Framework detection
        frameworks = self._detect_frameworks_from_gradle(dependencies)
        metrics.update(frameworks)
        
        # Check for quality plugins
        metrics['has_checkstyle_gradle'] = 'checkstyle' in plugins
        metrics['has_spotbugs_gradle'] = 'com.github.spotbugs' in plugins
        metrics['has_jacoco_gradle'] = 'jacoco' in plugins
        
        return metrics
    
    def _extract_java_version(self, root) -> Optional[str]:
        """Extract Java version from Maven POM"""
        # Check maven.compiler.source
        properties = root.find('properties')
        if properties is not None:
            source = properties.find('maven.compiler.source')
            if source is not None:
                return source.text
            
            # Check java.version
            java_version = properties.find('java.version')
            if java_version is not None:
                return java_version.text
        
        return None
    
    def _detect_frameworks_from_maven(self, dependencies) -> Dict[str, bool]:
        """Detect frameworks from Maven dependencies"""
        frameworks = {}
        
        dep_artifacts = []
        for dep in dependencies:
            group_id = dep.find('groupId')
            artifact_id = dep.find('artifactId')
            if group_id is not None and artifact_id is not None:
                dep_artifacts.append(f"{group_id.text}:{artifact_id.text}")
        
        # Spring Framework
        spring_deps = [d for d in dep_artifacts if 'org.springframework' in d]
        frameworks['uses_spring'] = len(spring_deps) > 0
        frameworks['spring_dependency_count'] = len(spring_deps)
        frameworks['uses_spring_boot'] = any('spring-boot' in d for d in dep_artifacts)
        frameworks['uses_spring_security'] = any('spring-security' in d for d in dep_artifacts)
        frameworks['uses_spring_data'] = any('spring-data' in d for d in dep_artifacts)
        
        # Other frameworks
        frameworks['uses_hibernate'] = any('org.hibernate' in d for d in dep_artifacts)
        frameworks['uses_junit'] = any('junit:junit' in d or 'org.junit' in d for d in dep_artifacts)
        frameworks['uses_mockito'] = any('mockito' in d for d in dep_artifacts)
        frameworks['uses_jackson'] = any('com.fasterxml.jackson' in d for d in dep_artifacts)
        frameworks['uses_apache_commons'] = any('org.apache.commons' in d for d in dep_artifacts)
        
        return frameworks
    
    def _detect_frameworks_from_gradle(self, dependencies) -> Dict[str, bool]:
        """Detect frameworks from Gradle dependencies"""
        frameworks = {}
        
        # Spring Framework
        spring_deps = [d for d in dependencies if 'org.springframework' in d]
        frameworks['uses_spring'] = len(spring_deps) > 0
        frameworks['spring_dependency_count'] = len(spring_deps)
        frameworks['uses_spring_boot'] = any('spring-boot' in d for d in dependencies)
        
        # Other frameworks
        frameworks['uses_junit'] = any('junit' in d for d in dependencies)
        frameworks['uses_testng'] = any('testng' in d for d in dependencies)
        frameworks['uses_mockito'] = any('mockito' in d for d in dependencies)
        
        return frameworks
    
    async def _detect_frameworks(self) -> Dict[str, Any]:
        """Detect Java frameworks from code patterns"""
        metrics = {}
        
        annotation_counts = defaultdict(int)
        import_counts = defaultdict(int)
        
        for java_file in self.java_files[:50]:  # Sample first 50 files
            try:
                content = java_file.read_text(encoding='utf-8', errors='ignore')
                
                # Count annotations
                annotations = re.findall(r'@(\w+)', content)
                for annotation in annotations:
                    annotation_counts[annotation] += 1
                
                # Count imports
                imports = re.findall(r'import\s+([\w\.]+);', content)
                for imp in imports:
                    import_counts[imp.split('.')[0]] += 1
                    
            except Exception as e:
                logger.debug(f"Error analyzing file {java_file}: {e}")
        
        # Framework detection based on annotations
        metrics['uses_spring_annotations'] = any(
            ann in annotation_counts for ann in 
            ['Controller', 'Service', 'Repository', 'Component', 'Autowired']
        )
        
        metrics['uses_jpa_annotations'] = any(
            ann in annotation_counts for ann in 
            ['Entity', 'Table', 'Id', 'GeneratedValue', 'Column']
        )
        
        metrics['uses_rest_annotations'] = any(
            ann in annotation_counts for ann in 
            ['RestController', 'RequestMapping', 'GetMapping', 'PostMapping']
        )
        
        # Most common annotations
        metrics['top_annotations'] = dict(list(annotation_counts.most_common(10)))
        
        return metrics
    
    async def _analyze_code_quality(self) -> Dict[str, Any]:
        """Analyze Java code quality patterns"""
        metrics = {}
        
        # Try to run static analysis tools
        metrics.update(await self._run_checkstyle())
        metrics.update(await self._run_spotbugs())
        
        # Manual analysis
        metrics.update(await self._analyze_code_patterns())
        
        return metrics
    
    async def _run_checkstyle(self) -> Dict[str, Any]:
        """Run Checkstyle analysis if available"""
        metrics = {}
        
        try:
            # Look for checkstyle configuration
            checkstyle_configs = list(self.repo_path.glob('**/checkstyle*.xml'))
            
            if checkstyle_configs and self.java_files:
                # Try to run checkstyle
                result = subprocess.run([
                    'checkstyle', '-c', str(checkstyle_configs[0]),
                    *[str(f) for f in self.java_files[:20]]  # Limit files
                ], capture_output=True, text=True, timeout=120)
                
                if result.returncode == 0:
                    # Parse checkstyle output
                    violations = len(re.findall(r'^\[', result.stdout, re.MULTILINE))
                    metrics['checkstyle_violations'] = violations
                    metrics['checkstyle_available'] = True
                else:
                    metrics['checkstyle_available'] = False
                    
        except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError) as e:
            logger.debug(f"Checkstyle analysis failed: {e}")
            metrics['checkstyle_available'] = False
        
        return metrics
    
    async def _run_spotbugs(self) -> Dict[str, Any]:
        """Run SpotBugs analysis if available"""
        metrics = {}
        
        try:
            # Look for compiled classes
            class_files = list(self.repo_path.rglob('*.class'))
            
            if class_files:
                result = subprocess.run([
                    'spotbugs', '-textui', '-quiet',
                    str(self.repo_path)
                ], capture_output=True, text=True, timeout=300)
                
                if result.returncode == 0:
                    bug_count = len(result.stdout.strip().split('\n')) if result.stdout.strip() else 0
                    metrics['spotbugs_issues'] = bug_count
                    metrics['spotbugs_available'] = True
                else:
                    metrics['spotbugs_available'] = False
                    
        except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError) as e:
            logger.debug(f"SpotBugs analysis failed: {e}")
            metrics['spotbugs_available'] = False
        
        return metrics
    
    async def _analyze_code_patterns(self) -> Dict[str, Any]:
        """Analyze Java code patterns manually"""
        metrics = {}
        
        large_classes = 0
        long_methods = 0
        deep_inheritance = 0
        god_classes = 0
        
        for java_file in self.java_files:
            try:
                content = java_file.read_text(encoding='utf-8', errors='ignore')
                lines = content.split('\n')
                
                # Large class detection (>500 lines)
                if len(lines) > 500:
                    large_classes += 1
                
                # God class detection (>50 methods or >1000 lines)
                method_count = len(re.findall(r'\bpublic\s+\w+.*\(', content))
                if method_count > 50 or len(lines) > 1000:
                    god_classes += 1
                
                # Long method detection
                in_method = False
                method_length = 0
                brace_count = 0
                
                for line in lines:
                    stripped = line.strip()
                    if not stripped or stripped.startswith('//'):
                        continue
                    
                    # Method start detection
                    if re.search(r'\b(public|private|protected)\s+\w+.*\(.*\)\s*\{', stripped):
                        in_method = True
                        method_length = 0
                        brace_count = 1
                    elif in_method:
                        method_length += 1
                        brace_count += stripped.count('{') - stripped.count('}')
                        
                        if brace_count == 0:  # Method end
                            if method_length > 50:  # Long method
                                long_methods += 1
                            in_method = False
                
                # Inheritance depth (simple heuristic)
                extends_match = re.search(r'class\s+\w+\s+extends\s+(\w+)', content)
                if extends_match and extends_match.group(1) not in ['Object', 'Exception']:
                    deep_inheritance += 1
                    
            except Exception as e:
                logger.debug(f"Error analyzing patterns in {java_file}: {e}")
        
        total_classes = len(self.java_files)
        metrics.update({
            'java_large_classes': large_classes,
            'java_long_methods': long_methods,
            'java_god_classes': god_classes,
            'java_deep_inheritance_classes': deep_inheritance,
            'java_large_class_ratio': large_classes / max(total_classes, 1),
            'java_god_class_ratio': god_classes / max(total_classes, 1)
        })
        
        return metrics
    
    async def _analyze_architecture_patterns(self) -> Dict[str, Any]:
        """Analyze Java architecture patterns"""
        metrics = {}
        
        # Package structure analysis
        packages = set()
        package_types = defaultdict(int)
        
        for java_file in self.java_files:
            try:
                content = java_file.read_text(encoding='utf-8', errors='ignore')
                
                package_match = re.search(r'package\s+([\w\.]+);', content)
                if package_match:
                    package = package_match.group(1)
                    packages.add(package)
                    
                    # Categorize packages
                    if any(pattern in package.lower() for pattern in ['controller', 'web', 'rest']):
                        package_types['controller'] += 1
                    elif any(pattern in package.lower() for pattern in ['service', 'business']):
                        package_types['service'] += 1
                    elif any(pattern in package.lower() for pattern in ['repository', 'dao', 'data']):
                        package_types['data'] += 1
                    elif any(pattern in package.lower() for pattern in ['model', 'entity', 'domain']):
                        package_types['model'] += 1
                        
            except Exception as e:
                logger.debug(f"Error analyzing architecture in {java_file}: {e}")
        
        # Architecture pattern detection
        has_layered_architecture = (
            package_types['controller'] > 0 and
            package_types['service'] > 0 and
            package_types['data'] > 0
        )
        
        metrics.update({
            'java_total_packages': len(packages),
            'java_controller_packages': package_types['controller'],
            'java_service_packages': package_types['service'],
            'java_data_packages': package_types['data'],
            'java_model_packages': package_types['model'],
            'java_has_layered_architecture': has_layered_architecture,
            'java_package_organization_score': self._calculate_package_organization_score(package_types)
        })
        
        return metrics
    
    def _calculate_package_organization_score(self, package_types: Dict[str, int]) -> float:
        """Calculate how well packages are organized (0-1 scale)"""
        if not package_types:
            return 0.0
        
        # Good organization has balanced distribution across layers
        total_packages = sum(package_types.values())
        if total_packages < 3:
            return 0.3  # Too few packages
        
        # Check for presence of key architectural layers
        has_controller = package_types['controller'] > 0
        has_service = package_types['service'] > 0
        has_data = package_types['data'] > 0
        has_model = package_types['model'] > 0
        
        layer_count = sum([has_controller, has_service, has_data, has_model])
        
        if layer_count >= 3:
            return 0.9  # Well organized
        elif layer_count == 2:
            return 0.6  # Reasonably organized
        else:
            return 0.3  # Poor organization
    
    async def _analyze_testing(self) -> Dict[str, Any]:
        """Analyze Java testing practices"""
        metrics = {}
        
        test_files = [f for f in self.java_files if '/test/' in str(f) or 'Test.java' in str(f)]
        
        unit_tests = 0
        integration_tests = 0
        test_methods = 0
        
        for test_file in test_files:
            try:
                content = test_file.read_text(encoding='utf-8', errors='ignore')
                
                # Count test methods
                test_method_matches = re.findall(r'@Test', content)
                test_methods += len(test_method_matches)
                
                # Categorize tests
                if any(pattern in str(test_file).lower() for pattern in ['unit', 'unittest']):
                    unit_tests += 1
                elif any(pattern in str(test_file).lower() for pattern in ['integration', 'it']):
                    integration_tests += 1
                else:
                    # Default to unit test
                    unit_tests += 1
                    
            except Exception as e:
                logger.debug(f"Error analyzing test file {test_file}: {e}")
        
        total_main_classes = len([f for f in self.java_files if '/test/' not in str(f)])
        
        metrics.update({
            'java_test_files': len(test_files),
            'java_unit_test_files': unit_tests,
            'java_integration_test_files': integration_tests,
            'java_test_methods': test_methods,
            'java_test_file_ratio': len(test_files) / max(total_main_classes, 1),
            'java_avg_tests_per_file': test_methods / max(len(test_files), 1)
        })
        
        return metrics
    
    async def _analyze_security(self) -> Dict[str, Any]:
        """Analyze Java security patterns"""
        metrics = {}
        
        security_issues = 0
        hardcoded_credentials = 0
        sql_injection_risks = 0
        
        for java_file in self.java_files[:50]:  # Sample
            try:
                content = java_file.read_text(encoding='utf-8', errors='ignore')
                
                # Look for hardcoded credentials
                if re.search(r'password\s*=\s*["\'][^"\']{3,}["\']', content, re.IGNORECASE):
                    hardcoded_credentials += 1
                
                # SQL injection risks
                if re.search(r'Statement.*executeQuery\s*\(\s*["\'].*\+', content):
                    sql_injection_risks += 1
                
                # Other security patterns
                if re.search(r'System\.out\.print.*password', content, re.IGNORECASE):
                    security_issues += 1
                    
            except Exception as e:
                logger.debug(f"Error analyzing security in {java_file}: {e}")
        
        metrics.update({
            'java_security_issues': security_issues,
            'java_hardcoded_credentials': hardcoded_credentials,
            'java_sql_injection_risks': sql_injection_risks
        })
        
        return metrics
    
    async def _analyze_performance_patterns(self) -> Dict[str, Any]:
        """Analyze Java performance patterns"""
        metrics = {}
        
        performance_issues = 0
        
        for java_file in self.java_files[:30]:  # Sample
            try:
                content = java_file.read_text(encoding='utf-8', errors='ignore')
                
                # String concatenation in loops
                if re.search(r'for\s*\(.*\)\s*\{[^}]*\+\s*=.*String', content, re.DOTALL):
                    performance_issues += 1
                
                # Inefficient collection usage
                if 'Vector' in content or re.search(r'new\s+ArrayList\(\).*add\(', content):
                    performance_issues += 1
                    
            except Exception as e:
                logger.debug(f"Error analyzing performance in {java_file}: {e}")
        
        metrics['java_performance_issues'] = performance_issues
        
        return metrics


class DotNetAnalyzer:
    """Comprehensive .NET project analysis"""
    
    def __init__(self, repo_path: Path):
        self.repo_path = repo_path
        self.cs_files = list(repo_path.rglob('*.cs'))
        self.project_files = list(repo_path.rglob('*.csproj')) + list(repo_path.rglob('*.vbproj'))
        self.solution_files = list(repo_path.rglob('*.sln'))
    
    async def analyze_dotnet_project(self) -> Dict[str, Any]:
        """Main .NET analysis entry point"""
        metrics = {}
        
        # Project structure analysis
        metrics.update(await self._analyze_project_structure())
        
        # Build configuration analysis
        metrics.update(await self._analyze_project_files())
        
        # Framework detection
        metrics.update(await self._detect_frameworks())
        
        # Code quality analysis
        metrics.update(await self._analyze_code_quality())
        
        # Architecture analysis
        metrics.update(await self._analyze_architecture())
        
        # Testing analysis
        metrics.update(await self._analyze_testing())
        
        # Security analysis
        metrics.update(await self._analyze_security())
        
        return metrics
    
    async def _analyze_project_structure(self) -> Dict[str, Any]:
        """Analyze .NET project structure"""
        metrics = {}
        
        namespaces = set()
        classes = 0
        interfaces = 0
        enums = 0
        structs = 0
        
        for cs_file in self.cs_files:
            try:
                content = cs_file.read_text(encoding='utf-8', errors='ignore')
                
                # Extract namespaces
                namespace_matches = re.findall(r'namespace\s+([\w\.]+)', content)
                namespaces.update(namespace_matches)
                
                # Count types
                classes += len(re.findall(r'\bclass\s+\w+', content))
                interfaces += len(re.findall(r'\binterface\s+\w+', content))
                enums += len(re.findall(r'\benum\s+\w+', content))
                structs += len(re.findall(r'\bstruct\s+\w+', content))
                
            except Exception as e:
                logger.debug(f"Error analyzing .NET file {cs_file}: {e}")
        
        metrics.update({
            'dotnet_namespaces': len(namespaces),
            'dotnet_classes': classes,
            'dotnet_interfaces': interfaces,
            'dotnet_enums': enums,
            'dotnet_structs': structs,
            'dotnet_total_files': len(self.cs_files),
            'dotnet_project_files': len(self.project_files),
            'dotnet_solution_files': len(self.solution_files),
            'dotnet_avg_types_per_file': (classes + interfaces + enums + structs) / max(len(self.cs_files), 1)
        })
        
        return metrics
    
    async def _analyze_project_files(self) -> Dict[str, Any]:
        """Analyze .csproj and solution files"""
        metrics = {}
        
        target_frameworks = set()
        package_references = 0
        project_references = 0
        
        for project_file in self.project_files:
            try:
                content = project_file.read_text(encoding='utf-8', errors='ignore')
                
                # Target framework
                tf_matches = re.findall(r'<TargetFramework>([^<]+)</TargetFramework>', content)
                target_frameworks.update(tf_matches)
                
                # Multiple target frameworks
                mtf_matches = re.findall(r'<TargetFrameworks>([^<]+)</TargetFrameworks>', content)
                for mtf in mtf_matches:
                    target_frameworks.update(mtf.split(';'))
                
                # Package references
                package_references += len(re.findall(r'<PackageReference', content))
                
                # Project references
                project_references += len(re.findall(r'<ProjectReference', content))
                
            except Exception as e:
                logger.debug(f"Error analyzing project file {project_file}: {e}")
        
        # Analyze solution files
        solution_projects = 0
        for solution_file in self.solution_files:
            try:
                content = solution_file.read_text(encoding='utf-8', errors='ignore')
                solution_projects += len(re.findall(r'Project\(', content))
            except Exception as e:
                logger.debug(f"Error analyzing solution file {solution_file}: {e}")
        
        metrics.update({
            'dotnet_target_frameworks': list(target_frameworks),
            'dotnet_package_references': package_references,
            'dotnet_project_references': project_references,
            'dotnet_solution_projects': solution_projects,
            'dotnet_is_multi_target': len(target_frameworks) > 1,
            'dotnet_uses_modern_framework': any('net5' in tf or 'net6' in tf or 'net7' in tf or 'net8' in tf for tf in target_frameworks),
            'dotnet_uses_legacy_framework': any('net4' in tf for tf in target_frameworks)
        })
        
        return metrics
    
    async def _detect_frameworks(self) -> Dict[str, Any]:
        """Detect .NET frameworks and libraries"""
        metrics = {}
        
        # Analyze using statements
        using_statements = defaultdict(int)
        for cs_file in self.cs_files[:50]:  # Sample
            try:
                content = cs_file.read_text(encoding='utf-8', errors='ignore')
                usings = re.findall(r'using\s+([\w\.]+);', content)
                for using in usings:
                    using_statements[using.split('.')[0]] += 1
            except Exception as e:
                logger.debug(f"Error detecting frameworks in {cs_file}: {e}")
        
        # Framework detection based on using statements
        metrics.update({
            'dotnet_uses_aspnet': 'Microsoft' in using_statements and any(
                'AspNet' in using or 'Mvc' in using for using in using_statements
            ),
            'dotnet_uses_entityframework': any(
                'EntityFramework' in using or 'Microsoft.EntityFrameworkCore' in using 
                for using in using_statements
            ),
            'dotnet_uses_wpf': 'System.Windows' in using_statements,
            'dotnet_uses_winforms': 'System.Windows.Forms' in using_statements,
            'dotnet_uses_wcf': 'System.ServiceModel' in using_statements,
            'dotnet_uses_linq': 'System.Linq' in using_statements,
            'dotnet_uses_newtonsoft': 'Newtonsoft' in using_statements,
            'dotnet_uses_automapper': 'AutoMapper' in using_statements,
            'dotnet_uses_nunit': 'NUnit' in using_statements,
            'dotnet_uses_xunit': 'Xunit' in using_statements,
            'dotnet_uses_moq': 'Moq' in using_statements
        })
        
        # Analyze project files for specific packages
        all_project_content = ""
        for project_file in self.project_files:
            try:
                all_project_content += project_file.read_text(encoding='utf-8', errors='ignore')
            except Exception:
                pass
        
        # Framework detection from project files
        framework_packages = {
            'Microsoft.AspNetCore': 'dotnet_uses_aspnetcore',
            'Microsoft.EntityFrameworkCore': 'dotnet_uses_efcore',
            'Swashbuckle.AspNetCore': 'dotnet_uses_swagger',
            'Serilog': 'dotnet_uses_serilog',
            'MediatR': 'dotnet_uses_mediatr',
            'FluentValidation': 'dotnet_uses_fluentvalidation',
            'Polly': 'dotnet_uses_polly',
            'Hangfire': 'dotnet_uses_hangfire',
            'SignalR': 'dotnet_uses_signalr'
        }
        
        for package, metric_key in framework_packages.items():
            metrics[metric_key] = package in all_project_content
        
        return metrics
    
    async def _analyze_code_quality(self) -> Dict[str, Any]:
        """Analyze .NET code quality"""
        metrics = {}
        
        large_classes = 0
        long_methods = 0
        god_classes = 0
        cyclomatic_complexity_issues = 0
        
        for cs_file in self.cs_files:
            try:
                content = cs_file.read_text(encoding='utf-8', errors='ignore')
                lines = content.split('\n')
                
                # Large class detection
                if len(lines) > 500:
                    large_classes += 1
                
                # God class detection (many methods or properties)
                method_count = len(re.findall(r'\b(public|private|protected|internal)\s+\w+.*\(', content))
                property_count = len(re.findall(r'\b(public|private|protected|internal)\s+\w+.*\{.*get', content))
                
                if method_count > 30 or property_count > 50 or len(lines) > 1000:
                    god_classes += 1
                
                # Long method detection (simple heuristic)
                methods = re.findall(r'\{[^}]{500,}\}', content, re.DOTALL)
                long_methods += len(methods)
                
                # Basic cyclomatic complexity (count decision points)
                decision_keywords = ['if', 'else', 'while', 'for', 'foreach', 'switch', 'case', 'catch', '&&', '||']
                complexity_score = sum(content.count(keyword) for keyword in decision_keywords)
                if complexity_score > 50:  # High complexity
                    cyclomatic_complexity_issues += 1
                
            except Exception as e:
                logger.debug(f"Error analyzing .NET code quality in {cs_file}: {e}")
        
        total_files = len(self.cs_files)
        metrics.update({
            'dotnet_large_classes': large_classes,
            'dotnet_god_classes': god_classes,
            'dotnet_long_methods': long_methods,
            'dotnet_high_complexity_files': cyclomatic_complexity_issues,
            'dotnet_large_class_ratio': large_classes / max(total_files, 1),
            'dotnet_god_class_ratio': god_classes / max(total_files, 1)
        })
        
        return metrics
    
    async def _analyze_architecture(self) -> Dict[str, Any]:
        """Analyze .NET architecture patterns"""
        metrics = {}
        
        # Namespace analysis for architectural patterns
        namespaces = set()
        namespace_patterns = defaultdict(int)
        
        for cs_file in self.cs_files:
            try:
                content = cs_file.read_text(encoding='utf-8', errors='ignore')
                
                namespace_matches = re.findall(r'namespace\s+([\w\.]+)', content)
                for namespace in namespace_matches:
                    namespaces.add(namespace)
                    
                    # Pattern detection
                    namespace_lower = namespace.lower()
                    if any(pattern in namespace_lower for pattern in ['controller', 'api', 'web']):
                        namespace_patterns['presentation'] += 1
                    elif any(pattern in namespace_lower for pattern in ['service', 'business', 'application']):
                        namespace_patterns['business'] += 1
                    elif any(pattern in namespace_lower for pattern in ['repository', 'data', 'dal']):
                        namespace_patterns['data'] += 1
                    elif any(pattern in namespace_lower for pattern in ['model', 'entity', 'domain']):
                        namespace_patterns['domain'] += 1
                
            except Exception as e:
                logger.debug(f"Error analyzing .NET architecture in {cs_file}: {e}")
        
        # Architecture pattern detection
        has_layered_architecture = (
            namespace_patterns['presentation'] > 0 and
            namespace_patterns['business'] > 0 and
            namespace_patterns['data'] > 0
        )
        
        has_clean_architecture = (
            namespace_patterns['domain'] > 0 and
            namespace_patterns['business'] > 0 and
            namespace_patterns['data'] > 0
        )
        
        # Dependency injection usage
        di_usage = 0
        for cs_file in self.cs_files[:30]:  # Sample
            try:
                content = cs_file.read_text(encoding='utf-8', errors='ignore')
                if any(pattern in content for pattern in ['IServiceCollection', 'AddTransient', 'AddScoped', 'AddSingleton']):
                    di_usage += 1
            except Exception as e:
                logger.debug(f"Error analyzing DI in {cs_file}: {e}")
        
        metrics.update({
            'dotnet_total_namespaces': len(namespaces),
            'dotnet_presentation_namespaces': namespace_patterns['presentation'],
            'dotnet_business_namespaces': namespace_patterns['business'],
            'dotnet_data_namespaces': namespace_patterns['data'],
            'dotnet_domain_namespaces': namespace_patterns['domain'],
            'dotnet_has_layered_architecture': has_layered_architecture,
            'dotnet_has_clean_architecture': has_clean_architecture,
            'dotnet_uses_dependency_injection': di_usage > 0,
            'dotnet_di_usage_ratio': di_usage / max(len(self.cs_files[:30]), 1)
        })
        
        return metrics
    
    async def _analyze_testing(self) -> Dict[str, Any]:
        """Analyze .NET testing practices"""
        metrics = {}
        
        test_files = [f for f in self.cs_files if any(pattern in str(f).lower() for pattern in ['test', 'spec'])]
        
        unit_tests = 0
        integration_tests = 0
        test_methods = 0
        
        for test_file in test_files:
            try:
                content = test_file.read_text(encoding='utf-8', errors='ignore')
                
                # Count test methods
                test_methods += len(re.findall(r'\[Test\]|\[Fact\]|\[TestMethod\]', content))
                
                # Categorize tests
                if any(pattern in str(test_file).lower() for pattern in ['unit', 'unittest']):
                    unit_tests += 1
                elif any(pattern in str(test_file).lower() for pattern in ['integration', 'functional']):
                    integration_tests += 1
                else:
                    unit_tests += 1  # Default to unit test
                
            except Exception as e:
                logger.debug(f"Error analyzing .NET test file {test_file}: {e}")
        
        non_test_files = len(self.cs_files) - len(test_files)
        
        metrics.update({
            'dotnet_test_files': len(test_files),
            'dotnet_unit_test_files': unit_tests,
            'dotnet_integration_test_files': integration_tests,
            'dotnet_test_methods': test_methods,
            'dotnet_test_file_ratio': len(test_files) / max(non_test_files, 1),
            'dotnet_avg_tests_per_file': test_methods / max(len(test_files), 1)
        })
        
        return metrics
    
    async def _analyze_security(self) -> Dict[str, Any]:
        """Analyze .NET security patterns"""
        metrics = {}
        
        security_issues = 0
        hardcoded_secrets = 0
        sql_injection_risks = 0
        
        for cs_file in self.cs_files[:50]:  # Sample
            try:
                content = cs_file.read_text(encoding='utf-8', errors='ignore')
                
                # Hardcoded credentials
                if re.search(r'password\s*=\s*["\'][^"\']{3,}["\']', content, re.IGNORECASE):
                    hardcoded_secrets += 1
                
                # SQL injection risks
                if re.search(r'SqlCommand.*\+.*\, content):
                    sql_injection_risks += 1
                
                # Other security issues
                if 'MD5' in content or 'SHA1' in content:
                    security_issues += 1
                
                if re.search(r'Console\.WriteLine.*password', content, re.IGNORECASE):
                    security_issues += 1
                
            except Exception as e:
                logger.debug(f"Error analyzing .NET security in {cs_file}: {e}")
        
        metrics.update({
            'dotnet_security_issues': security_issues,
            'dotnet_hardcoded_secrets': hardcoded_secrets,
            'dotnet_sql_injection_risks': sql_injection_risks
        })
        
        return metrics


class EnhancedCodeAnalyzer:
    """Enhanced code analyzer that includes Java and .NET support"""
    
    def __init__(self, temp_dir: str):
        self.temp_dir = Path(temp_dir)
    
    async def analyze_code_quality(self, repo_path: Path) -> Dict[str, Any]:
        """Enhanced code quality analysis with Java and .NET support"""
        metrics = {}
        
        # Basic analysis (existing functionality)
        metrics.update(await self._analyze_file_structure(repo_path))
        
        # Language detection
        languages = self._detect_languages(repo_path)
        metrics['detected_languages'] = languages
        
        # Language-specific analysis
        if 'Java' in languages:
            java_analyzer = JavaAnalyzer(repo_path)
            java_metrics = await java_analyzer.analyze_java_project()
            metrics['java_analysis'] = java_metrics
        
        if 'C#' in languages:
            dotnet_analyzer = DotNetAnalyzer(repo_path)
            dotnet_metrics = await dotnet_analyzer.analyze_dotnet_project()
            metrics['dotnet_analysis'] = dotnet_metrics
        
        if 'Python' in languages:
            metrics.update(await self._analyze_python_code(repo_path))
        
        if 'JavaScript' in languages or 'TypeScript' in languages:
            metrics.update(await self._analyze_javascript_code(repo_path))
        
        # Generic analysis
        metrics.update(await self._analyze_complexity(repo_path))
        
        return metrics
    
    def _detect_languages(self, repo_path: Path) -> List[str]:
        """Enhanced language detection"""
        language_extensions = {
            'Java': {'.java'},
            'C#': {'.cs'},
            'VB.NET': {'.vb'},
            'Python': {'.py'},
            'JavaScript': {'.js', '.jsx'},
            'TypeScript': {'.ts', '.tsx'},
            'C++': {'.cpp', '.cc', '.cxx', '.hpp', '.h'},
            'C': {'.c', '.h'},
            'Ruby': {'.rb'},
            'Go': {'.go'},
            'PHP': {'.php'},
            'Rust': {'.rs'},
            'Kotlin': {'.kt'},
            'Swift': {'.swift'},
            'Scala': {'.scala'},
            'F#': {'.fs'},
            'Clojure': {'.clj'},
            'Groovy': {'.groovy'}
        }
        
        found_languages = set()
        for file_path in repo_path.rglob('*'):
            if file_path.is_file():
                for language, extensions in language_extensions.items():
                    if file_path.suffix in extensions:
                        found_languages.add(language)
        
        return list(found_languages)
    
    # Include existing methods from original CodeAnalyzer
    async def _analyze_file_structure(self, repo_path: Path) -> Dict[str, Any]:
        """Analyze basic file structure metrics"""
        metrics = {}
        
        total_files = 0
        total_lines = 0
        code_files = 0
        test_files = 0
        config_files = 0
        
        code_extensions = {'.py', '.js', '.ts', '.java', '.cs', '.cpp', '.c', '.rb', '.go', '.php', '.scala', '.kt'}
        test_patterns = {'test_', '_test', '.test.', '.spec.', '/tests/', '/test/', 'Test.java', 'Tests.cs'}
        config_extensions = {'.yml', '.yaml', '.json', '.xml', '.toml', '.ini', '.cfg', '.properties'}
        
        for file_path in repo_path.rglob('*'):
            if file_path.is_file() and not any(ignore in str(file_path) for ignore in ['.git', 'node_modules', '__pycache__', 'bin/', 'obj/']):
                total_files += 1
                
                try:
                    if file_path.suffix in code_extensions:
                        code_files += 1
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            lines = len(f.readlines())
                            total_lines += lines
                        
                        # Check if it's a test file
                        if any(pattern in str(file_path) for pattern in test_patterns):
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
            'test_to_code_ratio': test_files / max(code_files - test_files, 1),
            'avg_lines_per_file': total_lines / max(code_files, 1)
        })
        
        return metrics
    
    # Add other existing methods from original CodeAnalyzer...
    async def _analyze_python_code(self, repo_path: Path) -> Dict[str, Any]:
        """Analyze Python-specific metrics"""
        # Implementation from original analyzer
        return {}
    
    async def _analyze_javascript_code(self, repo_path: Path) -> Dict[str, Any]:
        """Analyze JavaScript/TypeScript metrics"""  
        # Implementation from original analyzer
        return {}
    
    async def _analyze_complexity(self, repo_path: Path) -> Dict[str, Any]:
        """Analyze code complexity using generic metrics"""
        # Implementation from original analyzer
        return {}


# Enhanced Debt Score Calculator for Java and .NET
class EnhancedDebtScoreCalculator:
    """Enhanced debt score calculator with Java and .NET specific scoring"""
    
    def __init__(self):
        self.weights = {
            'code_quality': 0.25,
            'architecture': 0.30,
            'infrastructure': 0.25,
            'operations': 0.20
        }
    
    def _calculate_code_quality_score(self, metrics: Dict[str, Any]) -> float:
        """Enhanced code quality scoring with Java and .NET support"""
        score = 0.0
        
        # Generic scoring (existing logic)
        test_ratio = metrics.get('test_to_code_ratio', 0)
        if test_ratio < 0.1:
            score += 1.5
        elif test_ratio < 0.3:
            score += 1.0
        elif test_ratio < 0.5:
            score += 0.5
        
        # Java-specific scoring
        java_analysis = metrics.get('java_analysis', {})
        if java_analysis:
            # Test coverage penalty
            java_test_ratio = java_analysis.get('java_test_to_main_ratio', 0)
            if java_test_ratio < 0.2:
                score += 1.0
            elif java_test_ratio < 0.5:
                score += 0.5
            
            # God class penalty
            god_class_ratio = java_analysis.get('java_god_class_ratio', 0)
            if god_class_ratio > 0.1:
                score += 1.5
            elif god_class_ratio > 0.05:
                score += 1.0
            
            # Architecture organization
            package_score = java_analysis.get('java_package_organization_score', 1.0)
            if package_score < 0.5:
                score += 1.0
            elif package_score < 0.7:
                score += 0.5
            
            # Static analysis issues
            if java_analysis.get('checkstyle_available', False):
                violations = java_analysis.get('checkstyle_violations', 0)
                if violations > 100:
                    score += 1.0
                elif violations > 50:
                    score += 0.5
        
        # .NET-specific scoring
        dotnet_analysis = metrics.get('dotnet_analysis', {})
        if dotnet_analysis:
            # Test coverage penalty
            dotnet_test_ratio = dotnet_analysis.get('dotnet_test_file_ratio', 0)
            if dotnet_test_ratio < 0.2:
                score += 1.0
            elif dotnet_test_ratio < 0.5:
                score += 0.5
            
            # God class penalty
            god_class_ratio = dotnet_analysis.get('dotnet_god_class_ratio', 0)
            if god_class_ratio > 0.1:
                score += 1.5
            elif god_class_ratio > 0.05:
                score += 1.0
            
            # Legacy framework penalty
            if dotnet_analysis.get('dotnet_uses_legacy_framework', False):
                score += 1.5
            
            # Architecture patterns bonus
            if dotnet_analysis.get('dotnet_has_clean_architecture', False):
                score -= 0.5  # Reduce debt for good architecture
            elif dotnet_analysis.get('dotnet_has_layered_architecture', False):
                score -= 0.3
        
        return min(max(score, 0.0), 4.0)
    
    def _calculate_architecture_score(self, metrics: Dict[str, Any]) -> float:
        """Enhanced architecture scoring"""
        score = 0.0
        
        # Generic architecture scoring (existing logic)
        if not metrics.get('has_readme', False):
            score += 1.0
        
        # Java architecture scoring
        java_analysis = metrics.get('java_analysis', {})
        if java_analysis:
            if not java_analysis.get('java_follows_standard_structure', False):
                score += 1.0
            
            if not java_analysis.get('java_has_layered_architecture', False):
                score += 1.5
            
            if not java_analysis.get('uses_spring', False) and java_analysis.get('java_main_classes', 0) > 50:
                score += 0.5  # Large project without framework
        
        # .NET architecture scoring
        dotnet_analysis = metrics.get('dotnet_analysis', {})
        if dotnet_analysis:
            if not dotnet_analysis.get('dotnet_has_layered_architecture', False):
                score += 1.5
            
            if not dotnet_analysis.get('dotnet_uses_dependency_injection', False):
                score += 1.0
            
            if dotnet_analysis.get('dotnet_solution_projects', 0) > 10 and not dotnet_analysis.get('dotnet_has_clean_architecture', False):
                score += 1.0  # Large solution without clean architecture
        
        return min(score, 4.0)


# Usage example with enhanced analyzers
async def main_enhanced():
    """Example usage of enhanced Java/.NET analysis"""
    
    # This would be integrated into the main GitLabDebtScannerAgent
    temp_dir = "/tmp/repo_analysis"
    repo_path = Path("/path/to/java/or/dotnet/repo")
    
    # Enhanced code analysis
    enhanced_analyzer = EnhancedCodeAnalyzer(temp_dir)
    metrics = await enhanced_analyzer.analyze_code_quality(repo_path)
    
    # Enhanced debt scoring
    enhanced_calculator = EnhancedDebtScoreCalculator()
    debt_score = enhanced_calculator.calculate_debt_score({'code_analysis': metrics})
    
    print(f"Enhanced Debt Score: {debt_score.overall_score}")
    
    # Java-specific results
    if 'java_analysis' in metrics:
        java_metrics = metrics['java_analysis']
        print(f"Java Framework Detection:")
        print(f"  - Uses Spring: {java_metrics.get('uses_spring', False)}")
        print(f"  - Uses Spring Boot: {java_metrics.get('uses_spring_boot', False)}")
        print(f"  - Test Coverage Ratio: {java_metrics.get('java_test_to_main_ratio', 0):.2f}")
        print(f"  - God Class Ratio: {java_metrics.get('java_god_class_ratio', 0):.2f}")
    
    # .NET-specific results
    if 'dotnet_analysis' in metrics:
        dotnet_metrics = metrics['dotnet_analysis']
        print(f".NET Framework Detection:")
        print(f"  - Uses ASP.NET Core: {dotnet_metrics.get('dotnet_uses_aspnetcore', False)}")
        print(f"  - Uses Entity Framework: {dotnet_metrics.get('dotnet_uses_efcore', False)}")
        print(f"  - Has Clean Architecture: {dotnet_metrics.get('dotnet_has_clean_architecture', False)}")
        print(f"  - Uses Modern Framework: {dotnet_metrics.get('dotnet_uses_modern_framework', False)}")

if __name__ == "__main__":
    asyncio.run(main_enhanced())