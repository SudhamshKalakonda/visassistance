import os
from groq import Groq
from openai import OpenAI
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

SUPPORTED_PROVIDERS = ["groq", "openai", "gemini"]

MODEL_MAP = {
    "groq": "llama-3.3-70b-versatile",
    "openai": "gpt-4o-mini",
    "gemini": "gemini-1.5-flash",
}


def get_provider(provider: str) -> str:
    provider = provider.lower()
    if provider not in SUPPORTED_PROVIDERS:
        return os.getenv("DEFAULT_PROVIDER", "groq")
    return provider


def chat(system: str, messages: list, provider: str = None) -> str:
    provider = get_provider(provider or os.getenv("DEFAULT_PROVIDER", "groq"))

    if provider == "groq":
        return _chat_groq(system, messages)
    elif provider == "openai":
        return _chat_openai(system, messages)
    elif provider == "gemini":
        return _chat_gemini(system, messages)


def _chat_groq(system: str, messages: list) -> str:
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    formatted = [{"role": "system", "content": system}]
    for m in messages:
        if m["role"] in ("user", "assistant"):
            formatted.append({"role": m["role"], "content": m["content"]})
    response = client.chat.completions.create(
        model=MODEL_MAP["groq"],
        messages=formatted,
        temperature=0.7,
        max_tokens=1024,
    )
    return response.choices[0].message.content


def _chat_openai(system: str, messages: list) -> str:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.chat.completions.create(
        model=MODEL_MAP["openai"],
        messages=[{"role": "system", "content": system}] + messages,
        temperature=0.7,
        max_tokens=1024,
    )
    return response.choices[0].message.content


def _chat_gemini(system: str, messages: list) -> str:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel(
        model_name=MODEL_MAP["gemini"],
        system_instruction=system,
    )
    # Build history excluding last message
    history = []
    for m in messages[:-1]:
        history.append({
            "role": "user" if m["role"] == "user" else "model",
            "parts": [{"text": m["content"]}]
        })
    chat_session = model.start_chat(history=history)
    response = chat_session.send_message(messages[-1]["content"])
    return response.text
