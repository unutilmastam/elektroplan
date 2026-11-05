# ELEKTROPLAN — Design system

Reference: `docs/design/reference-dashboard.png`. Match it; do not redesign.

## 1. Color tokens (`src/styles/globals.css`)

```css
:root {
  /* surfaces */
  --bg:            #05080f;   /* app background, near-black navy */
  --bg-elevated:   #0a1120;   /* sidebar, header strip */
  --panel:         rgba(17, 26, 46, 0.72);  /* glass panels */
  --panel-solid:   #111a2e;
  --panel-border:  rgba(120, 150, 210, 0.14);
  --canvas:        #0b1322;   /* floor plan background */
  --grid-line:     rgba(90, 120, 180, 0.10);

  /* brand */
  --primary:       #1c69f7;   /* electric blue (WCAG AA: white text 4.8:1) — active nav, Montaj rejimi, selected tab */
  --primary-hi:    #3b8bff;
  --primary-glow:  rgba(31, 111, 255, 0.45);

  /* text */
  --text:          #eef3ff;
  --text-muted:    #9aa8c4;
  --text-dim:      #7887a3;   /* AA 4.8:1 on panels */

  /* plan */
  --wall:          #e6ebf3;   /* light grey/white walls */
  --wall-window:   #8a95a8;
  --room-label:    #f2f5fb;

  /* status */
  --success:       #22c55e;   /* Bajarilgan, Loyiha tayyor */
  --warning:       #f59e0b;   /* Qolgan, in progress */
  --danger:        #ef4444;   /* O'chirish, switch symbols */
  --pro-gold:      #facc15;   /* Pro versiya, Yangilash, lyustra */

  /* point swatches (Rang) */
  --swatch-blue:   #3b8bff;
  --swatch-red:    #ef4444;
  --swatch-green:  #16a34a;
  --swatch-yellow: #facc15;
  --swatch-purple: #8b5cf6;
}
```

Dark theme only (spec: premium dark). PDF export uses a separate light print palette.

## 2. Surfaces

- **Glass panel:** `background: var(--panel); backdrop-filter: blur(14px); border: 1px solid var(--panel-border); border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.04);`
- **Primary button:** solid `--primary`, radius 10px, glow `0 0 18px var(--primary-glow)` on hover.
- **Secondary button:** `--panel-solid` + border, white text + icon (Saqlash, Eksport PDF, Nusxa).
- **Danger button:** dark red tint background `rgba(239,68,68,.12)`, red border/text (O'chirish).
- **Active nav item:** blue gradient pill `linear-gradient(90deg, #1c69f7, #1a4fc4)` with glow.
- **Symbol bar chip:** outlined chip, active = solid blue.
- **Success CTA:** dark green `rgba(34,197,94,.15)` + green border + check icon (Loyiha tayyor).
- Radii: panels 16, buttons 10, chips 10, inputs 8. Spacing scale 4/8/12/16/24.
- Motion: 150–200 ms ease-out for hover/press; panels slide 220 ms; progress ring animates on change. Respect `prefers-reduced-motion`.

## 3. Typography

- Font: **Inter** (next/font), weights 400/500/600/700. Tabular numbers for counts and heights.
- Logo "ElektroPlan": 26px/700, "Elektro" white + "Plan" `--primary-hi`; subtitle "Smart Electric Project" 13px muted. Logo icon: house outline + lightning bolt, orange-gold gradient (`#f59e0b → #facc15`).
- Project title 24px/600, panel titles 16px/600, body 14px, captions 12px.

## 4. Layout (desktop ≥1280, matches reference)

```
┌────────┬───────────────────────────────────────────────────────────────┐
│        │ Header: [folder] Yangi loyiha ✎ / Buyurtmachi | Manzil         │
│ Side   │                     [Saqlash] [Eksport PDF] [Montaj rejimi ▶]  │
│ bar    ├───────────────────────────────────────────────────────────────┤
│ 230px  │ Symbol bar: Rozetka · Ikki rozetka · Viklyuchatel · Internet · │
│        │             TV · Lyustra · LED · Boshqa                        │
│ Logo   ├────┬──────────────────────────────────────────┬───────────────┤
│ Nav ×6 │Tool│        Floor plan canvas (Konva)          │ Tanlangan     │
│        │bar │                                          │ nuqta panel   │
│ Jami   │ 64 │                                          │ 270px         │
│ loyiha │    │                                          │               │
│ Pro    ├────┴──────────┬───────────────────────────────┼───────────────┤
│ User   │ Xonalar       │ Devor ko'rinishi (Zal – Shimol│ Loyiha holati │
│        │ ro'yxati      │ devori)            [4 nuqta]  │ ring + counts │
└────────┴───────────────┴───────────────────────────────┴───────────────┘
```

Left drawing toolbar (top → bottom): Tanlash (cursor), Ramka tanlash (marquee), Siljitish (move/pan), — Bekor qilish (undo), Qaytarish (redo), — Kattalashtirish (+), Kichiklashtirish (−), Ekranga sig'dirish (fit).

## 5. Symbols (SVG, 24×24 viewBox, rendered on rounded-square badge)

| id | UI name | Glyph | Badge color |
|---|---|---|---|
| socket-single | Rozetka | circle with two pins | blue |
| socket-double | Ikki rozetka | two circles side by side | blue |
| socket-triple | Uch rozetka | three circles | blue |
| socket-quad | To‘rt rozetka | four circles, 2×2 | blue |
| switch-single | Viklyuchatel | rocker plate | red |
| switch-double | Ikki klavishli viklyuchatel | split rocker | red |
| internet | Internet | RJ45 / globe | blue |
| tv | TV | screen with "TV" | purple |
| ceiling-light | Lyustra | circle with ✕ (standard plan symbol) | yellow outline |
| led | LED | dashed strip | yellow |
| ac | Konditsioner | unit with snowflake lines | teal `#14b8a6` |
| custom | Boshqa | dots / user label | grey |

No emoji anywhere. Badge: 22–26px, radius 6, fill = color at 85%, 1px lighter border, white glyph.

## 6. UI strings (`src/i18n/uz.ts`, initial set)

Nav: Bosh sahifa · Loyihalar · Chizma · Montaj rejimi · Materiallar · Sozlamalar
Header: Yangi loyiha · Buyurtmachi · Manzil · Saqlash · Eksport PDF · Montaj rejimi
Panel: Tanlangan nuqta · Pol'dan balandlik · Chap burchakdan · Izoh · Rang · O'chirish · Nusxa · sm
Bottom: Xonalar ro'yxati · nuqta · Devor ko'rinishi · Loyiha holati · Bajarilgan · Qolgan · Jami · Loyiha tayyor
Status: Kutilmoqda · Jarayonda · Bajarildi
Sidebar cards: Jami loyihalar · Pro versiya · Ko'proq imkoniyatlar · Yangilash · Usta Elektrik · Elektr montaj ustasi
Generic: Saqlandi · Saqlanmoqda… · Oflayn · Sinxronlandi · Keyingi bosqichda

## 7. Devices

iPad is the primary device. Breakpoints, Pencil/keyboard/trackpad behaviour, iPhone safe areas, Android back button, Windows mouse rules and the test matrix are defined in `docs/DEVICES.md`. Same visual identity on every device; panel behaviour changes, not the style.
