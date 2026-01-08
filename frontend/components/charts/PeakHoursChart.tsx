'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useMemo, useId } from 'react';
import React from 'react';

interface PeakHoursChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export const PeakHoursChart = React.memo(function PeakHoursChart({ data, height = 250, color = '#ef4444' }: PeakHoursChartProps) {
  const gradientId = useId().replace(/:/g, '-');
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item) => ({
      hour: item.label,
      count: item.value,
    }));
  }, [data]);

  const maxValue = useMemo(() => Math.max(...chartData.map(d => d.count), 1), [chartData]);
  const total = useMemo(() => chartData.reduce((sum, d) => sum + d.count, 0), [chartData]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`peakGradient-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
          <XAxis
            dataKey="hour"
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0];
                return (
                  <div className="bg-card border border-border rounded-lg shadow-lg p-3">
                    <p className="font-semibold text-foreground">{data.payload.hour}</p>
                    <p className="text-sm text-muted-foreground">
                      Count: <span className="font-bold text-foreground">{data.value}</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="count" radius={[12, 12, 0, 0]} fill={`url(#peakGradient-${gradientId})`} isAnimationActive={false}>
            {chartData.map((entry, index) => {
              const intensity = entry.count / maxValue;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={color}
                  opacity={0.7 + intensity * 0.3}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="pt-4 border-t border-border/50 mt-4">
        <p className="text-2xl font-bold text-foreground">{total}</p>
        <p className="text-xs text-muted-foreground">Total Tickets</p>
      </div>
    </div>
  );
});

