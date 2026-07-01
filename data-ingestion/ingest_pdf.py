"""
AbituriyentAI — PDF Ingestion Pipeline
========================================
Loads UzBMB/DTM textbook PDFs, chunks the text,
generates Gemini Embedding embeddings (text-embedding-004),
and stores them in PostgreSQL/pgvector.

For scanned PDFs (images only), falls back to Gemini Vision OCR.

Usage:
    python ingest_pdf.py --pdf path/to/textbook.pdf --subject MATHEMATICS
    python ingest_pdf.py --all   # Process all PDFs in ./pdfs/ directory
    python ingest_pdf.py --search "Viyeta teoremasi"

Environment variables (see ../.env):
    DATABASE_SYNC_URL  — PostgreSQL connection string (psycopg2)
    GEMINI_API_KEY     — Google AI Studio API key
"""

import argparse
import os
import sys
import time
from pathlib import Path
from typing import Iterator

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

# ── Configuration ─────────────────────────────────────────────────────────────

DATABASE_URL: str = os.getenv(
    "DATABASE_SYNC_URL",
    "postgresql+psycopg2://abituriyent:abituriyent_secret@localhost:5432/abituriyent_db",
)
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
EMBEDDING_MODEL: str = "models/gemini-embedding-001"
EMBEDDING_DIM: int = 3072  # gemini-embedding-001 actual output dimension
CHUNK_SIZE: int = 1000
CHUNK_OVERLAP: int = 200


# ── PDF Loading ───────────────────────────────────────────────────────────────

def load_pdf_pymupdf(pdf_path: Path) -> str:
    """Extract full text from PDF using PyMuPDF."""
    import fitz
    doc = fitz.open(str(pdf_path))
    full_text = ""
    for page_num, page in enumerate(doc):
        text = page.get_text("text")
        full_text += f"\n\n[Sahifa {page_num + 1}]\n{text}"
    doc.close()
    return full_text


def load_pdf_with_gemini_vision(pdf_path: Path) -> str:
    """
    Extract text from scanned PDF by uploading to Gemini Files API.
    Used as fallback when PyMuPDF finds very little text (scanned/image PDFs).
    Processes in batches to handle large files.
    """
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=GEMINI_API_KEY)

    print(f"   Scanned PDF detected. Uploading to Gemini Files API for OCR...")
    print(f"   File size: {pdf_path.stat().st_size / 1024 / 1024:.1f} MB")

    # Upload the PDF file
    print(f"   Uploading {pdf_path.name}...")
    uploaded_file = client.files.upload(
        file=str(pdf_path),
        config={"mime_type": "application/pdf", "display_name": pdf_path.name},
    )

    # Wait for file to be processed
    print("   Waiting for Gemini to process the file...")
    while uploaded_file.state.name == "PROCESSING":
        time.sleep(3)
        uploaded_file = client.files.get(name=uploaded_file.name)

    if uploaded_file.state.name != "ACTIVE":
        print(f"   File processing failed: {uploaded_file.state}")
        return ""

    print("   File ready. Extracting text with Gemini Vision...")

    prompt = (
        "Bu PDF darslik kitobidan barcha matnni to'liq chiqarib ber. "
        "Faqat kitobdagi matnni qaytargin — hech qanday izoh, markup yoki formatlashsiz. "
        "Har bir sahifani '[Sahifa X]' ko'rinishida belgilab tur."
    )

    # Retry up to 3 times on 503
    response = None
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=[uploaded_file, prompt],
            )
            break
        except Exception as e:
            if "503" in str(e) and attempt < 2:
                print(f"   Model busy, retrying in 15s... (attempt {attempt + 1}/3)")
                time.sleep(15)
            else:
                raise

    # Clean up uploaded file
    try:
        client.files.delete(name=uploaded_file.name)
    except Exception:
        pass

    return response.text or ""


def load_pdf(pdf_path: Path) -> str:
    """Load PDF text, falling back to Gemini Vision for scanned PDFs."""
    try:
        text = load_pdf_pymupdf(pdf_path)
    except ImportError:
        print("   PyMuPDF not available, trying PyPDF2...")
        import PyPDF2
        text = ""
        with open(pdf_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for i, page in enumerate(reader.pages):
                text += f"\n\n[Sahifa {i + 1}]\n{page.extract_text() or ''}"

    # Check if text is suspiciously short (scanned/image-based PDF)
    file_mb = pdf_path.stat().st_size / 1024 / 1024
    chars_per_mb = len(text) / file_mb if file_mb > 0 else 0
    if chars_per_mb < 500 or len(text) < 5000:
        print(f"   Low text density ({len(text):,} chars from {pdf_path.stat().st_size / 1024 / 1024:.0f}MB) — using Gemini Vision OCR...")
        vision_text = load_pdf_with_gemini_vision(pdf_path)
        if len(vision_text) > len(text):
            return vision_text

    return text


# ── Text Chunking ─────────────────────────────────────────────────────────────

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> Iterator[str]:
    """Split text into overlapping chunks.
    Tries paragraph boundaries (\n\n), then line boundaries (\n),
    then falls back to character-level sliding window.
    """
    # Try double-newline split first; if that gives too few chunks, use single newlines
    separators = ["\n\n", "\n"]
    segments: list[str] = []
    for sep in separators:
        parts = [p.strip() for p in text.split(sep) if p.strip()]
        if len(parts) >= max(3, len(text) // chunk_size // 2):
            segments = parts
            break

    # Fallback: character-level sliding window
    if not segments or max(len(s) for s in segments) > chunk_size * 5:
        start = 0
        while start < len(text):
            end = min(start + chunk_size, len(text))
            yield text[start:end]
            start += chunk_size - overlap
        return

    current_chunk = ""
    for seg in segments:
        # If a single segment is larger than chunk_size, break it further
        if len(seg) > chunk_size:
            if current_chunk:
                yield current_chunk
                current_chunk = ""
            for i in range(0, len(seg), chunk_size - overlap):
                yield seg[i: i + chunk_size]
            continue

        if len(current_chunk) + len(seg) + 2 <= chunk_size:
            current_chunk += ("\n" if current_chunk else "") + seg
        else:
            if current_chunk:
                yield current_chunk
            overlap_text = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
            current_chunk = overlap_text + ("\n" if overlap_text else "") + seg

    if current_chunk:
        yield current_chunk


# ── Embeddings ────────────────────────────────────────────────────────────────

def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """Generate embeddings using Gemini text-embedding-004 (new SDK)."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set in .env")

    from google import genai

    client = genai.Client(api_key=GEMINI_API_KEY)
    all_embeddings: list[list[float]] = []
    batch_size = 100

    for i in range(0, len(texts), batch_size):
        batch = texts[i: i + batch_size]
        print(f"  Embedding batch {i // batch_size + 1}/{(len(texts) + batch_size - 1) // batch_size}...")
        result = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=batch,
        )
        all_embeddings.extend([e.values for e in result.embeddings])
        # Respect rate limit: 3K RPM
        if i + batch_size < len(texts):
            time.sleep(0.5)

    return all_embeddings


def generate_query_embedding(query: str) -> list[float]:
    """Generate a single query embedding for semantic search."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set in .env")

    from google import genai

    client = genai.Client(api_key=GEMINI_API_KEY)
    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=query,
    )
    return result.embeddings[0].values


# ── Database Storage ──────────────────────────────────────────────────────────

def get_db_connection():
    """Get a psycopg2 connection, handling both psycopg2:// and postgresql:// prefixes."""
    import psycopg2

    url = DATABASE_URL
    # Strip SQLAlchemy driver prefix
    for prefix in ("postgresql+psycopg2://", "postgresql+asyncpg://"):
        if url.startswith(prefix):
            url = "postgresql://" + url[len(prefix):]
            break

    return psycopg2.connect(url)


def ensure_table_exists():
    """Create document_chunks table and indexes if they don't exist."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE EXTENSION IF NOT EXISTS vector;

        CREATE TABLE IF NOT EXISTS document_chunks (
            id          SERIAL PRIMARY KEY,
            subject     VARCHAR(50)  NOT NULL,
            source_file VARCHAR(255) NOT NULL,
            chunk_index INTEGER      NOT NULL,
            content     TEXT         NOT NULL,
            embedding   vector(3072),
            created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS document_chunks_subject_idx
            ON document_chunks (subject);
    """)
    conn.commit()
    cur.close()
    conn.close()


def store_chunks_in_db(
    chunks: list[str],
    embeddings: list[list[float]],
    subject: str,
    source_file: str,
) -> int:
    """Store text chunks and embeddings in PostgreSQL with pgvector."""
    import psycopg2
    from psycopg2.extras import execute_values

    conn = get_db_connection()
    cur = conn.cursor()

    records = [
        (subject, source_file, idx, chunk, f"[{','.join(str(v) for v in emb)}]")
        for idx, (chunk, emb) in enumerate(zip(chunks, embeddings))
    ]

    execute_values(
        cur,
        """
        INSERT INTO document_chunks (subject, source_file, chunk_index, content, embedding)
        VALUES %s
        """,
        records,
        template="(%s, %s, %s, %s, %s::vector)",
    )

    inserted = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    return inserted


# ── Semantic Search ───────────────────────────────────────────────────────────

def search_similar_chunks(query: str, subject: str | None = None, top_k: int = 5) -> list[dict]:
    """Search for semantically similar document chunks."""
    import psycopg2.extras

    query_emb = generate_query_embedding(query)
    emb_str = f"[{','.join(str(v) for v in query_emb)}]"

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    if subject:
        cur.execute("""
            SELECT id, subject, source_file, chunk_index, content,
                   1 - (embedding <=> %s::vector) AS similarity
            FROM document_chunks
            WHERE subject = %s
            ORDER BY embedding <=> %s::vector
            LIMIT %s
        """, [emb_str, subject, emb_str, top_k])
    else:
        cur.execute("""
            SELECT id, subject, source_file, chunk_index, content,
                   1 - (embedding <=> %s::vector) AS similarity
            FROM document_chunks
            ORDER BY embedding <=> %s::vector
            LIMIT %s
        """, [emb_str, emb_str, top_k])

    results = [dict(r) for r in cur.fetchall()]
    cur.close()
    conn.close()
    return results


# ── Main Ingestion Pipeline ───────────────────────────────────────────────────

def ingest_single_pdf(pdf_path: Path, subject: str) -> None:
    """Full pipeline: load → chunk → embed → store."""
    print(f"\n{'=' * 60}")
    print(f"File: {pdf_path.name}  |  Subject: {subject}")
    print(f"{'=' * 60}")

    if not pdf_path.exists():
        print(f"ERROR: File not found: {pdf_path}")
        return

    print("1. Reading PDF text...")
    text = load_pdf(pdf_path)
    print(f"   {len(text):,} characters extracted.")

    if len(text) < 100:
        print("WARNING: Very little text extracted. Skipping this file.")
        return

    print("2. Chunking text...")
    chunks = list(chunk_text(text))
    print(f"   {len(chunks)} chunks created.")

    print("3. Generating embeddings...")
    ensure_table_exists()
    embeddings = generate_embeddings(chunks)
    print(f"   {len(embeddings)} vectors generated.")

    print("4. Storing in database...")
    inserted = store_chunks_in_db(chunks, embeddings, subject, pdf_path.name)
    print(f"   {inserted} rows stored.")

    print(f"\nDone: {pdf_path.name}")


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AbituriyentAI PDF Ingestion Pipeline")
    parser.add_argument("--pdf", type=Path, default=None, help="Path to PDF file")
    parser.add_argument("--subject", choices=["MOTHER_TONGUE", "MATHEMATICS", "HISTORY"], default=None)
    parser.add_argument("--search", type=str, default=None, help="Test semantic search")
    args = parser.parse_args()

    if args.search:
        print(f"Searching: '{args.search}'")
        results = search_similar_chunks(args.search, top_k=3)
        for i, r in enumerate(results, 1):
            print(f"\n{i}. Similarity: {r['similarity']:.3f} | Subject: {r['subject']}")
            print(f"   {r['content'][:200]}...")
    elif args.pdf and args.subject:
        ingest_single_pdf(args.pdf, args.subject)
    else:
        parser.print_help()
        print("\nExample:")
        print("  python ingest_pdf.py --pdf 'pdfs/Ona tili.pdf' --subject MOTHER_TONGUE")
