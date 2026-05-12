import re
import httpx
from youtube_transcript_api import YouTubeTranscriptApi


def extract_video_id(url: str) -> str:
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([^&\n?#]+)',
        r'youtube\.com/shorts/([^&\n?#]+)',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    # bare video ID
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url.strip()):
        return url.strip()
    raise ValueError(f"Could not extract video ID from URL: {url}")


def extract_playlist_id(url: str) -> str:
    match = re.search(r'list=([^&\n?#]+)', url)
    if match:
        return match.group(1)
    raise ValueError(f"Could not extract playlist ID from URL: {url}")


async def get_video_meta(video_id: str) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(
                "https://www.youtube.com/oembed",
                params={"url": f"https://www.youtube.com/watch?v={video_id}", "format": "json"},
            )
            data = r.json()
        except Exception:
            data = {}
    return {
        "title": data.get("title", "Unknown Title"),
        "channel": data.get("author_name", "Unknown Channel"),
        "thumbnail": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
        "thumbnail_hq": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
        "video_id": video_id,
        "url": f"https://www.youtube.com/watch?v={video_id}",
    }


def get_transcript(video_id: str) -> list:
    """Returns list of dicts with keys: text, start, duration."""
    api = YouTubeTranscriptApi()
    fetched = api.fetch(video_id)
    return [{"text": s.text, "start": s.start, "duration": s.duration} for s in fetched]


def get_transcript_text(transcript: list) -> str:
    return " ".join(t["text"] for t in transcript)


def chunk_transcript(transcript: list, chunk_size: int = 350) -> list:
    chunks = []
    current_words = []
    current_start = transcript[0]["start"] if transcript else 0

    for entry in transcript:
        current_words.append(entry["text"])
        if len(" ".join(current_words)) >= chunk_size:
            chunks.append({
                "text": " ".join(current_words),
                "start": current_start,
                "timestamp": _fmt_time(current_start),
            })
            current_words = []
            current_start = entry["start"] + entry.get("duration", 0)

    if current_words:
        chunks.append({
            "text": " ".join(current_words),
            "start": current_start,
            "timestamp": _fmt_time(current_start),
        })

    return chunks


def _fmt_time(seconds: float) -> str:
    s = int(seconds)
    h, s = divmod(s, 3600)
    m, s = divmod(s, 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"
