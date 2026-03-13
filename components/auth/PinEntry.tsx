"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface PinEntryProps {
  onSubmit: (pin: string) => void;
  error?: string;
  studentName: string;
}

export default function PinEntry({ onSubmit, error, studentName }: PinEntryProps) {
  const [pin, setPin] = useState("");

  function handleDigit(d: string) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      onSubmit(next);
      setTimeout(() => setPin(""), 500);
    }
  }

  function handleBackspace() {
    setPin((p) => p.slice(0, -1));
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-lg font-bold text-purple-800">
        Enter PIN for {studentName}
      </p>

      {/* PIN dots */}
      <div className="flex gap-4">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={pin.length > i ? { scale: [1, 1.3, 1] } : {}}
            className={`w-5 h-5 rounded-full border-2 transition-colors ${
              pin.length > i
                ? "bg-pink-500 border-pink-600"
                : "bg-white border-pink-300"
            }`}
          />
        ))}
      </div>

      {error && (
        <motion.p
          initial={{ x: -10 }}
          animate={{ x: [10, -10, 5, -5, 0] }}
          className="text-red-500 text-sm font-bold"
        >
          {error}
        </motion.p>
      )}

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-3 w-fit">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="w-[72px] h-[72px] rounded-2xl bg-white border-2 border-pink-200 text-2xl font-black text-purple-800 active:scale-90 active:bg-amber-50 transition-transform shadow-sm"
          >
            {d}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit("0")}
          className="w-[72px] h-[72px] rounded-2xl bg-white border-2 border-pink-200 text-2xl font-black text-purple-800 active:scale-90 active:bg-amber-50 transition-transform shadow-sm"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="w-[72px] h-[72px] rounded-2xl bg-amber-50 border-2 border-pink-200 text-xl font-black text-pink-600 active:scale-90 transition-transform shadow-sm"
        >
          ←
        </button>
      </div>
    </div>
  );
}
