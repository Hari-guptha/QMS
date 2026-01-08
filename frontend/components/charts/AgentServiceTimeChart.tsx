'use client';

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useMemo, useId } from 'react';
import React from 'react';
import { Clock, Zap, Timer, TrendingDown } from 'lucide-react';

interface AgentServiceTimeChartProps {
  data: { agentName: string; avgServiceTime: number; avgWaitTime: number; avgTotalTime: number }[];
  height?: number;
  color?: string;
}

export const AgentServiceTimeChart = React.memo(function AgentServiceTimeChart({ 
  data, 
  height = 300, 
  color = '#3b82f6' 
}: AgentServiceTimeChartProps) {
  const gradientId = useId().replace(/:/g, '-');
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Get top 6 agents for radar chart (better visualization)
    const agents = data
      .map((item) => ({
        name: item.agentName.length > 12 ? item.agentName.substring(0, 12) + '...' : item.agentName,
        fullName: item.agentName,
        serviceTime: item.avgServiceTime || 0,
        waitTime: item.avgWaitTime || 0,
        totalTime: item.avgTotalTime || 0,
      }))
      .sort((a, b) => a.serviceTime - b.serviceTime)
      .slice(0, 6);
    
    // Find max values for normalization
    const maxServiceTime = Math.max(...agents.map(a => a.serviceTime), 1);
    const maxWaitTime = Math.max(...agents.map(a => a.waitTime), 1);
    const maxTotalTime = Math.max(...agents.map(a => a.totalTime), 1);
    
    // Transform data for radar chart - each agent needs all metrics
    return agents.map(agent => ({
      subject: agent.name,
      fullName: agent.fullName,
      'Service Speed': Math.max(0, 100 - (agent.serviceTime / maxServiceTime) * 100), // Inverted: higher score = faster
      'Wait Time': Math.min(100, (agent.waitTime / maxWaitTime) * 100),
      'Total Time': Math.min(100, (agent.totalTime / maxTotalTime) * 100),
      rawServiceTime: agent.serviceTime,
      rawWaitTime: agent.waitTime,
      rawTotalTime: agent.totalTime,
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const fastestAgent = chartData[0];
  const avgServiceTime = data.length > 0 
    ? data.reduce((sum, d) => sum + (d.avgServiceTime || 0), 0) / data.length 
    : 0;

  const colors = [
    { fill: '#3b82f6', stroke: '#2563eb', name: 'Agent 1' },
    { fill: '#10b981', stroke: '#059669', name: 'Agent 2' },
    { fill: '#f59e0b', stroke: '#d97706', name: 'Agent 3' },
    { fill: '#ef4444', stroke: '#dc2626', name: 'Agent 4' },
    { fill: '#8b5cf6', stroke: '#7c3aed', name: 'Agent 5' },
    { fill: '#06b6d4', stroke: '#0891b2', name: 'Agent 6' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 rounded-xl shadow-2xl p-4 min-w-[240px]">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Timer className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">{data.fullName}</p>
              <p className="text-xs text-muted-foreground">Performance Metrics</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-blue-500/10">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-muted-foreground">Service Time:</span>
              </div>
              <span className="font-bold text-blue-500">{data.rawServiceTime} min</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-amber-500" />
                <span className="text-xs text-muted-foreground">Wait Time:</span>
              </div>
              <span className="font-bold text-amber-500">{data.rawWaitTime} min</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-purple-500/10">
              <div className="flex items-center gap-2">
                <Timer className="w-3 h-3 text-purple-500" />
                <span className="text-xs text-muted-foreground">Total Time:</span>
              </div>
              <span className="font-bold text-purple-500">{data.rawTotalTime} min</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full relative">
      {/* Fastest Agent Badge */}
      {fastestAgent && (
        <div className="absolute -top-2 right-0 z-10 bg-gradient-to-r from-green-400 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
          <Zap className="w-3 h-3" />
          <span>Top {chartData.length} Agents</span>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={chartData} margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
          <defs>
            {colors.map((color, index) => (
              <linearGradient key={index} id={`radarGradient-${gradientId}-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color.fill} stopOpacity={0.8} />
                <stop offset="100%" stopColor={color.stroke} stopOpacity={0.3} />
              </linearGradient>
            ))}
          </defs>
          <PolarGrid stroke="var(--border)" opacity={0.3} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
            tickLine={false}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs text-muted-foreground">{value}</span>
            )}
          />
          {chartData.map((entry, index) => (
            <Radar
              key={entry.fullName}
              name={entry.fullName}
              dataKey="Service Speed"
              stroke={colors[index % colors.length].stroke}
              fill={`url(#radarGradient-${gradientId}-${index})`}
              fillOpacity={0.4}
              strokeWidth={2}
              dot={{ fill: colors[index % colors.length].fill, r: 4 }}
              isAnimationActive={true}
              animationDuration={1000 + index * 100}
            />
          ))}
          {chartData.map((entry, index) => (
            <Radar
              key={`wait-${entry.fullName}`}
              name={`${entry.fullName} Wait`}
              dataKey="Wait Time"
              stroke={colors[index % colors.length].stroke}
              fill="transparent"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={true}
              animationDuration={1000 + index * 100}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Performance Indicator */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs flex-wrap">
        <div className="flex items-center gap-2 text-muted-foreground">
          <TrendingDown className="w-3 h-3" />
          <span>Service Time: Higher score = Faster</span>
        </div>
        <div className="text-muted-foreground">
          Avg: <span className="font-bold text-foreground">{avgServiceTime.toFixed(1)} min</span>
        </div>
      </div>
    </div>
  );
});

