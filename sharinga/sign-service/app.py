from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Sharinga Sign Translator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranslateRequest(BaseModel):
    text: str
    text_lang: str = "english"
    sign_lang: str = "asl"

class TranslateResponse(BaseModel):
    text: str
    gloss: Optional[str] = None
    success: bool
    message: Optional[str] = None

@app.get("/health")
async def health():
    return {"ok": True, "service": "sign-translator"}

@app.post("/translate", response_model=TranslateResponse)
async def translate(req: TranslateRequest):
    try:
        text = (req.text or "").strip()
        if not text:
            return TranslateResponse(text=text, success=False, message="Empty text")
        words = text.split()
        gloss = " ".join(w.upper() for w in words)
        return TranslateResponse(text=text, gloss=gloss, success=True)
    except Exception as e:
        return TranslateResponse(text=req.text or "", success=False, message=str(e))
