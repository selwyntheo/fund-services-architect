# Technology Debt Assessment Dashboard

A Next.js-based web dashboard for monitoring and analyzing technical debt across software projects. This application provides an intuitive interface to visualize debt metrics, run assessments, and get actionable recommendations for improving code quality.

## Features

- **Interactive Dashboard**: View technology debt metrics with visual indicators and severity levels
- **Assessment Management**: Run new assessments and track progress over time
- **Detailed Analytics**: Analyze code complexity, test coverage, dependencies, and code issues
- **Recommendations Engine**: Get specific, actionable recommendations to reduce technical debt
- **Backend Integration**: Seamlessly connects to Python backend API for analysis

## Components

- **AssessmentForm**: Interface for initiating new code assessments
- **AssessmentList**: Display and manage existing assessments
- **MetricCard**: Visualize individual debt metrics with severity indicators
- **API Client**: Type-safe client for backend communication

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Technology Debt Assessment Backend (Python) running on port 8000

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main dashboard page
├── components/          # React components
│   ├── AssessmentForm.tsx
│   ├── AssessmentList.tsx
│   └── MetricCard.tsx
├── lib/                 # Utilities and API client
│   └── api.ts
└── types/               # TypeScript type definitions
    └── debt.ts
```

## Technology Stack

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **ESLint**: Code linting and formatting

## API Integration

The dashboard communicates with a Python backend that provides:

- `/api/assessments` - Manage assessment records
- `/api/assessments/run` - Execute new assessments
- `/api/metrics` - Retrieve debt metrics
- `/api/analysis/*` - Code analysis endpoints

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is part of the Technology Debt Assessment Framework.
