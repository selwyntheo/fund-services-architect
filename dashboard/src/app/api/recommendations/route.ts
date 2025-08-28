import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const priority = searchParams.get('priority') || '';
    const category = searchParams.get('category') || '';
    const limit = searchParams.get('limit') || '20';
    
    // Forward the request to the backend API
    const response = await fetch(`${BACKEND_URL}/api/recommendations?priority=${priority}&category=${category}&limit=${limit}`, {
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
    console.error('Error fetching recommendations:', error);
    
    // Return empty data structure instead of mock data
    return NextResponse.json({
      data: [],
      message: 'No recommendations available. Please run a scan first.',
      timestamp: new Date().toISOString()
    });
  }
}