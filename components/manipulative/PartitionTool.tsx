"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface PartitionToolProps {
  shape: "rectangle" | "circle";
  denominator: number;
  shadedSegments: boolean[];
  onToggleSegment: (index: number) => void;
  onChangeDenominator?: (d: number) => void;
  size?: number;
  showControls?: boolean;
  color?: string;
}

/**
 * Snap-to-grid partition tool.
 * Shows a shape divided into equal parts. Kids tap segments to shade them.
 * Supports rectangles (vertical splits) and circles (pie slices).
 */
export default function PartitionTool({
  shape,
  denominator,
  shadedSegments,
  onToggleSegment,
  onChangeDenominator,
  size = 200,
  showControls = true,
  color = "#F13EA1",
}: PartitionToolProps) {
  const [justTapped, setJustTapped] = useState<number | null>(null);

  function handleTap(i: number) {
    onToggleSegment(i);
    setJustTapped(i);
    setTimeout(() => setJustTapped(null), 300);
  }

  const shadedCount = shadedSegments.filter(Boolean).length;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Shape */}
      <svg width={size} height={shape === "rectangle" ? size * 0.5 : size} viewBox={shape === "rectangle" ? "0 0 200 100" : "0 0 200 200"}>
        {shape === "rectangle" ? (
          <RectPartition
            denominator={denominator}
            shaded={shadedSegments}
            onTap={handleTap}
            justTapped={justTapped}
            color={color}
          />
        ) : (
          <CirclePartition
            denominator={denominator}
            shaded={shadedSegments}
            onTap={handleTap}
            justTapped={justTapped}
            color={color}
          />
        )}
      </svg>

      {/* Fraction label */}
      <div className="text-center">
        <span className="text-2xl font-black text-purple-800">
          {shadedCount}/{denominator}
        </span>
      </div>

      {/* Denominator controls */}
      {showControls && onChangeDenominator && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-purple-600">Split into:</span>
          {[2, 3, 4, 5, 6, 8].map((d) => (
            <button
              key={d}
              onClick={() => onChangeDenominator(d)}
              className={`w-9 h-9 rounded-lg text-sm font-black transition-all ${
                denominator === d
                  ? "bg-pink-500 text-white scale-110"
                  : "bg-white border-2 border-pink-200 text-purple-700"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Rectangle split into vertical segments */
function RectPartition({
  denominator,
  shaded,
  onTap,
  justTapped,
  color,
}: {
  denominator: number;
  shaded: boolean[];
  onTap: (i: number) => void;
  justTapped: number | null;
  color: string;
}) {
  const segW = 180 / denominator;
  const padX = 10;
  const padY = 10;
  const h = 80;

  return (
    <g>
      {/* Outer border */}
      <rect x={padX} y={padY} width={180} height={h} rx={4} fill="none" stroke="#844CA4" strokeWidth={2} />

      {Array.from({ length: denominator }, (_, i) => {
        const x = padX + i * segW;
        const isTapped = justTapped === i;

        return (
          <g key={i}>
            <motion.rect
              x={x + 0.5}
              y={padY + 0.5}
              width={segW - 1}
              height={h - 1}
              rx={1}
              fill={shaded[i] ? color : "#fce7f3"}
              opacity={shaded[i] ? 0.85 : 0.3}
              animate={isTapped ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.2 }}
              onClick={() => onTap(i)}
              style={{ cursor: "pointer" }}
            />
            {/* Divider line */}
            {i > 0 && (
              <line
                x1={x}
                y1={padY}
                x2={x}
                y2={padY + h}
                stroke="#844CA4"
                strokeWidth={1.5}
                strokeDasharray="4 2"
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

/** Circle split into angular segments */
function CirclePartition({
  denominator,
  shaded,
  onTap,
  justTapped,
  color,
}: {
  denominator: number;
  shaded: boolean[];
  onTap: (i: number) => void;
  justTapped: number | null;
  color: string;
}) {
  const cx = 100;
  const cy = 100;
  const r = 85;

  function segmentPath(i: number): string {
    const angleStart = (i / denominator) * Math.PI * 2 - Math.PI / 2;
    const angleEnd = ((i + 1) / denominator) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + r * Math.cos(angleStart);
    const y1 = cy + r * Math.sin(angleStart);
    const x2 = cx + r * Math.cos(angleEnd);
    const y2 = cy + r * Math.sin(angleEnd);
    const largeArc = denominator <= 2 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  return (
    <g>
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={r} fill="#fce7f3" stroke="#844CA4" strokeWidth={2} />

      {Array.from({ length: denominator }, (_, i) => {
        const isTapped = justTapped === i;

        return (
          <motion.path
            key={i}
            d={segmentPath(i)}
            fill={shaded[i] ? color : "transparent"}
            opacity={shaded[i] ? 0.85 : 0}
            stroke="#844CA4"
            strokeWidth={1.5}
            animate={isTapped ? { scale: [1, 1.03, 1] } : {}}
            transition={{ duration: 0.2 }}
            onClick={() => onTap(i)}
            style={{ cursor: "pointer", transformOrigin: `${cx}px ${cy}px` }}
          />
        );
      })}

      {/* Divider lines */}
      {Array.from({ length: denominator }, (_, i) => {
        const angle = (i / denominator) * Math.PI * 2 - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return (
          <line
            key={`line-${i}`}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="#844CA4"
            strokeWidth={1.5}
          />
        );
      })}
    </g>
  );
}
