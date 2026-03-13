"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useMemo, useRef } from "react";
import { FRACTION_COLORS, getFractionColor } from "@/lib/fractions";

interface NumberLineInteractiveProps {
  denominator: number;
  onPlace?: (fraction: { numerator: number; denominator: number }) => void;
  placedFraction?: { numerator: number; denominator: number } | null;
  showBenchmarks?: boolean;
  maxValue?: 1 | 2;
  targetFraction?: { numerator: number; denominator: number } | null;
  showJumpArcs?: boolean;
}

const PADDING_X = 40;
const LINE_Y = 70;
const SVG_WIDTH = 500;
const SVG_HEIGHT = 140;
const MARKER_R = 14;
const TICK_HIT_WIDTH = 44; // minimum touch target

export default function NumberLineInteractive({
  denominator,
  onPlace,
  placedFraction = null,
  showBenchmarks = true,
  maxValue = 1,
  targetFraction = null,
  showJumpArcs = false,
}: NumberLineInteractiveProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const lineLength = SVG_WIDTH - PADDING_X * 2;

  const toX = useCallback(
    (value: number) => PADDING_X + (value / maxValue) * lineLength,
    [maxValue, lineLength]
  );

  const ticks = useMemo(() => {
    const result: Array<{ numerator: number; denominator: number; value: number }> = [];
    const totalTicks = maxValue * denominator;
    for (let i = 0; i <= totalTicks; i++) {
      result.push({ numerator: i, denominator, value: i / denominator });
    }
    return result;
  }, [denominator, maxValue]);

  const benchmarks = useMemo(() => {
    const marks = [
      { value: 0, label: "0" },
      { value: 0.5, label: "1/2" },
      { value: 1, label: "1" },
    ];
    if (maxValue === 2) {
      marks.push({ value: 1.5, label: "3/2" }, { value: 2, label: "2" });
    }
    return marks;
  }, [maxValue]);

  const isBenchmark = useCallback(
    (value: number) => benchmarks.some((b) => Math.abs(b.value - value) < 0.001),
    [benchmarks]
  );

  const handleTap = useCallback(
    (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
      if (!svgRef.current || !onPlace) return;
      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();

      let clientX: number;
      if ("touches" in e) {
        clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
      } else {
        clientX = e.clientX;
      }

      // Convert client coords to SVG viewBox coords
      const scaleX = SVG_WIDTH / rect.width;
      const svgX = (clientX - rect.left) * scaleX;

      // Convert to value
      const rawValue = ((svgX - PADDING_X) / lineLength) * maxValue;

      // Snap to nearest tick
      const step = 1 / denominator;
      const snapped = Math.round(rawValue / step) * step;
      const clamped = Math.max(0, Math.min(maxValue, snapped));

      const numerator = Math.round(clamped * denominator);
      onPlace({ numerator, denominator });
    },
    [onPlace, denominator, maxValue, lineLength]
  );

  const placedValue = placedFraction
    ? placedFraction.numerator / placedFraction.denominator
    : null;
  const placedColor = placedFraction
    ? getFractionColor(placedFraction.numerator, placedFraction.denominator)
    : FRACTION_COLORS[denominator] || "#8b5cf6";

  const targetValue = targetFraction
    ? targetFraction.numerator / targetFraction.denominator
    : null;

  return (
    <div className="w-full rounded-2xl border-2 border-purple-200 bg-white/90 p-3 shadow-md backdrop-blur">
      <svg
        ref={svgRef}
        width="100%"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="overflow-visible touch-none"
        onPointerDown={handleTap}
      >
        {/* Gradient background strip */}
        <rect
          x={PADDING_X - 4}
          y={LINE_Y - 20}
          width={lineLength + 8}
          height={40}
          rx={20}
          fill="#faf5ff"
          stroke="#e9d5ff"
          strokeWidth={1}
        />

        {/* Main line */}
        <line
          x1={PADDING_X}
          y1={LINE_Y}
          x2={SVG_WIDTH - PADDING_X}
          y2={LINE_Y}
          stroke="#c084fc"
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* Denominator tick marks */}
        {ticks.map((tick) => {
          const x = toX(tick.value);
          const isBench = isBenchmark(tick.value);
          const tickH = isBench ? 16 : 10;
          return (
            <g key={`tick-${tick.numerator}`}>
              {/* Invisible wide hit area */}
              <rect
                x={x - TICK_HIT_WIDTH / 2}
                y={LINE_Y - 22}
                width={TICK_HIT_WIDTH}
                height={44}
                fill="transparent"
              />
              <line
                x1={x}
                y1={LINE_Y - tickH}
                x2={x}
                y2={LINE_Y + tickH}
                stroke={isBench ? "#a855f7" : "#d8b4fe"}
                strokeWidth={isBench ? 2.5 : 1.5}
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* Benchmark labels */}
        {showBenchmarks &&
          benchmarks.map((b) => (
            <text
              key={`bench-${b.label}`}
              x={toX(b.value)}
              y={LINE_Y + 32}
              textAnchor="middle"
              fill="#7c3aed"
              fontSize={13}
              fontFamily="sans-serif"
              fontWeight={700}
            >
              {b.label}
            </text>
          ))}

        {/* Target marker */}
        <AnimatePresence>
          {targetValue !== null && (
            <motion.g
              key="target"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.circle
                cx={toX(targetValue)}
                cy={LINE_Y}
                r={MARKER_R + 4}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 3"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                style={{ originX: `${toX(targetValue)}px`, originY: `${LINE_Y}px` }}
              />
              <circle
                cx={toX(targetValue)}
                cy={LINE_Y}
                r={6}
                fill="#fbbf24"
                stroke="white"
                strokeWidth={2}
                opacity={0.7}
              />
              <text
                x={toX(targetValue)}
                y={LINE_Y - 24}
                textAnchor="middle"
                fill="#d97706"
                fontSize={11}
                fontWeight={600}
                fontFamily="sans-serif"
              >
                ?
              </text>
            </motion.g>
          )}
        </AnimatePresence>

        {/* Jump arcs from 0 to placed fraction */}
        {showJumpArcs && placedFraction && placedValue !== null && placedValue > 0 && (
          <>
            {Array.from({ length: placedFraction.numerator }, (_, i) => {
              const startX = toX(i / placedFraction.denominator);
              const endX = toX((i + 1) / placedFraction.denominator);
              const midX = (startX + endX) / 2;
              const arcH = 24;
              return (
                <motion.path
                  key={`arc-${i}`}
                  d={`M ${startX} ${LINE_Y} Q ${midX} ${LINE_Y - arcH} ${endX} ${LINE_Y}`}
                  fill="none"
                  stroke={placedColor}
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={0.5}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                />
              );
            })}
          </>
        )}

        {/* Placed marker */}
        <AnimatePresence>
          {placedValue !== null && placedFraction && (
            <motion.g
              key={`placed-${placedFraction.numerator}-${placedFraction.denominator}`}
              initial={{ scale: 0, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              {/* Glow ring */}
              <circle
                cx={toX(placedValue)}
                cy={LINE_Y}
                r={MARKER_R + 6}
                fill={placedColor}
                opacity={0.15}
              />
              {/* Main circle */}
              <circle
                cx={toX(placedValue)}
                cy={LINE_Y}
                r={MARKER_R}
                fill={placedColor}
                stroke="white"
                strokeWidth={3}
              />
              {/* Fraction label inside pill */}
              <rect
                x={toX(placedValue) - 22}
                y={LINE_Y - MARKER_R - 26}
                width={44}
                height={20}
                rx={10}
                fill={placedColor}
              />
              <text
                x={toX(placedValue)}
                y={LINE_Y - MARKER_R - 12}
                textAnchor="middle"
                fill="white"
                fontSize={12}
                fontWeight={700}
                fontFamily="sans-serif"
              >
                {placedFraction.numerator}/{placedFraction.denominator}
              </text>
            </motion.g>
          )}
        </AnimatePresence>

        {/* SVG filter for glow */}
        <defs>
          <filter id="nl-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
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
