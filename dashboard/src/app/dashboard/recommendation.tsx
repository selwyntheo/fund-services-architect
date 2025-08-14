import React from 'react';
import { AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';

interface RecommendationItem {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  project_name: string;
}

interface RecommendationsPanelProps {
  recommendations: RecommendationItem[];
  loading?: boolean;
}

export function RecommendationsPanel({ recommendations, loading }: RecommendationsPanelProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <Zap className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  if (loading) {
    return <div className="space-y-4">Loading recommendations...</div>;
  }

  return (
    <div className="space-y-4">
      {recommendations.slice(0, 10).map((rec) => (
        <div key={rec.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
          {getIcon(rec.type)}
          <div className="flex-1">
            <p className="text-sm font-medium">{rec.description}</p>
            <p className="text-xs text-gray-500 mt-1">{rec.project_name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}