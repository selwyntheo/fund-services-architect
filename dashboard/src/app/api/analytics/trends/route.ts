import { NextRequest, NextResponse } from 'next/server';

// Generate mock trend data
function generateTrendData(days: number) {
  const data = [];
  const currentDate = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    
    // Generate realistic trend data with some variation
    const baseScore = 5.5 + Math.sin(i * 0.1) * 0.5;
    const variation = (Math.random() - 0.5) * 0.8;
    
    data.push({
      date: date.toISOString().split('T')[0],
      overall_score: Math.max(1, Math.min(10, baseScore + variation)),
      total_debt_hours: Math.floor(150 + Math.sin(i * 0.15) * 30 + Math.random() * 40),
      critical_issues: Math.floor(3 + Math.random() * 5),
      projects_scanned: Math.floor(8 + Math.random() * 4),
      categories: {
        code_debt: Math.max(1, Math.min(10, baseScore + variation * 1.2)),
        architecture_debt: Math.max(1, Math.min(10, baseScore + variation * 0.8)),
        infrastructure_debt: Math.max(1, Math.min(10, baseScore + variation * 0.6))
      }
    });
  }
  
  return data;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '90');
  const projects = searchParams.get('projects')?.split(',').map(id => parseInt(id));

  const trendData = generateTrendData(days);

  // If specific projects are requested, you could filter or modify the data
  // For now, we'll return the same trend data regardless of project filter
  
  return NextResponse.json({
    data: trendData,
    metadata: {
      days_requested: days,
      data_points: trendData.length,
      projects_filter: projects || null,
      generated_at: new Date().toISOString()
    }
  });
}
