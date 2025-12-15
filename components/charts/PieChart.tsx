'use client';

import { motion } from 'framer-motion';

interface PieChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  size?: number;
  showLegend?: boolean;
}

export function PieChart({ data, title, size = 200, showLegend = true }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div className="w-full text-center py-8 text-muted-foreground">
        <p>No data available</p>
      </div>
    );
  }

  let currentAngle = -90;
  const colors = [
    'var(--primary)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
    '#ef4444',
    '#f59e0b',
    '#10b981',
  ];

  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    const radius = size / 2 - 10;
    const x1 = size / 2 + radius * Math.cos(startAngleRad);
    const y1 = size / 2 + radius * Math.sin(startAngleRad);
    const x2 = size / 2 + radius * Math.cos(endAngleRad);
    const y2 = size / 2 + radius * Math.sin(endAngleRad);
    const largeArc = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${size / 2} ${size / 2}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    return {
      pathData,
      percentage,
      label: item.label,
      value: item.value,
      color: item.color || colors[index % colors.length],
    };
  });

  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>}
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size}>
            {segments.map((segment, index) => (
              <motion.path
                key={index}
                d={segment.pathData}
                fill={segment.color}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </div>
        {showLegend && (
          <div className="flex-1 space-y-2">
            {segments.map((segment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: segment.color }}
                />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm text-foreground">{segment.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{segment.value}</span>
                    <span className="text-xs text-muted-foreground">({segment.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

