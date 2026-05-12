import json
from typing import List
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.transcript import extract_video_id, get_video_meta, get_transcript, get_transcript_text
from services.llm import chat_stream

router = APIRouter()


class ChatRequest(BaseModel):
    url: str
    messages: List[dict]


@router.post("/chat")
async def chat(req: ChatRequest):
    try:
        vid = extract_video_id(req.url)
        meta = await get_video_meta(vid)
        transcript = get_transcript(vid)
        text = get_transcript_text(transcript)
        stream = chat_stream(text, meta["title"], req.messages)

        def generate():
            for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield f"data: {json.dumps({'content': content})}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream", headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        })
    except Exception as e:
        raise HTTPException(400, str(e))
