# GitLab Technical Debt Scanner Agent - Setup & Usage Guide

## Overview

This AI agent automatically scans GitLab repositories to assess technical debt across four key dimensions:
- **Code Quality** (25%): Test coverage, complexity, documentation
- **Architecture** (30%): Design patterns, structure, API specs
- **Infrastructure** (25%): CI/CD, security, containerization
- **Operations** (20%): Development velocity, deployment frequency, team collaboration

## Prerequisites

### Required Dependencies
```bash
pip install aiohttp GitPython PyYAML asyncio
```

### Optional Dependencies (for enhanced analysis)
```bash
# For Python code analysis
pip install flake8 pylint

# For JavaScript analysis  
npm install -g eslint

# For Java analysis
# Ensure Maven/Gradle are installed
```

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file or set environment variables:

```bash
# Required
export GITLAB_URL="https://gitlab.company.com"  # or https://gitlab.com
export GITLAB_ACCESS_TOKEN="glpat-xxxxxxxxxxxxxxxxxxxx"

# Optional
export GITLAB_GROUP_ID="123"  # Scan specific group only
export MAX_PROJECTS="50"      # Limit number of projects
export ACTIVITY_DAYS="365"    # Only scan projects active in last N days
```

### 2. GitLab Access Token Setup

1. Go to GitLab → User Settings → Access Tokens
2. Create token with scopes:
   - `read_repository` (clone repos)
   - `read_api` (access project info)
   - `read_user` (user information)
3. Set token as `GITLAB_ACCESS_TOKEN`

### 3. Configuration File

Create `scanner_config.yaml`:

```yaml
# GitLab Configuration
gitlab:
  url: "https://gitlab.company.com"
  timeout: 300
  clone_depth: 1

# Analysis Configuration
analysis:
  # Project filters
  filters:
    last_activity_days: 365
    max_projects: 100
    name_patterns:
      - "backend-*"
      - "*-api"
    exclude_archived: true
    min_commits: 10
  
  # Scoring weights (must sum to 1.0)
  weights:
    code_quality: 0.25
    architecture: 0.30
    infrastructure: 0.25
    operations: 0.20
  
  # Analysis tools
  tools:
    enable_flake8: true
    enable_eslint: false
    timeout_per_project: 600
    parallel_projects: 4

# Reporting Configuration
reporting:
  output_format: "json"  # json, yaml, html
  output_file: "debt_report_{timestamp}.json"
  include_raw_metrics: true
  generate_charts: false

# Risk Thresholds
risk_levels:
  low: 1.0
  medium: 2.0
  high: 3.0
  critical: 4.0
```

## Usage Examples

### Basic Scan
```bash
# Scan all accessible projects
python gitlab_debt_scanner.py

# Scan specific group
GITLAB_GROUP_ID=123 python gitlab_debt_scanner.py

# Scan with custom filters
python gitlab_debt_scanner.py --max-projects 20 --activity-days 90
```

### Advanced Usage
```python
import asyncio
from gitlab_debt_scanner import GitLabDebtScannerAgent

async def custom_scan():
    # Initialize agent
    agent = GitLabDebtScannerAgent(
        gitlab_url="https://gitlab.company.com",
        access_token="your_token"
    )
    
    # Custom filters
    filters = {
        'last_activity_days': 180,
        'name_pattern': r'backend-.*',
        'max_projects': 25
    }
    
    # Run scan
    results = await agent.scan_projects(
        group_id=123,
        project_filters=filters
    )
    
    # Generate report
    report = await agent.generate_report(results, 'custom_report.json')
    
    return results

# Run custom scan
results = asyncio.run(custom_scan())
```

### Batch Processing
```python
# Scan multiple groups
groups = [123, 456, 789]
all_results = []

for group_id in groups:
    results = await agent.scan_projects(group_id=group_id)
    all_results.extend(results)

# Combined report
combined_report = await agent.generate_report(all_results)
```

## Output Format

### Debt Score Structure
```json
{
  "project_info": {
    "id": 12345,
    "name": "backend-api",
    "path": "company/backend-api",
    "web_url": "https://gitlab.com/company/backend-api",
    "default_branch": "main",
    "last_activity_at": "2024-08-01T10:30:00Z"
  },
  "debt_metrics": {
    "code_quality_score": 2.3,
    "architecture_score": 1.8,
    "infrastructure_score": 3.1,
    "operations_score": 2.5,
    "overall_score": 2.4,
    "raw_metrics": {
      "code_analysis": {
        "test_to_code_ratio": 0.15,
        "avg_lines_per_file": 250,
        "total_files": 156,
        "python_flake8_issues": 45
      },
      "architecture_analysis": {
        "has_readme": true,
        "documentation_files": 3,
        "has_api_specifications": false,
        "max_directory_depth": 7
      },
      "infrastructure_analysis": {
        "has_cicd_config": true,
        "pipeline_success_rate": 0.85,
        "is_containerized": true,
        "potential_hardcoded_secrets": 2
      },
      "operations_analysis": {
        "commits_per_week": 5.2,
        "maintenance_commit_percentage": 45,
        "unique_contributors": 6
      }
    }
  },
  "risk_level": "High",
  "scan_timestamp": "2024-08-06T15:30:00Z"
}
```

### Summary Report
```json
{
  "scan_summary": {
    "total_projects": 25,
    "successful_scans": 23,
    "failed_scans": 2,
    "scan_date": "2024-08-06T15:30:00Z"
  },
  "risk_distribution": {
    "Low": 5,
    "Medium": 12,
    "High": 4,
    "Critical": 2
  },
  "top_debt_projects": [
    ["legacy-system", 3.8, "Critical"],
    ["old-api", 3.2, "Critical"],
    ["maintenance-app", 2.9, "High"]
  ],
  "recommendations": [
    "Critical: 15/25 projects lack CI/CD configuration.",
    "High Priority: 18/25 projects have insufficient test coverage.",
    "Immediate Action: 2 