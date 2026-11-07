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
| 12 | PHP + MySQL sync + Auth | ✅ Tayyor |
| 13 | Testlar va optimizatsiya | ✅ Tayyor |
| 14 | Admin panel va Pro versiya | ✅ Tayyor |
| 15 | Barcha qurilmalarga moslashuv | ✅ Tayyor |
| 16 | Rus tili | ✅ Tayyor |
| 17 | Windows dasturi | ✅ Tayyor |
| 18 | Devor o‘lchamlari | ✅ Tayyor |
| 19 | Ixcham interfeys, rejani kattalashtirish | ✅ Tayyor |
| 20 | 3 va 4 talik rozetka | ✅ Tayyor |
| 21 | Elektr sxemalar: shit va tarqatish qutisi | ✅ Tayyor |
| 22 | Real ko‘rinishdagi sxemalar va detallar katalogi | ✅ Tayyor |
| 23 | Xonani 3D ko‘rish | ✅ Tayyor |
| 24 | 3D da detallarni barmoq bilan ko‘chirish | ✅ Tayyor |
| 25 | Uy bo‘ylab 3D yurish, 3D da qo‘shish, rozetka qo‘yish xatosi tuzatildi | ✅ Tayyor |

## Phase 25 — 2026-11-07

**Bajarildi**
- **Xato tuzatildi:** kichik balandlikdagi kompyuter ekranlarida (1366×720, 80% masshtab) yangi rozetka/viklyuchatel qo‘yib bo‘lmasdi — “Joylashtirish” yozuvi bosishlarni ushlab qolardi va reja tepadagi tugmalar ostida qolardi. Yozuv endi bosishni o‘tkazadi (faqat “Tugatish” tugmasi bosiladi), reja tugmalar va pastki tutqichdan bo‘sh joyga sig‘diriladi, past ekranlarda pastki panel 168 px. Regressiya testi: `tests/e2e/laptop.spec.ts`.
- **Butun uy bo‘ylab 3D yurish** (`domain/house3d.ts`, sof funksiyalar): barcha xonalar bitta sahnada, eshiklar ochiq (tabaqa ~80° ochilgan), devor tepalari, plintuslar; devorlar to‘siq — devorga urilsangiz u bo‘ylab sirpanasiz, eshikdan keyingi xonaga o‘tasiz (tez qadam ham devordan sakrab o‘tmaydi).
- Boshqaruv: telefonda/iPad’da chapdagi joystik (yuqoriga — oldinga, yonga — yon qadam), barmoq bilan suring — atrofga qarash, ikki barmoq — ko‘rish burchagi; kompyuterda W A S D / ↑ ↓ — yurish, ← → (Q/E) — burilish, Shift — tezroq.
- Xona ro‘yxati endi “qayerda turibsiz”ni ko‘rsatadi; boshqa xonani tanlasangiz o‘sha xonaga o‘tasiz. “Tepadan” — butun uy qo‘g‘irchoq uyi kabi.
- Boshlanish joyi: xona o‘rtasidan biroz orqada, eng uzoq devorga qarab.
- Har bir xonaning chirog‘i (yoki xona o‘rtasi) yoritadi — 8 tagacha yorug‘lik manbai, iliq rang.
- **3D da yangi rozetka/viklyuchatel/chiroq qo‘shish:** o‘ngdagi paneldan belgini tanlang → devorni bosing — o‘sha joyga, o‘sha balandlikka (5 sm qadam) qo‘yiladi; chiroq — shiftni (tepadan ko‘rinishda — polni) bosing. Devor orqasidagi joyga qo‘yilmaydi. Esc yoki belgini qayta bosish — tugatish. Har qo‘shish — bitta “Bekor qilish” qadami.
- Tanlash/ko‘chirish ham butun uyda ishlaydi; devor orqasidagi detal bosilmaydi.
- **Yana ikki xato tuzatildi:** (1) “Elektr sxemalar”da ketma-ket o‘zgartirishlar saqlashni cheksiz kechiktirardi — sahifa yangilansa oxirgi ish yo‘qolishi mumkin edi; endi birinchi o‘zgarishdan ≤300 ms ichida va sahifa yopilayotganda saqlanadi. (2) Sozlamalar sahifa ochilishi bilan darhol bosilsa, kech yuklangan eski qiymat yangisini bosib ketishi mumkin edi.
- Reja sig‘dirishda tepada/pastda kichik bo‘sh joy (28/20 px) — 3D tugmasi ostida qolmaydi, 500 nuqtali rejada kattalashtirish tezligi saqlandi (perf testi).
- Kutubxona kerak bo‘lmadi: o‘z WebGL renderimiz kengaytirildi (yuklama ~kichik, offline ishlaydi).

**Test qilindi**
- To‘liq e2e: 455 o‘tdi, 0 xato (6 profil). `pnpm typecheck`, `pnpm lint`, `pnpm test` (308 unit; yangi `tests/unit/house3d.test.ts`: sahna, ochiq eshik, devorga urilish, eshikdan o‘tish, devordan sakramaslik, boshlanish joyi, nur/devor, 3D da qo‘shish).
- e2e (`tests/e2e/room3d.spec.ts`): joystik bilan eshikdan keyingi xonaga o‘tish va devorda to‘xtash, W / ← klaviatura, xona tanlab o‘tish, 3D da viklyuchatel qo‘shish (balandligi bilan), surib ko‘chirish + bekor qilish. Skrinshotlar: `docs/screenshots/phase-25/`.

**Ma’lum cheklovlar**
- Soyalar yo‘q (yorug‘lik devor orqali o‘tmaydi, lekin qo‘shni xona chirog‘i polni biroz yoritadi).
- Eshik tabaqasi doim ochiq turadi; mebel yo‘q.
- Juda uzoqlashtirilgan katta rejada (masshtab < 0.45) kattalashtirish ko‘proq ish talab qiladi (belgilar o‘lchami har kadrda o‘zgaradi) — keyinroq optimallashtirish mumkin.
- 3D palitrada 7 ta asosiy belgi; qolganlari rejadan qo‘shiladi.

## Phase 24 — 2026-11-07

**Bajarildi**
- 3D ko‘rinishda rozetka, viklyuchatel, internet/TV rozetkasi yoki konditsionerni **barmoq bilan bosib surasiz**:
  - devor bo‘ylab chapga-o‘ngga va yuqori-pastga (balandlik 5 sm qadam bilan) siljiydi;
  - xonaning boshqa devoriga ham o‘tkazsa bo‘ladi;
  - shiftdagi chiroq shift bo‘ylab suriladi.
- Surish vaqtida tepada **“Poldan N sm — qo‘yib yuboring”** yozuvi chiqadi, detal yangi joyda jonli ko‘rinadi.
- Qo‘yib yuborilganda saqlanadi: rejada ham o‘sha joyga o‘tadi, balandlik va chap burchakdan masofa yangilanadi, akkaunt orqali sinxronlanadi. Bitta **“Bekor qilish”** qaytaradi.
- Detal bo‘lmagan joydan surish avvalgidek atrofga qaratadi; bosib qo‘yish (surmasdan) — ma’lumot chiqadi. Demo loyihada faqat ko‘rish mumkin.

**Test qilindi**
- Unit: barmoq nuri qaragan devorga tushadi (balandlik 5 sm qadamda), shiftga, hech narsaga tushmasa — yo‘q; rozetka devor bo‘ylab siljiydi va yangi balandlikni oladi, boshqa devorga o‘tadi.
- To‘liq E2E 6 profilda: 475 ta o‘tdi. Yangi: 3D da viklyuchatelni surish → “Poldan” yozuvi → saqlangan balandlik pasaydi, joyi o‘zgardi, ko‘rinish burilmadi → “Bekor qilish” qaytardi.

**Ma’lum cheklovlar**
- Detalni boshqa xonaga 3D dan o‘tkazib bo‘lmaydi (rejada mumkin).

## Phase 23 — 2026-11-06

**Bajarildi** — rejaning yuqorisida **“3D”** tugmasi (Chizma va Montaj rejimida):
- Tanlangan xona (yoki birinchisi) 3D da ochiladi. Tepadagi ro‘yxatdan boshqa xonaga o‘tasiz.
- **Ichkaridan:** xona o‘rtasida, 155 sm balandlikda turgandek. Bir barmoq bilan surib atrofga, yuqori-pastga qaraysiz. Ikki barmoq yoki sichqoncha g‘ildiragi bilan yaqinlashtirasiz. Tik turgan telefonda ko‘rish burchagi avtomatik kengayadi.
- **Tepadan:** “qo‘g‘irchoq uy” ko‘rinishi. Oldingi devorlar va shift yashirinadi, xonani aylantirib ko‘rasiz.
- **Real ko‘rinish (WebGL, qo‘shimcha kutubxonasiz):**
  - devorlar gips teksturasida, balandligi loyihadan (270 sm); burchak va pol-shift yonida yumshoq soya; shiftdagi yorug‘likdan tushadigan yoritilish;
  - pol — och eman laminat, shift oq;
  - **eshik** devorni teshib o‘tadi: o‘yiq qalinligi, oq nalichnik, yog‘och tabaqa (filenkali) va dastak;
  - **deraza:** o‘yiq, oq PVC rom (o‘rtada ustuncha), shaffof oyna, deraza tokchasi; tashqarida osmon, bulutlar va uzoqdagi binolar.
- **Devordagi detallar** real o‘lchamda va o‘z balandligida:
  - rozetka (1, 2, 3 o‘rinli va 2×2), viklyuchatel (1–2 klavishli), internet va TV rozetkalari;
  - konditsioner (80×29 sm, 220 sm balandlikda), shiftdagi chiroq va LED.
  - **“Belgilash”** tugmasi detallar atrofida rangli yog‘du qiladi — katta devorda kichik rozetkani tez topasiz. Uni o‘chirib qo‘yish mumkin.
- **Detalni bosing:** nomi, poldan balandligi, devor nomi va izohi chiqadi.

**Test qilindi**
- Unit: 3D geometriya (devorlar to‘liq balandlikda va normallari xona ichiga qaragan, uchburchaklash — to‘rtburchak va L shakl, deraza ostidagi va ustidagi bo‘laklar, o‘yiq yon tomonlari, oyna, tokcha, osmon, eshik; nuqtalar devorning ichki yuzasida va o‘z balandligida, konditsioner standart 220 sm, chiroq shiftda), kamera va bosish (rozetkaga bosish uni topadi, bo‘sh devorga — hech narsa).
- E2E 6 profilda (iPad, iPhone, Android, Windows): 3D ochiladi, rasm chiziladi (bir xil rang emas), surish ko‘rinishni buradi, “Tepadan”, “Belgilash”, xona almashtirish, yopish.
- Skrinshotlar: `docs/screenshots/phase-23/`.

**Ma’lum cheklovlar**
- Eshik va derazaning balandligi standart (eshik 210 sm, deraza 85–210 sm) — rejada ularning balandligi hali kiritilmaydi.
- Xonalar orasida 3D “yurish” yo‘q — xona ro‘yxatdan tanlanadi. Mebel yo‘q.
- Tarqatish qutisi va kabel yo‘llari 3D da hali ko‘rsatilmaydi.

## Phase 22 — 2026-11-06

Egasining fikri: oldingi sxemalar multfilmga o‘xshab, tushunarsiz edi; hammasi real bo‘lishi va detallar ko‘p bo‘lishi kerak.

**Bajarildi**
- **Real tarqatish qutisi:**
  - qopqog‘i ochiq ABS quti: vint ustunlari, rezina kirishlar;
  - qora VVGng kabellar devor bo‘ylab keladi; qobig‘i tozalangan joydan tolalar real ranglarda chiqadi (jigarrang, ko‘k, sariq-yashil chiziqli, qora, kulrang, oq), uchlari tozalangan mis;
  - Wago 221 shaffof korpusda: ichidagi mis plastina ko‘rinadi, richag sim kirsa yopiladi;
  - real devor viklyuchateli (klavishlari bosiladi) va lampochka (ichidagi ip yonadi, atrofga yorug‘lik tarqaladi).
- **Tok oqimi tushunarli:**
  - faza — to‘q sariq nur nuqtalari shitdan viklyuchatel orqali chiroqqa boradi; nol — ko‘k nuqtalar qaytib keladi;
  - nuqtalar har bir tolada tokning haqiqiy yo‘nalishida yuradi (kabel qobig‘ida ham);
  - **“Tok yo‘li”** bo‘limi zanjirni 5 qadamda yozadi: shitdan faza → L klemma → viklyuchatel → klavish chiqishi → chiroq → nol orqali shitga.
- **“O‘zim ulayman” real:**
  - Wago’ni o‘zingiz tanlaysiz (2, 3 yoki 5 o‘rinli);
  - simning mis uchini **barmoq bilan Wago teshigiga tortasiz** (yoki uchini, keyin teshikni bosasiz); bossangiz chiqadi;
  - “Tekshirish” barcha klavish holatlarini sinaydi, “To‘g‘ri javob” 5 dan ko‘p sim bo‘lsa zanjir (peremichka bilan) ko‘rsatadi.
- **Real shit:**
  - hisoblagich (LCD’da quvvat, LED yuklamaga qarab miltillaydi);
  - kirish avtomati, kuchlanish relesi (raqamli displey “230”), UZIP (yashil oynalar), UZO va difavtomat (sariq “T” tugma);
  - avtomatlar: qora dastak (I/O), qizil/yashil holat bayroqchasi, vintli yuqori/pastki klemmalar, reyting va tavsif yozuvi;
  - teshikli DIN-reykalar, mis taroqsimon shina (UZO guruhiga alohida), har qatorda PE va N shinalar (UZO guruhi uchun alohida N);
  - ichki simlar real shitdagidek to‘g‘ri burchak bilan tartibli yotqizilgan (faza, N, PE stoyaklar);
  - liniya kabellari o‘ng tomondan chiqadi, uchida iste’molchi (bosib yoqiladi, amper ko‘rinadi);
  - 3 fazada L1/L2/L3 o‘z ranglarida (jigarrang, qora, kulrang);
  - tok bor simlarda nur nuqtalari: hisoblagichdan avtomatgacha faza, qaytishda nol.
- **“Detallar” katalogi** (yangi tab), 48 ta detal real rasmda, har biri: nomi, nima uchun kerak, qayerga qo‘yiladi. Qidiruv va 4 guruh:
  - **Shit:** avtomat 1P/2P/3P, UZO, difavtomat, rele, UZIP, rubilnik, kontaktor, impuls rele, taymer, shit rozetkasi, hisoblagich, DIN-reyka, taroqsimon shina, N va PE shina, shit qutisi;
  - **Tarqatish qutisi:** Wago 221-412/413/415, Wago 2273, SIZ qalpoqcha, klemma kolodka, tarqatish qutisi;
  - **Devor:** viklyuchatel 1/2/3 klavishli, o‘tish viklyuchateli, dimmer, harakat datchigi, rozetka, ikki o‘rinli, IP44, plita rozetkasi 32 A, podrozetnik, chiroq;
  - **Kabel va montaj:** VVGng 2×1,5 / 3×1,5 / 3×2,5 / 3×4 / 3×6 / 5×2,5, kirish kabeli, PVS, gofra truba, kabel kanal, dyubel-xomut.
- Shit uchun yangi iste’molchilar: muzlatgich, mikroto‘lqinli pech, suv nasosi, elektr isitgich, elektromobil zaryadkasi (difavtomat C40, 10 mm²).

**Test qilindi**
- Unit: tok yo‘nalishi (faza kiradi → viklyuchatelga → klavishdan qaytadi → chiroqqa; nol qaytadi; ikki chiroqda yuklama 2), yangi iste’molchilar.
- To‘liq E2E 6 profilda: 460 ta o‘tdi (iPhone’dagi bitta barmoq bilan chizish testi yuklama ostida bir marta yiqildi, qayta 24/24 o‘tdi). Yangi: real qutida klavish → chiroq yonadi, “Tok yo‘li” matni; Wago qo‘shish, simni bosib va **sichqoncha/barmoq bilan tortib** ulash, to‘g‘ri javob → “Hammasi to‘g‘ri”; real shitda yuklama, UZO/avtomat o‘chishi; katalog: 48 detal, qidiruv, guruh.
- Skrinshotlar: `docs/screenshots/phase-22/`.

**Ma’lum cheklovlar**
- Qo‘lda ulashda 5 dan ortiq simni bitta guruhga ulash uchun peremichka hozircha faqat “To‘g‘ri javob”da; o‘zingiz peremichka qo‘yish keyingi bosqichda.
- Shitni simlab o‘zingiz ulash rejimi hali yo‘q (shit — tayyor sxema + sinov).
- Telefonda sxemalar yonga surib ko‘riladi.

## Phase 21 — 2026-11-05

**Bajarildi** — yangi bo‘lim **“Elektr sxemalar”** (menyuda “Sxema”), internetsiz ishlaydi, ma’lumotlar qurilmada saqlanadi.
- **Elektr shit:**
  - Kirish: 1 faza (220 V) yoki 3 faza (380 V), ajratilgan quvvat (kVt).
  - Liniyalar ro‘yxatdan qo‘shiladi (yoritish, rozetkalar, oshxona, hammom, duxovka, elektr plita, konditsioner, boyler, kir/idish yuvish mashinasi, issiq pol, hovli, boshqa) yoki **“Loyihadan olish”** — chizilgan rejadagi rozetka/chiroq/konditsionerlardan avtomatik (oshxona va hammom alohida, xonalar 8 rozetkagacha birga, har konditsioner alohida).
  - Har liniyaga tavsiya: tok, avtomat (B — chiroq, C — rozetka/texnika), kabel kesimi (1,5 / 2,5 / 4 / 6 / 10 mm²), himoya: UZO 30 mA, difavtomat (kir yuvish, boyler, hammom, hovli) yoki avtomat. 3 fazada liniyalar fazalarga teng taqsimlanadi.
  - Shit: kirish avtomati (ajratilgan quvvat bo‘yicha), kuchlanish relesi, UZIP, UZO guruhlari (bittasida 4 tagacha liniya, reytingi to‘g‘ri), N va PE shinalar, modullar soni, shit hajmi (20 % zaxira), **materiallar ro‘yxati** va **tavsiyalar** (ulash tartibi, sim ranglari, nima uchun).
  - **Animatsiyali shit:** DIN-reykalar, avtomatlar — dastagini bossangiz yoqiladi/o‘chadi; taroqsimon faza shinasi; har liniyaning kabeli (jigarrang L, ko‘k N, sariq-yashil PE); iste’molchini bossangiz tok oqadi (oqim animatsiyasi, amper ko‘rsatiladi).
  - **Sinov:** ortiqcha yuklama (avtomat qizib o‘chadi), qisqa tutashuv (bir zumda o‘chadi), tok sizishi (UZO/difavtomat o‘chadi; UZO bo‘lmasa “tok urishi mumkin” ogohlantirishi), UZO “T” test tugmasi, “Hammasini yoqish” (kirish avtomati yuklamani ko‘tara oladimi), hodisalar jurnali.
- **Tarqatish qutisi:**
  - 1–4 viklyuchatel (1, 2, 3 klavishli), har klavishga 1–4 chiroq.
  - Kabellar (shitdan 3×1,5, viklyuchatelga 2/3/4 tolali, chiroqlarga 3×1,5), klemmalar (Wago 221 — 2/3/5 o‘rinli, 5 dan ko‘p bo‘lsa zanjir), **ulash tartibi** matnda.
  - **Animatsiyali quti:** har bir tola o‘z klemmasigacha chizilgan; viklyuchatel klavishini bossangiz faza oqimi ko‘rinadi va chiroq yonadi.
  - **“O‘zim ulayman”:** tolaning uchini bosing → klemmani bosing (yoki “Yangi klemma”). **“Tekshirish”** barcha klavish holatlarini sinaydi va xatolarni aytadi: qisqa tutashuv (faza+nol yoki faza+yer), chiroq yonmaydi / doim yonadi / boshqa klavishdan yonadi, **viklyuchatel nolni uzyapti** (xavfli), chiroq yerga ulanmagan, ulanmagan sim. “To‘g‘ri javob” tugmasi bor.
- Boshqa: telefon pastki menyusida “Material” (hali tayyor emas) o‘rnida “Sxema”; uzun menyular telefonda ekran ichida suriladi.

**Test qilindi**
- Unit (15 ta yangi): kabel/avtomat tanlash, UZO guruhlari va reytingi, kirish avtomati, 3 faza taqsimoti, ajratilgan quvvatdan oshish, simulyatsiya (yoqish, qisqa tutashuv, ortiqcha yuklama, tok sizishi, UZO testi, hammasi yoqilganda kirish avtomati), klemmalar, quti ulanishi, klassik xatolarni topish, loyihadan liniyalar.
- To‘liq E2E 6 profilda: 455 ta o‘tdi. Yangi: shitga liniya qo‘shish → tavsiyalar, iste’molchini yoqish → 11,4 A, tok sizishi → UZO o‘chadi, qisqa tutashuv → avtomat o‘chadi, materiallar, qayta yuklashda saqlanadi; quti: klavish → chiroq yonadi, “O‘zim ulayman” → tekshirish xatolarni ko‘rsatadi, qo‘lda ulash, to‘g‘ri javob → “Hammasi to‘g‘ri”; loyihadan liniyalar.
- Layout auditi (yangi sahifa bilan, 15 qurilma): 0 muammo. Skrinshotlar: `docs/screenshots/phase-21/`.

**Ma’lum cheklovlar**
- Sxemalar akkaunt orqali sinxronlanmaydi (faqat shu qurilmada saqlanadi).
- Tarqatish qutisida o‘tish (prohodnoy) viklyuchatellar va rozetka tranziti hali yo‘q; shitni qo‘lda simlab ulash (faqat tayyor sxema) hali yo‘q.
- Telefonda sxemalar yonga surib ko‘riladi. PDF ga chiqarish hali yo‘q.
- Tavsiyalar odatiy kvartira/uy uchun (mis kabel, yashirin montaj, TN-C-S); murakkab obyektlarda loyihachi hisoblaydi.

## Phase 20 — 2026-11-05

**Bajarildi**
- **To‘rt rozetka** — yangi belgi (2×2 to‘rt doira, ko‘k, 30 sm, devorga yopishadi va devor bilan buriladi). O‘zbekcha “To‘rt rozetka”, ruscha “Четверная розетка”.
- **Uch rozetka** oldin “Boshqa” menyusida yashirin edi — endi u ham, to‘rt rozetka ham asosiy panelda, “Ikki rozetka” yonida.
- Belgi paneli: chiplar sig‘masa yonga suriladi, **“Boshqa” tugmasi doim ko‘rinib turadi** (iPad va telefonda ham).
- Server: migratsiya `004_socket_quad.sql` (deployda avtomatik), API yangi belgini qabul qiladi. Nuqta turini o‘zgartirish menyusi, PDF, materiallar, belgilar galereyasida ham bor.

**Test qilindi**
- Unit/integratsiya: katalogda 12 belgi, panelda 9 chip; ikki qurilma sinxron senariysida to‘rt rozetka server orqali o‘tadi; migratsiyadan keyin 12 tizim belgisi.
- To‘liq E2E 6 profilda: 437 ta o‘tdi. Yangi: “Uch rozetka” va “To‘rt rozetka” panelda, to‘rt rozetka devorga qo‘yiladi (30 sm), “Boshqa” ekranda ko‘rinadi; belgilar galereyasida 12 ta.
- Skrinshotlar: `docs/screenshots/phase-20/`.

**Ma’lum cheklovlar**
- Telefonda barcha chiplar bir qatorga sig‘maydi — yonga surib tanlanadi.

## Phase 19 — 2026-11-05

**Bajarildi**
- **Windows dasturi ixcham:** standart 80 % masshtab — tugmalar, yozuvlar, panellar oddiy Windows dasturidek. Sozlamalar → “Interfeys o‘lchami”: 70 / 80 / 90 / 100 %; tanlov dasturning o‘zida saqlanadi va keyingi ochilishda darhol qo‘llanadi. Bu WebView’ning o‘z masshtabi (brauzerdagi Ctrl − kabi), shuning uchun reja va bosishlar aniq ishlaydi.
- **Rejani yoyish (kattalashtirish):** rejaning o‘ng yuqori burchagidagi tugma — o‘ng panel va pastki panellar yashirinadi, reja butun maydonni oladi. Qayta bosish yoki Esc — qaytadi. Telefonda pastki varaq ham yashirinadi. “Xususiyatlar” so‘ralsa avtomatik qaytadi.
- **Pastki panellarni yig‘ish:** rejaning pastki o‘rtasidagi tutqich — bossangiz xonalar ro‘yxati / devor ko‘rinishi / holat yig‘iladi (reja kattalashadi), yana bossangiz ochiladi; tortib balandligini o‘zgartirish mumkin, pastga tortib tashlasangiz yig‘iladi. Holat qurilmada eslab qolinadi.
- **Telefon ixchamroq:** sarlavha tugmalari 44→40 px, belgi chiplari 44→36 px va 14 px matn, pastki menyu 58→52 px, panel tablari va maydonlar pastroq, panel ichki bo‘shliqlari kichikroq. Kiritish matni 16 px qoldi (iPhone o‘zi kattalashtirib yubormasligi uchun).

- **Tuzatish:** parol almashtirilgandan keyin serverning eskiroq javobi kech kelsa, “parolni almashtiring” oynasi qaytib chiqishi mumkin edi (CI’da ba’zan ko‘rinardi) — endi eski javob yangi holatni bosib ketmaydi.

**Test qilindi**
- Unit: kech kelgan eski javob parol oynasini qaytarmaydi; yangi javob esa akkauntni yangilaydi.
- To‘liq E2E 6 profilda: 431 ta o‘tdi. Yangi testlar: kattalashtirish → reja maydoni oshadi → qaytadi; pastki panellar bosish bilan yig‘iladi, qayta yuklashda yig‘ilgan qoladi, ochiladi, pastga tortish bilan yig‘iladi.
- Layout auditi 15 qurilma o‘lchamida: 0 muammo.
- Windows dasturi Linux’da (virtual ekran 1366×768) ishga tushirildi: 80 %, kattalashtirish, panel yig‘ish, 70 % tanlash va saqlanishi tekshirildi. Skrinshotlar: `docs/screenshots/phase-19/`.

**Ma’lum cheklovlar**
- Brauzerdagi saytda (kompyuterda) masshtab sozlamasi yo‘q — brauzerning o‘zida Ctrl − / Ctrl + ishlating.
- iPad ko‘rinishi o‘zgarmadi (asosiy qurilma).

## Phase 18 — 2026-11-04

**Bajarildi**
- **Chizayotganda o‘lcham ko‘rinadi:** to‘rtburchak xona — eni va bo‘yi, devor — uzunligi, erkin xona — har bir tomon va hozir chizilayotgan tomon. Barmoqni qo‘yib yuborgan joyingizda shu o‘lcham qoladi (to‘r bo‘yicha 20 sm qadam).
- **Devor uzunligini yozish (ixtiyoriy):** devorni tanlang → “Uzunligi” → masalan `3,2`, `320`, `320 sm` yoki `3.2 m`. Xona to‘g‘ri burchakli qoladi, yonidagi xona ham birga o‘zgaradi (devorni qo‘lda surgandek). Noto‘g‘ri qiymatga maslahat chiqadi, hech narsa buzilmaydi. Bitta “Bekor qilish” qaytaradi.
- **Rejada devor uzunliklari** (“3 m”, “2,4 m”, “85 sm”) har devor ustida. Sozlamalar → “Devor o‘lchamlari” bilan o‘chiriladi. Juda qisqa devorda yozuv chiqmaydi, Montaj rejimida yashirin.
- O‘lcham hech qachon majburiy emas: 1 reja birligi = 1 sm, shuning uchun chizilgan har bir reja avtomatik o‘lchamga ega. Server/baza o‘zgarmadi.

**Test qilindi**
- Unit: o‘lchamni yozish/o‘qish (m, sm, vergul, ruscha “м/см”), devor uzunligini o‘zgartirish (cho‘zish, qisqartirish, qo‘shni xona, erkin devor), o‘zgargan devorni topish.
- To‘liq E2E 6 profilda: 422 ta o‘tdi. Yangi testlar: devor “3 m” ko‘rinadi → “4” yoziladi → xona 4 m, qo‘shni xona ergashadi, noto‘g‘ri qiymat rad etiladi, “Bekor qilish” qaytaradi; Sozlamalarda o‘chirish saqlanadi.
- Skrinshotlar: `docs/screenshots/phase-18/`.

**Ma’lum cheklovlar**
- Eski loyihalar ham shu masshtabda o‘lchanadi: o‘lchamsiz chizilgan xonalar real o‘lchamga to‘g‘ri kelmasligi mumkin — kerakli devorga uzunlikni yozib to‘g‘rilang.
- Qiya (to‘g‘ri burchakli bo‘lmagan) burchakdagi devorni o‘zgartirganda qo‘shni devor ham qiyalikni saqlab suriladi.
- PDF’da devor uzunliklari hali chiqmaydi.

## Phase 17 — 2026-11-04

**Bajarildi**
- **Windows dasturi** (Tauri v2, `src-tauri/`): kompyuterga o‘rnatiladigan alohida dastur — o‘z oynasi, ish stolida belgi, Start menyusida. Ilovaning o‘zi dastur ichida, shuning uchun **internetsiz ochiladi va to‘liq ishlaydi**; loyihalar kompyuterda saqlanadi.
- Akkaunt bilan kirilsa, internet bo‘lganda loyihalar eplan.itcode.uz ga sinxronlanadi (iPhone/iPad’dagi loyihalar ham shu yerda ko‘rinadi).
- O‘rnatuvchi: `ElektroPlan-Setup.exe` (administrator huquqi kerak emas). GitHub Actions (`.github/workflows/desktop.yml`) Windows’da yig‘adi; `main` ga har push’dan keyin GitHub Releases’ga va saytga (`/download/ElektroPlan-Setup.exe`) joylaydi.
- Saytda: Sozlamalar → “Windows uchun dastur” → **Yuklab olish (.exe)** (kompyuterdan kirilganda).
- Server: Windows dasturi uchun CORS (`tauri.localhost`) va token sessiyasi (`X-Elektroplan-Auth` sarlavhasi). Token faqat dasturga beriladi (`X-Elektroplan-Client: desktop`), veb sayt avvalgidek httpOnly cookie bilan ishlaydi. Chiqish tokenni serverda bekor qiladi.
- Dasturda service worker va “ilovani o‘rnatish” maslahatlari yo‘q; Telegram kabi tashqi havolalar odatiy brauzerda ochiladi.

**Test qilindi**
- Integratsiya (haqiqiy PHP + MariaDB): preflight faqat dastur manziliga ruxsat, ro‘yxatdan o‘tish/kirish token qaytaradi, token bilan `me`/`pull`, chiqishdan keyin token ishlamaydi, vebga token berilmaydi, CSRF sarlavhasisiz POST rad etiladi.
- Unit: token saqlash/tozalash, API manzili, kirish va chiqish, tashqi havolalar.
- Dastur Linux’da (WebKitGTK, virtual ekran) yig‘ilib ishga tushirildi: ochildi → kirish → loyiha yaratildi va serverga yetdi → server o‘chirilib dastur qayta ochildi: loyiha joyida, akkaunt saqlangan. Skrinshotlar: `docs/screenshots/phase-17/`.
- Avvalgi bosqichlar buzilmadi: unit/integratsiya 288 ta, E2E 6 profilda 410 ta — hammasi o‘tdi.
- Windows `.exe` GitHub Actions’da muvaffaqiyatli yig‘ildi (o‘rnatuvchi ~3 MB).

**Ma’lum cheklovlar**
- Dastur imzolanmagan: birinchi ishga tushirishda Windows SmartScreen ogohlantiradi → “Batafsil” → “Baribir ishga tushirish”.
- Avtomatik yangilanish yo‘q: yangi versiya uchun `.exe` ni qayta yuklab o‘rnatish kerak (loyihalar saqlanib qoladi).
- Dastur va brauzerdagi sayt ma’lumotlari alohida: bir kompyuterda ikkalasida ham ishlasangiz, loyihalar akkaunt orqali (yoki zaxira fayl bilan) almashadi.

## Phase 16 — 2026-11-04

**Bajarildi**
- **Rus tili** — butun ilova: menyular, tugmalar, xabarlar, xatolar, chizma asboblari, montaj, admin panel, Pro sahifasi, zaxira, PWA xabarlari va **PDF hisobot**. Elektr atamalari ustalar tilida: Розетка, Двойная розетка, Выключатель, Двухклавишный выключатель, Люстра, Кондиционер…
- **Til tanlash:** Sozlamalar → “Til / Язык” → O‘zbekcha / Русский. Tanlov qurilmada saqlanadi (internetsiz ham ishlaydi), butun ilova darhol o‘tadi, `<html lang>` ham o‘zgaradi.
- **Birinchi ochilishda** telefon tiliga qarab: telefon rus tilida bo‘lsa — ruscha, aks holda — o‘zbekcha.
- Ruscha sonlar to‘g‘ri: 1 комната / 2 комнаты / 5 комнат, 1 проект / 2 проекта (`i18n/plural.ts`).
- Kirill harflari uchun interfeys shriftiga `cyrillic` qo‘shildi; PDF shrifti (Inter) kirill harflarini o‘z ichiga oladi.
- Arxitektura: barcha yozuvlar `uz.*` dan o‘qiladi (komponentlar o‘zgarmadi), `uz` endi joriy til lug‘atiga yo‘naltiradi; lug‘atlar `src/i18n/dict/uz.ts` va `ru.ts`, rus lug‘ati o‘zbekchaga turi bo‘yicha bog‘langan (kalit yetishmasa — kompilyatsiya xatosi). Modul yuklanganda “muzlab qolgan” 10 ta yozuv (holat nomlari, asboblar, ranglar) har safar o‘qiladigan qilindi.

**Test qilindi**
- Unit: lug‘atlar kalitlari bir xil, bo‘sh matn yo‘q, `{n}`/`{name}` o‘rinbosarlari saqlangan, ruscha matnlarning 85 %+ kirillda; til almashtirish; telefon tilidan aniqlash; ruscha ko‘plik (1, 2, 5, 11, 21, 111…).
- E2E 6 profilda: Sozlamalarda ruschaga o‘tish → Loyihalar, Chizma, Montaj ruscha, qayta yuklashda saqlanadi, PDF ruscha yaratiladi, o‘zbekchaga qaytish; telefon tili ru-RU bo‘lsa birinchi ochilishda ruscha.
- Layout auditi **rus tilida** ham 15 qurilmada: 0 muammo (ruscha so‘zlar uzunroq); iPhone SE pastki menyusi uchun qisqa so‘zlar (Смета, Опции).
- Skrinshotlar: `docs/screenshots/phase-16/`.

**Shu bosqichda qo‘shimcha (egasining so‘rovi bilan)**
- **Xona ichidagi xona:** ichki xona devorining **tashqi** tomoniga ham rozetka/viklyuchatel qo‘yiladi (tashqi xonaga tegishli bo‘ladi); oldin faqat ichki tomonga yopishardi.
- **Devor nomi** (ixtiyoriy): devorni tanlang → “Devor nomi” (masalan “TV devori”). Devor ko‘rinishi sarlavhasida va PDF’dagi devor sahifasida ko‘rinadi; bo‘sh qoldirilsa olib tashlanadi; devor surilsa saqlanadi.
- Xona nomini barcha qurilmalarda panel orqali o‘zgartirish e2e testi qo‘shildi (telefon, planshet, iPad, kompyuter).

**Ma’lum cheklovlar**
- Devor bo‘linganda nom uzunroq bo‘lagida qoladi.
- Foydalanuvchi kiritgan matnlar (loyiha, xona nomlari, izohlar) tarjima qilinmaydi.
- Sahifa ochilganda bir lahzaga o‘zbekcha ko‘rinib, so‘ng ruschaga o‘tishi mumkin (statik sahifa o‘zbekcha tayyorlangan).
- Server xatolari kod bilan keladi va ilovada tarjima qilinadi; ilova nomi (manifest) o‘zbekcha qoladi.

## Phase 15 — 2026-11-04

**Bajarildi**
- **Audit** (`scripts/audit-layout.mjs`): 8 ta ekran × 15 ta qurilma o‘lchami — iPhone SE (320 va 375), iPhone 14, iPhone 15 Pro Max, iPhone yotiq holatda, Galaxy S24, Galaxy A55, Galaxy Tab S9, iPad mini (tik/yotiq), iPad Air (tik/yotiq), iPad Pro 13, noutbuk 1366, kompyuter 1920. Avtomatik tekshiradi: ekrandan chiqib ketish, sahifa skroli, barmoq uchun kichik tugmalar (<36 px), juda mayda matn, matn toshib ketishi; har holat skrinshoti.
- **Telefon yotiq holatda** (eng katta muammo edi): Chizma ekranida reja ko‘rinmay qolardi, chap menyu kesilardi, butun sahifa siljirdi. Endi past ekranlar uchun ixcham rejim: menyu ixcham, pastki panel yig‘iladi (tab bosilganda ochiladi), sarlavha ixcham, reja ekranning ~80 % ini oladi, Montaj rejasi ham to‘liq; chizish asboblari ustuni sig‘masa suriladi.
- **Barmoq uchun:** balandlik/masofa maydonlaridagi 16×16 px strelkalar o‘rniga 36×44 px “−” va “+” tugmalari (nuqta xususiyatlari, devor ko‘rinishi, sozlamalar); almashtirgichlar (switch) bosish maydoni kengaytirildi; loyiha nomi havolasi kattaroq.
- **Planshet (Galaxy Tab, iPad mini tik):** loyiha kartalari ikki ustunda siqilib, tugmalar 30 px ga tushardi — endi 1024 px dan keng ekranda ikki ustun.
- Telefon pastki menyusi yozuvlari 10,5 → 11 px; iPhone SE (320 px) da sarlavhadagi o‘qib bo‘lmaydigan “buyurtmachi · manzil” qatori yashiriladi; Pro sahifasidagi uzun tugma matni kichik telefonlarda ikki qatorga o‘tadi.

**Test qilindi**
- Audit tuzatishlardan keyin: **0 muammo** (oldin: yotiq telefonda 8 ekranda sahifa skroli, 6 ekranda mayda matn, 60+ kichik tugma, 3 matn toshishi).
- Yangi `tests/e2e/layout.spec.ts`: 7 ta qurilma × 7 ekran — yon skrol yo‘q, hech narsa ekrandan chiqmaydi, sahifa o‘zi skroll bo‘lmaydi.
- `pnpm test` — 259; `pnpm test:e2e` — 6 profil: 385 o‘tdi; perf testi parallel yuklamada 8 ms chegarasini 0,4 ms ga oshgani uchun chegara 10 ms ga ko‘tarildi (yolg‘iz o‘lchovda ~5 ms).
- Skrinshotlar: `docs/screenshots/phase-15/` (oldin / keyin).

**Ma’lum cheklovlar**
- Telefon yotiq holatda Chizma va Montaj ekranlari vertikal suriladi (reja ekranning katta qismini oladi); reja ustida surish rejani siljitadi, sahifani esa sarlavha qismidan surasiz.
- Haqiqiy qurilmalarda (ayniqsa Samsung brauzeri va iPhone yotiq) ko‘z bilan tekshirish — `docs/MANUAL_TEST.md`.

## Phase 14 — 2026-11-04

**Bajarildi**
- **Admin:** `ADMIN_LOGIN` (GitHub secret) dagi telefon/email bilan kirgan akkaunt admin bo‘ladi. `/admin/` (kompyuter/iPad’da yon menyuda, telefonda Akkaunt sahifasida): ustalar ro‘yxati — ism, telefon/email, ro‘yxatdan o‘tgan sana, oxirgi kirish, loyiha va nuqta soni, montaj foizi, tarif; qidiruv.
- **Pro (99 000 so‘m/oy):** bepul — 1 ta loyiha (hamma imkoniyatlar bilan). Yangi loyiha / nusxa / zaxiradan tiklashda chegara bo‘lsa “Yangi loyiha uchun Pro kerak” oynasi. Server ham tekshiradi (402). Admin: +1 / +3 / +12 oy (joriy muddatga qo‘shiladi), “Pro’ni o‘chirish”. Eski loyihalar saqlanadi va tahrirlanadi.
- **`/pro/` sahifasi:** narx, imkoniyatlar, tarif holati (necha kun qoldi), sotib olish tartibi, akkaunt raqami, admin telefoni / Telegram (`SUPPORT_PHONE`, `SUPPORT_TELEGRAM`). Sidebar’dagi “Yangilash” tugmasi endi shu sahifani ochadi.
- **Parol tiklash:** admin vaqtinchalik parol oladi (masalan `kx7-m2p-9qa`, bir marta ko‘rinadi, nusxa tugmasi), ustaning barcha qurilmalardagi kirishi yopiladi; usta shu parol bilan kirganda majburiy “Yangi parol o‘rnating” oynasi. Akkaunt sahifasida o‘z parolini o‘zgartirish. Har amal `admin_actions` jurnalida.
- Migratsiya `003_admin_pro.sql`; deploy `admin_login` ni config’ga yozadi, kontaktlarni build’ga beradi.

**Test qilindi**
- `pnpm test:coverage` — 259 test (yangi: tarif qoidalari; server: ruxsatlar, bepul cheklov 402, Pro muddatlari, parol tiklash — haqiqiy PHP + MariaDB). `domain/` coverage 95 %.
- `pnpm test:e2e` — 6 profil: **385 o‘tdi, 0 yiqildi** (23 ataylab o‘tkazildi). Yangi: bepul cheklov (yangi loyiha, nusxa), Pro sahifasi; admin → ustani topadi → +1 oy → usta Pro’ni ko‘radi va 3 ta loyiha yaratadi → parol tiklash → usta vaqtinchalik parol bilan kirib, yangi parol o‘rnatadi; oddiy usta admin panelni ko‘rmaydi. Ko‘p loyiha yaratgan eski testlar bepul cheklovga moslandi.
- Skrinshotlar: `docs/screenshots/phase-14/`.

**Ma’lum cheklovlar**
- To‘lov hozircha qo‘lda: usta adminga pul o‘tkazadi, admin Pro’ni yoqadi. Payme/Click onlayn to‘lov — merchant shartnomasidan keyin.
- Pro muddati qurilma vaqti bo‘yicha tekshiriladi (internetsiz ham ishlashi uchun); server baribir o‘zi tekshiradi.

## Phase 13 — keyingi tuzatishlar (GitHub CI, WebKit) — 2026-11-04

- **Topilgan holat:** GitHub CI (iPad/iPhone profillari haqiqiy WebKit’da) phase-4 dan beri qizil edi; oldingi hisobotlardagi “hammasi o‘tdi” faqat lokal Chromium uchun to‘g‘ri edi. Endi CI yashil.
- **Ilovadagi tuzatishlar:**
  - Chizish: har kadrda faqat oxirgi pointer nuqtasi olinardi — tez qo‘lda chizmada (Apple Pencil 240 Hz) shakl buzilishi mumkin edi. Endi kadrdagi barcha nuqtalar (`getCoalescedEvents` ham) ishlatiladi.
  - Zaxira: sahifa ochilib, loyihalar hali yuklanmasdan tiklash bosilsa, qurilmadagi loyiha “yangi” deb hisoblanib, yangiroq ish eski zaxira bilan ustidan yozilishi mumkin edi. Endi zaxira amallari loyihalar yuklanishini kutadi (integratsiya testi bilan).
  - PWA: WebKit birinchi tashrifda noto‘g‘ri “Yangi versiya tayyor” xabarini ko‘rsatardi (tugmalarni to‘sardi). Endi faqat haqiqiy yangilanishda chiqadi.
- **Testlar:** Playwright WebKit oflayn holatda service worker’dan sahifa ocha olmaydi — WebKit profillarida “oflayn” server ulanishini uzish bilan sinaladi; to‘liq samolyot rejimi Chromium profillarida va haqiqiy Safari’da (`docs/MANUAL_TEST.md` §5). Qo‘lda chizish testi har nuqtada brauzerga murojaat qilmaydi.
- CI (`ci-webkit`): 348 o‘tdi, 0 yiqildi.

## Phase 13 — 2026-11-04

**Bajarildi**
- **To‘liq ish ssenariysi** (`tests/e2e/journey.spec.ts`), 6 profilning barchasida, UI orqali chizilgan loyihada: loyiha → 2 xona → rozetka va viklyuchatel (devorga yopishadi) → devor ko‘rinishi → montaj (1/2) → PDF → samolyot rejimi (montaj 2/2, qayta yuklashda saqlanadi) → akkaunt + sinxron (server revision 1, “Sinxronlandi”).
- **Coverage** `src/domain/`: statements 95,4 %, lines 97,8 %, functions 97 %, branches 85 % (`pnpm test:coverage`; CI’da chegara 90 / 90 / 90 / 80 — tushsa CI qizil bo‘ladi). Yangi chekka holat testlari: login normalizatsiyasi, snap (burchak/devor/45°/grid), devor o‘chirish (L-shakl, teskari yo‘nalish, erkin devor), merge (eshik/sozlama konfliktlari), saralash.
- **Performance — Konva layer caching** (`usePlanCache`): reja (xonalar, devorlar, yozuvlar, nuqtalar soyasi bilan) ko‘rinadigan maydon + atrofi bilan bitmap’ga keshlanadi; surishda faqat rasm siljiydi, chegaradan chiqilsa darhol qayta quriladi; tahrirda aniq vektor, to‘xtaganda qayta kesh. Bitmap hajmi iPad/iPhone xotira chegarasida (≤ 16 Mpx). Nuqta soyasi chiziq uchun ikki marta chizilmaydi, devor qidiruvi Map orqali.
  - 500 nuqtali loyiha (20 xona), kadr boshiga asosiy oqim ishi (JS + canvas): **24–27 ms → 3–7 ms** (60 fps byudjeti 16,7 ms). Kadr tezligi endi deyarli bo‘sh loyiha bilan bir xil (shu konteynerda GPU yo‘q: bo‘sh loyiha ham 39–53 fps; haqiqiy iPad’da 60 fps kutiladi — `docs/MANUAL_TEST.md` 2.7).
  - `tests/e2e/perf.spec.ts` buni har safar tekshiradi.
- **Bundle:** Montaj sahifasi Konva’ni keraksiz statik yuklardi (rang konstantasi sabab) — 339 kB → **239 kB** first load. PDF kutubxonalari (pdf-lib, fontkit) faqat “Eksport PDF” bosilganda yuklanadi; Konva faqat reja ko‘rinadigan sahifalarda.
- **A11y:** kontrast WCAG AA ga keltirildi (`--primary` #1f6fff → #1c69f7: oq matn 4,4 → 4,8:1; `--text-dim` #6b7a96 → #7887a3: 4,0 → 4,8:1 — ko‘zga deyarli sezilmaydi, DESIGN_SYSTEM yangilandi); har qanday klaviatura fokusida ko‘rinadigan halqa. `tests/e2e/a11y.spec.ts`: 7 ekranning barchasida har tugma/havola/maydon nomlangan, bitta h1, `lang="uz"`; Tab asosiy amallarga yetadi, fokus doim ko‘rinadi, Enter dialogni ochadi, Esc yopadi.
- **Qo‘lda tekshiruv ro‘yxati:** `docs/MANUAL_TEST.md` — iPad (Pencil, kaft), iPhone, Android, Windows uchun 40+ qadam (o‘rnatish, chizma, nuqtalar, montaj, PDF, zaxira, samolyot rejimi, ikki qurilma sinxroni, a11y).
- README va hujjatlar yakuniy yangilandi. `@vitest/coverage-v8` dev-paketi qo‘shildi (faqat coverage o‘lchash uchun, ilovaga kirmaydi).

**Test qilindi**
- `pnpm test:coverage` — 247 test, chegaralar o‘tdi. `php -l` toza.
- `pnpm test:e2e` — barcha 6 profil: **367 o‘tdi, 0 yiqildi**, 23 ataylab o‘tkazildi (perf/a11y klaviatura testlari faqat tegishli profillarda, iOS testlari faqat iOS’da va h.k.). Barcha avvalgi bosqichlar qayta o‘tdi.
- **Topilib tuzatilgan muhim xato (avtosaqlash):** sinxron yoki “Saqlash” IndexedDB yozuvini boshlagan paytda sahifa yopilsa (navigatsiya, ilovani yopish), brauzer bu yozuvni bekor qilishi mumkin edi va oxirgi tahrir (masalan, montaj holati) journal’ga ham tushmasdi. Endi davom etayotgan yozuv ham journal’ga yoziladi. Ikki qurilma sinxron testi 6 tadan 1 marta yiqilayotgan edi — tuzatishdan keyin 24/24 o‘tdi; integratsiya testi qo‘shildi (tuzatishsiz yiqiladi).

**Ma’lum cheklovlar**
- 60 fps haqiqiy qurilmada ko‘z bilan tasdiqlanishi kerak (bu konteynerda GPU yo‘q). Juda katta ekranlarda (4K, dpr 2) kesh o‘chadi va reja vektor chiziladi.
- Uzoq zoom-out paytida (dekoratsiya o‘lchami o‘zgaradi) kesh qayta quriladi — qisqa sekinlashuv mumkin.
- Haqiqiy qurilmalardagi qo‘lda tekshiruv va hostmaster.uz’dagi tekshiruv — deploy secrets qo‘shilgandan keyin.

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
