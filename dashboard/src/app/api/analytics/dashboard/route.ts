import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    // Forward the request to the backend API
    const response = await fetch(`${BACKEND_URL}/api/analytics/dashboard`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    
    // Return empty data structure instead of mock data
    return NextResponse.json({
      total_projects: 0,
      avg_debt_score: 0,
      critical_projects: 0,
      scan_frequency: 0,
      total_debt_hours: 0,
      message: 'No analytics data available. Please run a scan first.',
      timestamp: new Date().toISOString()
    });
  }
}
