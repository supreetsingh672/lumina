from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.transcript import extract_video_id, get_video_meta, get_transcript, get_transcript_text
from services.llm import summarize_transcript

router = APIRouter()


class SummarizeRequest(BaseModel):
    url: str


@router.post("/summarize")
async def summarize(req: SummarizeRequest):
    try:
        vid = extract_video_id(req.url)
        meta, transcript = await _fetch(vid)
        text = get_transcript_text(transcript)
        summary = summarize_transcript(text, meta["title"])
        return {
            **meta,
            "word_count": len(text.split()),
            **summary,
        }
    except Exception as e:
        raise HTTPException(400, str(e))


async def _fetch(vid: str):
    meta = await get_video_meta(vid)
    transcript = get_transcript(vid)
    return meta, transcript
