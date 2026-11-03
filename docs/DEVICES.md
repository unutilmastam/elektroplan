# ELEKTROPLAN — Qurilmalar (iPad birinchi o‘rinda)

Ilova bitta kod bazasi — PWA. Har qurilmada brauzer orqali ochiladi va “ilova” sifatida o‘rnatiladi.

| Qurilma | Ustuvorlik | O‘rnatish | Asosiy kiritish |
|---|---|---|---|
| **iPad** (Safari) | **1 — asosiy** | Ulashish → “Bosh ekranga qo‘shish” | Barmoq, Apple Pencil, Magic Keyboard/trackpad |
| iPhone (Safari) | 2 | Ulashish → “Bosh ekranga qo‘shish” | Barmoq |
| Android (Chrome) | 3 | “Ilovani o‘rnatish” taklifi | Barmoq, stilus |
| Windows (Edge/Chrome) | 4 | Manzil satridagi “O‘rnatish” | Sichqoncha, klaviatura, sensorli ekran/pero (Surface) |

**Qoida:** maket qurilma nomiga emas, **ekran kengligiga** qarab o‘zgaradi (iPad Split View’da kenglik telefonnikidek bo‘lishi mumkin). Har ikki orientatsiya (portret/landshaft) qo‘llab-quvvatlanadi.

## 1. Maketlar (breakpoint’lar)

| Kenglik | Kim | Maket |
|---|---|---|
| < 600 | iPhone, Android telefon, iPad Split View ⅓ | Pastki navigatsiya, to‘liq ekran canvas, panellar = bottom sheet |
| 600–1023 | iPad portret, iPad mini, Android planshet, Split View ½ | Chapda ikonkali rail (72px), o‘ng panel = slide-over, pastki qator = tablar |
| 1024–1279 | **iPad landshaft (asosiy)**, kichik noutbuk | Referens maket, sidebar 72px rail, o‘ng panel 260px, pastki qator 3 ta panel (siqilgan) |
| ≥ 1280 | iPad Pro 13" landshaft, Windows | To‘liq referens maket (sidebar 230px) |

**Dizayn tekshiruvi asosiy kadrlari:** iPad Air 11" landshaft **1180×820**, iPad Pro 13" landshaft **1366×1024**, iPad portret **820×1180**, iPhone **390×844**, Android **412×915**, Windows **1920×1080**.

## 2. iPad (asosiy)

- **Apple Pencil:** `pointerType === 'pen'` → chizish/joylashtirish. Pencil faol bo‘lganda bitta barmoq teginishi chizmaydi (kaft rad etish), lekin ikki barmoq pan/zoom ishlaydi. Sozlamalarda: “Faqat Pencil bilan chizish” (yoqiq / o‘chiq).
- **Pencil hover** (iPad Pro, M2+): kursor ostidagi devor/snap nuqtasi oldindan ko‘rsatiladi (`pointermove` bosimsiz).
- **Magic Keyboard / trackpad:** klaviatura yorliqlari (V tanlash, R xona, W devor, Space+drag pan, ⌘Z / ⇧⌘Z, ⌫ o‘chirish, ⌘D nusxa), trackpad pinch-zoom (`wheel` + `ctrlKey`), hover holatlari.
- **Stage Manager / Split View:** oyna o‘lchami o‘zgarganda canvas `ResizeObserver` bilan qayta o‘lchanadi, viewport saqlanadi.
- Safari’ning o‘z zoom/scroll gestlari canvas ustida o‘chiriladi: `touch-action: none` faqat canvas’da; `gesturestart` preventDefault.
- Matn tanlash va uzoq bosish menyusi canvas va tugmalarda o‘chiriladi (`user-select: none`, `-webkit-touch-callout: none`).
- Uzoq bosish (500 ms) = kontekst menyu (nusxa, o‘chirish, xususiyatlar) — sichqonchadagi o‘ng tugma o‘rnida.

## 3. iPhone

- `viewport-fit=cover`, `env(safe-area-inset-*)` — “chelka” va pastki indikator ostida kontent qolmaydi.
- `100dvh`, Safari panellari ochilib-yopilganda maket sakramaydi.
- Input shrifti ≥ 16px (Safari avtomatik kattalashtirmasligi uchun). Raqam maydonlari `inputmode="numeric"`.
- Asosan **Montaj rejimi** va ko‘rish uchun optimallashtiriladi; chizish ham mumkin, lekin soddalashtirilgan.
- Bir qo‘l bilan: asosiy tugmalar pastki yarmida.

## 4. Android

- `beforeinstallprompt` → “Ilovani o‘rnatish” tugmasi.
- Tizimning “Orqaga” tugmasi/gesti avval ochiq bottom sheet/dialogni yopadi (`history.pushState` bilan), keyin sahifadan chiqadi.
- Maskable ikonka, `theme_color` = `#05080f`.
- Turli DPI: canvas `pixelRatio = devicePixelRatio` (max 3).

## 5. Windows

- Sichqoncha: g‘ildirak = kursorga zoom, o‘rta tugma/Space+drag = pan, o‘ng tugma = kontekst menyu.
- Klaviatura yorliqlari Ctrl bilan (Ctrl+Z, Ctrl+Y, Ctrl+D, Ctrl+S).
- Sensorli noutbuk va Surface Pen — iPad’dagi bilan bir xil Pointer Events mantiqi.
- Edge/Chrome’da PWA alohida oynada ochiladi; oyna kichraytirilsa planshet maketiga o‘tadi.
- PDF to‘g‘ridan-to‘g‘ri yuklab olinadi; iOS’da esa Ulashish oynasi orqali (Fayllar, Telegram).

## 6. Barcha qurilmalar uchun umumiy

- Faqat **Pointer Events** (`pointerdown/move/up/cancel`) — sichqoncha, barmoq, pero bitta kod yo‘lidan o‘tadi.
- Teginish nishonlari ≥ 44×44 px; kursor qurilmalarida hover effektlari (`@media (hover: hover)`).
- `prefers-reduced-motion` hurmat qilinadi.
- Offline va saqlash har qurilmada bir xil (IndexedDB + service worker). iOS’da ma’lumot o‘chib ketmasligi uchun ilovani **Bosh ekranga qo‘shish** tavsiya qilinadi (ilova bir marta eslatadi).
- Safari 16.4+, Chrome/Edge 110+ qo‘llab-quvvatlanadi.

## 7. Test matritsasi (Playwright)

`playwright.config.ts` loyihalari: `ipad-landscape` (1180×820, touch), `ipad-portrait` (820×1180, touch), `ipad-pro-13` (1366×1024), `iphone` (devices['iPhone 14']), `android` (devices['Pixel 7']), `desktop-windows` (1920×1080, Chromium). Har bosqich e2e testlari barcha loyihalarda o‘tishi shart. WebKit dvigateli iPad/iPhone uchun majburiy.
