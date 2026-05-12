from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.transcript import extract_video_id, get_transcript, chunk_transcript
from services.search import search_transcript

router = APIRouter()


class TimestampRequest(BaseModel):
    url: str
    query: str


@router.post("/search-timestamp")
async def search_timestamp(req: TimestampRequest):
    try:
        vid = extract_video_id(req.url)
        transcript = get_transcript(vid)
        chunks = chunk_transcript(transcript)
        results = search_transcript(chunks, req.query)
        return {"results": results, "video_id": vid, "total_chunks": len(chunks)}
    except Exception as e:
        raise HTTPException(400, str(e))
