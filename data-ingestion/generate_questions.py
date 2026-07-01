"""
AbituriyentAI — Bulk Question Generator for Majburiy Blok (Mandatory Block)
============================================================================
Generates 200 questions per subject = 600 total, tailored to DTM mandatory
block level (NOT specialty level). Saves directly to the questions table.

Math: Grade 5-9 level — arithmetic, percentages, basic geometry
Ona Tili: Orthography, punctuation, lexicology, grammar
History: All 6 eras — 7th through 11th grade curriculum

Usage:
    python generate_questions.py --subject all
    python generate_questions.py --subject MATHEMATICS --count 200
    python generate_questions.py --subject MOTHER_TONGUE --count 200
    python generate_questions.py --subject HISTORY --count 200
"""

import argparse
import json
import os
import time
import psycopg2
from pathlib import Path
from dotenv import load_dotenv
from google import genai

load_dotenv(Path(__file__).parent.parent / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
DB_URL = os.getenv("DATABASE_SYNC_URL", "").replace("postgresql+psycopg2://", "postgresql://")

# ── Topic definitions for MANDATORY BLOCK level ───────────────────────────────

MATH_TOPICS = [
    # Numbers & Operations (40% of exam)
    {"topic": "Natural sonlar: qo'shish, ayirish, ko'paytirish, bo'lish", "tags": ["ARITHMETIC"], "difficulty": "EASY"},
    {"topic": "Kasr sonlar: oddiy va aralash kasrlar bilan amallar", "tags": ["ARITHMETIC"], "difficulty": "EASY"},
    {"topic": "O'nli kasrlar va yaxlitlash", "tags": ["ARITHMETIC"], "difficulty": "EASY"},
    {"topic": "Bo'linuvchanlik belgilari: 2, 3, 5, 9, 10 ga bo'linuvchanlik", "tags": ["ARITHMETIC"], "difficulty": "EASY"},
    {"topic": "Eng katta umumiy bo'luvchi (EKUB) va eng kichik umumiy karrali (EKUK)", "tags": ["ARITHMETIC"], "difficulty": "MEDIUM"},
    # Percentages & Ratios (30% of exam)
    {"topic": "Foiz masalalari: foizni topish, son va foizdan boshqasini topish", "tags": ["PERCENTAGE", "WORD_PROBLEM"], "difficulty": "MEDIUM"},
    {"topic": "Nisbat va mutanosiblik masalalari", "tags": ["PERCENTAGE", "WORD_PROBLEM"], "difficulty": "MEDIUM"},
    {"topic": "Chiziqli tenglamalar va tengsizliklar: noma'lumni topish", "tags": ["ALGEBRA"], "difficulty": "MEDIUM"},
    {"topic": "Harakat masalalari: tezlik, vaqt, masofa", "tags": ["WORD_PROBLEM"], "difficulty": "MEDIUM"},
    {"topic": "Ish va unumdorlik masalalari", "tags": ["WORD_PROBLEM"], "difficulty": "MEDIUM"},
    # Geometry (30% of exam)
    {"topic": "To'rtburchak va kvadratning yuzi va perimetri", "tags": ["GEOMETRY"], "difficulty": "EASY"},
    {"topic": "Uchburchakning yuzi va perimetri, uchburchak turları", "tags": ["GEOMETRY"], "difficulty": "EASY"},
    {"topic": "Aylana va doira: uzunlik va yuz formulalari (π ishlatiladi)", "tags": ["GEOMETRY"], "difficulty": "MEDIUM"},
    {"topic": "Ko'pburchaklar: ichki burchaklar yig'indisi, turlar", "tags": ["GEOMETRY"], "difficulty": "MEDIUM"},
    {"topic": "Kub va to'g'ri to'rtburchakli parallelepiped hajmi va yuzasi", "tags": ["GEOMETRY"], "difficulty": "MEDIUM"},
    {"topic": "Birliklar o'rtasida o'tkazish: uzunlik, yuza, hajm, massa, vaqt", "tags": ["UNIT_CONVERSION"], "difficulty": "EASY"},
    {"topic": "Sodda kombinatorika: tartiblar va tanlov masalalari", "tags": ["STATISTICS"], "difficulty": "MEDIUM"},
    {"topic": "O'rtacha qiymat va asosiy statistika tushunchalari", "tags": ["STATISTICS"], "difficulty": "EASY"},
    {"topic": "Koordinata o'qida nuqtalar va masofalar", "tags": ["GEOMETRY"], "difficulty": "MEDIUM"},
    {"topic": "Amaliy masalalar: chegirma, narx, soliq, ish haqi foizlari", "tags": ["PERCENTAGE", "WORD_PROBLEM"], "difficulty": "HARD"},
]

ONA_TILI_TOPICS = [
    # Orthography & Punctuation (40% of exam)
    {"topic": "Imlo qoidalari: apostrofning yozilishi va qo'llanishi", "tags": ["SPELLING"], "difficulty": "MEDIUM"},
    {"topic": "So'zlarni qo'shib va ajratib yozish qoidalari", "tags": ["SPELLING"], "difficulty": "MEDIUM"},
    {"topic": "Bosh harf bilan yozish qoidalari (nomlar, atamalar)", "tags": ["SPELLING"], "difficulty": "EASY"},
    {"topic": "Tinish belgilari: vergul ishlatilishi sodda gaplarda", "tags": ["PUNCTUATION"], "difficulty": "MEDIUM"},
    {"topic": "Tinish belgilari: qo'shma gaplarda vergul va nuqtali vergul", "tags": ["PUNCTUATION"], "difficulty": "HARD"},
    {"topic": "Ko'chirma va o'zlashtirma gaplarda tinish belgilari", "tags": ["PUNCTUATION"], "difficulty": "MEDIUM"},
    # Lexicology & Stylistics (40% of exam)
    {"topic": "Ko'chma ma'no va badiiy san'atlar: metafora, metonimiya, sifatlash", "tags": ["LEXICOLOGY", "FIGURATIVE_LANGUAGE"], "difficulty": "MEDIUM"},
    {"topic": "Sinonimlar, antonimlar va omonimlar", "tags": ["LEXICOLOGY"], "difficulty": "EASY"},
    {"topic": "Frazeologizmlar: ma'nosi va qo'llanishi", "tags": ["LEXICOLOGY"], "difficulty": "MEDIUM"},
    {"topic": "So'zning leksik ma'nosi va uslubiy bo'yog'i", "tags": ["LEXICOLOGY"], "difficulty": "MEDIUM"},
    {"topic": "Alisher Navoiy asarlari va g'azallari", "tags": ["LITERATURE", "CLASSIC", "NAVOI"], "difficulty": "MEDIUM"},
    {"topic": "Abdulla Qodiriy: O'tkan kunlar va asarlarining mavzusi", "tags": ["LITERATURE", "CLASSIC"], "difficulty": "MEDIUM"},
    {"topic": "Cho'lpon va Hamza Hakimzoda Niyoziy asarlari", "tags": ["LITERATURE", "CLASSIC"], "difficulty": "MEDIUM"},
    # Grammar (20% of exam)
    {"topic": "So'z turkumlari: ot, sifat, fe'l, ravish, olmosh, son", "tags": ["GRAMMAR"], "difficulty": "EASY"},
    {"topic": "Fe'l zamonlari va nisbat shakllari", "tags": ["GRAMMAR"], "difficulty": "MEDIUM"},
    {"topic": "Gap bo'laklari: ega, kesim, to'ldiruvchi, aniqlovchi, hol", "tags": ["GRAMMAR"], "difficulty": "MEDIUM"},
    {"topic": "Uyushiq bo'laklar va ularning tinish belgilari", "tags": ["GRAMMAR", "PUNCTUATION"], "difficulty": "HARD"},
    {"topic": "Qo'shma gaplar: bog'lovchili va bog'lovchisiz turlari", "tags": ["GRAMMAR"], "difficulty": "HARD"},
    {"topic": "So'z yasalishi: qo'shimchalar va so'z birikmasi", "tags": ["GRAMMAR"], "difficulty": "MEDIUM"},
    {"topic": "Matn tahlili: asosiy g'oya, uslub va janr belgilari", "tags": ["LEXICOLOGY"], "difficulty": "HARD"},
]

HISTORY_TOPICS = [
    # Ancient (ANCIENT)
    {"topic": "Qadimgi O'zbekiston: ibtidoiy jamoa va dastlabki davlatlar", "era_tag": "ANCIENT", "tags": ["ERA_ANCIENT"], "difficulty": "EASY"},
    {"topic": "Baqtriya, So'g'diyona, Xorazm qadimgi davlatlari", "era_tag": "ANCIENT", "tags": ["ERA_ANCIENT"], "difficulty": "MEDIUM"},
    {"topic": "Ahamoniylar va Iskandar Zulqarnayn bosqinlari", "era_tag": "ANCIENT", "tags": ["ERA_ANCIENT"], "difficulty": "MEDIUM"},
    {"topic": "Qang', Kushon, Eftaliylar davlatlari", "era_tag": "ANCIENT", "tags": ["ERA_ANCIENT"], "difficulty": "MEDIUM"},
    # Medieval (MEDIEVAL)
    {"topic": "Arab istilosiga qarshi kurash: Muqanna, Ro'stam qo'zg'olonlari", "era_tag": "MEDIEVAL", "tags": ["ERA_MEDIEVAL"], "difficulty": "MEDIUM"},
    {"topic": "Somoniylar davlati va madaniy yuksalish", "era_tag": "MEDIEVAL", "tags": ["ERA_MEDIEVAL"], "difficulty": "MEDIUM"},
    {"topic": "Qoraxoniylar, G'aznaviylar, Saljuqiylar davlatlari", "era_tag": "MEDIEVAL", "tags": ["ERA_MEDIEVAL"], "difficulty": "MEDIUM"},
    {"topic": "Mo'g'ullar istilosiga qarshilik va Chig'atoy ulusi", "era_tag": "MEDIEVAL", "tags": ["ERA_MEDIEVAL"], "difficulty": "MEDIUM"},
    {"topic": "Amir Temur va Temuriylar davlati", "era_tag": "MEDIEVAL", "tags": ["ERA_MEDIEVAL"], "difficulty": "MEDIUM"},
    {"topic": "Temuriylar davridagi fan, madaniyat va me'morchilik", "era_tag": "MEDIEVAL", "tags": ["ERA_MEDIEVAL"], "difficulty": "MEDIUM"},
    {"topic": "Shayboniylar va XVI-XVII asrlardagi davlatlar", "era_tag": "MEDIEVAL", "tags": ["ERA_MEDIEVAL"], "difficulty": "MEDIUM"},
    # Colonial (COLONIAL)
    {"topic": "XIX asrda Rossiya bosqini va xonliklarning tashkil topishi", "era_tag": "COLONIAL", "tags": ["ERA_COLONIAL"], "difficulty": "MEDIUM"},
    {"topic": "Mustamlaka davridagi milliy ozodlik harakatlari", "era_tag": "COLONIAL", "tags": ["ERA_COLONIAL"], "difficulty": "MEDIUM"},
    {"topic": "Jadidchilik harakati: Mahmudxo'ja Behbudiy, Munavvar qori", "era_tag": "COLONIAL", "tags": ["ERA_COLONIAL"], "difficulty": "MEDIUM"},
    {"topic": "1916 yilgi qo'zg'olon va Turkiston muxtoriyati", "era_tag": "COLONIAL", "tags": ["ERA_COLONIAL"], "difficulty": "HARD"},
    # Soviet (SOVIET)
    {"topic": "O'rta Osiyoning sovetlashtirilishi va milliy chegaralanish", "era_tag": "SOVIET", "tags": ["ERA_SOVIET"], "difficulty": "MEDIUM"},
    {"topic": "Sovet davridagi industriyalashtirish va kollektivlashtirish", "era_tag": "SOVIET", "tags": ["ERA_SOVIET"], "difficulty": "MEDIUM"},
    {"topic": "Ikkinchi jahon urushi va O'zbekiston xalqining hissasi", "era_tag": "SOVIET", "tags": ["ERA_SOVIET"], "difficulty": "MEDIUM"},
    {"topic": "Millatlararo munosabatlar va milliy madaniyatning bo'g'ilishi", "era_tag": "SOVIET", "tags": ["ERA_SOVIET"], "difficulty": "HARD"},
    # Independence (INDEPENDENCE)
    {"topic": "Mustaqillikning e'lon qilinishi: 1991 yil 31 avgust", "era_tag": "INDEPENDENCE", "tags": ["ERA_INDEPENDENCE"], "difficulty": "EASY"},
    {"topic": "Mustaqillikning dastlabki yillarida davlat qurilishi", "era_tag": "INDEPENDENCE", "tags": ["ERA_INDEPENDENCE"], "difficulty": "MEDIUM"},
    {"topic": "O'zbekiston Konstitusiyasi: 1992 yil qabul qilinishi", "era_tag": "INDEPENDENCE", "tags": ["ERA_INDEPENDENCE"], "difficulty": "MEDIUM"},
    {"topic": "Yangi mustaqil davlatda iqtisodiy islohotlar va bozor iqtisodiyoti", "era_tag": "INDEPENDENCE", "tags": ["ERA_INDEPENDENCE"], "difficulty": "MEDIUM"},
    # New Uzbekistan (NEW_UZBEKISTAN)
    {"topic": "Yangi O'zbekiston: 2016 yildan keyingi siyosiy islohotlar", "era_tag": "NEW_UZBEKISTAN", "tags": ["ERA_NEW_UZBEKISTAN"], "difficulty": "MEDIUM"},
    {"topic": "Prezident Shavkat Mirziyoyev: islohotlar va tashqi siyosat", "era_tag": "NEW_UZBEKISTAN", "tags": ["ERA_NEW_UZBEKISTAN"], "difficulty": "EASY"},
    {"topic": "Yangi O'zbekistonda ta'lim va iqtisodiy rivojlanish", "era_tag": "NEW_UZBEKISTAN", "tags": ["ERA_NEW_UZBEKISTAN"], "difficulty": "MEDIUM"},
    {"topic": "O'zbekistonning xalqaro munosabatlar va MDH hamkorligi", "era_tag": "NEW_UZBEKISTAN", "tags": ["ERA_NEW_UZBEKISTAN"], "difficulty": "MEDIUM"},
]

TOPICS = {
    "MATHEMATICS": MATH_TOPICS,
    "MOTHER_TONGUE": ONA_TILI_TOPICS,
    "HISTORY": HISTORY_TOPICS,
}

SUBJECT_LABELS = {
    "MATHEMATICS": "Matematika (majburiy blok — asosiy daraja)",
    "MOTHER_TONGUE": "Ona tili va adabiyot (majburiy blok)",
    "HISTORY": "O'zbekiston tarixi (majburiy blok)",
}

# ── Database ───────────────────────────────────────────────────────────────────

def get_conn():
    return psycopg2.connect(DB_URL)


def save_question(conn, q: dict, subject: str) -> int:
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO questions
            (subject, difficulty, question_text, option_a, option_b, option_c, option_d,
             correct_option, explanation, is_competency_based, tags, era_tag, source_decree)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (
        subject,
        q.get("difficulty", "MEDIUM"),
        q["question_text"],
        q["option_a"],
        q["option_b"],
        q["option_c"],
        q["option_d"],
        q["correct_option"],
        q["explanation"],
        q.get("is_competency_based", False),
        json.dumps(q.get("tags", []), ensure_ascii=False),
        q.get("era_tag"),
        "DTM majburiy blok 2025-2026",
    ))
    qid = cur.fetchone()[0]
    conn.commit()
    cur.close()
    return qid


# ── Generation ────────────────────────────────────────────────────────────────

def generate_batch(client, subject: str, topic_info: dict, batch_size: int = 10) -> list[dict]:
    """Generate multiple questions for a single topic in one API call."""
    subject_label = SUBJECT_LABELS[subject]
    topic = topic_info["topic"]
    difficulty = topic_info["difficulty"]
    tags = topic_info.get("tags", [])
    era_tag = topic_info.get("era_tag")
    diff_map = {"EASY": "Oson", "MEDIUM": "O'rta", "HARD": "Qiyin"}

    is_competency = difficulty == "HARD"

    prompt = f"""Siz DTM majburiy blok test savollari mutaxassisisiz.
Fan: {subject_label}
Mavzu: {topic}
Qiyinlik: {diff_map[difficulty]}
Savollar soni: {batch_size}

DTM majburiy blok savollari talablari:
- O'rta maktab (5-11-sinf) darajasida bo'lishi
- To'rtta javob varianti (A, B, C, D)
- Faqat bitta to'g'ri javob
- Real DTM imtihon uslubida
- Uzbekcha til (lotin yozuvi)

Faqat JSON massiv formatida qaytaring (boshqa matn yo'q):
[
  {{
    "question_text": "Savol matni bu yerda?",
    "option_a": "Birinchi variant",
    "option_b": "Ikkinchi variant",
    "option_c": "Uchinchi variant",
    "option_d": "To'rtinchi variant",
    "correct_option": "A",
    "explanation": "To'g'ri javob tushuntirishi (1-2 jumla)"
  }},
  ...
]"""

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            text = response.text.strip()
            # Strip markdown code fences if present
            if text.startswith("```"):
                lines = text.split("\n")
                end = -1 if lines[-1].strip() == "```" else len(lines)
                text = "\n".join(lines[1:end])

            questions = json.loads(text.strip())
            # Add metadata to each question
            for q in questions:
                q["difficulty"] = difficulty
                q["tags"] = tags
                q["era_tag"] = era_tag
                q["is_competency_based"] = is_competency
            return questions

        except json.JSONDecodeError as e:
            print(f"    JSON parse error: {e}. Raw: {text[:200]}")
            if attempt < 2:
                time.sleep(5)
        except Exception as e:
            if "503" in str(e) or "429" in str(e):
                wait = 20 * (attempt + 1)
                print(f"    API busy, waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f"    Error: {e}")
                break

    return []


# ── Main ──────────────────────────────────────────────────────────────────────

def generate_for_subject(subject: str, target_count: int = 200):
    client = genai.Client(api_key=GEMINI_API_KEY)
    conn = get_conn()
    topics = TOPICS[subject]

    # How many questions per topic
    per_topic = max(1, target_count // len(topics))
    # Some topics get one extra to reach the target
    extra = target_count - (per_topic * len(topics))

    print(f"\n{'='*60}")
    print(f"Generating {target_count} questions for {subject}")
    print(f"Topics: {len(topics)} | Per topic: {per_topic} (+{extra} extra)")
    print(f"{'='*60}")

    total_saved = 0
    for i, topic_info in enumerate(topics):
        batch_size = per_topic + (1 if i < extra else 0)
        print(f"\n[{i+1}/{len(topics)}] {topic_info['topic'][:60]} — {batch_size}q")

        questions = generate_batch(client, subject, topic_info, batch_size=batch_size)

        saved = 0
        for q in questions:
            try:
                qid = save_question(conn, q, subject)
                saved += 1
            except Exception as e:
                print(f"    DB save error: {e}")

        print(f"    Saved {saved}/{len(questions)}")
        total_saved += saved

        # Respect rate limits: ~2 RPM for safety
        if i < len(topics) - 1:
            time.sleep(3)

    conn.close()
    print(f"\n{'='*60}")
    print(f"DONE: {total_saved} questions saved for {subject}")
    print(f"{'='*60}")
    return total_saved


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bulk question generator for DTM mandatory block")
    parser.add_argument("--subject", choices=["MATHEMATICS", "MOTHER_TONGUE", "HISTORY", "all"], default="all")
    parser.add_argument("--count", type=int, default=200, help="Questions per subject")
    args = parser.parse_args()

    subjects = (
        ["MATHEMATICS", "MOTHER_TONGUE", "HISTORY"]
        if args.subject == "all"
        else [args.subject]
    )

    grand_total = 0
    for subject in subjects:
        saved = generate_for_subject(subject, args.count)
        grand_total += saved

    print(f"\n{'='*60}")
    print(f"GRAND TOTAL: {grand_total} questions generated and saved")
    print(f"{'='*60}")
