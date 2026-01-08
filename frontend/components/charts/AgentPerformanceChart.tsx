'use client';

import { useMemo } from 'react';
import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell, Tooltip } from 'recharts';

interface AgentPerformanceChartProps {
  data: { label: string; value: number; fullName?: string }[];
  height?: number;
  color?: string;
}

// Color palette for agents
const AGENT_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#84cc16', // Lime
];

export const AgentPerformanceChart = React.memo(function AgentPerformanceChart({ data, height = 200, color = '#3b82f6' }: AgentPerformanceChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const sorted = data.map((item, index) => ({
      name: item.label,
      fullName: item.fullName || item.label,
      value: item.value,
      fill: AGENT_COLORS[index % AGENT_COLORS.length],
    })).sort((a, b) => b.value - a.value);
    
    const total = sorted.reduce((sum, d) => sum + d.value, 0);
    return sorted.map(item => ({
      ...item,
      percentage: (item.value / total) * 100,
      normalizedValue: (item.value / Math.max(...sorted.map(d => d.value), 1)) * 100,
    }));
  }, [data]);

  const total = useMemo(() => chartData.reduce((sum, d) => sum + d.value, 0), [chartData]);
  const maxValue = useMemo(() => Math.max(...chartData.map(d => d.value), 1), [chartData]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg shadow-xl p-3">
          <p className="font-bold text-foreground text-sm mb-1">{data.fullName}</p>
          <p className="text-xs text-muted-foreground">
            Tickets: <span className="font-bold text-foreground">{data.value}</span> ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const chartSize = Math.min(height, 400);
  const outerRadius = chartSize * 0.45;
  const innerRadius = chartSize * 0.2;

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          barSize={12}
          data={chartData}
          startAngle={90}
          endAngle={-270}
        >
          <defs>
            {chartData.map((entry, index) => (
              <linearGradient key={`gradient-${index}`} id={`agentGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={entry.fill} stopOpacity={1} />
                <stop offset="100%" stopColor={entry.fill} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>
          <RadialBar
            dataKey="normalizedValue"
            cornerRadius={8}
            fill="#8884d8"
            isAnimationActive={false}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#agentGradient-${index})`}
                style={{
                  filter: `drop-shadow(0 4px 8px ${entry.fill}40)`,
                }}
              />
            ))}
          </RadialBar>
          <Tooltip content={<CustomTooltip />} />
        </RadialBarChart>
      </ResponsiveContainer>
      
      {/* Center Info */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
            {total}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Total Tickets</p>
          {chartData[0] && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">Top Agent</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{chartData[0].name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
