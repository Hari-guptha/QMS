'use client';

import { useMemo } from 'react';
import React from 'react';

interface PeakHoursHeatmapChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export const PeakHoursHeatmapChart = React.memo(function PeakHoursHeatmapChart({ data, height = 250, color = '#3b82f6' }: PeakHoursHeatmapChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item) => {
      const hour = parseInt(item.label.replace(':00', '')) || 0;
      return {
        hour,
        label: item.label.replace(':00', ''),
        value: item.value,
      };
    }).sort((a, b) => a.hour - b.hour);
  }, [data]);

  const maxValue = useMemo(() => Math.max(...chartData.map(d => d.value), 1), [chartData]);
  const total = useMemo(() => chartData.reduce((sum, d) => sum + d.value, 0), [chartData]);
  const peakHour = useMemo(() => {
    return chartData.reduce((max, item) => item.value > max.value ? item : max, chartData[0]);
  }, [chartData]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  // Create a full 24-hour array, filling in missing hours with 0
  const fullDayData = Array.from({ length: 24 }, (_, i) => {
    const existing = chartData.find(d => d.hour === i);
    return existing || { 
      hour: i, 
      label: `${i}`, 
      value: 0,
    };
  });

  // Group hours into 6 time periods - Dark colors matching Status Distribution
  const timePeriods = [
    { label: '12-4 AM', hours: [0, 1, 2, 3], color: '#8b5cf6', secondary: '#a78bfa' }, // Purple
    { label: '4-8 AM', hours: [4, 5, 6, 7], color: '#3b82f6', secondary: '#60a5fa' }, // Blue
    { label: '8-12 PM', hours: [8, 9, 10, 11], color: '#10b981', secondary: '#34d399' }, // Green
    { label: '12-4 PM', hours: [12, 13, 14, 15], color: '#f59e0b', secondary: '#fbbf24' }, // Amber
    { label: '4-8 PM', hours: [16, 17, 18, 19], color: '#ef4444', secondary: '#f87171' }, // Red
    { label: '8-12 AM', hours: [20, 21, 22, 23], color: '#06b6d4', secondary: '#22d3ee' }, // Cyan
  ];

  const getPeriodValue = (hours: number[]) => {
    return hours.reduce((sum, hour) => {
      const hourData = fullDayData.find(d => d.hour === hour);
      return sum + (hourData?.value || 0);
    }, 0);
  };

  const periodMax = Math.max(...timePeriods.map(p => getPeriodValue(p.hours)), 1);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Compact Peak Hour Display - Dark theme */}
      <div className="mb-4 p-3 rounded-xl bg-muted/50 border border-border backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Peak Hour</p>
            <p className="text-lg font-bold text-foreground">{peakHour.label}:00</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-medium">Tickets</p>
            <p className="text-xl font-bold text-foreground">{peakHour.value}</p>
          </div>
        </div>
      </div>

      {/* Compact Heatmap Grid - 6 Periods */}
      <div className="flex-1 grid grid-cols-3 gap-2 mb-4">
        {timePeriods.map((period, index) => {
          const periodValue = getPeriodValue(period.hours);
          const intensity = periodValue / periodMax;
          const isPeak = period.hours.includes(peakHour.hour);
          
          return (
            <div
              key={index}
              className={`relative rounded-xl p-3 border-2 transition-all hover:scale-105 hover:shadow-lg ${
                isPeak 
                  ? 'border-foreground/30 shadow-lg' 
                  : 'border-border/50'
              }`}
              style={{
                background: `linear-gradient(135deg, ${period.color}${Math.round((0.15 + intensity * 0.35) * 255).toString(16).padStart(2, '0')}, ${period.secondary}${Math.round((0.1 + intensity * 0.25) * 255).toString(16).padStart(2, '0')})`,
                minHeight: '60px',
              }}
            >
              <div className="text-center">
                <div className="text-xs font-semibold text-foreground mb-1">{period.label}</div>
                <div className="text-xl font-bold text-foreground">
                  {periodValue}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {periodValue > 0 ? `${Math.round((periodValue / total) * 100)}%` : '0%'}
                </div>
              </div>
              {isPeak && (
                <div className="absolute top-1 right-1">
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse shadow-lg"
                    style={{ backgroundColor: period.color }}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Compact Hour Grid - 24 hours in compact view */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Hour-by-Hour</p>
        <div className="grid grid-cols-12 gap-1">
          {fullDayData.map((item) => {
            const intensity = item.value / maxValue;
            const isPeak = item.hour === peakHour.hour;
            let periodColor = '#6b7280';
            
            // Dark colors matching Status Distribution
            if (item.hour >= 0 && item.hour < 4) periodColor = '#8b5cf6'; // Purple
            else if (item.hour >= 4 && item.hour < 8) periodColor = '#3b82f6'; // Blue
            else if (item.hour >= 8 && item.hour < 12) periodColor = '#10b981'; // Green
            else if (item.hour >= 12 && item.hour < 16) periodColor = '#f59e0b'; // Amber
            else if (item.hour >= 16 && item.hour < 20) periodColor = '#ef4444'; // Red
            else periodColor = '#06b6d4'; // Cyan

            return (
              <div
                key={item.hour}
                className={`aspect-square rounded-lg border-2 transition-all hover:scale-110 hover:shadow-lg cursor-pointer relative ${
                  isPeak ? 'border-foreground/50 ring-2 ring-foreground/30 shadow-lg' : 'border-border/50'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${periodColor}${Math.round((0.3 + intensity * 0.5) * 255).toString(16).padStart(2, '0')}, ${periodColor}${Math.round((0.2 + intensity * 0.4) * 255).toString(16).padStart(2, '0')})`,
                }}
                title={`${item.label.padStart(2, '0')}:00 - ${item.value} tickets`}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-0.5">
                  <div className="text-[8px] font-bold text-foreground leading-tight drop-shadow-sm">
                    {item.label.padStart(2, '0')}
                  </div>
                  {item.value > 0 && (
                    <div className="text-[9px] font-bold text-foreground leading-tight drop-shadow-sm">
                      {item.value}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact Summary */}
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="text-muted-foreground">Total: </span>
            <span className="font-bold text-foreground">{total}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Avg: </span>
            <span className="font-bold text-foreground">{Math.round(total / 24)}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
