import { NextRequest, NextResponse } from 'next/server';

const mockScanResults = [
  {
    project_info: {
      id: 1,
      name: "customer-service-api",
      path: "backend/customer-service-api",
      web_url: "https://gitlab.company.com/backend/customer-service-api",
      default_branch: "main",
      last_activity_at: "2024-01-15T10:30:00Z",
      languages: { "Java": 75.2, "YAML": 15.8, "Dockerfile": 9.0 }
    },
    debt_metrics: {
      code_quality_score: 5.8,
      architecture_score: 6.5,
      infrastructure_score: 7.1,
      operations_score: 6.8,
      overall_score: 6.2,
      raw_metrics: {}
    },
    scan_timestamp: "2024-01-15T10:30:00Z",
    risk_level: "Medium",
    total_debt_hours: 156,
    categories: {
      code_debt: { score: 5.8, hours: 89, issues: 23 },
      architecture_debt: { score: 6.5, hours: 45, issues: 12 },
      infrastructure_debt: { score: 7.1, hours: 22, issues: 7 }
    },
    issues: [
      {
        id: "issue_001",
        type: "code_debt",
        severity: "high",
        title: "Complex method needs refactoring",
        description: "Method has cyclomatic complexity of 15",
        file_path: "src/main/java/CustomerService.java",
        line_number: 145,
        estimated_hours: 8
      },
      {
        id: "issue_002", 
        type: "architecture_debt",
        severity: "medium",
        title: "Tight coupling between services",
        description: "Direct database access instead of using repository pattern",
        file_path: "src/main/java/PaymentController.java",
        line_number: 67,
        estimated_hours: 12
      }
    ],
    recommendations: [
      "Refactor CustomerService.processPayment() method",
      "Implement repository pattern for data access",
      "Add unit tests for payment validation"
    ]
  },
  {
    project_info: {
      id: 2,
      name: "payment-gateway",
      path: "backend/payment-gateway",
      web_url: "https://gitlab.company.com/backend/payment-gateway",
      default_branch: "main",
      last_activity_at: "2024-01-14T16:45:00Z",
      languages: { "C#": 82.5, "JSON": 12.3, "Dockerfile": 5.2 }
    },
    debt_metrics: {
      code_quality_score: 4.2,
      architecture_score: 4.8,
      infrastructure_score: 5.1,
      operations_score: 4.5,
      overall_score: 4.5,
      raw_metrics: {}
    },
    scan_timestamp: "2024-01-14T16:45:00Z",
    risk_level: "High",
    total_debt_hours: 234,
    categories: {
      code_debt: { score: 4.2, hours: 145, issues: 34 },
      architecture_debt: { score: 4.8, hours: 67, issues: 18 },
      infrastructure_debt: { score: 5.1, hours: 22, issues: 9 }
    },
    issues: [
      {
        id: "issue_003",
        type: "code_debt",
        severity: "critical",
        title: "Security vulnerability in payment processing",
        description: "Plaintext storage of sensitive payment data",
        file_path: "src/Payment/PaymentProcessor.cs",
        line_number: 89,
        estimated_hours: 24
      }
    ],
    recommendations: [
      "Implement encryption for payment data storage",
      "Add input validation for payment requests",
      "Implement proper error handling"
    ]
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '100');
  const projectId = searchParams.get('project_id');
  const riskLevel = searchParams.get('risk_level');

  let filteredResults = [...mockScanResults];

  // Apply filters
  if (projectId) {
    filteredResults = filteredResults.filter(
      result => result.project_info.id === parseInt(projectId)
    );
  }

  if (riskLevel) {
    filteredResults = filteredResults.filter(
      result => result.risk_level.toLowerCase() === riskLevel.toLowerCase()
    );
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  return NextResponse.json({
    data: paginatedResults,
    pagination: {
      page,
      limit,
      total: filteredResults.length,
      pages: Math.ceil(filteredResults.length / limit)
    }
  });
}
