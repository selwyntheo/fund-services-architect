import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Mock scan trigger - replace with actual backend call
  const scanId = `scan_${Date.now()}`;
  
  return NextResponse.json({
    scan_id: scanId,
    message: 'Scan triggered successfully'
  });
}