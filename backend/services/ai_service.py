"""
AbituriyentAI — Gemini AI Service (google-genai SDK)
====================================
Model routing:
  gemini-2.5-flash           → AI Tutor chat & lesson Q&A  (fast, 10K RPD)
  gemini-2.5-pro             → Appeals/Mediation deep explanations (best reasoning, 1K RPD)
  gemini-2.0-flash-lite      → Real-time exam hints  (ultra-fast, UNLIMITED RPD)
  gemini-embedding-001       → RAG textbook embeddings (UNLIMITED RPD, 3072-dim)
  imagen-4.0-fast-generate-preview-05-20 → Abituriyent Canvas image generation (70 RPD)
"""
import asyncio
import base64
import json
import logging

from google import genai
from google.genai import types

from config import settings

logger = logging.getLogger(__name__)

# ── Client singleton ──────────────────────────────────────────────────────────

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        if not settings.gemini_api_key:
            raise RuntimeError(
                "GEMINI_API_KEY muhit o'zgaruvchisi o'rnatilmagan. "
                ".env faylini tekshiring."
            )
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


# ── Subject labels ────────────────────────────────────────────────────────────

SUBJECT_LABELS_UZ: dict[str, str] = {
    "MOTHER_TONGUE": "Ona tili va adabiyot",
    "MATHEMATICS":   "Matematika",
    "HISTORY":       "O'zbekiston tarixi",
}

SUBJECT_LABELS_RU: dict[str, str] = {
    "MOTHER_TONGUE": "Родной язык и литература",
    "MATHEMATICS":   "Математика",
    "HISTORY":       "История Узбекистана",
}

SUBJECT_LABELS_EN: dict[str, str] = {
    "MOTHER_TONGUE": "Uzbek Language & Literature",
    "MATHEMATICS":   "Mathematics",
    "HISTORY":       "History of Uzbekistan",
}

SUBJECT_LABELS_QQ: dict[str, str] = {
    "MOTHER_TONGUE": "Óz tili hám ádebiyat",
    "MATHEMATICS":   "Matematika",
    "HISTORY":       "Ózbekistan tarıyxı",
}


def _subject_label(subject: str, language: str = "uz") -> str:
    if language in ("russian", "ru"):
        labels = SUBJECT_LABELS_RU
    elif language in ("english", "en"):
        labels = SUBJECT_LABELS_EN
    elif language in ("karakalpak (Qaraqalpaq tili)", "qq"):
        labels = SUBJECT_LABELS_QQ
    else:
        labels = SUBJECT_LABELS_UZ
    return labels.get(subject, subject)


def _extract_json(text: str) -> str:
    """Robustly extract JSON from a Gemini response that may be wrapped in markdown."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        inner = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
        text = "\n".join(inner).strip()
    # Fallback: find outermost { } or [ ]
    if not (text.startswith("{") or text.startswith("[")):
        start = min(
            (text.find("{") if text.find("{") != -1 else len(text)),
            (text.find("[") if text.find("[") != -1 else len(text)),
        )
        end = max(text.rfind("}"), text.rfind("]"))
        if start < end:
            text = text[start:end + 1]
    return text


def _lang_instruction(language: str) -> str:
    lang_lower = language.lower()
    if "russian" in lang_lower or lang_lower == "ru":
        return "Отвечайте на русском языке. Используйте понятный и простой язык."
    elif "english" in lang_lower or lang_lower == "en":
        return "Answer in English. Use clear and simple language."
    elif "karakalpak" in lang_lower or "qaraqalpaq" in lang_lower or lang_lower == "qq":
        return (
            "Jawabıńızdı Qaraqalpaq tilinde beriń. Anıq hám sadda til isletıń. "
            "Qaraqalpaq tili — Ózbekistanda (Qaraqalpaqstan avtonom respublikasında) "
            "sóyleniwshi túrkiy til."
        )
    else:
        return (
            "Javobingizni O'zbek tilida bering. Imkon qadar oddiy va tushunarli til ishlating. "
            "O'zbek imlo qoidalariga qat'iy rioya qiling: "
            "yillar defis bilan yoziladi (masalan: 2026-yil, 1917-yilda, 1991-yilning), "
            "asrlar ham defis bilan (XIX-asr, XX-asrda), "
            "tartib sonlar defis bilan (1-o'rin, 2-bob, 3-sinf), "
            "qo'shimchalar defis bilan emas, birga yoziladi."
        )


# ── 1. AI Tutor Chat  (gemini-2.5-flash) ─────────────────────────────────────

async def get_ai_tutor_response(
    question: str,
    subject: str,
    lesson_context: str | None = None,
    language: str = "uz",
) -> str:
    client = _get_client()
    subject_label = _subject_label(subject, language)

    # Build context: lesson page content + RAG textbook excerpts
    context_parts: list[str] = []

    if lesson_context:
        context_parts.append(f"Joriy dars mazmuni:\n{lesson_context[:2000]}")

    # RAG: search the ingested textbooks for relevant content
    rag_context = await search_textbook_context(question, subject, top_k=3)
    if rag_context:
        context_parts.append(f"Darslikdan tegishli mazmun:\n{rag_context}")

    context_block = (
        "\n\n--- Kontekst ---\n" + "\n\n".join(context_parts)
        if context_parts else ""
    )

    subject_format_hint = {
        "MATHEMATICS": (
            "- Formulalarni LaTeX bilan yozing: inline uchun $formula$, blok uchun $$formula$$\n"
            "- Yechim bosqichlarini **1. 2. 3.** raqamli ro'yxat bilan ko'rsating\n"
            "- Har bir qadam oldiga **Qadam N:** sarlavha qo'ying\n"
            "- Natija yoki javobni **qalin** yoki > blockquote bilan ajrating"
        ),
        "HISTORY": (
            "- Muhim sanalar va ismlarni **qalin** bilan ajrating\n"
            "- Voqealar ketma-ketligini ro'yxat yoki jadval shaklida bering\n"
            "- Sabab-oqibat bog'liqligini > blockquote ichida yozing\n"
            "- BMBA uchun muhim faktlarni ⭐ belgisi bilan belgilang"
        ),
        "MOTHER_TONGUE": (
            "- Grammatik qoidalarni **Qoida:** sarlavhasi bilan boshlang\n"
            "- Misollarni `kod` bloki ichida ko'rsating (masalan: `Men boraman — I go`)\n"
            "- Istisnolarni ⚠️ belgisi bilan belgilang\n"
            "- So'z tahlili uchun jadval ishlating"
        ),
    }.get(subject, "- Asosiy fikrlarni **qalin** bilan, ro'yxat va sarlavhalar bilan ajrating")

    prompt = f"""Siz AbituriyentAI platformasining ekspert AI o'qituvchisisiz.
O'zbekiston BMBA 2026 imtihoniga tayyorlanayotgan abituriyentlarga {subject_label} fanidan yordam berasiz.

{_lang_instruction(language)}{context_block}

**Talaba savoli:** {question}

**MUHIM — Javob formati (Markdown):**
- Javobni aniq strukturalangan Markdown formatida yazing
- Asosiy tushunchani ## sarlavha bilan boshlang
- Tushuntirish uchun tekis paragraflar ishlating
{subject_format_hint}
- Oxirida "💡 **BMBA uchun eslab qoling:**" bo'limi qo'shing (1-2 ta eng muhim fakt)
- Faqat Markdown ishlating, boshqa formatlash yo'q"""

    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=settings.gemini_tutor_model,
                contents=prompt,
            ),
            timeout=45.0,
        )
        return response.text
    except asyncio.TimeoutError:
        raise RuntimeError("AI xizmati javob bermadi (timeout). Iltimos, qayta urinib ko'ring.")
    except Exception as exc:
        logger.error("AI Tutor error: %s", exc)
        raise RuntimeError(f"AI javob berishda xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.") from exc


# ── 2. Appeals / Mediation  (gemini-2.5-pro) ─────────────────────────────────

async def get_ai_appeal_explanation(
    question_text: str,
    correct_option: str,
    correct_answer_text: str,
    subject: str,
    existing_explanation: str,
    is_competency_based: bool,
    source_decree: str,
    language: str = "uz",
) -> str:
    client = _get_client()
    subject_label = _subject_label(subject, language)
    comp_note = (
        " *(BMBA 2026 kompetensiyaga asoslangan savol)*"
        if is_competency_based else ""
    )

    prompt = f"""Siz BMBA 2026 imtihon standartlari bo'yicha {subject_label} mutaxassisisiz.
Abituriyent quyidagi savol bo'yicha rasmiy sharh so'radi.

{_lang_instruction(language)}

**Savol**{comp_note}: {question_text}
**To'g'ri javob**: {correct_option}) {correct_answer_text}
**Standart tushuntirish**: {existing_explanation}
**Manba hujjat**: {source_decree}

Quyidagi tuzilmada batafsil va rasmiy tushuntirish yozing:

### 1. To'g'ri javob asosi
### 2. Boshqa variantlar nima uchun noto'g'ri
### 3. Mavzu bo'yicha maslahat
### 4. Rasmiy manba

Rasmiy, ta'limga asoslangan tilda yozing. Markdown formatlamasidan foydalaning."""

    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=settings.gemini_appeals_model,
                contents=prompt,
            ),
            timeout=60.0,
        )
        return response.text
    except asyncio.TimeoutError:
        raise RuntimeError("AI xizmati javob bermadi (timeout). Iltimos, qayta urinib ko'ring.")
    except Exception as exc:
        logger.error("AI Appeals error: %s", exc)
        raise RuntimeError(f"AI murojaat tushuntirishida xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.") from exc


# ── 3. Real-time Exam Hints  (gemini-2.0-flash-lite) ─────────────────────────

async def get_exam_hint(
    question_text: str,
    subject: str,
    options: dict[str, str],
    language: str = "uz",
) -> str:
    client = _get_client()
    subject_label = _subject_label(subject, language)
    options_text = "\n".join([f"  {k}) {v}" for k, v in options.items()])

    prompt = f"""Siz {subject_label} bo'yicha yordamchi o'qituvchisiz.
{_lang_instruction(language)}

Savol: {question_text}
Variantlar:\n{options_text}

MUHIM: To'g'ri javobni BERMANG. Faqat 1-2 jumlada yo'naltiruvchi maslahat bering."""

    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=settings.gemini_hint_model,
                contents=prompt,
            ),
            timeout=25.0,
        )
        return response.text
    except asyncio.TimeoutError:
        raise RuntimeError("Maslahat xizmati javob bermadi (timeout).")
    except Exception as exc:
        logger.error("AI Hint error: %s", exc)
        raise RuntimeError(f"Maslahat olishda xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.") from exc


# ── 4. AI Question Generator  (gemini-2.5-pro) ───────────────────────────────

async def generate_question_with_ai(
    subject: str,
    topic: str,
    difficulty: str = "MEDIUM",
    is_competency_based: bool = False,
) -> dict:
    client = _get_client()
    subject_label = _subject_label(subject)
    comp_note = (
        "Kompetensiyaga asoslangan (tahlil, qo'llash, baholash darajasi)"
        if is_competency_based else "Bilim va tushunish darajasi"
    )
    difficulty_labels = {
        "EASY": "Oson", "MEDIUM": "O'rta", "HARD": "Qiyin"
    }

    prompt = f"""Siz BMBA 2026 test savollari mutaxassisisiz.
{subject_label} fanidan yangi test savoli yarating:

Fan: {subject_label} | Mavzu: {topic}
Qiyinlik: {difficulty_labels.get(difficulty, difficulty)} | Tur: {comp_note}

Faqat JSON formatida qaytaring (boshqa matn yo'q):
{{
  "question_text": "Savol matni",
  "option_a": "A variant",
  "option_b": "B variant",
  "option_c": "C variant",
  "option_d": "D variant",
  "correct_option": "A",
  "explanation": "Tushuntirish (2-4 jumla)",
  "tags": ["TAG1", "TAG2"]
}}"""

    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=settings.gemini_appeals_model,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            ),
            timeout=60.0,
        )
        return json.loads(_extract_json(response.text))
    except asyncio.TimeoutError:
        raise RuntimeError("AI xizmati javob bermadi (timeout).")
    except json.JSONDecodeError as exc:
        logger.error("AI question JSON parse error: %s", exc)
        raise RuntimeError("AI savol yaratishda format xatoligi.") from exc
    except Exception as exc:
        logger.error("AI question generation error: %s", exc)
        raise RuntimeError(f"Savol yaratishda xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.") from exc


# ── 5. AI Lesson Generator  (gemini-2.5-flash) ───────────────────────────────

# Enhanced topic lists per subject
TOPICS_BY_SUBJECT: dict[str, list[str]] = {
    "MOTHER_TONGUE": [
        "Fonetika: Unli va undosh tovushlar",
        "Imlo qoidalari: Qo'shib va ajratib yozish",
        "So'z turkumlari: Ot, sifat, fe'l, ravish",
        "Kelishiklar va ularning qo'llanishi",
        "Gap bo'laklari: Ega, kesim, to'ldiruvchi, aniqlovchi, hol",
        "Uyushiq bo'laklar va murojaat",
        "Qo'shma gaplar: Bog'lovchili va bog'lovchisiz",
        "Ko'chma ma'no va badiiy san'atlar",
        "Sinonimlar, antonimlar va omonimlar",
        "Frazeologizmlar va maqollar",
        "Alisher Navoiy: Hayoti va Xamsa",
        "Abdulla Qodiriy: O'tkan kunlar",
        "Cho'lpon: She'riyati va Kecha va kunduz",
        "Hamza Hakimzoda Niyoziy",
        "Abdulla Oripov: She'riyati",
        "G'azal: Tuzilishi va namunalar",
        "Ruboiy va qasida",
        "Aruz va barmoq vazni",
        "Jadidchilik adabiyoti",
        "Hozirgi o'zbek adabiyoti",
    ],
    "MATHEMATICS": [
        "Kvadrat tenglamalar va Viyeta teoremasi",
        "Tengsizliklar: chiziqli va kvadratik",
        "Modulli va kasr tengsizliklar",
        "Logarifm va ko'rsatkichli funksiyalar",
        "Trigonometrik funksiyalar va identiklar",
        "Trigonometrik tenglamalar",
        "Arifmetik progressiya",
        "Geometrik progressiya",
        "Kombinatorika: Permutatsiya va kombinatsiya",
        "Ehtimollik nazariyasi",
        "Funksiyalar: aniqlik sohasi va qiymatlar to'plami",
        "Pifagor teoremasi va to'g'ri burchakli uchburchak",
        "Uchburchak: yuzasi, perimetri, turlar",
        "To'g'ri to'rtburchak va parallelogramm",
        "Aylana va doira: yuz va uzunlik",
        "Ko'pburchaklar va ularning xossalari",
        "Koordinatalar: to'g'ri chiziq tenglamasi",
        "Harakat masalalari",
        "Ish va unumdorlik masalalari",
        "Foiz va nisbat masalalari",
    ],
    "HISTORY": [
        "Qadimgi O'zbekiston: Ilk davlatlar (Baqtriya, Sug'diyona, Xorazm)",
        "Buyuk Ipak yo'li va savdo",
        "Kushon davlati va buddizm",
        "Arab fathi va islomning tarqalishi",
        "Somoniylar davlati va ilm-fan",
        "Al-Xorazmiy va algebra",
        "Abu Ali ibn Sino va tibbiyot",
        "Abu Rayhon Beruniy",
        "Qoraxoniylar va G'aznaviylar",
        "Mo'g'ul istilosi va oqibatlari",
        "Amir Temur: Hayoti va davlati",
        "Temuriylar: Ulug'bek va Navoiy davri",
        "Shayboniylar va O'zbek xonliklari",
        "Buxoro, Xiva va Qo'qon xonliklari",
        "Rossiya bosqini va mustamlaka davr",
        "Jadidchilik harakati",
        "1916 yil qo'zg'oloni",
        "Sovet davri: 1924 yil chegaralash va O'zSSR",
        "Mustaqillik: 1991 yil",
        "Yangi O'zbekiston: Mirziyoyev davri islohotlari",
    ],
}

LENGTH_PARAMS = {
    "short":  {"word_target": 300,  "sections": 3, "label": "Qisqa (5 daqiqa)"},
    "medium": {"word_target": 600,  "sections": 5, "label": "O'rta (10 daqiqa)"},
    "deep":   {"word_target": 1200, "sections": 8, "label": "Chuqur (20 daqiqa)"},
}

DIFFICULTY_LABELS = {"easy": "Oson", "medium": "O'rta", "hard": "Qiyin"}


async def generate_ai_lesson(
    subject: str,
    topic: str,
    format_type: str = "text",    # "text" | "visual" | "audio"
    difficulty: str = "medium",
    language: str = "uz",
    length: str = "medium",
) -> dict:
    """
    Generate a full AI lesson using Gemini 2.5 Flash.
    Returns: { title, content_markdown, visual_blocks, tanga_reward, reading_time_minutes }
    """
    client = _get_client()
    subject_label = _subject_label(subject, language)
    lang_instr = _lang_instruction(language)
    lp = LENGTH_PARAMS.get(length, LENGTH_PARAMS["medium"])
    diff_label = DIFFICULTY_LABELS.get(difficulty, "O'rta")

    if format_type == "visual":
        prompt = f"""Siz AbituriyentAI platformasi uchun {subject_label} fanidan interaktiv dars yaratyapsiz.
{lang_instr}

Mavzu: **{topic}**
Qiyinlik: {diff_label} | Hajm: {lp['sections']} bo'lim

Faqat quyidagi JSON formatida qaytaring (boshqa matn yo'q):
{{
  "title": "Dars sarlavhasi",
  "summary": "2-3 jumlali qisqa xulosa",
  "blocks": [
    {{
      "type": "intro",
      "heading": "Kirish",
      "body": "Qisqa kirish matni"
    }},
    {{
      "type": "definition",
      "heading": "Asosiy ta'rif",
      "term": "Atama",
      "definition": "Ta'rif matni",
      "emoji": "📚"
    }},
    {{
      "type": "table",
      "heading": "Jadval",
      "columns": ["Ustun 1", "Ustun 2"],
      "rows": [["Qator 1 A", "Qator 1 B"]]
    }},
    {{
      "type": "formula",
      "heading": "Formula",
      "formula": "a² + b² = c²",
      "explanation": "Formula izohi"
    }},
    {{
      "type": "key_points",
      "heading": "Eslab qoling",
      "points": ["1-muhim fikr", "2-muhim fikr", "3-muhim fikr"]
    }},
    {{
      "type": "example",
      "heading": "Misol",
      "problem": "Misol matni",
      "solution": "Yechim"
    }}
  ],
  "reading_time_minutes": {lp['sections'] + 2}
}}

{lp['sections']} ta blok yarating. Har bir blok turi: intro, definition, table, formula, key_points, example, timeline, comparison."""

    else:  # text or audio — both use markdown
        prompt = f"""Siz AbituriyentAI platformasining AI o'qituvchisisiz.
{subject_label} fanidan BMBA 2026 dasturiga mos dars yarating.
{lang_instr}

Mavzu: **{topic}**
Qiyinlik: {diff_label} | Taxminiy so'z soni: {lp['word_target']}

Quyidagi tuzilmada yozing:
# [Sarlavha]

## 📌 Asosiy tushunchalar
[Ta'riflar va tushuntirishlar]

## 📊 Jadval / Qoida
[Jadval yoki asosiy qoidalar ro'yxati]

## ✏️ Misollar
[BMBA formatidagi misollar va yechimlar]

## 🧠 Eslab qoling
[3-5 ta muhim faktlar, formulalar yoki sanalar]

## 📝 BMBA uchun maslahat
[Imtihonda ko'p chiqadigan savollar haqida maslahat]

Markdown formatlashdan keng foydalaning: jadvallar, qalin matn, ro'yxatlar, kod bloklari."""

    try:
        if format_type == "visual":
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=settings.gemini_tutor_model,
                    contents=prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json"),
                ),
                timeout=45.0,
            )
        else:
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=settings.gemini_tutor_model,
                    contents=prompt,
                ),
                timeout=45.0,
            )
        text = response.text.strip()

        if format_type == "visual":
            try:
                data = json.loads(_extract_json(text))
            except json.JSONDecodeError:
                logger.warning("Visual JSON parse fallback used for topic: %s", topic)
                # Return as text lesson if visual parsing fails
                tanga = {"short": 25, "medium": 40, "deep": 70}.get(length, 40)
                return {
                    "title": topic,
                    "content_markdown": text,
                    "visual_blocks": [],
                    "reading_time_minutes": max(1, lp["word_target"] // 200),
                    "tanga_reward": tanga,
                    "format": "text",
                }
            tanga = {"short": 30, "medium": 50, "deep": 80}.get(length, 50)
            return {
                "title": data.get("title", topic),
                "content_markdown": data.get("summary", ""),
                "visual_blocks": data.get("blocks", []),
                "reading_time_minutes": data.get("reading_time_minutes", lp["sections"] + 2),
                "tanga_reward": tanga,
                "format": "visual",
            }
        else:
            # Extract title from first heading
            lines = text.split("\n")
            title = topic
            for line in lines:
                if line.startswith("# "):
                    title = line[2:].strip()
                    break
            tanga = {"short": 25, "medium": 40, "deep": 70}.get(length, 40)
            reading_time = max(1, lp["word_target"] // 200)
            return {
                "title": title,
                "content_markdown": text,
                "visual_blocks": [],
                "reading_time_minutes": reading_time,
                "tanga_reward": tanga,
                "format": format_type,
            }

    except asyncio.TimeoutError:
        raise RuntimeError("AI dars yaratishda timeout. Iltimos, qayta urinib ko'ring.")
    except json.JSONDecodeError as exc:
        logger.error("AI lesson visual JSON error: %s", exc)
        raise RuntimeError("AI dars yaratishda format xatoligi.") from exc
    except Exception as exc:
        logger.error("AI lesson generation error: %s", exc)
        raise RuntimeError(f"AI dars yaratishda xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.") from exc


async def generate_post_lesson_quiz(
    lesson_content: str,
    topic: str,
    subject: str,
    language: str = "uz",
    num_questions: int = 5,
) -> list[dict]:
    """Generate a post-lesson quiz based on the lesson content."""
    client = _get_client()
    subject_label = _subject_label(subject, language)
    lang_instr = _lang_instruction(language)
    content_excerpt = lesson_content[:4000]

    prompt = f"""Siz {subject_label} o'qituvchisisiz.
Quyidagi dars asosida {num_questions} ta test savoli yarating.
{lang_instr}

Dars mavzusi: {topic}
Dars matni:
{content_excerpt}

Faqat JSON massiv formatida qaytaring (boshqa matn yo'q):
[
  {{
    "question": "Savol matni",
    "options": {{"A": "Variant A", "B": "Variant B", "C": "Variant C", "D": "Variant D"}},
    "correct": "A",
    "explanation": "Nima uchun to'g'ri ekanligi (1-2 jumla)"
  }}
]

Savollar dars mazmuniga asoslangan bo'lsin. Qiyinlik: oson (2) + o'rta (2) + qiyin (1)."""

    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=settings.gemini_tutor_model,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            ),
            timeout=45.0,
        )
        return json.loads(_extract_json(response.text))
    except asyncio.TimeoutError:
        raise RuntimeError("AI test yaratishda timeout. Iltimos, qayta urinib ko'ring.")
    except Exception as exc:
        logger.error("Post-lesson quiz error: %s", exc)
        raise RuntimeError(f"Test yaratishda xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.") from exc


# ── 6. RAG Embedding  (gemini-embedding-001) ─────────────────────────────────

def generate_gemini_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Sync embedding generation for the data-ingestion pipeline.
    Dimension: 3072. Rate limit: 3K RPM, UNLIMITED RPD.
    """
    client = _get_client()
    all_embeddings: list[list[float]] = []
    batch_size = 100

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        print(f"  Embedding batch {i // batch_size + 1}/{(len(texts) + batch_size - 1) // batch_size}...")
        result = client.models.embed_content(
            model=settings.gemini_embedding_model,
            contents=batch,
            config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
        )
        all_embeddings.extend([e.values for e in result.embeddings])

    return all_embeddings


def generate_query_embedding(query: str) -> list[float]:
    """Single query embedding for semantic search."""
    client = _get_client()
    result = client.models.embed_content(
        model=settings.gemini_embedding_model,
        contents=query,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
    )
    return result.embeddings[0].values


async def search_textbook_context(query: str, subject: str, top_k: int = 3) -> str:
    """
    Async RAG: embed the query, do pgvector similarity search in document_chunks,
    return the top-k relevant textbook excerpts as a single formatted string.
    Returns empty string if no chunks are found (graceful degradation).
    """
    try:
        client = _get_client()

        # Generate query embedding (async)
        emb_result = await client.aio.models.embed_content(
            model=settings.gemini_embedding_model,
            contents=query,
        )
        emb = emb_result.embeddings[0].values
        emb_str = f"[{','.join(str(v) for v in emb)}]"

        # Vector similarity search via SQLAlchemy async engine
        from sqlalchemy import text
        from database import engine

        async with engine.connect() as conn:
            rows = await conn.execute(
                text("""
                    SELECT content,
                           1 - (embedding <=> :emb::vector) AS similarity
                    FROM document_chunks
                    WHERE subject = :subject
                    ORDER BY embedding <=> :emb::vector
                    LIMIT :top_k
                """),
                {"emb": emb_str, "subject": subject, "top_k": top_k},
            )
            chunks = rows.fetchall()

        if not chunks:
            return ""

        excerpts = []
        for i, (content, similarity) in enumerate(chunks, 1):
            excerpts.append(f"[Darslik parchasi {i} — o'xshashlik: {similarity:.0%}]\n{content[:600]}")

        return "\n\n".join(excerpts)

    except Exception as exc:
        logger.warning("RAG search failed (non-critical): %s", exc)
        return ""


# ── 7. Abituriyent Canvas  (Gemini 2.5 Flash → Imagen 4 Fast) ────────────────

async def generate_canvas(
    subject: str,
    topic: str,
    language: str = "uz",
) -> dict:
    """
    Generate an educational canvas for a given topic:
      1. Gemini 2.5 Flash  → structured infographic data (facts, timeline, description)
      2. Imagen 4 Fast      → illustrated background image for the topic
    Returns: { title, description, facts, timeline, image_base64, image_mime_type, subject, topic }
    """
    client = _get_client()
    subject_label = _subject_label(subject, language)
    lang_instr = _lang_instruction(language)

    # ── Step 1: Generate structured content ──────────────────────────────────
    content_prompt = f"""You are an educational expert on {subject_label}.

CRITICAL LANGUAGE INSTRUCTION: {lang_instr}
ALL text fields in your JSON response (title, description, facts labels and values, timeline events, key_figures) MUST be written in the language specified above. Do NOT use Uzbek unless instructed.

Topic: **{topic}**

Return ONLY valid JSON (no other text):
{{
  "title": "Short topic title (5-8 words) in the required language",
  "description": "2-3 sentence clear definition in the required language",
  "facts": [
    {{"label": "Fact name in required language", "value": "Value or explanation in required language"}},
    {{"label": "Date/Year label", "value": "..."}},
    {{"label": "Key person/place label", "value": "..."}}
  ],
  "timeline": [
    {{"year": "Date", "event": "Short event description in required language"}},
    {{"year": "Date", "event": "Short event description in required language"}}
  ],
  "key_figures": ["Person 1 name", "Person 2 name"],
  "imagen_prompt": "Detailed English description for a purely visual educational illustration about this topic. Style: textbook illustration, colorful painting, encyclopaedia artwork. Show specific objects, places, people, and scenes relevant to the topic — NO text, NO letters, NO words, NO labels, NO banners, NO inscriptions, NO captions, NO writing of any kind anywhere in the image. Only visual elements: people, objects, landscapes, symbols. Rich colors, clear composition."
}}

Include 5-7 key facts in the facts array.
Include 3-5 key dates/events in the timeline array (if non-historical topic, use stages/milestones).
imagen_prompt must always be in English and very detailed (50-80 words). CRITICAL: imagen_prompt must explicitly end with: "No text, no letters, no words, no writing of any kind in the image."
"""

    try:
        content_resp = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=settings.gemini_tutor_model,
                contents=content_prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            ),
            timeout=45.0,
        )
        data = json.loads(_extract_json(content_resp.text))
    except asyncio.TimeoutError:
        raise RuntimeError("Canvas yaratishda timeout. Iltimos, qayta urinib ko'ring.")
    except Exception as exc:
        logger.error("Canvas content generation error: %s", exc)
        raise RuntimeError(f"Canvas mazmunini yaratishda xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.") from exc

    _raw_prompt = data.get(
        "imagen_prompt",
        f"Educational illustration about {topic} from {subject_label}. "
        "Textbook style, colorful, detailed encyclopaedia painting.",
    )
    # Always enforce no-text at the end to override any text the AI might have included
    _no_text_suffix = " No text, no letters, no words, no labels, no captions, no writing anywhere in the image."
    imagen_prompt = _raw_prompt.rstrip(".") + _no_text_suffix

    # ── Step 2: Build Pollinations.ai image URL (free, no binary serving) ───────
    import urllib.parse
    _seed = abs(hash(topic)) % 1_000_000
    _encoded = urllib.parse.quote(imagen_prompt, safe="")
    image_url = (
        f"https://image.pollinations.ai/prompt/{_encoded}"
        f"?width=1024&height=576&nologo=true&seed={_seed}"
    )
    print(f"[CANVAS IMG] pollinations url built seed={_seed}", flush=True)

    return {
        "title":          data.get("title", topic),
        "description":    data.get("description", ""),
        "facts":          data.get("facts", []),
        "timeline":       data.get("timeline", []),
        "key_figures":    data.get("key_figures", []),
        "image_url":      image_url,
        "imagen_prompt":  imagen_prompt,
        "subject":        subject,
        "topic":          topic,
    }


# ── 8. Study Plan AI Advice  (Gemini 2.5 Flash) ───────────────────────────────

async def generate_study_advice(
    weak_topics: list[dict],
    days_remaining: int,
    exam_date: str,
    language: str = "uz",
) -> dict:
    """
    Generate personalized AI study advice based on weak topics and exam countdown.
    Returns: { daily_focus, weekly_plan, motivational_message, priority_topics, study_technique }
    """
    client = _get_client()
    lang_instr = _lang_instruction(language)

    if weak_topics:
        weak_list = "\n".join(
            f"- {t.get('subject_label', t['subject'])}: {t.get('tag_label', t['tag'])} "
            f"({round(t.get('accuracy', 0) * 100)}% to'g'ri)"
            for t in weak_topics[:10]
        )
    else:
        weak_list = "- Hali imtihon topshirilmagan; zaif mavzular aniqlanmagan"

    prompt = f"""Siz AbituriyentAI platformasining shaxsiy o'quv maslahatchisisiz.
{lang_instr}

Talabaning holati:
- BMBA imtihonigacha: {days_remaining} kun qoldi
- Imtihon sanasi: {exam_date}
- Zaif mavzular (past natijali):
{weak_list}

Faqat quyidagi JSON formatida shaxsiy maslahat bering (boshqa matn yo'q):
{{
  "daily_focus": "Bugungi kunda nima qilish kerakligi haqida 2-3 jumlali aniq maslahat (zaif mavzularga asoslangan)",
  "weekly_plan": [
    "1-kun: [mavzu] — [tavsiya etilgan faoliyat]",
    "2-kun: [mavzu] — [tavsiya etilgan faoliyat]",
    "3-kun: [mavzu] — [tavsiya etilgan faoliyat]",
    "4-kun: [mavzu] — [tavsiya etilgan faoliyat]",
    "5-kun: [mavzu] — [tavsiya etilgan faoliyat]",
    "6-kun: [mavzu] — [tavsiya etilgan faoliyat]",
    "7-kun: Haftani yakunlash — mini-test va takrorlash"
  ],
  "motivational_message": "Shaxsiy motivatsion xabar (2-3 jumla, aniq sana va mavzularga asoslangan)",
  "priority_topics": ["Eng muhim mavzu 1", "Eng muhim mavzu 2", "Eng muhim mavzu 3"],
  "study_technique": "Ushbu ta'lim holatiga mos o'quv texnikasi va uni qo'llash usuli (2-3 jumla)"
}}"""

    try:
        response = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=settings.gemini_tutor_model,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            ),
            timeout=45.0,
        )
        return json.loads(_extract_json(response.text))
    except asyncio.TimeoutError:
        raise RuntimeError("AI maslahat yaratishda timeout.")
    except Exception as exc:
        logger.error("Study advice generation error: %s", exc)
        raise RuntimeError(f"AI maslahat yaratishda xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.") from exc


# ── 9. Games — Matching Pairs ─────────────────────────────────────────────────

async def generate_matching_pairs(
    subject: str,
    topic: str = "",
    language: str = "uz",
) -> dict:
    """Generate 8 term↔definition matching pairs for the given subject/topic."""
    client = _get_client()
    subject_label = _subject_label(subject, language)
    lang_instr = _lang_instruction(language)
    topic_clause = f"Mavzu: {topic}" if topic else "Ixtiyoriy mavzu"

    prompt = f"""Siz {subject_label} fani bo'yicha o'quv o'yini yaratyapsiz.
{lang_instr}
{topic_clause}

Juftlik topish o'yini uchun 8 ta juft yarating.
Faqat quyidagi JSON formatida qaytaring (boshqa matn yo'q):
{{
  "topic": "Mavzu nomi",
  "pairs": [
    {{"left": "Atama yoki savol", "right": "Ta'rif yoki javob"}},
    {{"left": "...", "right": "..."}}
  ]
}}

Qoidalar:
- "left" tomonida: atama, sana, formula, shaxs ismi, tushuncha
- "right" tomonida: ta'rif, voqea, izohi, natija
- Har bir juft aniq va bir xil bo'lmasin
- BMBA dasturiga mos bo'lsin
- 8 ta juft bo'lsin"""

    try:
        resp = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=settings.gemini_tutor_model,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            ),
            timeout=45.0,
        )
        return json.loads(_extract_json(resp.text))
    except asyncio.TimeoutError:
        raise RuntimeError("O'yin yaratishda timeout.")
    except Exception as exc:
        logger.error("Matching pairs generation error: %s", exc)
        raise RuntimeError(f"Juftlik o'yini yaratishda xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.") from exc


# ── 10. Games — Crossword ─────────────────────────────────────────────────────

async def generate_crossword_data(
    subject: str,
    topic: str = "",
    language: str = "uz",
) -> dict:
    """
    Generate a simple crossword: 8 words with clues, pre-laid in a 15x15 grid.
    Returns { grid: list[list[str]], clues: list[{number,clue,answer,row,col,direction,length}] }
    """
    client = _get_client()
    subject_label = _subject_label(subject, language)
    lang_instr = _lang_instruction(language)
    topic_clause = f"Mavzu: {topic}" if topic else ""

    prompt = f"""Siz {subject_label} fani bo'yicha krossvord o'yini yaratyapsiz.
{lang_instr}
{topic_clause}

8 ta so'z va ularning izohini yarating. So'zlar faqat lotin yoki kirill harflarida, bo'sh joy bo'lmasdan.
Faqat quyidagi JSON formatida qaytaring (boshqa matn yo'q):
{{
  "words": [
    {{"word": "ALGEBRA", "clue": "Matematik fan sohasi, tenglamalar bilan ishlaydi"}},
    {{"word": "TEOREMA", "clue": "Isbotlangan matematik hukm"}},
    {{"word": "...", "clue": "..."}}
  ]
}}

Qoidalar:
- So'zlar 4-10 harf bo'lsin
- So'zlar BMBA faniga aloqador atamalar bo'lsin
- So'zlarda faqat A-Z lotin harflari yoki O'zbek kirill harflari (lotin afzal)
- Izohlar qisqa va aniq bo'lsin (1 jumla)
- 8 ta so'z bo'lsin"""

    try:
        resp = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=settings.gemini_tutor_model,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            ),
            timeout=60.0,
        )
        data = json.loads(_extract_json(resp.text))
    except asyncio.TimeoutError:
        raise RuntimeError("Krossvord yaratishda timeout.")
    except Exception as exc:
        logger.error("Crossword generation error: %s", exc)
        raise RuntimeError(f"Krossvord yaratishda xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.") from exc

    # Build a simple grid layout
    words = [{"word": w["word"].upper().replace(" ", ""), "clue": w["clue"]}
             for w in data.get("words", [])]
    grid, clues = _layout_crossword(words)
    return {"grid": grid, "clues": clues}


def _layout_crossword(words: list[dict]) -> tuple[list[list[str]], list[dict]]:
    """Place words in a 15x15 grid, alternating across/down."""
    SIZE = 15
    grid = [["" for _ in range(SIZE)] for _ in range(SIZE)]
    clues: list[dict] = []
    placed: list[dict] = []

    def can_place(word: str, row: int, col: int, direction: str) -> bool:
        for i, ch in enumerate(word):
            r = row + (i if direction == "down" else 0)
            c = col + (i if direction == "across" else 0)
            if r >= SIZE or c >= SIZE or r < 0 or c < 0:
                return False
            if grid[r][c] not in ("", ch):
                return False
        return True

    def do_place(word: str, row: int, col: int, direction: str):
        for i, ch in enumerate(word):
            r = row + (i if direction == "down" else 0)
            c = col + (i if direction == "across" else 0)
            grid[r][c] = ch

    num = 1
    for idx, entry in enumerate(words):
        word = entry["word"]
        clue = entry["clue"]
        placed_flag = False

        if idx == 0:
            # Place first word across in the middle
            row, col = SIZE // 2, (SIZE - len(word)) // 2
            if can_place(word, row, col, "across"):
                do_place(word, row, col, "across")
                placed.append({"word": word, "row": row, "col": col, "direction": "across"})
                clues.append({"number": num, "clue": clue, "answer": word,
                               "row": row, "col": col, "direction": "across", "length": len(word)})
                num += 1
                placed_flag = True
        else:
            # Try to intersect with an already-placed word
            direction = "down" if idx % 2 == 1 else "across"
            for p in placed:
                for pi, pch in enumerate(p["word"]):
                    for wi, wch in enumerate(word):
                        if pch != wch:
                            continue
                        if direction == "down":
                            row = p["row"] + (pi if p["direction"] == "down" else 0) - wi
                            col = p["col"] + (pi if p["direction"] == "across" else 0)
                        else:
                            row = p["row"] + (pi if p["direction"] == "down" else 0)
                            col = p["col"] + (pi if p["direction"] == "across" else 0) - wi
                        if can_place(word, row, col, direction):
                            do_place(word, row, col, direction)
                            placed.append({"word": word, "row": row, "col": col, "direction": direction})
                            clues.append({"number": num, "clue": clue, "answer": word,
                                           "row": row, "col": col, "direction": direction, "length": len(word)})
                            num += 1
                            placed_flag = True
                            break
                    if placed_flag:
                        break
                if placed_flag:
                    break

            if not placed_flag:
                # Fallback: place freely
                direction = "down" if idx % 2 == 1 else "across"
                for r in range(1, SIZE - len(word) - 1):
                    for c in range(1, SIZE - len(word) - 1):
                        if can_place(word, r, c, direction):
                            do_place(word, r, c, direction)
                            placed.append({"word": word, "row": r, "col": c, "direction": direction})
                            clues.append({"number": num, "clue": clue, "answer": word,
                                           "row": r, "col": c, "direction": direction, "length": len(word)})
                            num += 1
                            placed_flag = True
                            break
                    if placed_flag:
                        break

    # Fill black cells
    placed_cells: set[tuple[int, int]] = set()
    for p in placed:
        for i in range(len(p["word"])):
            r = p["row"] + (i if p["direction"] == "down" else 0)
            c = p["col"] + (i if p["direction"] == "across" else 0)
            placed_cells.add((r, c))
    for r in range(SIZE):
        for c in range(SIZE):
            if grid[r][c] == "" and (r, c) not in placed_cells:
                grid[r][c] = "#"

    return grid, clues


# ── 11. Games — Hangman ───────────────────────────────────────────────────────

async def generate_hangman_word(
    subject: str,
    language: str = "uz",
) -> dict:
    """Generate a single word + hint for the hangman game."""
    client = _get_client()
    subject_label = _subject_label(subject, language)
    lang_instr = _lang_instruction(language)

    prompt = f"""Siz {subject_label} fani bo'yicha "Osib o'ldirish" (Hangman) o'yini uchun so'z tanlayapsiz.
{lang_instr}

Faqat quyidagi JSON formatida qaytaring (boshqa matn yo'q):
{{
  "word": "ALGEBRA",
  "hint": "Matematik fan sohasi, x va y kabi noma'lum sonlar bilan ishlaydi"
}}

Qoidalar:
- So'z faqat lotin harflarida bo'lsin (A-Z), bo'sh joy bo'lmasdan
- So'z 4-12 harf oralig'ida bo'lsin
- BMBA {subject_label} faniga oid atama yoki tushuncha bo'lsin
- Izoh 1 jumlada bo'lsin, so'zning o'zini aytmasdan tushuntirsin"""

    try:
        resp = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=settings.gemini_tutor_model,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            ),
            timeout=30.0,
        )
        return json.loads(_extract_json(resp.text))
    except asyncio.TimeoutError:
        raise RuntimeError("O'yin yaratishda timeout.")
    except Exception as exc:
        logger.error("Hangman word generation error: %s", exc)
        raise RuntimeError(f"So'z yaratishda xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.") from exc


# ── 12. Games — True / False Blitz ────────────────────────────────────────────

async def generate_true_false(
    subject: str,
    language: str = "uz",
    count: int = 10,
) -> list[dict]:
    """Generate T/F statements for the blitz game."""
    client = _get_client()
    subject_label = _subject_label(subject, language)
    lang_instr = _lang_instruction(language)

    prompt = f"""Siz {subject_label} fani bo'yicha "Ha/Yo'q" (True/False) o'yini uchun {count} ta savol tayyorlayapsiz.
{lang_instr}

Faqat quyidagi JSON massivini qaytaring (boshqa matn yo'q):
[
  {{"statement": "...", "is_true": true, "explanation": "..."}},
  ...
]

Qoidalar:
- Har bir gap aniq va bir ma'noli bo'lsin
- Taxminan yarmi to'g'ri (true), yarmi noto'g'ri (false) bo'lsin
- {subject_label} fanining BMBA dasturi doirasida bo'lsin
- Tushuntirish qisqacha (1 jumla) bo'lsin
- Aynan {count} ta element qaytaring"""

    try:
        resp = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=settings.gemini_tutor_model,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            ),
            timeout=35.0,
        )
        data = json.loads(_extract_json(resp.text))
        for i, item in enumerate(data):
            item["id"] = i + 1
        return data
    except asyncio.TimeoutError:
        raise RuntimeError("O'yin yaratishda timeout.")
    except Exception as exc:
        logger.error("True/False generation error: %s", exc)
        raise RuntimeError(f"Savol yaratishda xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.") from exc


# ── 13. Games — Fill in the Blank ─────────────────────────────────────────────

async def generate_fill_blank(
    subject: str,
    language: str = "uz",
    count: int = 8,
) -> list[dict]:
    """Generate fill-in-the-blank questions."""
    client = _get_client()
    subject_label = _subject_label(subject, language)
    lang_instr = _lang_instruction(language)

    prompt = f"""Siz {subject_label} fani bo'yicha "Bo'sh joy to'ldiring" o'yini uchun {count} ta savol tayyorlayapsiz.
{lang_instr}

Faqat quyidagi JSON massivini qaytaring (boshqa matn yo'q):
[
  {{
    "sentence": "Suvning kimyoviy formulasi ___ dir.",
    "answer": "H2O",
    "options": ["H2O", "CO2", "NaCl", "O2"],
    "explanation": "Suv ikki vodorod va bir kislorod atomidan tashkil topgan."
  }},
  ...
]

Qoidalar:
- Gapda bo'sh joy ___ bilan ko'rsatilsin
- 4 ta variant bo'lsin, bitta to'g'ri
- {subject_label} fanining BMBA dasturi doirasida bo'lsin
- Variantlar o'xshash, tanlov qiyin bo'lsin
- Aynan {count} ta element qaytaring"""

    try:
        resp = await asyncio.wait_for(
            client.aio.models.generate_content(
                model=settings.gemini_tutor_model,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json"),
            ),
            timeout=35.0,
        )
        data = json.loads(_extract_json(resp.text))
        for i, item in enumerate(data):
            item["id"] = i + 1
        return data
    except asyncio.TimeoutError:
        raise RuntimeError("O'yin yaratishda timeout.")
    except Exception as exc:
        logger.error("Fill-blank generation error: %s", exc)
        raise RuntimeError(f"Savol yaratishda xatolik yuz berdi. Iltimos, birozdan so'ng qayta urinib ko'ring.") from exc
