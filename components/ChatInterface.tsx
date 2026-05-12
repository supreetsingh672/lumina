"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, StopCircle } from "lucide-react";
import { streamChat, type ChatMessage } from "@/lib/api";
import { useStore } from "@/lib/store";

const SUGGESTIONS = [
  "What's the main argument?",
  "Summarize in one sentence",
  "What are the key takeaways?",
  "What examples were used?",
  "What should I do next?",
];

export default function ChatInterface() {
  const {
    videoUrl,
    chatMessages,
    isStreaming,
    addChatMessage,
    appendToLastAssistantMessage,
    setStreaming,
  } = useStore();

  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const send = (text: string) => {
    if (!text.trim() || isStreaming) return;
    setInput("");

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    addChatMessage(userMsg);
    addChatMessage({ role: "assistant", content: "" });
    setStreaming(true);

    const allMessages = [...chatMessages, userMsg];

    abortRef.current = streamChat(
      videoUrl,
      allMessages,
      (chunk) => appendToLastAssistantMessage(chunk),
      () => setStreaming(false),
      () => setStreaming(false)
    );
  };

  const stop = () => {
    abortRef.current?.();
    setStreaming(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-1 py-2 flex flex-col gap-4 min-h-0">
        {chatMessages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full gap-4 text-center py-8"
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-slate-300 font-medium mb-1">Ask anything about this video</p>
              <p className="text-slate-500 text-sm">I&apos;ve read the full transcript</p>
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {chatMessages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "chat-user text-white"
                    : "chat-ai text-slate-200"
                }`}
              >
                {msg.content || (
                  <span className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {chatMessages.length === 0 && (
        <div className="flex flex-wrap gap-2 px-1 py-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs px-3 py-1.5 rounded-full glass border border-white/10 text-slate-300 hover:text-white hover:border-violet-500/40 hover:bg-violet-500/10 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="pt-3 border-t border-white/[0.06]">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about this video..."
            rows={1}
            className="flex-1 lumina-input rounded-xl px-4 py-3 text-sm resize-none min-h-[44px] max-h-[120px]"
            style={{ height: "auto" }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={isStreaming ? stop : () => send(input)}
            disabled={!isStreaming && !input.trim()}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              isStreaming
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                : "bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-30 disabled:cursor-not-allowed glow-violet"
            }`}
          >
            {isStreaming ? <StopCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
