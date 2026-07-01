# AbituriyentAI

O'zbekiston abituriyentlari uchun AI asosidagi imtihonga tayyorgarlik platformasi (BMBA 2026).
AI-powered university-entrance exam prep platform for Uzbekistan.

## Stack
- **Frontend:** Next.js 14 · TypeScript · Tailwind CSS
- **Backend:** FastAPI · SQLAlchemy (async) · PostgreSQL + pgvector
- **AI:** Google Gemini (Tutor, Hints, Appeals, Lessons) · Imagen (Canvas)

## Structure
- `frontend/` — Next.js web app
- `backend/` — FastAPI REST API
- `data-ingestion/` — textbook RAG ingestion

## Features
AI Tutor · DTM/BMBA exam simulation · 14 educational games (with sound) · spaced-repetition drills · personalized study plans · appeals (rights) · multilingual (uz/ru/en/qq).