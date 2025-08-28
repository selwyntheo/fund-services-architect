'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, BarChart3, Settings, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface FrameworkIntegrationBannerProps {
  currentStep: number;
  onNavigateToFramework?: () => void;
  onNavigateToDashboard?: () => void;
}

export const FrameworkIntegrationBanner: React.FC<FrameworkIntegrationBannerProps> = ({
  currentStep,
  onNavigateToFramework,
  onNavigateToDashboard
}) => {
  const getStepInfo = (step: number) => {
    const steps: Record<number, any> = {
      7: {
        title: 'Automate Debt Detection',
        description: 'Your current dashboard represents Step 7 of the framework',
        icon: <Settings className="w-5 h-5" />,
        color: 'blue',
        status: 'active'
      },
      8: {
        title: 'Establish Monitoring & KPIs',
        description: 'Track debt accumulation and resolution rates',
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'yellow',
        status: 'next'
      }
    };
    return steps[step] || steps[7];
  };

  const stepInfo = getStepInfo(currentStep);

  return (
    <Card className={`border-${stepInfo.color}-200 bg-${stepInfo.color}-50`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full bg-${stepInfo.color}-500 text-white flex items-center justify-center`}>
              {stepInfo.status === 'active' ? stepInfo.icon : <CheckCircle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`font-semibold text-${stepInfo.color}-900`}>
                  Step {currentStep}: {stepInfo.title}
                </h3>
                <Badge variant={stepInfo.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {stepInfo.status === 'active' ? 'Current' : 'Next'}
                </Badge>
              </div>
              <p className={`text-${stepInfo.color}-700 text-sm`}>
                {stepInfo.description}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onNavigateToFramework}
              className={`border-${stepInfo.color}-300 text-${stepInfo.color}-700 hover:bg-${stepInfo.color}-100`}
            >
              <Target className="w-4 h-4 mr-2" />
              View Framework
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onNavigateToDashboard}
              className={`border-${stepInfo.color}-300 text-${stepInfo.color}-700 hover:bg-${stepInfo.color}-100`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FrameworkIntegrationBanner;
