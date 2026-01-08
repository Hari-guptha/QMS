'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useMemo, useId } from 'react';
import React from 'react';
import { Layers, CheckCircle2, Clock, Pause, AlertCircle } from 'lucide-react';

interface AgentStatusDistributionChartProps {
  data: { 
    agentName: string; 
    pendingTickets: number; 
    servingTickets: number; 
    holdTickets: number; 
    completedTickets: number;
  }[];
  height?: number;
}

const STATUS_CONFIG = {
  Pending: { 
    color: '#f59e0b', 
    gradient: { from: '#f59e0b', to: '#d97706' },
    icon: Clock,
    label: 'Pending'
  },
  Serving: { 
    color: '#10b981', 
    gradient: { from: '#10b981', to: '#059669' },
    icon: AlertCircle,
    label: 'Serving'
  },
  Hold: { 
    color: '#ef4444', 
    gradient: { from: '#ef4444', to: '#dc2626' },
    icon: Pause,
    label: 'Hold'
  },
  Completed: { 
    color: '#3b82f6', 
    gradient: { from: '#3b82f6', to: '#2563eb' },
    icon: CheckCircle2,
    label: 'Completed'
  },
};

export const AgentStatusDistributionChart = React.memo(function AgentStatusDistributionChart({ 
  data, 
  height = 300 
}: AgentStatusDistributionChartProps) {
  const gradientId = useId().replace(/:/g, '-');
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data
      .map((item) => {
        const total = (item.pendingTickets || 0) + (item.servingTickets || 0) + (item.holdTickets || 0) + (item.completedTickets || 0);
        return {
          name: item.agentName.length > 12 ? item.agentName.substring(0, 12) + '...' : item.agentName,
          fullName: item.agentName,
          Pending: item.pendingTickets || 0,
          Serving: item.servingTickets || 0,
          Hold: item.holdTickets || 0,
          Completed: item.completedTickets || 0,
          total,
          completionRate: total > 0 ? ((item.completedTickets || 0) / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
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

  const topAgent = chartData[0];
  const totalCompleted = chartData.reduce((sum, d) => sum + d.Completed, 0);
  const totalTickets = chartData.reduce((sum, d) => sum + d.total, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 rounded-xl shadow-2xl p-4 min-w-[240px]">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Layers className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">{data.fullName}</p>
              <p className="text-xs text-muted-foreground">{data.total} total tickets</p>
            </div>
          </div>
          <div className="space-y-2">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const value = data[key];
              const percentage = data.total > 0 ? (value / data.total) * 100 : 0;
              return (
                <div key={key} className="flex items-center justify-between p-2 rounded-lg" style={{ background: `${config.color}10` }}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-3 h-3" style={{ color: config.color }} />
                    <span className="text-xs text-muted-foreground">{config.label}:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: config.color }}>{value}</span>
                    <span className="text-xs text-muted-foreground">({percentage.toFixed(0)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Completion Rate:</span>
              <span className="font-bold text-sm text-blue-500">{data.completionRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full relative">
      {/* Summary Badge */}
      <div className="absolute -top-2 left-0 z-10 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
        <Layers className="w-3 h-3" />
        <span>{totalCompleted}/{totalTickets} Completed</span>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={chartData}
          margin={{ top: 30, right: 20, left: 0, bottom: 60 }}
        >
          <defs>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <linearGradient key={key} id={`statusAreaGradient-${gradientId}-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.gradient.from} stopOpacity={0.8} />
                <stop offset="95%" stopColor={config.gradient.to} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.2} />
          <XAxis
            dataKey="name"
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="square"
            formatter={(value) => (
              <span className="text-xs text-muted-foreground">{value}</span>
            )}
          />
          <Area
            type="monotone"
            dataKey="Pending"
            stackId="1"
            stroke={STATUS_CONFIG.Pending.color}
            fill={`url(#statusAreaGradient-${gradientId}-Pending)`}
            strokeWidth={2}
            isAnimationActive={true}
            animationDuration={800}
          />
          <Area
            type="monotone"
            dataKey="Serving"
            stackId="1"
            stroke={STATUS_CONFIG.Serving.color}
            fill={`url(#statusAreaGradient-${gradientId}-Serving)`}
            strokeWidth={2}
            isAnimationActive={true}
            animationDuration={900}
          />
          <Area
            type="monotone"
            dataKey="Hold"
            stackId="1"
            stroke={STATUS_CONFIG.Hold.color}
            fill={`url(#statusAreaGradient-${gradientId}-Hold)`}
            strokeWidth={2}
            isAnimationActive={true}
            animationDuration={1000}
          />
          <Area
            type="monotone"
            dataKey="Completed"
            stackId="1"
            stroke={STATUS_CONFIG.Completed.color}
            fill={`url(#statusAreaGradient-${gradientId}-Completed)`}
            strokeWidth={2}
            isAnimationActive={true}
            animationDuration={1100}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Status Legend with Icons */}
      <div className="mt-4 flex items-center justify-center gap-3 text-xs flex-wrap">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: `${config.color}10` }}>
              <Icon className="w-3 h-3" style={{ color: config.color }} />
              <span className="text-muted-foreground">{config.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

