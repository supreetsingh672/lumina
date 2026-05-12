# Lumina — Design & Architecture

---

## Product overview

Lumina is a YouTube intelligence platform that lets users extract value from video content without watching it. It targets developers, students, researchers, and anyone who regularly consumes YouTube as a learning medium.

The core insight is that YouTube videos contain dense, structured information — but the format forces you to watch linearly and at full speed. Lumina breaks that constraint.

---

## Features in detail

### 1. Summary + Chat (`/watch`)

**Flow:**
1. User pastes a YouTube URL
2. Backend fetches the full transcript via `youtube-transcript-api`
3. Transcript is sent to Groq (Llama 3.3 70B) with a structured JSON prompt
4. Response is rendered as: TL;DR → key points (animated) → topic pills → density score
5. User switches to Chat tab — messages are sent with the full transcript as system context
6. AI responses stream word-by-word via Server-Sent Events (SSE)

**UI layout:** Split-pane — left 38% is the video panel (thumbnail, meta, topics), right 62% is tabbed (Summary / Chat / Timestamps / Insights).

---

### 2. Playlist Analyzer (`/playlist`)

**Flow:**
1. User pastes a playlist URL
2. Backend scrapes the YouTube playlist page to extract video IDs (no API key needed)
3. Each video is processed sequentially: transcript → summary → key points
4. Progress streams back to the frontend via SSE — renders like a CI/CD job log
5. After all videos, an overview prompt generates: difficulty level, prerequisites, ideal viewer, course outline (markdown)

**Output:** Numbered lesson cards (expandable), course outline panel, playlist stats.

---

### 3. Timestamp Search (`/watch` → Timestamps tab)

**Flow:**
1. Transcript is chunked into ~350-character segments, each tagged with a start timestamp
2. User types a query (debounced 500ms)
3. Backend runs BM25 (Okapi BM25 via `rank-bm25`) over all chunks
4. Top matches returned with: timestamp badge, excerpt, relevance score (high/medium/low)
5. Clicking a timestamp opens an embedded YouTube iframe at that exact second (`?start=N`)
6. A visual timeline at the top of the tab shows match positions as coloured dots

**Why BM25 instead of vector embeddings:**
- Zero cost (no embedding API, no vector DB)
- Runs in-memory in ~1ms
- Works well enough for transcript search where queries are short and direct
- No cold start, no model loading

---

### 4. Cross-Video Synthesis (`/synthesize`)

**Flow:**
1. User pastes 2–8 YouTube URLs (drag-reorderable)
2. Each video is fetched and summarised individually (parallel processing)
3. All summaries are sent in a single synthesis prompt
4. Output is parsed into four structured sections:
   - **Master summary** — unified paragraph across all videos
   - **Consensus** — points where all/most videos agree
   - **Contradictions** — side-by-side comparisons where videos conflict
   - **Unique insights** — what each video covers that others don't

---

## System architecture

```
┌─────────────────────────────────┐     ┌──────────────────────────────────┐
│         Browser (Vercel)        │     │        Backend (Render)           │
│                                 │     │                                   │
│  Next.js 16 App Router          │     │  FastAPI                          │
│  ├─ React Server Components     │────▶│  ├─ /api/video-meta               │
│  ├─ Client Components           │     │  ├─ /api/summarize                │
│  ├─ Zustand (global state)      │◀────│  ├─ /api/chat         (SSE)       │
│  └─ Framer Motion (animations)  │     │  ├─ /api/search-timestamp         │
│                                 │     │  ├─ /api/analyze-playlist (SSE)   │
└─────────────────────────────────┘     │  └─ /api/synthesize               │
                                        │                                   │
                                        │  Services                         │
                                        │  ├─ transcript.py                 │
                                        │  │   └─ youtube-transcript-api    │
                                        │  ├─ llm.py                        │
                                        │  │   └─ Groq API (Llama 3.3 70B) │
                                        │  └─ search.py                     │
                                        │      └─ rank-bm25 (in-memory)     │
                                        └──────────────────────────────────┘
                                                       │
                                        ┌──────────────────────────────────┐
                                        │         External APIs             │
                                        │  ├─ YouTube oEmbed (video meta)  │
                                        │  ├─ YouTube Transcript API        │
                                        │  └─ Groq (Llama 3.3 70B)         │
                                        └──────────────────────────────────┘
```

---

## Data flow

```
User pastes URL
      │
      ▼
Frontend (Next.js)
  → POST /api/summarize
      │
      ▼
Backend extracts video ID
  → Fetches transcript (youtube-transcript-api)
  → Sends transcript + prompt to Groq
  → Parses JSON response
  → Returns structured summary
      │
      ▼
Frontend renders
  → TL;DR card
  → Key points (staggered animation)
  → Topic pills
  → Density badge
```

For chat and playlist, responses stream via SSE:

```
Browser opens fetch() with streaming
  → Backend yields chunks as "data: {...}\n\n"
  → Frontend reads ReadableStream
  → Appends to message in real-time
```

---

## Infrastructure

### Frontend — Vercel (free tier)

| Property | Value |
|---|---|
| Platform | Vercel |
| Framework | Next.js 16 |
| Build | `npm run build` (Turbopack) |
| Deploy trigger | Every push to `main` |
| CDN | Vercel Edge Network (global) |
| Cost | $0/month |

**Environment variables on Vercel:**
```
NEXT_PUBLIC_API_URL = https://lumina-0d1t.onrender.com
```

---

### Backend — Render (free tier)

| Property | Value |
|---|---|
| Platform | Render |
| Runtime | Python 3.12 |
| Root directory | `backend/` |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Sleep policy | Sleeps after 15 min inactivity |
| Cold start | ~30 seconds |
| RAM | 512 MB |
| Cost | $0/month |

**Environment variables on Render:**
```
GROQ_API_KEY            = <from console.groq.com>
WEBSHARE_PROXY_USERNAME = <optional — needed to bypass YouTube IP blocks>
WEBSHARE_PROXY_PASSWORD = <optional — pair with above>
```

---

### AI — Groq (free tier)

| Property | Value |
|---|---|
| Model | `llama-3.3-70b-versatile` |
| Context window | 128K tokens |
| Free tier | 14,400 requests/day, 131,072 TPM |
| Streaming | Yes (via Groq Python SDK) |
| Cost | $0/month |

---

### Total monthly cost

| Component | Cost |
|---|---|
| Vercel (frontend) | $0 |
| Render (backend) | $0 |
| Groq API | $0 |
| YouTube Transcript API | $0 (no key required) |
| **Total** | **$0** |

---

## Design language

The UI follows a **dark-first, premium AI product** aesthetic:

| Element | Spec |
|---|---|
| Background | `#080B14` — deep space dark |
| Cards | Glassmorphism: `rgba(255,255,255,0.04)` + `backdrop-blur(20px)` + `1px solid rgba(255,255,255,0.08)` |
| Primary accent | Violet `#7C3AED` → Indigo `#6366F1` gradient |
| Highlight | Cyan `#06B6D4` |
| Primary text | `#E2E8F0` |
| Secondary text | `#94A3B8` |
| Animated borders | CSS `conic-gradient` rotating via `@property --angle` |
| Font | Geist Sans (variable, from Vercel) |
| Animations | Framer Motion — fade+slide up, staggered lists, AnimatePresence for tab transitions |
| Loading states | Skeleton shimmer + animated status text (never a plain spinner) |
| Particle background | Custom canvas — floating dots with connecting lines (indigo/violet/cyan palette) |

---

## State management

Zustand is used for a single global store (`lib/store.ts`) that holds:

- Current video URL and metadata
- Summary data (tldr, key points, topics, density)
- Chat message history + streaming state
- Timestamp search results
- Synthesis results
- Playlist progress (videos processed, overview)

URL state: video URL is passed as a query param (`/watch?url=...`) so pages are shareable and bookmarkable.

---

## API reference

All endpoints are on the FastAPI backend (`https://lumina-0d1t.onrender.com`):

| Method | Path | Body | Response |
|---|---|---|---|
| `POST` | `/api/video-meta` | `{ url }` | `{ title, channel, thumbnail, video_id }` |
| `POST` | `/api/summarize` | `{ url }` | `{ tldr, key_points, topics, density_score, what_you_learn, word_count }` |
| `POST` | `/api/chat` | `{ url, messages[] }` | SSE stream of `{ content }` chunks |
| `POST` | `/api/search-timestamp` | `{ url, query }` | `{ results: [{ timestamp, seconds, excerpt, relevance }] }` |
| `POST` | `/api/analyze-playlist` | `{ playlist_url }` | SSE stream of progress + video + overview events |
| `POST` | `/api/synthesize` | `{ urls[] }` | `{ master_summary, consensus[], contradictions[], unique_insights{} }` |

---

## Known issues and roadmap

### Current limitations
- YouTube blocks transcript requests from Render's cloud IPs — requires a Webshare proxy (free tier available)
- No database — all state is in-memory per session
- Playlist processing is sequential (one video at a time) due to Groq rate limits

### Potential improvements
- Persistent history via localStorage or a free DB (Supabase free tier)
- Export to PDF / Markdown
- Browser extension to trigger Lumina directly from YouTube
- Parallel playlist processing with rate limiting
- Support for non-English transcripts (auto-detect language)
