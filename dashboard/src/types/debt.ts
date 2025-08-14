// Technology Debt Assessment Types

export interface DebtMetric {
  id: string;
  name: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface DebtAssessment {
  id: string;
  projectName: string;
  assessmentDate: string;
  overallScore: number;
  metrics: DebtMetric[];
  recommendations: string[];
  status: 'pending' | 'in_progress' | 'completed';
}

export interface CodebaseAnalysis {
  projectPath: string;
  language: string;
  linesOfCode: number;
  complexity: number;
  testCoverage: number;
  dependencies: Dependency[];
  issues: CodeIssue[];
}

export interface Dependency {
  name: string;
  version: string;
  isOutdated: boolean;
  securityVulnerabilities: number;
  lastUpdated: string;
}

export interface CodeIssue {
  id: string;
  type: 'smell' | 'bug' | 'vulnerability' | 'duplication';
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  line: number;
  description: string;
  suggestion: string;
}

export interface DebtTrend {
  date: string;
  score: number;
  metrics: Record<string, number>;
}
