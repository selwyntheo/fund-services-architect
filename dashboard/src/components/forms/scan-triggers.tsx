'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Loader2 } from 'lucide-react';
import { TechnicalDebtAPI } from '@/lib/api';

export function ScanTrigger() {
  const [isScanning, setIsScanning] = useState(false);

  const handleTriggerScan = async () => {
    setIsScanning(true);
    try {
      const result = await TechnicalDebtAPI.triggerScan({
        enhanced_analysis: true,
        filters: {
          last_activity_days: 365,
          max_projects: 50
        }
      });
      
      console.log('Scan triggered:', result.scan_id);
      // You could redirect to a scan status page or show a toast
    } catch (error) {
      console.error('Failed to trigger scan:', error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <Button 
      onClick={handleTriggerScan}
      disabled={isScanning}
      className="bg-primary hover:bg-primary/90"
    >
      {isScanning ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Play className="w-4 h-4 mr-2" />
      )}
      {isScanning ? 'Scanning...' : 'Trigger Scan'}
    </Button>
  );
}