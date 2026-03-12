"use client";

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
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"} mb-2.5`}>
      {isAssistant && (
        <div className="shrink-0 mr-1.5 mt-1">
          <TutorAvatar size={26} characterId={characterId} animate={false} />
        </div>
      )}
      <div
        className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isAssistant
            ? "bg-white text-gray-800 shadow-sm border-2 border-amber-100/80 rounded-tl-md"
            : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-tr-md shadow-sm"
        }`}
      >
        {renderContent(content, isAssistant)}
      </div>
    </div>
  );
}
