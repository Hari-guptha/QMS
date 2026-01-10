'use client';

import { useMemo } from 'react';
import React from 'react';
import { useI18n } from '@/lib/i18n';

interface StatusDistributionChartProps {
  data: { label: string; value: number; color?: string }[];
  size?: number;
}

// Dark color palette for different statuses - solid colors in same dark tone (lighter shades)
const STATUS_COLORS = [
  '#3b82f6', // Lighter Dark Blue
  '#4f46e5', // Lighter Dark Indigo
  '#475569', // Lighter Dark Slate
  '#2563eb', // Lighter Blue
  '#6366f1', // Lighter Dark Purple
  '#334155', // Lighter Dark Slate
  '#4338ca', // Lighter Dark Navy
];

export const StatusDistributionChart = React.memo(function StatusDistributionChart({ data, size = 250 }: StatusDistributionChartProps) {
  const { t, language } = useI18n();
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item, index) => {
      const color = item.color || STATUS_COLORS[index % STATUS_COLORS.length];
      return {
        name: item.label,
        value: item.value,
        color: color,
      };
    }).sort((a, b) => b.value - a.value); // Sort by value descending
  }, [data]);

  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  const maxValue = useMemo(() => {
    return Math.max(...chartData.map(e => e.value), 1);
  }, [chartData]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height: `${size}px` }}>
        <div className="text-center text-muted-foreground">
          <p className="text-sm">{t('admin.analytics.noDataAvailable')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Total Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{t('admin.analytics.totalTickets')}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{total}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-muted-foreground">
            {language === 'ar' ? 'حالات' : 'Statuses'}
          </p>
          <p className="text-3xl font-bold text-foreground mt-1">{chartData.length}</p>
        </div>
      </div>

      {/* Modern Horizontal Bar Chart */}
      <div className="space-y-4">
        {chartData.map((entry, index) => {
          const percentage = (entry.value / total) * 100;
          const barWidth = (entry.value / maxValue) * 100;
          
          return (
            <div key={index} className="group">
              {/* Label - Always visible */}
              <div className="mb-2 flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{entry.name}</p>
                {entry.value === 0 && (
                  <span className="text-xs text-muted-foreground">(0)</span>
                )}
              </div>
              <div className="flex items-center gap-4 mb-2">
                {/* Bar Container */}
                <div className="flex-1 relative">
                  <div className="h-10 rounded-lg overflow-hidden bg-muted/30 relative">
                    {/* Solid Color Bar */}
                    <div
                      className="h-full rounded-lg transition-all duration-700 group-hover:brightness-110 relative overflow-hidden"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: entry.color,
                        minWidth: entry.value > 0 ? '8px' : '0',
                      }}
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                      
                      {/* Value Label on Bar - always show inside bar if value > 0 */}
                      {entry.value > 0 && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 text-sm font-bold text-white whitespace-nowrap px-2 drop-shadow-md z-10"
                          style={{ 
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                            left: barWidth > 20 ? '8px' : '4px'
                          }}
                        >
                          {entry.value}
                        </div>
                      )}
                    </div>
                    {/* Value Label outside bar only when value is 0 */}
                    {entry.value === 0 && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-sm font-bold text-foreground z-10">
                        0
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Percentage Badge */}
                <div className="min-w-[80px] text-right">
                  <div
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold text-white shadow-md"
                    style={{
                      backgroundColor: entry.color,
                    }}
                  >
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Summary - Mini Bars */}
      <div className="pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          {chartData.map((entry, index) => {
            const percentage = (entry.value / total) * 100;
            return (
              <div
                key={index}
                className="flex-1 group cursor-pointer"
                title={`${entry.name}: ${entry.value} (${percentage.toFixed(1)}%)`}
              >
                <div
                  className="h-2 rounded-full transition-all duration-300 group-hover:h-3 group-hover:shadow-md"
                  style={{
                    width: '100%',
                    backgroundColor: entry.color,
                    opacity: 0.8,
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1 text-center truncate">
                  {entry.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
