"""
Tabsit — Arabic Text Simplification Backend
FastAPI pipeline: AraT5 (domain simplification) → GPT-4o (language polish)

Install dependencies:
    pip install fastapi uvicorn transformers torch openai python-dotenv sentencepiece

Run:
    uvicorn main:app --reload --port 8000
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# ── OpenAI client ──────────────────────────────────────────────
from openai import OpenAI
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ── AraT5 model — loaded once at startup ──────────────────────
import torch
from transformers import AutoModelForSeq2SeqLM
from transformers.models.t5.tokenization_t5 import T5Tokenizer

ARAT5_MODEL_PATH = os.getenv("ARAT5_MODEL_PATH", "maysa11/samer-arat5")

print(f"⏳ Loading AraT5 model from: {ARAT5_MODEL_PATH}")

_tokenizer = T5Tokenizer.from_pretrained(
    "UBC-NLP/AraT5v2-base-1024",
    legacy=True,
    use_fast=False,
)
_model = AutoModelForSeq2SeqLM.from_pretrained(ARAT5_MODEL_PATH)
_device = "cuda" if torch.cuda.is_available() else "cpu"
_model = _model.to(_device).eval()

print(f"✅ AraT5 loaded on {_device}")

# ── GPT-4o system prompt ───────────────────────────────────────
GPT_SYSTEM_PROMPT = """أنت مدقق لغوي متخصص في تبسيط النصوص الحكومية والتأمينية العربية.
ستتلقى نصاً عربياً تم تبسيطه جزئياً بواسطة نموذج AraT5 المتخصص.
مهمتك هي:
1. صقل الصياغة وتحسين الأسلوب ليكون طبيعياً وسلساً.
2. تصحيح أي أخطاء نحوية أو إملائية.
3. التأكد من أن مستوى التعقيد يتوافق مع مستوى SAMER Level 3 (لغة بسيطة ومفهومة للمواطن العادي).
4. الحفاظ على المعنى الأصلي الكامل دون إضافة أو حذف معلومات.
5. إعادة النص المُحسَّن فقط، بدون أي شرح أو مقدمة أو تعليق.
لا تستخدم أي لغة غير العربية في إجابتك."""

# ── FastAPI app ────────────────────────────────────────────────
app = FastAPI(
    title="Tabsit API",
    description="Hybrid AraT5 + GPT-4o Arabic Text Simplification",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / Response schemas ─────────────────────────────────
class SimplifyRequest(BaseModel):
    text: str

class SimplifyResponse(BaseModel):
    simplified_text: str
    arat5_intermediate: str
    model_used: str = "AraT5v2 + GPT-4o"


# ── Phase 1: AraT5 simplification ─────────────────────────────
def run_arat5(text: str, max_len: int = 160, num_beams: int = 4) -> str:
    with torch.no_grad():
        enc = _tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=max_len,
        ).to(_device)
        gen = _model.generate(
            **enc,
            max_length=max_len,
            num_beams=num_beams,
            early_stopping=True,
            no_repeat_ngram_size=3,
        )
    return _tokenizer.decode(gen[0], skip_special_tokens=True)


# ── Phase 2: GPT-4o refinement ────────────────────────────────
def run_gpt4o(arat5_output: str) -> str:
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": GPT_SYSTEM_PROMPT},
            {"role": "user",   "content": arat5_output},
        ],
        temperature=0.0,
        max_tokens=512,
    )
    return response.choices[0].message.content.strip()


# ── Main endpoint ──────────────────────────────────────────────
@app.post("/simplify", response_model=SimplifyResponse)
async def simplify(request: SimplifyRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="النص فارغ.")
    if len(request.text) > 2000:
        raise HTTPException(status_code=400, detail="النص أطول من الحد المسموح (2000 حرف).")

    try:
        # Phase 1 — AraT5
        arat5_result = run_arat5(request.text)

        # Phase 2 — GPT-4o
        final_result = run_gpt4o(arat5_result)

        return SimplifyResponse(
            simplified_text=final_result,
            arat5_intermediate=arat5_result,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في المعالجة: {str(e)}")


# ── Health check ──────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "arat5_device": _device,
        "model_path": ARAT5_MODEL_PATH,
    }