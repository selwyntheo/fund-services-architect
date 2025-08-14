#!/bin/bash

# Technology Debt Assessment Dashboard Startup Script

echo "Starting Technology Debt Assessment Dashboard..."

# Check if we're in the dashboard directory
if [ ! -f "package.json" ]; then
    echo "Error: Please run this script from the dashboard directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if backend is running
echo "Checking if backend is running..."
if ! curl -s http://localhost:8000/ > /dev/null; then
    echo "Warning: Backend API server is not running on http://localhost:8000"
    echo "Please start the backend first:"
    echo "  cd ../backend && ./start_server.sh"
    echo ""
    echo "Continuing with frontend startup..."
fi

# Start the Next.js development server
echo "Starting Next.js development server on http://localhost:3000"
npm run dev
