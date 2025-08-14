import { NextRequest, NextResponse } from 'next/server';

const mockProjects = [
  {
    id: 1,
    name: "customer-service-api",
    path: "backend/customer-service-api",
    web_url: "https://gitlab.company.com/backend/customer-service-api",
    default_branch: "main",
    last_activity_at: "2024-01-15T10:30:00Z",
    languages: { "Java": 75.2, "YAML": 15.8, "Dockerfile": 9.0 }
  },
  {
    id: 2,
    name: "payment-gateway", 
    path: "backend/payment-gateway",
    web_url: "https://gitlab.company.com/backend/payment-gateway",
    default_branch: "main",
    last_activity_at: "2024-01-14T16:45:00Z",
    languages: { "C#": 82.5, "JSON": 12.3, "Dockerfile": 5.2 }
  }
];

export async function GET() {
  return NextResponse.json({
    data: mockProjects,
    pagination: {
      page: 1,
      limit: 50,
      total: mockProjects.length,
      pages: 1
    }
  });
}