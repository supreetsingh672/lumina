"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import SynthesisView from "@/components/SynthesisView";

export default function SynthesizePage() {
  const router = useRouter();
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
        <span className="text-slate-500 text-sm">/ Cross-Video Synthesis</span>
      </header>
      <div className="flex-1 overflow-y-auto">
        <SynthesisView />
      </div>
    </div>
  );
}
