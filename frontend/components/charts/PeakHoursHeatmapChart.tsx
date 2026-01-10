'use client';

import { useMemo } from 'react';
import React from 'react';
import { useI18n } from '@/lib/i18n';

interface PeakHoursHeatmapChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export const PeakHoursHeatmapChart = React.memo(function PeakHoursHeatmapChart({ data, height = 250, color = '#1e40af' }: PeakHoursHeatmapChartProps) {
  const { t, language } = useI18n();
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

  // Colors matching Ticket Status Distribution
  const STATUS_COLORS = [
    '#3b82f6', // Lighter Dark Blue
    '#4f46e5', // Lighter Dark Indigo
    '#475569', // Lighter Dark Slate
    '#2563eb', // Lighter Blue
    '#6366f1', // Lighter Dark Purple
    '#334155', // Lighter Dark Slate
    '#4338ca', // Lighter Dark Navy
  ];

  // Group hours into 6 time periods - using Status Distribution colors
  const timePeriods = [
    { label: '12-4 AM', hours: [0, 1, 2, 3], color: STATUS_COLORS[0] }, // Blue
    { label: '4-8 AM', hours: [4, 5, 6, 7], color: STATUS_COLORS[1] }, // Indigo
    { label: '8-12 PM', hours: [8, 9, 10, 11], color: STATUS_COLORS[2] }, // Slate
    { label: '12-4 PM', hours: [12, 13, 14, 15], color: STATUS_COLORS[3] }, // Blue
    { label: '4-8 PM', hours: [16, 17, 18, 19], color: STATUS_COLORS[4] }, // Purple
    { label: '8-12 AM', hours: [20, 21, 22, 23], color: STATUS_COLORS[5] }, // Slate
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
            <p className="text-xs text-muted-foreground font-medium">{language === 'ar' ? 'ساعة الذروة' : 'Peak Hour'}</p>
            <p className="text-lg font-bold text-foreground">{peakHour.label}:00</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-medium">{t('admin.analytics.tickets')}</p>
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
                backgroundColor: period.color,
                opacity: 0.3 + (intensity * 0.7),
                minHeight: '60px',
              }}
            >
              <div className="text-center">
                <div className="text-xs font-semibold text-white mb-1 drop-shadow-md">{period.label}</div>
                <div className="text-xl font-bold text-white drop-shadow-md">
                  {periodValue}
                </div>
                <div className="text-[10px] text-white/90 mt-0.5 drop-shadow-sm">
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
        <p className="text-xs font-semibold text-muted-foreground mb-2">{language === 'ar' ? 'ساعة بساعة' : 'Hour-by-Hour'}</p>
        <div className="grid grid-cols-12 gap-1">
          {fullDayData.map((item) => {
            const intensity = item.value / maxValue;
            const isPeak = item.hour === peakHour.hour;
            let periodColor = '#6b7280';
            
            // Colors matching Ticket Status Distribution
            if (item.hour >= 0 && item.hour < 4) periodColor = STATUS_COLORS[0]; // Blue
            else if (item.hour >= 4 && item.hour < 8) periodColor = STATUS_COLORS[1]; // Indigo
            else if (item.hour >= 8 && item.hour < 12) periodColor = STATUS_COLORS[2]; // Slate
            else if (item.hour >= 12 && item.hour < 16) periodColor = STATUS_COLORS[3]; // Blue
            else if (item.hour >= 16 && item.hour < 20) periodColor = STATUS_COLORS[4]; // Purple
            else periodColor = STATUS_COLORS[5]; // Slate

            return (
              <div
                key={item.hour}
                className={`aspect-square rounded-lg border-2 transition-all hover:scale-110 hover:shadow-lg cursor-pointer relative ${
                  isPeak ? 'border-foreground/50 ring-2 ring-foreground/30 shadow-lg' : 'border-border/50'
                }`}
                style={{
                  backgroundColor: periodColor,
                  opacity: 0.4 + (intensity * 0.6),
                }}
                title={`${item.label.padStart(2, '0')}:00 - ${item.value} tickets`}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-0.5">
                  <div className="text-[8px] font-bold text-white leading-tight drop-shadow-md">
                    {item.label.padStart(2, '0')}
                  </div>
                  {item.value > 0 && (
                    <div className="text-[9px] font-bold text-white leading-tight drop-shadow-md">
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
            <span className="text-muted-foreground">{t('admin.analytics.total')}: </span>
            <span className="font-bold text-foreground">{total}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{language === 'ar' ? 'المتوسط' : 'Avg'}: </span>
            <span className="font-bold text-foreground">{Math.round(total / 24)}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
