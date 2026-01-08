'use client';

import { useMemo } from 'react';
import React from 'react';

interface PeakHoursClockChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export const PeakHoursClockChart = React.memo(function PeakHoursClockChart({ data, height = 250, color = '#ef4444' }: PeakHoursClockChartProps) {
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

  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="text-center text-muted-foreground">
          <p className="text-sm">No data available</p>
        </div>
      </div>
    );
  }

  const radius = height * 0.35;
  const centerX = height / 2;
  const centerY = height / 2;

  // Create a full 24-hour array, filling in missing hours with 0
  const fullDayData = Array.from({ length: 24 }, (_, i) => {
    const existing = chartData.find(d => d.hour === i);
    return existing || { hour: i, label: `${i}`, value: 0 };
  });

  return (
    <div className="w-full">
      <div className="relative mx-auto" style={{ width: height, height: height }}>
        <svg width={height} height={height} className="overflow-visible">
          {/* Clock face circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="2"
            opacity={0.3}
          />
          
          {/* Hour markers */}
          {Array.from({ length: 24 }, (_, i) => {
            const angle = (i * 15 - 90) * (Math.PI / 180); // 15 degrees per hour, start at top
            const x1 = centerX + radius * Math.cos(angle);
            const y1 = centerY + radius * Math.sin(angle);
            const x2 = centerX + (radius + 8) * Math.cos(angle);
            const y2 = centerY + (radius + 8) * Math.sin(angle);
            
            return (
              <line
                key={`marker-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--muted-foreground)"
                strokeWidth="1"
                opacity={0.4}
              />
            );
          })}

          {/* Hour labels (12, 3, 6, 9) */}
          {[0, 6, 12, 18].map((hour) => {
            const angle = (hour * 15 - 90) * (Math.PI / 180);
            const labelRadius = radius + 25;
            const x = centerX + labelRadius * Math.cos(angle);
            const y = centerY + labelRadius * Math.sin(angle);
            
            return (
              <text
                key={`label-${hour}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fill="var(--muted-foreground)"
                fontWeight="600"
              >
                {hour === 0 ? '12' : hour}
              </text>
            );
          })}

          {/* Data bars (like clock hands but showing intensity) */}
          {fullDayData.map((item, index) => {
            const angle = (item.hour * 15 - 90) * (Math.PI / 180);
            const intensity = item.value / maxValue;
            const barLength = radius * 0.6 * intensity; // Scale bar length by intensity
            const x1 = centerX;
            const y1 = centerY;
            const x2 = centerX + barLength * Math.cos(angle);
            const y2 = centerY + barLength * Math.sin(angle);
            
            // Color intensity based on value
            const opacity = 0.4 + (intensity * 0.6);
            const barColor = intensity > 0.7 ? '#ef4444' : intensity > 0.4 ? '#f59e0b' : '#10b981';
            
            return (
              <line
                key={`bar-${index}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={barColor}
                strokeWidth={intensity > 0 ? 4 : 0}
                opacity={opacity}
                strokeLinecap="round"
              />
            );
          })}

          {/* Center circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r="6"
            fill={color}
            opacity={0.8}
          />
        </svg>

        {/* Center total display */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ top: centerY - 20 }}
        >
          <div className="text-2xl font-bold text-foreground">{total}</div>
          <div className="text-xs text-muted-foreground mt-1">Total</div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-muted-foreground">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-muted-foreground">Peak</span>
        </div>
      </div>
    </div>
  );
});

