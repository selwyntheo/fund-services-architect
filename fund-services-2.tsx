import React, { useState } from ‘react’;
import { BarChart3, Database, Building2, TrendingUp, FileText, CheckCircle, AlertCircle, Clock, Users, ArrowRight, Activity, Shield, Upload, RefreshCw, MessageSquare, Bell, UserPlus, GitBranch, Zap, FileCheck, BarChart2, AlertTriangle, ChevronRight, Filter, Search, MoreVertical, Calendar, Layers, FileSpreadsheet, Brain, ExternalLink, CircleDot, Target, DollarSign, Percent, Download, Package } from ‘lucide-react’;

const FundConversionApp = () => {
const [selectedRole, setSelectedRole] = useState(null);
const [selectedEvent, setSelectedEvent] = useState(null);
const [activeTab, setActiveTab] = useState(‘workflow’);
const [selectedWorkflowStep, setSelectedWorkflowStep] = useState(null);

// Events contain multiple funds
const [events] = useState([
{
id: 1,
eventName: ‘Legacy Fund Migration’,
client: ‘Legacy Investments’,
source: ‘InvestOne’,
status: ‘Completed’,
progress: 100,
currentStep: ‘completed’,
assignedTeams: [‘Model Office’, ‘Security Data’],
startDate: ‘2024-07-01’,
targetDate: ‘2024-10-01’,
comments: 28,
exceptions: 0,
risk: ‘low’,
funds: [
{ name: ‘Legacy Growth Fund’, aum: 95000000, status: ‘Completed’, progress: 100 },
{ name: ‘Legacy Value Fund’, aum: 75000000, status: ‘Completed’, progress: 100 }
],
totalAUM: 170000000,
navVariances: [
{ fund: ‘Legacy Growth Fund’, variance: 0.002, status: ‘within’ },
{ fund: ‘Legacy Value Fund’, variance: 0.001, status: ‘within’ }
]
},
{
id: 2,
eventName: ‘Global Equity Fund Family’,
client: ‘Global Equity Funds’,
source: ‘Geneva’,
status: ‘In Progress’,
progress: 80,
currentStep: ‘recon-validation’,
assignedTeams: [‘Model Office’, ‘Static Data’],
startDate: ‘2024-08-20’,
targetDate: ‘2024-10-30’,
comments: 15,
exceptions: 5,
risk: ‘high’,
funds: [
{ name: ‘Global Equity Fund - Growth’, aum: 150000000, status: ‘In Progress’, progress: 85 },
{ name: ‘Global Equity Fund - Value’, aum: 120000000, status: ‘In Progress’, progress: 80 },
{ name: ‘Global Equity Fund - Balanced’, aum: 95000000, status: ‘In Progress’, progress: 75 }
],
totalAUM: 365000000,
navVariances: [
{ fund: ‘Global Equity Fund - Growth’, variance: 0.015, status: ‘breach’ },
{ fund: ‘Global Equity Fund - Value’, variance: 0.008, status: ‘within’ },
{ fund: ‘Global Equity Fund - Balanced’, variance: 0.012, status: ‘breach’ }
]
},
{
id: 3,
eventName: ‘Phoenix Fixed Income Migration’,
client: ‘Phoenix Investments’,
source: ‘Advent’,
status: ‘In Progress’,
progress: 90,
currentStep: ‘production-parallel’,
assignedTeams: [‘Model Office’, ‘Security Data’],
startDate: ‘2024-08-01’,
targetDate: ‘2024-11-01’,
comments: 22,
exceptions: 2,
risk: ‘medium’,
funds: [
{ name: ‘Phoenix Corporate Bond Fund’, aum: 220000000, status: ‘In Progress’, progress: 92 },
{ name: ‘Phoenix High Yield Fund’, aum: 150000000, status: ‘In Progress’, progress: 88 }
],
totalAUM: 370000000,
navVariances: [
{ fund: ‘Phoenix Corporate Bond Fund’, variance: 0.004, status: ‘within’ },
{ fund: ‘Phoenix High Yield Fund’, variance: 0.006, status: ‘within’ }
]
},
{
id: 4,
eventName: ‘Meridian Balanced Funds’,
client: ‘Meridian Capital’,
source: ‘Geneva’,
status: ‘Completed’,
progress: 100,
currentStep: ‘completed’,
assignedTeams: [‘Model Office’, ‘Security Data’, ‘Static Data’],
startDate: ‘2024-06-15’,
targetDate: ‘2024-10-15’,
comments: 35,
exceptions: 0,
risk: ‘low’,
funds: [
{ name: ‘Meridian Balanced Fund I’, aum: 135000000, status: ‘Completed’, progress: 100 },
{ name: ‘Meridian Balanced Fund II’, aum: 85000000, status: ‘Completed’, progress: 100 }
],
totalAUM: 220000000,
navVariances: [
{ fund: ‘Meridian Balanced Fund I’, variance: 0.003, status: ‘within’ },
{ fund: ‘Meridian Balanced Fund II’, variance: 0.002, status: ‘within’ }
]
},
{
id: 5,
eventName: ‘ABC Capital Migration Event’,
client: ‘ABC Capital’,
source: ‘InvestOne’,
status: ‘In Progress’,
progress: 65,
currentStep: ‘data-quality’,
assignedTeams: [‘Model Office’, ‘Security Data’],
startDate: ‘2024-09-15’,
targetDate: ‘2024-11-15’,
comments: 12,
exceptions: 3,
risk: ‘medium’,
funds: [
{ name: ‘ABC Capital Master Fund’, aum: 125000000, status: ‘In Progress’, progress: 70 },
{ name: ‘ABC Capital Series A’, aum: 45000000, status: ‘In Progress’, progress: 65 },
{ name: ‘ABC Capital Series B’, aum: 30000000, status: ‘In Progress’, progress: 60 }
],
totalAUM: 200000000,
navVariances: [
{ fund: ‘ABC Capital Master Fund’, variance: 0.008, status: ‘within’ },
{ fund: ‘ABC Capital Series A’, variance: 0.005, status: ‘within’ },
{ fund: ‘ABC Capital Series B’, variance: 0.009, status: ‘within’ }
]
},
{
id: 6,
eventName: ‘XYZ Trust Conversion’,
client: ‘XYZ Investment Trust’,
source: ‘IAS’,
status: ‘In Progress’,
progress: 45,
currentStep: ‘security-verification’,
assignedTeams: [‘Security Data’, ‘Static Data’],
startDate: ‘2024-10-01’,
targetDate: ‘2024-12-15’,
comments: 8,
exceptions: 1,
risk: ‘low’,
funds: [
{ name: ‘XYZ Investment Trust - Equity’, aum: 80000000, status: ‘In Progress’, progress: 50 },
{ name: ‘XYZ Investment Trust - Fixed Income’, aum: 60000000, status: ‘In Progress’, progress: 40 }
],
totalAUM: 140000000,
navVariances: [
{ fund: ‘XYZ Investment Trust - Equity’, variance: 0.003, status: ‘within’ },
{ fund: ‘XYZ Investment Trust - Fixed Income’, variance: 0.002, status: ‘within’ }
]
},
{
id: 7,
eventName: ‘Horizon Multi-Strategy Event’,
client: ‘Horizon Asset Management’,
source: ‘SimCorp’,
status: ‘In Progress’,
progress: 25,
currentStep: ‘entity-setup’,
assignedTeams: [‘Static Data’, ‘Model Office’],
startDate: ‘2024-10-10’,
targetDate: ‘2025-01-20’,
comments: 5,
exceptions: 0,
risk: ‘low’,
funds: [
{ name: ‘Horizon Multi-Strategy Fund’, aum: 180000000, status: ‘In Progress’, progress: 25 }
],
totalAUM: 180000000,
navVariances: [
{ fund: ‘Horizon Multi-Strategy Fund’, variance: 0.001, status: ‘within’ }
]
}
]);

// Model Office Workflow Steps
const modelOfficeWorkflow = [
{
id: ‘data-ingestion’,
title: ‘Data Ingestion’,
description: ‘Import files from source accounting system for all funds’,
status: ‘completed’,
icon: Upload,
duration: ‘2-3 days’,
aiEnabled: true,
tasks: [
{ name: ‘Upload position files (all funds)’, status: ‘completed’, assignee: ‘John Smith’ },
{ name: ‘Upload transaction files (all funds)’, status: ‘completed’, assignee: ‘John Smith’ },
{ name: ‘Upload ledger files (all funds)’, status: ‘completed’, assignee: ‘Sarah Lee’ },
{ name: ‘AI file structure analysis’, status: ‘completed’, assignee: ‘AI System’ }
],
deliverables: [‘Position Data’, ‘Transaction Data’, ‘Ledger Data’, ‘Source File Catalog’],
fundStatus: []
},
{
id: ‘data-integrity’,
title: ‘Data Integrity Checks’,
description: ‘Validate data completeness and consistency across all funds’,
status: ‘completed’,
icon: FileCheck,
duration: ‘1-2 days’,
aiEnabled: true,
tasks: [
{ name: ‘Check data completeness (all funds)’, status: ‘completed’, assignee: ‘Mike Chen’ },
{ name: ‘Validate date formats’, status: ‘completed’, assignee: ‘AI System’ },
{ name: ‘Cross-reference security IDs’, status: ‘completed’, assignee: ‘AI System’ },
{ name: ‘Identify data gaps’, status: ‘completed’, assignee: ‘Mike Chen’ }
],
deliverables: [‘Integrity Report’, ‘Data Gap Analysis’, ‘Validation Summary’],
fundStatus: []
},
{
id: ‘data-quality’,
title: ‘Data Quality Checks’,
description: ‘Sub-ledger to Ledger Roll Up validation for each fund’,
status: ‘in-progress’,
icon: BarChart2,
duration: ‘2-3 days’,
aiEnabled: true,
tasks: [
{ name: ‘Sub-ledger to Ledger rollup’, status: ‘completed’, assignee: ‘Emily Davis’ },
{ name: ‘Ledger to NAV reconciliation’, status: ‘in-progress’, assignee: ‘Emily Davis’ },
{ name: ‘Cash position validation’, status: ‘in-progress’, assignee: ‘John Smith’ },
{ name: ‘AI variance detection’, status: ‘pending’, assignee: ‘AI System’ }
],
deliverables: [‘Rollup Report’, ‘NAV Reconciliation’, ‘Variance Analysis’],
fundStatus: []
},
{
id: ‘data-transformation’,
title: ‘Data Transformation’,
description: ‘Transform source data to Eagle format for all funds’,
status: ‘pending’,
icon: RefreshCw,
duration: ‘3-4 days’,
aiEnabled: true,
tasks: [
{ name: ‘Apply mapping rules’, status: ‘pending’, assignee: ‘Mike Chen’ },
{ name: ‘Transform position data (all funds)’, status: ‘pending’, assignee: ‘AI System’ },
{ name: ‘Transform transaction data (all funds)’, status: ‘pending’, assignee: ‘AI System’ },
{ name: ‘Validate transformed output’, status: ‘pending’, assignee: ‘Mike Chen’ }
],
deliverables: [‘Eagle Format Files’, ‘Transformation Log’, ‘Mapping Report’],
fundStatus: []
},
{
id: ‘iterative-load’,
title: ‘Iterative Eagle Load & Recon’,
description: ‘Load to Eagle with continuous reconciliation for each fund’,
status: ‘pending’,
icon: Database,
duration: ‘5-7 days’,
aiEnabled: true,
tasks: [
{ name: ‘Initial data load (all funds)’, status: ‘pending’, assignee: ‘John Smith’ },
{ name: ‘Run reconciliation report’, status: ‘pending’, assignee: ‘AI System’ },
{ name: ‘Identify and fix discrepancies’, status: ‘pending’, assignee: ‘Emily Davis’ },
{ name: ‘Iterative load cycles’, status: ‘pending’, assignee: ‘John Smith’ }
],
deliverables: [‘Load Summary’, ‘Recon Reports’, ‘Exception Log’, ‘Sign-off Document’],
fundStatus: []
}
];

// Security Data Workflow Steps
const securityDataWorkflow = [
{
id: ‘ai-analysis’,
title: ‘AI Position Analysis’,
description: ‘AI analyzes position files across all funds’,
status: ‘completed’,
icon: Brain,
duration: ‘1 day’,
aiEnabled: true,
tasks: [
{ name: ‘AI scans position files (all funds)’, status: ‘completed’, assignee: ‘AI System’ },
{ name: ‘Extract security identifiers’, status: ‘completed’, assignee: ‘AI System’ },
{ name: ‘Generate consolidated security list’, status: ‘completed’, assignee: ‘AI System’ },
{ name: ‘Classification analysis’, status: ‘completed’, assignee: ‘AI System’ }
],
deliverables: [‘Consolidated Security List’, ‘AI Classification Report’, ‘Missing Securities Report’]
},
{
id: ‘security-master-check’,
title: ‘Security Master Check’,
description: ‘Verify against existing security master’,
status: ‘completed’,
icon: Database,
duration: ‘1-2 days’,
aiEnabled: false,
tasks: [
{ name: ‘Query internal security master’, status: ‘completed’, assignee: ‘Sarah Johnson’ },
{ name: ‘Identify existing securities’, status: ‘completed’, assignee: ‘Sarah Johnson’ },
{ name: ‘Flag missing securities’, status: ‘completed’, assignee: ‘Sarah Johnson’ },
{ name: ‘Document match rate’, status: ‘completed’, assignee: ‘Sarah Johnson’ }
],
deliverables: [‘Match Report’, ‘Missing Securities List’, ‘Master Coverage Analysis’]
},
{
id: ‘security-verification’,
title: ‘AI Classification Verification’,
description: ‘Verify AI recommendations on security classification’,
status: ‘in-progress’,
icon: Shield,
duration: ‘2-3 days’,
aiEnabled: true,
tasks: [
{ name: ‘Review AI classifications’, status: ‘completed’, assignee: ‘Tom Rodriguez’ },
{ name: ‘Verify asset classes’, status: ‘in-progress’, assignee: ‘Tom Rodriguez’ },
{ name: ‘Validate security attributes’, status: ‘in-progress’, assignee: ‘Sarah Johnson’ },
{ name: ‘Approve or override AI’, status: ‘pending’, assignee: ‘Tom Rodriguez’ }
],
deliverables: [‘Verified Classifications’, ‘Override Log’, ‘Approval Summary’]
},
{
id: ‘vendor-sourcing’,
title: ‘Vendor Data Sourcing’,
description: ‘Source missing securities from Bloomberg/Vendors’,
status: ‘pending’,
icon: ExternalLink,
duration: ‘2-4 days’,
aiEnabled: false,
tasks: [
{ name: ‘Query Bloomberg terminals’, status: ‘pending’, assignee: ‘Sarah Johnson’ },
{ name: ‘Request vendor data feeds’, status: ‘pending’, assignee: ‘Tom Rodriguez’ },
{ name: ‘Map vendor data to Eagle’, status: ‘pending’, assignee: ‘Sarah Johnson’ },
{ name: ‘Load into security master’, status: ‘pending’, assignee: ‘Tom Rodriguez’ }
],
deliverables: [‘Bloomberg Data’, ‘Vendor Feeds’, ‘Security Master Updates’]
},
{
id: ‘otc-routing’,
title: ‘OTC Security Routing’,
description: ‘Route OTC securities for book and build’,
status: ‘pending’,
icon: GitBranch,
duration: ‘3-5 days’,
aiEnabled: false,
tasks: [
{ name: ‘Identify OTC securities’, status: ‘pending’, assignee: ‘Sarah Johnson’ },
{ name: ‘Route to OTC team (TRS, IRS)’, status: ‘pending’, assignee: ‘Sarah Johnson’ },
{ name: ‘FX Options & Exotics setup’, status: ‘pending’, assignee: ‘OTC Team’ },
{ name: ‘Book and build completion’, status: ‘pending’, assignee: ‘OTC Team’ }
],
deliverables: [‘OTC Security List’, ‘Build Requests’, ‘Completed OTC Securities’]
}
];

// Static Data Workflow Steps
const staticDataWorkflow = [
{
id: ‘ledger-mapping’,
title: ‘Ledger Mapping’,
description: ‘Map source ledgers to Eagle chart of accounts’,
status: ‘completed’,
icon: FileSpreadsheet,
duration: ‘2-3 days’,
aiEnabled: true,
tasks: [
{ name: ‘Extract source ledger codes’, status: ‘completed’, assignee: ‘Lisa Park’ },
{ name: ‘AI mapping suggestions’, status: ‘completed’, assignee: ‘AI System’ },
{ name: ‘Validate ledger mappings’, status: ‘completed’, assignee: ‘Lisa Park’ },
{ name: ‘Create xref tables’, status: ‘completed’, assignee: ‘Lisa Park’ }
],
deliverables: [‘Ledger Mapping Table’, ‘Chart of Accounts Xref’, ‘Mapping Rules’]
},
{
id: ‘entity-setup’,
title: ‘Entity Setup in Eagle’,
description: ‘Configure entities and hierarchy for all funds’,
status: ‘in-progress’,
icon: Building2,
duration: ‘3-5 days’,
aiEnabled: false,
tasks: [
{ name: ‘Create master fund entity’, status: ‘completed’, assignee: ‘Robert Kim’ },
{ name: ‘Create sub-fund entities’, status: ‘in-progress’, assignee: ‘Robert Kim’ },
{ name: ‘Setup entity hierarchy’, status: ‘in-progress’, assignee: ‘Lisa Park’ },
{ name: ‘Configure entity attributes’, status: ‘pending’, assignee: ‘Robert Kim’ }
],
deliverables: [‘Entity Structure’, ‘Hierarchy Diagram’, ‘Entity Configuration’]
},
{
id: ‘broker-setup’,
title: ‘Broker Code Setup’,
description: ‘Map and setup broker codes from DTCC, Euroclear’,
status: ‘pending’,
icon: Users,
duration: ‘2-3 days’,
aiEnabled: false,
tasks: [
{ name: ‘Extract broker codes from source’, status: ‘pending’, assignee: ‘Lisa Park’ },
{ name: ‘Match against DTCC universe’, status: ‘pending’, assignee: ‘Robert Kim’ },
{ name: ‘Match against Euroclear’, status: ‘pending’, assignee: ‘Robert Kim’ },
{ name: ‘Create broker master xref’, status: ‘pending’, assignee: ‘Lisa Park’ }
],
deliverables: [‘Broker Code Mapping’, ‘DTCC Xref’, ‘Euroclear Xref’, ‘Broker Master’]
}
];

const [toleranceExceptions] = useState([
{
id: 1,
eventName: ‘Global Equity Fund Family’,
fund: ‘Global Equity Fund - Growth’,
type: ‘NAV Variance’,
sourceNAV: 125450000,
targetNAV: 125468750,
variance: 18750,
variancePercent: 0.015,
tolerance: 0.01,
status: ‘breach’,
severity: ‘high’,
date: ‘2024-10-14’,
assignedTo: ‘Model Office’
},
{
id: 2,
eventName: ‘ABC Capital Migration Event’,
fund: ‘ABC Capital Master Fund’,
type: ‘Cash Position’,
sourceNAV: 8500000,
targetNAV: 8506800,
variance: 6800,
variancePercent: 0.008,
tolerance: 0.01,
status: ‘within’,
severity: ‘medium’,
date: ‘2024-10-14’,
assignedTo: ‘Model Office’
},
{
id: 3,
eventName: ‘Global Equity Fund Family’,
fund: ‘Global Equity Fund - Balanced’,
type: ‘Security Valuation’,
sourceNAV: 45000000,
targetNAV: 45005400,
variance: 5400,
variancePercent: 0.012,
tolerance: 0.01,
status: ‘breach’,
severity: ‘high’,
date: ‘2024-10-15’,
assignedTo: ‘Security Data’
}
]);

const MainDashboard = () => (
<div className="space-y-6">
<div className="flex items-center justify-between">
<div>
<h1 className="text-3xl font-semibold text-gray-900">Fund Conversion Events</h1>
<p className="text-gray-500 mt-1">Monitor all Eagle Accounting migration events</p>
</div>
<div className="flex items-center gap-3">
<button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
<Filter className="w-4 h-4 text-gray-600" />
<span className="text-sm font-medium text-gray-700">Filter</span>
</button>
<button className=“flex items-center gap-2 px-4 py-2.5 text-white rounded-xl hover:opacity-90 transition-colors shadow-sm” style={{ backgroundColor: ‘#e7500d’ }}>
<Upload className="w-4 h-4" />
<span className="text-sm font-medium">New Event</span>
</button>
</div>
</div>

```
  <div className="grid grid-cols-4 gap-6">
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
          <Package className="w-6 h-6 text-indigo-600" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900">7</p>
      <p className="text-sm text-gray-500 mt-1">Total Events</p>
    </div>

    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-blue-600" />
        </div>
        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">Active</span>
      </div>
      <p className="text-2xl font-semibold text-gray-900">5</p>
      <p className="text-sm text-gray-500 mt-1">In Progress</p>
    </div>

    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">100%</span>
      </div>
      <p className="text-2xl font-semibold text-gray-900">2</p>
      <p className="text-sm text-gray-500 mt-1">Completed</p>
    </div>

    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-amber-600" />
        </div>
        <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg">AUM</span>
      </div>
      <p className="text-2xl font-semibold text-gray-900">$1.65B</p>
      <p className="text-sm text-gray-500 mt-1">Total Migration Value</p>
    </div>
  </div>

  {/* Calendar Timeline Widget */}
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-6 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Conversion Timeline Calendar</h2>
          <p className="text-gray-500 text-sm mt-1">Q4 2024 - Q1 2025 Migration Schedule</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#e7500d' }}></div>
            <span className="text-gray-600">Urgent</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">On Track</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <span className="text-gray-600">Completed</span>
          </div>
        </div>
      </div>
    </div>
    
    <div className="p-6">
      {/* Month Headers */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {['October 2024', 'November 2024', 'December 2024', 'January 2025'].map((month, idx) => (
          <div key={idx} className="text-center">
            <h3 className="text-sm font-semibold text-gray-900">{month}</h3>
          </div>
        ))}
      </div>
      
      {/* Timeline Rows */}
      <div className="space-y-4">
        {events
          .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate))
          .map((event, idx) => {
            const daysUntil = Math.ceil((new Date(event.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
            const isUrgent = daysUntil <= 30 && daysUntil >= 0;
            const isCompleted = event.progress === 100;
            const targetDate = new Date(event.targetDate);
            const startDate = new Date(event.startDate);
            
            // Calculate position on timeline (Oct 1 = 0%, Jan 31 = 100%)
            const timelineStart = new Date('2024-10-01');
            const timelineEnd = new Date('2025-01-31');
            const totalDuration = timelineEnd - timelineStart;
            
            const eventStart = ((startDate - timelineStart) / totalDuration) * 100;
            const eventEnd = ((targetDate - timelineStart) / totalDuration) * 100;
            const eventWidth = eventEnd - eventStart;
            
            return (
              <div key={event.id} className="relative">
                {/* Background Timeline Grid */}
                <div className="grid grid-cols-4 gap-6 absolute inset-0 pointer-events-none">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="border-l border-gray-200"></div>
                  ))}
                </div>
                
                {/* Event Bar */}
                <div className="relative h-20 mb-2">
                  <div 
                    className="absolute h-full rounded-xl cursor-pointer hover:shadow-lg transition-all group"
                    style={{
                      left: `${Math.max(0, eventStart)}%`,
                      width: `${Math.min(100 - eventStart, eventWidth)}%`,
                      backgroundColor: isCompleted ? '#f0fdf4' : isUrgent ? '#fef3f0' : '#eff6ff',
                      border: `2px solid ${isCompleted ? '#10b981' : isUrgent ? '#e7500d' : '#3b82f6'}`
                    }}
                    onClick={() => {
                      setSelectedEvent(event);
                      setActiveTab('model-office-workflow');
                    }}
                  >
                    <div className="p-3 h-full flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isCompleted ? '#10b981' : isUrgent ? '#e7500d' : '#3b82f6' }} />
                            <h4 className="font-semibold text-xs text-gray-900 truncate">{event.eventName}</h4>
                          </div>
                          <p className="text-xs text-gray-600">{event.funds.length} funds • ${(event.totalAUM / 1000000).toFixed(0)}M</p>
                        </div>
                        <div className="flex-shrink-0">
                          {isCompleted && (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          )}
                          {isUrgent && !isCompleted && (
                            <AlertCircle className="w-4 h-4" style={{ color: '#e7500d' }} />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="h-1.5 rounded-full transition-all"
                              style={{ 
                                width: `${event.progress}%`,
                                backgroundColor: isCompleted ? '#10b981' : isUrgent ? '#e7500d' : '#3b82f6'
                              }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-gray-900">{event.progress}%</span>
                      </div>
                    </div>
                    
                    {/* Target Date Marker */}
                    <div 
                      className="absolute -bottom-8 right-0 flex flex-col items-center"
                    >
                      <div className="w-0.5 h-6" style={{ backgroundColor: isCompleted ? '#10b981' : isUrgent ? '#e7500d' : '#3b82f6' }}></div>
                      <div 
                        className="px-2 py-0.5 rounded text-xs font-semibold text-white whitespace-nowrap shadow-sm"
                        style={{ backgroundColor: isCompleted ? '#10b981' : isUrgent ? '#e7500d' : '#3b82f6' }}
                      >
                        {targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
      
      {/* Month Markers at Bottom */}
      <div className="grid grid-cols-4 gap-6 mt-8 pt-4 border-t border-gray-200">
        {[
          { month: 'Oct', days: '1-31' },
          { month: 'Nov', days: '1-30' },
          { month: 'Dec', days: '1-31' },
          { month: 'Jan', days: '1-31' }
        ].map((marker, idx) => (
          <div key={idx} className="text-center">
            <div className="text-xs text-gray-500">{marker.days}</div>
          </div>
        ))}
      </div>
    </div>
    
    {/* Summary Footer */}
    <div className="border-t border-gray-100 p-6 bg-gray-50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Timeline Overview</h3>
          <p className="text-sm text-gray-600">
            <span className="font-semibold" style={{ color: '#e7500d' }}>
              {events.filter(e => {
                const days = Math.ceil((new Date(e.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
                return days <= 30 && days >= 0 && e.progress < 100;
              }).length}
            </span> urgent events requiring attention
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-gray-500">In Progress: </span>
            <span className="font-semibold text-gray-900">
              {events.filter(e => e.progress < 100).length}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Completed: </span>
            <span className="font-semibold text-emerald-600">
              {events.filter(e => e.progress === 100).length}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Total AUM: </span>
            <span className="font-semibold text-gray-900">
              ${(events.reduce((sum, e) => sum + e.totalAUM, 0) / 1000000000).toFixed(2)}B
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div className="grid grid-cols-4 gap-4">
    {[
      { id: 'model-office', name: 'Model Office', icon: Database, color: 'indigo', bgColor: '#eef2ff', iconColor: '#4f46e5', count: '5 active' },
      { id: 'security-data', name: 'Security Data', icon: Shield, color: 'emerald', bgColor: '#ecfdf5', iconColor: '#10b981', count: '4 active' },
      { id: 'static-data', name: 'Static Data', icon: Building2, color: 'orange', bgColor: '#fef3f0', iconColor: '#e7500d', count: '4 active' },
      { id: 'senior-mgmt', name: 'Management', icon: TrendingUp, color: 'blue', bgColor: '#eff6ff', iconColor: '#3b82f6', count: 'Overview' }
    ].map((team) => {
      const Icon = team.icon;
      return (
        <button
          key={team.id}
          onClick={() => setSelectedRole(team.id)}
          className="group p-5 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all bg-white text-left"
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ backgroundColor: team.bgColor }}>
            <Icon className="w-5 h-5" style={{ color: team.iconColor }} />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">{team.name}</h3>
          <p className="text-sm text-gray-500">{team.count}</p>
        </button>
      );
    })}
  </div>

  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-6 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Active Conversion Events</h2>
        <button className="text-sm font-medium hover:opacity-80" style={{ color: '#e7500d' }}>View All</button>
      </div>
    </div>
    <div className="divide-y divide-gray-100">
      {events.map((event) => (
        <div 
          key={event.id} 
          className="p-6 hover:bg-gray-50 cursor-pointer transition-colors group"
          onClick={() => {
            setSelectedEvent(event);
            setActiveTab('model-office-workflow');
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-5 h-5" style={{ color: '#e7500d' }} />
                <h3 className="text-base font-semibold text-gray-900">{event.eventName}</h3>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  event.risk === 'high' ? 'bg-red-50 text-red-700' :
                  event.risk === 'medium' ? 'bg-amber-50 text-amber-700' :
                  'bg-emerald-50 text-emerald-700'
                }`}>
                  {event.risk === 'high' ? 'High Risk' : event.risk === 'medium' ? 'Medium Risk' : 'Low Risk'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  {event.source} → Eagle
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {event.funds.length} funds
                </span>
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  ${(event.totalAUM / 1000000).toFixed(0)}M AUM
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Target: {event.targetDate}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Funds in Event:</p>
                <div className="flex flex-wrap gap-2">
                  {event.funds.map((fund, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700">
                      {fund.name} • {fund.progress}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 ml-4" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Overall Event Progress</span>
              <span className="text-gray-900 font-semibold">{event.progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${event.progress}%`,
                  backgroundColor: '#e7500d'
                }}
              ></div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-gray-600">
                <MessageSquare className="w-3.5 h-3.5" />
                {event.comments} comments
              </span>
              {event.exceptions > 0 && (
                <span className="flex items-center gap-1.5 text-amber-600">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {event.exceptions} exceptions
                </span>
              )}
              <span className="flex items-center gap-1.5 text-gray-600">
                <Users className="w-3.5 h-3.5" />
                {event.assignedTeams.join(', ')}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>
```

);

const WorkflowDetailView = ({ workflow, title, event }) => {
return (
<div className="space-y-6">
<div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-2xl p-6">
<div className="flex items-center gap-3 mb-2">
<Package className="w-6 h-6" />
<h2 className="text-2xl font-bold">{title}</h2>
</div>
<p className="text-indigo-100 mb-4">{event.eventName} - {event.source} → Eagle</p>
<div className="grid grid-cols-3 gap-4">
<div className="bg-white/10 rounded-xl p-3">
<p className="text-indigo-200 text-sm">Total Funds</p>
<p className="text-2xl font-bold mt-1">{event.funds.length}</p>
</div>
<div className="bg-white/10 rounded-xl p-3">
<p className="text-indigo-200 text-sm">Total AUM</p>
<p className="text-2xl font-bold mt-1">${(event.totalAUM / 1000000).toFixed(0)}M</p>
</div>
<div className="bg-white/10 rounded-xl p-3">
<p className="text-indigo-200 text-sm">Progress</p>
<p className="text-2xl font-bold mt-1">{event.progress}%</p>
</div>
</div>
</div>

```
    {/* Fund-level Status */}
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Fund-Level Progress</h3>
      <div className="space-y-3">
        {event.funds.map((fund, idx) => (
          <div key={idx} className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-gray-900">{fund.name}</h4>
                <p className="text-sm text-gray-500">AUM: ${(fund.aum / 1000000).toFixed(1)}M</p>
              </div>
              <span className="text-sm font-semibold text-gray-900">{fund.progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all"
                style={{ 
                  width: `${fund.progress}%`,
                  backgroundColor: '#e7500d'
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="space-y-4">
      {workflow.map((step, index) => {
        const StepIcon = step.icon;
        const isCompleted = step.status === 'completed';
        const isInProgress = step.status === 'in-progress';
        const isPending = step.status === 'pending';

        return (
          <div key={step.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div 
              className={`p-6 cursor-pointer transition-colors ${
                selectedWorkflowStep === step.id ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedWorkflowStep(selectedWorkflowStep === step.id ? null : step.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isCompleted ? 'bg-emerald-50' :
                  isInProgress ? 'bg-blue-50' :
                  'bg-gray-100'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <StepIcon className={`w-6 h-6 ${
                      isInProgress ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                        {step.aiEnabled && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: '#fef3f0', color: '#e7500d' }}>
                            <Zap className="w-3 h-3" />
                            AI Enabled
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 ${
                      isCompleted ? 'bg-emerald-50 text-emerald-700' :
                      isInProgress ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {step.duration}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CircleDot className="w-4 h-4" />
                      {step.tasks.filter(t => t.status === 'completed').length}/{step.tasks.length} tasks
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      Applies to all {event.funds.length} funds
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {selectedWorkflowStep === step.id && (
              <div className="border-t border-gray-100 bg-gray-50 p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Tasks</h4>
                    <div className="space-y-2">
                      {step.tasks.map((task, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            {task.status === 'completed' ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            ) : task.status === 'in-progress' ? (
                              <RefreshCw className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-gray-400" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{task.name}</p>
                              <p className="text-xs text-gray-500">{task.assignee}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            task.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                            task.status === 'in-progress' ? 'bg-blue-50 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Deliverables</h4>
                    <div className="space-y-2">
                      {step.deliverables.map((deliverable, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4" style={{ color: '#e7500d' }} />
                            <span className="text-sm font-medium text-gray-900">{deliverable}</span>
                          </div>
                          {isCompleted && (
                            <button className="text-xs font-medium hover:opacity-80" style={{ color: '#e7500d' }}>
                              Download
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);
```

};

const ModelOfficeDashboard = () => {
return (
<div className="space-y-6">
<div className="flex items-center justify-between">
<div>
<h1 className="text-3xl font-semibold text-gray-900">Model Office</h1>
<p className="text-gray-500 mt-1">Position Load, Ledger & Data Quality Management</p>
</div>
<button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
<Upload className="w-4 h-4" />
<span className="text-sm font-medium">Import Data</span>
</button>
</div>

```
    <div className="grid grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-gray-900">3</p>
        <p className="text-sm text-gray-500 mt-1">Urgent Tasks</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-gray-900">5</p>
        <p className="text-sm text-gray-500 mt-1">Active Events</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
        </div>
        <p className="text-2xl font-semibold text-gray-900">2</p>
        <p className="text-sm text-gray-500 mt-1">Completed</p>
      </div>
    </div>

    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">My Active Events</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {events.filter(e => e.assignedTeams.includes('Model Office')).map((event) => (
          <div 
            key={event.id} 
            className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => {
              setSelectedEvent(event);
              setActiveTab('model-office-workflow');
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{event.eventName}</h3>
                <p className="text-sm text-gray-500">{event.funds.length} funds • ${(event.totalAUM / 1000000).toFixed(0)}M AUM</p>
              </div>
              <span className="px-3 py-1.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#e7500d' }}>
                {event.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="h-2 rounded-full"
                style={{ 
                  width: `${event.progress}%`,
                  backgroundColor: '#e7500d'
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
```

};

const SecurityDataDashboard = () => (
<div className="space-y-6">
<div className="flex items-center justify-between">
<div>
<h1 className="text-3xl font-semibold text-gray-900">Security Data Management</h1>
<p className="text-gray-500 mt-1">Security Master & CUSIP Management</p>
</div>
<button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
<Shield className="w-4 h-4" />
<span className="text-sm font-medium">Create Security</span>
</button>
</div>

```
  <div className="grid grid-cols-3 gap-6">
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-amber-600" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900">18</p>
      <p className="text-sm text-gray-500 mt-1">New Securities Needed</p>
    </div>

    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
          <Clock className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900">5</p>
      <p className="text-sm text-gray-500 mt-1">In Review</p>
    </div>

    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900">245</p>
      <p className="text-sm text-gray-500 mt-1">Created Total</p>
    </div>
  </div>

  <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
    <div className="p-6 border-b border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900">Securities Queue by Event</h2>
    </div>
    <div className="divide-y divide-gray-100">
      {events.filter(e => e.assignedTeams.includes('Security Data')).map((event) => (
        <div 
          key={event.id} 
          className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => {
            setSelectedEvent(event);
            setActiveTab('security-workflow');
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{event.eventName}</h3>
              <p className="text-sm text-gray-500">{event.funds.length} funds • {event.source} → Eagle</p>
            </div>
            <span className="text-sm font-medium text-gray-700">Security Setup</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-xl font-semibold text-amber-700">8</p>
              <p className="text-xs text-amber-600 mt-1">Pending</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xl font-semibold text-blue-700">3</p>
              <p className="text-xs text-blue-600 mt-1">In Review</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xl font-semibold text-emerald-700">45</p>
              <p className="text-xs text-emerald-600 mt-1">Created</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>
```

);

const StaticDataDashboard = () => (
<div className="space-y-6">
<div className="flex items-center justify-between">
<div>
<h1 className="text-3xl font-semibold text-gray-900">Static Data Management</h1>
<p className="text-gray-500 mt-1">Eagle Entity Setup & Hierarchy Management</p>
</div>
<button className=“flex items-center gap-2 px-4 py-2.5 text-white rounded-xl hover:opacity-90 transition-colors shadow-sm” style={{ backgroundColor: ‘#e7500d’ }}>
<Building2 className="w-4 h-4" />
<span className="text-sm font-medium">Setup Entity</span>
</button>
</div>

```
  <div className="grid grid-cols-3 gap-6">
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
          <Clock className="w-6 h-6 text-amber-600" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900">2</p>
      <p className="text-sm text-gray-500 mt-1">Pending Setup</p>
    </div>

    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#fef3f0' }}>
          <RefreshCw className="w-6 h-6" style={{ color: '#e7500d' }} />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900">3</p>
      <p className="text-sm text-gray-500 mt-1">In Configuration</p>
    </div>

    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900">2</p>
      <p className="text-sm text-gray-500 mt-1">Completed Events</p>
    </div>
  </div>

  <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
    <div className="p-6 border-b border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900">Entity Setup by Event</h2>
    </div>
    <div className="divide-y divide-gray-100">
      {events.filter(e => e.assignedTeams.includes('Static Data')).map((event) => (
        <div 
          key={event.id} 
          className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => {
            setSelectedEvent(event);
            setActiveTab('static-workflow');
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{event.eventName}</h3>
              <p className="text-sm text-gray-500">{event.funds.length} funds • {event.source} → Eagle</p>
            </div>
            <span className="text-sm font-medium text-gray-700">Static Data Setup</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#e7500d' }}></div>
              <span className="text-gray-600">Entities: <strong className="text-gray-900">{event.funds.length + 1}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Xref Tables: <strong className="text-gray-900">5</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-gray-600">Hierarchies: <strong className="text-gray-900">1</strong></span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>
```

);

const ManagementDashboard = () => (
<div className="space-y-6">
<div className="flex items-center justify-between">
<div>
<h1 className="text-3xl font-semibold text-gray-900">Management Dashboard</h1>
<p className="text-gray-500 mt-1">NAV Reconciliation & Tolerance Monitoring</p>
</div>
<button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
<Download className="w-4 h-4" />
<span className="text-sm font-medium">Export Report</span>
</button>
</div>

```
  <div className="grid grid-cols-4 gap-6">
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
          <Package className="w-6 h-6 text-indigo-600" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900">7</p>
      <p className="text-sm text-gray-500 mt-1">Total Events</p>
    </div>

    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
          <Target className="w-6 h-6 text-emerald-600" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900">12</p>
      <p className="text-sm text-gray-500 mt-1">Funds Within Tolerance</p>
    </div>

    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900">2</p>
      <p className="text-sm text-gray-500 mt-1">Tolerance Breaches</p>
    </div>

    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
          <Percent className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900">0.01%</p>
      <p className="text-sm text-gray-500 mt-1">Tolerance Threshold</p>
    </div>
  </div>

  <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
    <div className="p-6 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">NAV Reconciliation Exceptions</h2>
        <div className="flex items-center gap-2">
          <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">Filter</button>
          <button className="text-sm font-medium hover:opacity-80" style={{ color: '#e7500d' }}>Export</button>
        </div>
      </div>
    </div>
    <div className="divide-y divide-gray-100">
      {toleranceExceptions.map((exception) => (
        <div key={exception.id} className="p-6 hover:bg-gray-50 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-gray-900">{exception.eventName}</h3>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  exception.status === 'breach' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {exception.status === 'breach' ? 'Tolerance Breach' : 'Within Tolerance'}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  exception.severity === 'high' ? 'bg-red-50 text-red-700' :
                  exception.severity === 'medium' ? 'bg-amber-50 text-amber-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  {exception.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">Fund: {exception.fund} • {exception.type}</p>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Source NAV</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ${(exception.sourceNAV / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Target NAV</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ${(exception.targetNAV / 1000000).toFixed(2)}M
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Variance</p>
                  <p className={`text-sm font-semibold ${
                    exception.status === 'breach' ? 'text-red-600' : 'text-emerald-600'
                  }`}>
                    ${(exception.variance / 1000).toFixed(1)}K
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Variance %</p>
                  <p className={`text-sm font-semibold ${
                    exception.status === 'breach' ? 'text-red-600' : 'text-emerald-600'
                  }`}>
                    {(exception.variancePercent * 100).toFixed(3)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {exception.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {exception.assignedTo}
              </span>
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                Tolerance: {(exception.tolerance * 100).toFixed(2)}%
              </span>
            </div>
            {exception.status === 'breach' && (
              <button className="px-4 py-2 text-white rounded-lg hover:opacity-90 text-sm font-medium" style={{ backgroundColor: '#e7500d' }}>
                Review Exception
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
</div>
```

);

const EventDetailView = () => {
if (!selectedEvent) return null;

```
return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <button
        onClick={() => {
          setSelectedEvent(null);
          setSelectedRole(null);
          setActiveTab('workflow');
        }}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        <span className="text-sm font-medium">Back to Dashboard</span>
      </button>
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>

    <div className="bg-white border-b border-gray-200 rounded-t-2xl">
      <nav className="flex gap-8 px-6">
        {[
          { id: 'model-office-workflow', label: 'Model Office' },
          { id: 'security-workflow', label: 'Security Data' },
          { id: 'static-workflow', label: 'Static Data' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 border-b-2 transition-colors font-medium ${
              activeTab === tab.id
                ? 'text-white'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            style={activeTab === tab.id ? { borderColor: '#e7500d', color: '#e7500d' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>

    {activeTab === 'model-office-workflow' && (
      <WorkflowDetailView 
        workflow={modelOfficeWorkflow} 
        title="Model Office Workflow"
        event={selectedEvent}
      />
    )}
    {activeTab === 'security-workflow' && (
      <WorkflowDetailView 
        workflow={securityDataWorkflow} 
        title="Security Data Management Workflow"
        event={selectedEvent}
      />
    )}
    {activeTab === 'static-workflow' && (
      <WorkflowDetailView 
        workflow={staticDataWorkflow} 
        title="Static Data Management Workflow"
        event={selectedEvent}
      />
    )}
  </div>
);
```

};

return (
<div className="min-h-screen bg-gray-50">
<nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
<div className="max-w-7xl mx-auto px-6">
<div className="flex items-center justify-between h-16">
<div className="flex items-center gap-3">
<div className=“w-10 h-10 rounded-xl flex items-center justify-center shadow-sm” style={{ background: ‘linear-gradient(135deg, #e7500d 0%, #c74309 100%)’ }}>
<Activity className="w-5 h-5 text-white" />
</div>
<div>
<h1 className="text-lg font-semibold text-gray-900">Fund Conversion Platform</h1>
<p className="text-xs text-gray-500">Eagle Accounting Migration</p>
</div>
</div>
<div className="flex items-center gap-3">
{selectedRole && (
<button
onClick={() => {
setSelectedEvent(null);
setSelectedRole(null);
}}
className=“flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors”
>
<ArrowRight className="w-4 h-4 rotate-180" />
<span className="text-sm font-medium">Dashboard</span>
</button>
)}
<button className="p-2 hover:bg-gray-50 rounded-xl transition-colors relative">
<Bell className="w-5 h-5 text-gray-600" />
<span className=“absolute top-1.5 right-1.5 w-2 h-2 rounded-full” style={{ backgroundColor: ‘#e7500d’ }}></span>
</button>
<div className="w-9 h-9 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center">
<span className="text-sm font-semibold text-indigo-700">JD</span>
</div>
</div>
</div>
</div>
</nav>

```
  <main className="max-w-7xl mx-auto px-6 py-8">
    {selectedEvent ? (
      <EventDetailView />
    ) : selectedRole === 'model-office' ? (
      <ModelOfficeDashboard />
    ) : selectedRole === 'security-data' ? (
      <SecurityDataDashboard />
    ) : selectedRole === 'static-data' ? (
      <StaticDataDashboard />
    ) : selectedRole === 'senior-mgmt' ? (
      <ManagementDashboard />
    ) : (
      <MainDashboard />
    )}
  </main>
</div>
```

);
};

export default FundConversionApp;
