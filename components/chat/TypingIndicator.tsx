"use client";

import { motion } from "framer-motion";
import TutorAvatar from "./TutorAvatar";

export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <TutorAvatar size={32} animate className="mr-2 mt-1" />
      <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-md shadow-sm border border-gray-100 flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-gray-300 rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  );
}
