'use client';

import { motion } from 'framer-motion';

interface AreaChartProps {
  data: { label: string; value: number }[];
  title?: string;
  height?: number;
  color?: string;
}

export function AreaChart({ data, title, height = 200, color = 'var(--primary)' }: AreaChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1 || 1)) * 100;
    const y = 100 - ((item.value - minValue) / range) * 100;
    return { x, y, value: item.value, label: item.label };
  });

  const areaPath = `M 0 100 ${points.map(p => `L ${p.x} ${p.y}`).join(' ')} L 100 100 Z`;
  const linePath = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;

  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>}
      <div className="relative" style={{ height: `${height}px` }}>
        <svg width="100%" height={height} className="overflow-visible">
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <motion.path
            d={areaPath}
            fill="url(#areaGradient)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          />
          <motion.path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1 }}
          />
          {points.map((point, index) => (
            <motion.circle
              key={index}
              cx={`${point.x}%`}
              cy={point.y}
              r="4"
              fill={color}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
            />
          ))}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
          {data.map((item, index) => (
            <span key={index} className="truncate" style={{ width: `${100 / data.length}%` }} title={item.label}>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

