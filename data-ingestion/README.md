# AbituriyentAI — Data Ingestion Pipeline

Bu modul UzBMB/DTM darslik PDFlarini yuklash, chunking va pgvector'ga saqlash uchun mo'ljallangan.

## Kerakli fayllar

```
data-ingestion/
├── pdfs/                    ← Bu yerga PDF fayllarni qo'ying
│   ├── ona_tili_11.pdf
│   ├── matematika_11.pdf
│   └── uzb_tarixi_11.pdf
├── ingest_pdf.py
├── requirements.txt
└── README.md
```

## O'rnatish

```bash
cd data-ingestion
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Konfiguratsiya

Asosiy katalogdagi `.env` faylida quyidagi o'zgaruvchilarni o'rnating:

```
DATABASE_SYNC_URL=postgresql+psycopg2://abituriyent:secret@localhost:5432/abituriyent_db
OPENAI_API_KEY=sk-your-key-here
```

## Foydalanish

### Bitta PDF yuklash:
```bash
python ingest_pdf.py --pdf pdfs/matematika_11.pdf --subject MATHEMATICS
python ingest_pdf.py --pdf pdfs/ona_tili_11.pdf --subject MOTHER_TONGUE
python ingest_pdf.py --pdf pdfs/uzb_tarixi_11.pdf --subject HISTORY
```

### Barcha PDFlarni yuklash:
```bash
python ingest_pdf.py --all
```

### Semantik qidiruv sinovi:
```bash
python ingest_pdf.py --search "Viyeta teoremasi"
python ingest_pdf.py --search "Amir Temur"
python ingest_pdf.py --search "ko'chma ma'no"
```

## PDF fayllarini olish

1. **Rasmiy manba**: [DTM rasmiy sayti](https://dtm.uz) — namunaviy test savollari
2. **O'quv dasturi**: O'zbekiston Xalq ta'limi vazirligi namunaviy dasturlari
3. **Darsliklar**: 11-sinf ona tili, matematika, O'zbekiston tarixi darsliklari

## Texnik ma'lumotlar

- **Embedding modeli**: OpenAI `text-embedding-3-small` (1536 o'lchamli)
- **Chunking**: 1000 ta belgi, 200 ta belgi overlap
- **Vektor indeks**: pgvector `ivfflat` cosine similarity
- **Saqlash**: PostgreSQL `document_chunks` jadvali

## Ma'lumotlar bazasi sxemasi

```sql
CREATE TABLE document_chunks (
    id          SERIAL PRIMARY KEY,
    subject     VARCHAR(50)  NOT NULL,  -- MOTHER_TONGUE | MATHEMATICS | HISTORY
    source_file VARCHAR(255) NOT NULL,
    chunk_index INTEGER      NOT NULL,
    content     TEXT         NOT NULL,
    embedding   vector(1536),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Eslatmalar

- PDFlarni yuklashdan oldin PostgreSQL va pgvector ishlab turganligini tekshiring
- `docker-compose up postgres` bilan ma'lumotlar bazasini ishga tushiring
- Katta PDFlar uchun to'liq ingestion 5-15 daqiqa olishi mumkin (API limitlari tufayli)
