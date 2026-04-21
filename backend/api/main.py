from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import chat

app = FastAPI(
    title="VisaGPT API",
    description="AI-powered US visa and immigration assistant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)


@app.get("/")
async def root():
    return {
        "name": "VisaGPT API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
