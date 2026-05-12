"use client";

import { motion } from "framer-motion";
import { Play, User, Hash, FileText } from "lucide-react";
import type { SummaryResponse } from "@/lib/api";

interface Props {
  summary: SummaryResponse;
}

const DENSITY_COLORS: Record<string, string> = {
  Dense: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Moderate: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Light: "text-slate-400 bg-slate-400/10 border-slate-400/20",
};

export default function VideoPanel({ summary }: Props) {
  const yt = `https://www.youtube.com/watch?v=${summary.video_id}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-5 h-full"
    >
      {/* Thumbnail */}
      <div className="relative group rounded-2xl overflow-hidden cursor-pointer" onClick={() => window.open(yt, "_blank")}>
        <img
          src={summary.thumbnail}
          alt={summary.title}
          onError={(e) => { (e.target as HTMLImageElement).src = summary.thumbnail_hq ?? summary.thumbnail; }}
          className="w-full aspect-video object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center glow-violet">
            <Play className="w-6 h-6 fill-white text-white ml-1" />
          </div>
        </div>
        <div className="absolute inset-0 ring-1 ring-white/10 rounded-2xl pointer-events-none" />
      </div>

      {/* Meta */}
      <div className="glass rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-slate-100 leading-snug line-clamp-2">
          {summary.title}
        </h2>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <User className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span className="truncate">{summary.channel}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{summary.word_count?.toLocaleString()} words transcribed</span>
          </div>
        </div>

        {/* Density badge */}
        <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border w-fit ${DENSITY_COLORS[summary.density_score] ?? DENSITY_COLORS.Moderate}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {summary.density_score} — {summary.density_label}
        </div>
      </div>

      {/* Topics */}
      {summary.topics?.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Topics</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.topics.map((t, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* What you'll learn */}
      {summary.what_you_learn?.length > 0 && (
        <div className="glass rounded-2xl p-5 flex-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">What you&apos;ll learn</p>
          <ul className="flex flex-col gap-2">
            {summary.what_you_learn.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
