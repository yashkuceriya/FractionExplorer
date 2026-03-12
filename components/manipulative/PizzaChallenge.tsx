"use client";

import { useState, useMemo, useEffect, useRef, useCallback, forwardRef, type PointerEvent as RPointerEvent } from "react";
import type { FractionDrop } from "./FractionBattle";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { playSlicePlaced, playOrderComplete, playError, playSlice } from "@/lib/sounds";

// ── Types ────────────────────────────────────────────────────────────────────

interface PizzaChallengeProps {
  onComplete?: (orderName: string) => void;
  pendingDrop?: (FractionDrop & { droppableId: string }) | null;
  onXP?: (amount: number, label: string) => void;
}

interface Fraction {
  numerator: number;
  denominator: number;
}

interface PizzaTopping {
  name: string;
  emoji: string;
  fraction: Fraction;
  color: string;
  dotColor: string;
}

interface PizzaOrder {
  name: string;
  emoji: string;
  variant: "pizza" | "cookie";
  slices: number;
  toppings: PizzaTopping[];
}

type SlotStatus = "empty" | "correct" | "wrong";
type Phase = "slice" | "fill";

// ── Fraction math ────────────────────────────────────────────────────────────

function fractionsEqual(a: Fraction, b: Fraction): boolean {
  return a.numerator * b.denominator === b.numerator * a.denominator;
}

function fractionLabel(f: Fraction): string {
  if (f.numerator === 0) return "0";
  if (f.denominator === 1) return `${f.numerator}`;
  return `${f.numerator}/${f.denominator}`;
}

// ── SVG arc helpers ──────────────────────────────────────────────────────────

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sliceArcPath(
  startDeg: number,
  endDeg: number,
  r: number,
  cx: number,
  cy: number
): string {
  const start = polarToXY(cx, cy, r, startDeg);
  const end = polarToXY(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function generateToppingDots(
  startDeg: number,
  endDeg: number,
  r: number,
  cx: number,
  cy: number,
  count: number
): { x: number; y: number }[] {
  const dots: { x: number; y: number }[] = [];
  const margin = 8;
  for (let attempt = 0; attempt < count * 6 && dots.length < count; attempt++) {
    const angle = startDeg + Math.random() * (endDeg - startDeg);
    const dist = margin + Math.random() * (r - margin * 2);
    const pt = polarToXY(cx, cy, dist, angle);
    const dx = pt.x - cx;
    const dy = pt.y - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > 12 && d < r - 6) {
      dots.push(pt);
    }
  }
  return dots;
}

// ── Order data ───────────────────────────────────────────────────────────────

const ORDERS: PizzaOrder[] = [
  {
    name: "Half & Half",
    emoji: "🍕",
    variant: "pizza",
    slices: 2,
    toppings: [
      { name: "Pepperoni", emoji: "🔴", fraction: { numerator: 1, denominator: 2 }, color: "#fbbf24", dotColor: "#dc2626" },
      { name: "Cheese", emoji: "🧀", fraction: { numerator: 1, denominator: 2 }, color: "#fde68a", dotColor: "#f59e0b" },
    ],
  },
  {
    name: "Three Way",
    emoji: "🍕",
    variant: "pizza",
    slices: 3,
    toppings: [
      { name: "Pepperoni", emoji: "🔴", fraction: { numerator: 1, denominator: 3 }, color: "#fbbf24", dotColor: "#dc2626" },
      { name: "Mushroom", emoji: "🍄", fraction: { numerator: 1, denominator: 3 }, color: "#fde68a", dotColor: "#92400e" },
      { name: "Olive", emoji: "🫒", fraction: { numerator: 1, denominator: 3 }, color: "#d4d4aa", dotColor: "#365314" },
    ],
  },
  {
    name: "Party Slices",
    emoji: "🎉",
    variant: "pizza",
    slices: 4,
    toppings: [
      { name: "Pepperoni", emoji: "🔴", fraction: { numerator: 1, denominator: 4 }, color: "#fbbf24", dotColor: "#dc2626" },
      { name: "Mushroom", emoji: "🍄", fraction: { numerator: 1, denominator: 4 }, color: "#fde68a", dotColor: "#92400e" },
      { name: "Cheese", emoji: "🧀", fraction: { numerator: 1, denominator: 4 }, color: "#fef3c7", dotColor: "#f59e0b" },
      { name: "Veggie", emoji: "🥦", fraction: { numerator: 1, denominator: 4 }, color: "#bbf7d0", dotColor: "#16a34a" },
    ],
  },
  {
    name: "Big & Small",
    emoji: "🍕",
    variant: "pizza",
    slices: 4,
    toppings: [
      { name: "Pepperoni", emoji: "🔴", fraction: { numerator: 3, denominator: 4 }, color: "#fbbf24", dotColor: "#dc2626" },
      { name: "Olive", emoji: "🫒", fraction: { numerator: 1, denominator: 4 }, color: "#d4d4aa", dotColor: "#365314" },
    ],
  },
  {
    name: "Mix Match",
    emoji: "🍕",
    variant: "pizza",
    slices: 4,
    toppings: [
      { name: "Pepperoni", emoji: "🔴", fraction: { numerator: 1, denominator: 2 }, color: "#fbbf24", dotColor: "#dc2626" },
      { name: "Mushroom", emoji: "🍄", fraction: { numerator: 1, denominator: 4 }, color: "#fde68a", dotColor: "#92400e" },
      { name: "Olive", emoji: "🫒", fraction: { numerator: 1, denominator: 4 }, color: "#d4d4aa", dotColor: "#365314" },
    ],
  },
  {
    name: "Cookie Split",
    emoji: "🍪",
    variant: "cookie",
    slices: 3,
    toppings: [
      { name: "Chocolate", emoji: "🍫", fraction: { numerator: 1, denominator: 3 }, color: "#92400e", dotColor: "#451a03" },
      { name: "Vanilla", emoji: "🍦", fraction: { numerator: 2, denominator: 3 }, color: "#fef3c7", dotColor: "#d97706" },
    ],
  },
  {
    name: "Fancy Pie",
    emoji: "🥧",
    variant: "cookie",
    slices: 6,
    toppings: [
      { name: "Cherry", emoji: "🍒", fraction: { numerator: 1, denominator: 2 }, color: "#fca5a5", dotColor: "#dc2626" },
      { name: "Apple", emoji: "🍎", fraction: { numerator: 1, denominator: 3 }, color: "#bbf7d0", dotColor: "#16a34a" },
      { name: "Cream", emoji: "🍨", fraction: { numerator: 1, denominator: 6 }, color: "#fefce8", dotColor: "#f59e0b" },
    ],
  },
  {
    name: "Ultimate",
    emoji: "🏆",
    variant: "pizza",
    slices: 8,
    toppings: [
      { name: "Pepperoni", emoji: "🔴", fraction: { numerator: 1, denominator: 2 }, color: "#fbbf24", dotColor: "#dc2626" },
      { name: "Mushroom", emoji: "🍄", fraction: { numerator: 1, denominator: 4 }, color: "#fde68a", dotColor: "#92400e" },
      { name: "Cheese", emoji: "🧀", fraction: { numerator: 1, denominator: 8 }, color: "#fef3c7", dotColor: "#f59e0b" },
      { name: "Olive", emoji: "🫒", fraction: { numerator: 1, denominator: 8 }, color: "#d4d4aa", dotColor: "#365314" },
    ],
  },
];

// ── Constants ────────────────────────────────────────────────────────────────

const CX = 100;
const CY = 100;
const RADIUS = 78;
const CRUST_RADIUS = 90;

// ── Slice Phase Pizza ────────────────────────────────────────────────────────

const SlicePizzaSVG = forwardRef<SVGSVGElement, {
  variant: "pizza" | "cookie";
  cutCount: number;
  targetSlices: number;
  animatingCut: number | null;
}>(function SlicePizzaSVG({ variant, cutCount, targetSlices, animatingCut }, ref) {
  const isCookie = variant === "cookie";
  const isCorrect = cutCount === targetSlices;

  return (
    <svg ref={ref} viewBox="0 0 200 200" className="w-52 h-52 drop-shadow-lg">
      {/* Crust / cookie edge */}
      <circle cx={CX} cy={CY} r={CRUST_RADIUS} fill={isCookie ? "#92400e" : "#d4a574"} />
      {/* Base */}
      <circle cx={CX} cy={CY} r={RADIUS} fill={isCookie ? "#b45309" : "#f5deb3"} />

      {/* Slice lines */}
      {cutCount > 0 &&
        Array.from({ length: cutCount }).map((_, i) => {
          const angle = (360 / cutCount) * i;
          const pt = polarToXY(CX, CY, RADIUS, angle);
          const isNew = animatingCut === i;
          return (
            <motion.line
              key={`cut-${cutCount}-${i}`}
              x1={CX}
              y1={CY}
              x2={pt.x}
              y2={pt.y}
              stroke={isCookie ? "#451a03" : "#8B4513"}
              strokeWidth={2}
              strokeLinecap="round"
              initial={isNew ? { pathLength: 0, opacity: 0 } : { pathLength: 1, opacity: 1 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          );
        })}

      {/* Fraction labels on slices when correct */}
      {isCorrect &&
        Array.from({ length: cutCount }).map((_, i) => {
          const midAngle = (360 / cutCount) * i + 360 / cutCount / 2;
          const labelR = RADIUS * 0.55;
          const pt = polarToXY(CX, CY, labelR, midAngle);
          return (
            <motion.text
              key={`label-${i}`}
              x={pt.x}
              y={pt.y}
              textAnchor="middle"
              dominantBaseline="central"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.08, type: "spring", stiffness: 400, damping: 15 }}
              className="text-[11px] font-bold"
              fill={isCookie ? "#fef3c7" : "#78350f"}
            >
              1/{cutCount}
            </motion.text>
          );
        })}

      {/* Center dot */}
      <circle cx={CX} cy={CY} r={3} fill={isCookie ? "#78350f" : "#b8860b"} opacity={0.4} />
    </svg>
  );
});

// ── Fill Phase Pizza ─────────────────────────────────────────────────────────

const FillPizzaSVG = ({
  order,
  filledSlots,
}: {
  order: PizzaOrder;
  filledSlots: boolean[];
}) => {
  const isCookie = order.variant === "cookie";

  const sliceRanges = useMemo(() => {
    const ranges: { start: number; end: number }[] = [];
    let angle = 0;
    for (const t of order.toppings) {
      const sweep = (t.fraction.numerator / t.fraction.denominator) * 360;
      ranges.push({ start: angle, end: angle + sweep });
      angle += sweep;
    }
    return ranges;
  }, [order.toppings]);

  const toppingDots = useMemo(() => {
    return sliceRanges.map((range) => {
      const sweep = range.end - range.start;
      const dotCount = Math.max(2, Math.round((sweep / 360) * 12));
      return generateToppingDots(range.start, range.end, RADIUS, CX, CY, dotCount);
    });
  }, [sliceRanges]);

  return (
    <svg viewBox="0 0 200 200" className="w-36 h-36 drop-shadow-lg">
      <circle cx={CX} cy={CY} r={CRUST_RADIUS} fill={isCookie ? "#92400e" : "#d4a574"} />
      <circle cx={CX} cy={CY} r={RADIUS} fill={isCookie ? "#b45309" : "#f5deb3"} />

      {sliceRanges.map((range, i) => (
        <path
          key={`outline-${i}`}
          d={sliceArcPath(range.start, range.end, RADIUS, CX, CY)}
          fill="none"
          stroke={isCookie ? "#78350f" : "#c9a96e"}
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.5}
        />
      ))}

      {sliceRanges.map((range, i) =>
        filledSlots[i] ? (
          <g key={`filled-${i}`}>
            <motion.path
              d={sliceArcPath(range.start, range.end, RADIUS, CX, CY)}
              fill={order.toppings[i].color}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              style={{ transformOrigin: `${CX}px ${CY}px` }}
            />
            {toppingDots[i].map((dot, j) => (
              <motion.circle
                key={`dot-${i}-${j}`}
                cx={dot.x}
                cy={dot.y}
                r={isCookie ? 2.5 : 3.5}
                fill={order.toppings[i].dotColor}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.85 }}
                transition={{ delay: 0.1 + j * 0.03, type: "spring", stiffness: 500, damping: 15 }}
              />
            ))}
          </g>
        ) : null
      )}

      {sliceRanges.map((range, i) => {
        const pt = polarToXY(CX, CY, RADIUS, range.start);
        return (
          <line
            key={`line-${i}`}
            x1={CX}
            y1={CY}
            x2={pt.x}
            y2={pt.y}
            stroke={isCookie ? "#78350f" : "#b8860b"}
            strokeWidth={1.5}
            opacity={0.4}
          />
        );
      })}

      <circle cx={CX} cy={CY} r={3} fill={isCookie ? "#78350f" : "#b8860b"} opacity={0.3} />
    </svg>
  );
};

// ── Droppable topping slot ───────────────────────────────────────────────────

function ToppingSlot({
  id,
  topping,
  status,
  droppedFraction,
}: {
  id: string;
  topping: PizzaTopping;
  status: SlotStatus;
  droppedFraction: Fraction | null;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <motion.div
      ref={setNodeRef}
      className="flex items-center gap-3 rounded-xl border-2 border-dashed px-3 py-3 transition-colors min-h-[56px]"
      style={{
        borderColor: isOver
          ? "#6366f1"
          : status === "correct"
          ? "#22c55e"
          : status === "wrong"
          ? "#ef4444"
          : "#d6b88a",
        backgroundColor: isOver
          ? "rgba(99, 102, 241, 0.12)"
          : status === "correct"
          ? "rgba(34, 197, 94, 0.08)"
          : "rgba(255, 255, 255, 0.6)",
        boxShadow: isOver ? "0 0 0 2px rgba(99, 102, 241, 0.3)" : "none",
      }}
      animate={
        status === "wrong"
          ? { x: [0, -6, 6, -4, 4, 0] }
          : status === "correct"
          ? { scale: [1, 1.06, 0.97, 1] }
          : isOver
          ? { scale: 1.02 }
          : { scale: 1 }
      }
      transition={{ type: "tween", duration: 0.3 }}
    >
      <span className="text-2xl">{topping.emoji}</span>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-xs font-semibold text-amber-900">{topping.name}</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="h-2.5 rounded-full bg-gray-200 flex-1 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(topping.fraction.numerator / topping.fraction.denominator) * 100}%`,
                backgroundColor: topping.color,
                border: `1px solid ${topping.dotColor}`,
              }}
            />
          </div>
          <span className="text-xs font-bold text-amber-700 tabular-nums">
            {fractionLabel(topping.fraction)}
          </span>
        </div>
      </div>

      <div className="relative flex items-center justify-center w-16 h-11 rounded-lg bg-amber-50 border-2 border-amber-200 shadow-inner">
        {status === "empty" && (
          <motion.span
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ type: "tween", repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="text-amber-400 text-xs font-bold select-none"
          >
            ?/?
          </motion.span>
        )}
        <AnimatePresence mode="wait">
          {status === "correct" && droppedFraction && (
            <motion.span
              key="ok"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              exit={{ scale: 0 }}
              transition={{ type: "tween", duration: 0.3 }}
              className="text-green-600 font-bold text-sm"
            >
              {fractionLabel(droppedFraction)} ✅
            </motion.span>
          )}
          {status === "wrong" && (
            <motion.span
              key="no"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-red-500 text-xl"
            >
              ✕
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI = ["🎉", "🎊", "⭐", "🍕", "🍪", "✨", "🥧"];

function PizzaConfetti() {
  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        emoji: CONFETTI[i % CONFETTI.length],
        left: `${5 + Math.random() * 90}%`,
        delay: Math.random() * 0.6,
        duration: 1.2 + Math.random() * 0.8,
      })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: "110%", opacity: 0, rotate: 360 }}
          transition={{ type: "tween", duration: p.duration, delay: p.delay, ease: "easeIn" }}
          className="absolute text-lg"
          style={{ left: p.left }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PizzaChallenge({ onComplete, pendingDrop, onXP }: PizzaChallengeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("slice");
  const [sliceCount, setSliceCount] = useState(0);
  const [animatingCut, setAnimatingCut] = useState<number | null>(null);
  const [slots, setSlots] = useState<Record<string, { status: SlotStatus; fraction: Fraction | null }>>({});
  const [celebrating, setCelebrating] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [completedOrders, setCompletedOrders] = useState<Set<number>>(new Set());

  const order = ORDERS[currentIndex];

  // ── Timer management (prevent stale timeout bugs) ─────────────────────────

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Tracked setTimeout — all timers are auto-cleared on order change / unmount
  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Clean up on unmount
  useEffect(() => clearAllTimers, [clearAllTimers]);

  // ── Knife drag state (uses useMotionValue to avoid transform conflicts) ──

  const [isDraggingKnife, setIsDraggingKnife] = useState(false);
  const knifeX = useMotionValue(0);
  const knifeY = useMotionValue(0);
  const knifeStartRef = useRef<{ x: number; y: number } | null>(null);
  const pizzaSvgRef = useRef<SVGSVGElement>(null);
  const [slashKey, setSlashKey] = useState(0);
  // Ref to prevent rapid double-tap from over-counting slices
  const fillPendingRef = useRef(false);

  // Add a cut (shared by both drag-drop and tap)
  const addCut = useCallback(() => {
    if (phase !== "slice" || celebrating || fillPendingRef.current) return;

    setSliceCount((prev) => {
      const newCount = prev + 1;
      if (newCount > 8) return prev;

      playSlice();
      setSlashKey((k) => k + 1);
      setAnimatingCut(newCount - 1);

      if (newCount === order.slices) {
        // Lock further cuts and transition to fill phase
        fillPendingRef.current = true;
        safeTimeout(() => {
          setAnimatingCut(null);
          setPhase("fill");
          fillPendingRef.current = false;
        }, 800);
      } else {
        safeTimeout(() => setAnimatingCut(null), 400);
      }

      return newCount;
    });
  }, [phase, celebrating, order.slices, safeTimeout]);

  // Check if a pointer position is over the pizza SVG
  const isOverPizza = useCallback((clientX: number, clientY: number): boolean => {
    if (!pizzaSvgRef.current) return false;
    const rect = pizzaSvgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (rect.width / 2) * 1.15;
  }, []);

  const handleKnifePointerDown = useCallback((e: RPointerEvent) => {
    if (phase !== "slice" || celebrating || fillPendingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDraggingKnife(true);
    knifeStartRef.current = { x: e.clientX, y: e.clientY };
    knifeX.set(0);
    knifeY.set(0);
  }, [phase, celebrating, knifeX, knifeY]);

  const handleKnifePointerMove = useCallback((e: RPointerEvent) => {
    if (!isDraggingKnife || !knifeStartRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    knifeX.set(e.clientX - knifeStartRef.current.x);
    knifeY.set(e.clientY - knifeStartRef.current.y);
  }, [isDraggingKnife, knifeX, knifeY]);

  const handleKnifePointerUp = useCallback((e: RPointerEvent) => {
    if (!isDraggingKnife) return;
    e.stopPropagation();
    setIsDraggingKnife(false);
    knifeStartRef.current = null;

    if (isOverPizza(e.clientX, e.clientY)) {
      addCut();
    }

    knifeX.set(0);
    knifeY.set(0);
  }, [isDraggingKnife, knifeX, knifeY, isOverPizza, addCut]);

  // Tap on pizza to cut (fallback — always works)
  const handlePizzaTap = useCallback(() => {
    if (isDraggingKnife || fillPendingRef.current) return;
    addCut();
  }, [isDraggingKnife, addCut]);

  const handleUndoCut = useCallback(() => {
    if (phase === "slice" && !fillPendingRef.current) {
      setSliceCount((c) => Math.max(0, c - 1));
    }
  }, [phase]);

  // ── Fill phase logic ──────────────────────────────────────────────────────

  const filledSlots = useMemo(
    () =>
      order.toppings.map((_, i) => {
        const key = `pizza-slot-${currentIndex}-${i}`;
        return slots[key]?.status === "correct";
      }),
    [order.toppings, slots, currentIndex]
  );

  const allCorrect = filledSlots.length > 0 && filledSlots.every(Boolean);

  function handleDrop(slotId: string, dropped: Fraction) {
    if (phase !== "fill" || celebrating) return;
    const parts = slotId.split("-");
    const idx = Number(parts[parts.length - 1]);
    const target = order.toppings[idx]?.fraction;
    if (!target) return;

    const isCorrect = fractionsEqual(dropped, target);

    if (isCorrect) {
      playSlicePlaced();
    } else {
      playError();
    }

    setSlots((prev) => ({
      ...prev,
      [slotId]: { status: isCorrect ? "correct" : "wrong", fraction: dropped },
    }));

    if (!isCorrect) {
      safeTimeout(() => {
        setSlots((prev) => {
          const current = prev[slotId];
          if (current?.status !== "wrong") return prev;
          return { ...prev, [slotId]: { status: "empty", fraction: null } };
        });
      }, 1200);
    }
  }

  // ── Pending drop ──────────────────────────────────────────────────────────

  const lastSeq = useRef(-1);
  useEffect(() => {
    if (pendingDrop && pendingDrop._seq !== lastSeq.current) {
      lastSeq.current = pendingDrop._seq;
      handleDrop(pendingDrop.droppableId, {
        numerator: pendingDrop.numerator,
        denominator: pendingDrop.denominator,
      });
    }
  }, [pendingDrop]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Celebration ───────────────────────────────────────────────────────────
  // Uses a generation counter so stale timeouts from old orders are ignored.

  const orderGenRef = useRef(0);

  useEffect(() => {
    if (!allCorrect || phase !== "fill" || celebrating || allDone) return;

    const gen = orderGenRef.current;
    const capturedIndex = currentIndex;
    const capturedName = order.name;
    setCelebrating(true);

    safeTimeout(() => {
      // Bail if user switched orders while we were waiting
      if (orderGenRef.current !== gen) return;

      playOrderComplete();
      onComplete?.(capturedName);
      onXP?.(2, "Pizza order!");

      safeTimeout(() => {
        if (orderGenRef.current !== gen) return;

        setCelebrating(false);
        setCompletedOrders((prev) => new Set(prev).add(capturedIndex));

        if (capturedIndex < ORDERS.length - 1) {
          orderGenRef.current++;
          setCurrentIndex(capturedIndex + 1);
          setPhase("slice");
          setSliceCount(0);
          setSlots({});
        } else {
          setAllDone(true);
        }
      }, 2000);
    }, 400);
  }, [allCorrect, phase, celebrating, allDone]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectOrder(index: number) {
    if (celebrating) {
      // Force-cancel any pending celebration
      setCelebrating(false);
    }
    clearAllTimers();
    orderGenRef.current++;
    fillPendingRef.current = false;
    setCurrentIndex(index);
    setPhase("slice");
    setSliceCount(0);
    setSlots({});
    setAllDone(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const isSliceCorrect = sliceCount === order.slices;

  return (
    <div className="relative flex flex-col items-center gap-3 w-full max-w-lg mx-auto select-none">
      {/* Order progress dots */}
      <div className="flex gap-1.5 flex-wrap justify-center">
        {ORDERS.map((o, i) => (
          <button
            key={i}
            onClick={() => selectOrder(i)}
            className={`w-7 h-7 rounded-full text-xs flex items-center justify-center transition-all border-2 ${
              i === currentIndex
                ? "bg-amber-500 border-amber-600 shadow-md scale-110"
                : completedOrders.has(i)
                ? "bg-green-100 border-green-400"
                : "bg-amber-50 border-amber-200 hover:bg-amber-100"
            }`}
          >
            {completedOrders.has(i) ? "✅" : o.emoji}
          </button>
        ))}
      </div>

      {/* Main card — NO layout prop (breaks dnd-kit rect tracking) */}
      <motion.div
        className="relative w-full rounded-2xl shadow-lg"
        style={{
          background:
            order.variant === "cookie"
              ? "linear-gradient(145deg, #fef3c7 0%, #fde68a 50%, #f59e0b20 100%)"
              : "linear-gradient(145deg, #fff7ed 0%, #fed7aa 50%, #fdba7440 100%)",
        }}
        animate={celebrating ? { scale: [1, 1.04, 0.97, 1.02, 1] } : { scale: 1 }}
        transition={{ type: "tween", duration: 0.6 }}
      >
        <AnimatePresence>
          {celebrating && (
            <div className="overflow-hidden absolute inset-0 rounded-2xl pointer-events-none">
              <PizzaConfetti />
            </div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-1">
          <span className="text-2xl">{order.emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-amber-900">{order.name}</h3>
            <p className="text-[10px] text-amber-600 font-medium">
              {phase === "slice"
                ? `Cut into ${order.slices} equal slices!`
                : "Now drag the right fractions!"}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
            {phase === "slice" ? (
              <span className="flex items-center gap-1">🔪 Slice</span>
            ) : (
              <span>Fill</span>
            )}
            <span className="text-amber-300">|</span>
            <span>{currentIndex + 1}/{ORDERS.length}</span>
          </div>
        </div>

        {/* ── SLICE PHASE ── */}
        <AnimatePresence mode="wait">
          {phase === "slice" && (
            <motion.div
              key="slice-phase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-3 px-4 pb-4"
            >
              {/* Pizza — tappable to cut */}
              <div
                className="relative cursor-pointer"
                onClick={handlePizzaTap}
              >
                <SlicePizzaSVG
                  ref={pizzaSvgRef}
                  variant={order.variant}
                  cutCount={sliceCount}
                  targetSlices={order.slices}
                  animatingCut={animatingCut}
                />

                {/* Knife slash overlay — flashes on each cut */}
                <AnimatePresence>
                  {animatingCut !== null && (
                    <motion.div
                      key={slashKey}
                      initial={{ opacity: 0.8, scale: 0.8 }}
                      animate={{ opacity: 0, scale: 1.2 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none text-5xl"
                    >
                      🔪
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Correct checkmark */}
                {isSliceCorrect && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.4, 1] }}
                    transition={{ type: "tween", duration: 0.4 }}
                    className="absolute top-1 right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                  >
                    ✓
                  </motion.div>
                )}

                {/* "Tap to cut" hint on pizza */}
                {!isSliceCorrect && sliceCount === 0 && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ type: "tween", duration: 2, repeat: Infinity }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <span className="text-amber-800/60 text-xs font-bold bg-white/60 rounded-full px-3 py-1.5 backdrop-blur-sm">
                      Tap or drag 🔪 to cut!
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Knife + controls row */}
              <div className="flex items-center gap-4">
                {/* Draggable knife — drag onto pizza to cut */}
                {!isSliceCorrect && (
                  <motion.div
                    onPointerDown={handleKnifePointerDown}
                    onPointerMove={handleKnifePointerMove}
                    onPointerUp={handleKnifePointerUp}
                    animate={
                      isDraggingKnife
                        ? { scale: 1.3, rotate: -30 }
                        : { scale: [1, 1.08, 1], rotate: [0, -5, 5, 0] }
                    }
                    transition={
                      isDraggingKnife
                        ? { type: "tween", duration: 0.15 }
                        : { type: "tween", duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }
                    style={{
                      x: knifeX,
                      y: knifeY,
                      zIndex: isDraggingKnife ? 50 : 1,
                      touchAction: "none",
                    }}
                    className="cursor-grab active:cursor-grabbing select-none text-[2.5rem] leading-none p-2"
                  >
                    🔪
                  </motion.div>
                )}

                {/* Slice counter */}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <motion.span
                      key={sliceCount}
                      initial={{ scale: 1.5, color: "#f59e0b" }}
                      animate={{ scale: 1, color: isSliceCorrect ? "#22c55e" : "#92400e" }}
                      className="text-2xl font-extrabold tabular-nums"
                    >
                      {sliceCount}
                    </motion.span>
                    <span className="text-sm text-amber-700 font-medium">
                      / {order.slices} slices
                    </span>
                  </div>

                  {/* Undo button */}
                  {sliceCount > 0 && !isSliceCorrect && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleUndoCut}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 font-semibold hover:bg-amber-200 transition-colors"
                    >
                      ↩ Undo
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Feedback text */}
              {sliceCount > 0 && !isSliceCorrect && sliceCount > order.slices && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] text-orange-600 font-medium"
                >
                  Too many! Undo some cuts.
                </motion.p>
              )}
            </motion.div>
          )}

          {/* ── FILL PHASE ── */}
          {phase === "fill" && (
            <motion.div
              key="fill-phase"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-3 px-4 pb-4"
            >
              {/* Pizza — smaller in fill phase */}
              <FillPizzaSVG order={order} filledSlots={filledSlots} />

              {/* Topping slots — full width, stacked vertically */}
              <div className="flex flex-col gap-2 w-full">
                <p className="text-[10px] font-semibold text-amber-700 text-center">
                  Drag fraction blocks here 👇
                </p>
                {order.toppings.map((topping, i) => {
                  const key = `pizza-slot-${currentIndex}-${i}`;
                  const slot = slots[key] ?? { status: "empty" as SlotStatus, fraction: null };
                  return (
                    <ToppingSlot
                      key={key}
                      id={key}
                      topping={topping}
                      status={slot.status}
                      droppedFraction={slot.fraction}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Celebration banner */}
        <AnimatePresence>
          {celebrating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "tween", duration: 0.3 }}
              className="mx-4 mb-3 py-2.5 rounded-xl bg-green-500 text-white text-center font-extrabold text-base shadow-md"
            >
              {order.variant === "cookie" ? "Yummy! 🍪" : "Order Up! 🍕"}
            </motion.div>
          )}
        </AnimatePresence>

        {/* All done */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mx-4 mb-3 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center font-extrabold text-base shadow-md"
            >
              🏆 Pizza Master! 🏆
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
