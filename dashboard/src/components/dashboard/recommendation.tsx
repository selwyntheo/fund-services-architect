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
  // Validate recommendations array
  const validRecommendations = Array.isArray(recommendations) 
    ? recommendations.filter(rec => rec && typeof rec === 'object' && rec.id && rec.title)
    : [];

  const displayRecommendations = validRecommendations;

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
        {displayRecommendations.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium">No Recommendations</p>
              <p className="text-sm">Run a scan to get actionable recommendations</p>
            </div>
          </div>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
