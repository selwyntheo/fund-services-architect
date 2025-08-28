// Technical Debt Types
export interface DebtMetrics {
  code_quality_score: number;
  architecture_score: number;
  infrastructure_score: number;
  operations_score: number;
  overall_score: number;
  raw_metrics: Record<string, any>;
}

export interface ProjectInfo {
  id: number;
  name: string;
  path: string;
  web_url: string;
  default_branch: string;
  last_activity_at: string;
  languages?: Record<string, number>;
}

export interface ScanResult {
  project_info: ProjectInfo;
  debt_metrics: DebtMetrics;
  scan_timestamp: string;
  risk_level: RiskLevel;
  recommendations?: string[];
  error?: string;
}

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface ScanSummary {
  total_projects: number;
  successful_scans: number;
  failed_scans: number;
  scan_date: string;
  risk_distribution: Record<RiskLevel, number>;
  top_debt_projects: Array<[string, number, RiskLevel]>;
  recommendations: string[];
}

export interface CompleteScanReport {
  scan_summary: ScanSummary;
  detailed_results: ScanResult[];
}

// Java-specific types
export interface JavaAnalysis {
  uses_spring: boolean;
  uses_spring_boot: boolean;
  uses_spring_security: boolean;
  java_version: string;
  maven_dependency_count: number;
  java_test_to_main_ratio: number;
  java_god_class_ratio: number;
  java_has_layered_architecture: boolean;
  java_package_organization_score: number;
  java_security_issues: number;
  checkstyle_violations?: number;
  spotbugs_issues?: number;
}

// .NET-specific types
export interface DotNetAnalysis {
  dotnet_uses_aspnetcore: boolean;
  dotnet_uses_efcore: boolean;
  dotnet_uses_modern_framework: boolean;
  dotnet_target_frameworks: string[];
  dotnet_has_clean_architecture: boolean;
  dotnet_uses_dependency_injection: boolean;
  dotnet_test_file_ratio: number;
  dotnet_god_class_ratio: number;
  dotnet_security_issues: number;
  dotnet_solution_projects: number;
}

// Dashboard types
export interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface TrendData {
  date: string;
  overall_score: number;
  code_quality: number;
  architecture: number;
  infrastructure: number;
  operations: number;
}

export interface FilterOptions {
  business_units: string[];
  risk_levels: RiskLevel[];
  languages: string[];
  date_range: {
    start: string;
    end: string;
  };
  project_name?: string;
}

// API types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ScanRequest {
  group_id?: number;
  project_ids?: number[];
  filters?: {
    last_activity_days: number;
    max_projects: number;
    languages?: string[];
  };
  enhanced_analysis?: boolean;
}

export interface ScanStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
  started_at: string;
  completed_at?: string;
  results?: CompleteScanReport;
  error?: string;
}

// Table types for data display
export interface ProjectTableRow {
  id: number;
  name: string;
  business_unit: string;
  risk_level: RiskLevel;
  overall_score: number;
  code_quality: number;
  architecture: number;
  infrastructure: number;
  operations: number;
  last_scan: string;
  languages: string[];
  recommendations_count: number;
}

export interface RecommendationItem {
  id: string;
  project_id: number;
  project_name: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  category: 'code' | 'architecture' | 'infrastructure' | 'operations';
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  priority_score: number;
}

// Configuration types
export interface DashboardConfig {
  refresh_interval: number;
  auto_refresh: boolean;
  default_filters: FilterOptions;
  chart_preferences: {
    default_chart_type: 'bar' | 'line' | 'radar' | 'pie';
    show_trend_lines: boolean;
    color_scheme: 'default' | 'colorblind' | 'high_contrast';
  };
  table_preferences: {
    default_page_size: number;
    sortable_columns: string[];
    visible_columns: string[];
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  dashboard_config: DashboardConfig;
  notifications: {
    email: boolean;
    browser: boolean;
    critical_alerts: boolean;
    weekly_summary: boolean;
  };
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  user_message?: string;
}

// Form types
export interface ScanFormData {
  group_id?: string;
  project_ids: string[];
  enhanced_analysis: boolean;
  max_projects: number;
  activity_days: number;
  languages: string[];
  webhook_url?: string;
}

export interface FilterFormData {
  business_units: string[];
  risk_levels: RiskLevel[];
  languages: string[];
  date_from: string;
  date_to: string;
  search: string;
}

// Export utility type for component props
export type ComponentProps<T = {}> = T & {
  className?: string;
  children?: React.ReactNode;
};