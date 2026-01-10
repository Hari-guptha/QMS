'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts';
import { useMemo, useId } from 'react';
import React from 'react';
import { useI18n } from '@/lib/i18n';

interface HourlyDistributionChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export const HourlyDistributionChart = React.memo(function HourlyDistributionChart({ data, height = 200, color = '#1e40af' }: HourlyDistributionChartProps) {
  const { t, language } = useI18n();
  const gradientId = useId().replace(/:/g, '-');
  
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item) => ({
      hour: item.label,
      count: item.value,
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="text-center text-muted-foreground">
          <p className="text-sm">{t('admin.analytics.noDataAvailable')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`colorLine-${gradientId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
          <XAxis
            dataKey="hour"
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={11}
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
                      {language === 'ar' ? 'العدد' : 'Count'}: <span className="font-bold text-foreground">{data.value}</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, r: 5, strokeWidth: 2, stroke: 'var(--background)' }}
            activeDot={{ r: 7, fill: color }}
            fill={`url(#colorLine-${gradientId})`}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

