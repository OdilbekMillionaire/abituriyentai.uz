"""
Seed comprehensive lessons for AbituriyentAI.
BMBA 2026 curriculum: Ona tili, Matematika, O'zbekiston Tarixi
Run from backend/ directory: python seed_lessons.py
"""
import asyncio
import re
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

sys.path.insert(0, ".")
from config import settings
from models.lesson import Lesson
from models.question import Subject
from database import Base

# ── Strip sslmode for asyncpg ──────────────────────────────────────────────
_url = re.sub(r"[?&](sslmode|channel_binding)=[^&]*", "", settings.database_url).rstrip("?&")
engine = create_async_engine(_url, connect_args={"ssl": "require"})
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# ══════════════════════════════════════════════════════════════════════════════
# LESSONS DATA
# ══════════════════════════════════════════════════════════════════════════════

LESSONS = [

    # ─────────────────────────────────────────────────────────────────────────
    # ONA TILI VA ADABIYOT  (10 dars)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "subject": Subject.MOTHER_TONGUE,
        "order_index": 1,
        "xp_reward": 50,
        "era_tag": None,
        "title": "Fonetika: Unli va undosh tovushlar",
        "content_markdown": """# Fonetika: Unli va undosh tovushlar

## Fonetika nima?
Fonetika — tilshunoslikning tovushlarni o'rganuvchi bo'limi.

---

## Unli tovushlar (6 ta)
O'zbek tilida **6 ta unli** tovush bor:

| Tovush | Misol |
|--------|-------|
| a | **a**na, **a**lma |
| e | **e**shik, **e**r |
| i | **i**lm, **i**sh |
| o | **o**na, **o**t |
| u | **u**y, **u**sta |
| o' | **o'**g'il, **o'**rik |

**Eslatma:** Unlilar mustaqil bo'g'in hosil qiladi.

---

## Undosh tovushlar (24 ta)
Undoshlar **jarangli** va **jarangsiz** bo'ladi:

| Jarangli | Jarangsiz |
|----------|-----------|
| b | p |
| d | t |
| g | k |
| v | f |
| z | s |
| j | sh |
| g' | x |

### Qo'sh undoshlar (digraflar)
- **sh** — shirin, ishchi
- **ch** — choy, kecha
- **ng** — rang, tong
- **g'** — g'isht, g'alaba

---

## Harf va tovush farqi
> Harf — yozuvdagi belgi. Tovush — og'izdan chiqadigan ovoz.

**Muhim qoida:** Ba'zi harflar ikki tovushni bildiradi:
- **ye** → [y] + [e]: **ye**r, **ye**chim
- **yo** → [y] + [o]: **yo**sh, **yo**z
- **yu** → [y] + [u]: **yu**z, **yu**rak
- **ya** → [y] + [a]: **ya**xshi, **ya**ng'i

---

## BMBA uchun muhim
1. So'zdagi harf soni ≠ tovush soni bo'lishi mumkin
2. "Yaxshi" so'zida: 6 harf, 7 tovush (ya = y+a)
3. Jarangli undoshlar so'z oxirida jarangsizlashadi: **kitob** [kitop]

---

## Mashq
**Quyidagi so'zlarda nechta unli tovush bor?**
- "O'zbekiston" → 4 unli (o', e, i, o)
- "Matematika" → 5 unli (a, e, a, i, a)
""",
    },

    {
        "subject": Subject.MOTHER_TONGUE,
        "order_index": 2,
        "xp_reward": 50,
        "era_tag": None,
        "title": "Imlo qoidalari: Qo'shib va ajratib yozish",
        "content_markdown": """# Imlo qoidalari: Qo'shib va ajratib yozish

## Qo'shib yoziladigan so'zlar

### 1. Qo'shma so'zlar
Ikki yoki undan ortiq mustaqil so'zdan yasalgan, yagona ma'no anglatuvchi so'zlar **qo'shib** yoziladi:

- **oshxona** (osh + xona)
- **temir yo'l** ❌ → **temiryo'l** ✅
- **qovoqgul**, **sariqgul**, **ko'knori**

### 2. -dek, -day qo'shimchalari
Qo'shimcha sifatida kelganda **qo'shib** yoziladi:
- arslon**day**, tosh**dek**, gul**day**

---

## Ajratib yoziladigan so'zlar

### Ko'makchi fe'llar
- ketib **qoldi**, o'qib **chiqdi**, aytib **berdi**
- Har doim **ajratib** yoziladi

### Ravishlar
- **har kuni**, **har doim**, **hech qachon**, **hech kim**
- "Har" va "hech" bilan keladigan birikmalar ajratib yoziladi

---

## Defis bilan yoziladigan so'zlar

| Holat | Misol |
|-------|-------|
| Takroriy so'zlar | asta-asta, sekin-sekin |
| Juft so'zlar | aka-uka, ota-ona, do'st-dushman |
| Geografik nomlar | Qorako'l-shahar |

---

## BMBA uchun eng ko'p chiqadigan qoidalar

> **"Bir"** so'zi:
> - **bir xil** (ajratib) — "bir xil narsa"
> - **biroz** (qo'shib) — "biroz dam ol"
> - **bir-biri** (defis bilan)

> **Ko'p-** prefiksi:
> - **ko'p yillik** (ajratib) — sifat birikmasi
> - **ko'pyillik** (qo'shib) — qo'shma so'z sifatida

---

## Mashq
Quyidagilardan qaysi biri to'g'ri yozilgan?
1. ~~temir yo'l~~ → **temiryo'l**
2. ~~hechkim~~ → **hech kim**
3. ~~ostaxona~~ → **ustaxona**
""",
    },

    {
        "subject": Subject.MOTHER_TONGUE,
        "order_index": 3,
        "xp_reward": 60,
        "era_tag": None,
        "title": "So'z turkumlari: Ot, sifat, fe'l",
        "content_markdown": """# So'z turkumlari: Ot, sifat, fe'l

## So'z turkumlari jadvali

| Turkum | Savol | Misol |
|--------|-------|-------|
| Ot | Kim? Nima? | kitob, o'quvchi |
| Sifat | Qanday? Qanaqa? | go'zal, katta |
| Son | Nechta? Nechanchi? | besh, ikkinchi |
| Fe'l | Nima qildi? | o'qidi, yozdi |
| Ravish | Qanday? Qachon? | tez, kecha |
| Olmosh | Kim? Nima? (o'rniga) | men, u, bu |
| Ko'makchi | — | bilan, uchun, da |
| Bog'lovchi | — | va, lekin, ammo |
| Undov | — | voy, ey, oh |
| Yuklamа | — | -mi, -chi, ham |

---

## Ot

### Ot yasovchi qo'shimchalar:
- **-chi**: o'quvchi, ishchi, do'stchi
- **-lik**: do'stlik, vatanparvarlik, mehribonlik
- **-lar**: bolalar, kitoblar (ko'plik)
- **-ning, -ga, -ni, -da, -dan** (kelishik qo'shimchalari)

### Kelishiklar (6 ta):

| Kelishik | Qo'shimcha | Savol | Misol |
|----------|-----------|-------|-------|
| Bosh | — | Kim? Nima? | kitob |
| Qaratqich | -ning | Kimning? | kitob**ning** |
| Tushum | -ni | Kimni? Nimani? | kitob**ni** |
| Jo'nalish | -ga/-ka/-qa | Kimga? | kitob**ga** |
| O'rin-payt | -da | Kimda? | kitob**da** |
| Chiqish | -dan | Kimdan? | kitob**dan** |

---

## Sifat

### Sifat darajalari:
1. **Oddiy daraja**: chiroyli, katta
2. **Qiyosiy daraja**: chiroyli**roq**, katta**roq**
3. **Orttirma daraja**: juda chiroyli, nihoyatda katta, **eng** katta

### Sifat yasovchi qo'shimchalar:
- **-li**: foydali, quvnoqli
- **-siz**: foydasiz, suvsi
- **-gi/-ki**: kunduzgi, kechki
- **-dagi**: uydag**i** bola

---

## Fe'l

### Fe'l zamonlari:
| Zamon | Qo'shimcha | Misol |
|-------|-----------|-------|
| O'tgan | -di | o'qi**di** |
| Hozirgi-kelasi | -yap | o'qi**yap**ti |
| Kelasi | -adi/-ydi | o'qi**ydi** |

### Fe'l nisbatlari:
- **Aniq nisbat**: Men yozdim
- **Majhul nisbat**: Kitob yozil**di**
- **Birgalik nisbat**: Biz birga o'qi**sh**dik
- **Orttirma nisbat**: Men unga yozdirдим → yozdir**di**m

---

## BMBA uchun eslab qolish
> Fe'l + **-ish** = ot: o'qi**sh**, yoz**ish**, kel**ish**
> Sifat + **-lik** = ot: go'zal**lik**, katta**lik**
""",
    },

    {
        "subject": Subject.MOTHER_TONGUE,
        "order_index": 4,
        "xp_reward": 60,
        "era_tag": None,
        "title": "Gap bo'laklari: Ega, kesim, to'ldiruvchi",
        "content_markdown": """# Gap bo'laklari

## Gap bo'laklari jadvali

| Bo'lak | Savol | Grammatik asos |
|--------|-------|----------------|
| **Ega** | Kim? Nima? | Ko'pincha ot/olmosh |
| **Kesim** | Nima qildi? Qanday? Nima? | Fe'l yoki ot/sifat |
| **To'ldiruvchi** | Kimni? Nimani? Kimga? | Kelishikdagi ot |
| **Aniqlovchi** | Qanday? Qaysi? | Sifat, son, sifatdosh |
| **Hol** | Qachon? Qayerda? Qanday? | Ravish, ko'makchili ot |

---

## Ega
- Gapning asosiy bo'lagi
- **Bosh kelishikda** turadi
- Savol: **Kim? Nima?**

**Misol:** **O'quvchilar** darsga kelishdi.
→ "O'quvchilar" — ega (kim?)

---

## Kesim
Ikki xil bo'ladi:

### Fe'l kesim:
**Ali kitob o'qi**di**.**
→ "o'qidi" — fe'l kesim

### Ot-sifat kesim:
**Bu kitob qiziqarli.**
→ "qiziqarli" — ot-sifat kesim

---

## To'ldiruvchi

| Tur | Kelishik | Savol | Misol |
|-----|---------|-------|-------|
| **To'g'ri to'ldiruvchi** | Tushum (-ni) | Nimani? | Kitob**ni** o'qidi |
| **Egri to'ldiruvchi** | Boshqa kelishiklar | Kimga? Kimdan? | Do'sti**ga** berdi |

---

## Aniqlovchi
Otdan oldin keladi, otni izohlaydi:
- **Katta** uy (qanday uy?)
- **O'zbek** tili (qaysi til?)
- **Birinchi** o'quvchi (nechanchi?)

**Izofali aniqlovchi:** Otning qaratqich kelishigi + ot
- **Vatanning** farzandlari (kimning farzandlari?)

---

## Hol turlari
| Tur | Savol | Misol |
|-----|-------|-------|
| **O'rin holi** | Qayerda? | Bog'**da** o'ynadi |
| **Payt holi** | Qachon? | **Kecha** keldi |
| **Tarz holi** | Qanday? | **Tez** yugurdi |
| **Miqdor holi** | Qancha? | **Ko'p** o'qidi |
| **Sabab holi** | Nima uchun? | Kasalligi **sababli** kelmadi |

---

## Uyushiq bo'laklar
Bir xil savol beriluvchi, bir xil bo'lak vazifasidagi bir nechta bo'lak:

**Ali ham, Vali ham, Soli ham** darsga keldi.
→ "Ali, Vali, Soli" — uyushiq egalar

**Vergul** yoki **va, ham, lekin** bilan bog'lanadi.
""",
    },

    {
        "subject": Subject.MOTHER_TONGUE,
        "order_index": 5,
        "xp_reward": 50,
        "era_tag": None,
        "title": "Leksikologiya: Ko'p ma'noli so'zlar va ko'chma ma'no",
        "content_markdown": """# Leksikologiya: Ko'p ma'noli so'zlar va ko'chma ma'no

## Leksikologiya nima?
Leksikologiya — tilshunoslikning so'zlar va ularning ma'nosini o'rganuvchi bo'limi.

---

## So'zning ma'no turlari

### 1. To'g'ri (asosiy) ma'no
So'zning birinchi, asosiy ma'nosi:
- **tosh** → qattiq mineral modda
- **ko'z** → ko'rish organi
- **ot** → hayvon

### 2. Ko'chma ma'no
So'zning majoziy, obrazli ma'nosi:
- **tosh yurak** → shafqatsiz, berahm odam
- **ko'z** → igna ko'zi, ko'z qamashtiruvchi
- **ot** → shaxmat oti

---

## Ko'chma ma'no turlari

### Metafora (o'xshatish asosida)
Ikki predmet o'rtasidagi o'xshashlik asosida:
- **qo'llar** → soat qo'llari
- **tish** → arra tishi, taroq tishi
- **oyoq** → stol oyog'i, tog' oyog'i

### Metonimiya (tutashlik asosida)
Predmetlar o'rtasidagi aloqa asosida:
- **Butun qishloq chiqdi** → qishloq aholisi
- **Shu kitobni o'qidim** → kitob muallifi

### Sinekdoxa (qism-butun munosabati)
- **Bosh** qo'shilsin! → odam qo'shilsin

---

## Omonimlar (shakldosh so'zlar)
Bir xil yoziladi, lekin ma'nolari butunlay boshqacha:

| So'z | Ma'no 1 | Ma'no 2 |
|------|---------|---------|
| **ot** | hayvon | ism |
| **kosa** | idish | tizza bosh suyagi |
| **qo'l** | tana a'zosi | imzo |

---

## Sinonimlar (ma'nodosh so'zlar)
Ma'nosi yaqin, shakli farqli:
- go'zal = chiroyli = suluv = husndor
- yurmoq = ketmoq = qadam tashlash

### BMBA uchun:
> Sinonimlar stilistik farq qiladi:
> - **vafot etdi** (rasmiy) = **o'ldi** (oddiy) = **jonini topshirdi** (badiiy)

---

## Antonimlar (zid ma'noli so'zlar)
- katta ↔ kichik
- issiq ↔ sovuq
- do'st ↔ dushman
- keldi ↔ ketdi

---

## Frazeologizmlar
Iboralar — tarkibidagi so'zlardan boshqa ma'no anglatadi:

| Ibora | Ma'no |
|-------|-------|
| **ko'z tikmoq** | umid bog'lamoq |
| **qo'l siltamoq** | e'tibor bermaslik |
| **bosh qotirmoq** | o'ylab bosh qotirmoq |
| **til biriktirmoq** | yashircha gaplashmoq |
""",
    },

    {
        "subject": Subject.MOTHER_TONGUE,
        "order_index": 6,
        "xp_reward": 70,
        "era_tag": None,
        "title": "Alisher Navoiy: Hayoti va ijodi",
        "content_markdown": """# Alisher Navoiy: Hayoti va ijodi

## Biografiya

| Ma'lumot | Tafsilot |
|----------|---------|
| **To'liq ismi** | Nizomiddin Mir Alisher |
| **Taxallus** | Navoiy (nav = nay, musiqiy kayfiyat) |
| **Tug'ilgan yil** | **1441** yil, 9-fevral |
| **Tug'ilgan joy** | Hirot (hozirgi Afg'oniston) |
| **Vafot** | **1501** yil, 3-yanvar |
| **Davlat lavozimi** | Vazir, Husayn Boyqaro saroyida |

---

## Asosiy asarlari

### "Xamsa" (Besh doston)
Navoiyning eng buyuk asari — **5 dostondan** iborat:

1. **"Hayrat ul-abror"** (Yaxshilarning hayratlanishi) — axloqiy-falsafiy
2. **"Farhod va Shirin"** — ishq va sadoqat
3. **"Layli va Majnun"** — baxtsiz sevgi
4. **"Sab'ai sayyor"** (Yetti sayyora) — axloqiy hikoyalar
5. **"Saddi Iskandariy"** — Iskandar Zulqarnayn haqida

> Navoiy Xamsani **1483–1485** yillarda yozgan

### Lirik devonlar (4 ta)
**"Xazon'ul-maoniy"** to'plamiga kiradi:
1. "G'aroyib us-sig'ar" (yoshlik devoni)
2. "Navodir ush-shabob" (yigitlik devoni)
3. "Badoe' ul-vasat" (o'rta yosh devoni)
4. "Fovoid ul-kibar" (keksalik devoni)

### Boshqa asarlari
- **"Muhokamat ul-lug'atayn"** — turk va fors tillarini qiyoslagan
- **"Majolis un-nafois"** — 459 shoir haqida birinchi tazkirа
- **"Mezon ul-avzon"** — aruz vaznlari haqida
- **"Nasoyim ul-muhabbat"** — 770 ta so'fiy haqida

---

## Navoiy va o'zbek tili
> **"Muhokamat ul-lug'atayn"** (1499) asarida Navoiy turk (o'zbek) tilining fors tilidan kam emasligini isbotladi.

Bu asar o'zbek tilshunosligining asosi hisoblanadi.

---

## BMBA uchun muhim faktlar
- Navoiy **o'zbek adabiy tilining asoschisi**
- U **3 tilda** yozgan: o'zbek, fors, arab
- **"Farhod va Shirin"** — Nizomiy va Dehlaviydan farqli, Farhod bosh qahramon
- Navoiy **vasiyatnomasi** yo'q — barcha boyligini xayriya qilgan
""",
    },

    {
        "subject": Subject.MOTHER_TONGUE,
        "order_index": 7,
        "xp_reward": 70,
        "era_tag": None,
        "title": "Abdulla Qodiriy: 'O'tkan kunlar' romani",
        "content_markdown": """# Abdulla Qodiriy: "O'tkan kunlar" romani

## Yozuvchi haqida

| Ma'lumot | Tafsilot |
|----------|---------|
| **Ismi** | Abdulla Qodiriy |
| **Taxallus** | Julqunboy |
| **Tug'ilgan yil** | **1894** yil |
| **Tug'ilgan joy** | Toshkent |
| **Shahid** | **1938** yil (sovet repressiyasi) |
| **Unvon** | O'zbek romannavisligining otasi |

---

## "O'tkan kunlar" (1925–1926)

### Asosiy ma'lumotlar
- **Janr**: tarixiy-badiiy roman
- **Yozilgan yil**: 1922–1924 (nashr: 1925–1926)
- O'zbek tilidagi **birinchi roman**

### Voqea davri
XIX asrning 2-yarmi — Rossiya bosqini arafasida **Toshkent va Qo'qon xonligi**

---

## Asosiy qahramonlar

| Qahramon | Kim? |
|---------|------|
| **Otabek** | Bosh qahramon, yosh savdogar |
| **Kumush** | Otabekning sevgilisi, keyinroq xotini |
| **Zaynab** | Otabekning birinchi xotini (majburan) |
| **Yusufbek hoji** | Otabekning otasi, Toshkent savdogari |
| **Homid** | Yovuz qahramon, fitnachi |
| **Oysha** | Kumushning onasi |

---

## Asosiy mavzu va g'oya
- **Sevgi va sadoqat** — Otabek va Kumushning baxtsiz muhabbati
- **Milliy ozodlik** — Rossiya bosqiniga qarshi ruh
- **Ijtimoiy muammo** — ko'pxotinlilik, nikoh masalalari
- **Tarixiy haqiqat** — xonliklar davridagi hayot

---

## Asarning kompozitsiyasi
1. Otabek Marg'ilonga boradi → Kumushni uchratadi
2. Ikkalasi oshiq bo'ladi → ota-onalar rozi bo'lmaydi
3. Otabek majburan Zaynabga uylanadi → Kumush ranjiydi
4. Homidning fitna → Kumush vafot etadi
5. Otabek ham halok bo'ladi

---

## Boshqa asarlari
- **"Mehrobdan chayon"** (1929) — ikkinchi romani
- **"Obid ketmon"** — qissa
- **"Toshpo'latov tajang"** — hajviy qissa

---

## BMBA uchun muhim
> "O'tkan kunlar" — o'zbek romanchiligining boshlanishi
> Qodiriy 1938 yilda **siyosiy ayblov** bilan otib tashlangan, 1956 yilda oqlangan
""",
    },

    {
        "subject": Subject.MOTHER_TONGUE,
        "order_index": 8,
        "xp_reward": 70,
        "era_tag": None,
        "title": "Cho'lpon: Hayoti va she'riyati",
        "content_markdown": """# Cho'lpon: Hayoti va she'riyati

## Biografiya

| Ma'lumot | Tafsilot |
|----------|---------|
| **To'liq ismi** | Abdulhamid Sulaymon o'g'li Yunusov |
| **Taxallus** | Cho'lpon (Venera yulduzi) |
| **Tug'ilgan yil** | **1897** yil |
| **Tug'ilgan joy** | Andijon |
| **Shahid** | **1938** yil (sovet repressiyasi) |

---

## Ijodiy yo'nalishi
Cho'lpon — **jadidchilik** harakatining yorqin vakili.

### She'riyatining xususiyatlari:
- **Ozodlik** va **istiqlol** mavzusi
- Millat taqdiri, zulm va qaram hayotga norozilik
- **Romantik** va **ramziy** uslub
- Tabiat tasvirlari orqali ma'no chuqurligi

---

## Mashhur she'rlari

### "Uyqu" (ramziy she'r)
```
Uxlaysan, ey beva xotin,
Ko'z yoshi bilan yuvib yuz...
```
**Ramz:** "uxlayotgan" = g'aflatda yotgan millat

### "Bahor" she'rlari
Bahor = ozodlik, yangilanish, istiqlol ramzi

### "O'zbek qizi" she'ri
Millat qizlarini ma'rifatga chorlash

---

## "Kecha va kunduz" romani (1936)
- O'zbek xotin-qizlarining ozodlik kurashi
- Bosh qahramon: **Zebi** — yangi hayotga intiluvchi qiz
- Eski va yangi hayot o'rtasidagi ziddiyat

---

## Dramaturgiyasi
- **"Yorqinoy"** — drama
- **"Maysaraning ishi"** — komediya (milliy dramaturgiya namunasi)

---

## Cho'lpon va jadidchilik
> Jadidchilik — XIX asr oxiri, XX asr boshida Turkistonda kengaygan ma'rifatparvarlik harakati.

**Jadidchilik maqsadlari:**
1. Yangi usul maktablari ochish
2. Milliy matbuot — gazeta, jurnal
3. Milliy teatr va adabiyot
4. Xotin-qizlarni ma'rifatga jalb qilish

---

## BMBA uchun muhim faktlar
- Cho'lpon **"Uyqu"** she'rida millatni g'aflatdan uyg'otishga chaqirdi
- **1938 yil repressiya** jabrdiydasi — oqlangan 1957 yilda
- O'zbek **she'riyati modernizmi**ning asoschisi
- "Cho'lpon" taxallusi — **Venera (Zuhra) yulduzi** nomidan
""",
    },

    {
        "subject": Subject.MOTHER_TONGUE,
        "order_index": 9,
        "xp_reward": 60,
        "era_tag": None,
        "title": "Sintaksis: Gaplar tasnifi",
        "content_markdown": """# Sintaksis: Gaplar tasnifi

## Sintaksis nima?
Sintaksis — tilshunoslikning gaplar tuzilishini o'rganuvchi bo'limi.

---

## Gaplarning tuzilishiga ko'ra tasnifi

### 1. Sodda gap
**Bitta** ega-kesim juftligiga ega:
- **Ali o'qidi.**
- **Quyosh chiqdi.**

### 2. Qo'shma gap
**Ikki va undan ortiq** sodda gapdan tuziladi:

#### a) Bog'lovchili qo'shma gap
**Teng bog'lovchili:**
- Ali o'qidi, **lekin** Vali o'ynamoqchi.
- Kitob oldi **va** o'qidi.

**Ergashtiruvchi bog'lovchili:**
- **Chunki** yomg'ir yog'di, biz boralmadik.
- Men bilaman **ki**, u keladi.

#### b) Bog'lovchisiz qo'shma gap
- Yomg'ir yog'di, ko'cha botqoqlashdi.

---

## Gaplarning maqsadga ko'ra tasnifi

| Tur | Belgi | Misol |
|-----|-------|-------|
| **Darak gap** | oddiy intonatsiya | U o'qiydi. |
| **So'roq gap** | ? belgisi, -mi | U o'qiyapti**mi**? |
| **Buyruq gap** | buyruq, iltimos | O'qi! Keling. |
| **Undov gap** | ! belgisi | Qanday chiroyli! |

---

## Gaplarning tarkibiga ko'ra

### To'liq gap
Barcha kerakli bo'laklar mavjud:
- **Bolalar bog'da o'ynayapti.**

### To'liqsiz gap
Ba'zi bo'laklar tushirib qoldirilgan:
- — Qayerga ketdingiz? — **Bozorga.** (ega va kesim tushirilgan)

### Yig'iq gap
Faqat ega va kesimdan iborat:
- **Bahor keldi.**

### Yoyiq gap
Ikkinchi darajali bo'laklar ham bor:
- **Issiq bahor erta keldi.**

---

## Kirish so'zlar va gaplar
Asosiy gap tarkibiga kirmaydigan, munosabat bildiruvchi:

| Kirish so'z | Ma'no |
|------------|-------|
| **aytgancha** | qo'shimcha ma'lumot |
| **albatta** | ishonch |
| **afsuski** | pushaymonlik |
| **birinchidan** | tartib |

**Vergul** bilan ajratiladi.

---

## BMBA uchun muhim
> **Ergash gap** bosh gapga bog'liq bo'lib, uning bir bo'lagi vazifasini bajaradi:
> - **Ega ergash gap:** Kim kelgani ma'lum emas.
> - **Kesim ergash gap:** Mening orzum shuki, men o'qishga kiraman.
> - **To'ldiruvchi ergash gap:** U aytdiki, ertaga keladi.
""",
    },

    {
        "subject": Subject.MOTHER_TONGUE,
        "order_index": 10,
        "xp_reward": 80,
        "era_tag": None,
        "title": "Aruz vazni va she'r shakllari",
        "content_markdown": """# Aruz vazni va she'r shakllari

## O'zbek she'riyatining vaznlari

### 1. Aruz vazni (klassik)
- Arab-fors she'riyatidan olingan
- **Bo'g'inlarning cho'ziq/qisqaligiga** asoslangan
- Navoiy, Bobur, Fuzuliy asarlarida

### 2. Barmoq vazni (xalq she'riyati)
- **Bo'g'inlar soniga** asoslangan
- 7, 8, 11, 12 bo'g'inli misralar
- Xalq qo'shiqlari, ashulalar

### 3. Erkin vazn (XX asr)
- Aniq qolip yo'q
- Cho'lpon, Hamid Olimjon asarlarida

---

## Klassik she'r shakllari

### G'azal
- **5–12 bayt**dan iborat
- Har baytning ikkinchi misrasi **qofiyalanadi**
- Oxirgi baytda **taxallus** ishlatiladi
- Mavzu: ishq, falsafa, tasavvuf

**Tuzilishi:**
```
AA, BA, CA, DA... (maqta — oxirgi bayt)
```

### Ruboiy
- **4 misra** (bir bayt)
- 1, 2, 4-misralar qofiyalanadi, 3-misra erkin
- Falsafiy mazmund

**Misol (Umar Xayyom):**
```
Bir kun erur, ikki kun erur bu dunyo, (A)
Hech kimga turmaydi, ne'mat ham (B)
```

### Qasida
- **15–150 bayt**
- Maqtov yoki ta'rif uchun
- Hukmdorlar, shaxslar, tabiat tavsifi

### Musammas (taxmis)
- Mavjud g'azalga **3 misra** qo'shib yozish
- 5 misrali bandlar

---

## Badiiy san'atlar (tropelar)

| San'at | Ta'rif | Misol |
|--------|--------|-------|
| **Tashbeh** (o'xshatish) | bir narsani boshqasiga o'xshatish | Ko'zlaring — **yulduz** |
| **Istiora** (metafora) | yashirin o'xshatish | **Bahor** keldi (yoshlik) |
| **Kinoya** | teskari ma'no | Qanday **aqlli** ekan! |
| **Mubolag'a** | oshirib ko'rsatish | Ming yil kutdim |
| **Tazod** (antiteza) | zid tushunchalar | kecha va kunduz |

---

## BMBA uchun muhim
> **G'azal** — o'zbek klassik she'riyatining asosiy shakli
> Navoiy g'azallarida **"Navoiy"** taxallusi oxirgi baytda ishlatiladi
> Ruboiy — fors-tojik she'riyatidan o'zlashgan, **Umar Xayyom** bilan mashhur
""",
    },


    # ─────────────────────────────────────────────────────────────────────────
    # MATEMATIKA  (10 dars)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "subject": Subject.MATHEMATICS,
        "order_index": 1,
        "xp_reward": 60,
        "era_tag": None,
        "title": "Algebra: Kvadrat tenglamalar",
        "content_markdown": """# Kvadrat tenglamalar

## Ta'rif
**ax² + bx + c = 0** ko'rinishidagi tenglama, bunda a ≠ 0.

---

## Yechish usullari

### 1. Diskriminant formulasi
**D = b² - 4ac**

| D holati | Yechim soni |
|----------|-------------|
| D > 0 | 2 ta haqiqiy ildiz |
| D = 0 | 1 ta ildiz (ikki karra) |
| D < 0 | Haqiqiy ildiz yo'q |

**Ildizlar formulasi:**
```
x₁,₂ = (-b ± √D) / (2a)
```

### 2. Viyeta teoremasi
Ildizlar x₁ va x₂ bo'lsa:
```
x₁ + x₂ = -b/a
x₁ · x₂ = c/a
```

### 3. To'liq kvadratga ajratish
**x² + 6x + 9 = 0**
→ **(x + 3)² = 0**
→ **x = -3**

### 4. Ko'paytuvchilarga ajratish
**x² - 5x + 6 = 0**
→ **(x - 2)(x - 3) = 0**
→ **x = 2** yoki **x = 3**

---

## Misollar

**1-misol:** x² - 5x + 6 = 0
- D = 25 - 24 = 1
- x₁ = (5 + 1)/2 = **3**
- x₂ = (5 - 1)/2 = **2**

**2-misol:** Viyeta orqali
x² + px + 12 = 0 tenglamaning bir ildizi 3 bo'lsa, ikkinchi ildizini toping.
- x₁ · x₂ = 12 → 3 · x₂ = 12 → **x₂ = 4**

---

## Parametrli tenglamalar (BMBA uchun)
**x² - 2ax + a² - 1 = 0**

D = 4a² - 4(a² - 1) = 4 > 0 → har doim 2 ta ildiz

x₁,₂ = (2a ± 2)/2 = **a ± 1**

---

## Amaliy masalalar (DTM)
> Sonning kvadrati va uch barobari yig'indisi 18 ga teng. Sonni toping.
> x² + 3x = 18 → x² + 3x - 18 = 0 → (x+6)(x-3) = 0
> x = **3** (musbat son)
""",
    },

    {
        "subject": Subject.MATHEMATICS,
        "order_index": 2,
        "xp_reward": 60,
        "era_tag": None,
        "title": "Geometriya: Pifagor teoremasi va trigonometriya",
        "content_markdown": """# Pifagor teoremasi va trigonometriya asoslari

## Pifagor teoremasi
To'g'ri burchakli uchburchakda:

**a² + b² = c²**

Bu yerda:
- **a, b** — katetlar
- **c** — gipotenuza (to'g'ri burchakka qarshi tomon)

---

## Standart uchburchaklar

| Katetlar | Gipotenuza | Nisbat |
|---------|-----------|--------|
| 3, 4 | **5** | 3:4:5 |
| 5, 12 | **13** | 5:12:13 |
| 8, 15 | **17** | 8:15:17 |
| 7, 24 | **25** | 7:24:25 |

---

## Trigonometrik nisbatlar

To'g'ri burchakli uchburchakda α burchak uchun:

| Funksiya | Ta'rif | Formula |
|---------|--------|---------|
| **sin α** | qarshi katet / gipotenuza | a/c |
| **cos α** | yonma-yon katet / gipotenuza | b/c |
| **tan α** | qarshi / yonma-yon | a/b |
| **cot α** | yonma-yon / qarshi | b/a |

---

## Asosiy identifiklar

```
sin²α + cos²α = 1
tan α = sin α / cos α
1 + tan²α = 1/cos²α
1 + cot²α = 1/sin²α
```

---

## Maxsus burchaklar jadvali

| Burchak | sin | cos | tan |
|--------|-----|-----|-----|
| **0°** | 0 | 1 | 0 |
| **30°** | 1/2 | √3/2 | 1/√3 |
| **45°** | √2/2 | √2/2 | 1 |
| **60°** | √3/2 | 1/2 | √3 |
| **90°** | 1 | 0 | ∞ |

---

## Yig'indi va ayirma formulalari
```
sin(α ± β) = sin α cos β ± cos α sin β
cos(α ± β) = cos α cos β ∓ sin α sin β
```

---

## BMBA uchun masalalar

**1-misol:** sin α = 3/5 bo'lsa, cos α va tan α ni toping.
- cos²α = 1 - 9/25 = 16/25 → cos α = **4/5**
- tan α = (3/5)/(4/5) = **3/4**

**2-misol:** Gipotenuza 10, bir katet 6 bo'lsa, ikkinchi katet?
- b² = 100 - 36 = 64 → b = **8**
""",
    },

    {
        "subject": Subject.MATHEMATICS,
        "order_index": 3,
        "xp_reward": 70,
        "era_tag": None,
        "title": "Logarifm va ko'rsatkichli funksiyalar",
        "content_markdown": """# Logarifm va ko'rsatkichli funksiyalar

## Ko'rsatkichli funksiya: y = aˣ

### Xossalari (a > 0, a ≠ 1):
- **a⁰ = 1** (har doim)
- **aˣ · aʸ = aˣ⁺ʸ**
- **aˣ / aʸ = aˣ⁻ʸ**
- **(aˣ)ʸ = aˣʸ**

---

## Logarifm ta'rifi

**log_a(b) = x** ↔ **aˣ = b**

Bu yerda: a > 0, a ≠ 1, b > 0

### Maxsus logarifmlar:
- **ln x** = log_e(x) — natural logarifm (e ≈ 2,718)
- **lg x** = log₁₀(x) — o'nlik logarifm

---

## Logarifm xossalari

```
log_a(mn) = log_a(m) + log_a(n)
log_a(m/n) = log_a(m) - log_a(n)
log_a(mⁿ) = n · log_a(m)
log_a(a) = 1
log_a(1) = 0
log_a(b) = log_c(b) / log_c(a)  (asosni almashtirish)
```

---

## Logarifmik tenglamalar

### Tur 1: log_a(f(x)) = log_a(g(x))
→ f(x) = g(x), f(x) > 0, g(x) > 0

**Misol:** log₂(x+1) = log₂(3)
→ x + 1 = 3 → **x = 2** ✓ (x+1 = 3 > 0)

### Tur 2: log_a(f(x)) = b
→ f(x) = aᵇ

**Misol:** log₃(2x-1) = 2
→ 2x - 1 = 9 → **x = 5** ✓

### Tur 3: Ko'rsatkichli tenglama
**2ˣ = 32**
→ 2ˣ = 2⁵ → **x = 5**

**3²ˣ⁺¹ = 27**
→ 3²ˣ⁺¹ = 3³ → 2x+1 = 3 → **x = 1**

---

## Aniqlik sohalari (BMBA uchun!)

Logarifmik funksiyaning aniqlik sohasi: **argument > 0**

**log(x² - 4)** uchun:
x² - 4 > 0 → x² > 4 → **x < -2** yoki **x > 2**

---

## BMBA uchun masala

**log₂(x) + log₂(x-2) = 3** ni yeching.

- log₂(x(x-2)) = 3
- x(x-2) = 8
- x² - 2x - 8 = 0
- (x-4)(x+2) = 0
- x = 4 yoki x = -2
- Tekshirish: x = 4 ✓ (4 > 0 va 2 > 0), x = -2 ✗ (manfiy)
- **Javob: x = 4**
""",
    },

    {
        "subject": Subject.MATHEMATICS,
        "order_index": 4,
        "xp_reward": 60,
        "era_tag": None,
        "title": "Progressiyalar: Arifmetik va geometrik",
        "content_markdown": """# Progressiyalar

## Arifmetik progressiya (AP)

### Ta'rif
Har bir keyingi element oldingi elementdan **doimiy son (d)** ga farq qiladi.

**a₁, a₂, a₃, ...** bunda **aₙ = a₁ + (n-1)d**

### Formulalar:
```
n-chi had:     aₙ = a₁ + (n-1)d
Yig'indi:      Sₙ = n(a₁ + aₙ)/2 = n(2a₁ + (n-1)d)/2
```

### O'rta arifmetik:
a_(n) = (a_(n-1) + a_(n+1)) / 2

---

## Geometrik progressiya (GP)

### Ta'rif
Har bir keyingi element oldingi elementdan **doimiy son (q ≠ 0)** ga **ko'paytiriladi**.

**b₁, b₂, b₃, ...** bunda **bₙ = b₁ · q^(n-1)**

### Formulalar:
```
n-chi had:     bₙ = b₁ · q^(n-1)
Yig'indi:      Sₙ = b₁(qⁿ - 1)/(q - 1), q ≠ 1
              Sₙ = n·b₁,  q = 1
Cheksiz GP:   S∞ = b₁/(1-q), |q| < 1 bo'lsa
```

### O'rta geometrik:
b_(n)² = b_(n-1) · b_(n+1)

---

## Misollar

**AP misoli:**
2, 5, 8, 11, ... → d = 3
- 10-chi had: a₁₀ = 2 + 9·3 = **29**
- S₁₀ = 10·(2+29)/2 = **155**

**GP misoli:**
3, 6, 12, 24, ... → q = 2
- 6-chi had: b₆ = 3·2⁵ = **96**
- S₅ = 3·(2⁵-1)/(2-1) = 3·31 = **93**

---

## BMBA uchun masalalar

**1-masala:** AP da a₁ = 3, d = 4 bo'lsa, S₂₀ = ?
S₂₀ = 20·(2·3 + 19·4)/2 = 20·(6+76)/2 = 20·41 = **820**

**2-masala:** GP da b₁ = 16, b₅ = 1. q ni toping.
16·q⁴ = 1 → q⁴ = 1/16 → q = **1/2**

**3-masala:** Cheksiz GP yig'indisi:
b₁ = 12, q = 1/3 → S∞ = 12/(1-1/3) = 12/(2/3) = **18**
""",
    },

    {
        "subject": Subject.MATHEMATICS,
        "order_index": 5,
        "xp_reward": 70,
        "era_tag": None,
        "title": "Tengsizliklar va ularni yechish",
        "content_markdown": """# Tengsizliklar

## Tengsizlik xossalari

1. Ikkala tarafga bir xil son qo'shish/ayirish mumkin (belgi o'zgarmaydi)
2. Ikkala tarafni **musbat** songa ko'paytirish/bo'lish (belgi o'zgarmaydi)
3. Ikkala tarafni **manfiy** songa ko'paytirish/bo'lish (**belgi o'zgaradi!**)

---

## Chiziqli tengsizliklar

**2x - 3 > 7**
→ 2x > 10
→ x > 5
→ Yechim: **(5; +∞)**

**-3x + 6 ≤ 0**
→ -3x ≤ -6
→ x ≥ 2 (manfiy ga bo'ldik, belgi o'zgardi!)
→ Yechim: **[2; +∞)**

---

## Kvadratik tengsizliklar

**ax² + bx + c > 0** yoki **< 0**

### Yechish tartibi:
1. Tenglamani yeching: ax² + bx + c = 0 → x₁, x₂
2. x₁ < x₂ deb oling
3. Grafikni chizing (parabola)

| a > 0 parabola | **> 0** | **< 0** |
|----------------|---------|---------|
| | x < x₁ yoki x > x₂ | x₁ < x < x₂ |

**Misol:** x² - 5x + 6 > 0
- Ildizlar: x = 2, x = 3
- a = 1 > 0, parabola yuqoriga
- **x < 2** yoki **x > 3**

---

## Kasr tengsizliklar

**(x-1)/(x+2) > 0**

Nol nuqtalar: x = 1 (surat), x = -2 (maxraj)

Raqamlar o'qi:
```
-2        1
---(-2)---(1)---
  -        +      +   (maxraj va surat belgilari)
```

Intervalli usul:
- x < -2: ikkalasi ham manfiy → musbat ✓
- -2 < x < 1: faqat maxraj musbat → manfiy ✗
- x > 1: ikkalasi ham musbat → musbat ✓

**Javob: x < -2 yoki x > 1** (x ≠ -2)

---

## Modulli tengsizliklar

**|x - 3| < 5**
→ -5 < x - 3 < 5
→ **-2 < x < 8**

**|2x + 1| ≥ 3**
→ 2x + 1 ≤ -3 yoki 2x + 1 ≥ 3
→ x ≤ -2 yoki x ≥ 1
""",
    },

    {
        "subject": Subject.MATHEMATICS,
        "order_index": 6,
        "xp_reward": 60,
        "era_tag": None,
        "title": "Kombinatorika: Permutatsiya, kombinatsiya",
        "content_markdown": """# Kombinatorika

## Asosiy qoidalar

### Ko'paytirish qoidasi
Agar birinchi ish n usulda, ikkinchi ish m usulda bajariladigan bo'lsa, ikkala ish birga **n × m** usulda bajariladi.

### Qo'shish qoidasi
Agar birinchi **YOKI** ikkinchi ish bajarilsa: **n + m** usul.

---

## Permutatsiya (tartibli joylashtirish)

### n ta elementdan n tasini joylashtirish:
**Pₙ = n!** (n faktorial)

n! = 1 × 2 × 3 × ... × n

| n | n! |
|---|-----|
| 0 | 1 |
| 1 | 1 |
| 2 | 2 |
| 3 | 6 |
| 4 | 24 |
| 5 | 120 |

### n ta elementdan k tasini joylashtirish (tartib muhim):
**Aⁿₖ = n! / (n-k)!**

---

## Kombinatsiya (tartibsiz tanlash)

n ta elementdan k tasini tanlash (tartib **muhim emas**):
```
Cⁿₖ = n! / (k! × (n-k)!)
```

**Muhim xossalar:**
- Cⁿ₀ = Cⁿₙ = 1
- Cⁿₖ = Cⁿ_(n-k)
- Pascal uchburchagi

---

## Binominal koeffitsiyentlar (Nyuton binomi)
**(a + b)ⁿ = Σ Cⁿₖ · a^(n-k) · bᵏ**

**(a + b)³ = a³ + 3a²b + 3ab² + b³**

---

## BMBA uchun masalalar

**1-masala:** 5 kishidan 3 kishilik komissiya necta usulda tuziladi?
C⁵₃ = 5!/(3!·2!) = 120/12 = **10**

**2-masala:** 4 xonali son, raqamlar takrorlanmasin, 1-3-5-7 raqamlaridan:
- 1-o'rinda 4 ta imkoniyat
- 2-o'rinda 3 ta (biri ketdi)
- 3-o'rinda 2 ta
- 4-o'rinda 1 ta
- Jami: 4 × 3 × 2 × 1 = 4! = **24**

**3-masala:** "MATEMATIKA" so'zidagi harflarni joylashtirish (takrorlanuvchi):
- Jami harf: 9 (M-2, A-3, T-2, E-1, I-1, K-1)
- **9! / (2! × 3! × 2!)** = 362880/24 = **15120**
""",
    },

    {
        "subject": Subject.MATHEMATICS,
        "order_index": 7,
        "xp_reward": 60,
        "era_tag": None,
        "title": "Geometriya: Aylana va doira",
        "content_markdown": """# Aylana va doira

## Ta'riflar

- **Aylana** — markazdan teng masofada joylashgan nuqtalar to'plami (faqat chiziq)
- **Doira** — markaz va aylana ichidagi barcha nuqtalar (tekislik qismi)

---

## Asosiy formulalar

| Kattalik | Formula |
|---------|---------|
| Aylana uzunligi | **L = 2πr = πd** |
| Doira yuzi | **S = πr²** |
| Sektor yuzi | **S = πr²α/360°** |
| Yoy uzunligi | **l = πrα/180°** |

Bu yerda r — radius, d — diametr, α — markaziy burchak (gradus)

---

## Burchaklar

### Markaziy burchak
Aylana markazi — uchida:
**Markaziy burchak = yoy daraja o'lchovi**

### Yozilgan burchak (inscribed angle)
Aylana ustidagi nuqtada:
**Yozilgan burchak = markaziy burchak / 2**

### Amaliy xossalar:
- **Diametrga tayanuvchi yozilgan burchak = 90°**
- Bir yoyga tayanuvchi barcha yozilgan burchaklar **teng**

---

## Uchburchak va aylana

### Ichki aylana (inscribed circle — inradius r)
Uchburchak ichida, uch tomonga tegib turadi:
```
r = S / p
```
Bu yerda S — uchburchak yuzi, p — yarim perimetr

### Tashqi aylana (circumscribed circle — R)
Barcha uchlardan o'tadi:
```
R = abc / (4S)
```
To'g'ri burchakli uchburchak uchun: **R = c/2** (gipotenuza/2)

---

## BMBA uchun misollar

**1-masala:** r = 5 sm bo'lgan doiraning yuzi?
S = π·25 = **25π sm²**

**2-masala:** Markaziy burchak 120°, r = 6 bo'lsa, sektor yuzi?
S = π·36·120/360 = **12π**

**3-masala:** Diametr 10 ga teng uchburchakga o'ralgan to'g'ri burchakli uchburchakning gipotenuzasi?
To'g'ri burchakli uchburchak uchun R = c/2, yani c = 2R = **10**
""",
    },

    {
        "subject": Subject.MATHEMATICS,
        "order_index": 8,
        "xp_reward": 70,
        "era_tag": None,
        "title": "Funksiyalar: Ta'rif, xossalari, grafiklari",
        "content_markdown": """# Funksiyalar

## Ta'rif
**y = f(x)** — x ning har bir qiymatiga y ning bitta qiymati mos keladi.

- **Aniqlik sohasi (domain)** = D(f) — x qabul qila oladigan qiymatlar
- **Qiymatlar to'plami (range)** = E(f) — y qabul qiladigan qiymatlar

---

## Asosiy funksiyalar

### 1. Chiziqli: y = kx + b
- Graf: to'g'ri chiziq
- k > 0 → o'suvchi; k < 0 → kamayuvchi
- b → y o'qi bilan kesishish nuqtasi

### 2. Kvadratik: y = ax² + bx + c
- Graf: parabola
- Uchi: x₀ = -b/(2a), y₀ = f(x₀)
- a > 0 → "ulkan" (ustma-ust); a < 0 → "teskari"

### 3. Giperbola: y = k/x (k ≠ 0)
- D(f): x ≠ 0
- Asimptotalar: x = 0 va y = 0

### 4. Ildiz funksiya: y = √x
- D(f): x ≥ 0
- E(f): y ≥ 0

### 5. Ko'rsatkichli: y = aˣ
- a > 1: o'suvchi; 0 < a < 1: kamayuvchi
- Graf har doim (0; 1) nuqtadan o'tadi

---

## Funksiya xossalari

### Toq va juft funksiyalar
- **Juft** f(-x) = f(x): y o'qi bilan simmetrik (cos x, x²)
- **Toq** f(-x) = -f(x): koordinatalar boshi bilan simmetrik (sin x, x³)

### Monotonlik
- **O'suvchi**: x₁ < x₂ → f(x₁) < f(x₂)
- **Kamayuvchi**: x₁ < x₂ → f(x₁) > f(x₂)

---

## Teskari funksiya
y = f(x) → x = f⁻¹(y)

Grafik: y = x to'g'ri chizig'iga nisbatan simmetrik

---

## BMBA uchun masalalar

**1-masala:** f(x) = x² - 4 funksiyaning aniqlik sohasi?
Hamma x uchun ta'riflanadi → **D(f) = (-∞; +∞)**

**2-masala:** f(x) = √(3-x) funksiyaning aniqlik sohasi?
3 - x ≥ 0 → x ≤ 3 → **D(f) = (-∞; 3]**

**3-masala:** f(x) = 1/(x²-4) uchun D(f)?
x² - 4 ≠ 0 → x ≠ ±2 → **D(f) = ℝ \ {-2; 2}**
""",
    },

    {
        "subject": Subject.MATHEMATICS,
        "order_index": 9,
        "xp_reward": 70,
        "era_tag": None,
        "title": "Ehtimollik nazariyasi asoslari",
        "content_markdown": """# Ehtimollik nazariyasi

## Asosiy tushunchalar

| Tushuncha | Ta'rif |
|---------|--------|
| **Tajriba** | Aniq sharoitda o'tkaziladigan amal |
| **Hodisa** | Tajriba natijasi |
| **Elementar hodisa** | Ajralmaz natija |
| **Ehtimollik P(A)** | Hodisa bo'lish chastotasi |

---

## Klassik ehtimollik

**P(A) = m/n**

- **m** — qulay (A uchun) elementar hodisalar soni
- **n** — barcha mumkin hodisalar soni

**Shartlar:** barcha natijalar teng ehtimollik.

---

## Ehtimollik xossalari

```
0 ≤ P(A) ≤ 1
P(Ω) = 1  (ishonchli hodisa)
P(∅) = 0  (imkonsiz hodisa)
P(Ā) = 1 - P(A)  (qarama-qarshi hodisa)
```

---

## Hodisalarning qo'shilishi

### Mos kelmaydigan hodisalar:
**P(A ∪ B) = P(A) + P(B)**

### Mos keladigan hodisalar:
**P(A ∪ B) = P(A) + P(B) - P(A ∩ B)**

---

## Hodisalarning ko'paytirilishi

### Mustaqil hodisalar:
**P(A ∩ B) = P(A) · P(B)**

### Qaram hodisalar (shartli ehtimollik):
**P(A ∩ B) = P(A) · P(B|A)**

Bu yerda **P(B|A)** — A bo'lganda B ning ehtimolligi.

---

## BMBA uchun misollar

**1-masala:** Qutida 6 qizil, 4 yashil shar. Tasodifiy shar olindi. Qizil bo'lish ehtimoli?
P = 6/10 = **3/5 = 0.6**

**2-masala:** Zar ikki marta tashlandi. Ikkalasi ham juft son bo'lish ehtimoli?
P(juft₁) = 3/6 = 1/2
P(juft₂) = 1/2
P(ikkala juft) = 1/2 · 1/2 = **1/4**

**3-masala:** 52 ta karta. Tuzi yoki qiz bo'lish ehtimoli?
P(tuz) = 4/52, P(qiz) = 4/52, P(tuz qiz) = 1/52
P = 4/52 + 4/52 - 1/52 = **7/52**
""",
    },

    {
        "subject": Subject.MATHEMATICS,
        "order_index": 10,
        "xp_reward": 80,
        "era_tag": None,
        "title": "Harakat va ish masalalari (Mantiqiy masalalar)",
        "content_markdown": """# Harakat va ish masalalari

## Harakat masalalari

### Asosiy formula:
**S = v · t**
- S — yo'l (masofa)
- v — tezlik
- t — vaqt

### Uchrashuv masalasi
Ikki jism bir-biriga qarab harakatlanadi:
```
S_umumiy = (v₁ + v₂) · t
```

### Quvib yetish masalasi
Ikki jism bir tomonga harakatlanadi:
```
Farq = (v₁ - v₂) · t  (v₁ > v₂)
```

### Oqim bilan/qarshi
- Oqim bilan: **v = v_qayiq + v_oqim**
- Oqimga qarshi: **v = v_qayiq - v_oqim**

---

## BMBA harakat masalalari

**1-masala:** Ikki shahar 360 km. Birinchi mashina 60 km/h, ikkinchisi 80 km/h, bir-biriga qarab chiqdi. Qachon uchrashadilar?
t = 360/(60+80) = 360/140 = **18/7 ≈ 2.57 soat**

**2-masala:** Qayiq oqim bilan 3 soatda 30 km bordi. Oqimga qarshi 5 soatda 30 km bordi. Qayiq va oqim tezligi?
- Oqim bilan: (v+u) = 10
- Oqimga qarshi: (v-u) = 6
- v = 8 km/h, u = 2 km/h

---

## Ish masalalari

### Asosiy formula:
**A = P · t**
- A — ish hajmi (= 1, butun ish)
- P — mehnat unumdorligi (1 birlik vaqtda bajariladigan ish)
- t — vaqt

### Birgalikda ishlash:
```
1/t_birga = 1/t₁ + 1/t₂
```

---

## BMBA ish masalalari

**1-masala:** Birinchi usta ishni 6 kunda, ikkinchisi 12 kunda bajaradi. Birga necha kunda?
1/t = 1/6 + 1/12 = 2/12 + 1/12 = 3/12 = 1/4
t = **4 kun**

**2-masala:** Birinchi kran 8 soatda, ikkinchisi 12 soatda hovuzni to'ldiradi, uchinchisi esa 24 soatda bo'shatadi. Uchalasi ishlasa necha soatda to'ladi?
1/t = 1/8 + 1/12 - 1/24 = 3/24 + 2/24 - 1/24 = 4/24 = 1/6
t = **6 soat**

---

## Foiz masalalari

**Foiz = asosiy son × foiz miqdori / 100**

**Misol:** 2000 so'mning 15% i?
2000 × 15/100 = **300 so'm**

**O'sish:** yangi = eski × (1 + r/100)ⁿ
**Kamayish:** yangi = eski × (1 - r/100)ⁿ
""",
    },


    # ─────────────────────────────────────────────────────────────────────────
    # O'ZBEKISTON TARIXI  (10 dars)
    # ─────────────────────────────────────────────────────────────────────────
    {
        "subject": Subject.HISTORY,
        "order_index": 1,
        "xp_reward": 60,
        "era_tag": "ANCIENT",
        "title": "Qadimgi O'zbekiston: Ilk davlatlar va madaniyat",
        "content_markdown": """# Qadimgi O'zbekiston: Ilk davlatlar va madaniyat

## Eng qadimgi yodgorliklar

| Yodgorlik | Joylashuv | Davr |
|----------|---------|------|
| **Selungur** | Farg'ona | Paleolit (500 000 yil oldin) |
| **Teshiktosh** | Surxondaryo | Neandertal odam (100 000 yil) |
| **Zarafshon vodiysidagi** topilmalar | Samarqand | Mezolit |

---

## Bronza davri davlatlari (mil.avv. II ming yil)

### Zardushtiylik va Avesto
- **Zardusht** — Zardushtiylik dinining asoschisi (mil.avv. VII-VI asr)
- **"Avesto"** — muqaddas kitob, dunyoning eng qadimgi yozma yodgorligi
- Zardushtiylik: olov, suv, yer muqaddas
- **Yaxshi fikr, yaxshi so'z, yaxshi amal** — asosiy tamoyil

---

## Miloddan avvalgi davlat birlashmalari

### Baqtriya
- Joylashuv: Surxondaryo, Qashqadaryo, Afg'oniston
- Poytaxti: **Balx**
- Mil.avv. VI–IV asrlar

### So'g'diyona
- Joylashuv: Zarafshon vodiysi
- Poytaxti: **Maroqand** (hozirgi Samarqand)
- So'g'dlar — buyuk savdogarlar

### Xorazm
- Joylashuv: Amudaryo havzasi
- Poytaxti: **Topraqqal'a, Qo'yqirilg'an qal'a**
- Qadimgi davlatlardan biri

### Farg'ona (Dovon/Dayuan)
- Xitoy manbalarda: **Dayuan** (katta Yuechji/Farg'ona)
- Mashhur otlar: "Samoviy otlar" — Xitoy imperatori talabi

---

## Iskandar Zulqarnayn (mil.avv. 329–327)
- Makedoniyalik Aleksandr **Markaziy Osiyoni** bosib oldi
- Samarqand va Baqtriyani zabt etdi
- Yerli aholi **Spitamen** boshchiligida qarshilik ko'rsatdi

---

## Kushon davlati (I–IV asr)

| Xususiyat | Ma'lumot |
|---------|---------|
| **Hudud** | Hind, Afg'oniston, O'rta Osiyo |
| **Poytaxt** | Purushapura (Peshovar) |
| **Eng kuchli hukmdor** | **Kanishka** |
| **Din** | Buddizm + mahalliy dinlar |
| **Savdo** | Buyuk Ipak yo'lida asosiy davlat |

---

## Milodiy I–VI asr: Eftalitlar
- **"Oq Gunnlar"** deb ham ataladi
- Markaziy Osiyoning katta qismini boshqargan
- Buddizm va zardushtiylikni qo'llab-quvvatlagan
""",
    },

    {
        "subject": Subject.HISTORY,
        "order_index": 2,
        "xp_reward": 60,
        "era_tag": "ANCIENT",
        "title": "Buyuk Ipak yo'li va So'g'diyona savdosi",
        "content_markdown": """# Buyuk Ipak yo'li

## Ta'rif va ahamiyati
**Buyuk Ipak yo'li** — Xitoydan O'rta Osiyo orqali Yaqin Sharq va Evropaga boradigan qadimgi savdo yo'llari tizimi.

### Nomi
German geografi **Karl Ritter** (1877) tomonidan "Seidenstrasse" (Ipak yo'li) deb atalgan.

---

## Tarix

| Davr | Voqea |
|------|-------|
| **Mil.avv. 130-yillar** | Xitoy elchisi **Zhang Qian** Farg'onaga keldi |
| **II–I asr mil.avv.** | Yo'l faollashdi |
| **VII–VIII asr** | Eng rivojlangan davr (Sosoniylar, Tang sulolasi) |
| **XIII–XIV asr** | Mo'g'ullar davrida yana jonlangan |
| **XV asr** | Dengiz yo'llarining rivojlanishi bilan ahamiyati kamaydi |

---

## Yo'nalishlar

### Shimoliy yo'l:
Xitoy → Farg'ona → Samarqand → Parfiya → Rim

### Janubiy yo'l:
Xitoy → Koshg'ar → Baqtriya → Hindiston → Hind okeani

---

## So'g'diyona — savdoning markazi

**So'g'd savdogarlari** Ipak yo'lining asosiy tashuvchilariga aylangan:
- Samarqand, Buxoro, Paykand — katta savdo markazlari
- So'g'dcha yozuv — Ipak yo'lining umumiy tili
- So'g'dlar Xitoy, Hindiston, Vizantiya bilan savdo qilgan

### Eksport qilingan tovarlar:
| O'rta Osiyo → Sharq | O'rta Osiyo → G'arb |
|-------------------|-------------------|
| Ipak, porselyan | Mis, temir |
| Ziravorlar | Shisha buyumlar |
| Qimmatbaho toshlar | Oltin, kumush |

---

## Madaniy almashuvlar

Ipak yo'li faqat tovar emas, **g'oyalar va madaniyat** ham tashidi:
- **Buddizm** Hindistondan Xitoyga
- **Islom** G'arbdan Sharqqa
- **Qog'oz** Xitoydan G'arbga
- **Matematika** O'rta Osiyodan Evropaga

---

## UNESCO maqomi
2014 yilda **"Ipak yo'li: Chang'an — Tianshan korridori"** UNESCO Jahon merosi ro'yxatiga kiritildi (Xitoy, Qirg'iziston, Qozog'iston).

---

## BMBA uchun muhim
- Ipak yo'li — **mil.avv. II asr** dan boshlangan
- O'zbekiston shaharlari yo'lning **markaziy qismi**da joylashgan
- So'g'dlar — asosiy **vositachi savdogarlar**
""",
    },

    {
        "subject": Subject.HISTORY,
        "order_index": 3,
        "xp_reward": 70,
        "era_tag": "MEDIEVAL",
        "title": "Arab fathi va islomning tarqalishi (VII–IX asr)",
        "content_markdown": """# Arab fathi va islomning tarqalishi

## Arab fathidan oldin (VII asr boshi)

O'rta Osiyo holati:
- **Turk hoqonligi** siyosiy hukmronligi
- So'g'd savdogarlari iqtisodiy kuch
- Zardushtiylik asosiy din
- Ko'plab mayda mulklar (dehqonlar)

---

## Arab fathi (VII–VIII asr)

| Sana | Voqea |
|------|-------|
| **651** | Eron Sosoniy davlati qulab tushdi |
| **672** | Arablar Xuroson (Marvni) zabt etdi |
| **706–715** | Qutayba ibn Muslim O'rta Osiyoni fath etdi |
| **711–712** | **Samarqand** fath etildi |
| **712** | **Xorazm** va **Farg'ona** zabt etildi |
| **751** | **Talas jangi** — Arablar Tangut (Xitoy) ni to'xtatdi |

---

## Qutayba ibn Muslim
- Xuroson hokimi (705–715)
- O'rta Osiyoni tizimli ravishda zabt etdi
- Samarqand va Buxoroni islom markazlariga aylantirdi
- **715 yil** — Sulaymon xalifasi tomonidan o'ldirildi

---

## Talas jangi (751 yil)
- **Arab-Abbosiy** vs **Xitoy Tang sulolasi**
- O'rta Osiyoning kimga tegishli bo'lishi uchun
- Arablar **g'alaba** qildi
- **Natija:** Xitoy ta'siri chegaralandi; **qog'oz yasash siri** Yevropa va O'rta Osiyoga tarqaldi

---

## Islomning tarqalishi

### Bosqichlar:
1. **Majburlash davri** (VII–VIII asr) — soliq imtiyozlari bilan
2. **Ixtiyoriy qabul** (IX–X asr) — ma'naviy ta'sir, ilm markazlari
3. **To'liq islomlashtirish** (X–XI asr) — masjidlar, madrasalar

### O'zgarishlar:
- Zardushtiylik va buddizm o'rniga **islom**
- Arab yozuvi joriy etildi
- **Shariat** huquq tizimi
- Ilm-fan rivojlanishi (Abbosiylar davrida)

---

## Somoniylar davlati (875–999)

| Ma'lumot | Tafsilot |
|---------|---------|
| **Poytaxt** | Buxoro |
| **Asoschisi** | Somonxudo (Somon) avlodlari |
| **Hukmdori** | Ismoil Somoniy |
| **Ahamiyati** | O'zbek-tojik davlatchiligining beshigi |

**Ismoil Somoniy** (892–907):
- Buxoroni islom ilm-fan markaziga aylantirdi
- **Al-Buxoriy** (hadis olimi) Buxorodan
- Fors (tojik) adabiy tilini rivojlantirdi
""",
    },

    {
        "subject": Subject.HISTORY,
        "order_index": 4,
        "xp_reward": 70,
        "era_tag": "MEDIEVAL",
        "title": "Al-Xorazmiy, Ibn Sino va O'rta Osiyo olimlari",
        "content_markdown": """# O'rta Osiyo buyuk olimlari

## Muhammad ibn Muso al-Xorazmiy

| Ma'lumot | Tafsilot |
|---------|---------|
| **To'liq ismi** | Muhammad ibn Muso al-Xorazmiy |
| **Tug'ilgan joy** | Xorazm (hozirgi Xiva atrofi) |
| **Yashagan davr** | ~780–850 yil |
| **Ishlagan joy** | Bag'dod "Bayt ul-Hikma" |

### Asosiy kashfiyotlari:

#### 1. Algebra
- **"Kitob al-muxtasar fi hisob al-jabr va al-muqobala"** (820)
- "Al-jabr" → **Algebra** so'zining kelib chiqishi
- Birinchi marta kvadrat tenglamalar tizimli yechildi

#### 2. Algoritm
- Al-Xorazmiy nomi lotin tilida **Algorithmus** → **Algoritm**
- Hind raqamlari (0-9) Yevropa matematikasiga kiritdi

#### 3. Astronomiya va geografiya
- Yer shari aylana ekanini hisobladi
- Dunyo xaritasini yangiladi

---

## Abu Ali ibn Sino (Avitsenna)

| Ma'lumot | Tafsilot |
|---------|---------|
| **To'liq ismi** | Abu Ali al-Husayn ibn Abdulloh ibn Sino |
| **Tug'ilgan joy** | **Afshona** (hozirgi Buxoro viloyati) |
| **Tug'ilgan yil** | **980** yil |
| **Vafot** | **1037** yil, Hamаdon (Eron) |

### Asosiy asarlari:

#### "Tib qonunlari" (Al-Qanun fit-tibb)
- 5 jildlik tibbiy ensiklopediya
- **600 yil** Yevropa universitetlarida asosiy darslik
- 760 dan ortiq dori-darmon ta'rifi

#### "Kitob ash-Shifo" (Shifo kitobi)
- Falsafa, mantiq, tabiatshunoslik
- 18 jild
- Aristotel ta'limotini rivojlantirdi

### Ibn Sino kashfiyotlari:
- **Yuqumli kasalliklar** suv va havo orqali tarqaladi
- **Karantin** tushunchasi
- Ko'z anatomiyasi
- Psixologiya asoslari

---

## Abu Rayhon Beruniy

| Ma'lumot | Tafsilot |
|---------|---------|
| **Tug'ilgan joy** | Kath (Xorazm) |
| **Yashagan davr** | **973–1048** |

### Kashfiyotlari:
- Yer radiusini hisobladi (**6339,6 km** — hozirgi 6371 km)
- **"Hindiston"** asari — hinduizm va Hindiston tavsifi
- **"Mineralogiya"** asari
- Heliografik usul bilan joy aniqlashtirdi

---

## Muhammad al-Farg'oniy (Alfraganus)

- Farg'onadan chiqqan olim (IX asr)
- Astronomiya va geografiya
- Bag'dod "Bayt ul-Hikma" da ishlagan
- Asarlari **lotin** tiliga tarjima qilingan

---

## BMBA uchun muhim faktlar

| Olim | Asosiy soha | Mashxur asar |
|------|------------|-------------|
| **Al-Xorazmiy** | Matematika | Al-jabr (Algebra) |
| **Ibn Sino** | Tibbiyot | Tib qonunlari |
| **Beruniy** | Geografiya, astronomiya | Hindiston |
| **Al-Farg'oniy** | Astronomiya | Astronomiya asoslari |
""",
    },

    {
        "subject": Subject.HISTORY,
        "order_index": 5,
        "xp_reward": 80,
        "era_tag": "MEDIEVAL",
        "title": "Amir Temur va Temuriylar davlati",
        "content_markdown": """# Amir Temur va Temuriylar davlati

## Amir Temur

| Ma'lumot | Tafsilot |
|---------|---------|
| **To'liq ismi** | Temur ibn Taragay Barlos |
| **Laqabi** | Amir Temur, Temur Ko'ragon, Sohibqiron |
| **Tug'ilgan joy** | **Kesh** (hozirgi Shahrisabz) |
| **Tug'ilgan yil** | **1336 yil, 9-aprel** |
| **Vafot** | **1405 yil, 18-fevral**, Otror (hozirgi Qozog'iston) |
| **Poytaxt** | **Samarqand** |

---

## Hokimiyatga kelishi

1. **1361** — Kesh hokimi bo'ldi
2. **1370** — Movarounnahr amiri bo'ldi (Balxda kurultoy)
3 **1388–1398** — Xuroson, Eron, Hindiston yurishlari
4. **1402** — **Anqara jangi** — Usmonli sulton Boyazidni asir oldi
5. **1404** — Xitoyga yurish tayyorlandi (Otrorga yetib vafot etdi)

---

## Harbiy yurishlar xaritasi

| Yo'nalish | Mamlakat | Natija |
|----------|---------|--------|
| G'arb | Oltin O'rda, Eron, Misr | G'alaba |
| Janub | Hindiston (Delhi) | Dehli talon-taroj |
| Shimol | Toxtamish (Oltin O'rda) | G'alaba |
| G'arb | Usmonli Turkiya | Anqara jangi g'alaba |

---

## Qonun va boshqaruv

### "Temur tuzuklari"
Amir Temurning **siyosiy vasiyatnomasi**:
- Adolat va qonun ustuvorligi
- Harbiy tashkilot
- Savdo va iqtisodiyot
- Ilm-fan va me'morchilikni qo'llash

**Mashhur iboralari:**
> "Kuch — adolatda"
> "Qaysi dinga mansub bo'lmasin, adolat bilan muomala qil"

---

## Samarqand — jahon poytaxti

Amir Temur Samarqandni buyuk poytaxtga aylantirdi:

| Me'moriy yodgorlik | Hozirgi holat |
|------------------|--------------|
| **Bibi-Xonim masjidi** | Samarqand |
| **Oq Saroy** | Shahrisabz |
| **Shohizinda** | Samarqand |
| **Go'ri Amir** | Samarqand (Temur maqbarasi) |

---

## Temuriylar (1405–1500)

### Shahruh (1405–1447)
- Hirot poytaxti
- Ilm-fan, adabiyot gulladi
- Kamoliddion Behzod — miniatura san'ati

### Ulug'bek (1409–1449)
- **Rasadxona** qurdi (1428–1429)
- **"Zij Sultoniy"** — yulduzlar katalogi
- Trigonometrik jadvallar (sin 1° = 0,0174524...)
- **1449** — o'z o'g'li tomonidan o'ldirildi

### Husayn Boyqaro (1469–1506)
- Hиrot saroyida Navoiy bosh vazir
- O'zbek adabiyotining **oltin davri**

---

## BMBA uchun muhim
- Amir Temur: **1336** (Shahrisabz) — **1405** (Otror)
- **Anqara jangi 1402** — Boyazidni asir oldi
- **Ulug'bek rasadxonasi** — O'rta asrlar astronomiyasining cho'qqisi
- **"Temur tuzuklari"** — siyosiy hujjat
""",
    },

    {
        "subject": Subject.HISTORY,
        "order_index": 6,
        "xp_reward": 70,
        "era_tag": "COLONIAL",
        "title": "Rossiya bosqini va mustamlaka davr (XIX asr)",
        "content_markdown": """# Rossiya bosqini va mustamlaka davr

## Bosqin oldidagi vaziyat (XIX asr o'rtalari)

O'rta Osiyoda **3 ta xonlik**:
1. **Qo'qon xonligi** (1709–1876) — poytaxt Qo'qon
2. **Buxoro amirligi** (1785–1920) — poytaxt Buxoro
3. **Xiva xonligi** (1511–1920) — poytaxt Xiva

---

## Rossiya bosqinining sabablari

1. **Iqtisodiy**: paxta, xom ashyo
2. **Harbiy-strategik**: Britaniya (Hindiston) ga qarshi himoya
3. **Siyosiy**: Qrim urushi (1853–1856) da mag'lubiyatdan keyin obro' tiklash

---

## Bosqin bosqichlari

| Yil | Voqea |
|-----|-------|
| **1853** | Oq-Masjid (Qo'qon) olindi, Perovsk deb o'zgartirildi |
| **1864** | Turkiston shahri olindi |
| **1865** | **Toshkent** olindi (general Chernayev) |
| **1866** | Xo'jand va Jizzax |
| **1868** | **Samarqand** va **Buxoro** bostirilib, shartnoma imzolandi |
| **1873** | **Xiva** tor-mor etildi |
| **1876** | **Qo'qon xonligi** tugatilib, Farg'ona viloyati tuzildi |
| **1881** | Turkmani istilo qilindi |
| **1884** | Marv (Türkmeniston) bosib olindi |

---

## Mustamlaka tizimi

### Turkiston general-gubernatorligi (1867)
- Birinchi general-gubernator: **Konstantin fon Kaufman**
- Markaziy boshqaruv Toshkentda
- Rossiya qonunlari qo'llanildi (mahalliy qonunlar cheklangan)

### Iqtisodiy ekspluatatsiya:
- **Paxta yakkahokimligi** — bug'doy o'rniga paxta ektirildi
- Oziq-ovqat importiga qaramlik
- Temir yo'l (1898-yil Toshkent–Krasnovodsk)
- Mahalliy hunarmandchilik parchalanishi

---

## Qo'zg'olonlar

### 1898 yil Andijon qo'zg'oloni
- Rahbar: **Muhammad Ali Xalfa (Dukchi Eshon)**
- Minglab ishtirokchi
- Qattiq bostirildi, Dukchi Eshon qatl etildi

### 1916 yil qo'zg'oloni
- **Sabab**: Rossiya birinchi jahon urushiga mahalliylarni katta-harb orqa qo'shin ishlariga jalb qildi
- **Qo'rg'on-Tepa**, **Samarqand**, **Jizzax** qo'zg'olonlari
- Ming-minglab o'zbek qatl etildi yoki qochishga majbur bo'ldi

---

## Jadidchilik harakati
- **XIX asr oxiri — XX asr boshi**
- Rahbarlar: **Mahmudxo'ja Behbudiy**, Munavvar Qori, Abdulla Avloniy
- Maqsad: yangi usul maktabi, milliy matbuot, xotin-qizlar erkinligi
- **1914**: "Padarkush" — birinchi o'zbek dramasi (Behbudiy)

---

## BMBA uchun muhim
- Toshkent: **1865** (Chernayev)
- Buxoro shartnomasi: **1868**
- **Dukchi Eshon qo'zg'oloni: 1898**
- **1916** qo'zg'oloni — eng katta milliy qo'zg'olon
""",
    },

    {
        "subject": Subject.HISTORY,
        "order_index": 7,
        "xp_reward": 60,
        "era_tag": "SOVIET",
        "title": "Sovet davri O'zbekiston (1917–1991)",
        "content_markdown": """# Sovet davri O'zbekiston

## 1917 yil inqilobi va O'rta Osiyo

| Voqea | Sana |
|-------|------|
| **Fevral inqilobi** | 1917 yil mart |
| **Oktyabr inqilobi** | 1917 yil noyabr |
| **Turkiston Muxtoriyati (Qo'qon)** | 1917 noyabr |
| **Qo'qon Muxtoriyati tor-mor** | **1918 fevral** |

---

## Qo'qon Muxtoriyati (1917–1918)
- O'zbek milliy hukumati
- **Rahbar**: Muhammad Yusuf To'jaboyev, Mustafa Cho'qay
- Asosiy g'oya: Turkiston muxtoriyati
- **1918 yil fevral** — Qizil Armiya tomonidan bostirildi (10 000 dan ortiq o'ldirilib)

---

## Bosmachilik harakati (1918–1930-lar)
- **"Bosmachilar"** — sovet hokimiyatiga qarshi kurashchilar
- Farg'ona vodiysi, Buxoro, Xorazm
- Rahbarlar: **Madaminbek, Ibrohimbek, Enver Posho**
- 1930-yillargacha davom etdi

---

## O'zbekiston SSR tashkil etilishi

### 1924 yil milliy-hududiy chegaralash
- **1924 yil 27-oktabr** — **O'zbekiston SSR** tashkil etildi
- Birinchi prezident: **Fayzulla Xo'jayev**
- Poytaxt: Samarqand (1930 yilgacha), keyin Toshkent

---

## Sovet siyosati

### Kollektivlashtirish (1929–1933)
- Fermer xo'jaliklari kolxozlarga birlashtirildi
- Paxta yakkahokimligi kuchaytirildi
- Qashshoqlik va ocharchilik

### Repressiyalar (1937–1938)
Sovet hukumati milliy ziyolilarni qirdi:
- **Abdulla Qodiriy** (romancichi)
- **Cho'lpon** (shoir)
- **Fitrat** (olim, dramaturg)
- **Fayzulla Xo'jayev** (O'zSSR rahbari)
- **Akmal Ikromov** (Partiya rahbari)

### II Jahon urushi (1941–1945)
- **1,5 million** o'zbek urushga ketdi
- **400 000** dan ortiq halok bo'ldi
- Moskva, Leningrad, Stalingrad himoyasida o'zbek qahramonlari
- **Shoira Toshmatova**, **Abdulla Nabiyev** — urush qahramonlari
- Evakuatsiya — 100 dan ortiq zavod va 1 million kishi O'rta Osiyoga ko'chirildi

### Paxta monopoliyasi
- 1970–80-yillar: "Paxta ishi" — miqdor oshirib ko'rsatildi
- **1983–1986**: Paxta yashirish skandali — minglab xodim hukm oldi
- O'zbek rahbarlari qamoqqa tashlandi

---

## Mustaqillik harakatining boshlanishi

| Yil | Voqea |
|-----|-------|
| **1989** | O'zbek tili davlat tili deb e'lon qilindi |
| **1990 mart** | Islam Karimov prezident |
| **1990 iyun** | O'zbekiston suverenitetini e'lon qildi |

---

## BMBA uchun muhim
- O'zSSR tashkil: **1924 yil 27-oktabr**
- Birinchi rahbar: **Fayzulla Xo'jayev**
- Repressiya: **1937–38** — Qodiriy, Cho'lpon, Fitrat
- Urushga: **1,5 mln** o'zbek, **400 000** halok
""",
    },

    {
        "subject": Subject.HISTORY,
        "order_index": 8,
        "xp_reward": 80,
        "era_tag": "INDEPENDENCE",
        "title": "Mustaqillik: 1991 yil va birinchi yillar",
        "content_markdown": """# O'zbekiston mustaqilligi

## Mustaqillikka erishish

| Sana | Voqea |
|------|-------|
| **1990 yil, 20-iyun** | O'zbekiston suverenitetini e'lon qildi |
| **1991 yil, 19-22 avgust** | Moskvada davlat to'ntarishiga urinish (GKCHP) |
| **1991 yil, 31-avgust** | **O'zbekiston mustaqilligini e'lon qildi** |
| **1991 yil, 1-sentabr** | Mustaqillik kuni (milliy bayram) |
| **1991 yil, 29-dekabr** | Referendum — 98,2% mustaqillik uchun |
| **1991 yil, 21-dekabr** | MDH (Mustaqil Davlatlar Hamdo'stligi) ga qo'shildi |

---

## Islam Karimov — birinchi Prezident

| Ma'lumot | Tafsilot |
|---------|---------|
| **Tug'ilgan** | 1938 yil, Samarqand |
| **Prezident** | 1991–2016 |
| **Vafot** | 2016 yil, 2-sentabr |

### Asosiy faoliyati:
- **"O'zbekiston yo'li"** — iqtisodiy rivojlanish konsepsiyasi
- Bozor iqtisodiyotiga bosqichma-bosqich o'tish
- **"O'zbek modeli"** — davlat boshchiligidagi islohotlar
- "Eng avval iqtisodiyot, so'ng siyosat"

### Asosiy asarlari:
- **"O'zbekiston: milliy istiqlol, iqtisod, siyosat, mafkura"**
- **"O'zbek xalqi hech qachon va hech kimga qaram bo'lmaydi"**

---

## Milliy ramzlar

| Ramz | Tavsif |
|------|--------|
| **Bayroq** | Zangori (osmon va suv), oq (tinchlik), yashil (tabiat); oy va yulduz |
| **Gerb** | Humo qushi, ariq, paxta, bug'doy |
| **Madhiya** | "Serquyosh, hur o'lkam" |

---

## Dastlabki islohotlar

### Iqtisodiy:
- **So'm** — milliy valyuta (1994 yil 1-iyul)
- Xususiylаshtirish jarayoni
- Paxta va oltin — asosiy eksport

### Ijtimoiy:
- **O'zbek tili** — davlat tili (1989)
- **Lotin alifbosi** — kirill o'rniga (1993, to'liq 2005)

### Tashqi siyosat:
- 1992 yil — **BMT** a'zosi
- **OSCE** va xalqaro tashkilotlar a'zosi

---

## BMBA uchun muhim
- Mustaqillik: **1991 yil 31-avgustda** e'lon qilindi
- Milliy bayram: **1-sentabr**
- Birinchi Prezident: **Islam Karimov** (1991–2016)
- Milliy valyuta So'm: **1994 yil**
- Lotin alifbosi: **1993 yildan** bosqichma-bosqich
""",
    },

    {
        "subject": Subject.HISTORY,
        "order_index": 9,
        "xp_reward": 80,
        "era_tag": "NEW_UZBEKISTAN",
        "title": "Yangi O'zbekiston: Shavkat Mirziyoyev davrida islohotlar",
        "content_markdown": """# Yangi O'zbekiston davri

## Shavkat Mirziyoyev

| Ma'lumot | Tafsilot |
|---------|---------|
| **Tug'ilgan** | 1957 yil, 24-iyul, Jizzax |
| **Ta'lim** | Toshkent irrigatsiya instituti |
| **Bosh vazir** | 2003–2016 |
| **Prezident** | **2016 yil 4-dekabr** dan |

---

## "Yangi O'zbekiston" strategiyasi

### O'zbekiston Respublikasi Prezidentining farmonlari:
- **PF-4947** (2017) — davlat boshqaruvini isloh qilish
- **PF-60** (2022) — O'zbekistonni 2026 yilgacha rivojlantirish strategiyasi

### Taraqqiyot Strategiyasi 2022–2026 (PF-60) — 5 yo'nalish:
1. **Insonparvar davlat** — fuqarolar huquqlarini ta'minlash
2. **Adolatli huquqiy tizim** — sud islohotlari
3. **Iqtisodiy rivojlanish** — investitsiya, eksport
4. **Ijtimoiy taraqqiyot** — ta'lim, sog'liqni saqlash
5. **Xavfsizlik** — mintaqaviy hamkorlik

---

## Asosiy islohotlar

### Iqtisodiy islohotlar:
- **Valyuta erkinligi** (2017) — dollarga rasmiy va bozor kursi birlashtirildi
- Xususiy tadbirkorlik rag'batlantirish
- **SEZ** (maxsus iqtisodiy zonalar)
- Turizm rivojlantirish: viza tartibini soddalashtirish

### Ijtimoiy islohotlar:
- **Maktabgacha ta'lim** kengaytirish
- **Prezident maktablari** va IT Park
- **"Yoshlar — kelajagimiz"** dasturi

### Tashqi siyosat:
- Qo'shnilar bilan munosabatlarni yaxshilash (**Tojikiston, Qirg'iziston**)
- **Afg'oniston tinchlik jarayoni** — faol ishtirok
- **SCO, MDH** faol a'zo
- **BMT Inson huquqlari** komissiyasi bilan hamkorlik

---

## Muhim voqealar

| Yil | Voqea |
|-----|-------|
| **2016** | Islam Karimov vafot etdi; Mirziyoyev prezident |
| **2017** | Uzbek — erkin valyuta kursi |
| **2019** | Prezidentlik saylovida qayta saylandi |
| **2022** | Yangi Konstitutsiya jarayoni boshlandi |
| **2023 yil 30-aprel** | **Yangi Konstitutsiya referendumi** (90,21% qo'llab) |

---

## Yangi Konstitutsiya (2023)

- **O'zbekiston — ijtimoiy davlat** tamoyili mustahkamlandi
- Inson huquqlari kengaytirildi
- Prezidentlik muddati: **7 yil** (5 yil o'rniga), lekin oldingi muddat hisoblanmaydi
- Qoraqalpog'iston: maxsus huquqiy maqom saqlab qolindi

---

## BMBA uchun muhim
- Mirziyoyev prezident: **2016 yil 4-dekabr**
- **PF-60** — 2022-2026 taraqqiyot strategiyasi
- Yangi Konstitutsiya: **2023 yil 30-aprel** referendum
- Valyuta erkinlashtirildi: **2017**
""",
    },

    {
        "subject": Subject.HISTORY,
        "order_index": 10,
        "xp_reward": 70,
        "era_tag": "MEDIEVAL",
        "title": "O'zbek xonliklari: Shayboniylar va Buxoro amirligi",
        "content_markdown": """# O'zbek xonliklari: Shayboniylar va xonliklar

## Shayboniylar (1500–1599)

### Muhammad Shayboniyxon
| Ma'lumot | Tafsilot |
|---------|---------|
| **Kimdir** | Dashti Qipchoq o'zbeklari xoni |
| **Hokimiyat** | **1500 yil** — Movarounnahr |
| **Mag'lub** | Temuriy Bobur Samarqanddan haydaldi |
| **Vafot** | **1510** — Marv yaqinida Shoh Ismoil I (Safaviy) dan halok |

### Shayboniylar davlatining xususiyatlari:
- O'zbek qabilalari federatsiyasi
- Hanafiy sunni islom
- Buxoro asosiy poytaxt
- Samarqandda ham hukmdorlar bo'lgan

---

## Qo'qon xonligi (1709–1876)

| Asoschi | Shahruxbiy (1709) |
|---------|------------------|
| **Poytaxt** | **Qo'qon** |
| **Eng kuchli davri** | Muhammad Alixon (1822–1840) |
| **Fath** | Rossiya tomonidan 1876 |

### Geografiya:
- Farg'ona vodiysi + Toshkent + Shimoliy Qozog'iston
- Eng katta uchala xonlikdan

---

## Buxoro amirligi (1785–1920)

| Asoschi | Shohmurod (1785) — Mang'itlar sulolasi |
|--------|--------------------------------------|
| **Poytaxt** | **Buxoro** |
| **Oxirgi amir** | **Olimxon** (1910–1920) |
| **Fath** | Qizil Armiya 1920 |

### Mang'it sulolasi:
- Somoniylar va Shayboniylardan farqli yangi sulola
- Rus protektorati 1868 yildan
- "Bukhara Emirate" — yarim mustaqil holda saqlanib qoldi

---

## Xiva xonligi (1511–1920)

| Asoschi | Elbarsxon (1511) |
|--------|-----------------|
| **Poytaxt** | **Xiva** (Urganch ham) |
| **Oxirgi xon** | Sayid Abdullaxon |
| **Fath** | Rossiya 1873; Qizil Armiya 1920 |

### Qo'ng'irotlar sulolasi (XVIII–XX asr):
- 1804 dan Qo'ng'irotlar hukmronligi
- Ilm-fan (Shermuhammad Munis — tarixchi)

---

## Uch xonlikning taqqoslanishi

| Xonlik | Poytaxt | Sulola | Tugatildi |
|--------|---------|--------|----------|
| **Qo'qon** | Qo'qon | Ming | **1876** Rossiya |
| **Buxoro** | Buxoro | Mang'it | **1920** Sovet |
| **Xiva** | Xiva | Qo'ng'irot | **1920** Sovet |

---

## Bobur (1483–1530)

| Ma'lumot | Tafsilot |
|---------|---------|
| **To'liq ismi** | Zahiriddin Muhammad Bobur |
| **Tug'ilgan joy** | Andijon |
| **Asosiy asar** | **"Boburnoma"** — o'zbek tilida |
| **Ahamiyat** | Hindiston **Buyuk Mo'g'ullar** sulolasini asos soldi |

### "Boburnoma" haqida:
- XVI asrning eng qimmatli tarixiy-badiiy asari
- O'z hayoti, urushlari, tabiat va madaniyat tavsifi
- Turkiy (o'zbek) tilida yozilgan birinchi tarjimai hol
""",
    },
]


# ══════════════════════════════════════════════════════════════════════════════
# SEED FUNCTION
# ══════════════════════════════════════════════════════════════════════════════

async def main() -> None:
    async with AsyncSessionLocal() as db:
        # Check existing lessons
        from sqlalchemy import select, func
        result = await db.execute(select(func.count()).select_from(Lesson))
        existing = result.scalar()
        print(f"Existing lessons: {existing}")

        added = 0
        skipped = 0
        for data in LESSONS:
            # Skip if title already exists
            exists = await db.execute(
                select(Lesson).where(Lesson.title == data["title"])
            )
            if exists.scalar_one_or_none():
                skipped += 1
                continue

            lesson = Lesson(
                subject=data["subject"],
                title=data["title"],
                content_markdown=data["content_markdown"],
                order_index=data["order_index"],
                xp_reward=data["xp_reward"],
                era_tag=data["era_tag"],
            )
            db.add(lesson)
            added += 1
            print(f"  + [{data['subject'].value}] {data['title']}")

        await db.commit()
        print(f"\nDone: {added} lessons added, {skipped} skipped.")
        print(f"Total lessons now: {existing + added}")


if __name__ == "__main__":
    asyncio.run(main())
