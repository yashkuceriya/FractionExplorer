"use client";

import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import FractionBar from "./FractionBar";
import type { FractionData } from "@/lib/fractions";

interface ComparisonZoneProps {
  side: "left" | "right";
  fraction: FractionData | null;
  onClear: () => void;
  onTapPlace?: () => void;
}

export default function ComparisonZone({
  side,
  fraction,
  onClear,
  onTapPlace,
}: ComparisonZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `comparison-${side}`,
  });

  return (
    <motion.div
      ref={setNodeRef}
      animate={{
        scale: isOver ? 1.06 : 1,
      }}
      transition={{ type: "tween", duration: 0.15 }}
      onClick={() => {
        if (!fraction && onTapPlace) {
          onTapPlace();
        }
      }}
      role={!fraction && onTapPlace ? "button" : undefined}
      tabIndex={!fraction && onTapPlace ? 0 : undefined}
      onKeyDown={(e) => {
        if (!fraction && onTapPlace && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onTapPlace();
        }
      }}
      aria-label={
        fraction
          ? `${side} comparison slot with ${fraction.numerator} over ${fraction.denominator}`
          : `${side} comparison slot`
      }
      className={`relative flex-1 rounded-2xl border-2 border-dashed p-2 flex flex-col items-center justify-center min-h-[80px] transition-colors ${
        isOver
          ? "bg-amber-100/80 border-amber-400 shadow-inner shadow-amber-200/40"
          : fraction
          ? "bg-white shadow-sm border-amber-200"
          : "bg-amber-50/30 border-amber-200/50"
      }`}
    >
      {fraction ? (
        <div className="flex flex-col items-center gap-1">
          <FractionBar
            numerator={fraction.numerator}
            denominator={fraction.denominator}
            color={fraction.color}
            width={120}
            height={36}
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear();
            }}
            className="text-[10px] text-gray-400 active:text-red-400 px-2 py-1 min-h-[36px] rounded-lg active:bg-red-50 font-medium"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-lg opacity-40">{side === "left" ? "👈" : "👉"}</span>
          <p className="text-[10px] font-bold text-amber-400">
            {onTapPlace ? "Tap!" : "Drop here!"}
          </p>
        </div>
      )}
    </motion.div>
  );
}
