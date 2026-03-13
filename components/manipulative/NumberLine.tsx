"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { fractionsEqualRaw } from "@/lib/fractions";

interface NumberLineProps {
  fractions: Array<{
    numerator: number;
    denominator: number;
    color: string;
    id: string;
  }>;
  width?: number;
}

const TICK_MARKS = [
  { value: 0, label: "0" },
  { value: 0.25, label: "1/4" },
  { value: 0.5, label: "1/2" },
  { value: 0.75, label: "3/4" },
  { value: 1, label: "1" },
];

const PADDING_X = 32;
const LINE_Y = 48;
const MARKER_RADIUS = 6;
const EQUIVALENT_OFFSET = 28;

const fractionsEqual = fractionsEqualRaw;

export default function NumberLine({ fractions, width }: NumberLineProps) {
  // Group fractions that land on the same position (equivalent fractions)
  const groups = useMemo(() => {
    const map = new Map<
      string,
      Array<{
        numerator: number;
        denominator: number;
        color: string;
        id: string;
        originalIndex: number;
      }>
    >();

    fractions.forEach((f, idx) => {
      const decimal = f.numerator / f.denominator;
      const key = decimal.toFixed(10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ ...f, originalIndex: idx });
    });

    return map;
  }, [fractions]);

  const svgWidth = width ?? 400;
  const lineLength = svgWidth - PADDING_X * 2;
  const svgHeight = 120;

  const toX = (value: number) => PADDING_X + value * lineLength;

  return (
    <div
      className="w-full rounded-xl border border-gray-200 bg-white p-3"
      style={width ? { width } : undefined}
    >
      <svg
        width="100%"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="overflow-visible"
      >
        {/* Main horizontal line */}
        <line
          x1={PADDING_X}
          y1={LINE_Y}
          x2={svgWidth - PADDING_X}
          y2={LINE_Y}
          stroke="#d1d5db"
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* Tick marks */}
        {TICK_MARKS.map((tick) => {
          const x = toX(tick.value);
          const isEndpoint = tick.value === 0 || tick.value === 1;
          return (
            <g key={tick.label}>
              <line
                x1={x}
                y1={LINE_Y - (isEndpoint ? 12 : 8)}
                x2={x}
                y2={LINE_Y + (isEndpoint ? 12 : 8)}
                stroke={isEndpoint ? "#9ca3af" : "#d1d5db"}
                strokeWidth={isEndpoint ? 2 : 1.5}
                strokeLinecap="round"
              />
              <text
                x={x}
                y={LINE_Y + (isEndpoint ? 28 : 24)}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize={isEndpoint ? 13 : 10}
                fontFamily="sans-serif"
                fontWeight={isEndpoint ? 600 : 400}
              >
                {tick.label}
              </text>
            </g>
          );
        })}

        {/* Fraction markers */}
        {Array.from(groups.entries()).map(([, group]) => {
          const isEquivalent = group.length > 1;
          const decimal = group[0].numerator / group[0].denominator;
          const cx = toX(decimal);

          return (
            <g key={group.map((f) => f.id).join("-")}>
              {/* Shared glow for equivalent fractions */}
              {isEquivalent && (
                <motion.circle
                  cx={cx}
                  cy={LINE_Y}
                  r={20}
                  fill="none"
                  stroke={group[0].color}
                  strokeWidth={1.5}
                  strokeOpacity={0.3}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 120, delay: 0.3 }}
                  filter="url(#glow)"
                />
              )}

              {/* Dotted connecting line for equivalents */}
              {isEquivalent && (
                <motion.line
                  x1={cx}
                  y1={LINE_Y - MARKER_RADIUS}
                  x2={cx}
                  y2={LINE_Y - EQUIVALENT_OFFSET - MARKER_RADIUS}
                  stroke={group[0].color}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                />
              )}

              {group.map((f, groupIdx) => {
                const yOffset = isEquivalent
                  ? -groupIdx * EQUIVALENT_OFFSET
                  : 0;
                const markerY = LINE_Y + yOffset;
                const label = `${f.numerator}/${f.denominator}`;

                return (
                  <motion.g
                    key={f.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: f.originalIndex * 0.12,
                    }}
                    style={{ originX: `${cx}px`, originY: `${markerY}px` }}
                  >
                    {/* Marker circle */}
                    <circle
                      cx={cx}
                      cy={markerY}
                      r={MARKER_RADIUS}
                      fill={f.color}
                      stroke="white"
                      strokeWidth={2}
                    />

                    {/* Pill-shaped label below marker */}
                    <rect
                      x={cx - 16}
                      y={markerY + MARKER_RADIUS + 4}
                      width={32}
                      height={16}
                      rx={8}
                      fill={f.color}
                    />
                    <text
                      x={cx}
                      y={markerY + MARKER_RADIUS + 15}
                      textAnchor="middle"
                      fill="white"
                      fontSize={10}
                      fontFamily="sans-serif"
                      fontWeight={600}
                    >
                      {label}
                    </text>
                  </motion.g>
                );
              })}
            </g>
          );
        })}

        {/* SVG filter for subtle glow */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );
}
