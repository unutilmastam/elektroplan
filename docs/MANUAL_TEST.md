# ELEKTROPLAN — haqiqiy qurilmalarda qo‘lda tekshiruv ro‘yxati

Avtomatik testlar (Playwright, 6 profil) emulyatsiyada ishlaydi. Har reliz oldidan quyidagini **haqiqiy qurilmada** bajaring va natijani belgilang (✅ / ❌ + izoh). Sayt HTTPS’da bo‘lishi shart (service worker).

Qurilmalar: **iPad** (Safari, Apple Pencil, Magic Keyboard bo‘lsa), **iPhone** (Safari), **Android** telefon (Chrome), **Windows** (Edge yoki Chrome, sichqoncha + klaviatura; Surface bo‘lsa pero ham).

## 0. O‘rnatish va saqlash

| # | Qadam | Kutilgan natija | iPad | iPhone | Android | Windows |
|---|---|---|---|---|---|---|
| 0.1 | Saytni birinchi marta oching | Bosh sahifa, xatosiz | | | | |
| 0.2 | iOS: “Bosh ekranga qo‘shing” eslatmasi | Bir marta chiqadi, “Tushunarli” dan keyin chiqmaydi | | | — | — |
| 0.3 | O‘rnatish: iOS Ulashish → Bosh ekranga qo‘shish; Android/Windows: Sozlamalar › Ilova › “Ilovani o‘rnatish” | Ilova belgisi (uy + chaqmoq) bilan alohida oynada ochiladi | | | | |
| 0.4 | O‘rnatilgan ilovani oching | To‘liq ekran, status bar to‘qnashmaydi (notch / home indicator) | | | | |

## 1. Loyiha va chizma

| # | Qadam | Kutilgan natija | iPad | iPhone | Android | Windows |
|---|---|---|---|---|---|---|
| 1.1 | Loyihalar › Yangi loyiha (nom, buyurtmachi, manzil) | Chizmaga o‘tadi | | | | |
| 1.2 | To‘rtburchak xona: barmoq/Pencil/sichqoncha bilan torting | Xona chiziladi, o‘lcham so‘ralmaydi | | | | |
| 1.3 | Qo‘lda chizish: qiyshiq to‘rtburchak chizing | Toza to‘g‘ri burchakli xonaga aylanadi; bitta “Bekor qilish” asl chizmani qaytaradi | | | | |
| 1.4 | Ikkinchi xonani birinchisiga yopishtirib chizing | Umumiy devor bitta | | | | |
| 1.5 | iPad: Pencil bilan chizish + kaftni ekranga qo‘yish | Kaft hech narsa chizmaydi | | — | — | — |
| 1.6 | Ikki barmoq: pinch zoom, surish | Silliq (qotmasdan), plan sakramaydi | | | | |
| 1.7 | Uzoq bosish (500 ms) xonada | Kontekst menyu | | | | — |
| 1.8 | Klaviatura: V, R, W, ⌘/Ctrl+Z, ⇧⌘Z, Delete, Space+surish | Har biri ishlaydi | (klaviatura bo‘lsa) | — | — | |
| 1.9 | Eshik va deraza qo‘ying | Devor ochiladi, eshik yoyi ko‘rinadi | | | | |

## 2. Nuqtalar va devor ko‘rinishi

| # | Qadam | Kutilgan natija | iPad | iPhone | Android | Windows |
|---|---|---|---|---|---|---|
| 2.1 | Rozetka belgisini tanlab devor yoniga teging | Devorga yopishadi, balandligi 30 sm | | | | |
| 2.2 | Lyustra xona o‘rtasiga | Shipga, devorsiz | | | | |
| 2.3 | Nuqtani boshqa devorga suring | Qayta yopishadi | | | | |
| 2.4 | Xususiyatlar: balandlik, izoh, rang | Saqlanadi, devor ko‘rinishida yangilanadi | | | | |
| 2.5 | Devor ko‘rinishi: nuqtani sudrab balandlik/masofa o‘zgartiring | Reja ham yangilanadi | | | | |
| 2.6 | To‘liq ekran devor ko‘rinishi, devorlar orasida o‘tish | Ishlaydi | | | | |
| 2.7 | **500 nuqtali loyiha** (zaxira fayldan tiklang) — surish va zoom | Ko‘z bilan silliq (≈60 fps), qotish yo‘q | | | | |

## 3. Montaj rejimi

| # | Qadam | Kutilgan natija | iPad | iPhone | Android | Windows |
|---|---|---|---|---|---|---|
| 3.1 | “Montaj rejimi” tugmasi | Ro‘yxat + reja, progress | | | | |
| 3.2 | “Keyingi bajarilmagan nuqta” → “Bajarildi” (qo‘lqop bilan ham) | Tugmalar katta, bosiladi; progress oshadi | | | | |
| 3.3 | Ilovani yoping (home gesture) va qayta oching | Holat saqlangan | | | | |
| 3.4 | Montajda nuqtani sudrab ko‘ring | Nuqta siljimaydi, reja suriladi | | | | |

## 4. PDF va zaxira

| # | Qadam | Kutilgan natija | iPad | iPhone | Android | Windows |
|---|---|---|---|---|---|---|
| 4.1 | Eksport PDF | iOS/Android: Ulashish oynasi (Fayllar, Telegram); Windows: yuklab olinadi | | | | |
| 4.2 | PDF’ni oching | Muqova, reja, jadval, devorlar, belgilar; o‘zbek harflari to‘g‘ri | | | | |
| 4.3 | Sozlamalar › Barcha loyihalarni saqlash | `.elektroplan.json` fayl | | | | |
| 4.4 | Boshqa qurilmada Zaxiradan tiklash | Loyihalar paydo bo‘ladi | | | | |

## 5. Internetsiz (samolyot rejimi)

| # | Qadam | Kutilgan natija | iPad | iPhone | Android | Windows |
|---|---|---|---|---|---|---|
| 5.1 | Samolyot rejimini yoqing, ilovani yoping va oching | Ilova ochiladi, “Oflayn” belgisi | | | | |
| 5.2 | Loyihalar ro‘yxati, loyihani oching, xona chizing, nuqta qo‘ying | Hammasi ishlaydi | | | | |
| 5.3 | Montajda holat belgilang | Saqlanadi | | | | |
| 5.4 | PDF eksport | PDF chiqadi | | | | |
| 5.5 | Yangi loyiha yarating | Yaratiladi | | | | |

## 6. Akkaunt va sinxronizatsiya

| # | Qadam | Kutilgan natija | iPad | iPhone | Android | Windows |
|---|---|---|---|---|---|---|
| 6.1 | Akkaunt › Yangi akkaunt (telefon raqam) | Kiriladi; lokal loyihalar “akkauntga biriktirildi” | | | | |
| 6.2 | Ikkinchi qurilmada shu akkauntga kiring | Barcha loyihalar yuklanadi | | | | |
| 6.3 | Ikkala qurilmada samolyot rejimi; bir loyihada turli narsalarni o‘zgartiring (nom / manzil / holat) | — | | | | |
| 6.4 | Ikkalasida internetni yoqing, 10–20 s kuting | Ikkala o‘zgarish ikkala qurilmada; “Sinxronlandi” | | | | |
| 6.5 | Noto‘g‘ri parol 11 marta | “Juda ko‘p urinish” | | | | |
| 6.6 | Chiqish | Loyihalar qurilmada qoladi | | | | |

## 7. Kirish imkoniyati (a11y)

| # | Qadam | Kutilgan natija | iPad | iPhone | Android | Windows |
|---|---|---|---|---|---|---|
| 7.1 | VoiceOver / TalkBack / Narrator bilan Loyihalar va Montaj | Tugmalar o‘zbekcha nomlanadi | | | | |
| 7.2 | Faqat klaviatura (Tab / Enter / Esc) | Fokus halqasi doim ko‘rinadi, dialog Esc bilan yopiladi | (klaviatura) | — | — | |
| 7.3 | Matn kattaligi (iOS Dynamic Type / brauzer 200 %) | Matn qirqilmaydi, sahifa buzilmaydi | | | | |

Tekshiruvchi: __________  Sana: __________  Versiya (commit): __________
