# ELEKTROPLAN — Progress

| Phase | Nomi | Holat |
|---|---|---|
| 0 | Arxitektura va hujjatlar | ✅ Tayyor |
| 1 | Poydevor + dashboard dizayni | ✅ Tayyor |
| 2 | Loyiha boshqaruvi | ✅ Tayyor |
| 3 | Chizma dvigateli | ✅ Tayyor |
| 4 | Xonalar va devorlar | ✅ Tayyor |
| 5 | SVG belgilar | ✅ Tayyor |
| 6 | Nuqtalarni joylashtirish | ✅ Tayyor |
| 7 | Devor ko‘rinishi | ✅ Tayyor |
| 8 | Avtosaqlash (IndexedDB) | ✅ Tayyor |
| 9 | Montaj rejimi | ✅ Tayyor |
| 10 | PDF eksport | ✅ Tayyor |
| 11 | PWA / offline (internetsiz ishlash) | ✅ Tayyor |
| 12 | PHP + MySQL sync + Auth | ✅ Tayyor (tasdiq kutilmoqda) |
| 13 | Testlar va optimizatsiya | — |

## Phase 12 — 2026-11-04

**Bajarildi**
- **`domain/merge.ts`** (avval yozildi, 21 test): uch tomonlama merge maydon darajasida — bir tomon o‘zgartirgan har narsa saqlanadi; ikkala tomon bir maydonni o‘zgartirsa — `updatedAt` yangirog‘i (teng bo‘lsa server); **montaj holati konfliktda hech qachon orqaga qaytmaydi**; o‘chirish va tahrir — yangirog‘i yutadi (keyin tahrirlangan nuqta qaytadi); montaj jurnali — ikkala qurilmaniki birlashtiriladi; eshik/deraza (vaqt belgisisiz) — uch tomonlama; ikkala qurilma xona chizgan bo‘lsa devorlar qayta quriladi (topologiya buzilmaydi); konfliktlar ro‘yxati serverda `project_history` ga yoziladi.
- **PHP API** (`server/`): router, PDO (utf8mb4, UTC), JSON xatolar, to‘liq validatsiya (zod sxemasi + ustun chegaralari), `migrate.php` + `/api/migrate?token=`, `002_sync.sql` (openings jadvali, ro‘yxat tartibi `seq`, (project_id, id) kalitlari, kasr sm, rate limit, 11 ta tizim belgisi seed).
- **Auth:** telefon (+998…, “90 123 45 67” ham) yoki email + parol (bcrypt), httpOnly SameSite=Lax cookie sessiya (60 kun, sha256 saqlanadi), login uchun rate limit (10 urinish / 15 daqiqa), CSRF himoyasi (`X-Elektroplan` sarlavhasi). Kirish sahifasi: Kirish / Yangi akkaunt, o‘zbekcha xatolar; akkaunt sahifasi: oxirgi sinxronizatsiya, “Hozir sinxronlash”, “Chiqish” (loyihalar qurilmada qoladi). Sidebar va Sozlamalarda akkaunt.
- **`/api/sync` + `/api/pull`:** revision asosida, bitta tranzaksiyada; eskirgan revision → 409 + server versiyasi → qurilma merge qilib qayta yuboradi. Login’dan keyin serverdagi **barcha** loyihalar IndexedDB’ga tushadi (boshqa qurilmada yaratilganlari ham oflayn ochiladi). Akkauntsiz yaratilgan lokal loyihalar birinchi sinxronda **akkauntga biriktiriladi** (“N ta loyiha akkauntga biriktirildi”). Boshqa akkaunt loyihasi hech qachon yuborilmaydi.
- **Fon sinxronizatsiyasi:** kirgan bo‘lsa — ishga tushganda, har 10 s, internet qaytganda, tab faollashganda, saqlashdan 1,5 s keyin; xatoda exponential backoff (5 s → 5 daqiqa). Sinxron paytida tahrir qilinsa — u yo‘qolmaydi (o‘sha loyiha keyingi raundda). Sarlavhada: Oflayn / Sinxronlanmoqda / Sinxronlandi / Sinxronlanmadi; “serverga yuborilmagan” belgisi endi server saqlagach yo‘qoladi. Montaj jurnalida kim belgilagani (userId) yoziladi.
- IndexedDB v3: `synced` (server bilan kelishilgan oxirgi nusxa — merge asosi).
- CI: MariaDB 10.11 servisi, `php -l`, `pdo_mysql`; deploy `config.php` ni secrets’dan yozadi va (`SITE_URL` berilsa) migratsiyani avtomatik qo‘llaydi.

**Test qilindi**
- `pnpm test` — 231 test. Yangi: merge (21), **haqiqiy PHP + MariaDB** bilan API (10: ro‘yxatdan o‘tish, cookie, bcrypt, email login, logout, rate limit 429, CSRF, loyiha to‘liq aylanib qaytishi — barcha jadvallar, tartib, kasrlar, o‘zbek harflari, sanalar; 409; boshqa foydalanuvchi 403; buzilgan loyiha 422; migratsiya tokeni), **qabul testi**: iPad va telefon bitta loyihani oflayn tahrirlaydi (nom, manzil, xona nomi, nuqta balandligi/rangi/izohi, holat, o‘chirish, yangi nuqta, jurnal) → ulanadi → ikkala qurilmada va MySQL’da hamma o‘zgarish bor, outbox bo‘sh (in-memory server va haqiqiy PHP+MySQL).
- `pnpm test:e2e` — 6 profilning barchasida: ro‘yxatdan o‘tish + lokal loyiha biriktirilishi, noto‘g‘ri parol/kiritish xabarlari, **ikki brauzer (ikki qurilma) oflayn tahrir → qayta ulanish → nom, manzil va montaj holati ikkalasida**, chiqishda loyihalar qoladi. Jami 347 o‘tdi, 13 ataylab o‘tkazildi; avvalgi bosqichlar to‘liq qayta o‘tdi.
- Skrinshotlar: `docs/screenshots/phase-12/` (ro‘yxatdan o‘tish, sinxronlangan Loyihalar, Chizma sarlavhasidagi “Sinxronlandi”, akkaunt — 5 qurilma).
- Topilib tuzatilgan: PDO kasr sonlarni 14 xonagacha qisqartirardi (`precision=-1`); xona/devor id’lari serverda global kalit bo‘lgani uchun ikki loyihada to‘qnashardi — (project_id, id) kalitlariga o‘tildi.

**Ma’lum cheklovlar**
- hostmaster.uz’da haqiqiy tekshiruv FTP/DB secrets qo‘shilgandan keyin (`docs/DEPLOY.md` §2, §7). Lokal va CI’da MariaDB 10.11 (cPanel bilan bir xil) ishlatildi.
- Bitta loyiha id’si faqat bitta akkauntga tegishli: bir zaxira faylni ikki xil akkauntga tiklasangiz, ikkinchisida u qurilmada qoladi (“server qabul qilmadi” xabari).
- Parolni tiklash (SMS/email) va jamoa bilan ulashish yo‘q — keyingi bosqichlar.
- Chiqishda loyihalar qurilmada qoladi (oflayn-birinchi tamoyil); umumiy qurilmada ehtiyot bo‘ling.

## Phase 11 — 2026-11-04

**Bajarildi**
- **Serwist** (`@serwist/next` + `serwist`, ARCHITECTURE §5 ro‘yxatida) — `src/sw/sw.ts`: statik eksportning barcha sahifalari (+ RSC `index.txt`), JS/CSS, Inter shriftlari (interfeys + PDF uchun TTF), ikonkalar oldindan keshlanadi. Birinchi tashrifdan keyin ilova **samolyot rejimida** ochiladi; `/editor/?id=…`, `/install/?id=…` query bilan ham keshdan chiqadi; noma’lum sahifa oflayn — bosh sahifa. `/api/*` hech qachon keshlanmaydi. Loyihalar faqat IndexedDB’da.
- Manifest (`/manifest.webmanifest`, `display: standalone`), ikonkalar 192/512, **maskable** 512, **apple-touch** 180, SVG — logotipdan yasalgan (`scripts/make-icons.mjs`).
- **Zaxira nusxa** (`domain/backup.ts`, testlar bilan): bitta loyiha (loyiha kartasidagi tugma) yoki barcha loyihalar (Sozlamalar) `.elektroplan.json` faylga — telefon/iPad’da Ulashish oynasi (Fayllar, Telegram), kompyuterda yuklab olish. “Zaxiradan tiklash”: fayl zod bilan tekshiriladi; yangi loyiha qo‘shiladi, eskirgan nusxa yangilanadi, **qurilmadagi yangiroq ish hech qachon ustidan yozilmaydi**; buzilgan fayl — aniq xabar.
- iPhone/iPad: bir martalik “Ilovani Bosh ekranga qo‘shing” eslatmasi (Safari ma’lumotni o‘chirmasligi uchun), “Tushunarli” dan keyin qayta chiqmaydi; Bosh ekrandan ochilganda chiqmaydi.
- Android / Windows (Chrome, Edge): `beforeinstallprompt` → Sozlamalar › Ilova › “Ilovani o‘rnatish” tugmasi; o‘rnatilgan bo‘lsa — “Ilova o‘rnatilgan”; tugma bo‘lmasa qurilmaga mos qo‘lda o‘rnatish yo‘li yoziladi.
- **Oflayn** belgisi (loyiha sarlavhasi, Loyihalar, Montaj, Sozlamalar; telefonda faqat ikonka), har loyihada “Serverga yuborilmagan o‘zgarishlar bor” bulut belgisi (outbox soni; server sinxronizatsiyasi — Phase 12).
- Yangi versiya chiqsa: “Ilovaning yangi versiyasi tayyor · **Yangilash** / Keyinroq” — chizish o‘rtasida o‘zi qayta yuklanmaydi; “Yangilash” avval saqlaydi, so‘ng yangi versiyaga o‘tadi.
- PDF ulashish/yuklab olish umumiy `lib/saveFile.ts` ga ko‘chirildi (PDF va zaxira bir xil yo‘l).

**Test qilindi**
- `pnpm test` — 196 test (yangi: zaxira fayli round-trip, buzilgan/bo‘sh/boshqa fayl rad etiladi, import rejasi, fayl nomi, platforma aniqlash, iOS eslatma qoidasi).
- `pnpm test:e2e` — 6 profilning barchasida: **samolyot rejimi** (Playwright offline context): bir marta onlayn ochiladi → internet o‘chiriladi → Loyihalar ro‘yxati, loyiha ochiladi (client-side navigatsiya ham), **PDF eksport**, Montajda holat belgilanadi va oflayn qayta yuklashda saqlanadi, Sozlamalar/Bosh sahifa ochiladi, **yangi loyiha yaratiladi va xona chiziladi**, oflayn qayta yuklashdan keyin joyida; internet qaytsa “Oflayn” yo‘qoladi. Zaxira: eksport → toza qurilmada tiklash → takror import hech narsani buzmaydi → buzilgan fayl rad etiladi; kartadan bitta loyiha. iOS eslatmasi bir marta. “Yangilash” oqimi. Manifest + ikonkalar. Chromium o‘rnatish tekshiruvi (`Page.getInstallabilityErrors` — Lighthouse “installable” auditining o‘zi) **xatosiz**.
- Jami: 330 ssenariy — 317 o‘tdi, 13 ataylab o‘tkazildi (iOS’ga oid testlar Android/Windows’da va h.k.). Avvalgi bosqichlar (chizma, belgilar, nuqtalar, devor ko‘rinishi, avtosaqlash, montaj, PDF) to‘liq qayta o‘tdi.
- Skrinshotlar: `docs/screenshots/phase-11/` (6 qurilma: iOS eslatma, oflayn Loyihalar va Chizma, Sozlamalar, Yangilash).
- Topilib tuzatilgan: precache bitta fayl (404.html) xato status bersa service worker umuman o‘rnatilmasligi — test serveri Apache kabi 200 beradi; Serwist’ning internet qaytganda sahifani o‘zi qayta yuklashi o‘chirildi (chizma yo‘qolmasin).

**Ma’lum cheklovlar**
- Lighthouse 12 da alohida “PWA” bo‘limi olib tashlangan; o‘rniga Chromium’ning o‘rnatish mezonlari tekshiriladi (yuqorida). Haqiqiy iPad/iPhone’da samolyot rejimi deploydan keyin qo‘lda tekshiriladi (lokal testda Apple profillari Chromium’da, CI’da WebKit).
- iOS’da Safari service worker’ni faqat **HTTPS** da ishlatadi (`.htaccess` HTTPS’ga yo‘naltiradi).
- “Serverga yuborilmagan” belgisi Phase 12 gacha har tahrirdan keyin turadi — server hali yo‘q.
- Birinchi tashrif internet bilan bo‘lishi shart (~3 MB yuklanadi).

## Phase 10 — 2026-11-03

**Bajarildi**
- `pdf-lib` + `@pdf-lib/fontkit` (ARCHITECTURE §5 ro‘yxatida), Inter TTF (Regular/SemiBold/Bold, SIL OFL) `public/fonts/` da — o‘zbek harflari (oʻ, gʻ, ‘ ’, sh, ch) to‘g‘ri chiqadi.
- `domain/report.ts` (testlar bilan): nuqtalar ish tartibida 1…N raqamlanadi — rejada, jadvalda va devor ko‘rinishida bir xil raqam; xonalar bo‘yicha guruh va progress; nuqtasi bor har bir devor uchun ko‘rinish; ishlatilgan belgilar; fayl nomi.
- PDF (A4, **vektor** — chop etishda aniq, oq fonda): 1) muqova — ElektroPlan, loyiha, buyurtmachi, manzil, sana, xona/nuqta soni, montaj holati halqasi, xonalar bo‘yicha progress chiziqlari; 2) uy rejasi (landshaft): xonalar, devorlar, eshik/derazalar, nomlar, belgilar + holat rangli raqamlar; 3) nuqtalar jadvali xona bo‘yicha (№, belgi, devor yo‘nalishi, balandlik, chap burchakdan, holat, izoh), sahifalarga bo‘linadi; 4) devor ko‘rinishlari (sahifaga 3 ta): belgilar, balandliklar, masofa yozuvlari; 5) shartli belgilar + holat ranglari. Har sahifada pastki yozuv va “n / N”.
- Header’dagi “Eksport PDF” ishlaydi: avval saqlaydi, so‘ng PDF qurilmaning o‘zida yasaladi; iPhone/iPad/Android’da **Ulashish** oynasi (Fayllar, Telegram…), kompyuterda oddiy yuklab olish; ulashish imkoni bo‘lmasa — yuklab olish.

**Test qilindi**
- `pnpm test` — 187 test. Integratsiya: 60 nuqtali loyiha → 18 sahifa, barcha sahifalar A4, **5 soniyadan tez** (node’da ~1 s), sarlavhada o‘zbek harflari, qayta o‘qiladi; bo‘sh loyiha ham eksport bo‘ladi.
- `pnpm test:e2e` — 49 ssenariy × 6 profil: 283 o‘tdi, 11 ataylab o‘tkazildi. Yangi: 6 qurilmada “Eksport PDF” → yuklab olish, nom `Sinov_uyi_elektroplan.pdf`, `%PDF-`, 5 s dan tez, “PDF tayyor” xabari.
- PDF sahifalari rasmga aylantirilib ko‘zdan kechirildi (`docs/screenshots/phase-10/`).
- Topilib tuzatilgan: pdf-lib shriftni qisqartirganda (subset) harflar yo‘qolishi — to‘liq shrift joylanadi (PDF ~0,6 MB).

**Ma’lum cheklovlar**
- Internetsiz eksport uchun shriftlar keshlangan bo‘lishi kerak — Phase 11 (service worker) bu fayllarni oldindan keshlaydi.
- Rejadagi rozetka belgilari PDF’da devor bo‘ylab burilmaydi (tik turadi).
- iOS’da PDF tayyorlash uzoq cho‘zilsa, Safari ulashish oynasini ochishga ruxsat bermasligi mumkin — bunda fayl yuklab olinadi.

## Phase 9 — 2026-11-03

**Bajarildi**
- `/install/?id=` (statik eksport qoidasi — `[id]` marshruti o‘rniga query) — telefon (390 px) birinchi dizayn, iPad landshaft/desktop’da reja + ro‘yxat yonma-yon.
- `domain/installation.ts` (testlar bilan): holatni o‘rnatish + **InstallationTask** jurnali (kim — hozircha `null`, Phase 12 da foydalanuvchi; qachon; qaysidan → qaysiga) — MySQL `installation_tasks` jadvaliga mos; xonalar bo‘yicha progress; ish tartibi (xonalar ro‘yxati tartibida, devor nuqtalari masofa bo‘yicha, ship nuqtalari oxirida); “Keyingi bajarilmagan nuqta”.
- Ekran: loyiha nomi + progress halqasi va “21/30 · Qolgan 9”; xonalar navigatsiyasi (har xonada bajarilgan/jami, tayyor xonada ✓); “Faqat bajarilmaganlar” filtri (rejada ham, ro‘yxatda ham); Reja / Ro‘yxat (telefonda); tanlangan nuqta paneli: belgi, xona, balandlik, chap burchakdan, izoh, **3 ta katta tugma (64 px, qo‘lqop bilan)**, “Keyingi” (52–56 px), devor ko‘rinishi tugmasi.
- Reja montajda faqat ko‘rish uchun: bosish — tanlash, sudrash — reja suriladi, pinch — zoom; hech narsa siljimaydi/o‘chmaydi (Delete, chizish asboblari, kontekst menyu o‘chiq). Holat rejada halqa rangi bilan: kulrang / to‘q sariq punktir / yashil + ✓.
- Telefonda reja juda kichik bo‘lganda belgilar haddan tashqari kattalashmasligi uchun nuqta belgilari yozuvlardan alohida masshtablanadi.
- Muharrir paneli ham holatni jurnal bilan o‘zgartiradi; “Loyiha holati” kartasidagi yashil tugma endi montaj rejimini ochadi (hammasi bajarilsa “Loyiha tayyor”, aks holda “Montajni davom ettirish”).
- Progress hech qachon yo‘qolmaydi: har bosish Phase 8 avtosaqlash orqali IndexedDB’ga (va outbox’ga).

**Test qilindi**
- `pnpm test` — 180 test (holat + jurnal + undo, xonalar progressi, ish tartibi, keyingi nuqta, eski loyihalar jurnalsiz yuklanadi).
- `pnpm test:e2e` — 48 ssenariy × 6 profil: 277 o‘tdi, 11 ataylab o‘tkazildi. Yangi: muharrirdan montajga o‘tish, “Keyingi”, katta tugma ≥60 px, holat → sahifa yangilangandan keyin ham saqlanadi + jurnalda; rejada bosib tanlash, sudrash/Delete hech narsani o‘zgartirmaydi; xona va filtr; devor ko‘rinishi.
- Phase 1–8 qayta tekshirildi.
- Skrinshotlar: `docs/screenshots/phase-9/` (iPhone reja + ro‘yxat, iPad landshaft).

**Ma’lum cheklovlar**
- Montajda devor ko‘rinishidan balandlik/masofani tuzatish mumkin (joyida o‘lchab yozish uchun) — bu ataylab qoldirildi.
- Jurnalda “kim” — akkauntlar Phase 12 da.
- Holat orqaga qaytarilishi mumkin (xato bosilganda); serverdagi sinxronizatsiyada “orqaga qaytmaslik” qoidasi Phase 12 da.

## Phase 8 — 2026-11-03

**Bajarildi**
- IndexedDB **v2** (versiyali migratsiya v1 → v2): `projects`, `backups` (har loyihaning oldingi to‘g‘ri nusxasi), `outbox` (`byProject` indeksi), `meta`. O‘qishda zod.
- Avtosaqlash: har o‘zgarish ekranda darhol, **500 ms** tanaffusdan keyin bitta tranzaksiyada: yangi nusxa + oldingisi `backups` ga + patch’lar `outbox` ga (Phase 12 sinxronizatsiya uchun tayyor; undo — teskari patch’lar; loyiha darajasidagi amallar ham yoziladi).
- Darhol saqlash: “Saqlash” tugmasi, **Ctrl/⌘+S**, sahifa yashirilganda / yopilganda (`pagehide`, `beforeunload`, `visibilitychange`).
- **Yopilish paytida himoya:** brauzer yopilayotgan sahifaning IndexedDB yozuvini ba’zan bekor qiladi — e2e test buni ushladi (18 tadan 2 holatda yo‘qolish). Endi: ulanish ochiq bo‘lsa yozuv sinxron boshlanadi + o‘zgarish `localStorage` jurnaliga sinxron yoziladi; keyingi ochilishda jurnal (agar saqlangandan yangi bo‘lsa) IndexedDB’ga o‘tkaziladi. Natija: 90/90.
- Buzilgan yozuvdan tiklash: o‘qib bo‘lmagan loyiha oxirgi to‘g‘ri nusxadan tiklanadi, qayta yoziladi va foydalanuvchiga xabar beriladi.
- `navigator.storage.persist()` — har muvaffaqiyatli saqlashdan keyin (bir marta ruxsat so‘raladi).
- Header’dagi “Saqlash” tugmasi holatni ko‘rsatadi: O‘zgarish bor → Saqlanmoqda… → ✓ Saqlandi (ustiga olib borilsa vaqt) / Saqlanmadi (qizil).

**Test qilindi**
- `pnpm test` — 173 test. Integratsiya (fake-indexeddb, “brauzerni yopish” = ulanishni flush’siz uzib, modullarni qayta yuklash): 500 ms dan keyin saqlanadi; tanaffusgacha yopilsa flush saqlaydi; istalgan paytda yopilsa ham oldin saqlangan buzilmaydi; outbox’da patch’lar va undo’ning teskarisi; buzilgan yozuv → oxirgi to‘g‘ri nusxa, keyingi safar toza; yozish xatosi → eski ma’lumot joyida + “Saqlanmadi”; IndexedDB uzilganda jurnal saqlaydi; eski jurnal yangi ma’lumotni bosib ketmaydi; v1 bazadan migratsiya.
- `pnpm test:e2e` — 44 ssenariy × 6 profil: 253 o‘tdi, 11 ataylab o‘tkazildi. Yangi: Saqlash tugmasi holati va darhol saqlash; **tahrirdan so‘ng darhol sahifani yangilash** (500 ms kutmasdan) — 5 marta × 6 profil takrorlab barqaror; Ctrl/⌘+S.
- Phase 1–7 qayta tekshirildi.

**Ma’lum cheklovlar**
- Outbox hozircha faqat to‘planadi — serverga yuborish Phase 12 da.
- Juda katta loyiha (localStorage ~5 MB dan katta) yopilish jurnaliga sig‘masa, faqat IndexedDB yozuviga tayaniladi.
- Undo tarixi hali ham faqat xotirada (sahifa yangilansa tozalanadi).

## Phase 7 — 2026-11-03

**Bajarildi**
- “Chap burchakdan” endi **xona ichida devorga qarab turgan odamning chap burchagidan** o‘lchanadi (`domain/walls.ts › leftIsA / cornerDistance / tFromCornerDistance`), rejadagi joylashtirish, sudrash, devor surish, nusxa, panel va devor ko‘rinishi — hammasi shu bitta qoidadan.
- `domain/elevation.ts` (testlar bilan): devor ko‘rinishi joylashuvi — masofa ↔ x, balandlik ↔ y (ikki tomonga), ko‘rsatiladigan balandlik oralig‘i (≥120 sm, eng baland nuqtaning 1,5 barobari, devor balandligidan oshmaydi), 5 sm qadam.
- Devor ko‘rinishi (referensdagidek): devor yuzasi, pol chizig‘i, nuqtalardan polga chiziq, ostida masofa yozuvlari (yaqin bo‘lsa suriladi), o‘ngda balandlik o‘lchagichi, TV ekran sifatida. Tanlangan nuqta uchun: o‘lchagich uning balandligini ko‘rsatadi, chap burchakdan punktir chiziq, masofa yozuvi ko‘k.
- **Sinxronlik:** rejada nuqtani tanlash → devor ko‘rinishida tanlanadi; devor ko‘rinishida bosish → rejada va panelda tanlanadi; devor yuzasini bosish → devor tanlanadi. Hammasi bitta `selection` dan.
- **Sudrash:** chapga-o‘ngga — masofa, tepaga-pastga — balandlik (5 sm qadam); reja va panel shu zahoti yangilanadi; bitta sudrash = bitta undo. Klaviatura: strelkalar 5 sm, Shift+strelka 20 sm.
- Oldingi / keyingi tugmalari — xonaning keyingi/oldingi devori; to‘liq ekran tugmasi — telefon/planshetda katta devor ko‘rinishi (16:9), pastda tanlangan nuqtaning balandligi va masofasi, Esc / ✕ bilan yopiladi.

**Test qilindi**
- `pnpm test` — 164 test (yangi: chap burchak qoidasi ikkala tomondan, masofa ↔ t, layout ikki tomonlama aylantirish, oraliq, cheklash, 5 sm).
- `pnpm test:e2e` — 41 ssenariy × 6 profil: 235 o‘tdi, 11 ataylab o‘tkazildi. **Sinxronlik e2e:** rejada tanlash ↔ devor ko‘rinishida tanlash; devor ko‘rinishida sudrash → IndexedDB’da masofa va balandlik, rejadagi x masofaga teng, undo qaytaradi; paneldagi balandlik → devor ko‘rinishidagi belgi siljiydi; to‘liq ekran: tahrir, devor almashtirish, yopish; chap burchak qoidasi.
- Phase 1–6 qayta tekshirildi (shu to‘plamda). Emoji testi izohlardagi ◀ ▶ belgilarini ham ushladi — matn bilan almashtirildi.
- Skrinshotlar: `docs/screenshots/phase-7/` (demo 1536, sudrashdan keyin, iPhone tab + to‘liq ekran, iPad).

**Ma’lum cheklovlar**
- Devor ko‘rinishi sxematik (CAD emas): vertikal masshtab nuqtalarga qarab avtomatik, gorizontal — devor uzunligi.
- Eshik/deraza devor ko‘rinishida hali chizilmaydi.
- Telefonda to‘liq ekran portretda kichikroq — telefonni yotqizilsa kattaroq ko‘rinadi.

## Phase 6 — 2026-11-03

**Bajarildi**
- `domain/points.ts` (testlar bilan): joylashtirish nishoni (eng yaqin devor → `wallId + t + side`, kursor qaysi tomonda bo‘lsa o‘sha xona; tashqi devor tashqarisiga bosilsa ham xona ichiga), ship belgilari (lyustra) xona ichiga — markazga yaqin bosilsa aynan markazga, LED/Boshqa — devor yaqinida devorga, aks holda xona ichiga; Shift — devorsiz erkin. Standart balandlik loyiha sozlamasidan (rozetka 30, viklyuchatel 90), boshqalari katalogdan.
- Joylashtirish asbobi: belgi kursor/Pencil ortidan devorga yopishib, devor bo‘ylab burilib ko‘rinadi; bosilsa qo‘yiladi va tanlanadi; joy bo‘lmasa — xabar.
- Nuqtani sudrash: boshqa devor yaqinida — o‘sha devorga (va xonaga) o‘tadi, aks holda o‘z devori bo‘ylab sirpanadi; ship nuqtasi erkin; Shift — erkin. Bitta undo qadam.
- Devor surilganda nuqtalar u bilan birga yuradi (`t` saqlanadi) — Phase 4 topologiyasi orqali, test bilan.
- “Tanlangan nuqta” paneli to‘liq tahrir: belgi turi (menyu), Pol’dan balandlik, Chap burchakdan (devor bo‘ylab siljitadi), X/Y (ship nuqtalari), Izoh, Rang, Holat (Kutilmoqda / Jarayonda / Bajarildi — “Loyiha holati” darhol yangilanadi), O‘chirish, Nusxa. Har bir maydon — bitta undo qadam (yozish blur’da yakunlanadi).
- Nusxa: paneldan va kontekst menyudan (nuqta — devor bo‘ylab 40 sm yonga; xona — o‘ngga).
- Sozlamalar → Loyiha: standart rozetka / viklyuchatel balandligi (undo bo‘ladi, IndexedDB’ga yoziladi).
- Yangi xonalarda nom markazdan biroz yuqorida (lyustra markazga qo‘yilganda nomni yopmaydi).
- iPad landshaftda panel qisqa bo‘lgani uchun Nusxa/O‘chirish sarlavha qatorida ikonka bo‘lib turadi.

**Test qilindi**
- `pnpm test` — 156 test (yangi: joylashtirish, tomon/xona tanlash, tashqi devor, ship va markazga yopishish, Shift, standart balandliklar, boshqa devorga o‘tish, o‘z devori bo‘ylab sirpanish, har bir xususiyat tahriri + undo, X/Y, devor bilan birga yurish, nusxa).
- `pnpm test:e2e` — 36 ssenariy × 6 profil: 208 o‘tdi, 8 ataylab o‘tkazildi (kichik ekranda panel/✎ ko‘rinmaydi). Yangi: devorga rozetka (30 sm), lyustra xona ichiga, Shift erkin, boshqa devorga sudrash, devor surilganda nuqta, paneldagi barcha xususiyatlar + 6 marta undo, nusxa (menyu va panel), sozlamadagi 40 sm yangi rozetkaga qo‘llanishi. Hammasi IndexedDB’dan tekshiriladi.
- Phase 1–5 qayta tekshirildi (shu to‘plamda). Topilib tuzatilgan regressiya: nuqtani devordan uzoqroqqa sudraganda siljimay qolishi (endi o‘z devori bo‘ylab sirpanadi).
- Skrinshotlar: `docs/screenshots/phase-6/` (iPad 1180, 1536).

**Ma’lum cheklovlar**
- Nuqta belgisining rejadagi o‘lchami barcha belgilar uchun bir xil; alohida o‘lcham sozlamasi yo‘q.
- Ko‘p nuqtani birga sudrashda ular o‘z devorlari bo‘ylab sirpanadi (boshqa devorga o‘tish faqat bitta nuqtada).
- Devor ko‘rinishida tanlash/sudrash — PHASE 7.

## Phase 5 — 2026-11-03

**Bajarildi**
- `features/symbols/catalog.ts` — 11 ta belgining yagona manbasi: id, kategoriya, SVG glif (24×24 path’lar), standart rang, standart balandlik (rozetka 30, viklyuchatel 90, TV 110, konditsioner 220 sm), joylashuv (devor / ship / har qayer), tahrirlanadigan xususiyatlar, rejada burilishi (faqat rozetkalar devor bo‘ylab buriladi). Nomlar — `uz.ts` da.
- Bir xil glif ma’lumotidan: `SymbolIcon` (DOM/SVG — panel, menyu, galereya, devor ko‘rinishi) va `PointGlyph` (Konva — reja).
- Symbol bar: belgini tanlash = **joylashtirish asbobi**. Kursor / Pencil hover ortidan belgining yarim shaffof ko‘rinishi yuradi; canvas tepasida “Belgi — joylashtirish · Tugatish”, Esc yoki “Tugatish” — tanlashga qaytadi. Rejaga haqiqiy qo‘yish (devorga yopishish, saqlash) — PHASE 6; hozir bosilganda shu haqda xabar chiqadi.
- “Boshqa” menyusi — Uch rozetka, Ikki klavishli viklyuchatel, Konditsioner, Boshqa.
- Sozlamalar → **Belgilar galereyasi** (`/settings/symbols/`): kategoriyalar bo‘yicha barcha belgilar, 16–64 px o‘lchamlar, 5 rang, haqiqiy reja renderida 50% / 100% / 200% / 400% zoom.

**Test qilindi**
- `pnpm test` — 143 test: katalog to‘liqligi (11 ta, barcha maydonlar, standart balandliklar), SVG path sintaksisi va 24×24 chegarasi, faqat rozetkalar buriladi, **butun `src` da emoji yo‘qligi** (avtomatik skan), joylashtirish asbobi.
- `pnpm test:e2e` — 29 ssenariy × 6 profil: 169 o‘tdi, 5 ataylab o‘tkazildi. Yangi: galereyada 11 belgi + zoom canvas, gorizontal scroll yo‘q; belgi tanlash → joylashtirish rejimi → bosish → xabar → Esc; “Tugatish” tugmasi.
- Skrinshotlar (`docs/screenshots/phase-5/`, DPR 2): galereya, 50–400% zoom (vektor — har zoomda aniq), joylashtirish ko‘rinishi, iPhone galereya.
- Phase 1–4 qayta tekshirildi (shu e2e to‘plamida).
- Topilib tuzatilgan: galereya zoom qatorida devor chizig‘i katta zoomda belgini yopishi; izohdagi o‘q belgilari emoji-skanerga tushishi.

**Ma’lum cheklovlar**
- Belgini rejaga qo‘yish va tahrirlash — PHASE 6.
- 50% zoomda (12 px) eng mayda belgilar faqat shaklidan taniladi; rejada belgi o‘lchami zoom’dan qat’i nazar o‘qiladigan chegarada ushlanadi.

## Phase 4 — 2026-11-03

**Bajarildi**
- Chizish asboblari (toolbar’dagi “Chizish asboblari” menyusi + klaviatura): To‘rtburchak xona (R), Kvadrat xona (Q), Erkin xona (P — burchaklarni bosing, birinchi nuqtani bosib yoping; ekranda “Yopish / Oxirgisini o‘chirish / Bekor”), Qo‘lda chizish (F), Devor (W), Eshik (D), Deraza (O). O‘lcham hech qayerda so‘ralmaydi.
- **Qo‘lda chizishni avtomatik tekislash** (`domain/sketch.ts`): silliqlash → Ramer–Douglas–Peucker → yopish → keraksiz burchaklarni olib tashlash → 0/45/90° ga tortish → to‘rtburchak / kvadrat → mavjud burchak, devor va grid’ga yopishtirish; ochiq chiziq → devor(lar). Bir marta “Bekor qilish” qo‘lda chizilgan asl shaklni qaytaradi. Sozlamalarda o‘chirish mumkin. Tolerantlik ekran pikselida — har qanday zoom’da bir xil.
- **Devor topologiyasi** (`domain/topology.ts`, `domain/wallEdits.ts`): devorlar xona chegaralaridan avtomatik; qo‘shni xonalar umumiy devorni bo‘lishadi, T-tutashuvlar to‘g‘ri bo‘linadi; devor ID’lari saqlanadi, nuqta va eshiklar geometriya bo‘yicha qayta bog‘lanadi.
- Devorni sudrab surish (bog‘liq xonalar cho‘ziladi; tutashgan devor bo‘ylab uchi sirpanadi; davom etayotgan devor bo‘lsa — pog‘ona hosil bo‘ladi), devorni bo‘lish, devorni o‘chirish (alohida devor — o‘chadi; umumiy devor — ikki xona birlashadi; tashqi devor — rad etiladi, sababi xabarda).
- Xona: nomlash (ikki marta bosish → nom maydoni yoki panel), rang (7 rang), nusxa (nuqtalari bilan, o‘ngga), o‘chirish, nom joyini sudrash. Botiq (L) xonalarda nom ichki eng keng joyga qo‘yiladi.
- Eshik/deraza — devorga bosib qo‘yiladi, devor bo‘ylab suriladi, o‘chiriladi.
- Yopishtirish (`domain/snap.ts`): mavjud burchak → devor (devor bo‘ylab grid) → oldingi nuqtadan 45° (mavjud burchaklar bilan tekislash) → grid. Pencil/sichqoncha hover’da yopishish nuqtasi oldindan ko‘rinadi.
- O‘ng panel tanlovga qarab: Tanlangan nuqta / xona / devor / eshik-deraza. “Xonalar ro‘yxati”dagi ko‘z — xonaga fokus.
- “Faqat Pencil bilan chizish” yoqilsa, barmoq chizmaydi (faqat tanlaydi/suradi).

**Test qilindi**
- `pnpm typecheck`, `pnpm lint`, `pnpm test` — 137 test (topologiya, devor surish/bo‘lish/birlashtirish, sketch — titroq to‘rtburchak/kvadrat/L/45°/ochiq chiziq/zoom, xona buyruqlari, yopishtirish, chizish asboblari, hit-test).
- `pnpm test:e2e` — 26 ssenariy × 6 profil: 151 o‘tdi, 5 ataylab o‘tkazildi. Yangi: ikki xona umumiy devor; titroq chizma → toza to‘rtburchak + undo’da asl chizma; erkin L-xona; umumiy devorni surish; ikki marta bosib nomlash + rang + yangilashdan keyin saqlanishi; eshik; tashqi devorni o‘chirishda xabar; **telefonda barmoq bilan** (CDP touch) titroq chizma → to‘rtburchak. Hammasi IndexedDB’dan tekshiriladi.
- Qabul: referensdagidek 6 xonali reja (5 to‘rtburchak + 1 erkin koridor, 6 eshik, 6 deraza) skript bilan ~2 s da chiziladi — qo‘lda 3 daqiqadan ancha kam (`docs/screenshots/phase-4/`).
- Skrinshotlar: iPad 1180, Windows 1920, iPhone (barmoq bilan chizish va natija), panellar, xabar, menyu.
- Phase 1–3 qayta tekshirildi (shu e2e to‘plamida + demo 1536×1024 skrinshoti).
- Topilib tuzatilgan: devor surishda davom etuvchi devor qiyshayishi (endi pog‘ona), kichik xonada nom yorlig‘i devor ustidan tanlanishi, devorga yopishganda grid’dan chiqib ketish (10 birlik “bo‘lakchalar”), ko‘pburchak paneli bosishlarni to‘sishi, rang namunalari sig‘masligi, iPad’da toolbar sig‘masligi (tugmalar guruhlandi).

**Ma’lum cheklovlar**
- Haqiqiy iPad + Apple Pencil’da sinab ko‘rish kerak (bu yerda emulyatsiya).
- Yopiq guruh bo‘lmagan bitta xonani butunlay siljitish yo‘q (devorlarini surish orqali o‘zgartiriladi).
- Devorni o‘chirish bilan birlashtirish faqat bitta umumiy devor bo‘lsa ishlaydi (aks holda xabar).
- Undo tarixi faqat xotirada.
- Eshik/deraza eni standart (80 / 120) — o‘zgartirish keyinroq.

## Phase 3 — 2026-11-03

**Bajarildi**
- `domain/geometry.ts`: ekran ↔ dunyo koordinatalari, pan, ikki barmoqli pinch (barmoq ostidagi nuqta joyida qoladi), g‘ildirak turi (sichqoncha → kursorga zoom, trackpad pinch → zoom, trackpad scroll → pan), grid va 0/45/90° burchakka yopishtirish, kesmaga proyeksiya/masofa, ko‘pburchak ichidami, to‘rtburchak.
- `domain/history.ts`: immer patch’lari bilan undo/redo, bitta sudrash = bitta qadam (coalesce), 200 qadam chegarasi, yangi amal redo’ni tozalaydi.
- `domain/selection.ts`: hit-test (nuqta → devor → xona), ramka bilan tanlash, Shift/Ctrl, panel fokusi. `domain/editing.ts`: o‘chirish (xona → nuqtalari va faqat o‘ziga tegishli devorlar; umumiy devor qo‘shniga qoladi; devor → undagi nuqtalar), siljitish (devordagi nuqta devor bo‘ylab sirpanadi, shift saqlanadi; xonalar faqat yopiq guruh bo‘lsa butunlay siljiydi, grid’ga yopishadi).
- Asboblar (pointer holat mashinalari): Tanlash (V), Ramka tanlash (M), Siljitish (H). Bo‘sh joyni sudrash = pan. Tanlov barmoq ko‘tarilganda yoki sudrash boshlanganda hal qilinadi — ikkinchi barmoq (pinch) yoki uzoq bosish tanlovni buzmaydi.
- `GestureRouter`: ikki barmoq pinch/pan, o‘rta tugma va Space+drag pan, kaftni rad etish (Pencil bosilganda barmoq e’tiborsiz), uzoq bosish 500 ms → kontekst menyu (Xususiyatlar / Nusxa — Phase 6 / O‘chirish), o‘ng tugma → shu menyu. Harakatlar `requestAnimationFrame` bilan guruhlanadi (120 Hz iPad).
- Klaviatura: ⌘/Ctrl+Z, ⇧⌘Z / Ctrl+Shift+Z / Ctrl+Y, ⌫/Delete, Esc, ⌘/Ctrl+A, V/M/H, +/−, 0 (ekranga sig‘dirish).
- Canvas: reja qatlami memo (pan paytida qayta chizilmaydi), tanlash/ramka overlay qatlami; o‘lcham o‘zgarsa (aylantirish, Split View) ko‘rinish markazi saqlanadi.
- Toolbar’dagi barcha tugmalar endi ishlaydi; nuqta panelidagi “O‘chirish” ishlaydi. Devor bosilsa — “Devor ko‘rinishi” shu devorni ko‘rsatadi.
- Sozlamalar sahifasi: “Faqat Pencil bilan chizish” (qurilmada IndexedDB `meta.deviceSettings` da saqlanadi): yoqilsa bitta barmoq faqat tanlaydi va suradi, obyektni siljitmaydi.
- Reja ichidagi o‘zgarishlar 400 ms dan keyin IndexedDB’ga yoziladi, ilova fonga o‘tganda/yopilganda darhol (`pagehide`/`visibilitychange`). Loyiha darajasidagi amallardan oldin ham kutilayotgan yozuv yakunlanadi.

**Test qilindi**
- `pnpm typecheck`, `pnpm lint`, `pnpm test` — 93 test (geometriya, tarix, tanlash/tahrir, asboblar, gest router — fake timer bilan uzoq bosish, kaft, pinch).
- `pnpm test:e2e` — 20 ssenariy × 6 profil: 115 o‘tdi, 5 ataylab o‘tkazildi (telefonda ✎ yo‘q; <1024 da nuqta paneli yashirin — o‘sha o‘chirish kontekst menyu testida). Test loyihasi IndexedDB’ga yozib ochiladi (zod o‘qish yo‘li ham tekshiriladi): tanlash, devor bo‘ylab sudrash, undo/redo, yangilashdan keyin saqlanish, ramka + Delete + Ctrl+Z/Ctrl+Shift+Z, o‘ng tugma menyusi, zoom tugmalari/fit/pan, CDP orqali ikki barmoqli pinch, Pencil sozlamasi saqlanishi.
- Qo‘lda (Playwright skrinshot, `docs/screenshots/phase-3/`): iPad landshaft — sichqoncha, ramka, g‘ildirak, o‘ng tugma; sensor — pinch, uzoq bosish; iPhone/iPad portret — menyu → Xususiyatlar (telefonda pastki panel, planshetda slide-over).
- Phase 1–2 qayta tekshirildi (shu e2e to‘plamida): sahifalar, nav, loyiha CRUD, demo.
- Topilib tuzatilgan: canvas o‘lchami effektidagi cheksiz qayta-render; barmoq ko‘tarilganda sun’iy click menyuni yopib qo‘yishi; pinch boshida birinchi barmoq tanlovni o‘zgartirishi.

**Ma’lum cheklovlar**
- Haqiqiy iPad/Apple Pencil’da 60 fps va kaft rad etishni bu muhitda o‘lchab bo‘lmadi (Chromium emulyatsiyasi). Iltimos, iPad’da tekshirib ko‘ring.
- Pencil hover oldindan ko‘rsatish — Phase 4 (devor/burchakka yopishish bilan birga).
- Bitta xonani umumiy devorlardan ajratib siljitish, devorni siljitish/bo‘lish — Phase 4. Nuqtani boshqa devorga ko‘chirish — Phase 6.
- Undo tarixi faqat xotirada (sahifa yangilansa tozalanadi).
- Nusxa (kontekst menyu, panel) — Phase 6.

## Phase 2 — 2026-11-03

**Bajarildi**
- `domain/ids.ts` (UUID v7 — vaqt bo‘yicha saralanadi, oflayn yaratiladi), `domain/schemas.ts` (zod: Project/Room/Wall/Point/Opening/Settings + loyiha formasi; xatolar kod sifatida, matni `uz.validation` da), `domain/commands.ts` (yaratish, tahrirlash, soft delete, chuqur nusxa — barcha ID’lar yangilanadi, progress nolga tushadi), `domain/projectList.ts` (qidiruv, saralash, xulosa, so‘nggi loyihalar, takrorlanmas nom).
- IndexedDB repo (`infra/idb`): `elektroplan` v1 bazasi (`projects`, `outbox`, `meta`), o‘qishda har bir yozuv zod bilan tekshiriladi — buzilgan yozuv o‘tkazib yuboriladi, ilova yiqilmaydi. `navigator.storage.persist()` birinchi saqlashda so‘raladi.
- `projectStore` (Zustand + immer): init (IndexedDB’dan), create / updateInfo / duplicate / remove / open; avval IndexedDB’ga yoziladi, keyin ekranda ko‘rinadi (yangilansa yo‘qolmaydi). Yozish xatosi bo‘lsa — o‘zbekcha ogohlantirish banneri, ma’lumot xotirada qoladi.
- Loyihalar sahifasi: ro‘yxat (kartalar: nom, buyurtmachi, manzil, xona/nuqta soni, yangilangan vaqt, progress), qidiruv (nom/buyurtmachi/manzil, katta-kichik harf va ‘ ʻ ' farqsiz), saralash (oxirgi o‘zgargan, yaratilgan, nomi, foiz), Ochish / Tahrirlash / Nusxa olish / O‘chirish (tasdiq oynasi bilan), bo‘sh holat.
- Forma dialogi (yaratish/tahrirlash): validatsiya xatolari o‘zbekcha; telefonda pastdan chiqadi; input shrifti 16px (iOS zoom qilmaydi).
- Header: ✎ endi ishlaydi (tahrirlash), papka tugmasi → “So‘nggi loyihalar” menyusi (5 ta) + Barcha loyihalar + Yangi loyiha. Loyiha tanlanmaganda “Loyiha tanlanmagan” + yaratish tugmalari.
- Bosh sahifa oxirgi ochilgan (yoki eng so‘nggi) loyihani ochadi; `/editor/?id=` — shu loyiha, yo‘q bo‘lsa “Loyiha topilmadi”. Sidebar “Jami loyihalar” — real son.
- Demo (`?demo=1`, dev) o‘zgarmadi va saqlanmaydi.
- Yangi bog‘liqlik: `@radix-ui/react-dialog` (shadcn/ui Dialog uchun, ARCHITECTURE §5 dagi “generated @radix-ui/*”).

**Test qilindi**
- `pnpm typecheck`, `pnpm lint`, `pnpm test` — 48 test (sxemalar, buyruqlar, ID, ro‘yxat, store + IndexedDB integratsiyasi `fake-indexeddb` bilan: “sahifani yangilash”dan keyin ham saqlanishi, buzilgan yozuv, yozish xatosi).
- `pnpm test:e2e` — 13 ssenariy × 6 profil: 76 o‘tdi, 2 ataylab o‘tkazildi (telefonda ✎ yashirin, u yerda tahrir kartadan). Yaratish → yangilash → saqlangan; tahrir/nusxa/o‘chirish (bekor qilish bilan) → yangilashdan keyin ham to‘g‘ri; qidiruv/saralash; o‘zbekcha validatsiya xatosi; mavjud bo‘lmagan ID.
- Phase 1 tekshirildi: demo reja 1536×1024 da avvalgidek; nav, belgilar, zoom ishlaydi.
- Skrinshotlar: `docs/screenshots/phase-2/` (iPad landshaft/portret, iPhone, Windows). Gorizontal scroll yo‘q.
- Topilib tuzatilgan: brauzerlarda `uz` alifbo tartibi har xil ishlashi (endi hamma qurilmada bir xil A–Z tartib), telefonda qidiruv maydoni siqilishi, loyiha yo‘qda header’da “— | —”.

**Ma’lum cheklovlar**
- Loyiha ichidagi o‘zgarishlarni avtosaqlash (debounce, outbox, beforeunload) — Phase 8. Hozir faqat loyiha darajasidagi amallar (yaratish, tahrir, nusxa, o‘chirish) saqlanadi; “Saqlash” tugmasi hali disabled.
- O‘chirilgan loyihalar IndexedDB’da `deletedAt` bilan qoladi (keyingi sinxronizatsiya uchun); “Savat”dan tiklash yo‘q.
- Ochish/tahrir boshqa tab’da qilinsa, ikkinchi tab o‘zgarishni faqat yangilangandan keyin ko‘radi.

## Phase 1 — 2026-11-03

**Bajarildi**
- Next.js 15 (App Router, `output: 'export'`, `trailingSlash: true`) + TS strict (`noUncheckedIndexedAccess`) + Tailwind 4 + shadcn/ui uslubidagi `Button`/`Tooltip` + ESLint + Prettier + Vitest + Playwright (6 qurilma profili), pnpm.
- GitHub Actions: `ci.yml` (typecheck, lint, test, build, `php -l`, e2e — iPad/iPhone uchun WebKit) va `deploy.yml` (build → `deploy/` → `api/config.php` secrets’dan → FTPS). Secrets qo‘shilganda ishlaydi.
- `public/.htaccess` (HTTPS, `/api` ga tegmaydi, trailing slash, 404, kesh sarlavhalari), `server/.htaccess` + `server/index.php` (503 stub, Phase 12 gacha).
- `viewport-fit=cover`, safe-area (`env(safe-area-inset-*)`), `100dvh`, sahifa scroll’i yo‘q.
- ARCHITECTURE §3 papka tuzilmasi (keyingi bosqich modullari `index.ts` bilan).
- Dizayn tokenlari (`src/styles/globals.css`), Inter (next/font, build vaqtida o‘z serverga joylanadi — offline uchun), `GlassPanel`, `Button` variantlari, `ProgressRing`, `NumberField`, `ColorSwatches`, `Hint`/`NextPhase` tooltip.
- `src/i18n/uz.ts` — barcha matnlar shu yerda.
- AppShell: Sidebar (logo, 6 nav, Jami loyihalar, Pro karta, foydalanuvchi), Header, Symbol bar (+ “Boshqa” menyusi), chap toolbar, Konva `Stage` + grid, “Tanlangan nuqta”, Xonalar ro‘yxati, Devor ko‘rinishi (SVG), Loyiha holati.
- 11 ta SVG belgi bitta manbadan (`features/symbols/catalog.ts`): DOM’da `SymbolIcon`, Konva’da `PointGlyph` — bir xil glif ma’lumoti.
- Demo uy rejasi (`?demo=1`, faqat dev; yoki build’da `NEXT_PUBLIC_ENABLE_DEMO=1`): 6 xona, umumiy devorlar, eshik/derazalar, 30 nuqta, 70% progress. Production’da demo chunk yuklanmaydi.
- Responsive: <600 bottom nav + bottom sheet (Nuqta/Xonalar/Devor/Holat); 600–1023 72px rail + nuqta paneli slide-over + pastki qator tablar; 1024–1279 rail + siqilgan referens maket; ≥1280 to‘liq referens maket.
- Ishlaydigan amallar: nav marshrutlari, belgi tanlash (aktiv belgi), “Boshqa” menyusi, zoom +/−, “Ekranga sig‘dirish”, xona tanlash → devor ko‘rinishi shu xonaning eng ko‘p nuqtali devoriga o‘tadi, “Montaj rejimi” → `/install/?id=`.
- Keyingi bosqich tugmalari `disabled` + “Keyingi bosqichda”: Saqlash, Eksport PDF, ✎, Ramka/Siljitish/Undo/Redo, O‘chirish, Nusxa, ko‘z (xonaga fokus), Yangilash, Loyiha tayyor; nuqta maydonlari faqat o‘qish uchun (tahrir Phase 6).
- Domen (sof funksiyalar + testlar): `geometry.ts`, `walls.ts` (devorlarni xonalardan chiqarish, umumiy devor, yo‘nalish, teshiklar), `progress.ts`, `selectors.ts`, `project.ts`, `types.ts`.

**Test qilindi**
- `pnpm typecheck`, `pnpm lint`, `pnpm test` (22 unit test), `pnpm build` (statik `out/`, `.htaccess` bilan), `php -l server/*.php` — o‘tdi.
- `pnpm test:e2e` — 7 ssenariy × 6 profil = 42/42 o‘tdi (sahifalar ochiladi, nav, Montaj rejimi havolasi, disabled tugmalar, belgi tanlash, gorizontal scroll yo‘q, production’da demo yo‘q).
- Skrinshotlar (`docs/screenshots/phase-1/`): referens 1536×1024, iPad 1180×820, iPad Pro 1366×1024, iPad portret 820×1180, iPhone 390×664, Android 412×915, Windows 1920×1080, telefon bottom sheet, planshet slide-over. Barcha o‘lchamlarda gorizontal scroll yo‘q.
- Referens bilan solishtirib tuzatilgan farqlar: logo ko‘rinmasligi, devor birikmalari, eshik ochilish tomoni, kirish eshigi kesilishi, rozetka belgilarining devor bo‘yicha burilishi, o‘ng panel yozuvlari qisqarishi, iPad landshaftda toolbar/panel sig‘masligi, devor ko‘rinishida o‘lcham yozuvlari ustma-ust tushishi, telefonda sarlavha torligi.

**Ma’lum cheklovlar**
- Lokal muhitda faqat Chromium bor: iPad/iPhone profillari Chromium’da (Apple viewport/touch/UA bilan) tekshirildi. CI’da `E2E_WEBKIT=1` bilan WebKit’da ishga tushadi.
- Referensdan ataylab farqlar (ma’lumotga asoslangani uchun): devor ko‘rinishi “Zal – G‘arb devori” (TV shu devorda), xonalar nuqta soni va 21/9/30 hisoblari demo ma’lumotdan; sidebar ikonkalari lucide (referensdagi 3D ikonkalar emas); disabled tugmalar biroz xiraroq.
- Konva canvas’da hali pan/zoom gestlari, tanlash va chizish yo‘q (Phase 3). Nuqtani rejada tanlash yo‘q — demo tanlovi oldindan o‘rnatilgan.
- `Opening` (eshik/deraza) turi vaqtinchalik qo‘shildi — MySQL sxemasiga Phase 4 da kiritiladi.
- Android “Orqaga” tugmasi bottom sheet’ni yopishi — keyingi bosqichlarda.
- ARCHITECTURE §5 dagi ro‘yxatdan tashqari faqat tooling yordamchilari qo‘shildi: `@tailwindcss/postcss`/`postcss` (Tailwind 4 uchun), `@eslint/eslintrc` + `eslint-config-next`, `@vitejs/plugin-react` + `jsdom` + `@testing-library/dom` (Vitest uchun), `@radix-ui/react-slot` + `@radix-ui/react-tooltip` (shadcn/ui). `react-konva` 19.2 ga qotirilgan (Next 15 ichki React 19.2 bilan mos).

## Phase 0 — 2026-11-03
- Texnik topshiriq (`docs/SPEC.md`), dizayn referensi, arxitektura, ma’lumot modeli, MySQL sxemasi, qurilmalar, deploy, dizayn tizimi va bosqichlar rejasi tayyorlandi.
- Kod hali yo‘q — PHASE 1 dan boshlanadi.
- Hosting qarori: hostmaster.uz cPanel → Next.js static export + PHP 8 + MySQL, deploy GitHub Actions → FTP.
- Offline talab: barcha saqlangan loyihalar internetsiz ochiladi (ARCHITECTURE §4.6).
- Qurilmalar: iPad asosiy, keyin iPhone, Android, Windows (`docs/DEVICES.md`).
