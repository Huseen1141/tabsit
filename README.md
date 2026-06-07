\# Tabsit — تبسيط 🌿

\### Hybrid Arabic Text Simplification Chatbot



A graduation project chatbot that simplifies Arabic government and insurance documents using a hybrid AI pipeline.



\*\*Built with:\*\* AraT5v2 (fine-tuned) + GPT-4o + FastAPI + React



\---



\## How It Works
User Input (complex Arabic text)

↓

\[Phase 1] AraT5v2 — fine-tuned on H\&M Government Corpus

→ Simplifies domain-specific terminology

↓

\[Phase 2] GPT-4o — SAMER Level 3 polish

→ Fixes grammar and natural phrasing

↓

Final simplified Arabic text

\---



\## Project Structure
tabsit/

├── backend/

│   ├── main.py          ← FastAPI pipeline

│   └── .env.example     ← Environment variables template

└── frontend/

└── src/

├── Chatbot.jsx  ← React component

├── Chatbot.css  ← Responsive RTL styles

└── App.js       ← Entry point

\---



\## Setup \& Run



\### Prerequisites

\- Python 3.11+

\- Node.js 18+

\- OpenAI API key



\---



\### Backend Setup



```bash

cd backend

python -m venv venv

venv\\Scripts\\activate

pip install fastapi uvicorn transformers torch openai python-dotenv sentencepiece

cp .env.example .env

uvicorn main:app --reload --port 8000

```



Backend runs at: http://localhost:8000



\---



\### Frontend Setup



```bash

cd frontend

npm install

npm start

```



Frontend runs at: http://localhost:3000



\---



\### Every time you want to run Tabsit:



Terminal 1 — Backend:

```bash

cd backend

venv\\Scripts\\activate

uvicorn main:app --reload --port 8000

```



Terminal 2 — Frontend:

```bash

cd frontend

npm start

```



\---



## Research Context

This chatbot is part of a graduation project on Advanced Arabic Text Simplification for government and insurance documents (National Insurance Institute), targeting SAMER Level 3 simplification standards.

---

## H&M Parallel Corpus — Dataset

The file `h&m parallel(Sheet1).csv` is the original parallel dataset built specifically for this project.

| Property | Value |
|---|---|
| Domain | Israeli National Insurance Institute (ביטוח לאומי) government forms |
| Language | Arabic |
| Size | 2,350 sentence pairs |
| Format | Complex sentence → Simplified sentence (SAMER Level 3) |
| Columns | النص الأصلي (Source - Complex) / النص المبسّط (Simplified - SAMER Level 3) |

### What the dataset contains:
- Official government form fields and instructions
- National Insurance benefit request forms
- Medical and hospitalization document sentences
- Bureaucratic Arabic terminology simplified to plain citizen-level language
- Bilingual context (Arabic text with some Hebrew form codes like ש״ת-22)

### Key statistics:
- After cleaning: 1,875 canonical pairs
- Train / Val / Test split: 1,500 / 187 / 188
- Mean source length: 12.2 words
- Mean Jaccard similarity: 0.354 (deep paraphrastic rewrites, not just synonym substitution)
- MTLD reduction: 18.27 → 13.64 (p < 0.001, statistically significant)

### Why this dataset matters:
No existing Arabic NLP dataset covers government and insurance documents at this level of specificity. SAMER (the standard Arabic simplification corpus) covers only literary and news text. This dataset fills that gap and enables domain adaptation of Arabic text simplification models.

---

## Models Used
- AraT5v2 fine-tuned on the H&M Parallel Corpus (1,875 sentence pairs)
- GPT-4o with in-domain few-shot prompting

## Evaluation Results (H&M test set)

| System | SARI | BLEU |
|---|---|---|
| AraT5 zero-shot (literary) | 41.07 | 19.24 |
| AraT5 fine-tuned (SAMER+H&M) | 53.47 | 21.27 |
| GPT-4o few-shot (in-domain) | 55.53 | 33.15 |
| GPT-4o few-shot (in-domain) | 55.53 | 33.15 |

