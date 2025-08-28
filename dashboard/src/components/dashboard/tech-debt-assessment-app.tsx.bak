import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, Target, BarChart3, AlertTriangle, CheckCircle, Clock, DollarSign, Lightbulb, TrendingUp, Users, FileText, Calculator, Filter, Search, Download, Settings } from 'lucide-react';

const TechnicalDebtApp = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [debtItems, setDebtItems] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample debt items for demonstration
  const sampleDebtItems = [
    {
      id: 1,
      title: "Legacy Authentication System",
      description: "Outdated authentication mechanism needs modernization",
      quadrant: "prudent-deliberate",
      effort: "L",
      impact: 4,
      probability: 3,
      category: "Architecture",
      status: "identified",
      tags: ["security", "legacy", "authentication"],
      businessImpact: "High",
      technicalRisk: "Medium",
      estimatedCost: 25000,
      timeline: "3 months"
    },
    {
      id: 2,
      title: "Code Duplication in Payment Module",
      description: "Significant code duplication causing maintenance overhead",
      quadrant: "reckless-inadvertent",
      effort: "M",
      impact: 3,
      probability: 4,
      category: "Code Quality",
      status: "in-progress",
      tags: ["code-quality", "payment", "refactoring"],
      businessImpact: "Medium",
      technicalRisk: "High",
      estimatedCost: 12000,
      timeline: "6 weeks"
    },
    {
      id: 3,
      title: "Missing Unit Tests",
      description: "Critical components lack proper test coverage",
      quadrant: "reckless-inadvertent",
      effort: "L",
      impact: 4,
      probability: 5,
      category: "Testing",
      status: "planned",
      tags: ["testing", "coverage", "quality"],
      businessImpact: "High",
      technicalRisk: "High",
      estimatedCost: 8000,
      timeline: "4 weeks"
    }
  ];

  useEffect(() => {
    setDebtItems(sampleDebtItems);
  }, []);

  const tenStepFramework = [
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
      status: "pending"
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

  const calculateTDS = (item) => {
    const effortMultiplier = { S: 1, M: 2, L: 3 };
    return item.impact * item.probability * effortMultiplier[item.effort];
  };

  const getQuadrantColor = (quadrant) => {
    switch (quadrant) {
      case 'prudent-deliberate': return 'bg-green-100 text-green-800';
      case 'prudent-inadvertent': return 'bg-blue-100 text-blue-800';
      case 'reckless-deliberate': return 'bg-yellow-100 text-yellow-800';
      case 'reckless-inadvertent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'planned': return 'bg-yellow-500';
      case 'identified': return 'bg-orange-500';
      default: return 'bg-gray-300';
    }
  };

  const filteredDebtItems = debtItems.filter(item => {
    const matchesFilter = selectedFilter === 'all' || item.category.toLowerCase() === selectedFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const totalTDS = debtItems.reduce((sum, item) => sum + calculateTDS(item), 0);
  const averageTDS = debtItems.length > 0 ? (totalTDS / debtItems.length).toFixed(1) : 0;

  const DebtItemCard = ({ item }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
          <p className="text-gray-600 text-sm mb-3">{item.description}</p>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {item.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        <div className="ml-4 text-right">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {calculateTDS(item)}
          </div>
          <div className="text-xs text-gray-500">TDS Score</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-xs font-medium text-gray-500">Quadrant</span>
          <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getQuadrantColor(item.quadrant)}`}>
            {item.quadrant.replace('-', ' ')}
          </div>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-500">Category</span>
          <div className="text-sm font-medium text-gray-900">{item.category}</div>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-500">Effort</span>
          <div className="text-sm font-medium text-gray-900">Size {item.effort}</div>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-500">Business Impact</span>
          <div className="text-sm font-medium text-gray-900">{item.businessImpact}</div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span className="flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            ${item.estimatedCost.toLocaleString()}
          </span>
          <span className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {item.timeline}
          </span>
        </div>
        
        <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} 
             title={item.status}></div>
      </div>
    </div>
  );

  const StepCard = ({ step, isActive, onClick }) => (
    <div 
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          step.status === 'completed' ? 'bg-green-500 text-white' :
          step.status === 'in-progress' ? 'bg-blue-500 text-white' :
          'bg-gray-300 text-gray-600'
        }`}>
          {step.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : step.step}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{step.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{step.description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Technical Debt Assessment</h1>
              <p className="text-gray-600 mt-1">Ten-Step Framework for Measuring & Remediating Technical Debt</p>
            </div>
            <div className="flex space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Add Debt Item
              </button>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Framework Steps */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ten-Step Framework</h2>
              <div className="space-y-3">
                {tenStepFramework.map((step) => (
                  <StepCard 
                    key={step.step} 
                    step={step} 
                    isActive={activeStep === step.step}
                    onClick={() => setActiveStep(step.step)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* KPI Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Debt Items</p>
                    <p className="text-2xl font-bold text-gray-900">{debtItems.length}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total TDS Score</p>
                    <p className="text-2xl font-bold text-gray-900">{totalTDS}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Average TDS</p>
                    <p className="text-2xl font-bold text-gray-900">{averageTDS}</p>
                  </div>
                  <Calculator className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Estimated Cost</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${debtItems.reduce((sum, item) => sum + item.estimatedCost, 0).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search debt items..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <select
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      <option value="architecture">Architecture</option>
                      <option value="code quality">Code Quality</option>
                      <option value="testing">Testing</option>
                      <option value="security">Security</option>
                      <option value="documentation">Documentation</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Step Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center space-x-3 mb-4">
                {tenStepFramework[activeStep - 1]?.icon}
                <h2 className="text-xl font-semibold text-gray-900">
                  Step {activeStep}: {tenStepFramework[activeStep - 1]?.title}
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                {tenStepFramework[activeStep - 1]?.description}
              </p>
              
              {/* Step-specific content */}
              {activeStep === 4 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">TDS Calculation Formula</h3>
                  <p className="text-blue-800 text-sm mb-2">
                    <strong>TDS = Impact × Probability × Effort</strong>
                  </p>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• Impact: Business impact scale (1-5)</li>
                    <li>• Probability: Likelihood of negative consequences (1-5)</li>
                    <li>• Effort: Size multiplier (S=1, M=2, L=3)</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Debt Items */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Technical Debt Items ({filteredDebtItems.length})
              </h2>
              
              {filteredDebtItems.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No debt items found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {filteredDebtItems.map((item) => (
                    <DebtItemCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicalDebtApp;