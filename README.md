# VisaGPT

AI-powered US visa and immigration assistant for international students.
Supports F1, OPT, CPT, H1B questions with multi-LLM model switching (Groq, OpenAI, Gemini).

## Project Structure

```
visagpt/
├── backend/          # FastAPI backend
│   ├── api/
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── llm_client.py     # Unified LLM client (Groq/OpenAI/Gemini)
│   │   ├── prompts.py        # VisaGPT system prompt
│   │   └── routers/
│   │       └── chat.py       # Chat endpoint
│   ├── requirements.txt
│   └── .env.example
└── frontend/         # Next.js frontend
    ├── src/app/
    │   └── page.tsx          # Main chat UI
    └── .env.example
```

## Backend Setup

```bash
cd backend

# Create and activate conda env (recommended)
conda create -n visagpt python=3.11
conda activate visagpt

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys

# Run the server
PYTHONPATH=. uvicorn api.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` to test the API.

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL to your backend URL

# Run the dev server
npm run dev
```

Visit `http://localhost:3000`

## API Keys Required

| Provider | Get Key | Free |
|---|---|---|
| Groq | https://console.groq.com | Yes |
| OpenAI | https://platform.openai.com/api-keys | No (pay per use) |
| Google Gemini | https://aistudio.google.com/app/apikey | Yes |

## Deployment

### Backend → Render
1. Push to GitHub
2. Create new Web Service on Render
3. Build command: `pip install -r requirements.txt`
4. Start command: `PYTHONPATH=. uvicorn api.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render dashboard

### Frontend → Vercel
1. Import GitHub repo on Vercel
2. Set `NEXT_PUBLIC_API_URL` to your Render backend URL
3. Deploy

## Chat API

**POST** `/chat/`

```json
{
  "messages": [
    { "role": "user", "content": "What is CPT?" }
  ],
  "provider": "groq"
}
```

Response:
```json
{
  "reply": "CPT (Curricular Practical Training) is...",
  "provider": "groq",
  "model": "llama-3.3-70b-versatile"
}
```

**GET** `/chat/providers` — returns list of available providers
