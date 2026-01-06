'use client';

import { motion } from 'framer-motion';
import { useState, useRef } from 'react';

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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1 || 1)) * 100;
    const y = 100 - ((item.value - minValue) / range) * 100;
    return { x, y, value: item.value, label: item.label };
  });

  const areaPath = `M 0 100 ${points.map(p => `L ${p.x} ${p.y}`).join(' ')} L 100 100 Z`;
  const linePath = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;

  const updateTooltipPosition = (e: React.MouseEvent, index: number) => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    setTooltipPosition({
      x: mouseX,
      y: mouseY - 50,
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
    <div className="w-full">
      {title && <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>}
      <div ref={containerRef} className="relative" style={{ height: `${height}px` }}>
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
              onMouseEnter={(e) => handleMouseEnter(e, index)}
              onMouseMove={(e) => handleMouseMove(e, index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
              style={{ r: hoveredIndex === index ? 6 : 4 }}
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

