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
  const isDense = data.length > 12;

  return (
    <div className="w-full overflow-x-hidden">
      {title && <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>}
      <div
        className="flex items-end justify-between"
        style={{
          height: `${height}px`,
          gap: isDense ? '2px' : '8px'
        }}
      >
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          // Only show labels every 3rd item if dense, or for first/last
          const shouldShowLabel = !isDense || index % 4 === 0 || index === data.length - 1;

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1 h-full min-w-0">
              <div className="w-full flex flex-col items-center justify-end h-full relative group">
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
                  <span className={`absolute -top-6 text-[10px] font-medium text-foreground ${isDense ? 'hidden group-hover:block whitespace-nowrap bg-background/80 px-1 rounded' : ''}`}>
                    {item.value}
                  </span>
                )}
              </div>
              <span
                className={`text-muted-foreground text-center mt-1 truncate w-full ${isDense ? 'text-[9px]' : 'text-xs'}`}
                style={{ opacity: shouldShowLabel ? 1 : 0 }}
                title={item.label}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
