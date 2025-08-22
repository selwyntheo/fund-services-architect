import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    
    // Forward the request to the backend API
    const response = await fetch(`${BACKEND_URL}/api/scan/results?page=${page}&limit=${limit}`, {
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
    console.error('Error fetching scan results:', error);
    
    // Return empty data structure instead of mock data
    return NextResponse.json({
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      },
      message: 'No scan results available. Please run a scan first.',
      timestamp: new Date().toISOString()
    });
  }
}
