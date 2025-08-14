import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendDataPoint {
  date: string;
  overall_score: number;
  code_quality: number;
  architecture: number;
  infrastructure: number;
  operations: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
}

export function TrendChart({ data }: TrendChartProps) {
  // Ensure data is an array and provide fallback
  const validData = Array.isArray(data) ? data : [];
  
  // Show message if no data available
  if (validData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        No trend data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={validData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 4]} />
        <Tooltip />
        <Line type="monotone" dataKey="overall_score" stroke="#3b82f6" strokeWidth={2} />
        <Line type="monotone" dataKey="code_quality" stroke="#8b5cf6" />
        <Line type="monotone" dataKey="architecture" stroke="#06b6d4" />
        <Line type="monotone" dataKey="infrastructure" stroke="#10b981" />
        <Line type="monotone" dataKey="operations" stroke="#f59e0b" />
      </LineChart>
    </ResponsiveContainer>
  );
}