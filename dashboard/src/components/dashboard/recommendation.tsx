'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
}

interface RecommendationsPanelProps {
  recommendations?: Recommendation[];
}

export function RecommendationsPanel({ recommendations }: RecommendationsPanelProps) {
  // Default recommendations if none provided
  const defaultRecommendations: Recommendation[] = [
    {
      id: '1',
      title: 'Improve Code Quality',
      description: 'Reduce complexity and code smells in core modules',
      priority: 'high',
      impact: 'Reduces maintenance cost by 30%'
    },
    {
      id: '2',
      title: 'Update Dependencies',
      description: 'Upgrade outdated packages with security vulnerabilities',
      priority: 'high',
      impact: 'Improves security posture'
    },
    {
      id: '3',
      title: 'Enhance Test Coverage',
      description: 'Increase test coverage from 65% to 80%',
      priority: 'medium',
      impact: 'Reduces bug reports by 25%'
    },
    {
      id: '4',
      title: 'Refactor Legacy Components',
      description: 'Modernize deprecated API usage and patterns',
      priority: 'medium',
      impact: 'Improves developer productivity'
    }
  ];

  // Validate recommendations array
  const validRecommendations = Array.isArray(recommendations) 
    ? recommendations.filter(rec => rec && typeof rec === 'object' && rec.id && rec.title)
    : [];

  const displayRecommendations = validRecommendations.length > 0 
    ? validRecommendations 
    : defaultRecommendations;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayRecommendations.map((recommendation, index) => {
            // Additional safety check
            if (!recommendation || typeof recommendation !== 'object') {
              console.warn(`Invalid recommendation at index ${index}:`, recommendation);
              return null;
            }
            
            return (
              <div key={recommendation.id || `rec-${index}`} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium">{recommendation.title || 'Unknown Recommendation'}</h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(recommendation.priority || 'low')}`}>
                    {recommendation.priority || 'low'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{recommendation.description || 'No description available'}</p>
                <p className="text-xs text-gray-500">{recommendation.impact || 'Impact not specified'}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
