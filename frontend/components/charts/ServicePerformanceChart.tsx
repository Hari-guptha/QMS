'use client';

import { useMemo } from 'react';
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ServicePerformanceChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

// Dark color palette matching Status Distribution - solid colors in same dark tone
const CATEGORY_COLORS = [
  '#3b82f6', // Lighter Dark Blue
  '#4f46e5', // Lighter Dark Indigo
  '#475569', // Lighter Dark Slate
  '#2563eb', // Lighter Blue
  '#6366f1', // Lighter Dark Purple
  '#334155', // Lighter Dark Slate
  '#4338ca', // Lighter Dark Navy
  '#1e40af', // Dark Blue
];

export const ServicePerformanceChart = React.memo(function ServicePerformanceChart({ data, height = 200, color = '#1e40af' }: ServicePerformanceChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item, index) => ({
      name: item.label,
      value: item.value,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    })).sort((a, b) => b.value - a.value);
  }, [data]);

  const total = useMemo(() => chartData.reduce((sum, d) => sum + d.value, 0), [chartData]);

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
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-card border border-border rounded-lg shadow-xl p-3">
          <p className="font-bold text-foreground text-sm mb-1">{data.name}</p>
          <p className="text-xs text-muted-foreground">
            Tickets: <span className="font-bold text-foreground">{data.value}</span> ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={11}
        fontWeight="bold"
        className="drop-shadow-lg"
      >
        {((percent * 100).toFixed(0))}%
      </text>
    );
  };

  const innerRadius = height * 0.3;
  const outerRadius = height * 0.45;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
            isAnimationActive={false}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke={entry.color}
                strokeWidth={2}
                style={{
                  filter: `drop-shadow(0 4px 8px ${entry.color}40)`,
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});
