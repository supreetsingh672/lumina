"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, List, Clock, GitMerge, Video } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";

const MODES = [
  { id: "watch", icon: Sparkles, label: "Summary + Chat", description: "Instant summary, key points, and smart Q&A", color: "violet" },
  { id: "playlist", icon: List, label: "Playlist Analyzer", description: "Turn any playlist into a structured course", color: "indigo" },
  { id: "watch?tab=timestamps", icon: Clock, label: "Find Timestamps", description: "Semantic search — find anything by topic", color: "cyan" },
  { id: "synthesize", icon: GitMerge, label: "Cross-Video Synthesis", description: "Compare and contrast multiple videos at once", color: "emerald" },
] as const;

const PLACEHOLDERS = [
  "Paste a YouTube URL...",
  "Or a full playlist URL...",
  "Or try a short: youtu.be/...",
];

const MODE_COLORS: Record<string, string> = {
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 hover:border-violet-400/50",
  indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400/50",
  cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400/50",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400/50",
};

const MODE_ACTIVE: Record<string, string> = {
  violet: "border-violet-400/60 bg-violet-500/20 text-violet-200 glow-violet",
  indigo: "border-indigo-400/60 bg-indigo-500/20 text-indigo-200 glow-indigo",
  cyan: "border-cyan-400/60 bg-cyan-500/20 text-cyan-200 glow-cyan",
  emerald: "border-emerald-400/60 bg-emerald-500/20 text-emerald-200",
};

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [selectedMode, setSelectedMode] = useState<string>("watch");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
        setPlaceholderVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const isPlaylistUrl = (u: string) =>
    /[?&]list=/.test(u) && !(/[?&]v=/.test(u));

  const submit = () => {
    if (!url.trim()) { inputRef.current?.focus(); return; }
    const trimmed = url.trim();
    const encoded = encodeURIComponent(trimmed);

    // Auto-detect playlist URLs regardless of selected mode
    if (isPlaylistUrl(trimmed) || selectedMode === "playlist") {
      router.push(`/playlist?url=${encoded}`);
    } else if (selectedMode === "synthesize") {
      router.push(`/synthesize`);
    } else if (selectedMode === "watch?tab=timestamps") {
      router.push(`/watch?url=${encoded}&tab=timestamps`);
    } else {
      router.push(`/watch?url=${encoded}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-mesh overflow-hidden flex flex-col">
      <ParticleBackground />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text-static tracking-tight">Lumina</span>
        </div>
        <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-white/10 text-xs text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Powered by Groq · Llama 3.3 70B · Free
        </span>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-20 pt-4">
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-9">

          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-violet-500/20 text-sm text-violet-300">
              <Video className="w-4 h-4" />
              YouTube Intelligence Platform
            </div>
          </motion.div>

          <div className="text-center space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05]"
            >
              <span className="text-slate-100">YouTube,{" "}</span>
              <span className="gradient-text">Decoded.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed"
            >
              Instant summaries, smart chat, semantic search, and cross-video synthesis —{" "}
              <span className="text-slate-300">one URL away.</span>
            </motion.p>
          </div>

          {/* Mode pills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full"
          >
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = selectedMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMode(m.id)}
                  className={`relative flex flex-col items-start gap-1.5 px-4 py-3.5 rounded-2xl border transition-all text-left ${
                    active ? MODE_ACTIVE[m.color] : MODE_COLORS[m.color]
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-semibold leading-tight">{m.label}</span>
                  <span className="text-xs opacity-60 leading-tight hidden sm:block">{m.description}</span>
                  {active && (
                    <motion.div
                      layoutId="mode-indicator"
                      className="absolute inset-0 rounded-2xl ring-1 ring-current opacity-40"
                    />
                  )}
                </button>
              );
            })}
          </motion.div>

          {/* URL input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="w-full animated-border rounded-2xl"
          >
            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-[#080b14]">
              <Video className="w-5 h-5 text-slate-500 shrink-0" />
              <div className="flex-1 relative h-7 overflow-hidden">
                {!url && (
                  <AnimatePresence mode="wait">
                    {placeholderVisible && (
                      <motion.span
                        key={placeholderIdx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 text-slate-500 text-base pointer-events-none flex items-center"
                      >
                        {PLACEHOLDERS[placeholderIdx]}
                      </motion.span>
                    )}
                  </AnimatePresence>
                )}
                <input
                  ref={inputRef}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  className="w-full h-full bg-transparent text-slate-100 text-base outline-none caret-violet-400"
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              <button
                onClick={submit}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all glow-violet shrink-0"
              >
                Go <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Feature strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500"
          >
            {["No account needed", "Zero running costs", "BM25 semantic search", "Streaming AI responses"].map((s, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                {s}
              </span>
            ))}
          </motion.div>
        </div>
      </main>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#080b14] to-transparent pointer-events-none" />
    </div>
  );
}
