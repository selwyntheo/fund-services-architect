import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '90';
    const projects = searchParams.get('projects') || '';
    
    // Forward the request to the backend API
    const response = await fetch(`${BACKEND_URL}/api/analytics/trends?days=${days}&projects=${projects}`, {
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
    console.error('Error fetching trend data:', error);
    
    // Return empty data structure instead of mock data
    return NextResponse.json({
      data: [],
      metadata: {
        days_requested: parseInt(request.nextUrl.searchParams.get('days') || '90'),
        data_points: 0,
        projects_filter: null,
        generated_at: new Date().toISOString()
      },
      message: 'No trend data available. Please run a scan first.'
    });
  }
}

