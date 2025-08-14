import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ScanResult } from '@/lib/types';

interface DebtOverviewChartProps {
  data: ScanResult[];
}

export function DebtOverviewChart({ data }: DebtOverviewChartProps) {
  // Filter out invalid data and add safety checks
  const validData = (data || []).filter(project => 
    project && 
    typeof project === 'object' &&
    project.project_info &&
    project.debt_metrics &&
    project.project_info.name &&
    typeof project.debt_metrics.code_quality_score === 'number'
  );

  const chartData = validData.slice(0, 10).map((project, index) => {
    const name = project.project_info?.name || `Project ${index + 1}`;
    const truncatedName = name.length > 15 ? name.slice(0, 15) + '...' : name;
    
    return {
      name: truncatedName,
      'Code Quality': project.debt_metrics?.code_quality_score || 0,
      'Architecture': project.debt_metrics?.architecture_score || 0,
      'Infrastructure': project.debt_metrics?.infrastructure_score || 0,
      'Operations': project.debt_metrics?.operations_score || 0,
    };
  });

  // Show a message if no valid data
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        No data available for chart
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
        <YAxis domain={[0, 4]} />
        <Tooltip />
        <Bar dataKey="Code Quality" fill="#8b5cf6" />
        <Bar dataKey="Architecture" fill="#06b6d4" />
        <Bar dataKey="Infrastructure" fill="#10b981" />
        <Bar dataKey="Operations" fill="#f59e0b" />
      </BarChart>
    </ResponsiveContainer>
  );
}