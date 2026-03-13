"use client";

import { useCallback } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import FractionBar from "./FractionBar";

interface FractionPieceProps {
  id: string;
  numerator: number;
  denominator: number;
  color: string;
  onSmash?: () => void;
  onMerge?: () => void;
  highlighted?: boolean;
  isMergeTarget?: boolean;
  mergePreview?: { numerator: number; denominator: number } | null;
  isEquivalentShimmer?: boolean;
}

export default function FractionPiece({
  id,
  numerator,
  denominator,
  color,
  onSmash,
  onMerge,
  highlighted,
  isMergeTarget,
  mergePreview,
  isEquivalentShimmer,
}: FractionPieceProps) {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } =
    useDraggable({ id, data: { numerator, denominator, color, blockId: id } });

  const { setNodeRef: setDropRef } = useDroppable({
    id: `merge-target-${id}`,
    data: { numerator, denominator, blockId: id },
  });

  const composedRef = useCallback(
    (node: HTMLElement | null) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef]
  );

  const scaledWidth = Math.min(
    160,
    Math.max(80, Math.round((denominator / 8) * 160))
  );

  const style = {
    transform: CSS.Translate.toString(transform),
    touchAction: "none" as const,
  };

  const canSmash = numerator > 1;

  return (
    <div className="relative flex flex-col items-center gap-1">
      {/* Drag handle — the fraction bar */}
      <motion.div
        ref={composedRef}
        style={style}
        {...listeners}
        {...attributes}
        role="button"
        aria-roledescription="draggable fraction"
        aria-label={`${numerator} over ${denominator}`}
        animate={{
          opacity: isDragging ? 0.3 : 1,
          scale: isDragging ? 0.85 : isMergeTarget ? 1.08 : 1,
          zIndex: isDragging ? 50 : 1,
        }}
        transition={{ type: "tween", duration: 0.15 }}
        className="relative"
      >
        {/* Glow effects */}
        {isEquivalentShimmer && !isDragging && (
          <div className="absolute -inset-2 rounded-xl bg-gradient-to-r from-amber-300/30 via-yellow-200/40 to-amber-300/30 blur-md -z-10 pointer-events-none animate-pulse" />
        )}
        {isMergeTarget && (
          <div className="absolute -inset-2 rounded-xl bg-emerald-400/40 blur-md -z-10 pointer-events-none animate-pulse" />
        )}
        {highlighted && (
          <div className="absolute -inset-2 rounded-xl ring-2 ring-blue-400 bg-blue-400/10 -z-10 pointer-events-none animate-pulse" />
        )}

        {/* Merge preview badge */}
        {isMergeTarget && mergePreview && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[9px] font-bold rounded-full shadow-sm whitespace-nowrap z-20 pointer-events-none">
            = {mergePreview.numerator}/{mergePreview.denominator}
          </div>
        )}

        <FractionBar
          numerator={numerator}
          denominator={denominator}
          color={color}
          width={scaledWidth}
          height={38}
          interactive
        />
      </motion.div>

      {/* Action buttons — OUTSIDE drag handle, use onPointerDown to bypass dnd-kit */}
      <div className="flex items-center gap-1.5" style={{ touchAction: "auto" }}>
        {canSmash && onSmash && (
          <button
            aria-label={`Split ${numerator} over ${denominator}`}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSmash();
            }}
            className="min-w-[44px] h-[44px] px-2 bg-gradient-to-br from-red-400 to-red-600 text-white text-[11px] font-bold rounded-full shadow-md flex items-center justify-center gap-0.5 active:scale-90 transition-transform border border-red-300/50"
          >
            💥 Split
          </button>
        )}

        {onMerge && !isDragging && (
          <button
            aria-label={`Merge ${numerator} over ${denominator}`}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMerge();
            }}
            className="min-w-[44px] h-[44px] px-2 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-[11px] font-bold rounded-full shadow-md flex items-center justify-center gap-0.5 active:scale-90 transition-transform border border-emerald-300/50"
          >
            + Merge
          </button>
        )}
      </div>
    </div>
  );
}
