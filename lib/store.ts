"use client";

import { create } from "zustand";
import type { SummaryResponse, ChatMessage, TimestampResult, SynthesisResponse, PlaylistVideo, PlaylistOverview } from "./api";

interface LuminaStore {
  // current video
  videoUrl: string;
  summary: SummaryResponse | null;
  isLoadingSummary: boolean;
  summaryError: string | null;

  // chat
  chatMessages: ChatMessage[];
  isStreaming: boolean;

  // timestamps
  timestampResults: TimestampResult[];
  isSearchingTimestamps: boolean;

  // synthesis
  synthesisResult: SynthesisResponse | null;
  isLoadingSynthesis: boolean;

  // playlist
  playlistVideos: PlaylistVideo[];
  playlistOverview: PlaylistOverview | null;
  playlistProgress: number;
  isLoadingPlaylist: boolean;
  playlistProcessed: number;
  playlistTotal: number;

  // actions
  setVideoUrl: (url: string) => void;
  setSummary: (s: SummaryResponse | null) => void;
  setLoadingSummary: (v: boolean) => void;
  setSummaryError: (e: string | null) => void;

  addChatMessage: (m: ChatMessage) => void;
  updateLastAssistantMessage: (text: string) => void;
  appendToLastAssistantMessage: (chunk: string) => void;
  setStreaming: (v: boolean) => void;
  clearChat: () => void;

  setTimestampResults: (r: TimestampResult[]) => void;
  setSearchingTimestamps: (v: boolean) => void;

  setSynthesisResult: (r: SynthesisResponse | null) => void;
  setLoadingSynthesis: (v: boolean) => void;

  addPlaylistVideo: (v: PlaylistVideo) => void;
  setPlaylistOverview: (o: PlaylistOverview) => void;
  setLoadingPlaylist: (v: boolean) => void;
  setPlaylistProgress: (processed: number, total: number) => void;
  resetPlaylist: () => void;

  reset: () => void;
}

const defaults = {
  videoUrl: "",
  summary: null,
  isLoadingSummary: false,
  summaryError: null,
  chatMessages: [],
  isStreaming: false,
  timestampResults: [],
  isSearchingTimestamps: false,
  synthesisResult: null,
  isLoadingSynthesis: false,
  playlistVideos: [],
  playlistOverview: null,
  playlistProgress: 0,
  isLoadingPlaylist: false,
  playlistProcessed: 0,
  playlistTotal: 0,
};

export const useStore = create<LuminaStore>((set) => ({
  ...defaults,

  setVideoUrl: (url) => set({ videoUrl: url }),
  setSummary: (s) => set({ summary: s }),
  setLoadingSummary: (v) => set({ isLoadingSummary: v }),
  setSummaryError: (e) => set({ summaryError: e }),

  addChatMessage: (m) => set((s) => ({ chatMessages: [...s.chatMessages, m] })),
  updateLastAssistantMessage: (text) =>
    set((s) => {
      const msgs = [...s.chatMessages];
      const last = msgs[msgs.length - 1];
      if (last?.role === "assistant") msgs[msgs.length - 1] = { ...last, content: text };
      return { chatMessages: msgs };
    }),
  appendToLastAssistantMessage: (chunk) =>
    set((s) => {
      const msgs = [...s.chatMessages];
      const last = msgs[msgs.length - 1];
      if (last?.role === "assistant") msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
      return { chatMessages: msgs };
    }),
  setStreaming: (v) => set({ isStreaming: v }),
  clearChat: () => set({ chatMessages: [] }),

  setTimestampResults: (r) => set({ timestampResults: r }),
  setSearchingTimestamps: (v) => set({ isSearchingTimestamps: v }),

  setSynthesisResult: (r) => set({ synthesisResult: r }),
  setLoadingSynthesis: (v) => set({ isLoadingSynthesis: v }),

  addPlaylistVideo: (v) => set((s) => ({ playlistVideos: [...s.playlistVideos, v] })),
  setPlaylistOverview: (o) => set({ playlistOverview: o }),
  setLoadingPlaylist: (v) => set({ isLoadingPlaylist: v }),
  setPlaylistProgress: (processed, total) => set({ playlistProcessed: processed, playlistTotal: total }),
  resetPlaylist: () => set({ playlistVideos: [], playlistOverview: null, playlistProcessed: 0, playlistTotal: 0 }),

  reset: () => set(defaults),
}));
