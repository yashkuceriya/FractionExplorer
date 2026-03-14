"use client";

import { motion } from "framer-motion";
import TutorAvatar from "./TutorAvatar";

interface MessageBubbleProps {
  role: string;
  content: string;
  characterId?: string;
}

/** Render fraction references like "1/2" as styled inline chips */
function renderContent(text: string, isAssistant: boolean) {
  const cleaned = text.replace(/\[(\d+\/\d+)\]/g, "$1");
  const parts = cleaned.split(/(\b\d+\/\d+\b)/g);

  return parts.map((part, i) => {
    if (/^\d+\/\d+$/.test(part)) {
      return (
        <span
          key={i}
          className={`inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 rounded-md text-xs font-black tabular-nums ${
            isAssistant
              ? "bg-orange-100 text-orange-800 border border-orange-200/80"
              : "bg-white/25 text-white"
          }`}
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function MessageBubble({ role, content, characterId }: MessageBubbleProps) {
  const isAssistant = role === "assistant";

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"} mb-4`}>
      {isAssistant && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="shrink-0 mr-2 mt-auto"
        >
          <TutorAvatar size={32} characterId={characterId} animate={false} />
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className={`max-w-[85%] px-4 py-3 rounded-3xl text-sm leading-relaxed shadow-sm relative ${
          isAssistant
            ? "bg-white text-gray-800 border-2 border-amber-100/80 rounded-bl-none"
            : "bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-br-none shadow-md"
        }`}
      >
        {/* Little tail for the speech bubble */}
        {isAssistant ? (
          <div className="absolute bottom-0 -left-2 w-4 h-4 bg-white border-l-2 border-b-2 border-amber-100/80 -rotate-45" style={{ marginBottom: '-1px' }} />
        ) : (
          <div className="absolute bottom-0 -right-2 w-4 h-4 bg-teal-600 -rotate-45" style={{ marginBottom: '-1px' }} />
        )}
        <div className="relative z-10 font-medium">
          {renderContent(content, isAssistant)}
        </div>
      </motion.div>
    </div>
  );
}
