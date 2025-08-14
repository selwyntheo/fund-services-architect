'use client';

import React from 'react';
import { FilterOptions } from '@/lib/types';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FiltersPanelProps {
  filters: Partial<FilterOptions>;
  onChange: (filters: Partial<FilterOptions>) => void;
  onClose: () => void;
}

export function FiltersPanel({ filters, onChange, onClose }: FiltersPanelProps) {
  return (
    <div className="bg-card border-b p-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Filters</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Risk Level</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={filters.risk_levels?.[0] || ''}
              onChange={(e) => onChange({
                ...filters,
                risk_levels: e.target.value ? [e.target.value as any] : []
              })}
            >
              <option value="">All Levels</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={filters.languages?.[0] || ''}
              onChange={(e) => onChange({
                ...filters,
                languages: e.target.value ? [e.target.value] : []
              })}
            >
              <option value="">All Languages</option>
              <option value="Java">Java</option>
              <option value="C#">C#</option>
              <option value="Python">Python</option>
              <option value="JavaScript">JavaScript</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Business Unit</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={filters.business_units?.[0] || ''}
              onChange={(e) => onChange({
                ...filters,
                business_units: e.target.value ? [e.target.value] : []
              })}
            >
              <option value="">All Units</option>
              <option value="Backend">Backend</option>
              <option value="Frontend">Frontend</option>
              <option value="Mobile">Mobile</option>
              <option value="DevOps">DevOps</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => onChange({})}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}