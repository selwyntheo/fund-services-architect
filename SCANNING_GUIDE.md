# Technology Debt Scanning Guide for OpenFinLib Repository

## Repository Details
- **Repository**: https://github.com/selwyntheo/OpenFinLib
- **Type**: GitHub Repository
- **Language**: Likely Python/JavaScript (Financial Library)

## Prerequisites

1. **Backend Server Running**
   ```bash
   cd /Volumes/D/Ai/templates/technology-debt/backend
   /Volumes/D/Ai/templates/technology-debt/.venv/bin/python api_server.py
   ```

2. **Frontend Dashboard Running**
   ```bash
   cd /Volumes/D/Ai/templates/technology-debt/dashboard
   npm run dev
   ```

## Method 1: Using the Backend API Directly

### Step 1: Clone the Repository Locally
```bash
# Clone the repository to analyze
git clone https://github.com/selwyntheo/OpenFinLib.git /tmp/OpenFinLib
```

### Step 2: Trigger Scan via API
```bash
# Using curl to trigger a local repository scan
curl -X POST "http://localhost:8000/api/scan/local" \
  -H "Content-Type: application/json" \
  -d '{
    "repository_path": "/tmp/OpenFinLib",
    "project_name": "OpenFinLib",
    "enhanced_analysis": true
  }'
```

### Step 3: Check Scan Status
```bash
# Get scan status (replace SCAN_ID with actual ID from previous response)
curl "http://localhost:8000/api/scan/status/SCAN_ID"
```

### Step 4: Retrieve Results
```bash
# Get scan results
curl "http://localhost:8000/api/scan/results?page=1&limit=10"
```

## Method 2: Using the Dashboard Interface

### Step 1: Access Dashboard
1. Open browser to: `http://localhost:3000/dashboard`
2. Click on the "Scan" or "New Scan" button

### Step 2: Configure Scan
1. **Repository URL**: `https://github.com/selwyntheo/OpenFinLib`
2. **Project Name**: `OpenFinLib`
3. **Enhanced Analysis**: Enable
4. **Analysis Type**: Select appropriate types based on detected languages

### Step 3: Monitor Progress
1. The dashboard will show scan progress
2. Real-time updates on analysis status
3. Notification when scan completes

### Step 4: View Results
1. Navigate to "Projects Overview" section
2. Review debt metrics and risk levels
3. Check "Priority Recommendations" panel
4. Analyze trend charts and debt distribution

## Method 3: Direct Backend Integration

### Step 1: Update Backend Configuration
Edit `backend/api_server.py` to add GitHub integration:

```python
# Add GitHub repository scanning capability
@app.post("/api/scan/github")
async def scan_github_repository(request: GitHubScanRequest):
    """Scan a GitHub repository directly"""
    try:
        # Clone repository temporarily
        repo_path = f"/tmp/{request.project_name}"
        subprocess.run([
            "git", "clone", request.repository_url, repo_path
        ], check=True)
        
        # Run analysis
        scanner = TechDebtScanner()
        results = scanner.analyze_repository(repo_path)
        
        # Clean up temporary files
        shutil.rmtree(repo_path, ignore_errors=True)
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Step 2: Trigger GitHub Scan
```bash
curl -X POST "http://localhost:8000/api/scan/github" \
  -H "Content-Type: application/json" \
  -d '{
    "repository_url": "https://github.com/selwyntheo/OpenFinLib",
    "project_name": "OpenFinLib",
    "enhanced_analysis": true
  }'
```

## Method 4: Using the Scan Trigger Component

### Frontend Integration
The dashboard includes a `ScanTrigger` component that can be configured to scan GitHub repositories:

1. **Access**: Available in the dashboard header
2. **Configuration**: Can be customized for GitHub integration
3. **Real-time Updates**: Shows progress and results

## Expected Analysis Results

### For OpenFinLib Repository:
- **Code Quality Analysis**: Python/JavaScript code patterns
- **Architecture Review**: Library structure and design patterns
- **Security Assessment**: Financial library security considerations
- **Documentation Quality**: API documentation and examples
- **Dependency Analysis**: Third-party libraries and versions
- **Test Coverage**: Unit and integration test coverage

### Typical Debt Categories:
1. **Code Debt**: Complex functions, code duplication
2. **Architecture Debt**: Tight coupling, design pattern violations
3. **Infrastructure Debt**: Outdated dependencies, security vulnerabilities
4. **Documentation Debt**: Missing or outdated documentation

## Viewing Results

### Dashboard Sections:
1. **Metrics Grid**: Overview statistics
2. **Risk Distribution**: Visual risk breakdown
3. **Debt Overview Chart**: Category-wise debt analysis
4. **Trend Analysis**: Historical debt progression
5. **Project Table**: Detailed project metrics
6. **Recommendations Panel**: Actionable improvement suggestions

### API Endpoints for Results:
- `GET /api/scan/results` - Paginated scan results
- `GET /api/recommendations` - Generated recommendations
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/trends` - Trend data

## Troubleshooting

### Common Issues:
1. **Backend Not Running**: Ensure FastAPI server is started
2. **Missing Dependencies**: Install Python packages via pip
3. **Repository Access**: Ensure repository is publicly accessible
4. **Analysis Timeout**: Large repositories may take time to analyze

### Debug Commands:
```bash
# Check backend status
curl http://localhost:8000/

# Verify API endpoints
curl http://localhost:8000/docs

# Check dashboard connectivity
curl http://localhost:3000/api/results
```

## Next Steps After Scanning

1. **Review Results**: Analyze debt metrics and risk levels
2. **Prioritize Issues**: Focus on high-priority recommendations
3. **Plan Remediation**: Create action plan based on findings
4. **Monitor Progress**: Regular rescans to track improvements
5. **Team Communication**: Share findings with development team

## Advanced Configuration

### Custom Analysis Rules
- Modify `enhanced_java_dotnet.py` for language-specific rules
- Update `gitlab_debt_scanner_agent.py` for scanning logic
- Configure thresholds in backend configuration

### Integration Options
- CI/CD pipeline integration
- Automated scheduling
- Slack/Teams notifications
- JIRA issue creation

This guide provides multiple approaches to scan the OpenFinLib repository and analyze its technical debt using your Technology Debt Assessment Dashboard.
