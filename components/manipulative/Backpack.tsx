"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BackpackTool {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

const TOOLS: BackpackTool[] = [
  { id: "split", name: "Split Hammer", emoji: "🔨", description: "Break a fraction into pieces!", color: "from-orange-400 to-red-400" },
  { id: "merge", name: "Merge Glue", emoji: "🧩", description: "Stick fractions together!", color: "from-emerald-400 to-teal-500" },
  { id: "build", name: "Builder", emoji: "🔧", description: "Build any fraction you want!", color: "from-blue-400 to-indigo-500" },
  { id: "random", name: "Surprise!", emoji: "🎲", description: "Get a random fraction!", color: "from-purple-400 to-pink-500" },
];

interface BackpackProps {
  onSelectTool: (toolId: string) => void;
  disabled?: boolean;
}

export default function Backpack({ onSelectTool, disabled }: BackpackProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Backpack button — always visible */}
      <button
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className="px-2.5 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10px] font-black rounded-full shadow-sm active:scale-95 transition-transform disabled:opacity-50"
      >
        🎒 Backpack!
      </button>

      {/* Backpack overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ scale: 0.3, y: 100, rotate: -15 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.3, y: 100, rotate: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative bg-gradient-to-b from-purple-500 via-indigo-500 to-purple-600 rounded-3xl p-1.5 shadow-2xl max-w-xs w-[85vw] border-4 border-purple-300/50"
            >
              <div className="bg-white rounded-2xl p-4 pb-5">
                {/* Backpack header */}
                <div className="text-center mb-3">
                  <p className="text-3xl mb-1">🎒</p>
                  <h3 className="text-lg font-black text-purple-800">Backpack!</h3>
                  <p className="text-[10px] font-bold text-purple-400">Pick a tool!</p>
                </div>

                {/* Tools grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {TOOLS.map((tool, i) => (
                    <motion.button
                      key={tool.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 + 0.15 }}
                      onClick={() => {
                        onSelectTool(tool.id);
                        setOpen(false);
                      }}
                      className={`bg-gradient-to-br ${tool.color} rounded-2xl p-3 text-center active:scale-95 transition-transform shadow-md`}
                    >
                      <p className="text-2xl mb-1">{tool.emoji}</p>
                      <p className="text-xs font-black text-white drop-shadow-sm">{tool.name}</p>
                      <p className="text-[9px] font-semibold text-white/80 mt-0.5">{tool.description}</p>
                    </motion.button>
                  ))}
                </div>

                {/* Close */}
                <button
                  onClick={() => setOpen(false)}
                  className="mt-3 w-full py-2 text-sm font-bold text-purple-400 active:text-purple-600"
                >
                  Close Backpack
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
