'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RiskLevel {
  level: 'Low' | 'Medium' | 'High' | 'Critical';
  count: number;
  percentage: number;
}

interface RiskSummaryProps {
  riskData?: RiskLevel[];
}

export function RiskSummary({ riskData }: RiskSummaryProps) {
  // Default risk data if none provided
  const defaultRiskData: RiskLevel[] = [
    { level: 'Low', count: 12, percentage: 40 },
    { level: 'Medium', count: 8, percentage: 27 },
    { level: 'High', count: 7, percentage: 23 },
    { level: 'Critical', count: 3, percentage: 10 }
  ];

  const displayData = riskData || defaultRiskData;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'High': return 'bg-orange-500';
      case 'Critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayData.map((risk) => (
            <div key={risk.level} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getRiskColor(risk.level)}`} />
                <span className="text-sm font-medium">{risk.level}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{risk.count} projects</span>
                <span className="text-sm font-medium">{risk.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
