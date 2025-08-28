#!/bin/bash

# Technology Debt Dashboard - Production Setup Script
# This script sets up and starts the dashboard on a new machine

set -e

echo "🚀 Setting up Technology Debt Dashboard..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists, if not create it
if [ ! -f ".env.local" ]; then
    echo "🔧 Creating environment configuration..."
    cat > .env.local << EOF
# Backend API URL - Update this to match your backend server
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Dashboard Configuration
NEXT_PUBLIC_APP_NAME="Technical Debt Dashboard"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Optional: Analytics and monitoring
# NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
EOF
    echo "✅ Created .env.local with default settings"
    echo "📝 You can modify .env.local to match your backend URL"
else
    echo "✅ Using existing .env.local configuration"
fi

# Build the application for production
echo "🏗️  Building application for production..."
npm run build

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Update NEXT_PUBLIC_BACKEND_URL in .env.local if needed"
echo "  2. Make sure your backend server is running"
echo "  3. Start the dashboard:"
echo ""
echo "     npm start              (production mode)"
echo "     npm run dev            (development mode)"
echo ""
echo "  4. Access the dashboard at: http://localhost:3000"
echo ""
echo "� If you encounter import issues:"
echo "     ./fix-imports.sh       (fix @lib/ import path issues)"
echo "     ./troubleshoot.sh      (diagnose other problems)"
echo ""
echo "�🔗 Links:"
echo "  Dashboard: http://localhost:3000"
echo "  Backend API: http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
