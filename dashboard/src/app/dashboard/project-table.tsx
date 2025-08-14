import React, { useState, useMemo } from 'react';
import { ScanResult, RiskLevel } from '@/lib/types';
import { LoadingTable } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  formatScore, 
  formatDate, 
  getRiskColor, 
  getLanguageIcon,
  cn 
} from '@/lib/utils';
import { 
  ChevronUp, 
  ChevronDown, 
  ExternalLink,
  Eye,
  ArrowUpDown
} from 'lucide-react';

interface ProjectTableProps {
  projects: ScanResult[];
  loading?: boolean;
  onProjectClick?: (project: ScanResult) => void;
}

type SortField = 'name' | 'risk_level' | 'overall_score' | 'scan_timestamp';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export function ProjectTable({ projects, loading, onProjectClick }: ProjectTableProps) {
  const [sortField, setSortField] = useState<SortField>('overall_score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and sort projects
  const processedProjects = useMemo(() => {
    let filtered = projects;

    // Filter by search term
    if (searchTerm) {
      filtered = projects.filter(project =>
        project.project_info.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.project_info.path.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort projects
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.project_info.name.toLowerCase();
          bValue = b.project_info.name.toLowerCase();
          break;
        case 'risk_level':
          const riskOrder = { Low: 0, Medium: 1, High: 2, Critical: 3 };
          aValue = riskOrder[a.risk_level];
          bValue = riskOrder[b.risk_level];
          break;
        case 'overall_score':
          aValue = a.debt_metrics.overall_score;
          bValue = b.debt_metrics.overall_score;
          break;
        case 'scan_timestamp':
          aValue = new Date(a.scan_timestamp).getTime();
          bValue = new Date(b.scan_timestamp).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [projects, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedProjects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProjects = processedProjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-semibold"
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ChevronUp className="w-4 h-4 ml-1" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-1" />
        )
      ) : (
        <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />
      )}
    </Button>
  );

  const RiskBadge = ({ risk }: { risk: RiskLevel }) => (
    <Badge 
      variant="outline" 
      className={cn('font-medium', getRiskColor(risk))}
    >
      {risk}
    </Badge>
  );

  const ScoreBar = ({ score, category }: { score: number; category: string }) => {
    const width = Math.min((score / 4) * 100, 100);
    const colorClass = score <= 1 ? 'bg-green-500' : 
                      score <= 2 ? 'bg-yellow-500' : 
                      score <= 3 ? 'bg-orange-500' : 'bg-red-500';

    return (
      <div className="flex items-center space-x-2">
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClass} transition-all duration-300`}
            style={{ width: `${width}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600 min-w-[2rem]">
          {formatScore(score)}
        </span>
      </div>
    );
  };

  if (loading) {
    return <LoadingTable rows={10} columns={6} />;
  }

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded-md w-64 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <span className="text-sm text-gray-500">
            {processedProjects.length} project{processedProjects.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">
                <SortButton field="name">Project</SortButton>
              </th>
              <th className="text-left py-3 px-4">
                <SortButton field="risk_level">Risk Level</SortButton>
              </th>
              <th className="text-left py-3 px-4">
                <SortButton field="overall_score">Overall Score</SortButton>
              </th>
              <th className="text-left py-3 px-4">Category Scores</th>
              <th className="text-left py-3 px-4">Languages</th>
              <th className="text-left py-3 px-4">
                <SortButton field="scan_timestamp">Last Scan</SortButton>
              </th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProjects.map((project) => (
              <tr 
                key={project.project_info.id}
                className="border-b table-row-hover"
              >
                <td className="py-4 px-4">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {project.project_info.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {project.project_info.path}
                    </div>
                  </div>
                </td>
                
                <td className="py-4 px-4">
                  <RiskBadge risk={project.risk_level} />
                </td>
                
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-lg">
                      {formatScore(project.debt_metrics.overall_score)}
                    </span>
                    <span className="text-gray-400">/4.0</span>
                  </div>
                </td>
                
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>Code</span>
                      <ScoreBar score={project.debt_metrics.code_quality_score} category="code" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Arch</span>
                      <ScoreBar score={project.debt_metrics.architecture_score} category="architecture" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Infra</span>
                      <ScoreBar score={project.debt_metrics.infrastructure_score} category="infrastructure" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Ops</span>
                      <ScoreBar score={project.debt_metrics.operations_score} category="operations" />
                    </div>
                  </div>
                </td>
                
                <td className="py-4 px-4">
                  <div className="flex flex-wrap gap-1">
                    {project.project_info.languages && 
                     Object.keys(project.project_info.languages)
                       .slice(0, 3)
                       .map(lang => (
                      <span 
                        key={lang}
                        className="inline-flex items-center text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full"
                      >
                        <span className="mr-1">{getLanguageIcon(lang)}</span>
                        {lang}
                      </span>
                    ))}
                    {project.project_info.languages && 
                     Object.keys(project.project_info.languages).length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{Object.keys(project.project_info.languages).length - 3}
                      </span>
                    )}
                  </div>
                </td>
                
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-500">
                    {formatDate(project.scan_timestamp)}
                  </span>
                </td>
                
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onProjectClick?.(project)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a 
                        href={project.project_info.web_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, processedProjects.length)} of {processedProjects.length} projects
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === totalPages || 
                Math.abs(page - currentPage) <= 2
              )
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="text-gray-400">...</span>
                  )}
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                </React.Fragment>
              ))
            }
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}