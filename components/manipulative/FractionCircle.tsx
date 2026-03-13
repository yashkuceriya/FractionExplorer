"use client";

import { motion } from "framer-motion";

interface FractionCircleProps {
  denominator: number;
  shadedSegments: boolean[];
  onToggleSegment: (index: number) => void;
  color?: string;
  size?: number;
  showLabel?: boolean;
}

/** Build an SVG arc path for segment i of n, centered at (cx, cy) with radius r. */
function segmentPath(
  i: number,
  n: number,
  cx: number,
  cy: number,
  r: number
): string {
  if (n === 1) {
    // Full circle — arc command can't draw a complete circle, so use two semicircles
    return [
      `M ${cx} ${cy - r}`,
      `A ${r} ${r} 0 1 1 ${cx} ${cy + r}`,
      `A ${r} ${r} 0 1 1 ${cx} ${cy - r}`,
      "Z",
    ].join(" ");
  }

  const anglePerSegment = (2 * Math.PI) / n;
  const startAngle = i * anglePerSegment - Math.PI / 2;
  const endAngle = (i + 1) * anglePerSegment - Math.PI / 2;

  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);

  const largeArc = anglePerSegment > Math.PI ? 1 : 0;

  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

/** Midpoint angle for placing a label inside a segment. */
function segmentMidAngle(i: number, n: number): number {
  const anglePerSegment = (2 * Math.PI) / n;
  return i * anglePerSegment + anglePerSegment / 2 - Math.PI / 2;
}

const PALETTE = {
  pink: "#E91E8C",
  purple: "#7C3AED",
  green: "#10B981",
};

export default function FractionCircle({
  denominator,
  shadedSegments,
  onToggleSegment,
  color = PALETTE.pink,
  size = 220,
  showLabel = true,
}: FractionCircleProps) {
  const n = Math.max(1, Math.round(denominator));
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8; // padding for stroke
  const labelR = r * 0.6; // radius for segment labels

  const shadedCount = shadedSegments.filter(Boolean).length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ touchAction: "manipulation", overflow: "visible" }}
      >
        {Array.from({ length: n }, (_, i) => {
          const shaded = !!shadedSegments[i];
          const d = segmentPath(i, n, cx, cy, r);
          const midAngle = segmentMidAngle(i, n);
          const lx = cx + labelR * Math.cos(midAngle);
          const ly = cy + labelR * Math.sin(midAngle);

          return (
            <g key={i} onClick={() => onToggleSegment(i)} style={{ cursor: "pointer" }}>
              <motion.path
                d={d}
                fill={shaded ? color : "#F3F4F6"}
                stroke="#fff"
                strokeWidth={2.5}
                initial={false}
                animate={{
                  fill: shaded ? color : "#F3F4F6",
                  scale: 1,
                }}
                whileTap={{ scale: 0.93 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{ originX: `${cx}px`, originY: `${cy}px` }}
              />

              {/* Outer border for unshaded segments so they're clearly visible */}
              {!shaded && (
                <path
                  d={d}
                  fill="none"
                  stroke="#D1D5DB"
                  strokeWidth={1.5}
                  pointerEvents="none"
                />
              )}

              {/* Segment label */}
              {showLabel && n <= 12 && (
                <text
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={Math.min(18, size / (n + 2))}
                  fontWeight={600}
                  fill={shaded ? "#fff" : "#9CA3AF"}
                  pointerEvents="none"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  1/{n}
                </text>
              )}
            </g>
          );
        })}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={3} fill="#fff" pointerEvents="none" />
      </svg>

      {/* Fraction readout */}
      <motion.div
        key={`${shadedCount}-${n}`}
        initial={{ scale: 0.85, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
        style={{
          fontSize: Math.max(28, size / 5),
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
          color: shadedCount > 0 ? color : "#9CA3AF",
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {Math.min(shadedCount, n)}/{n}
      </motion.div>
    </div>
  );
}
