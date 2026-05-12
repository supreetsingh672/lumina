"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, Loader2, Clock, BookOpen, Users, Layers } from "lucide-react";
import { streamPlaylist, type PlaylistVideo, type PlaylistOverview } from "@/lib/api";
import { toast } from "sonner";

const DIFF_COLORS: Record<string, string> = {
  Beginner: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Intermediate: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Advanced: "text-red-400 bg-red-400/10 border-red-400/20",
};

export default function PlaylistView({ initialUrl }: { initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [processingIndex, setProcessingIndex] = useState(-1);
  const [total, setTotal] = useState(0);
  const [overview, setOverview] = useState<PlaylistOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const analyze = () => {
    if (!url.trim()) return;
    setLoading(true);
    setDone(false);
    setVideos([]);
    setOverview(null);
    setProcessingIndex(0);

    streamPlaylist(
      url,
      (event) => {
        if (event.type === "progress") {
          setProcessingIndex(event.index ?? 0);
          setTotal(event.total ?? 0);
        } else if (event.type === "video_done" && event.video) {
          setVideos((p) => [...p, event.video!]);
          setProcessingIndex((event.index ?? 0) + 1);
        } else if (event.type === "overview" && event.overview) {
          setOverview(event.overview);
        } else if (event.type === "error") {
          toast.error(event.error ?? "Error processing playlist");
        }
      },
      () => { setLoading(false); setDone(true); },
      (e) => { setLoading(false); toast.error(e.message); }
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header + input */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold gradient-text-static">Playlist Analyzer</h2>
        <p className="text-slate-400 text-sm">Turn any YouTube playlist into a structured course outline with per-video summaries.</p>

        <div className="flex gap-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyze()}
            placeholder="Paste a YouTube playlist URL..."
            className="flex-1 lumina-input rounded-xl px-4 py-3 text-sm"
          />
          <button
            onClick={analyze}
            disabled={loading || !url.trim()}
            className="px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed glow-violet"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze"}
          </button>
        </div>
      </motion.div>

      {/* Progress log */}
      {(loading || videos.length > 0) && (
        <div className="glass rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-slate-300">Processing videos</p>
            <span className="text-xs text-slate-500">{videos.length}{total > 0 ? ` / ${total}` : ""} done</span>
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                animate={{ width: `${(videos.length / total) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          )}

          {/* Log items */}
          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
            {videos.map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300 truncate">{v.title}</span>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin shrink-0" />
                <span className="text-slate-500">Processing video {processingIndex + 1}{total > 0 ? ` of ${total}` : ""}...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overview card */}
      {overview && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
          <div className="glass-strong rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-100">{overview.topic}</h3>
                <p className="text-slate-400 text-sm mt-1">{overview.synthesis}</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border shrink-0 ${DIFF_COLORS[overview.difficulty] ?? DIFF_COLORS.Intermediate}`}>
                {overview.difficulty}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="glass rounded-xl p-3 flex items-start gap-2">
                <Layers className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Videos</p>
                  <p className="text-sm font-semibold text-slate-200">{videos.length} lessons</p>
                </div>
              </div>
              <div className="glass rounded-xl p-3 flex items-start gap-2">
                <Users className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Ideal for</p>
                  <p className="text-sm font-semibold text-slate-200 line-clamp-2">{overview.ideal_viewer}</p>
                </div>
              </div>
              <div className="glass rounded-xl p-3 flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Prerequisites</p>
                  <p className="text-sm font-semibold text-slate-200">{overview.prerequisites?.join(", ") || "None"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Course outline */}
          {overview.course_outline && (
            <div className="glass rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Course Outline</p>
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {overview.course_outline}
              </pre>
            </div>
          )}
        </motion.div>
      )}

      {/* Video cards */}
      {videos.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            {videos.length} Lesson{videos.length !== 1 ? "s" : ""}
          </p>
          {videos.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.5) }}
              className="glass rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedCard(expandedCard === i ? null : i)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-400 shrink-0">
                  {i + 1}
                </span>
                <img src={v.thumbnail} alt={v.title} className="w-16 h-10 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{v.title}</p>
                  <p className="text-xs text-slate-500">{v.channel}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${expandedCard === i ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {expandedCard === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-white/[0.06]"
                  >
                    <div className="p-4 flex flex-col gap-3">
                      <p className="text-sm text-slate-300 leading-relaxed">{v.summary}</p>
                      {v.key_points?.length > 0 && (
                        <ul className="flex flex-col gap-1.5">
                          {v.key_points.map((kp, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-slate-400">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-violet-400 shrink-0" />
                              {kp}
                            </li>
                          ))}
                        </ul>
                      )}
                      {v.topics?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {v.topics.map((t, j) => (
                            <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
