"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { FractionDrop } from "./FractionBattle";
import { motion, AnimatePresence } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { playFloorComplete, playError as playReject } from "@/lib/sounds";

/* ------------------------------------------------------------------ */
/*  Fraction math helpers                                              */
/* ------------------------------------------------------------------ */

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function simplify(n: number, d: number): [number, number] {
  const g = gcd(Math.abs(n), Math.abs(d));
  return [n / g, d / g];
}

function addFractions(
  aN: number,
  aD: number,
  bN: number,
  bD: number
): [number, number] {
  const num = aN * bD + bN * aD;
  const den = aD * bD;
  return simplify(num, den);
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StackedBlock {
  numerator: number;
  denominator: number;
  color: string;
}

interface TowerChallengeProps {
  onComplete?: (floorsBuilt: number) => void;
  pendingDrop?: FractionDrop | null;
  onXP?: (amount: number, label: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TOWER_HEIGHT = 320; // px – the vertical build area
const SETTLE_SPRING = { type: "spring" as const, stiffness: 500, damping: 22 };

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TowerChallenge({ onComplete, pendingDrop, onXP }: TowerChallengeProps) {
  const [blocks, setBlocks] = useState<StackedBlock[]>([]);
  const [floors, setFloors] = useState(0);
  const [rejected, setRejected] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [completedFloors, setCompletedFloors] = useState<number>(0);

  // Droppable setup
  const { isOver, setNodeRef } = useDroppable({ id: "tower-drop" });

  /* ---------- derived fraction total ---------- */
  const totalFraction = blocks.reduce<[number, number]>(
    (acc, b) => addFractions(acc[0], acc[1], b.numerator, b.denominator),
    [0, 1]
  );
  const [totalNum, totalDen] = totalFraction;
  const totalValue = totalNum / totalDen;
  const progressPercent = Math.min(totalValue * 100, 100);

  /* ---------- add a block (called externally via state / context) -- */
  const addBlock = useCallback(
    (block: StackedBlock) => {
      if (celebrating) return;

      const [newNum, newDen] = addFractions(
        totalNum,
        totalDen,
        block.numerator,
        block.denominator
      );
      const newValue = newNum / newDen;

      if (newValue > 1) {
        // Reject – flash and bounce off
        setRejected(true);
        playReject();
        setTimeout(() => setRejected(false), 1200);
        return;
      }

      const nextBlocks = [...blocks, block];
      setBlocks(nextBlocks);

      if (newValue === 1) {
        // Floor complete!
        setCelebrating(true);
        playFloorComplete();
        onXP?.(3, "Tower floor!");
        const nextFloors = floors + 1;
        setTimeout(() => {
          setFloors(nextFloors);
          setCompletedFloors((c) => c + 1);
          setBlocks([]);
          setCelebrating(false);
          onComplete?.(nextFloors);
        }, 1500);
      }
    },
    [blocks, totalNum, totalDen, floors, celebrating, onComplete]
  );

  // React to drops forwarded from parent workspace
  const lastSeq = useRef(-1);
  useEffect(() => {
    if (pendingDrop && pendingDrop._seq !== lastSeq.current) {
      lastSeq.current = pendingDrop._seq;
      addBlock({ numerator: pendingDrop.numerator, denominator: pendingDrop.denominator, color: pendingDrop.color });
    }
  }, [pendingDrop, addBlock]);

  /* ---------- clear tower ---------- */
  const clearTower = useCallback(() => {
    if (celebrating) return;
    setBlocks([]);
  }, [celebrating]);

  /* ---------- expose addBlock on the droppable data ---------- */
  // The parent workspace reads this from the droppable event's `over` data.
  // We attach it via a data attribute pattern consistent with @dnd-kit.
  // In practice the parent calls addBlock via context; here we ensure
  // the ref is wired up for hover detection.

  return (
    <div className="flex gap-3 select-none">
      {/* ---------- progress bar (left side) ---------- */}
      <div className="flex flex-col items-center justify-end w-8 pb-10 pt-4">
        <span className="text-[10px] font-bold text-sky-700 mb-1">1</span>
        <div className="relative w-3 flex-1 rounded-full bg-gray-200 overflow-hidden">
          <motion.div
            className="absolute bottom-0 left-0 w-full rounded-full bg-gradient-to-t from-emerald-500 to-emerald-300"
            animate={{ height: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          />
        </div>
        <span className="text-[10px] font-bold text-gray-400 mt-1">0</span>
      </div>

      {/* ---------- tower area ---------- */}
      <div className="flex flex-col items-center">
        {/* Floor counter */}
        <div className="mb-2 flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-500">Floors</span>
          <motion.span
            key={floors}
            initial={{ scale: 1.6, color: "#f59e0b" }}
            animate={{ scale: 1, color: "#374151" }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="text-lg font-black tabular-nums"
          >
            {floors}
          </motion.span>
        </div>

        {/* Main tower container */}
        <motion.div
          ref={setNodeRef}
          data-add-block={addBlock}
          animate={{
            boxShadow: isOver
              ? "0 0 0 3px rgba(99,102,241,0.45)"
              : "0 0 0 0px rgba(99,102,241,0)",
          }}
          transition={{ duration: 0.2 }}
          className="relative rounded-2xl overflow-hidden border-2 border-gray-200"
          style={{
            width: 200,
            height: TOWER_HEIGHT + 48, // extra for foundation
            background: "linear-gradient(to bottom, #e0f2fe, #f0f9ff, #ffffff)",
          }}
        >
          {/* ---------- Goal line at 1.0 ---------- */}
          <div
            className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
            style={{ bottom: 40 + TOWER_HEIGHT }}
          >
            <div className="flex-1 border-t-2 border-dashed border-amber-400" />
            <span className="px-1.5 text-[9px] font-bold text-amber-600 bg-amber-50 rounded">
              Goal: 1 whole
            </span>
          </div>

          {/* ---------- Stacked blocks ---------- */}
          <div
            className="absolute left-0 right-0 flex flex-col-reverse items-stretch"
            style={{ bottom: 40 }} // above foundation
          >
            <AnimatePresence>
              {blocks.map((block, i) => {
                const fractionValue = block.numerator / block.denominator;
                const blockHeight = Math.max(24, fractionValue * TOWER_HEIGHT);
                return (
                  <motion.div
                    key={`${i}-${block.numerator}-${block.denominator}`}
                    initial={{ y: -120, scaleY: 0.6, scaleX: 1.1, opacity: 0 }}
                    animate={
                      celebrating
                        ? {
                            y: 0,
                            scaleY: 1,
                            scaleX: 1,
                            opacity: 1,
                            filter: [
                              "brightness(1)",
                              "brightness(1.4)",
                              "brightness(1)",
                              "brightness(1.3)",
                              "brightness(1)",
                            ],
                          }
                        : {
                            y: [null, -4, 3, -1, 0],
                            scaleY: [null, 0.85, 1.08, 0.97, 1],
                            scaleX: [null, 1.12, 0.94, 1.02, 1],
                            opacity: 1,
                          }
                    }
                    exit={{ scaleY: 0, opacity: 0, y: 20 }}
                    transition={
                      celebrating
                        ? {
                            filter: {
                              type: "tween",
                              duration: 1.2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            },
                          }
                        : {
                            y: { type: "tween", duration: 0.45, ease: "easeOut" },
                            scaleY: { type: "tween", duration: 0.45, ease: "easeOut" },
                            scaleX: { type: "tween", duration: 0.45, ease: "easeOut" },
                            opacity: { type: "tween", duration: 0.15 },
                          }
                    }
                    className="relative mx-2 rounded-md flex items-center justify-center font-bold text-white text-sm shadow-md"
                    style={{
                      height: blockHeight,
                      backgroundColor: block.color,
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                    }}
                  >
                    {/* Block label */}
                    <span className="drop-shadow">
                      {block.numerator}/{block.denominator}
                    </span>
                    {/* Shine overlay */}
                    <div
                      className="absolute inset-0 rounded-md pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
                      }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* ---------- Running total ---------- */}
          {blocks.length > 0 && !celebrating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur rounded-lg px-3 py-1 shadow-sm border border-gray-200 z-20"
            >
              <span className="text-xs text-gray-500 mr-1">Total:</span>
              <span className="text-base font-black text-indigo-600 tabular-nums">
                {totalNum}/{totalDen}
              </span>
            </motion.div>
          )}

          {/* ---------- Rejection flash ---------- */}
          <AnimatePresence>
            {rejected && (
              <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "tween", duration: 0.3 }}
                className="absolute inset-0 z-30 flex items-center justify-center"
              >
                <div className="bg-red-500/90 text-white font-black text-lg px-5 py-2 rounded-xl shadow-lg">
                  Too much!
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---------- Celebration banner ---------- */}
          <AnimatePresence>
            {celebrating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
                animate={{ opacity: 1, scale: [0.5, 1.1, 1], rotate: [-5, 3, 0] }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  scale: { type: "tween", duration: 0.5, ease: "easeOut" },
                  rotate: { type: "tween", duration: 0.5, ease: "easeOut" },
                }}
                className="absolute inset-0 z-30 flex items-center justify-center"
              >
                <div className="bg-gradient-to-r from-amber-400 to-yellow-300 text-gray-900 font-black text-base px-5 py-3 rounded-2xl shadow-xl border-2 border-amber-500 text-center leading-tight">
                  <span className="text-2xl block mb-0.5">🏗️</span>
                  Floor Complete!
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---------- Completed mini floors ---------- */}
          {completedFloors > 0 && (
            <div
              className="absolute left-2 right-2 flex flex-col-reverse gap-px"
              style={{ bottom: 40 - completedFloors * 8 - 4 }}
            >
              {Array.from({ length: completedFloors }).map((_, i) => (
                <motion.div
                  key={`floor-${i}`}
                  initial={{ scaleY: 4, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 0.5 }}
                  transition={{ type: "tween", duration: 0.6 }}
                  className="h-1.5 rounded-sm bg-gradient-to-r from-amber-300 to-yellow-200 border border-amber-400/30"
                />
              ))}
            </div>
          )}

          {/* ---------- Foundation ---------- */}
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-400 to-gray-300 flex items-center justify-center rounded-b-xl">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-sm bg-gray-500/40 border border-gray-500/20"
                />
              ))}
            </div>
          </div>

          {/* ---------- Hover invite ---------- */}
          {blocks.length === 0 && !celebrating && (
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ type: "tween", duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            >
              <p className="text-sm font-semibold text-sky-400 text-center px-4 leading-snug">
                Drag fraction blocks here to start building!
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* ---------- Clear button ---------- */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearTower}
          disabled={blocks.length === 0 || celebrating}
          className="mt-3 px-4 py-1.5 text-xs font-bold rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 border border-gray-200 hover:border-red-200 transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          Clear Tower
        </motion.button>
      </div>
    </div>
  );
}
