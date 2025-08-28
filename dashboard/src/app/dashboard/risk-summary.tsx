import React from 'react';
import { ScanResult } from '@/lib/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface RiskSummaryProps {
  projects: ScanResult[];
}

export function RiskSummary({ projects }: RiskSummaryProps) {
  const riskData = projects.reduce((acc, project) => {
    acc[project.risk_level] = (acc[project.risk_level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(riskData).map(([risk, count]) => ({
    name: risk,
    value: count,
    color: risk === 'Low' ? '#10b981' : 
           risk === 'Medium' ? '#f59e0b' :
           risk === 'High' ? '#ef4444' : '#dc2626'
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}