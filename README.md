# Technology Debt Assessment Framework

A comprehensive framework for assessing and managing technical debt across software projects. The framework provides automated analysis of code quality, architecture, infrastructure, and operational practices.

## Architecture

The system consists of two main components:

- **Backend API** (`/backend`) - Python FastAPI server providing REST endpoints for debt analysis
- **Frontend Dashboard** (`/dashboard`) - Next.js React application providing a web UI

## Features

### Backend Features
- **Multi-language Analysis** - Support for Java, .NET, Python, JavaScript, and more
- **Comprehensive Metrics** - Code quality, architecture, infrastructure, and operations
- **GitLab Integration** - Automated repository scanning and CI/CD analysis
- **RESTful API** - Clean REST endpoints for all operations
- **Real-time Analysis** - Background processing with status tracking

### Frontend Features
- **Interactive Dashboard** - Modern React UI with real-time updates
- **Assessment Management** - Create, view, and track debt assessments
- **Metrics Visualization** - Charts and graphs for trend analysis
- **Project Analysis** - Detailed codebase and dependency analysis
- **Responsive Design** - Works on desktop and mobile devices

## Quick Start

### Prerequisites
- **Python 3.8+** for the backend
- **Node.js 18+** for the frontend
- **Git** for version control

### 1. Start the Backend

```bash
cd backend
./start_server.sh
```

This will:
- Create a Python virtual environment
- Install all Python dependencies
- Start the FastAPI server on `http://localhost:8000`

### 2. Start the Frontend

```bash
cd dashboard
./start_dashboard.sh
```

This will:
- Install Node.js dependencies
- Start the Next.js development server on `http://localhost:3000`

### 3. Access the Application

- **Dashboard UI**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **API Health Check**: http://localhost:8000

## Usage

### Running an Assessment

1. Open the dashboard at http://localhost:3000
2. Click "New Assessment"
3. Enter the path to your project directory
4. Click "Start Assessment"
5. View results in real-time as analysis completes

### API Integration

The backend provides REST endpoints for programmatic access:

```bash
# Get all assessments
curl http://localhost:8000/api/assessments

# Run assessment for a project
curl -X POST http://localhost:8000/api/assessments/run \\
  -H "Content-Type: application/json" \\
  -d '{"project_path": "/path/to/your/project"}'

# Analyze codebase structure
curl -X POST http://localhost:8000/api/analysis/codebase \\
  -H "Content-Type: application/json" \\
  -d '{"project_path": "/path/to/your/project"}'
```

## Supported Languages and Frameworks

### Languages
- **Java** - Spring Boot, Maven, Gradle projects
- **.NET** - .NET Core, .NET Framework, NuGet packages
- **Python** - pip, poetry, conda environments
- **JavaScript/TypeScript** - npm, yarn, Node.js projects
- **Go** - Go modules
- **Rust** - Cargo projects

### Frameworks and Tools
- **Build Systems** - Maven, Gradle, npm, pip, cargo
- **CI/CD** - GitLab CI, GitHub Actions, Jenkins
- **Testing** - JUnit, pytest, Jest, Go test
- **Quality Tools** - SonarQube, ESLint, Pylint

## Configuration

### Backend Configuration

Copy the example environment file and customize:

```bash
cd backend
cp .env.example .env
# Edit .env with your settings
```

### Frontend Configuration

The frontend automatically connects to the backend on `localhost:8000`. To change this:

```bash
cd dashboard
echo "NEXT_PUBLIC_API_URL=http://your-backend-url" > .env.local
```

## Project Structure

```
technology-debt/
├── backend/                    # Python FastAPI backend
│   ├── api_server.py          # Main API server
│   ├── gitlab_debt_scanner_agent.py  # Core analysis logic
│   ├── enhanced_java_dotnet.py # Language-specific analyzers
│   ├── requirements.txt       # Python dependencies
│   ├── start_server.sh       # Backend startup script
│   └── README.md             # Backend documentation
├── dashboard/                 # Next.js frontend
│   ├── src/
│   │   ├── app/              # Next.js app router pages
│   │   ├── components/       # React components
│   │   ├── lib/             # API client and utilities
│   │   └── types/           # TypeScript type definitions
│   ├── package.json         # Node.js dependencies
│   ├── start_dashboard.sh   # Frontend startup script
│   └── README.md           # Frontend documentation
└── README.md               # This file
```

## Development

### Adding New Language Support

1. Create a new analyzer class in `backend/analyzers/`
2. Implement the required analysis methods
3. Register the analyzer in `api_server.py`
4. Update the frontend types if needed

### API Development

The backend uses FastAPI with automatic OpenAPI documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Frontend Development

The frontend uses modern React patterns:
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Query** for API state management

## Testing

### Backend Tests
```bash
cd backend
python test_api.py  # Basic API testing
```

### Frontend Tests
```bash
cd dashboard
npm test            # Run Jest tests
npm run test:e2e    # Run Playwright e2e tests
```

## Deployment

### Production Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn api_server:app --host 0.0.0.0 --port 8000
```

### Production Frontend
```bash
cd dashboard
npm run build
npm start
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation in `/backend/README.md` and `/dashboard/README.md`
- Review the API documentation at http://localhost:8000/docs
