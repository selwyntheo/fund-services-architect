'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ScanTriggerProps {
  onScanStart?: (projectPath: string) => void;
}

export function ScanTrigger({ onScanStart }: ScanTriggerProps) {
  const [projectPath, setProjectPath] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleStartScan = async () => {
    if (!projectPath.trim()) {
      alert('Please enter a project path');
      return;
    }

    setIsScanning(true);
    
    try {
      if (onScanStart) {
        onScanStart(projectPath);
      }
      
      // Simulate scan process
      setTimeout(() => {
        setIsScanning(false);
        alert('Scan completed successfully!');
      }, 3000);
    } catch (error) {
      setIsScanning(false);
      alert('Scan failed. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start New Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="projectPath" className="block text-sm font-medium mb-2">
              Project Path
            </label>
            <input
              id="projectPath"
              type="text"
              value={projectPath}
              onChange={(e) => setProjectPath(e.target.value)}
              placeholder="/path/to/your/project"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isScanning}
            />
          </div>
          
          <Button 
            onClick={handleStartScan}
            disabled={isScanning || !projectPath.trim()}
            className="w-full"
          >
            {isScanning ? 'Scanning...' : 'Start Assessment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
