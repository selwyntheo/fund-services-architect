'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

function MetricCard({ title, value, description, severity }: MetricCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(severity)}`}>
          {severity}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toFixed(1)}</div>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

interface MetricsGridProps {
  metrics?: any[];
}

export function MetricsGrid({ metrics = [] }: MetricsGridProps) {
  // Default metrics if none provided
  const defaultMetrics = [
    {
      id: 'code_quality',
      name: 'Code Quality',
      value: 7.5,
      description: 'Overall code quality score',
      severity: 'medium' as const
    },
    {
      id: 'architecture',
      name: 'Architecture',
      value: 8.2,
      description: 'Architecture quality and design patterns',
      severity: 'low' as const
    },
    {
      id: 'infrastructure',
      name: 'Infrastructure',
      value: 6.1,
      description: 'Infrastructure and deployment quality',
      severity: 'high' as const
    },
    {
      id: 'operations',
      name: 'Operations',
      value: 5.8,
      description: 'Operational readiness and monitoring',
      severity: 'critical' as const
    }
  ];

  const displayMetrics = metrics.length > 0 ? metrics : defaultMetrics;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {displayMetrics.map((metric) => (
        <MetricCard
          key={metric.id}
          title={metric.name}
          value={metric.value}
          description={metric.description}
          severity={metric.severity}
        />
      ))}
    </div>
  );
}
