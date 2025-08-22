'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export function ScanTrigger() {
  const [repositoryUrl, setRepositoryUrl] = useState('https://github.com/selwyntheo/OpenFinLib');
  const [projectName, setProjectName] = useState('OpenFinLib');
  const [isScanning, setIsScanning] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleStartScan = async () => {
    if (!repositoryUrl.trim() || !projectName.trim()) {
      alert('Please enter both repository URL and project name');
      return;
    }

    setIsScanning(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/scan/github`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repository_url: repositoryUrl,
          project_name: projectName,
          enhanced_analysis: true
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      setIsScanning(false);
      setShowForm(false);
      alert(`Scan completed successfully for ${result.project_name}! Check the dashboard for results.`);
      
      // Refresh the page to show new results
      window.location.reload();
    } catch (error) {
      setIsScanning(false);
      console.error('Scan failed:', error);
      
      let errorMessage = 'Scan failed. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Cannot connect to backend server. Please ensure the backend is running on http://localhost:8000';
        } else if (error.message.includes('HTTP 500')) {
          errorMessage = 'Backend server error. Please check the server logs for details.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    }
  };

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} disabled={isScanning}>
        {isScanning ? 'Scanning...' : 'New Scan'}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md">
        <h3 className="text-lg font-semibold mb-4">Start New Repository Scan</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="repositoryUrl" className="block text-sm font-medium mb-2">
              Repository URL
            </label>
            <input
              id="repositoryUrl"
              type="url"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isScanning}
            />
          </div>
          
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium mb-2">
              Project Name
            </label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Project"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isScanning}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setShowForm(false)}
              disabled={isScanning}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStartScan}
              disabled={isScanning || !repositoryUrl.trim() || !projectName.trim()}
            >
              {isScanning ? 'Scanning...' : 'Start Scan'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
