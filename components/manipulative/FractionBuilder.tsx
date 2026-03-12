"use client";

import { useState, useRef } from "react";
import { getFractionColor, type FractionData } from "@/lib/fractions";

interface FractionBuilderProps {
  onBuild: (fraction: FractionData) => void;
}

export default function FractionBuilder({ onBuild }: FractionBuilderProps) {
  const [num, setNum] = useState("");
  const [den, setDen] = useState("");
  const [error, setError] = useState("");
  const denRef = useRef<HTMLInputElement>(null);

  const handleBuild = () => {
    const n = parseInt(num);
    const d = parseInt(den);

    if (isNaN(n) || isNaN(d)) {
      setError("Type numbers!");
      setTimeout(() => setError(""), 2000);
      return;
    }
    if (d === 0) {
      setError("Can't divide by 0!");
      setTimeout(() => setError(""), 2000);
      return;
    }
    if (n < 0 || d < 0) {
      setError("Positive numbers!");
      setTimeout(() => setError(""), 2000);
      return;
    }
    if (n > d) {
      setError("Top can't be bigger!");
      setTimeout(() => setError(""), 2000);
      return;
    }
    if (d > 12) {
      setError("Max 12 on bottom!");
      setTimeout(() => setError(""), 2000);
      return;
    }
    if (n === 0) {
      setError("Top can't be 0!");
      setTimeout(() => setError(""), 2000);
      return;
    }

    onBuild({
      numerator: n,
      denominator: d,
      color: getFractionColor(n, d),
    });
    setNum("");
    setDen("");
    setError("");
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-center gap-0.5">
        {/* Numerator box */}
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={12}
          value={num}
          onChange={(e) => {
            setNum(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault();
              denRef.current?.focus();
            }
          }}
          placeholder="?"
          className="chat-input w-10 h-10 text-center text-lg font-bold bg-white border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none text-amber-800 placeholder-amber-200"
        />

        {/* Fraction line */}
        <div className="w-10 h-0.5 bg-amber-400 rounded-full" />

        {/* Denominator box */}
        <input
          ref={denRef}
          type="number"
          inputMode="numeric"
          min={1}
          max={12}
          value={den}
          onChange={(e) => {
            setDen(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleBuild();
            }
          }}
          placeholder="?"
          className="chat-input w-10 h-10 text-center text-lg font-bold bg-white border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none text-amber-800 placeholder-amber-200"
        />
      </div>

      {/* Build button */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleBuild();
        }}
        className="h-10 px-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-transform"
      >
        Build!
      </button>

      {/* Error message */}
      {error && (
        <span className="text-[10px] text-red-500 font-semibold max-w-[80px] leading-tight">
          {error}
        </span>
      )}
    </div>
  );
}
