"use client";

import { motion } from "framer-motion";

interface ParticleBurstProps {
  type: "smash" | "merge";
  emoji?: string;
}

const SMASH_PARTICLES = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2;
  const distance = 40 + Math.random() * 30;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    rotate: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.8,
    color: ["#f59e0b", "#ef4444", "#f97316", "#eab308", "#fb923c"][i % 5],
  };
});

const MERGE_PARTICLES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  const distance = 30 + Math.random() * 25;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    rotate: Math.random() * 180,
    scale: 0.4 + Math.random() * 0.6,
    color: ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#059669"][i % 5],
  };
});

export default function ParticleBurst({ type, emoji }: ParticleBurstProps) {
  const particles = type === "smash" ? SMASH_PARTICLES : MERGE_PARTICLES;
  const icon = emoji || (type === "smash" ? "💥" : "✨");

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
      {/* Center emoji pop */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute text-2xl"
      >
        {icon}
      </motion.div>

      {/* Flying particles */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: p.x,
            y: p.y,
            scale: p.scale,
            opacity: 0,
            rotate: p.rotate,
          }}
          transition={{ duration: 0.5 + Math.random() * 0.3, ease: "easeOut" }}
          className="absolute"
        >
          {type === "smash" ? (
            <div
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: p.color }}
            />
          ) : (
            <div className="text-xs" style={{ color: p.color }}>
              ✦
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
