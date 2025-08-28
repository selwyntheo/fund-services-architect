#!/bin/bash

# Technology Debt Dashboard - Troubleshooting Script
# Run this script to diagnose and fix common issues

set -e

echo "🔍 Technology Debt Dashboard - Troubleshooting"
echo "============================================="

# Function to check command availability
check_command() {
    if command -v $1 &> /dev/null; then
        echo "✅ $1 is installed: $(which $1)"
        return 0
    else
        echo "❌ $1 is not installed"
        return 1
    fi
}

# Function to check port availability
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is in use"
        echo "   Process using port $1:"
        lsof -Pi :$1 -sTCP:LISTEN
        return 1
    else
        echo "✅ Port $1 is available"
        return 0
    fi
}

echo ""
echo "1. Checking System Requirements"
echo "------------------------------"

# Check Node.js
if check_command "node"; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        echo "✅ Node.js version is compatible: $(node --version)"
    else
        echo "❌ Node.js version $(node --version) is too old. Requires 18+"
        echo "   Please update Node.js: https://nodejs.org/"
        exit 1
    fi
else
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js 18+: https://nodejs.org/"
    exit 1
fi

# Check npm
check_command "npm" || {
    echo "❌ npm is not installed"
    exit 1
}

echo ""
echo "2. Checking Project Structure"
echo "----------------------------"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Are you in the dashboard directory?"
    echo "   Run: cd /path/to/technology-debt/dashboard"
    exit 1
fi

echo "✅ package.json found"

# Check important files
FILES=("src/lib/api.ts" "src/lib/types.ts" "src/lib/utils.ts" "tsconfig.json")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "3. Checking Dependencies"
echo "-----------------------"

if [ -d "node_modules" ]; then
    echo "✅ node_modules directory exists"
    
    # Check critical dependencies
    DEPS=("next" "react" "typescript" "@tanstack/react-query")
    for dep in "${DEPS[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            echo "✅ $dep installed"
        else
            echo "❌ $dep missing"
        fi
    done
else
    echo "❌ node_modules directory missing"
    echo "   Run: npm install"
fi

echo ""
echo "4. Checking Environment Configuration"
echo "-----------------------------------"

if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
    echo "   Backend URL: $(grep NEXT_PUBLIC_BACKEND_URL .env.local || echo 'Not set')"
else
    echo "⚠️  .env.local not found"
    echo "   Creating default .env.local..."
    cp .env.example .env.local
    echo "✅ Created .env.local from template"
fi

echo ""
echo "5. Checking Port Availability"
echo "----------------------------"

check_port 3000
check_port 8000

echo ""
echo "6. Checking Backend Connectivity"
echo "-------------------------------"

BACKEND_URL=$(grep NEXT_PUBLIC_BACKEND_URL .env.local 2>/dev/null | cut -d'=' -f2 || echo "http://localhost:8000")

if curl -s "$BACKEND_URL" >/dev/null; then
    echo "✅ Backend is reachable at $BACKEND_URL"
else
    echo "❌ Backend is not reachable at $BACKEND_URL"
    echo "   Make sure the backend server is running"
    echo "   Check the backend setup: cd ../backend && ./start_server.sh"
fi

echo ""
echo "7. Running Diagnostic Tests"
echo "--------------------------"

# Test TypeScript compilation
echo "Testing TypeScript compilation..."
if npx tsc --noEmit --skipLibCheck; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    echo "   Check for type errors in your code"
fi

# Check for incorrect import paths
echo ""
echo "Checking for common import path issues..."
if grep -r "from ['\"]@lib" src/ 2>/dev/null; then
    echo "❌ Found incorrect import paths using @lib/ instead of @/lib/"
    echo "   These need to be fixed manually"
else
    echo "✅ No incorrect @lib/ import paths found"
fi

if grep -r "import.*@lib" src/ 2>/dev/null; then
    echo "❌ Found incorrect import statements using @lib/"
    echo "   These should use @/lib/ instead"
else
    echo "✅ No incorrect @lib import statements found"
fi

echo ""
echo "8. Suggested Fixes"
echo "-----------------"

if [ ! -d "node_modules" ]; then
    echo "🔧 Fix: Install dependencies"
    echo "   npm install"
fi

if ! check_port 3000 >/dev/null 2>&1; then
    echo "🔧 Fix: Free up port 3000"
    echo "   npx kill-port 3000"
    echo "   # Or use different port: npm run dev -- -p 3001"
fi

if ! curl -s "$BACKEND_URL" >/dev/null 2>&1; then
    echo "🔧 Fix: Start backend server"
    echo "   cd ../backend"
    echo "   ./start_server.sh"
fi

# Check for incorrect import paths and suggest fixes
if grep -r "from ['\"]@lib" src/ 2>/dev/null || grep -r "import.*@lib" src/ 2>/dev/null; then
    echo "🔧 Fix: Incorrect import paths detected"
    echo "   Replace @lib/ with @/lib/ in all import statements"
    echo "   Run this command to fix automatically:"
    echo "   find src/ -name '*.ts' -o -name '*.tsx' | xargs sed -i '' 's/@lib\//@\/lib\//g'"
fi

echo ""
echo "9. Quick Start Commands"
echo "---------------------"
echo "To fix most issues, run these commands in order:"
echo ""
echo "   # Clean reinstall"
echo "   rm -rf node_modules package-lock.json .next"
echo "   npm install"
echo ""
echo "   # Create environment file"
echo "   cp .env.example .env.local"
echo ""
echo "   # Build and start"
echo "   npm run build"
echo "   npm start"
echo ""
echo "   # Or for development"
echo "   npm run dev"
echo ""

echo "🎉 Troubleshooting complete!"
echo ""
echo "If issues persist:"
echo "- Check the DEPLOYMENT.md file for detailed instructions"
echo "- Verify your Node.js version is 18+"
echo "- Ensure the backend server is running on port 8000"
echo "- Check network connectivity and firewall settings"
