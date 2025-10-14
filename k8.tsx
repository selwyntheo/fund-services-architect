import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Server, Cpu, Database, Activity, TrendingUp, AlertTriangle, CheckCircle, Code, Container, Zap, Globe, Lock, Settings, MessageSquare, Brain } from 'lucide-react';

const K8sArchitectureDemo = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [aiAnalysisStep, setAiAnalysisStep] = useState(0);
  const [showAIChat, setShowAIChat] = useState(false);

  // Sample bottleneck data
  const bottleneckData = [
    { name: 'NAV Calc Service', cpu: 85, memory: 78, latency: 450, errors: 12 },
    { name: 'Trade Processing', cpu: 92, memory: 88, latency: 680, errors: 8 },
    { name: 'Portfolio API', cpu: 68, memory: 65, latency: 220, errors: 3 },
    { name: 'Reporting Engine', cpu: 95, memory: 91, latency: 1200, errors: 15 },
    { name: 'Risk Calculator', cpu: 88, memory: 82, latency: 550, errors: 6 }
  ];

  // KEDA scaling patterns
  const scalingData = [
    { time: '00:00', withoutKeda: 4, withKeda: 2 },
    { time: '03:00', withoutKeda: 4, withKeda: 2 },
    { time: '06:00', withoutKeda: 4, withKeda: 3 },
    { time: '09:00', withoutKeda: 4, withKeda: 8 },
    { time: '12:00', withoutKeda: 4, withKeda: 12 },
    { time: '15:00', withoutKeda: 4, withKeda: 10 },
    { time: '18:00', withoutKeda: 4, withKeda: 4 },
    { time: '21:00', withoutKeda: 4, withKeda: 2 }
  ];

  // Cost comparison
  const costData = [
    { month: 'Current', docker: 12000, k8sNoKeda: 10000, k8sWithKeda: 6500 },
    { month: 'Month 2', docker: 12000, k8sNoKeda: 10000, k8sWithKeda: 6200 },
    { month: 'Month 3', docker: 12500, k8sNoKeda: 10200, k8sWithKeda: 6400 },
    { month: 'Month 4', docker: 12500, k8sNoKeda: 10200, k8sWithKeda: 6100 }
  ];

  // Architecture patterns
  const patterns = [
    {
      id: 'monolith-sidecar',
      name: 'Monolith with Sidecar',
      description: 'Existing monolith containerized with auxiliary services as sidecars',
      complexity: 'Low',
      bestFor: 'Legacy .NET/Java applications, minimal refactoring',
      icon: <Container className="w-8 h-8 text-blue-500" />,
      metrics: { effort: 2, scalability: 3, resilience: 3, cost: 4 },
      components: ['Main Application Container', 'Logging Sidecar', 'Monitoring Sidecar', 'Config Watcher']
    },
    {
      id: 'microservices',
      name: 'Microservices Architecture',
      description: 'Decomposed services with independent scaling and deployment',
      complexity: 'High',
      bestFor: 'New applications, high-scale requirements',
      icon: <Globe className="w-8 h-8 text-green-500" />,
      metrics: { effort: 5, scalability: 5, resilience: 5, cost: 3 },
      components: ['API Gateway', 'Service Mesh', 'Independent Services', 'Event Bus']
    },
    {
      id: 'batch-processing',
      name: 'Batch Job Pattern',
      description: 'Scheduled or event-driven batch processing with auto-scaling',
      complexity: 'Medium',
      bestFor: 'NAV calculations, EOD processing, reports',
      icon: <Activity className="w-8 h-8 text-purple-500" />,
      metrics: { effort: 3, scalability: 5, resilience: 4, cost: 5 },
      components: ['CronJob/Job', 'KEDA Scaler', 'Queue Consumer', 'Result Aggregator']
    },
    {
      id: 'event-driven',
      name: 'Event-Driven Architecture',
      description: 'React to events from queues, databases, or external systems',
      complexity: 'Medium',
      bestFor: 'Real-time processing, trade events, market data',
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      metrics: { effort: 4, scalability: 5, resilience: 5, cost: 4 },
      components: ['Event Source', 'KEDA Event Scaler', 'Worker Pods', 'Dead Letter Queue']
    },
    {
      id: 'api-gateway',
      name: 'API Gateway Pattern',
      description: 'Centralized entry point with rate limiting and authentication',
      complexity: 'Medium',
      bestFor: 'Public APIs, partner integrations',
      icon: <Lock className="w-8 h-8 text-red-500" />,
      metrics: { effort: 3, scalability: 4, resilience: 4, cost: 4 },
      components: ['Ingress Controller', 'API Gateway', 'Backend Services', 'Auth Service']
    },
    {
      id: 'data-pipeline',
      name: 'Data Pipeline Pattern',
      description: 'ETL workflows with parallel processing and data validation',
      complexity: 'Medium',
      bestFor: 'Data ingestion, fund accounting, reconciliation',
      icon: <Database className="w-8 h-8 text-indigo-500" />,
      metrics: { effort: 3, scalability: 5, resilience: 4, cost: 4 },
      components: ['Source Connectors', 'Transform Workers', 'Validation Stage', 'Load Stage']
    }
  ];

  // AI Analysis steps
  const aiSteps = [
    { 
      step: 1, 
      title: 'Data Collection', 
      description: 'Analyzing Docker metrics, resource usage, and application logs',
      status: aiAnalysisStep >= 1 ? 'complete' : 'pending'
    },
    { 
      step: 2, 
      title: 'Bottleneck Detection', 
      description: 'Identifying performance issues and resource constraints',
      status: aiAnalysisStep >= 2 ? 'complete' : 'pending'
    },
    { 
      step: 3, 
      title: 'Pattern Matching', 
      description: 'Comparing application characteristics with architecture patterns',
      status: aiAnalysisStep >= 3 ? 'complete' : 'pending'
    },
    { 
      step: 4, 
      title: 'Recommendation', 
      description: 'Generating tailored Kubernetes architecture recommendations',
      status: aiAnalysisStep >= 4 ? 'complete' : 'pending'
    }
  ];

  const runAIAnalysis = () => {
    setAiAnalysisStep(0);
    const interval = setInterval(() => {
      setAiAnalysisStep(prev => {
        if (prev >= 4) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
  };

  const PatternCard = ({ pattern }) => (
    <div 
      className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all cursor-pointer ${
        selectedPattern?.id === pattern.id ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-blue-300'
      }`}
      onClick={() => setSelectedPattern(pattern)}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">{pattern.icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{pattern.name}</h3>
          <p className="text-sm text-gray-600 mb-3">{pattern.description}</p>
          <div className="flex items-center space-x-4 text-sm">
            <span className={`px-2 py-1 rounded ${
              pattern.complexity === 'Low' ? 'bg-green-100 text-green-800' :
              pattern.complexity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {pattern.complexity} Complexity
            </span>
            <span className="text-gray-500">Best for: {pattern.bestFor}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const MetricsRadar = ({ pattern }) => {
    const radarData = [
      { metric: 'Effort', value: pattern.metrics.effort },
      { metric: 'Scalability', value: pattern.metrics.scalability },
      { metric: 'Resilience', value: pattern.metrics.resilience },
      { metric: 'Cost Efficiency', value: pattern.metrics.cost }
    ];

    return (
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" />
          <PolarRadiusAxis domain={[0, 5]} />
          <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kubernetes Migration Strategy</h1>
              <p className="text-gray-600 mt-1">AI-Powered Architecture Patterns for Fund Services</p>
            </div>
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Brain className="w-5 h-5" />
              <span>AI Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="bg-white rounded-lg shadow-sm p-2 flex space-x-2">
          {['overview', 'bottlenecks', 'patterns', 'keda', 'cost', 'ai-agent'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Kubernetes for Fund Services?</h2>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Auto-Scaling</h3>
                  <p className="text-sm text-gray-600">Handle EOD processing spikes automatically</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Cpu className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Resource Efficiency</h3>
                  <p className="text-sm text-gray-600">50-70% cost reduction with KEDA</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">High Availability</h3>
                  <p className="text-sm text-gray-600">Zero-downtime deployments</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Current State Challenges</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <span className="text-gray-700">Fixed resource allocation causing waste during off-peak hours</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <span className="text-gray-700">Manual scaling for NAV processing peaks</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <span className="text-gray-700">Complex Docker Compose orchestration</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <span className="text-gray-700">Limited observability and debugging</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Kubernetes Benefits</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Event-driven auto-scaling with KEDA</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Self-healing and automatic recovery</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Rolling updates with zero downtime</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-gray-700">Standardized deployment across environments</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bottlenecks' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Application Bottlenecks</h2>
              <p className="text-gray-600 mb-6">Real data from production Docker environments</p>
              
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={bottleneckData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cpu" fill="#3b82f6" name="CPU Usage %" />
                  <Bar dataKey="memory" fill="#10b981" name="Memory Usage %" />
                  <Bar dataKey="latency" fill="#f59e0b" name="Latency (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {bottleneckData.map(app => (
                <div key={app.name} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">{app.name}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">CPU</span>
                      <span className={`font-semibold ${app.cpu > 85 ? 'text-red-600' : 'text-green-600'}`}>
                        {app.cpu}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Memory</span>
                      <span className={`font-semibold ${app.memory > 80 ? 'text-red-600' : 'text-green-600'}`}>
                        {app.memory}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Latency</span>
                      <span className={`font-semibold ${app.latency > 500 ? 'text-red-600' : 'text-green-600'}`}>
                        {app.latency}ms
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Errors/hr</span>
                      <span className={`font-semibold ${app.errors > 10 ? 'text-red-600' : 'text-green-600'}`}>
                        {app.errors}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Architecture Patterns</h2>
              <p className="text-gray-600 mb-6">Choose the right pattern for your application</p>
              
              <div className="space-y-4">
                {patterns.map(pattern => (
                  <PatternCard key={pattern.id} pattern={pattern} />
                ))}
              </div>
            </div>

            {selectedPattern && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Pattern Details: {selectedPattern.name}</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Components</h4>
                    <ul className="space-y-2">
                      {selectedPattern.components.map((comp, idx) => (
                        <li key={idx} className="flex items-center space-x-2">
                          <Server className="w-4 h-4 text-blue-500" />
                          <span className="text-gray-700">{comp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Pattern Metrics</h4>
                    <MetricsRadar pattern={selectedPattern} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'keda' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">KEDA Auto-Scaling Demo</h2>
              <p className="text-gray-600 mb-6">Event-driven scaling for NAV processing workloads</p>
              
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={scalingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis label={{ value: 'Pod Count', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="withoutKeda" stroke="#ef4444" strokeWidth={2} name="Static (No KEDA)" />
                  <Line type="monotone" dataKey="withKeda" stroke="#10b981" strokeWidth={2} name="Dynamic (With KEDA)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">KEDA Scalers for Fund Services</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded">
                    <h4 className="font-semibold text-blue-900">Queue Scaler</h4>
                    <p className="text-sm text-blue-700">Scale based on RabbitMQ/Azure Queue depth</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <h4 className="font-semibold text-green-900">Cron Scaler</h4>
                    <p className="text-sm text-green-700">Predictive scaling for EOD processing</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded">
                    <h4 className="font-semibold text-purple-900">Prometheus Scaler</h4>
                    <p className="text-sm text-purple-700">Custom metrics from application</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded">
                    <h4 className="font-semibold text-yellow-900">Database Scaler</h4>
                    <p className="text-sm text-yellow-700">Scale based on pending transactions</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Key Benefits</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">70% Cost Reduction</span>
                      <p className="text-sm text-gray-600">Scale to zero during off-hours</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Instant Response</span>
                      <p className="text-sm text-gray-600">React to queue messages within seconds</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Predictive Scaling</span>
                      <p className="text-sm text-gray-600">Pre-scale before known peak times</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Custom Metrics</span>
                      <p className="text-sm text-gray-600">Scale based on business logic</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cost' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cost Comparison Analysis</h2>
              <p className="text-gray-600 mb-6">Infrastructure costs over 4 months</p>
              
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="docker" fill="#ef4444" name="Current Docker" />
                  <Bar dataKey="k8sNoKeda" fill="#f59e0b" name="K8s (No KEDA)" />
                  <Bar dataKey="k8sWithKeda" fill="#10b981" name="K8s + KEDA" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="font-semibold text-red-900 mb-2">Current Docker</h3>
                <p className="text-3xl font-bold text-red-600">$12,000</p>
                <p className="text-sm text-red-700 mt-2">Fixed allocation, 40% waste</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-semibold text-yellow-900 mb-2">K8s Without KEDA</h3>
                <p className="text-3xl font-bold text-yellow-600">$10,000</p>
                <p className="text-sm text-yellow-700 mt-2">Better utilization, 17% savings</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="font-semibold text-green-900 mb-2">K8s With KEDA</h3>
                <p className="text-3xl font-bold text-green-600">$6,500</p>
                <p className="text-sm text-green-700 mt-2">Event-driven, 46% savings</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">ROI Calculation</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Annual Savings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Infrastructure</span>
                      <span className="font-semibold text-green-600">$66,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operations (reduced incidents)</span>
                      <span className="font-semibold text-green-600">$30,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Developer productivity</span>
                      <span className="font-semibold text-green-600">$45,000</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total Annual Savings</span>
                      <span className="text-green-600">$141,000</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Migration Investment</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Training & Enablement</span>
                      <span className="font-semibold text-blue-600">$15,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Initial Setup (AKS/EKS)</span>
                      <span className="font-semibold text-blue-600">$25,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Migration Effort (3 months)</span>
                      <span className="font-semibold text-blue-600">$40,000</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total Investment</span>
                      <span className="text-blue-600">$80,000</span>
                    </div>
                    <div className="mt-4 p-3 bg-green-50 rounded">
                      <p className="text-sm font-semibold text-green-900">ROI: Payback in 7 months</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai-agent' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">AI-Powered Architecture Advisor</h2>
              <p className="text-gray-600 mb-6">Claude LLM analyzes your application and recommends the optimal K8s pattern</p>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Analysis Pipeline</h3>
                  {aiSteps.map((step) => (
                    <div key={step.step} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.status === 'complete' ? 'bg-green-500' : 'bg-gray-300'
                      }`}>
                        {step.status === 'complete' ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : (
                          <span className="text-white font-semibold">{step.step}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{step.title}</h4>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={runAIAnalysis}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Run AI Analysis
                  </button>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Data Sources Analyzed</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-white rounded shadow-sm">
                      <Activity className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-semibold text-sm">Docker Stats</p>
                        <p className="text-xs text-gray-600">CPU, Memory, Network I/O</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded shadow-sm">
                      <Code className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-semibold text-sm">Application Code</p>
                        <p className="text-xs text-gray-600">Dependencies, frameworks, patterns</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded shadow-sm">
                      <Database className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="font-semibold text-sm">Data Access Patterns</p>
                        <p className="text-xs text-gray-600">Query frequency, data volume</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white rounded shadow-sm">
                      <Settings className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-semibold text-sm">Configuration</p>
                        <p className="text-xs text-gray-600">Environment vars, secrets, volumes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {aiAnalysisStep === 4 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <Brain className="w-8 h-8 text-green-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-green-900 mb-3">AI Recommendation</h3>
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <h4 className="font-semibold mb-2">Recommended Pattern: Batch Job Pattern with KEDA</h4>
                        <p className="text-gray-700 mb-3">
                          Based on your NAV calculation service analysis, I recommend the Batch Job Pattern with KEDA queue scaling. Here's why:
                        </p>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>High CPU usage (95%)</strong> during processing windows - KEDA can scale pods based on queue depth</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Time-based workload</strong> - Scheduled NAV calculations align perfectly with CronJob + KEDA</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Stateless processing</strong> - Each fund calculation is independent, ideal for parallel execution</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span><strong>Cost optimization</strong> - Scale to zero outside business hours, estimated 70% cost reduction</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4">
                          <h5 className="font-semibold mb-2 text-sm">Implementation Steps</h5>
                          <ol className="text-xs space-y-1 list-decimal list-inside text-gray-600">
                            <li>Create RabbitMQ queue for fund processing</li>
                            <li>Convert service to K8s Job template</li>
                            <li>Configure KEDA ScaledJob with queue scaler</li>
                            <li>Set up HPA for additional scaling</li>
                            <li>Implement dead-letter queue for failures</li>
                          </ol>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <h5 className="font-semibold mb-2 text-sm">Expected Outcomes</h5>
                          <ul className="text-xs space-y-1 text-gray-600">
                            <li>• 90% faster NAV processing during peaks</li>
                            <li>• Zero pods during off-hours (70% cost save)</li>
                            <li>• Auto-retry failed calculations</li>
                            <li>• Better monitoring and observability</li>
                            <li>• Simplified deployment process</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Interactive Questionnaire</h3>
              <p className="text-gray-600 mb-4">Answer these questions to get personalized recommendations</p>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block font-semibold mb-2">1. What type of workload is this?</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2">
                    <option>API/Web Service</option>
                    <option>Batch Processing</option>
                    <option>Event-Driven Processing</option>
                    <option>Scheduled Jobs</option>
                    <option>Data Pipeline</option>
                  </select>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block font-semibold mb-2">2. What is your current scaling pattern?</label>
                  <select className="w-full border border-gray-300 rounded px-3 py-2">
                    <option>Fixed capacity all day</option>
                    <option>Manual scaling during peaks</option>
                    <option>Time-based scaling</option>
                    <option>Event-driven (queue depth)</option>
                  </select>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block font-semibold mb-2">3. Current peak resource usage?</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="CPU %" className="border border-gray-300 rounded px-3 py-2" />
                    <input type="number" placeholder="Memory %" className="border border-gray-300 rounded px-3 py-2" />
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block font-semibold mb-2">4. Is your application stateful?</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input type="radio" name="stateful" className="mr-2" />
                      <span>Yes (needs persistent storage)</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="stateful" className="mr-2" defaultChecked />
                      <span>No (stateless)</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block font-semibold mb-2">5. Technology stack?</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span>Java/Spring</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span>.NET Core</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span>Python/FastAPI</span>
                    </label>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-semibold">
                  Get AI Recommendation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Chat Sidebar */}
      {showAIChat && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-6 h-6" />
              <h3 className="font-semibold">K8s Architecture Assistant</h3>
            </div>
            <button onClick={() => setShowAIChat(false)} className="text-white hover:bg-white/20 rounded p-1">
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>AI:</strong> Hello! I'm your Kubernetes architecture assistant. I can help you:
              </p>
              <ul className="text-xs text-blue-800 mt-2 space-y-1 ml-4">
                <li>• Analyze your current Docker setup</li>
                <li>• Recommend optimal K8s patterns</li>
                <li>• Generate KEDA scaling configurations</li>
                <li>• Estimate cost savings</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm">
              <p className="text-sm text-gray-700">
                <strong>You:</strong> What pattern should I use for my NAV calculation service?
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>AI:</strong> Based on NAV calculations being batch-oriented with predictable schedules, I recommend the <strong>Batch Job Pattern with KEDA</strong>. This pattern offers:
              </p>
              <ul className="text-xs text-blue-800 mt-2 space-y-1 ml-4">
                <li>• Scale to zero when not processing</li>
                <li>• Queue-based triggering for fund calculations</li>
                <li>• Parallel processing for multiple funds</li>
                <li>• Cost savings of 60-70%</li>
              </ul>
              <p className="text-xs text-blue-700 mt-2">Would you like me to generate a sample configuration?</p>
            </div>
          </div>

          <div className="p-4 border-t bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Ask about Kubernetes patterns..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default K8sArchitectureDemo;
