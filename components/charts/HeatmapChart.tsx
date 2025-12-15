'use client';

import { motion } from 'framer-motion';

interface HeatmapChartProps {
  data: { x: string; y: string; value: number }[];
  xLabels: string[];
  yLabels: string[];
  title?: string;
}

export function HeatmapChart({ data, xLabels, yLabels, title }: HeatmapChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  const getCellValue = (x: string, y: string) => {
    const cell = data.find(d => d.x === x && d.y === y);
    return cell?.value || 0;
  };

  const getIntensity = (value: number) => {
    return (value / maxValue) * 100;
  };

  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${xLabels.length}, 1fr)` }}>
            {/* Empty corner */}
            <div></div>
            {/* X labels */}
            {xLabels.map((label, index) => (
              <div key={index} className="text-xs text-muted-foreground text-center p-2">
                {label}
              </div>
            ))}
            {/* Rows */}
            {yLabels.map((yLabel, yIndex) => (
              <>
                <div key={`y-${yIndex}`} className="text-xs text-muted-foreground p-2 flex items-center">
                  {yLabel}
                </div>
                {xLabels.map((xLabel, xIndex) => {
                  const value = getCellValue(xLabel, yLabel);
                  const intensity = getIntensity(value);
                  return (
                    <motion.div
                      key={`${xIndex}-${yIndex}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (yIndex * xLabels.length + xIndex) * 0.02 }}
                      className="aspect-square rounded p-2 flex items-center justify-center text-xs font-medium"
                      style={{
                        backgroundColor: `rgba(59, 130, 246, ${intensity / 100})`,
                        color: intensity > 50 ? 'white' : 'var(--foreground)',
                      }}
                      title={`${xLabel} / ${yLabel}: ${value}`}
                    >
                      {value > 0 && value}
                    </motion.div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

