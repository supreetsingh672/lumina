const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

export async function fetchVideoMeta(url: string) {
  return post<VideoMeta>("/api/video-meta", { url });
}

export async function fetchSummary(url: string) {
  return post<SummaryResponse>("/api/summarize", { url });
}

export async function fetchTimestamps(url: string, query: string) {
  return post<TimestampResponse>("/api/search-timestamp", { url, query });
}

export async function fetchSynthesis(urls: string[]) {
  return post<SynthesisResponse>("/api/synthesize", { urls });
}

export function streamChat(
  url: string,
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (e: Error) => void
) {
  const ctrl = new AbortController();

  fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, messages }),
    signal: ctrl.signal,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error("Chat request failed");
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") { onDone(); return; }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) onChunk(parsed.content);
            } catch {}
          }
        }
      }
      onDone();
    })
    .catch((e) => { if (e.name !== "AbortError") onError(e); });

  return () => ctrl.abort();
}

export function streamPlaylist(
  playlistUrl: string,
  onProgress: (e: PlaylistProgressEvent) => void,
  onDone: () => void,
  onError: (e: Error) => void
) {
  const ctrl = new AbortController();

  fetch(`${BASE}/api/analyze-playlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playlist_url: playlistUrl }),
    signal: ctrl.signal,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error("Playlist request failed");
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") { onDone(); return; }
            try { onProgress(JSON.parse(data)); } catch {}
          }
        }
      }
      onDone();
    })
    .catch((e) => { if (e.name !== "AbortError") onError(e); });

  return () => ctrl.abort();
}

// ── Types ──────────────────────────────────────────────────────────

export interface VideoMeta {
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
  thumbnail_hq: string;
  url: string;
}

export interface SummaryResponse extends VideoMeta {
  tldr: string;
  key_points: string[];
  topics: string[];
  density_score: "Dense" | "Moderate" | "Light";
  density_label: string;
  what_you_learn: string[];
  word_count: number;
}

export interface TimestampResult {
  timestamp: string;
  seconds: number;
  excerpt: string;
  relevance: "high" | "medium" | "low";
  score: number;
}

export interface TimestampResponse {
  results: TimestampResult[];
  video_id: string;
  total_chunks: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SynthesisVideo {
  video_id: string;
  title: string;
  thumbnail: string;
  channel: string;
  summary: string;
  key_points: string[];
}

export interface Contradiction {
  topic: string;
  video_a_title: string;
  video_a_says: string;
  video_b_title: string;
  video_b_says: string;
}

export interface SynthesisResponse {
  videos: SynthesisVideo[];
  master_summary: string;
  consensus: string[];
  contradictions: Contradiction[];
  unique_insights: Record<string, string[]>;
}

export interface PlaylistVideo {
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
  summary: string;
  key_points: string[];
  topics: string[];
  word_count: number;
}

export interface PlaylistOverview {
  topic: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  synthesis: string;
  prerequisites: string[];
  ideal_viewer: string;
  course_outline: string;
}

export interface PlaylistProgressEvent {
  type: "progress" | "video_done" | "video_error" | "overview" | "error";
  index?: number;
  total?: number;
  video_id?: string;
  status?: string;
  video?: PlaylistVideo;
  overview?: PlaylistOverview;
  videos?: PlaylistVideo[];
  error?: string;
}
