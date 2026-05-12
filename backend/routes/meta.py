from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.transcript import extract_video_id, get_video_meta

router = APIRouter()


class MetaRequest(BaseModel):
    url: str


@router.post("/video-meta")
async def video_meta(req: MetaRequest):
    try:
        vid = extract_video_id(req.url)
        return await get_video_meta(vid)
    except Exception as e:
        raise HTTPException(400, str(e))
