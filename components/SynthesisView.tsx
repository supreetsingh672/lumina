"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Loader2, Zap, GitMerge, AlertTriangle, Lightbulb } from "lucide-react";
import { fetchSynthesis, type SynthesisResponse, type SynthesisVideo } from "@/lib/api";
import { toast } from "sonner";

export default function SynthesisView() {
  const [urls, setUrls] = useState<string[]>(["", ""]);
  const [result, setResult] = useState<SynthesisResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const updateUrl = (i: number, val: string) =>
    setUrls((prev) => prev.map((u, idx) => (idx === i ? val : u)));

  const addUrl = () => {
    if (urls.length < 8) setUrls((p) => [...p, ""]);
  };

  const removeUrl = (i: number) => {
    if (urls.length > 2) setUrls((p) => p.filter((_, idx) => idx !== i));
  };

  const synthesize = async () => {
    const valid = urls.filter((u) => u.trim());
    if (valid.length < 2) {
      toast.error("Add at least 2 YouTube URLs");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const data = await fetchSynthesis(valid);
      setResult(data);
    } catch (e: any) {
      toast.error(e.message ?? "Synthesis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* URL inputs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold gradient-text-static">Cross-Video Synthesis</h2>
        <p className="text-slate-400 text-sm">Paste 2–8 YouTube URLs to find consensus, contradictions, and unique insights across all of them.</p>

        <div className="flex flex-col gap-3">
          {urls.map((url, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-2"
            >
              <div className="w-7 h-11 flex items-center justify-center text-xs font-bold text-violet-400/50 shrink-0">
                {i + 1}
              </div>
              <input
                value={url}
                onChange={(e) => updateUrl(i, e.target.value)}
                placeholder={`YouTube URL ${i + 1}${i < 2 ? " (required)" : " (optional)"}`}
                className="flex-1 lumina-input rounded-xl px-4 py-3 text-sm"
              />
              {urls.length > 2 && (
                <button
                  onClick={() => removeUrl(i)}
                  className="w-11 h-11 rounded-xl glass border border-white/10 flex items-center justify-center text-slate-400 hover:text-red-400 hover:border-red-400/30 transition-all shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          ))}
        </div>

        <div className="flex gap-3">
          {urls.length < 8 && (
            <button
              onClick={addUrl}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-white/10 text-sm text-slate-300 hover:text-white hover:border-violet-500/40 transition-all"
            >
              <Plus className="w-4 h-4" /> Add URL
            </button>
          )}
          <button
            onClick={synthesize}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl animated-border text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:glow-violet transition-all ml-auto"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Synthesizing...</>
            ) : (
              <><Zap className="w-4 h-4" /> Synthesize</>
            )}
          </button>
        </div>
      </motion.div>

      {/* Loading animation */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 py-12">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-indigo-500/30 animate-ping [animation-delay:300ms]" />
            <div className="absolute inset-4 rounded-full bg-violet-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-violet-400" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-slate-200 font-medium">Synthesizing across videos</p>
            <p className="text-slate-500 text-sm mt-1">Reading transcripts and finding patterns...</p>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
          {/* Video sources row */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {result.videos.map((v, i) => (
              <VideoChip key={i} video={v} index={i} />
            ))}
          </div>

          {/* Master summary */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <GitMerge className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Master Summary</span>
            </div>
            <p className="text-slate-200 leading-relaxed">{result.master_summary}</p>
          </div>

          {/* Consensus */}
          {result.consensus?.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Consensus ({result.consensus.length})</span>
              </div>
              <ul className="flex flex-col gap-3">
                {result.consensus.map((c, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    className="flex items-start gap-3 text-sm text-slate-200"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {c}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Contradictions */}
          {result.contradictions?.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Contradictions ({result.contradictions.length})</span>
              </div>
              <div className="flex flex-col gap-4">
                {result.contradictions.map((c, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    className="rounded-xl border border-amber-400/15 overflow-hidden"
                  >
                    <div className="px-4 py-2 bg-amber-400/5 border-b border-amber-400/10">
                      <span className="text-xs font-semibold text-amber-400/80 uppercase tracking-wider">{c.topic}</span>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
                      <div className="p-4">
                        <p className="text-xs text-slate-500 mb-1.5 truncate">{c.video_a_title}</p>
                        <p className="text-sm text-slate-200">{c.video_a_says}</p>
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-slate-500 mb-1.5 truncate">{c.video_b_title}</p>
                        <p className="text-sm text-slate-200">{c.video_b_says}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Unique insights */}
          {result.unique_insights && Object.keys(result.unique_insights).length > 0 && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-semibold text-violet-400 uppercase tracking-wider">Unique Insights</span>
              </div>
              <div className="flex flex-col gap-5">
                {Object.entries(result.unique_insights).map(([title, insights], i) => (
                  <div key={i}>
                    <p className="text-xs text-slate-500 mb-2 truncate">{title}</p>
                    <ul className="flex flex-col gap-1.5">
                      {insights.map((ins, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                          {ins}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function VideoChip({ video, index }: { video: SynthesisVideo; index: number }) {
  const COLORS = ["violet", "indigo", "cyan", "emerald", "amber", "rose", "orange", "teal"];
  const c = COLORS[index % COLORS.length];
  return (
    <div className="glass rounded-xl p-3 flex items-center gap-3 shrink-0 min-w-[200px] max-w-[240px]">
      <img src={video.thumbnail} alt={video.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-200 truncate">{video.title}</p>
        <p className="text-xs text-slate-500 truncate">{video.channel}</p>
      </div>
    </div>
  );
}
