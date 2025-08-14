import { NextRequest, NextResponse } from 'next/server';

const mockRecommendations = [
  {
    id: "rec_001",
    priority: "high",
    category: "security",
    title: "Implement encryption for sensitive data",
    description: "Payment data is currently stored in plaintext. Implement AES-256 encryption for all sensitive payment information.",
    impact: "Compliance with PCI DSS requirements and reduced security risk",
    affected_projects: ["payment-gateway", "billing-service"],
    estimated_effort: "3-5 days"
  },
  {
    id: "rec_002", 
    priority: "high",
    category: "performance",
    title: "Optimize database queries",
    description: "Multiple N+1 query patterns detected across services. Implement eager loading and query optimization.",
    impact: "Improved response times and reduced database load",
    affected_projects: ["customer-service-api", "order-service"],
    estimated_effort: "2-3 days"
  },
  {
    id: "rec_003",
    priority: "medium",
    category: "maintainability", 
    title: "Refactor complex methods",
    description: "Several methods exceed complexity thresholds. Break down into smaller, more manageable functions.",
    impact: "Improved code readability and easier testing",
    affected_projects: ["customer-service-api", "notification-service"],
    estimated_effort: "1-2 weeks"
  },
  {
    id: "rec_004",
    priority: "low",
    category: "documentation",
    title: "Update API documentation", 
    description: "API documentation is outdated and missing several endpoints. Update OpenAPI specifications.",
    impact: "Better developer experience and reduced onboarding time",
    affected_projects: ["customer-service-api", "payment-gateway"],
    estimated_effort: "3-4 days"
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const priority = searchParams.get('priority');
  const category = searchParams.get('category'); 
  const limit = parseInt(searchParams.get('limit') || '20');

  let filteredRecommendations = [...mockRecommendations];

  // Apply filters
  if (priority) {
    filteredRecommendations = filteredRecommendations.filter(
      rec => rec.priority === priority
    );
  }

  if (category) {
    filteredRecommendations = filteredRecommendations.filter(
      rec => rec.category === category
    );
  }

  // Apply limit
  filteredRecommendations = filteredRecommendations.slice(0, limit);

  return NextResponse.json({
    data: filteredRecommendations,
    total: filteredRecommendations.length
  });
}
