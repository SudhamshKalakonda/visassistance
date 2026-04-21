from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from api.llm_client import chat, SUPPORTED_PROVIDERS, MODEL_MAP
from api.prompts import VISA_GPT_SYSTEM_PROMPT

router = APIRouter(prefix="/chat", tags=["chat"])


class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    provider: str = "groq"


class ChatResponse(BaseModel):
    reply: str
    provider: str
    model: str


@router.post("/", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="Messages cannot be empty")

    provider = req.provider.lower()
    if provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid provider. Choose from: {SUPPORTED_PROVIDERS}"
        )

    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    try:
        reply = chat(
            system=VISA_GPT_SYSTEM_PROMPT,
            messages=messages,
            provider=provider
        )
        return ChatResponse(
            reply=reply,
            provider=provider,
            model=MODEL_MAP[provider]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/providers")
async def get_providers():
    return {
        "providers": [
            {"id": "groq", "label": "Llama 3.3 70B", "subtitle": "via Groq", "free": True},
            {"id": "openai", "label": "GPT-4o mini", "subtitle": "via OpenAI", "free": False},
            {"id": "gemini", "label": "Gemini 1.5 Flash", "subtitle": "via Google", "free": True},
        ]
    }
