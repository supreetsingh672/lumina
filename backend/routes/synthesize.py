from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.transcript import extract_video_id, get_video_meta, get_transcript, get_transcript_text
from services.llm import summarize_transcript, synthesize_videos

router = APIRouter()


class SynthesizeRequest(BaseModel):
    urls: List[str]


@router.post("/synthesize")
async def synthesize(req: SynthesizeRequest):
    if not req.urls or len(req.urls) < 2:
        raise HTTPException(400, "Provide at least 2 URLs")
    try:
        video_data = []
        for url in req.urls[:8]:
            vid = extract_video_id(url)
            meta = await get_video_meta(vid)
            transcript = get_transcript(vid)
            text = get_transcript_text(transcript)
            summary = summarize_transcript(text, meta["title"])
            video_data.append({
                "video_id": vid,
                "title": meta["title"],
                "thumbnail": meta["thumbnail"],
                "channel": meta["channel"],
                "summary": summary.get("tldr", ""),
                "key_points": summary.get("key_points", []),
            })
        result = synthesize_videos(video_data)
        return {"videos": video_data, **result}
    except Exception as e:
        raise HTTPException(400, str(e))
