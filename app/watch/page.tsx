"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageSquare, Clock, Lightbulb, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { fetchSummary, type SummaryResponse } from "@/lib/api";
import { useStore } from "@/lib/store";
import VideoPanel from "@/components/VideoPanel";
import ChatInterface from "@/components/ChatInterface";
import TimestampSearch from "@/components/TimestampSearch";
import { toast } from "sonner";

type Tab = "summary" | "chat" | "timestamps" | "insights";

const TABS: { id: Tab; icon: typeof Sparkles; label: string }[] = [
  { id: "summary", icon: Sparkles, label: "Summary" },
  { id: "chat", icon: MessageSquare, label: "Chat" },
  { id: "timestamps", icon: Clock, label: "Timestamps" },
  { id: "insights", icon: Lightbulb, label: "Insights" },
];

const STATUS_MESSAGES = [
  "Fetching transcript...",
  "Reading the video...",
  "Identifying key themes...",
  "Generating summary...",
  "Almost there...",
];

function WatchContent() {
  const params = useSearchParams();
  const router = useRouter();
  const rawUrl = params.get("url") ?? "";
  const initialTab = (params.get("tab") as Tab) ?? "summary";

  const { summary, isLoadingSummary, summaryError, setVideoUrl, setSummary, setLoadingSummary, setSummaryError } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [statusIdx, setStatusIdx] = useState(0);
  const statusRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!rawUrl) return;
    const url = decodeURIComponent(rawUrl);
    setVideoUrl(url);

    if (summary?.url === url) return;

    setSummary(null);
    setSummaryError(null);
    setLoadingSummary(true);
    setStatusIdx(0);

    statusRef.current = setInterval(() => {
      setStatusIdx((i) => Math.min(i + 1, STATUS_MESSAGES.length - 1));
    }, 2000);

    fetchSummary(url)
      .then((data) => setSummary(data))
      .catch((e) => { setSummaryError(e.message); toast.error(e.message); })
      .finally(() => {
        setLoadingSummary(false);
        if (statusRef.current) clearInterval(statusRef.current);
      });

    return () => { if (statusRef.current) clearInterval(statusRef.current); };
  }, [rawUrl]);

  if (!rawUrl) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <p className="text-slate-400">No URL provided.</p>
        <button onClick={() => router.push("/")} className="text-violet-400 hover:text-violet-300 transition-colors text-sm">
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b14] flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.06] glass sticky top-0 z-20">
        <button onClick={() => router.push("/")} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="font-bold gradient-text-static text-sm">Lumina</span>
        </div>
        {summary && (
          <p className="text-slate-500 text-sm truncate flex-1 hidden md:block">
            {summary.title}
          </p>
        )}
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {isLoadingSummary ? (
          <LoadingState statusMsg={STATUS_MESSAGES[statusIdx]} />
        ) : summaryError ? (
          <ErrorState error={summaryError} onBack={() => router.push("/")} />
        ) : summary ? (
          <SplitLayout summary={summary} activeTab={activeTab} setActiveTab={setActiveTab} />
        ) : null}
      </div>
    </div>
  );
}

function LoadingState({ statusMsg }: { statusMsg: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
      {/* Skeleton */}
      <div className="w-full max-w-5xl flex gap-6">
        <div className="w-2/5 flex flex-col gap-4">
          <div className="skeleton rounded-2xl aspect-video" />
          <div className="skeleton rounded-2xl h-36" />
        </div>
        <div className="w-3/5 flex flex-col gap-4">
          <div className="skeleton rounded-xl h-12" />
          <div className="skeleton rounded-2xl h-48" />
          <div className="skeleton rounded-2xl h-32" />
        </div>
      </div>
      {/* Status */}
      <AnimatePresence mode="wait">
        <motion.div
          key={statusMsg}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="flex items-center gap-2 text-sm text-slate-400"
        >
          <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
          {statusMsg}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ErrorState({ error, onBack }: { error: string; onBack: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertCircle className="w-5 h-5 text-red-400" />
      </div>
      <div>
        <p className="text-slate-200 font-medium mb-1">Could not process video</p>
        <p className="text-slate-500 text-sm max-w-md">{error}</p>
      </div>
      <button onClick={onBack} className="text-violet-400 hover:text-violet-300 transition-colors text-sm mt-2">
        ← Try another URL
      </button>
    </div>
  );
}

function SplitLayout({ summary, activeTab, setActiveTab }: {
  summary: SummaryResponse;
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
}) {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left panel */}
      <div className="hidden md:flex w-[38%] lg:w-[35%] border-r border-white/[0.06] p-5 overflow-y-auto">
        <VideoPanel summary={summary} />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-white/[0.06] px-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors ${
                  active ? "tab-active text-violet-300" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === "summary" && <SummaryTab summary={summary} />}
              {activeTab === "chat" && (
                <div className="h-full p-4">
                  <ChatInterface />
                </div>
              )}
              {activeTab === "timestamps" && (
                <div className="h-full p-4">
                  <TimestampSearch />
                </div>
              )}
              {activeTab === "insights" && <InsightsTab summary={summary} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SummaryTab({ summary }: { summary: SummaryResponse }) {
  return (
    <div className="h-full overflow-y-auto p-5 flex flex-col gap-5">
      {/* TL;DR */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 border-l-2 border-violet-500"
      >
        <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-2">TL;DR</p>
        <p className="text-slate-100 text-base leading-relaxed font-medium">{summary.tldr}</p>
      </motion.div>

      {/* Key points */}
      {summary.key_points?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5"
        >
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Key Points</p>
          <ul className="flex flex-col gap-3 stagger">
            {summary.key_points.map((kp, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="flex items-start gap-3 text-sm text-slate-200 animate-fade-up"
              >
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                <span className="leading-relaxed">{kp}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Mobile: video info */}
      <div className="md:hidden">
        <VideoPanel summary={summary} />
      </div>
    </div>
  );
}

function InsightsTab({ summary }: { summary: SummaryResponse }) {
  return (
    <div className="h-full overflow-y-auto p-5 flex flex-col gap-5">
      {summary.what_you_learn?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-4">What You&apos;ll Learn</p>
          <div className="flex flex-wrap gap-2">
            {summary.what_you_learn.map((item, i) => (
              <span key={i} className="text-sm px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {summary.topics?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-5">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-4">Topics Covered</p>
          <div className="flex flex-wrap gap-2">
            {summary.topics.map((t, i) => (
              <span key={i} className="text-sm px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {t}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-2xl p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Content Density</p>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-1000"
              style={{ width: summary.density_score === "Dense" ? "90%" : summary.density_score === "Moderate" ? "60%" : "30%" }}
            />
          </div>
          <span className="text-sm font-semibold text-slate-200 shrink-0">{summary.density_score}</span>
        </div>
        <p className="text-slate-400 text-sm mt-2">{summary.density_label}</p>
      </motion.div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080b14] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    }>
      <WatchContent />
    </Suspense>
  );
}
