"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import PlaylistView from "@/components/PlaylistView";

function PlaylistContent() {
  const params = useSearchParams();
  const router = useRouter();
  const url = params.get("url") ? decodeURIComponent(params.get("url")!) : "";

  return (
    <div className="min-h-screen bg-[#080b14] flex flex-col">
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
        <span className="text-slate-500 text-sm">/ Playlist Analyzer</span>
      </header>
      <div className="flex-1 overflow-y-auto">
        <PlaylistView initialUrl={url} />
      </div>
    </div>
  );
}

export default function PlaylistPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080b14] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    }>
      <PlaylistContent />
    </Suspense>
  );
}
