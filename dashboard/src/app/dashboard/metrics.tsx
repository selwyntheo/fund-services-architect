import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import { 
  Server, 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface MetricsGridProps {
  totalProjects: number;
  avgDebtScore: number;
  criticalProjects: number;
  scanFrequency: number;
  previousData?: {
    totalProjects: number;
    avgDebtScore: number;
    criticalProjects: number;
    scanFrequency: number;
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  changeLabel?: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
}

function MetricCard({ title, value, icon, change, changeLabel, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  const iconBgClasses = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    yellow: 'bg-yellow-100',
    red: 'bg-red-100',
    gray: 'bg-gray-100',
  };

  const renderChangeIndicator = () => {
    if (typeof change !== 'number') return null;

    let ChangeIcon = Minus;
    let changeColor = 'text-gray-500';

    if (change > 0) {
      ChangeIcon = ArrowUp;
      changeColor = title.toLowerCase().includes('critical') ? 'text-red-500' : 'text-green-500';
    } else if (change < 0) {
      ChangeIcon = ArrowDown;
      changeColor = title.toLowerCase().includes('critical') ? 'text-green-500' : 'text-red-500';
    }

    return (
      <div className={`flex items-center text-xs ${changeColor} mt-1`}>
        <ChangeIcon className="w-3 h-3 mr-1" />
        <span>{Math.abs(change).toFixed(1)}% {changeLabel || 'vs last month'}</span>
      </div>
    );
  };

  return (
    <Card className={`border ${colorClasses[color]} dark:bg-opacity-10`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {typeof value === 'number' ? formatNumber(value) : value}
            </p>
            {renderChangeIndicator()}
          </div>
          <div className={`p-3 rounded-full ${iconBgClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricsGrid({ 
  totalProjects, 
  avgDebtScore, 
  criticalProjects, 
  scanFrequency,
  previousData 
}: MetricsGridProps) {
  // Calculate changes
  const calculateChange = (current: number, previous?: number) => {
    if (!previous || previous === 0) return undefined;
    return ((current - previous) / previous) * 100;
  };

  const totalProjectsChange = calculateChange(totalProjects, previousData?.totalProjects);
  const avgDebtScoreChange = calculateChange(avgDebtScore, previousData?.avgDebtScore);
  const criticalProjectsChange = calculateChange(criticalProjects, previousData?.criticalProjects);
  const scanFrequencyChange = calculateChange(scanFrequency, previousData?.scanFrequency);

  // Determine debt score color and format
  const getDebtScoreColor = (score: number): 'green' | 'yellow' | 'red' => {
    if (score <= 1.5) return 'green';
    if (score <= 2.5) return 'yellow';
    return 'red';
  };

  const formatDebtScore = (score: number): string => {
    return `${score.toFixed(1)}/4.0`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Projects"
        value={totalProjects}
        icon={<Server className="w-6 h-6" />}
        color="blue"
        change={totalProjectsChange}
      />
      
      <MetricCard
        title="Average Debt Score"
        value={formatDebtScore(avgDebtScore)}
        icon={<TrendingUp className="w-6 h-6" />}
        color={getDebtScoreColor(avgDebtScore)}
        change={avgDebtScoreChange}
      />
      
      <MetricCard
        title="Critical Risk Projects"
        value={criticalProjects}
        icon={<AlertTriangle className="w-6 h-6" />}
        color="red"
        change={criticalProjectsChange}
      />
      
      <MetricCard
        title="Scans This Month"
        value={scanFrequency}
        icon={<Activity className="w-6 h-6" />}
        color="gray"
        change={scanFrequencyChange}
      />
    </div>
  );
}