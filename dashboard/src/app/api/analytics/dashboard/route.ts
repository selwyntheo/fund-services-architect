import { NextRequest, NextResponse } from 'next/server';

// Mock dashboard metrics
const mockDashboardMetrics = {
  total_projects: 12,
  avg_debt_score: 5.8,
  critical_projects: 3,
  scan_frequency: 85, // percentage of projects scanned in last 30 days
  total_debt_hours: 1847,
  trend_data: [
    { period: "This Week", score: 5.8, change: -0.2 },
    { period: "Last Week", score: 6.0, change: +0.3 },
    { period: "2 Weeks Ago", score: 5.7, change: -0.1 },
    { period: "3 Weeks Ago", score: 5.8, change: +0.1 }
  ],
  risk_distribution: {
    low: 4,      // 33%
    medium: 5,   // 42% 
    high: 2,     // 17%
    critical: 1  // 8%
  },
  category_breakdown: {
    code_debt: {
      avg_score: 5.4,
      total_hours: 892,
      total_issues: 156,
      trend: -0.3
    },
    architecture_debt: {
      avg_score: 6.1,
      total_hours: 567,
      total_issues: 89,
      trend: +0.1
    },
    infrastructure_debt: {
      avg_score: 6.3,
      total_hours: 388,
      total_issues: 67,
      trend: +0.2
    }
  },
  recent_scans: [
    {
      project_name: "payment-gateway",
      scan_date: "2024-01-15T14:30:00Z",
      score: 4.5,
      risk_level: "high"
    },
    {
      project_name: "customer-service-api", 
      scan_date: "2024-01-15T10:30:00Z",
      score: 6.2,
      risk_level: "medium"
    },
    {
      project_name: "notification-service",
      scan_date: "2024-01-14T16:45:00Z", 
      score: 7.1,
      risk_level: "low"
    }
  ],
  top_issues: [
    {
      type: "Security vulnerability",
      count: 8,
      avg_severity: "high",
      trend: +2
    },
    {
      type: "Complex methods",
      count: 23,
      avg_severity: "medium",
      trend: -1
    },
    {
      type: "Code duplication",
      count: 15,
      avg_severity: "medium", 
      trend: 0
    }
  ],
  performance_metrics: {
    avg_scan_time: "4.2 minutes",
    success_rate: 94.5,
    last_scan: "2024-01-15T14:30:00Z",
    next_scheduled: "2024-01-16T09:00:00Z"
  }
};

export async function GET(request: NextRequest) {
  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 100));

  return NextResponse.json({
    ...mockDashboardMetrics,
    timestamp: new Date().toISOString(),
    cache_duration: 300 // 5 minutes
  });
}
