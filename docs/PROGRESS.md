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
| 8 | Avtosaqlash (IndexedDB) | — |
| 9 | Montaj rejimi | — |
| 10 | PDF eksport | — |
| 11 | PWA / offline (internetsiz ishlash) | — |
| 12 | PHP + MySQL sync + Auth | — |
| 13 | Testlar va optimizatsiya | — |

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
