# ⚡ ElektroPlan — Smart Electric Project

Elektr montaj ustalari uchun professional 2D elektr loyihalash va montaj ilovasi.

![Dizayn namunasi](docs/design/reference-dashboard.png)

## Usta nima qila oladi

1. Yangi loyiha yaratadi (buyurtmachi, manzil).
2. Xonalarni vizual chizadi va nomlaydi (o‘lcham majburiy emas — bu CAD emas).
3. Devorlarga elektr belgilarini qo‘yadi (rozetka, viklyuchatel, internet, TV, lyustra, LED, konditsioner…).
4. Har bir nuqtani sozlaydi: poldan balandlik, chap burchakdan masofa, izoh, rang.
5. Devor ko‘rinishida (elevation) nuqtalarni ko‘radi va tahrirlaydi.
6. Montaj rejimida nuqtalarni “Kutilmoqda → Jarayonda → Bajarildi” deb belgilaydi.
7. Loyihani PDF qilib eksport qiladi.
8. Internet yo‘q joyda ham ishlaydi (offline, IndexedDB), keyin serverga sinxronlanadi.

## Texnologiyalar

Next.js (App Router) · React · TypeScript (strict) · Tailwind CSS · shadcn/ui · Konva.js (react-konva) · Zustand · Zod · IndexedDB (idb) · PostgreSQL · Prisma · Auth.js · PWA · pdf-lib · Vitest · Playwright

## Hujjatlar

| Fayl | Mazmuni |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Claude Code uchun qat’iy ish qoidalari |
| [`docs/SPEC.md`](docs/SPEC.md) | To‘liq texnik topshiriq (asl matn) |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Arxitektura, papka tuzilmasi, modullar, oqimlar |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Domen modeli, geometriya, ma’lumotlar bazasi |
| [`prisma/schema.prisma`](prisma/schema.prisma) | PostgreSQL sxemasi (Phase 12 da ulanadi) |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Ranglar, shriftlar, panellar, UI matnlari |
| [`docs/PHASES.md`](docs/PHASES.md) | 13 bosqich: vazifalar, qabul mezonlari, Claude Code promptlari |
| [`docs/PROGRESS.md`](docs/PROGRESS.md) | Bosqichlar holati (har bosqichdan keyin yangilanadi) |

## Qanday boshlash

Claude Code’da shu repo’ni oching va yozing:

```
CLAUDE.md va docs/ papkasini to‘liq o‘qi. docs/PHASES.md dagi PHASE 1 ni bajar.
Tugagach test qil, docs/PROGRESS.md ni yangila, hisobot ber va tasdiqimni kut.
```

## Joylashtirish (deploy)

Next.js + PostgreSQL oddiy cPanel shared hostingda to‘liq ishlamaydi. Tavsiya:
**Vercel** (ilova, bepul tarif) + **Neon** yoki **Supabase** (PostgreSQL, bepul tarif).
Domen (masalan `elektroplan.itcode.uz`) cPanel DNS orqali Vercel’ga CNAME qilinadi.

---
© ITcoDe.Uz
