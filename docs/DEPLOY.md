# ELEKTROPLAN — hostmaster.uz'ga joylashtirish

Kod GitHub'da (`unutilmastam/elektroplan`). Har `main` ga push bo‘lganda GitHub Actions avtomatik ravishda saytni cPanel’ga yuklaydi. Kompyuter kerak emas.

## 1. cPanel’da bir marta qilinadigan ishlar

1. **Subdomen:** cPanel → Domains → masalan `elektroplan.itcode.uz`. Document root: `public_html/elektroplan` (yoki o‘zingiz tanlagan papka).
2. **SSL:** cPanel → SSL/TLS Status → AutoSSL (PWA va service worker faqat HTTPS’da ishlaydi).
3. **PHP versiyasi:** cPanel → MultiPHP Manager → subdomen uchun **PHP 8.1+**.
4. **MySQL:** cPanel → MySQL Databases → baza `xxx_elektroplan`, foydalanuvchi, unga ALL PRIVILEGES. Kodlash `utf8mb4`.
5. **FTP akkaunt:** cPanel → FTP Accounts → faqat subdomen papkasiga ruxsat bilan alohida akkaunt.

## 2. GitHub Secrets

Repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Misol |
|---|---|
| `FTP_SERVER` | `ftp.itcode.uz` |
| `FTP_USERNAME` | `deploy@elektroplan.itcode.uz` |
| `FTP_PASSWORD` | •••• |
| `FTP_DIR` | `/` (FTP akkaunt subdomen papkasiga bog‘langan bo‘lsa) |
| `DB_HOST` | `localhost` |
| `DB_NAME` | `xxx_elektroplan` |
| `DB_USER` | `xxx_elektro` |
| `DB_PASS` | •••• |
| `MIGRATE_TOKEN` | uzun tasodifiy satr |
| `SITE_URL` | `https://elektroplan.itcode.uz` (ixtiyoriy: berilsa, har deploydan keyin migratsiya avtomatik qo‘llanadi) |

## 3. Workflow (`.github/workflows/deploy.yml`, PHASE 1 da qo‘shiladi)

```yaml
name: Deploy to hostmaster
on:
  push: { branches: [main] }
  workflow_dispatch: {}
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck && pnpm lint && pnpm test
      - run: pnpm build            # next build → out/
      - name: Assemble upload folder
        run: |
          mkdir -p deploy/api
          cp -r out/. deploy/
          rsync -a --exclude tests --exclude config.example.php server/ deploy/api/
      - name: Write api/config.php from secrets
        env:
          DB_HOST: ${{ secrets.DB_HOST }}
          DB_NAME: ${{ secrets.DB_NAME }}
          DB_USER: ${{ secrets.DB_USER }}
          DB_PASS: ${{ secrets.DB_PASS }}
          MIGRATE_TOKEN: ${{ secrets.MIGRATE_TOKEN }}
        run: |
          php -r '$c=["db_host"=>getenv("DB_HOST"),"db_name"=>getenv("DB_NAME"),"db_user"=>getenv("DB_USER"),"db_pass"=>getenv("DB_PASS"),"migrate_token"=>getenv("MIGRATE_TOKEN")]; file_put_contents("deploy/api/config.php","<?php return ".var_export($c,true).";\n");'
      - uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./deploy/
          server-dir: ${{ secrets.FTP_DIR }}
          protocol: ftps
```

> PHASE 1 da bu fayl yakuniy holatga keltiriladi (config.php’ni xavfsiz yozish, `.htaccess` bilan himoya). Yuqoridagisi — yo‘nalish.

## 4. Baza migratsiyasi

`SITE_URL` secret berilgan bo‘lsa, deploy oxirida `api/migrate` avtomatik chaqiriladi va `api/health` tekshiriladi. Aks holda:

Deploydan keyin brauzerda bir marta:
`https://elektroplan.itcode.uz/api/migrate?token=<MIGRATE_TOKEN>` — `server/migrations/` dagi yangi SQL fayllarni qo‘llaydi. (Yoki cPanel → phpMyAdmin → Import → `001_init.sql`.)

## 5. `.htaccess` (frontend, `public/.htaccess`)

- HTTP → HTTPS yo‘naltirish.
- `/api/*` → `api/index.php`.
- Statik eksport sahifalari: `/projects` → `/projects.html` (`trailingSlash: true` bilan papkalar ishlatiladi).
- `sw.js`, `manifest.webmanifest`, `*.html` — `Cache-Control: no-cache`; `/_next/static/*` — 1 yil immutable.

## 6. Tekshirish

- Saytni oching → sozlamalar → “Bosh ekranga qo‘shish”.
- Samolyot rejimini yoqing → ilovani oching → loyihalar ro‘yxati va loyiha ochilishi kerak.

## 7. Server API (PHASE 12)

- `public_html/api/` — `server/` papkasi: `index.php` (router), `lib/` (PDO, auth, sync), `migrations/`. `config.php` faqat deployda secrets’dan yoziladi; `.htaccess` `config.php`, `lib/`, `migrations/` ga kirishni yopadi.
- Talab: PHP 8.1+ (`pdo_mysql`), MySQL 5.7+ / MariaDB 10.2+ (utf8mb4).
- Tekshirish: `https://<sayt>/api/health` → `{"ok":true}`.
- Lokal: `scripts/test-db.sh start` (MariaDB 3307 portda) → `EP_DB_HOST=127.0.0.1 EP_DB_PORT=3307 EP_DB_USER=root EP_DB_NAME=ep_dev php server/migrate.php` → `php -S 127.0.0.1:4175 server/index.php`.
