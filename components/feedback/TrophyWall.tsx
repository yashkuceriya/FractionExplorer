"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FractionBar from "@/components/manipulative/FractionBar";
import type { Trophy } from "@/lib/trophy";

function parseFraction(s: string) {
  const [n, d] = s.split("/").map(Number);
  return { numerator: n, denominator: d };
}

interface TrophyWallProps {
  trophies: Trophy[];
}

export default function TrophyWall({ trophies }: TrophyWallProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="relative text-sm px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-600 hover:from-amber-100 hover:to-yellow-100 transition-colors font-semibold border border-amber-200/60 min-h-[36px] flex items-center gap-1"
      >
        <span>🏆</span>
        {trophies.length > 0 && (
          <span className="text-xs font-black text-amber-600">{trophies.length}</span>
        )}
        {trophies.length > 0 && (
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full"
          />
        )}
      </motion.button>

      {/* Slide-out panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-30 bg-black/20"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] z-40 bg-white shadow-2xl border-l border-gray-100 flex flex-col pr-[env(safe-area-inset-right)]"
            >
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">
                  Trophy Wall
                  {trophies.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-amber-500">
                      {trophies.length}/12 discoveries
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {trophies.length === 0 ? (
                  <div className="text-center text-gray-400 mt-12">
                    <p className="text-3xl mb-2">🏆</p>
                    <p className="text-sm">Find your first match!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trophies.map((t, i) => {
                      const left = parseFraction(t.left);
                      const right = parseFraction(t.right);
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100"
                        >
                          <FractionBar
                            numerator={left.numerator}
                            denominator={left.denominator}
                            color="#f59e0b"
                            width={60}
                            height={24}
                          />
                          <span className="text-sm font-bold text-amber-600">=</span>
                          <FractionBar
                            numerator={right.numerator}
                            denominator={right.denominator}
                            color="#f59e0b"
                            width={60}
                            height={24}
                          />
                          <span className="text-xs text-gray-400 ml-auto">
                            {t.left} = {t.right}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
