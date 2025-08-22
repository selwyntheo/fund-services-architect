'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: string;
  name: string;
  debtScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  lastScan: string;
  issues: number;
}

interface ProjectTableProps {
  projects?: Project[];
}

export function ProjectTable({ projects }: ProjectTableProps) {
  // Validate projects array and filter out any invalid entries
  const validProjects = (projects || []).filter(project => 
    project && 
    typeof project === 'object' &&
    project.id !== undefined &&
    project.name !== undefined
  );

  const displayProjects = validProjects;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {displayProjects.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium">No Projects Available</p>
              <p className="text-sm">Run a scan to see project debt metrics</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-medium">Project</th>
                  <th className="text-left py-2 px-4 font-medium">Debt Score</th>
                  <th className="text-left py-2 px-4 font-medium">Risk Level</th>
                  <th className="text-left py-2 px-4 font-medium">Issues</th>
                  <th className="text-left py-2 px-4 font-medium">Last Scan</th>
                </tr>
              </thead>
              <tbody>
                {displayProjects.map((project, index) => {
                  // Additional safety check for each project
                  if (!project || typeof project !== 'object') {
                    console.warn(`Invalid project at index ${index}:`, project);
                    return null;
                  }
                  
                  return (
                    <tr key={project.id || `project-${index}`} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{project.name || 'Unknown'}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono">
                          {typeof project.debtScore === 'number' ? project.debtScore.toFixed(1) : '0.0'}/10
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getRiskColor(project.riskLevel || 'Low')}>
                          {project.riskLevel || 'Low'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{project.issues || 0}</td>
                      <td className="py-3 px-4 text-gray-500">{project.lastScan || 'Never'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
