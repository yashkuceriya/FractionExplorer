"use client";

import { useState, type FormEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  quickReplies?: string[];
}

export default function ChatInput({ onSend, disabled, quickReplies }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="border-t border-amber-100/60 bg-white p-2.5">
      {quickReplies && quickReplies.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              onClick={() => !disabled && onSend(reply)}
              disabled={disabled}
              className="px-4 py-2.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200/60 active:bg-amber-100 disabled:opacity-50 transition-colors min-h-[44px]"
            >
              {reply}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 200))}
          maxLength={200}
          placeholder="Type here..."
          disabled={disabled}
          aria-label="Chat message"
          className="chat-input flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          aria-label="Send message"
          className="px-4 py-2.5 min-h-[44px] min-w-[44px] bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 active:opacity-80"
        >
          Send
        </button>
      </form>
    </div>
  );
}
