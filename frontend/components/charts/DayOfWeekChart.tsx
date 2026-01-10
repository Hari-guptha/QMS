'use client';

import { useMemo } from 'react';
import React from 'react';
import { useI18n } from '@/lib/i18n';

interface DayOfWeekChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
// Use dark blue theme matching other charts (#1e40af)
const BASE_COLOR = '#1e40af';

export const DayOfWeekChart = React.memo(function DayOfWeekChart({ data, height = 200, color = '#1e40af' }: DayOfWeekChartProps) {
  const { t, language } = useI18n();
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Map data properly - handle both label/value and day/count formats
    const mapped = data.map((item) => {
      const dayName = item.label || (item as any).day || '';
      const count = item.value || (item as any).count || 0;
      return {
        day: dayName,
        count: count,
      };
    });
    
    // Ensure all 7 days are present, ordered correctly
    // Try to match day names flexibly (case-insensitive, partial matches)
    return DAY_ORDER.map(day => {
      const existing = mapped.find(d => {
        const dayLower = d.day?.toLowerCase() || '';
        const targetLower = day.toLowerCase();
        return dayLower === targetLower || 
               dayLower.includes(targetLower) || 
               targetLower.includes(dayLower) ||
               dayLower.startsWith(targetLower.slice(0, 3));
      });
      return existing || { day, count: 0 };
    });
  }, [data]);

  const maxValue = useMemo(() => Math.max(...chartData.map(d => d.count), 1), [chartData]);
  const total = useMemo(() => chartData.reduce((sum, d) => sum + d.count, 0), [chartData]);
  const peakDay = useMemo(() => {
    return chartData.reduce((max, item) => item.count > max.count ? item : max, chartData[0]);
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

  const centerX = height / 2;
  const centerY = height / 2;
  const innerRadius = height * 0.25;
  const outerRadius = height * 0.4;
  const angleStep = (2 * Math.PI) / 7;

  return (
    <div className="w-full">
      {/* Peak Day Card - Matching Peak Hour card style */}
      <div className="mb-4 p-3 rounded-xl bg-muted/50 border border-border backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{language === 'ar' ? 'أكثر الأيام ازدحاماً' : 'Busiest Day'}</p>
            <p className="text-lg font-bold text-foreground">{peakDay.day}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-medium">{t('admin.analytics.tickets')}</p>
            <p className="text-xl font-bold text-foreground">{peakDay.count}</p>
          </div>
        </div>
      </div>

      {/* Radial Week Wheel */}
      <div className="relative mx-auto mb-4" style={{ width: height, height: height }}>
        <svg width={height} height={height} className="overflow-visible">
          {/* Background circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={outerRadius + 10}
            fill="none"
            stroke="var(--border)"
            strokeWidth="2"
            opacity={0.2}
          />

          {/* Day segments with radial bars - Blue theme */}
          {chartData.map((item, index) => {
            const angle = (index * angleStep) - (Math.PI / 2); // Start at top
            const intensity = item.count / maxValue;
            const barLength = innerRadius + (outerRadius - innerRadius) * intensity;
            const isPeak = item.day === peakDay.day;
            // Use dark blue gradient based on intensity - matching dark theme
            const opacity = 0.4 + (intensity * 0.6);
            const dayColor = BASE_COLOR;

            // Calculate positions
            const x1 = centerX + innerRadius * Math.cos(angle);
            const y1 = centerY + innerRadius * Math.sin(angle);
            const x2 = centerX + barLength * Math.cos(angle);
            const y2 = centerY + barLength * Math.sin(angle);

            // Label position (outside the circle)
            const labelRadius = outerRadius + 25;
            const labelX = centerX + labelRadius * Math.cos(angle);
            const labelY = centerY + labelRadius * Math.sin(angle);

            // Segment arc
            const nextAngle = ((index + 1) * angleStep) - (Math.PI / 2);
            const segmentPath = `
              M ${centerX + innerRadius * Math.cos(angle)} ${centerY + innerRadius * Math.sin(angle)}
              A ${innerRadius} ${innerRadius} 0 0 1 ${centerX + innerRadius * Math.cos(nextAngle)} ${centerY + innerRadius * Math.sin(nextAngle)}
              L ${centerX + outerRadius * Math.cos(nextAngle)} ${centerY + outerRadius * Math.sin(nextAngle)}
              A ${outerRadius} ${outerRadius} 0 0 0 ${centerX + outerRadius * Math.cos(angle)} ${centerY + outerRadius * Math.sin(angle)}
              Z
            `;

            return (
              <g key={index}>
                {/* Segment background - Blue gradient */}
                <path
                  d={segmentPath}
                  fill={dayColor}
                  opacity={0.1 + intensity * 0.1}
                  className="transition-all hover:opacity-30"
                />
                
                {/* Radial bar - Blue with intensity */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={dayColor}
                  strokeWidth={isPeak ? 6 : 4}
                  strokeLinecap="round"
                  opacity={opacity}
                  className="transition-all"
                  style={{
                    filter: isPeak ? `drop-shadow(0 0 6px ${dayColor})` : 'none',
                  }}
                />

                {/* Day label */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill={isPeak ? dayColor : 'var(--foreground)'}
                  className="transition-all"
                >
                  {item.day.slice(0, 3)}
                </text>

                {/* Value label */}
                {item.count > 0 && (
                  <text
                    x={labelX}
                    y={labelY + 14}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill={dayColor}
                  >
                    {item.count}
                  </text>
                )}
              </g>
            );
          })}

          {/* Center circle with total */}
          <circle
            cx={centerX}
            cy={centerY}
            r={innerRadius - 5}
            fill="var(--card)"
            stroke="var(--border)"
            strokeWidth="2"
          />
          <text
            x={centerX}
            y={centerY - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="20"
            fontWeight="bold"
            fill="var(--foreground)"
          >
            {total}
          </text>
          <text
            x={centerX}
            y={centerY + 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill="var(--muted-foreground)"
          >
            {t('admin.analytics.total')}
          </text>
        </svg>
      </div>

      {/* Summary Stats */}
      <div className="pt-3 border-t border-border">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-base font-bold text-foreground">{total}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t('admin.analytics.total')}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-base font-bold text-foreground">{Math.round(total / 7)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{language === 'ar' ? 'المتوسط/يوم' : 'Avg/Day'}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-base font-bold text-blue-400">
              {Math.round((peakDay.count / total) * 100)}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{language === 'ar' ? 'الذروة' : 'Peak'}</p>
          </div>
        </div>
      </div>
    </div>
  );
});
