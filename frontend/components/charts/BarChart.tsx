'use client';

import { motion } from 'framer-motion';

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  height?: number;
  showValues?: boolean;
}

export function BarChart({ data, title, height = 200, showValues = true }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>}
      <div className="flex items-end justify-between gap-2" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full">
              <div className="w-full flex flex-col items-center justify-end h-full relative">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${barHeight}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="w-full rounded-t"
                  style={{
                    backgroundColor: item.color || 'var(--primary)',
                    minHeight: item.value > 0 ? '4px' : '0',
                  }}
                  title={`${item.label}: ${item.value}`}
                />
                {showValues && item.value > 0 && (
                  <span className="absolute -top-6 text-xs font-medium text-foreground">
                    {item.value}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground text-center mt-2 truncate w-full" title={item.label}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
