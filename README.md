# Lumina — YouTube Intelligence Platform

> Instant summaries, smart chat, semantic search, and cross-video synthesis — one URL away.

**Live:** [lumina-alpha-one.vercel.app](https://lumina-alpha-one.vercel.app)

---

## What it does

Lumina turns any YouTube video or playlist into an interactive knowledge tool. Paste a URL and get:

| Feature | What you get |
|---|---|
| **Summary + Chat** | TL;DR, key points, topic tags, and a full chat interface grounded in the transcript |
| **Playlist Analyzer** | Every video summarised in parallel, compiled into a structured course outline |
| **Timestamp Search** | Type any topic or phrase — get exact timestamps with transcript excerpts |
| **Cross-Video Synthesis** | Paste 2–8 URLs, get consensus points, contradictions, and unique insights across all of them |

---

## Running locally

### Prerequisites
- Node.js 18+
- Python 3.9+
- A free [Groq API key](https://console.groq.com)

### 1. Clone

```bash
git clone https://github.com/supreetsingh672/lumina.git
cd lumina
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # then add your GROQ_API_KEY
```

### 3. Frontend

```bash
cd ..
npm install
```

### 4. Start everything

```bash
./dev.sh
```

- Frontend → http://localhost:3000
- Backend  → http://localhost:8000

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | From [console.groq.com](https://console.groq.com) — free |
| `WEBSHARE_PROXY_USERNAME` | No | Needed on cloud deployments — YouTube blocks cloud IPs |
| `WEBSHARE_PROXY_PASSWORD` | No | Pair with above |

### Frontend (`.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend base URL |

---

## Deployment

See [DESIGN.md](./DESIGN.md) for the full architecture and hosting setup.

**Quick version:**
- Frontend → [Vercel](https://vercel.com) free tier — auto-deploys on every push to `main`
- Backend  → [Render](https://render.com) free tier — Root Directory: `backend`

**Total monthly cost: $0**

---

## Tech stack

```
Frontend   Next.js 16 · TypeScript · Tailwind CSS v4 · Framer Motion · Zustand
Backend    FastAPI · Python 3.9 · youtube-transcript-api v1 · rank-bm25
AI         Groq API — Llama 3.3 70B (free tier: 14,400 req/day)
Search     BM25 in-memory (no embeddings, no vector DB, zero cost)
Hosting    Vercel + Render
```

---

## Project structure

```
lumina/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Landing page
│   ├── watch/page.tsx          # Video summary + chat
│   ├── playlist/page.tsx       # Playlist analyzer
│   └── synthesize/page.tsx     # Cross-video synthesis
├── components/
│   ├── ParticleBackground.tsx  # Animated canvas background
│   ├── VideoPanel.tsx          # Thumbnail, meta, topic tags
│   ├── ChatInterface.tsx       # Streaming chat UI
│   ├── TimestampSearch.tsx     # BM25 search + visual timeline
│   ├── SynthesisView.tsx       # Consensus / contradictions / insights
│   └── PlaylistView.tsx        # Course outline + expandable lesson cards
├── lib/
│   ├── api.ts                  # All API calls + TypeScript types
│   └── store.ts                # Zustand global state
└── backend/
    ├── main.py                 # FastAPI app + CORS
    ├── routes/                 # summarize · chat · timestamp · playlist · synthesize · meta
    └── services/
        ├── transcript.py       # YouTube transcript fetching + chunking
        ├── llm.py              # Groq API calls (summary, chat, synthesis)
        └── search.py           # BM25 keyword search
```

---

## Known limitations

- **Render cold starts** — free tier sleeps after 15 min of inactivity; first request takes ~30s
- **YouTube IP blocks** — cloud provider IPs get blocked by YouTube; resolve by adding [Webshare](https://webshare.io) free proxy credentials to Render env vars
- **Groq rate limits** — 14,400 req/day on free tier, sufficient for personal/demo use
- **No persistence** — all state is session-only; refresh clears everything
