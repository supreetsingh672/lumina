"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, ExternalLink, Loader2 } from "lucide-react";
import { fetchTimestamps, type TimestampResult } from "@/lib/api";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

const RELEVANCE_STYLES: Record<string, string> = {
  high: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/25",
  low: "text-slate-400 bg-slate-400/10 border-slate-400/25",
};

let debounceTimer: ReturnType<typeof setTimeout>;

export default function TimestampSearch() {
  const { videoUrl, summary } = useStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TimestampResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [modalSeconds, setModalSeconds] = useState<number | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || !videoUrl) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await fetchTimestamps(videoUrl, q);
      setResults(data.results);
    } catch (e) {
      toast.error("Search failed — check the video URL");
    } finally {
      setLoading(false);
    }
  }, [videoUrl]);

  const onInput = (val: string) => {
    setQuery(val);
    clearTimeout(debounceTimer);
    if (val.trim().length > 2) {
      debounceTimer = setTimeout(() => search(val), 500);
    } else {
      setResults([]);
      setSearched(false);
    }
  };

  const openAt = (seconds: number) => setModalSeconds(seconds);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={query}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search(query)}
          placeholder="What do you want to find in this video?"
          className="w-full lumina-input rounded-xl pl-10 pr-4 py-3 text-sm"
        />
        {loading && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 animate-spin" />
        )}
      </div>

      {/* Visual timeline */}
      {results.length > 0 && summary && (
        <div className="glass rounded-xl p-3">
          <p className="text-xs text-slate-500 mb-2">Match positions in video</p>
          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-cyan-500/20 rounded-full" />
            {results.map((r, i) => {
              const totalWords = summary.word_count ?? 1000;
              const pct = Math.min((r.seconds / (totalWords * 0.5)) * 100, 98);
              return (
                <button
                  key={i}
                  onClick={() => openAt(r.seconds)}
                  title={r.timestamp}
                  style={{ left: `${pct}%` }}
                  className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full -translate-x-1/2 transition-transform hover:scale-150 ${
                    r.relevance === "high" ? "bg-emerald-400" : r.relevance === "medium" ? "bg-amber-400" : "bg-slate-400"
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-0">
        {!searched && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Clock className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-slate-400 text-sm">Search for any topic, quote, or concept</p>
            <p className="text-slate-600 text-xs mt-1">e.g. "pricing strategy" or "main conclusion"</p>
          </div>
        )}

        {searched && !loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-slate-400 text-sm">No matches found</p>
            <p className="text-slate-600 text-xs mt-1">Try different keywords</p>
          </div>
        )}

        <AnimatePresence>
          {results.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass rounded-xl p-4 flex flex-col gap-3 group"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => openAt(r.seconds)}
                  className="flex items-center gap-2"
                >
                  <span className="text-lg font-bold text-violet-400 font-mono hover:text-violet-300 transition-colors">
                    {r.timestamp}
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${RELEVANCE_STYLES[r.relevance]}`}>
                    {r.relevance}
                  </span>
                  <button
                    onClick={() => openAt(r.seconds)}
                    className="w-7 h-7 rounded-lg glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-violet-400"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">{r.excerpt}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal player */}
      <AnimatePresence>
        {modalSeconds !== null && summary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setModalSeconds(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-2xl overflow-hidden w-full max-w-3xl"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <span className="text-sm font-medium text-slate-300">Playing from <span className="text-violet-400 font-mono">{results.find(r => r.seconds === modalSeconds)?.timestamp}</span></span>
                <button onClick={() => setModalSeconds(null)} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">×</button>
              </div>
              <div className="aspect-video w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${summary.video_id}?start=${modalSeconds}&autoplay=1`}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
