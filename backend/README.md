# Technology Debt Assessment Backend

This is the backend API server for the Technology Debt Assessment Framework. It provides REST API endpoints for analyzing and managing technical debt across software projects.

## Features

- **RESTful API** for debt assessment operations
- **Real-time analysis** of code quality, architecture, infrastructure, and operations
- **Multi-language support** (Java, .NET, Python, JavaScript, etc.)
- **GitLab integration** for automated repository scanning
- **Comprehensive metrics** with trends and recommendations

## Quick Start

### Prerequisites

- Python 3.8 or higher
- Git

### Installation

1. Clone or navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the startup script:
   ```bash
   ./start_server.sh
   ```

This will:
- Create a Python virtual environment
- Install all dependencies
- Start the FastAPI server on `http://localhost:8000`

### Manual Installation

If you prefer to set up manually:

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start server
python api_server.py
```

## API Documentation

Once the server is running, you can access:

- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/

## API Endpoints

### Assessments
- `GET /api/assessments` - List all assessments
- `GET /api/assessments/{id}` - Get specific assessment
- `POST /api/assessments` - Create new assessment
- `POST /api/assessments/run` - Start assessment for a project
- `GET /api/assessments/{id}/status` - Check assessment status

### Metrics
- `GET /api/metrics` - Get all metrics
- `GET /api/metrics/{name}/trends` - Get metric trends

### Analysis
- `POST /api/analysis/codebase` - Analyze codebase structure
- `POST /api/analysis/dependencies` - Get dependency analysis
- `POST /api/analysis/issues` - Get code issues

## Configuration

Copy `.env.example` to `.env` and update with your settings:

```bash
cp .env.example .env
```

## Development

### Adding New Analyzers

To add support for new languages or frameworks:

1. Create a new analyzer class in the `analyzers/` directory
2. Implement the required analysis methods
3. Register the analyzer in `api_server.py`

### Database Integration

For production use, replace the in-memory storage with a proper database:

1. Install database dependencies (e.g., `pip install sqlalchemy psycopg2`)
2. Update the models to use SQLAlchemy
3. Configure database connection in `.env`

## Architecture

The backend consists of:

- **FastAPI Server** (`api_server.py`) - Main HTTP server and API routes
- **Debt Scanner** (`gitlab_debt_scanner_agent.py`) - Core assessment logic
- **Language Analyzers** (`enhanced_java_dotnet.py`) - Language-specific analysis
- **Models** - Pydantic models for API serialization

## Contributing

1. Follow PEP 8 style guidelines
2. Add tests for new features
3. Update documentation
4. Ensure all dependencies are listed in `requirements.txt`

## License

[Your License Here]
