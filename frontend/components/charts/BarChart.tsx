'use client';

import { motion } from 'framer-motion';
import { useState, useRef } from 'react';

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  height?: number;
  showValues?: boolean;
}

export function BarChart({ data, title, height = 200, showValues = true }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const isDense = data.length > 12;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const updateTooltipPosition = (e: React.MouseEvent, index: number) => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const barElement = e.currentTarget as HTMLElement;
    const barRect = barElement.getBoundingClientRect();
    
    // Calculate center of the bar relative to container
    const barCenterX = barRect.left - containerRect.left + barRect.width / 2;
    // Position tooltip above the bar
    const barTopY = barRect.top - containerRect.top;
    
    setTooltipPosition({
      x: barCenterX,
      y: Math.max(10, barTopY - 50), // Ensure tooltip doesn't go above container
    });
    setHoveredIndex(index);
  };

  const handleMouseEnter = (e: React.MouseEvent, index: number) => {
    updateTooltipPosition(e, index);
  };

  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    if (hoveredIndex === index) {
      updateTooltipPosition(e, index);
    }
  };

  return (
    <div className="w-full overflow-x-hidden">
      {title && <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>}
      <div
        ref={containerRef}
        className="flex items-end justify-between relative"
        style={{
          height: `${height}px`,
          gap: isDense ? '2px' : '8px'
        }}
      >
        {hoveredIndex !== null && (
          <div
            className="absolute z-50 bg-card border border-border rounded-lg shadow-lg px-3 py-2 pointer-events-none"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="text-sm font-semibold text-foreground">
              {data[hoveredIndex].label}
            </div>
            <div className="text-xs text-muted-foreground">
              Value: <span className="font-medium text-foreground">{data[hoveredIndex].value}</span>
            </div>
          </div>
        )}
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          // Only show labels every 3rd item if dense, or for first/last
          const shouldShowLabel = !isDense || index % 4 === 0 || index === data.length - 1;

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-1 h-full min-w-0">
              <div 
                className="w-full flex flex-col items-center justify-end h-full relative group"
                onMouseEnter={(e) => handleMouseEnter(e, index)}
                onMouseMove={(e) => handleMouseMove(e, index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${barHeight}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="w-full rounded-t cursor-pointer"
                  style={{
                    backgroundColor: item.color || 'var(--primary)',
                    minHeight: item.value > 0 ? '4px' : '0',
                  }}
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
