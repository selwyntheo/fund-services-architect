import axios, { AxiosResponse } from 'axios';
import { 
  ScanResult, 
  CompleteScanReport, 
  ScanRequest, 
  ScanStatus,
  ApiResponse,
  PaginatedResponse,
  ProjectInfo,
  FilterOptions 
} from './types';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('auth_token') 
      : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle auth errors
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject({
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

// API Functions
export class TechnicalDebtAPI {
  // Projects
  static async getProjects(
    page = 1, 
    limit = 50, 
    filters?: Partial<FilterOptions>
  ): Promise<PaginatedResponse<ProjectInfo>> {
    const response = await apiClient.get('/projects', {
      params: { page, limit, ...filters }
    });
    return response.data;
  }

  static async getProject(id: number): Promise<ProjectInfo> {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  }

  // Scanning
  static async triggerScan(request: ScanRequest): Promise<{ scan_id: string }> {
    const response = await apiClient.post('/scan/trigger', request);
    return response.data;
  }

  static async getScanStatus(scanId: string): Promise<ScanStatus> {
    const response = await apiClient.get(`/scan/status/${scanId}`);
    return response.data;
  }

  static async cancelScan(scanId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/scan/${scanId}`);
    return response.data;
  }

  // Results and Reports
  static async getScanResults(
    page = 1,
    limit = 50,
    filters?: Partial<FilterOptions>
  ): Promise<PaginatedResponse<ScanResult>> {
    const response = await apiClient.get('/results', {
      params: { page, limit, ...filters }
    });
    return response.data;
  }

  static async getProjectResults(
    projectId: number,
    limit = 10
  ): Promise<ScanResult[]> {
    const response = await apiClient.get(`/results/project/${projectId}`, {
      params: { limit }
    });
    return response.data;
  }

  static async getLatestReport(): Promise<CompleteScanReport> {
    const response = await apiClient.get('/reports/latest');
    return response.data;
  }

  static async getHistoricalReports(
    days = 30
  ): Promise<CompleteScanReport[]> {
    const response = await apiClient.get('/reports/historical', {
      params: { days }
    });
    return response.data;
  }

  // Analytics and Metrics
  static async getDashboardMetrics(): Promise<{
    total_projects: number;
    avg_debt_score: number;
    critical_projects: number;
    scan_frequency: number;
    trend_data: any[];
  }> {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data;
  }

  static async getTrendData(
    days = 90,
    projects?: number[]
  ): Promise<any[]> {
    const response = await apiClient.get('/analytics/trends', {
      params: { days, projects: projects?.join(',') }
    });
    return response.data;
  }

  static async getRiskDistribution(): Promise<Record<string, number>> {
    const response = await apiClient.get('/analytics/risk-distribution');
    return response.data;
  }

  // Recommendations
  static async getRecommendations(
    priority?: string,
    category?: string,
    limit = 50
  ): Promise<any[]> {
    const response = await apiClient.get('/recommendations', {
      params: { priority, category, limit }
    });
    return response.data.data; // Extract the data array from API response
  }

  // Configuration
  static async getConfiguration(): Promise<any> {
    const response = await apiClient.get('/config');
    return response.data;
  }

  static async updateConfiguration(config: any): Promise<{ success: boolean }> {
    const response = await apiClient.put('/config', config);
    return response.data;
  }

  // Export functionality
  static async exportReport(
    format: 'json' | 'csv' | 'xlsx',
    filters?: Partial<FilterOptions>
  ): Promise<Blob> {
    const response = await apiClient.get('/export', {
      params: { format, ...filters },
      responseType: 'blob'
    });
    return response.data;
  }
}

// React Query keys for caching
export const queryKeys = {
  projects: ['projects'] as const,
  project: (id: number) => ['projects', id] as const,
  scanResults: ['scanResults'] as const,
  projectResults: (id: number) => ['projectResults', id] as const,
  dashboardMetrics: ['dashboardMetrics'] as const,
  trendData: ['trendData'] as const,
  recommendations: ['recommendations'] as const,
  scanStatus: (id: string) => ['scanStatus', id] as const,
} as const;

// Utility functions for API calls
export const apiUtils = {
  // Check if API is healthy
  async healthCheck(): Promise<boolean> {
    try {
      await apiClient.get('/health');
      return true;
    } catch {
      return false;
    }
  },

  // Retry failed requests
  async withRetry<T>(
    apiCall: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
    throw new Error('Max retries exceeded');
  },

  // Format error messages
  formatError(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.data?.message) return error.data.message;
    return 'An unexpected error occurred';
  },

  // Convert API response to chart data
  transformToChartData(
    data: ScanResult[],
    xField: string,
    yField: string
  ): Array<{ name: string; value: number }> {
    return data.map(item => ({
      name: item.project_info[xField as keyof ProjectInfo] as string,
      value: item.debt_metrics[yField as keyof typeof item.debt_metrics] as number
    }));
  }
};

// WebSocket for real-time updates
export class ScanWebSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<string, (data: any) => void> = new Map();

  connect(scanId: string) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    this.ws = new WebSocket(`${wsUrl}/ws/scan/${scanId}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const callback = this.listeners.get(data.type);
      if (callback) {
        callback(data);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
    };
  }

  onProgress(callback: (progress: number) => void) {
    this.listeners.set('progress', callback);
  }

  onComplete(callback: (results: CompleteScanReport) => void) {
    this.listeners.set('complete', callback);
  }

  onError(callback: (error: string) => void) {
    this.listeners.set('error', callback);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

export default TechnicalDebtAPI;