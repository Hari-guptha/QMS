'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useMemo, useId } from 'react';
import React from 'react';
import { Trophy, TrendingUp, Sparkles } from 'lucide-react';

interface AgentTicketsComparisonChartProps {
  data: { agentName: string; totalTickets: number }[];
  height?: number;
  color?: string;
}

const AGENT_GRADIENTS = [
  { from: '#3b82f6', to: '#2563eb' }, // Blue
  { from: '#10b981', to: '#059669' }, // Green
  { from: '#f59e0b', to: '#d97706' }, // Amber
  { from: '#ef4444', to: '#dc2626' }, // Red
  { from: '#8b5cf6', to: '#7c3aed' }, // Purple
  { from: '#06b6d4', to: '#0891b2' }, // Cyan
  { from: '#14b8a6', to: '#0d9488' }, // Teal
  { from: '#ec4899', to: '#db2777' }, // Pink
  { from: '#6366f1', to: '#4f46e5' }, // Indigo
  { from: '#84cc16', to: '#65a30d' }, // Lime
];

export const AgentTicketsComparisonChart = React.memo(function AgentTicketsComparisonChart({ 
  data, 
  height = 300, 
  color = '#3b82f6' 
}: AgentTicketsComparisonChartProps) {
  const gradientId = useId().replace(/:/g, '-');
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const sorted = data
      .map((item, index) => ({
        name: item.agentName.length > 15 ? item.agentName.substring(0, 15) + '...' : item.agentName,
        fullName: item.agentName,
        tickets: item.totalTickets,
        gradient: AGENT_GRADIENTS[index % AGENT_GRADIENTS.length],
        rank: index + 1,
      }))
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 10)
      .map((item, index) => ({ ...item, rank: index + 1 }));
    
    const maxTickets = Math.max(...sorted.map(d => d.tickets), 1);
    return sorted.map(item => ({
      ...item,
      percentage: (item.tickets / maxTickets) * 100,
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

  const topPerformer = chartData[0];
  const maxTickets = Math.max(...chartData.map(d => d.tickets), 1);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 rounded-xl shadow-2xl p-4 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            {data.rank === 1 && <Trophy className="w-4 h-4 text-yellow-500" />}
            <p className="font-bold text-foreground text-sm">{data.fullName}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Tickets:</span>
              <span className="font-bold text-foreground text-lg">{data.tickets}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${data.percentage}%`,
                  background: `linear-gradient(90deg, ${data.gradient.from}, ${data.gradient.to})`,
                  boxShadow: `0 0 10px ${data.gradient.from}40`,
                }}
              />
            </div>
            {data.rank <= 3 && (
              <div className="flex items-center gap-1 mt-2 text-xs">
                <Sparkles className="w-3 h-3 text-yellow-500" />
                <span className="text-yellow-500 font-semibold">Top Performer</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full relative">
      {/* Top Performer Badge */}
      {topPerformer && (
        <div className="absolute -top-2 right-0 z-10 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg animate-pulse">
          <Trophy className="w-3 h-3" />
          <span>Top: {topPerformer.fullName}</span>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{ top: 30, right: 20, left: 0, bottom: 60 }}
          layout="vertical"
        >
          <defs>
            {chartData.map((entry, index) => (
              <linearGradient key={`gradient-${index}`} id={`ticketGradient-${gradientId}-${index}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={entry.gradient.from} stopOpacity={1} />
                <stop offset="100%" stopColor={entry.gradient.to} stopOpacity={1} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} />
          <XAxis
            type="number"
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="tickets" 
            radius={[0, 12, 12, 0]}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#ticketGradient-${gradientId}-${index})`}
                style={{
                  filter: `drop-shadow(0 4px 8px ${entry.gradient.from}30)`,
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Performance Indicator */}
      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <TrendingUp className="w-3 h-3" />
          <span>Top {chartData.length} Agents</span>
        </div>
        <div className="text-muted-foreground">
          Max: <span className="font-bold text-foreground">{maxTickets}</span> tickets
        </div>
      </div>
    </div>
  );
});

