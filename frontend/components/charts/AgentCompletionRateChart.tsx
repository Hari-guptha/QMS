'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useMemo, useId } from 'react';
import React from 'react';
import { Target, CheckCircle2, AlertCircle, Award } from 'lucide-react';

interface AgentCompletionRateChartProps {
  data: { agentName: string; completionRate: number }[];
  height?: number;
  color?: string;
}

const COMPLETION_GRADIENTS = {
  excellent: { from: '#10b981', to: '#059669', icon: Award },
  good: { from: '#3b82f6', to: '#2563eb', icon: CheckCircle2 },
  average: { from: '#f59e0b', to: '#d97706', icon: Target },
  poor: { from: '#ef4444', to: '#dc2626', icon: AlertCircle },
};

const getGradient = (rate: number) => {
  if (rate >= 90) return COMPLETION_GRADIENTS.excellent;
  if (rate >= 75) return COMPLETION_GRADIENTS.good;
  if (rate >= 60) return COMPLETION_GRADIENTS.average;
  return COMPLETION_GRADIENTS.poor;
};

const getRating = (rate: number) => {
  if (rate >= 90) return 'Excellent';
  if (rate >= 75) return 'Good';
  if (rate >= 60) return 'Average';
  return 'Needs Improvement';
};

export const AgentCompletionRateChart = React.memo(function AgentCompletionRateChart({ 
  data, 
  height = 300, 
  color = '#3b82f6' 
}: AgentCompletionRateChartProps) {
  const gradientId = useId().replace(/:/g, '-');
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data
      .map((item) => {
        const gradient = getGradient(item.completionRate || 0);
        return {
          name: item.agentName.length > 15 ? item.agentName.substring(0, 15) + '...' : item.agentName,
          fullName: item.agentName,
          rate: item.completionRate || 0,
          gradient: gradient,
          rating: getRating(item.completionRate || 0),
        };
      })
      .sort((a, b) => b.rate - a.rate)
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

  const avgRate = chartData.reduce((sum, d) => sum + d.rate, 0) / chartData.length;
  const topPerformer = chartData[0];
  const total = chartData.reduce((sum, d) => sum + d.rate, 0);

  // Prepare data for donut chart - group by rating category
  const donutData = useMemo(() => {
    const categories = {
      excellent: chartData.filter(d => d.rate >= 90).length,
      good: chartData.filter(d => d.rate >= 75 && d.rate < 90).length,
      average: chartData.filter(d => d.rate >= 60 && d.rate < 75).length,
      poor: chartData.filter(d => d.rate < 60).length,
    };
    
    return [
      { name: 'Excellent (≥90%)', value: categories.excellent, color: COMPLETION_GRADIENTS.excellent.from, gradient: COMPLETION_GRADIENTS.excellent },
      { name: 'Good (75-89%)', value: categories.good, color: COMPLETION_GRADIENTS.good.from, gradient: COMPLETION_GRADIENTS.good },
      { name: 'Average (60-74%)', value: categories.average, color: COMPLETION_GRADIENTS.average.from, gradient: COMPLETION_GRADIENTS.average },
      { name: 'Needs Improvement (<60%)', value: categories.poor, color: COMPLETION_GRADIENTS.poor.from, gradient: COMPLETION_GRADIENTS.poor },
    ].filter(item => item.value > 0);
  }, [chartData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const Icon = data.gradient.icon;
      const percentage = (data.value / chartData.length) * 100;
      return (
        <div className="bg-card/95 backdrop-blur-sm border-2 border-primary/20 rounded-xl shadow-2xl p-4 min-w-[220px]">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg" style={{ background: `${data.gradient.from}20` }}>
              <Icon className="w-4 h-4" style={{ color: data.gradient.from }} />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">{data.name}</p>
              <p className="text-xs text-muted-foreground">{data.value} agents</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Percentage:</span>
              <span className="font-bold text-foreground text-xl" style={{ color: data.gradient.from }}>
                {percentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                style={{
                  width: `${percentage}%`,
                  background: `linear-gradient(90deg, ${data.gradient.from}, ${data.gradient.to})`,
                  boxShadow: `0 0 15px ${data.gradient.from}50`,
                }}
              />
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    if (percent < 0.05) return null; // Don't show label for very small slices
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="w-full relative">
      {/* Average Badge */}
      <div className="absolute -top-2 left-0 z-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
        <Target className="w-3 h-3" />
        <span>Avg: {avgRate.toFixed(1)}%</span>
      </div>
      
      <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <defs>
              {donutData.map((entry, index) => (
                <linearGradient key={`gradient-${index}`} id={`donutGradient-${gradientId}-${index}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={entry.gradient.from} stopOpacity={1} />
                  <stop offset="100%" stopColor={entry.gradient.to} stopOpacity={0.8} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={height * 0.35}
              innerRadius={height * 0.2}
              fill="#8884d8"
              dataKey="value"
              isAnimationActive={true}
              animationDuration={1000}
            >
              {donutData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`url(#donutGradient-${gradientId}-${index})`}
                  style={{
                    filter: `drop-shadow(0 4px 8px ${entry.color}40)`,
                    stroke: 'var(--background)',
                    strokeWidth: 2,
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom"
              height={60}
              formatter={(value, entry: any) => (
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              {topPerformer.rate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Top Performer</p>
            {topPerformer.rate >= 90 && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <Award className="w-4 h-4 text-yellow-500 mx-auto animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

