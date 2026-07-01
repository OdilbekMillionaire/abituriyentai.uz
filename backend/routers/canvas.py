"""
Abituriyent Canvas — AI-generated educational infographic.
POST /canvas/generate  — Generate canvas, returns Pollinations.ai image_url
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, field_validator

from routers.auth import get_current_user
from models.user import User
from services.ai_service import generate_canvas

router = APIRouter()


class CanvasRequest(BaseModel):
    subject: str
    topic: str
    language: str = "uz"

    @field_validator("topic")
    @classmethod
    def validate_topic(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Mavzu kamida 2 ta belgidan iborat bo'lishi kerak")
        if len(v) > 200:
            raise ValueError("Mavzu 200 ta belgidan oshmasligi kerak")
        return v


class CanvasResponse(BaseModel):
    title: str
    description: str
    facts: list[dict]
    timeline: list[dict]
    key_figures: list[str]
    image_url: str
    imagen_prompt: str
    subject: str
    topic: str
    is_ai_generated: bool = True
    ai_disclaimer: str = "Ushbu kontent sun'iy intellekt tomonidan yaratilgan va rasmiy manba emas."


@router.post("/generate", response_model=CanvasResponse)
async def generate_canvas_endpoint(
    request: Request,
    req: CanvasRequest,
    current_user: User = Depends(get_current_user),
):
    valid_subjects = {"MOTHER_TONGUE", "MATHEMATICS", "HISTORY"}
    if req.subject not in valid_subjects:
        raise HTTPException(400, f"subject must be one of: {valid_subjects}")

    try:
        result = await generate_canvas(subject=req.subject, topic=req.topic, language=req.language)
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))

    return CanvasResponse(
        title=result["title"],
        description=result["description"],
        facts=result["facts"],
        timeline=result["timeline"],
        key_figures=result["key_figures"],
        image_url=result.get("image_url", ""),
        imagen_prompt=result.get("imagen_prompt", ""),
        subject=result["subject"],
        topic=result["topic"],
    )
