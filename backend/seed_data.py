"""
Seed script for AbituriyentAI.

Inserts sample questions for all 3 subjects (5 per subject = 15 total).
Includes:
  - 1 competency-based question with LOGIC tag (Math)
  - 1 question with era_tag="NEW_UZBEKISTAN" (History)
  - Sample lessons for each subject

Run: python seed_data.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from config import settings
from database import Base
from models.question import Question, Subject, Difficulty
from models.lesson import Lesson


async def create_tables(engine) -> None:
    async with engine.begin() as conn:
        await conn.execute(__import__("sqlalchemy").text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)


SAMPLE_QUESTIONS: list[dict] = [
    # ─── ONA TILI VA ADABIYOT (10 ta) ────────────────────────────────────────
    {
        "subject": Subject.MOTHER_TONGUE,
        "difficulty": Difficulty.MEDIUM,
        "question_text": (
            "Quyidagi gapda qaysi so'z ko'chma ma'noda ishlatilgan?\n"
            "«Uning yuragi toshday qotib qoldi.»"
        ),
        "option_a": "yuragi",
        "option_b": "toshday",
        "option_c": "qotib",
        "option_d": "qoldi",
        "correct_option": "A",
        "explanation": (
            "'Yuragi' so'zi bu gapda ko'chma ma'noda ishlatilgan — bu erda anatomik "
            "organ emas, balki 'hissiyot', 'tuyg'u' ma'nosini anglatadi. "
            "Ko'chma ma'no — so'zning o'zining asosiy ma'nosidan boshqa ma'noda qo'llanishi."
        ),
        "is_competency_based": False,
        "tags": ["LEXICOLOGY", "FIGURATIVE_LANGUAGE"],
        "era_tag": None,
        "source_decree": "O'zMB Ona tili dasturi 2023 §2.4 — Leksikologiya",
    },
    {
        "subject": Subject.MOTHER_TONGUE,
        "difficulty": Difficulty.EASY,
        "question_text": (
            "Quyidagi qatorlardan qaysi birida barcha so'zlar imlo jihatidan to'g'ri yozilgan?"
        ),
        "option_a": "ko'rinish, bilim, ilm-fan, aql-idrok",
        "option_b": "ko'rinish, bilim, ilmfan, aql idrok",
        "option_c": "ko'rinish, bilim, ilm fan, aqlidrok",
        "option_d": "ko'rinish, bilim, ilm-fan, aqlidrok",
        "correct_option": "A",
        "explanation": (
            "Qoida: ikki mustaqil so'zdan tashkil topgan qo'shma so'zlar tire bilan yoziladi. "
            "'Ilm-fan' va 'aql-idrok' — juft so'zlar bo'lib tire bilan yoziladi. "
            "A variantida barcha so'zlar to'g'ri yozilgan."
        ),
        "is_competency_based": False,
        "tags": ["SPELLING", "ORTHOGRAPHY"],
        "era_tag": None,
        "source_decree": None,
    },
    {
        "subject": Subject.MOTHER_TONGUE,
        "difficulty": Difficulty.HARD,
        "question_text": (
            "Abdulla Qodiriyning «O'tkan kunlar» romani qaysi yilda nashr etilgan va "
            "asarning bosh qahramonlari kimlar?"
        ),
        "option_a": "1925-yil; Otabek va Kumush",
        "option_b": "1926-yil; Anvar va Rano",
        "option_c": "1924-yil; Hamid va Zulfiya",
        "option_d": "1927-yil; Yusuf va Nargiza",
        "correct_option": "A",
        "explanation": (
            "Abdulla Qodiriyning «O'tkan kunlar» romani 1925-yilda to'liq nashr etilgan. "
            "Asarning bosh qahramonlari — Otabek va Kumush. Bu roman o'zbek adabiyotidagi "
            "birinchi realistik roman hisoblanadi va XIX asr Toshkent hayotini tasvirlaydi."
        ),
        "is_competency_based": False,
        "tags": ["LITERATURE", "CLASSIC"],
        "era_tag": None,
        "source_decree": None,
    },
    {
        "subject": Subject.MOTHER_TONGUE,
        "difficulty": Difficulty.MEDIUM,
        "question_text": (
            "Quyidagi gapda nechta uyushiq bo'lak bor?\n"
            "«Bog'da olma, nok, o'rik va shaftoli daraxtlari o'sadi.»"
        ),
        "option_a": "4",
        "option_b": "3",
        "option_c": "2",
        "option_d": "5",
        "correct_option": "A",
        "explanation": (
            "Uyushiq bo'laklar — bir xil vazifani bajaruvchi va bitta so'roqqa javob beruvchi "
            "bo'laklar. Bu gapda 'olma, nok, o'rik va shaftoli' — 4 ta uyushiq ega mavjud. "
            "Ular hammasi 'nima o'sadi?' so'rog'iga javob beradi."
        ),
        "is_competency_based": True,
        "tags": ["SYNTAX", "COMPOUND_SENTENCE"],
        "era_tag": None,
        "source_decree": "BMBA 2026 Ona tili kompetensiya §3.2",
    },
    {
        "subject": Subject.MOTHER_TONGUE,
        "difficulty": Difficulty.HARD,
        "question_text": (
            "Alisher Navoiyning «Xamsa» asari nechta dostondan iborat va "
            "qaysi tilda yozilgan?"
        ),
        "option_a": "5 ta doston; chig'atoy (eski o'zbek) tilida",
        "option_b": "4 ta doston; fors tilida",
        "option_c": "5 ta doston; arab tilida",
        "option_d": "6 ta doston; chig'atoy tilida",
        "correct_option": "A",
        "explanation": (
            "Alisher Navoiyning «Xamsa» («Besh doston») asari 5 ta dostondan iborat: "
            "Hayrat ul-abror, Farhod va Shirin, Layli va Majnun, Sab'ai sayyor, Saddi Iskandariy. "
            "Asar chig'atoy tilida (eski o'zbek tili) yozilgan va 1483–1485-yillarda bitilgan."
        ),
        "is_competency_based": False,
        "tags": ["LITERATURE", "CLASSIC", "NAVOI"],
        "era_tag": None,
        "source_decree": None,
    },

    # Ona tili 6 — Fonetika: harf va tovush soni
    {
        "subject": Subject.MOTHER_TONGUE,
        "difficulty": Difficulty.MEDIUM,
        "question_text": "'Mashg'ulot' so'zida nechta harf va nechta tovush bor?",
        "option_a": "9 harf, 8 tovush",
        "option_b": "9 harf, 9 tovush",
        "option_c": "8 harf, 8 tovush",
        "option_d": "10 harf, 9 tovush",
        "correct_option": "A",
        "explanation": (
            "'Mashg'ulot' so'zida 9 ta harf bor: m-a-sh-g'-u-l-o-t. "
            "Tovush soni 8 ta — chunki 'g'' harfi yozuvda belgisiz qolgan tovush hisoblanadi, "
            "lekin 'sh' harfi 1 ta tovushni ifodalaydi (ikki harf — bitta tovush). "
            "BMBA testlarida harf va tovush sonini farqlash muhim."
        ),
        "is_competency_based": False,
        "tags": ["PHONETICS", "SPELLING"],
        "era_tag": None,
        "source_decree": None,
    },
    # Ona tili 7 — Morfologiya: kelishiklar
    {
        "subject": Subject.MOTHER_TONGUE,
        "difficulty": Difficulty.EASY,
        "question_text": (
            "'Kitobni stolga qo'ydi' gapida 'kitobni' so'zi qaysi kelishikda?"
        ),
        "option_a": "Tushum kelishigi (-ni)",
        "option_b": "Jo'nalish kelishigi (-ga)",
        "option_c": "Qaratqich kelishigi (-ning)",
        "option_d": "O'rin-payt kelishigi (-da)",
        "correct_option": "A",
        "explanation": (
            "O'zbek tilida 6 ta kelishik bor. Tushum kelishigi (-ni, -n) 'nimani? kimni?' "
            "so'rog'iga javob beradi va to'ldiruvchi vazifasini bajaradi. "
            "'Kitobni' so'zi 'nimani qo'ydi?' so'rog'iga javob beradi → Tushum kelishigi."
        ),
        "is_competency_based": False,
        "tags": ["MORPHOLOGY", "CASES"],
        "era_tag": None,
        "source_decree": None,
    },
    # Ona tili 8 — Sintaksis: gap bo'laklari
    {
        "subject": Subject.MOTHER_TONGUE,
        "difficulty": Difficulty.MEDIUM,
        "question_text": (
            "'Chiroyli qiz kitob o'qidi' gapida qaysi gap bo'lagi yo'q?\n"
            "(Ega, kesim, aniqlovchi, to'ldiruvchi, hol)"
        ),
        "option_a": "To'ldiruvchi va hol",
        "option_b": "Ega va kesim",
        "option_c": "Aniqlovchi",
        "option_d": "Faqat hol",
        "correct_option": "A",
        "explanation": (
            "Gapni tahlil qilamiz:\n"
            "• 'qiz' — ega (kim?)\n"
            "• 'o'qidi' — kesim (nima qildi?)\n"
            "• 'Chiroyli' — aniqlovchi (qanday qiz?)\n"
            "• 'kitob' — to'ldiruvchi bo'lishi mumkin, lekin kelishiksiz\n"
            "To'ldiruvchi va hol bu gapda mavjud emas."
        ),
        "is_competency_based": True,
        "tags": ["SYNTAX", "SENTENCE_MEMBERS"],
        "era_tag": None,
        "source_decree": "BMBA 2026 Ona tili kompetensiya §3.2",
    },
    # Ona tili 9 — Imlo: qo'shma va juft so'zlar
    {
        "subject": Subject.MOTHER_TONGUE,
        "difficulty": Difficulty.HARD,
        "question_text": (
            "Qaysi qatorda barcha so'zlar qo'shib yoziladi?\n"
            "(Qo'shma so'zlar qoidasi)"
        ),
        "option_a": "Otaliq, onalik, kitobxon, dehqonchilik",
        "option_b": "Ota-ona, aka-uka, qo'l-oyoq, bel-bel",
        "option_c": "Ilm fan, aql idrok, og'iz ichi, ko'z uchi",
        "option_d": "Kitob do'kon, maktab bog'cha, sport zal",
        "correct_option": "A",
        "explanation": (
            "Qoida: qo'shimcha (-lik, -xon, -chilik va b.) yordamida hosil bo'lgan "
            "qo'shma so'zlar qo'shib yoziladi.\n"
            "'Otaliq' (ota+lik), 'onalik' (ona+lik), 'kitobxon' (kitob+xon), "
            "'dehqonchilik' (dehqon+chilik) — barchasi qo'shimcha bilan hosil bo'lgan."
        ),
        "is_competency_based": False,
        "tags": ["SPELLING", "WORD_FORMATION", "ORTHOGRAPHY"],
        "era_tag": None,
        "source_decree": None,
    },
    # Ona tili 10 — Adabiyot: Cho'lpon
    {
        "subject": Subject.MOTHER_TONGUE,
        "difficulty": Difficulty.HARD,
        "question_text": (
            "Cho'lponning to'liq ismi va u qaysi davr o'zbek adabiyotining "
            "yirik vakillaridan biri sifatida tanilgan?"
        ),
        "option_a": "Abdulhamid Sulaymon o'g'li Yunusov; Jadidchilik davri (XX asr boshlari)",
        "option_b": "Hamza Hakimzoda Niyoziy; Sovet davri adabiyoti",
        "option_c": "Abdulla Qodiriy; Mustaqillik davri adabiyoti",
        "option_d": "G'ayratiy; Zamonaviy o'zbek adabiyoti",
        "correct_option": "A",
        "explanation": (
            "Cho'lpon (1897–1938) — to'liq ismi Abdulhamid Sulaymon o'g'li Yunusov. "
            "U jadidchilik harakatining yirik vakili, shoir, dramaturg va tarjimon. "
            "Asosiy asarlari: 'Kecha va kunduz' romani, she'riy to'plamlari. "
            "1938-yilda siyosiy qatag'on qurboni bo'ldi, keyinchalik oqlandi."
        ),
        "is_competency_based": False,
        "tags": ["LITERATURE", "JADIDISM", "POETS"],
        "era_tag": None,
        "source_decree": None,
    },

    # ─── MATEMATIKA (10 ta) ───────────────────────────────────────────────────
    {
        "subject": Subject.MATHEMATICS,
        "difficulty": Difficulty.MEDIUM,
        "question_text": (
            "Agar x² - 5x + 6 = 0 bo'lsa, x ning qiymatlari yig'indisi qancha?"
        ),
        "option_a": "5",
        "option_b": "6",
        "option_c": "11",
        "option_d": "-5",
        "correct_option": "A",
        "explanation": (
            "Viyeta teoremasi bo'yicha, ax² + bx + c = 0 tenglamada ildizlar yig'indisi = -b/a. "
            "Bu erda a=1, b=-5, shuning uchun x₁ + x₂ = -(-5)/1 = 5. "
            "Tekshirish: x² - 5x + 6 = (x-2)(x-3) = 0, demak x=2 va x=3, yig'indisi = 5."
        ),
        "is_competency_based": False,
        "tags": ["ALGEBRA", "QUADRATIC"],
        "era_tag": None,
        "source_decree": None,
    },
    {
        "subject": Subject.MATHEMATICS,
        "difficulty": Difficulty.EASY,
        "question_text": (
            "To'g'ri burchakli uchburchakning katetlari 3 sm va 4 sm bo'lsa, "
            "gipotenuzasi qancha?"
        ),
        "option_a": "5 sm",
        "option_b": "7 sm",
        "option_c": "6 sm",
        "option_d": "4.5 sm",
        "correct_option": "A",
        "explanation": (
            "Pifagor teoremasi: c² = a² + b². "
            "c² = 3² + 4² = 9 + 16 = 25. "
            "c = √25 = 5 sm. "
            "Bu mashhur 3-4-5 Pifagor uchligiga misol."
        ),
        "is_competency_based": False,
        "tags": ["GEOMETRY", "PYTHAGOREAN"],
        "era_tag": None,
        "source_decree": None,
    },
    {
        "subject": Subject.MATHEMATICS,
        "difficulty": Difficulty.HARD,
        "question_text": (
            "MANTIQIY MASALA (Kompetensiyaga asoslangan):\n"
            "Bir sinfda 30 o'quvchi bor. Ularning 18 tasi matematika, 15 tasi fizika "
            "to'garagi a'zosi. Har ikkala to'garakka ham a'zo bo'lgan o'quvchilar soni "
            "eng kam nechta bo'lishi mumkin?"
        ),
        "option_a": "3",
        "option_b": "5",
        "option_c": "8",
        "option_d": "0",
        "correct_option": "A",
        "explanation": (
            "To'plamlar nazariyasi bo'yicha:\n"
            "|A ∪ B| = |A| + |B| - |A ∩ B|\n"
            "Maksimal birlashma = 30 (butun sinf).\n"
            "30 ≥ 18 + 15 - |A ∩ B|\n"
            "|A ∩ B| ≥ 18 + 15 - 30 = 3.\n"
            "Demak, har ikkala to'garakka a'zo bo'lganlar soni kamida 3 ta."
        ),
        "is_competency_based": True,
        "tags": ["LOGIC", "SET_THEORY", "WORD_PROBLEM"],
        "era_tag": None,
        "source_decree": "BMBA 2026 Matematika mantiqiy kompetensiya §3.7",
    },
    {
        "subject": Subject.MATHEMATICS,
        "difficulty": Difficulty.MEDIUM,
        "question_text": (
            "log₂(8) + log₃(27) = ?"
        ),
        "option_a": "6",
        "option_b": "5",
        "option_c": "8",
        "option_d": "9",
        "correct_option": "A",
        "explanation": (
            "log₂(8) = log₂(2³) = 3\n"
            "log₃(27) = log₃(3³) = 3\n"
            "3 + 3 = 6."
        ),
        "is_competency_based": False,
        "tags": ["ALGEBRA", "LOGARITHM", "CALCULATION"],
        "era_tag": None,
        "source_decree": None,
    },
    {
        "subject": Subject.MATHEMATICS,
        "difficulty": Difficulty.HARD,
        "question_text": (
            "Arifmetik progressiyaning birinchi hadi 2, umumiy farqi 3 bo'lsa, "
            "birinchi 10 hadining yig'indisi qancha?"
        ),
        "option_a": "155",
        "option_b": "150",
        "option_c": "160",
        "option_d": "145",
        "correct_option": "A",
        "explanation": (
            "Arifmetik progressiya yig'indisi formulasi: Sₙ = n/2 × (2a₁ + (n-1)d)\n"
            "S₁₀ = 10/2 × (2×2 + (10-1)×3)\n"
            "S₁₀ = 5 × (4 + 27)\n"
            "S₁₀ = 5 × 31 = 155."
        ),
        "is_competency_based": False,
        "tags": ["ALGEBRA", "ARITHMETIC_PROGRESSION", "CALCULATION"],
        "era_tag": None,
        "source_decree": None,
    },

    # Math 6 — Trigonometriya
    {
        "subject": Subject.MATHEMATICS,
        "difficulty": Difficulty.MEDIUM,
        "question_text": "sin²α + cos²α = ?",
        "option_a": "1",
        "option_b": "0",
        "option_c": "2",
        "option_d": "sin(2α)",
        "correct_option": "A",
        "explanation": (
            "Bu trigonometriyaning asosiy birligi — Pifagor identifikatsiyasi: "
            "sin²α + cos²α = 1. "
            "Bu formula har qanday α qiymati uchun to'g'ri. "
            "BMBA testlarida eng ko'p uchraydigan trigonometrik formula."
        ),
        "is_competency_based": False,
        "tags": ["TRIGONOMETRY", "IDENTITY"],
        "era_tag": None,
        "source_decree": None,
    },
    # Math 7 — Tengsizlik
    {
        "subject": Subject.MATHEMATICS,
        "difficulty": Difficulty.MEDIUM,
        "question_text": "2x - 5 > 3 tengsizligining yechimi qaysi?",
        "option_a": "x > 4",
        "option_b": "x > -1",
        "option_c": "x < 4",
        "option_d": "x > 8",
        "correct_option": "A",
        "explanation": (
            "2x - 5 > 3\n"
            "2x > 3 + 5\n"
            "2x > 8\n"
            "x > 4\n"
            "Javob: x > 4, ya'ni (4; +∞) oraliq."
        ),
        "is_competency_based": False,
        "tags": ["ALGEBRA", "INEQUALITY"],
        "era_tag": None,
        "source_decree": None,
    },
    # Math 8 — Masala (so'z masalasi / word problem)
    {
        "subject": Subject.MATHEMATICS,
        "difficulty": Difficulty.HARD,
        "question_text": (
            "MASALA: Poyezd 240 km masofani 3 soatda bosib o'tdi. "
            "Avtomobil xuddi shu masofani poyezddan 2 marta sekinroq tezlikda bosib o'tadi. "
            "Avtomobil necha soatda yetib boradi?"
        ),
        "option_a": "6 soat",
        "option_b": "4 soat",
        "option_c": "5 soat",
        "option_d": "8 soat",
        "correct_option": "A",
        "explanation": (
            "Poyezd tezligi: v₁ = 240 ÷ 3 = 80 km/soat\n"
            "Avtomobil tezligi: v₂ = 80 ÷ 2 = 40 km/soat (2 marta sekinroq)\n"
            "Avtomobil vaqti: t = 240 ÷ 40 = 6 soat\n"
            "Masala: masofa = tezlik × vaqt formulasiga asoslangan."
        ),
        "is_competency_based": True,
        "tags": ["LOGIC", "WORD_PROBLEM", "MOTION"],
        "era_tag": None,
        "source_decree": None,
    },
    # Math 9 — Geometriya: doira
    {
        "subject": Subject.MATHEMATICS,
        "difficulty": Difficulty.EASY,
        "question_text": "Radiusi 7 sm bo'lgan doiraning yuzi qancha? (π ≈ 3.14)",
        "option_a": "153.86 sm²",
        "option_b": "43.96 sm²",
        "option_c": "49 sm²",
        "option_d": "21.98 sm²",
        "correct_option": "A",
        "explanation": (
            "Doira yuzi formulasi: S = π × r²\n"
            "S = 3.14 × 7² = 3.14 × 49 = 153.86 sm²\n"
            "Eslab qoling: doira yuzida r² ishlatiladi, "
            "doira uzunligida esa 2πr ishlatiladi."
        ),
        "is_competency_based": False,
        "tags": ["GEOMETRY", "CIRCLE", "CALCULATION"],
        "era_tag": None,
        "source_decree": None,
    },
    # Math 10 — Foiz masalasi
    {
        "subject": Subject.MATHEMATICS,
        "difficulty": Difficulty.MEDIUM,
        "question_text": (
            "Do'konda 200 000 so'mlik mahsulotga 15% chegirma berildi. "
            "Chegirmadan keyin narx qancha bo'ladi?"
        ),
        "option_a": "170 000 so'm",
        "option_b": "185 000 so'm",
        "option_c": "180 000 so'm",
        "option_d": "230 000 so'm",
        "correct_option": "A",
        "explanation": (
            "Chegirma miqdori: 200 000 × 15 ÷ 100 = 30 000 so'm\n"
            "Chegirmadan keyin narx: 200 000 - 30 000 = 170 000 so'm\n"
            "Yoki: 200 000 × (1 - 0.15) = 200 000 × 0.85 = 170 000 so'm"
        ),
        "is_competency_based": True,
        "tags": ["LOGIC", "PERCENTAGE", "WORD_PROBLEM"],
        "era_tag": None,
        "source_decree": None,
    },

    # ─── O'ZBEKISTON TARIXI (10 ta — barcha davrlarni qamrab oladi) ─────────────
    {
        "subject": Subject.HISTORY,
        "difficulty": Difficulty.MEDIUM,
        "question_text": (
            "O'zbekiston qachon mustaqillikka erishdi va bu sananing rasmiy nomi nima?"
        ),
        "option_a": "1991-yil 1-sentabr; Mustaqillik kuni",
        "option_b": "1990-yil 20-iyun; Mustaqillik bayram",
        "option_c": "1991-yil 31-avgust; Ozodlik kuni",
        "option_d": "1992-yil 8-dekabr; Davlat tashkil topish kuni",
        "correct_option": "A",
        "explanation": (
            "O'zbekiston Respublikasi 1991-yil 1-sentabrda mustaqilligini e'lon qildi. "
            "Bu sana har yili 'Mustaqillik kuni' sifatida nishonlanadi. "
            "1990-yil 20-iyunda esa O'zbekiston SSRning davlat suvereniteti to'g'risidagi "
            "Deklaratsiya qabul qilingan edi."
        ),
        "is_competency_based": False,
        "tags": ["INDEPENDENCE", "MODERN_HISTORY"],
        "era_tag": "INDEPENDENCE",
        "source_decree": None,
    },
    {
        "subject": Subject.HISTORY,
        "difficulty": Difficulty.EASY,
        "question_text": (
            "Amir Temur qaysi yillarda yashagan va u qaysi sulolaning asoschisi?"
        ),
        "option_a": "1336–1405; Temuriylar sulolasi",
        "option_b": "1320–1395; Chig'atoy xonligi",
        "option_c": "1340–1410; Oltin O'rda xonligi",
        "option_d": "1350–1405; Shayboniylar sulolasi",
        "correct_option": "A",
        "explanation": (
            "Amir Temur (Temur ibn Taragay Barlos) 1336-yil 9-aprelda Kesh (hozirgi Shahrisabz) "
            "shahrida tug'ilgan va 1405-yil 18-fevralda vafot etgan. "
            "U Temuriylar (Gurkonilar) sulolasining asoschisi hisoblanadi. "
            "Poytaxti Samarqand bo'lgan."
        ),
        "is_competency_based": False,
        "tags": ["MEDIEVAL", "RULERS"],
        "era_tag": "MEDIEVAL",
        "source_decree": None,
    },
    {
        "subject": Subject.HISTORY,
        "difficulty": Difficulty.MEDIUM,
        "question_text": (
            "«Yangi O'zbekiston» taraqqiyot strategiyasi qaysi yilda qabul qilingan va "
            "uni kim tasdiqlagan?"
        ),
        "option_a": "2022-yil; O'zbekiston Prezidenti Sh. Mirziyoyev",
        "option_b": "2017-yil; O'zbekiston Prezidenti Sh. Mirziyoyev",
        "option_c": "2021-yil; Oliy Majlis",
        "option_d": "2023-yil; Vazirlar Mahkamasi",
        "correct_option": "A",
        "explanation": (
            "O'zbekiston Respublikasi Prezidentining 2022-yil 28-yanvardagi PF-60-sonli Farmoni "
            "bilan «Yangi O'zbekiston» taraqqiyot strategiyasi — 2022–2026-yillarga mo'ljallangan "
            "5 ta ustuvor yo'nalishni o'z ichiga oluvchi dastur tasdiqlangan. "
            "Bu strategiya Prezident Shavkat Mirziyoyev tomonidan imzolangan."
        ),
        "is_competency_based": True,
        "tags": ["NEW_UZBEKISTAN", "REFORMS", "CONTEMPORARY"],
        "era_tag": "NEW_UZBEKISTAN",
        "source_decree": (
            "O'zbekiston Respublikasi Prezidentining 2022-yil 28-yanvardagi "
            "PF-60-sonli Farmoni «Yangi O'zbekiston taraqqiyot strategiyasi to'g'risida»"
        ),
    },
    {
        "subject": Subject.HISTORY,
        "difficulty": Difficulty.HARD,
        "question_text": (
            "O'rta Osiyoni Rossiya imperiyasi tomonidan istilo qilish jarayoni "
            "qaysi yillarda yakunlandi va bu davrdagi eng muhim harbiy to'qnashuv qayerda bo'ldi?"
        ),
        "option_a": "1864–1885-yillar; Toshkent (1865), Samarqand (1868), Xiva (1873), Qo'qon (1876)",
        "option_b": "1850–1870-yillar; Buxoro va Samarqand",
        "option_c": "1870–1900-yillar; Toshkent va Qo'qon",
        "option_d": "1845–1860-yillar; Turkmaniston va Xiva",
        "correct_option": "A",
        "explanation": (
            "Rossiya imperiyasining O'rta Osiyo istilosi bosqichma-bosqich amalga oshirildi:\n"
            "• 1865 — Toshkent zabt etildi (General Chernyayev)\n"
            "• 1868 — Samarqand va Buxoro amirligi vassalga aylandi\n"
            "• 1873 — Xiva xonligi bosib olindi\n"
            "• 1876 — Qo'qon xonligi tugatildi, Farg'ona viloyati tashkil etildi\n"
            "• 1885 — Marvning qo'shilishi bilan istilo yakunlandi."
        ),
        "is_competency_based": False,
        "tags": ["COLONIAL", "RUSSIAN_EMPIRE"],
        "era_tag": "COLONIAL",
        "source_decree": None,
    },
    {
        "subject": Subject.HISTORY,
        "difficulty": Difficulty.MEDIUM,
        "question_text": (
            "Al-Xorazmiy qaysi asrda yashagan va uning qaysi asari 'algoritm' so'zining "
            "kelib chiqishiga asos bo'lgan?"
        ),
        "option_a": "IX asr; «Hind hisob-kitobi haqida» (Algoritmi de numero Indorum)",
        "option_b": "X asr; «Al-jabr va al-muqobala»",
        "option_c": "VIII asr; «Kitob ul-Musiqa»",
        "option_d": "IX asr; «Qonun fit-tib»",
        "correct_option": "A",
        "explanation": (
            "Muhammad ibn Muso al-Xorazmiy (783–850) IX asrda yashagan buyuk matematik va astronom. "
            "'Algoritm' so'zi uning nomi (Algoritmi — Xorazmiy nomining lotincha shakli)dan kelib chiqqan. "
            "Uning «Hind hisob-kitobi haqida» asari raqamlar sistemasini Evropaga tanishtirgan. "
            "«Al-jabr va al-muqobala» asari esa algebra fanining asoschisi ekanligini isbotlaydi."
        ),
        "is_competency_based": False,
        "tags": ["ANCIENT", "SCIENCE", "SCHOLARS"],
        "era_tag": "MEDIEVAL",
        "source_decree": None,
    },

    # Tarix 6 — Qadimgi davr: Buyuk Ipak yo'li
    {
        "subject": Subject.HISTORY,
        "difficulty": Difficulty.MEDIUM,
        "question_text": (
            "Buyuk Ipak yo'lining O'rta Osiyo bo'ylab o'tgan asosiy shaharlari qaysilar?"
        ),
        "option_a": "Samarqand, Buxoro, Marv, Urganch",
        "option_b": "Toshkent, Namangan, Andijon, Farg'ona",
        "option_c": "Termiz, Qarshi, Shahrisabz, Navoiy",
        "option_d": "Nukus, Xiva, Turtkul, Beruniy",
        "correct_option": "A",
        "explanation": (
            "Buyuk Ipak yo'li miloddan avvalgi II asrdan XVI asrgacha faoliyat ko'rsatgan. "
            "O'rta Osiyodagi asosiy yo'l bo'yidagi shaharlar: Marv → Buxoro → Samarqand → Urganch. "
            "Samarqand va Buxoro savdo va madaniyat markazlari sifatida alohida ahamiyatga ega edi."
        ),
        "is_competency_based": False,
        "tags": ["ANCIENT", "TRADE", "GEOGRAPHY"],
        "era_tag": "ANCIENT",
        "source_decree": None,
    },
    # Tarix 7 — Ibn Sino
    {
        "subject": Subject.HISTORY,
        "difficulty": Difficulty.EASY,
        "question_text": (
            "Ibn Sino qaysi yillarda yashagan va uning 'tibbiyot ensiklopediyasi' "
            "deb atalgan asosiy asarining nomi nima?"
        ),
        "option_a": "980–1037; «Al-Qonun fit-tib» (Tibbiyot qonunlari)",
        "option_b": "850–920; «Kitob ush-shifa»",
        "option_c": "1000–1048; «Qonun fit-tib» va «At-tanbih»",
        "option_d": "973–1048; «Al-Qonun» va «Kashf ul-mahjub»",
        "correct_option": "A",
        "explanation": (
            "Abu Ali ibn Sino (Avitsenna) 980-yilda Buxoro yaqinidagi Afshona qishlog'ida "
            "tug'ilgan, 1037-yilda Hamadon shahrida vafot etgan. "
            "Uning 'Al-Qonun fit-tib' asari 5 kitobdan iborat bo'lib, "
            "Evropada 600 yil davomida tibbiyot darsligi sifatida o'qitilgan."
        ),
        "is_competency_based": False,
        "tags": ["MEDIEVAL", "SCIENCE", "SCHOLARS"],
        "era_tag": "MEDIEVAL",
        "source_decree": None,
    },
    # Tarix 8 — Jadidchilik
    {
        "subject": Subject.HISTORY,
        "difficulty": Difficulty.HARD,
        "question_text": (
            "Jadidchilik harakati O'rta Osiyoda qachon paydo bo'ldi va "
            "uning asosiy maqsadi nima edi?"
        ),
        "option_a": "XIX asr oxiri — XX asr boshlari; ta'limni isloh qilish va milliy uyg'onish",
        "option_b": "1917-yil inqilobidan keyin; sovet hokimiyatiga qarshi kurash",
        "option_c": "1865-yildan keyin; Rossiyaga qarshi qurolli qo'zg'olon",
        "option_d": "1920-yillarda; kommunistik mafkurani tarqatish",
        "correct_option": "A",
        "explanation": (
            "Jadidchilik (arabcha 'jadid' — yangi) XIX asr oxiri — XX asr boshlarida "
            "Ismoil Gaspirali g'oyalari asosida paydo bo'ldi. "
            "Asosiy maqsadlar: usul-i jadid (yangi usul) maktablarini ochish, "
            "ona tilida matbuot yaratish, milliy madaniyatni rivojlantirish. "
            "Muhimur vakillar: Mahmudxo'ja Behbudiy, Abdulla Avloniy, Munavvar Qori."
        ),
        "is_competency_based": False,
        "tags": ["COLONIAL", "JADIDISM", "REFORMS"],
        "era_tag": "COLONIAL",
        "source_decree": None,
    },
    # Tarix 9 — Sovet davri
    {
        "subject": Subject.HISTORY,
        "difficulty": Difficulty.MEDIUM,
        "question_text": (
            "O'zbekiston SSR qachon tashkil topdi va uning birinchi poytaxti qaysi shahar bo'lgan?"
        ),
        "option_a": "1924-yil 27-oktyabr; Samarqand",
        "option_b": "1917-yil; Toshkent",
        "option_c": "1925-yil; Buxoro",
        "option_d": "1936-yil; Toshkent",
        "correct_option": "A",
        "explanation": (
            "O'zbekiston Sovet Sotsialistik Respublikasi 1924-yil 27-oktyabrda "
            "Markaziy Osiyoni milliy-davlat chegaralash natijasida tashkil topdi. "
            "Dastlab poytaxti Samarqand bo'lib, 1930-yilda Toshkentga ko'chirildi. "
            "Bu sana O'zbekistonda 'O'zbekiston xalqlari do'stligi bayrami' sifatida nishonlanadi."
        ),
        "is_competency_based": False,
        "tags": ["SOVIET", "STATE_FORMATION"],
        "era_tag": "SOVIET",
        "source_decree": None,
    },
    # Tarix 10 — Birinchi Prezident
    {
        "subject": Subject.HISTORY,
        "difficulty": Difficulty.EASY,
        "question_text": (
            "O'zbekistonning birinchi Prezidenti kim va u lavozimda qancha yil ishladi?"
        ),
        "option_a": "Islom Karimov; 1991–2016-yillar (25 yil)",
        "option_b": "Shavkat Mirziyoyev; 1991–hozir",
        "option_c": "Islom Karimov; 1989–2000-yillar",
        "option_d": "Nursulton Nazarboyev; 1991–2019-yillar",
        "correct_option": "A",
        "explanation": (
            "Islom Abdug'aniyevich Karimov O'zbekistonning birinchi Prezidenti bo'lib, "
            "1991-yildan 2016-yil 2-sentabrdagi vafotiga qadar davlatga rahbarlik qildi. "
            "U O'zbekiston mustaqilligining ramzi hisoblanadi. "
            "2016-yildan Shavkat Mirziyoyev Prezident lavozimini egalladi."
        ),
        "is_competency_based": False,
        "tags": ["INDEPENDENCE", "PRESIDENTS", "MODERN_HISTORY"],
        "era_tag": "INDEPENDENCE",
        "source_decree": None,
    },
]


SAMPLE_LESSONS: list[dict] = [
    {
        "subject": Subject.MOTHER_TONGUE,
        "title": "Ko'chma ma'no va troplar",
        "order_index": 1,
        "xp_reward": 50,
        "era_tag": None,
        "content_markdown": """# Ko'chma ma'no va troplar

## Ko'chma ma'no nima?

**Ko'chma ma'no** — so'zning o'z asosiy (to'g'ri) ma'nosidan boshqa ma'noda qo'llanishi.

### Asosiy troplar:

| Trop | Ta'rif | Misol |
|------|--------|-------|
| **Metafora** | O'xshashlik asosida ko'chirish | «Hayot daryo» |
| **Metonimiya** | Tutashlik asosida ko'chirish | «Qozon qaynadi» (= oila band) |
| **Sinekdoxa** | Qism orqali butunni ifodalash | «Qo'l kerak» (= ishchi kerak) |
| **Epitot** | Ko'chma sifatlash | «temir iroda» |

## Amaliy mashq

> «Uning ko'zlarida qor yog'di.»

Bu gapda **metafora** ishlatilgan — ko'zlar va qor o'rtasidagi o'xshashlik (ozoq-ozuqasiz, sovuq qarash) asosida ko'chirish.

## Eslab qoling

- Ko'chma ma'noli so'zlar lug'atlarda **ko'ch.** belgisi bilan belgilanadi
- Badiiy adabiyotda ko'chma ma'no asarni boyitadi
- BMBA testlarida ko'chma ma'noli so'zni aniqlash uchun kontekstni diqqat bilan o'qing
""",
    },
    {
        "subject": Subject.MATHEMATICS,
        "title": "Kvadrat tenglamalar va Viyeta teoremasi",
        "order_index": 1,
        "xp_reward": 50,
        "era_tag": None,
        "content_markdown": """# Kvadrat tenglamalar va Viyeta teoremasi

## Asosiy formula

Kvadrat tenglama: **ax² + bx + c = 0** (a ≠ 0)

### Diskriminant:
$$D = b^2 - 4ac$$

- D > 0 → ikkita haqiqiy ildiz
- D = 0 → bitta ildiz (qo'sh ildiz)
- D < 0 → haqiqiy ildiz yo'q

## Viyeta teoremasi

Agar x₁ va x₂ — tenglamaning ildizlari bo'lsa:

$$x_1 + x_2 = -\\frac{b}{a}$$

$$x_1 \\cdot x_2 = \\frac{c}{a}$$

## Misol

x² - 5x + 6 = 0 tenglamasi uchun:
- x₁ + x₂ = 5
- x₁ · x₂ = 6
- Ildizlar: x = 2 va x = 3 ✓

## BMBA maslahat

Viyeta teoremasi yordamida diskriminant hisoblamasdan ildizlar yig'indisi va ko'paytmasini topish mumkin — bu testda vaqt tejaydi!
""",
    },
    {
        "subject": Subject.HISTORY,
        "title": "Yangi O'zbekiston taraqqiyot strategiyasi (2022–2026)",
        "order_index": 1,
        "xp_reward": 50,
        "era_tag": "NEW_UZBEKISTAN",
        "content_markdown": """# Yangi O'zbekiston taraqqiyot strategiyasi

## Asosiy ma'lumotlar

**Qabul qilingan:** 2022-yil 28-yanvar
**Hujjat:** Prezident PF-60-sonli Farmoni
**Muddat:** 2022–2026-yillar

## 5 ta ustuvor yo'nalish

### 1. Inson qadr-qimmati va farovonligi
- Inson huquqlari va erkinliklarini ta'minlash
- Qashshoqlikni kamida 2 baravarga kamaytirish
- Ijtimoiy himoya tizimini modernizatsiya qilish

### 2. Adolatli huquq tizimi va demokratik davlat
- Sud-huquq tizimi islohotlari
- Mahalliy o'z-o'zini boshqarishni kuchaytirish
- Ommaviy axborot vositasi erkinligi

### 3. Iqtisodiy taraqqiyot va farovonlik
- YaIM ni 1.6 baravar o'stirish
- Xususiy sektor ulushini oshirish
- Investitsiya muhitini yaxshilash

### 4. Adolatli ijtimoiy siyosat
- Ta'lim va sog'liqni saqlash sifatini oshirish
- Yoshlar siyosati
- Gender tengligi

### 5. Xavfsizlik, millatlararo totuvlik va diniy bag'rikenglik

## BMBA uchun muhim

Bu strategiya BMBA 2026 O'zbekiston tarixi testlarining **"Yangi O'zbekiston"** bo'limida faol qo'llaniladi. Sana va PF-60 raqamini eslab qoling!

> **Eslab qoling:** 2022-yil, 28-yanvar, PF-60, 5 ta yo'nalish
""",
    },
]


async def seed(db: AsyncSession) -> None:
    from sqlalchemy import select

    # Check if already seeded
    result = await db.execute(select(Question).limit(1))
    if result.scalar_one_or_none():
        print("Savollar allaqachon mavjud. Seed o'tkazib yuborildi.")
        return

    print("Savollar qo'shilmoqda...")
    for q_data in SAMPLE_QUESTIONS:
        q = Question(**q_data)
        db.add(q)

    print("Darslar qo'shilmoqda...")
    for l_data in SAMPLE_LESSONS:
        lesson = Lesson(**l_data)
        db.add(lesson)

    await db.commit()
    print(f"OK: {len(SAMPLE_QUESTIONS)} ta savol va {len(SAMPLE_LESSONS)} ta dars qo'shildi.")
    print("  - Ona tili: fonetika, morfologiya, sintaksis, imlo, adabiyot")
    print("  - Matematika: algebra, geometriya, trigonometriya, masalalar (LOGIC tegi)")
    print("  - Tarix: qadimgi, o'rta asr, mustamlaka, sovet, mustaqillik, Yangi O'zbekiston")


async def main() -> None:
    import re
    url = re.sub(r'[?&](sslmode|channel_binding)=[^&]*', '', settings.database_url).rstrip('?&')
    engine = create_async_engine(url, echo=False, connect_args={"ssl": "require"})
    AsyncSession_ = async_sessionmaker(engine, expire_on_commit=False)

    await create_tables(engine)

    async with AsyncSession_() as session:
        await seed(session)

    await engine.dispose()
    print("Seed muvaffaqiyatli yakunlandi!")


if __name__ == "__main__":
    asyncio.run(main())
