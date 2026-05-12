import os
import json
from typing import Optional
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_client: Optional[Groq] = None

def get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.environ["GROQ_API_KEY"])
    return _client

MODEL = "llama-3.3-70b-versatile"


def summarize_transcript(transcript_text: str, title: str) -> dict:
    prompt = f"""Analyze this YouTube video titled: "{title}"

Transcript:
{transcript_text[:14000]}

Return ONLY valid JSON with this exact shape:
{{
  "tldr": "2-3 sentence TL;DR capturing the core message",
  "key_points": ["insightful point 1", "insightful point 2", "insightful point 3", "insightful point 4", "insightful point 5"],
  "topics": ["topic1", "topic2", "topic3"],
  "density_score": "Dense",
  "density_label": "High value per minute",
  "what_you_learn": ["skill or concept 1", "skill or concept 2", "skill or concept 3"]
}}

density_score options: "Dense" | "Moderate" | "Light"
density_label options: "High value per minute" | "Solid content" | "Casual watch"
"""
    resp = get_client().chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
        max_tokens=1200,
    )
    return json.loads(resp.choices[0].message.content)


def chat_stream(transcript_text: str, title: str, messages: list):
    system = f"""You are an expert AI assistant that has fully analyzed a YouTube video titled "{title}".

Video transcript (excerpt):
{transcript_text[:10000]}

Answer questions accurately and concisely based on the video content. If something isn't covered in the video, say so clearly. Be conversational but insightful."""

    groq_messages = [{"role": "system", "content": system}]
    for msg in messages:
        groq_messages.append({"role": msg["role"], "content": msg["content"]})

    return get_client().chat.completions.create(
        model=MODEL,
        messages=groq_messages,
        temperature=0.7,
        stream=True,
        max_tokens=1000,
    )


def synthesize_videos(video_summaries: list) -> dict:
    videos_text = "\n\n".join(
        f"Video {i+1} — \"{v['title']}\"\nSummary: {v['summary']}\nKey points: {'; '.join(v.get('key_points', []))}"
        for i, v in enumerate(video_summaries)
    )

    prompt = f"""Analyze these YouTube videos and identify connections, agreements, and conflicts:

{videos_text}

Return ONLY valid JSON:
{{
  "master_summary": "A 2-3 sentence unified synthesis of all videos",
  "consensus": ["point all/most videos agree on", "..."],
  "contradictions": [
    {{"topic": "topic name", "video_a_title": "...", "video_a_says": "...", "video_b_title": "...", "video_b_says": "..."}}
  ],
  "unique_insights": {{
    "video title": ["unique insight from this video only", "..."]
  }}
}}
"""
    resp = get_client().chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
        max_tokens=2000,
    )
    return json.loads(resp.choices[0].message.content)


def analyze_playlist_overview(video_data: list) -> dict:
    videos_text = "\n".join(
        f"{i+1}. \"{v['title']}\" — {v.get('summary', '')}"
        for i, v in enumerate(video_data[:20])
    )

    prompt = f"""Analyze this YouTube playlist:

{videos_text}

Return ONLY valid JSON:
{{
  "topic": "main topic or category of the playlist",
  "difficulty": "Beginner",
  "synthesis": "2-3 sentences on what this playlist teaches overall",
  "prerequisites": ["prerequisite knowledge 1", "prerequisite knowledge 2"],
  "ideal_viewer": "description of the ideal viewer for this playlist",
  "course_outline": "## Course Outline\\n\\n### Module 1: ...\\n- Lesson 1\\n..."
}}

difficulty options: "Beginner" | "Intermediate" | "Advanced"
"""
    resp = get_client().chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
        max_tokens=2000,
    )
    return json.loads(resp.choices[0].message.content)
