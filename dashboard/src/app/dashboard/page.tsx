'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TechnicalDebtAPI, queryKeys } from '@/lib/api';
import { MetricsGrid } from '@/components/dashboard/metrics';
import { ProjectTable } from '@/components/dashboard/project-table';
import { RiskSummary } from '@/components/dashboard/risk-summary';
import { RecommendationsPanel } from '@/components/dashboard/recommendation';
import { DebtOverviewChart } from '@/components/charts/debt-overview-chart';
import { TrendChart } from '@/components/charts/trend-chart';
import { ScanTrigger } from '@/components/forms/scan-trigger';
import { FiltersPanel } from '@/components/forms/filters';
import { TenStepFramework } from '@/components/dashboard/ten-step-framework';
import { LoadingSpinner } from '@/components/ui/loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Settings, Target, BarChart3 } from 'lucide-react';
import { FilterOptions } from '@/lib/types';

export default function DashboardPage() {
  const [filters, setFilters] = useState<Partial<FilterOptions>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'framework'>('dashboard');
  const [currentStep, setCurrentStep] = useState(7);

  // Fetch dashboard data
  const {
    data: metrics,
    isLoading: metricsLoading,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: queryKeys.dashboardMetrics,
    queryFn: TechnicalDebtAPI.getDashboardMetrics,
    refetchInterval: autoRefresh ? 30000 : false, // 30 seconds
  });

  const {
    data: scanResults,
    isLoading: resultsLoading,
    refetch: refetchResults,
  } = useQuery({
    queryKey: ['scanResults', filters],
    queryFn: () => TechnicalDebtAPI.getScanResults(1, 100, filters),
  });

  const {
    data: trendData,
    isLoading: trendLoading,
  } = useQuery({
    queryKey: queryKeys.trendData,
    queryFn: () => TechnicalDebtAPI.getTrendData(90),
  });

  const {
    data: recommendations,
    isLoading: recommendationsLoading,
  } = useQuery({
    queryKey: queryKeys.recommendations,
    queryFn: () => TechnicalDebtAPI.getRecommendations('high', undefined, 20),
  });

  const handleRefresh = () => {
    refetchMetrics();
    refetchResults();
  };

  const handleExport = async (format: 'json' | 'csv' | 'xlsx') => {
    try {
      const blob = await TechnicalDebtAPI.exportReport(format, filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `debt-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const isLoading = metricsLoading || resultsLoading;
  
  // Keep original scan results for components that need ScanResult[]
  const scanResultsData = scanResults?.data || [];
  
  // Transform ScanResult data to Project format for ProjectTable
  const projects = scanResultsData.map((scanResult, index) => {
    // Make sure we have a valid scanResult object
    if (!scanResult || typeof scanResult !== 'object') {
      return {
        id: `project-${index}`,
        name: 'Invalid Project Data',
        debtScore: 0,
        riskLevel: 'Low' as const,
        lastScan: 'Never',
        issues: 0
      };
    }
    
    return {
      id: scanResult?.project_info?.id?.toString() || `project-${index}`,
      name: scanResult?.project_info?.name || 'Unknown Project',
      debtScore: typeof scanResult?.debt_metrics?.overall_score === 'number' ? scanResult.debt_metrics.overall_score : 0,
      riskLevel: (scanResult?.risk_level as 'Low' | 'Medium' | 'High' | 'Critical') || 'Low',
      lastScan: scanResult?.scan_timestamp ? new Date(scanResult.scan_timestamp).toLocaleDateString() : 'Never',
      issues: Math.floor(Math.random() * 20) + 5 // Placeholder for now
    };
  });

  // Calculate risk distribution for RiskSummary
  const riskCounts = projects.reduce((acc, project) => {
    acc[project.riskLevel] = (acc[project.riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalProjects = projects.length;
  const riskData = Object.entries(riskCounts).map(([level, count]) => ({
    level: level as 'Low' | 'Medium' | 'High' | 'Critical',
    count,
    percentage: Math.round((count / totalProjects) * 100)
  }));

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    if (step === 7) {
      // When user navigates to step 7, switch to dashboard view
      setActiveView('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Technical Debt Management System
              </h1>
              <p className="text-muted-foreground mt-1">
                {activeView === 'framework' 
                  ? 'Ten-Step Framework for Measuring & Remediating Technical Debt'
                  : 'Monitor and manage technical debt across your organization'
                }
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={activeView === 'dashboard' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('dashboard')}
                  className="px-4"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant={activeView === 'framework' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveView('framework')}
                  className="px-4"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Framework
                </Button>
              </div>
              
              {activeView === 'dashboard' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport('xlsx')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                  
                  <ScanTrigger />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel - Only show in dashboard view */}
      {activeView === 'dashboard' && showFilters && (
        <FiltersPanel
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      <div className="container mx-auto px-6 py-6">
        {activeView === 'framework' ? (
          /* Framework View */
          <TenStepFramework 
            currentStepData={currentStep === 7 ? { scanResults: scanResultsData, metrics } : undefined}
            onStepChange={handleStepChange}
          />
        ) : (
          /* Dashboard View */
          <>
            {isLoading && !metrics ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Step 7 Integration Banner */}
                {currentStep === 7 && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                            <Settings className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-blue-900">Step 7: Automate Debt Detection</h3>
                            <p className="text-blue-700 text-sm">
                              You're currently viewing the automated debt detection dashboard. All scanning functionality represents Step 7 of the framework.
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setActiveView('framework')}
                          className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          <Target className="w-4 h-4 mr-2" />
                          View Framework
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Key Metrics */}
                <MetricsGrid 
                  metrics={[
                    {
                      id: 'total_projects',
                      name: 'Total Projects',
                      value: metrics?.total_projects || 0,
                      description: 'Projects under monitoring',
                      severity: 'low'
                    },
                    {
                      id: 'avg_debt_score',
                      name: 'Average Debt Score',
                      value: metrics?.avg_debt_score || 0,
                      description: 'Overall debt rating',
                      severity: (metrics?.avg_debt_score || 0) > 7 ? 'low' : (metrics?.avg_debt_score || 0) > 5 ? 'medium' : 'high'
                    },
                    {
                      id: 'critical_projects',
                      name: 'Critical Projects',
                      value: metrics?.critical_projects || 0,
                      description: 'Projects with critical debt',
                      severity: 'critical'
                    },
                    {
                      id: 'scan_frequency',
                      name: 'Scan Coverage',
                      value: metrics?.scan_frequency || 0,
                      description: 'Percentage of projects scanned',
                      severity: (metrics?.scan_frequency || 0) > 80 ? 'low' : 'medium'
                    }
                  ]}
                />

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Risk Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Risk Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RiskSummary riskData={riskData} />
                    </CardContent>
                  </Card>

                  {/* Debt Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Debt by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DebtOverviewChart data={scanResultsData} />
                    </CardContent>
                  </Card>
                </div>

                {/* Trend Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle>Debt Trends (Last 90 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {trendLoading ? (
                      <div className="h-64 flex items-center justify-center">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      <TrendChart data={trendData || []} />
                    )}
                  </CardContent>
                </Card>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Projects Table */}
                  <div className="xl:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Projects Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ProjectTable
                          projects={projects}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recommendations Sidebar */}
                  <div className="xl:col-span-1">
                    <Card>
                      <CardHeader>
                        <CardTitle>Priority Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <RecommendationsPanel
                          recommendations={recommendations || []}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Auto-refresh Toggle */}
                <div className="flex justify-end">
                  <label className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span>Auto-refresh every 30s</span>
                  </label>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}