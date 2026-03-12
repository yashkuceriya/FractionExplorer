"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Stats {
  totalCalls: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  model: string;
}

export default function UsageStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchStats = () => {
      fetch("/api/stats")
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {});
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded"
        title="API Usage"
      >
        {open ? "×" : "📊"}
      </button>

      <AnimatePresence>
        {open && stats && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            className="absolute right-0 top-8 w-56 bg-white rounded-xl shadow-lg border border-gray-100 p-3 z-50"
          >
            <h3 className="text-xs font-semibold text-gray-700 mb-2">Session Usage</h3>
            <div className="space-y-1.5 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Model</span>
                <span className="font-mono text-gray-700">
                  {stats.model ? stats.model.split("-").slice(0, 2).join("-") : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>API Calls</span>
                <span className="font-mono text-gray-700">{stats.totalCalls}</span>
              </div>
              <div className="flex justify-between">
                <span>Prompt Tokens</span>
                <span className="font-mono text-gray-700">
                  {stats.totalPromptTokens.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Completion Tokens</span>
                <span className="font-mono text-gray-700">
                  {stats.totalCompletionTokens.toLocaleString()}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-1.5 flex justify-between font-semibold">
                <span>Est. Cost</span>
                <span className="text-tutor">
                  ${stats.estimatedCost.toFixed(4)}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-gray-300 mt-2">
              {process.env.NEXT_PUBLIC_LANGSMITH_ENABLED === "true"
                ? "Traced via LangSmith"
                : "Local tracking only"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
