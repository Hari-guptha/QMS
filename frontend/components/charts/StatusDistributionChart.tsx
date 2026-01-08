'use client';

import { useMemo } from 'react';
import React from 'react';

interface StatusDistributionChartProps {
  data: { label: string; value: number; color?: string }[];
  size?: number;
}

// Modern color palette for different statuses
const STATUS_COLORS = [
  { primary: '#f59e0b', secondary: '#fbbf24', gradient: 'from-amber-500 to-orange-500' }, // Amber - Pending
  { primary: '#10b981', secondary: '#34d399', gradient: 'from-emerald-500 to-teal-500' }, // Green - Serving
  { primary: '#3b82f6', secondary: '#60a5fa', gradient: 'from-blue-500 to-cyan-500' }, // Blue - Completed
  { primary: '#ef4444', secondary: '#f87171', gradient: 'from-red-500 to-rose-500' }, // Red - Hold
  { primary: '#8b5cf6', secondary: '#a78bfa', gradient: 'from-purple-500 to-violet-500' }, // Purple - No Show
  { primary: '#06b6d4', secondary: '#22d3ee', gradient: 'from-cyan-500 to-sky-500' }, // Cyan
  { primary: '#14b8a6', secondary: '#5eead4', gradient: 'from-teal-500 to-emerald-500' }, // Teal
];

export const StatusDistributionChart = React.memo(function StatusDistributionChart({ data, size = 250 }: StatusDistributionChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item, index) => {
      const colorScheme = STATUS_COLORS[index % STATUS_COLORS.length];
      return {
        name: item.label,
        value: item.value,
        color: item.color || colorScheme.primary,
        primaryColor: colorScheme.primary,
        secondaryColor: colorScheme.secondary,
        gradient: colorScheme.gradient,
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
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Total Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
          <p className="text-3xl font-bold text-foreground mt-1">{total}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-muted-foreground">Statuses</p>
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
              <div className="flex items-center gap-4 mb-2">
                {/* Bar Container */}
                <div className="flex-1 relative">
                  <div className="h-10 rounded-lg overflow-hidden bg-muted/30 relative">
                    {/* Gradient Bar */}
                    <div
                      className="h-full rounded-lg transition-all duration-700 group-hover:brightness-110 relative overflow-hidden"
                      style={{
                        width: `${barWidth}%`,
                        background: `linear-gradient(90deg, ${entry.primaryColor} 0%, ${entry.secondaryColor} 100%)`,
                        minWidth: entry.value > 0 ? '8px' : '0',
                      }}
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                      
                      {/* Value Label on Bar */}
                      {entry.value > 0 && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 text-sm font-bold text-white whitespace-nowrap transition-opacity duration-300 px-2"
                          style={{
                            left: barWidth > 15 ? '8px' : '100%',
                            transform: barWidth > 15 ? 'translateY(-50%)' : 'translate(8px, -50%)',
                          }}
                        >
                          {entry.value}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Percentage Badge */}
                <div className="min-w-[80px] text-right">
                  <div
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold text-white shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${entry.primaryColor} 0%, ${entry.secondaryColor} 100%)`,
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
                    background: `linear-gradient(90deg, ${entry.primaryColor} 0%, ${entry.secondaryColor} 100%)`,
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
