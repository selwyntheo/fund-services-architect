# Frontend Deployment Guide

## Quick Setup for New Machine

### Prerequisites
- **Node.js 18+** (Download from [nodejs.org](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

### Option 1: Automated Setup (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/selwyntheo/fund-services-architect.git
   cd fund-services-architect/dashboard
   ```

2. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

3. **Start the application:**
   ```bash
   npm start  # Production mode
   # OR
   npm run dev  # Development mode
   ```

### Option 2: Manual Setup

1. **Clone and navigate:**
   ```bash
   git clone https://github.com/selwyntheo/fund-services-architect.git
   cd fund-services-architect/dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   # Create environment file
   cp .env.example .env.local
   
   # Edit .env.local with your settings
   nano .env.local
   ```

4. **Build and start:**
   ```bash
   # For production
   npm run build
   npm start
   
   # For development
   npm run dev
   ```

## Environment Configuration

Create a `.env.local` file in the dashboard directory:

```bash
# Backend API URL - IMPORTANT: Update this to match your backend
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# App Configuration
NEXT_PUBLIC_APP_NAME="Technical Debt Dashboard"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Optional configurations
# NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

## Common Issues and Solutions

### 1. Path Alias Issues (`@/lib/utils` not found)

**Problem:** Getting errors like "Module not found: Can't resolve @lib/utils" or "Can't resolve @/lib/api"

**Root Cause:** 
- Incorrect import paths using `@lib/` instead of `@/lib/`
- Missing TypeScript configuration
- Incorrect Node.js/npm version

**Solution:**
```bash
# Quick fix - run the automated import fixer
./fix-imports.sh

# Manual fix if needed
find src/ -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/@lib\//@\/lib\//g'

# Clean reinstall
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

**Verify the fix:**
```bash
# Check TypeScript compilation
npx tsc --noEmit --skipLibCheck

# Check for incorrect imports
grep -r "@lib/" src/  # Should return nothing

# Test build
npm run build
```

### 2. Port Already in Use

**Problem:** Port 3000 is already in use

**Solution:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use a different port
npm start -- -p 3001
```

### 3. Backend Connection Issues

**Problem:** Dashboard can't connect to backend

**Solution:**
1. Ensure backend is running on port 8000
2. Update `NEXT_PUBLIC_BACKEND_URL` in `.env.local`
3. Check firewall settings

## Production Deployment

### Using PM2 (Recommended for production)

1. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

2. **Build and start with PM2:**
   ```bash
   npm run build
   pm2 start npm --name "tech-debt-dashboard" -- start
   ```

3. **Setup auto-restart:**
   ```bash
   pm2 startup
   pm2 save
   ```

### Using Docker

1. **Create Dockerfile** (in dashboard directory):
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and run:**
   ```bash
   docker build -t tech-debt-dashboard .
   docker run -p 3000:3000 -e NEXT_PUBLIC_BACKEND_URL=http://your-backend:8000 tech-debt-dashboard
   ```

### Using Nginx (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## File Structure Reference

```
dashboard/
├── src/
│   ├── app/                    # Next.js pages (App Router)
│   │   ├── dashboard/          # Main dashboard page
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── dashboard/         # Dashboard-specific components
│   │   ├── forms/            # Form components
│   │   ├── charts/           # Chart components
│   │   └── ui/               # UI components
│   ├── lib/                  # Utilities and API client
│   │   ├── api.ts           # Backend API client ← Important!
│   │   ├── types.ts         # TypeScript definitions
│   │   └── utils.ts         # Utility functions
│   └── types/               # Additional type definitions
├── public/                   # Static assets
├── package.json             # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── next.config.ts          # Next.js configuration
├── setup.sh               # Automated setup script
└── .env.local             # Environment variables (create this)
```

## Troubleshooting

### Check System Requirements
```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Check if ports are available
netstat -an | grep 3000
netstat -an | grep 8000
```

### Clear and Reinstall
```bash
# Clean install
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

### Verify Backend Connection
```bash
# Test backend API
curl http://localhost:8000/
curl http://localhost:8000/docs
```

## Support

If you encounter issues:

1. **Check the logs:**
   ```bash
   npm run dev  # Development mode shows detailed errors
   ```

2. **Verify environment:**
   ```bash
   cat .env.local  # Check environment variables
   ```

3. **Test API connection:**
   - Open browser to: http://localhost:8000/docs
   - Verify backend is responding

4. **Common fixes:**
   - Restart both frontend and backend
   - Clear browser cache
   - Check network connectivity

## Additional Resources

- **Next.js Documentation:** https://nextjs.org/docs
- **React Documentation:** https://react.dev/
- **Backend API Documentation:** http://localhost:8000/docs (when running)
