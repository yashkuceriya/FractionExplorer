"use client";

import { useRef, useEffect } from "react";
import type { Message } from "ai";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";
import TutorAvatar from "./TutorAvatar";

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (message: string) => void;
  quickReplies?: string[];
  isSpeaking?: boolean;
  characterId?: string;
  characterName?: string;
}

export default function ChatPanel({
  messages,
  isLoading,
  onSend,
  quickReplies,
  isSpeaking,
  characterId,
  characterName,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-amber-50/50 to-white/30">
      {/* Character header — like Dora talking to camera */}
      <div className="px-3 py-2 bg-gradient-to-r from-orange-100/80 to-amber-50/80 border-b border-amber-200/60 flex items-center gap-2.5">
        <div className="relative">
          <TutorAvatar size={44} animate={isSpeaking} characterId={characterId} />
          {isSpeaking && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black text-amber-900">{characterName || "Frax"}</h2>
          <p className="text-[10px] font-bold text-amber-500">
            {isSpeaking ? "Talking to you!" : "Your Adventure Buddy"}
          </p>
        </div>
        {isSpeaking && (
          <div className="flex gap-0.5 items-end h-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 bg-orange-400 rounded-full"
                style={{
                  animation: `soundbar 0.6s ease-in-out ${i * 0.15}s infinite alternate`,
                  height: "40%",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll p-3" aria-live="polite" aria-label="Chat messages">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-60">
            <p className="text-2xl mb-1">👋</p>
            <p className="text-xs font-bold text-amber-600">Say hi to start your adventure!</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} characterId={characterId} />
        ))}
        {isLoading && <TypingIndicator />}
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} disabled={isLoading} quickReplies={quickReplies} />
    </div>
  );
}
