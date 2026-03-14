"use client";

import { useMemo } from "react";

interface FractionBarProps {
  numerator: number;
  denominator: number;
  color: string;
  width?: number;
  height?: number;
  showLabel?: boolean;
  onClick?: () => void;
  interactive?: boolean;
}

/** Darken a hex color */
function darken(hex: string, pct: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  if (isNaN(num)) return hex;
  const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * pct));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * pct));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * pct));
  return `rgb(${r},${g},${b})`;
}

/** Lighten a hex color */
function lighten(hex: string, pct: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  if (isNaN(num)) return hex;
  const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * pct));
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * pct));
  const b = Math.min(255, (num & 0xff) + Math.round(255 * pct));
  return `rgb(${r},${g},${b})`;
}

export default function FractionBar({
  numerator,
  denominator,
  color,
  width = 200,
  height = 40,
  showLabel = true,
  onClick,
  interactive = false,
}: FractionBarProps) {
  const gap = 2;
  const cornerRadius = 5;
  const segmentWidth = (width - gap * (denominator - 1)) / denominator;
  const darkColor = useMemo(() => darken(color, 0.15), [color]);
  const lightColor = useMemo(() => lighten(color, 0.25), [color]);
  // Stable gradient ID based on fraction values
  const gradientId = `seg-${numerator}-${denominator}`;

  return (
    <div
      onClick={onClick}
      className={`inline-flex flex-col items-center gap-1 ${
        interactive ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="drop-shadow-md"
      >
        <defs>
          <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lightColor} />
            <stop offset="40%" stopColor={color} />
            <stop offset="100%" stopColor={darkColor} />
          </linearGradient>
          <linearGradient id={`${gradientId}-empty`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f9fafb" />
            <stop offset="100%" stopColor="#e5e7eb" />
          </linearGradient>
        </defs>

        {/* Render each segment as a tile */}
        {Array.from({ length: denominator }, (_, i) => {
          const x = i * (segmentWidth + gap);
          const isFilled = i < numerator;
          const isFirst = i === 0;
          const isLast = i === denominator - 1;
          const rx = (isFirst || isLast) ? cornerRadius : 2;

          return (
            <g key={i}>
              <rect
                x={x}
                y={0}
                width={segmentWidth}
                height={height}
                rx={rx}
                fill={isFilled ? `url(#${gradientId}-fill)` : `url(#${gradientId}-empty)`}
                stroke={isFilled ? darkColor : "#d1d5db"}
                strokeWidth={1}
              />
              {/* Shine on filled segments */}
              {isFilled && (
                <rect
                  x={x + 2}
                  y={2}
                  width={Math.max(0, segmentWidth - 4)}
                  height={height * 0.3}
                  rx={rx > 2 ? rx - 1 : 1}
                  fill="white"
                  opacity={0.2}
                />
              )}
            </g>
          );
        })}
      </svg>

      {showLabel && (
        <span
          className="text-[11px] font-extrabold text-white rounded-lg px-2 py-0.5 shadow-sm"
          style={{ backgroundColor: color }}
        >
          {numerator}/{denominator}
        </span>
      )}
    </div>
  );
}
