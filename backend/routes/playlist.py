import json
import re
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.transcript import get_video_meta, get_transcript, get_transcript_text
from services.llm import summarize_transcript, analyze_playlist_overview

router = APIRouter()


class PlaylistRequest(BaseModel):
    playlist_url: str


async def _get_playlist_video_ids(playlist_id: str) -> list:
    async with httpx.AsyncClient(timeout=15, headers={"User-Agent": "Mozilla/5.0"}) as client:
        r = await client.get(f"https://www.youtube.com/playlist?list={playlist_id}")
        ids = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', r.text)
        seen, unique = set(), []
        for vid in ids:
            if vid not in seen:
                seen.add(vid)
                unique.append(vid)
        return unique[:20]


def _extract_playlist_id(url: str) -> str:
    m = re.search(r'list=([^&\n?#]+)', url)
    if m:
        return m.group(1)
    raise ValueError("No playlist ID found in URL")


@router.post("/analyze-playlist")
async def analyze_playlist(req: PlaylistRequest):
    try:
        playlist_id = _extract_playlist_id(req.playlist_url)
        video_ids = await _get_playlist_video_ids(playlist_id)
        if not video_ids:
            raise HTTPException(400, "No videos found in playlist")

        async def generate():
            videos = []
            for i, vid in enumerate(video_ids):
                try:
                    yield f"data: {json.dumps({'type': 'progress', 'index': i, 'total': len(video_ids), 'video_id': vid, 'status': 'processing'})}\n\n"
                    meta = await get_video_meta(vid)
                    transcript = get_transcript(vid)
                    text = get_transcript_text(transcript)
                    summary_data = summarize_transcript(text, meta["title"])
                    video = {
                        "video_id": vid,
                        "title": meta["title"],
                        "channel": meta["channel"],
                        "thumbnail": meta["thumbnail"],
                        "summary": summary_data.get("tldr", ""),
                        "key_points": summary_data.get("key_points", []),
                        "topics": summary_data.get("topics", []),
                        "word_count": len(text.split()),
                    }
                    videos.append(video)
                    yield f"data: {json.dumps({'type': 'video_done', 'index': i, 'video': video})}\n\n"
                except Exception as e:
                    yield f"data: {json.dumps({'type': 'video_error', 'index': i, 'video_id': vid, 'error': str(e)})}\n\n"

            try:
                overview = analyze_playlist_overview(videos)
                yield f"data: {json.dumps({'type': 'overview', 'overview': overview, 'videos': videos})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

            yield "data: [DONE]\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream", headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, str(e))
