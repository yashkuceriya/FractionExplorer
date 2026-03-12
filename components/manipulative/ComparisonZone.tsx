"use client";

import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import FractionBar from "./FractionBar";
import type { FractionData } from "@/lib/fractions";

interface ComparisonZoneProps {
  side: "left" | "right";
  fraction: FractionData | null;
  onClear: () => void;
}

export default function ComparisonZone({
  side,
  fraction,
  onClear,
}: ComparisonZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `comparison-${side}`,
  });

  return (
    <motion.div
      ref={setNodeRef}
      animate={{
        scale: isOver ? 1.03 : 1,
      }}
      transition={{ type: "tween", duration: 0.15 }}
      className={`relative flex-1 rounded-2xl border-2 border-dashed p-3 flex flex-col items-center justify-center min-h-[110px] sm:min-h-[130px] transition-colors ${
        isOver
          ? "bg-amber-100/60 border-amber-400 shadow-inner"
          : fraction
          ? "bg-white shadow-sm border-amber-200"
          : "bg-gradient-to-b from-amber-50/40 to-orange-50/20 border-amber-200/50"
      }`}
    >
      {fraction ? (
        <div className="flex flex-col items-center gap-2">
          <FractionBar
            numerator={fraction.numerator}
            denominator={fraction.denominator}
            color={fraction.color}
            width={160}
            height={42}
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear();
            }}
            className="text-[10px] text-gray-300 active:text-red-400 transition-colors px-2 py-1 rounded-md active:bg-red-50 font-medium"
          >
            ✕ remove
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-amber-100/60 flex items-center justify-center text-xl">
            {side === "left" ? "👈" : "👉"}
          </div>
          <p className="text-[11px] font-bold text-amber-400">
            Drag here
          </p>
        </div>
      )}
    </motion.div>
  );
}
