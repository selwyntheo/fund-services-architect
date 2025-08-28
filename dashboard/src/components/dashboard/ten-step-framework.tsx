'use client';

import React, { useState } from 'react';
import { 
  ChevronRight, 
  Target, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Lightbulb, 
  TrendingUp, 
  Users, 
  FileText, 
  Calculator, 
  Settings,
  PlayCircle,
  Pause
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Step {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'in-progress' | 'pending';
  component?: React.ReactNode;
}

interface TenStepFrameworkProps {
  className?: string;
  currentStepData?: any;
  onStepChange?: (step: number) => void;
}

export const TenStepFramework: React.FC<TenStepFrameworkProps> = ({
  className = '',
  currentStepData,
  onStepChange
}) => {
  const [activeStep, setActiveStep] = useState(7); // Default to step 7 (Automate Debt Detection)

  const tenStepFramework: Step[] = [
    {
      step: 1,
      title: "Implement Flow Framework",
      description: "Set up Flow Distribution tracking in your backlog tool (Jira, etc.) to categorize work as Features, Defects, Risk, or Debt",
      icon: <Target className="w-5 h-5" />,
      status: "completed"
    },
    {
      step: 2,
      title: "Establish Effort Estimation",
      description: "Implement consistent estimation using story points or T-shirt sizing (S: 1 sprint/1 person, M: >1 person/1 sprint, L: >1 sprint)",
      icon: <Calculator className="w-5 h-5" />,
      status: "completed"
    },
    {
      step: 3,
      title: "Create Technical Debt Quadrant",
      description: "Classify debt using Martin Fowler's framework: Prudent/Reckless vs Deliberate/Inadvertent",
      icon: <BarChart3 className="w-5 h-5" />,
      status: "completed"
    },
    {
      step: 4,
      title: "Calculate Technical Debt Score (TDS)",
      description: "Quantify each debt item using Impact × Probability × Effort formula",
      icon: <DollarSign className="w-5 h-5" />,
      status: "in-progress"
    },
    {
      step: 5,
      title: "Prioritize Using PAID Framework",
      description: "Plan, Address, Ignore, or Delay debt items based on risk vs impact analysis",
      icon: <AlertTriangle className="w-5 h-5" />,
      status: "pending"
    },
    {
      step: 6,
      title: "Integrate into Team Ceremonies",
      description: "Include debt discussions in planning, review, and capacity planning sessions",
      icon: <Users className="w-5 h-5" />,
      status: "pending"
    },
    {
      step: 7,
      title: "Automate Debt Detection",
      description: "Set up tools like SonarQube, static analysis, and CI/CD integration for automatic debt identification",
      icon: <Settings className="w-5 h-5" />,
      status: "in-progress"
    },
    {
      step: 8,
      title: "Establish Monitoring & KPIs",
      description: "Track debt accumulation, resolution rates, and impact on delivery velocity",
      icon: <TrendingUp className="w-5 h-5" />,
      status: "pending"
    },
    {
      step: 9,
      title: "Create Remediation Roadmap",
      description: "Develop timeline and resource allocation for addressing prioritized debt items",
      icon: <FileText className="w-5 h-5" />,
      status: "pending"
    },
    {
      step: 10,
      title: "Implement Continuous Improvement",
      description: "Regular reviews, retrospectives, and framework refinement based on learnings",
      icon: <Lightbulb className="w-5 h-5" />,
      status: "pending"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'pending': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in-progress': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const handleStepClick = (step: number) => {
    setActiveStep(step);
    onStepChange?.(step);
  };

  const StepCard = ({ step, isActive }: { step: Step; isActive: boolean }) => (
    <div 
      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => handleStepClick(step.step)}
    >
      <div className="flex items-start space-x-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          step.status === 'completed' ? 'bg-green-500 text-white' :
          step.status === 'in-progress' ? 'bg-blue-500 text-white' :
          'bg-gray-300 text-gray-600'
        }`}>
          {step.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : step.step}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900 text-sm">{step.title}</h3>
            <Badge variant={getStatusBadgeVariant(step.status)} className="text-xs">
              {step.status.replace('-', ' ')}
            </Badge>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{step.description}</p>
        </div>
        <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${
          isActive ? 'rotate-90 text-blue-500' : 'text-gray-400'
        }`} />
      </div>
    </div>
  );

  const currentStep = tenStepFramework[activeStep - 1];
  const completedSteps = tenStepFramework.filter(step => step.status === 'completed').length;
  const inProgressSteps = tenStepFramework.filter(step => step.status === 'in-progress').length;
  const progressPercentage = ((completedSteps + inProgressSteps * 0.5) / tenStepFramework.length) * 100;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Framework Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ten-Step Framework Progress</span>
            <Badge variant="secondary">
              {completedSteps + inProgressSteps}/{tenStepFramework.length} Steps Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{Math.round(progressPercentage)}% Complete</span>
              <span>{completedSteps} completed, {inProgressSteps} in progress</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Framework Steps */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Framework Steps</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {tenStepFramework.map((step) => (
                  <StepCard 
                    key={step.step} 
                    step={step} 
                    isActive={activeStep === step.step}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Current Step Details */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep?.status === 'completed' ? 'bg-green-500 text-white' :
                  currentStep?.status === 'in-progress' ? 'bg-blue-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {currentStep?.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    Step {activeStep}: {currentStep?.title}
                  </h2>
                  <Badge variant={getStatusBadgeVariant(currentStep?.status || 'pending')}>
                    {currentStep?.status?.replace('-', ' ')}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-600 leading-relaxed">
                {currentStep?.description}
              </p>
              
              {/* Step-specific content */}
              {activeStep === 4 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-3">TDS Calculation Formula</h3>
                  <div className="bg-white rounded-lg p-4 border border-blue-100 mb-4">
                    <p className="text-blue-800 text-lg font-mono text-center">
                      <strong>TDS = Impact × Probability × Effort</strong>
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <h4 className="font-medium text-blue-900 mb-2">Impact (1-5)</h4>
                      <p className="text-blue-800">Business impact scale measuring potential consequences</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <h4 className="font-medium text-blue-900 mb-2">Probability (1-5)</h4>
                      <p className="text-blue-800">Likelihood of negative consequences occurring</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <h4 className="font-medium text-blue-900 mb-2">Effort (S/M/L)</h4>
                      <p className="text-blue-800">Size multiplier: S=1, M=2, L=3</p>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 7 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-semibold text-green-900 mb-3">Automated Debt Detection Tools</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-green-100">
                      <h4 className="font-medium text-green-900 mb-2">🎯 Current Implementation</h4>
                      <ul className="text-green-800 text-sm space-y-1">
                        <li>• GitHub/GitLab repository scanning</li>
                        <li>• Java & .NET specific analyzers</li>
                        <li>• Code quality metrics</li>
                        <li>• Architecture analysis</li>
                        <li>• Real-time debt calculation</li>
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-green-100">
                      <h4 className="font-medium text-green-900 mb-2">🚀 Next Steps</h4>
                      <ul className="text-green-800 text-sm space-y-1">
                        <li>• CI/CD pipeline integration</li>
                        <li>• SonarQube integration</li>
                        <li>• Automated PR analysis</li>
                        <li>• Scheduled scanning</li>
                        <li>• Notification system</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activeStep === 1}
                    onClick={() => handleStepClick(Math.max(1, activeStep - 1))}
                  >
                    Previous Step
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activeStep === 10}
                    onClick={() => handleStepClick(Math.min(10, activeStep + 1))}
                  >
                    Next Step
                  </Button>
                </div>
                
                {activeStep === 7 && (
                  <div className="flex space-x-2">
                    <Button variant="default" size="sm">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Run Scan
                    </Button>
                    <Button variant="secondary" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
