'use client';

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend } from 'recharts';
import { useMemo } from 'react';
import React from 'react';

interface PeakHoursRadarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export const PeakHoursRadarChart = React.memo(function PeakHoursRadarChart({ data, height = 250, color = '#ef4444' }: PeakHoursRadarChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item) => ({
      hour: item.label.replace(':00', ''),
      value: item.value,
    }));
  }, [data]);

  const maxValue = useMemo(() => Math.max(...chartData.map(d => d.value), 1), [chartData]);
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

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <PolarGrid stroke="var(--border)" opacity={0.3} />
          <PolarAngleAxis
            dataKey="hour"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, maxValue]}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            tickCount={5}
          />
          <Radar
            name="Tickets"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.6}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-sm text-foreground">{value}</span>
            )}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="pt-4 border-t border-border/50 mt-4 text-center">
        <p className="text-2xl font-bold text-foreground">{total}</p>
        <p className="text-xs text-muted-foreground">Total Tickets</p>
      </div>
    </div>
  );
});

