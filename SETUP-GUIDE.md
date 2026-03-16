# 🖥️ COMMAND CENTER — UZSTĀDĪŠANAS INSTRUKCIJA

## Ko tu dabūsi
Cyberpunk dashboardu uz 90" TV ar:
- Gmail nelasītajiem e-pastiem + AI ieteikumiem
- Google Calendar 3 dienu skatījumu
- ClickUp komandas uzdevumiem
- Sociālo tīklu statistiku
- Google Analytics live datiem
- Arēnas rezervāciju datiem

---

## SOLIS 1: GitHub konts (5 min)

1. Atver https://github.com
2. Klikšķini "Sign up"
3. Ievadi e-pastu, paroli, lietotājvārdu
4. Apstiprini e-pastu

## SOLIS 2: Augšupielādē kodu GitHub (3 min)

1. GitHub lapā klikšķini "+" augšā pa labi → "New repository"
2. Nosaukums: `command-center`
3. Izvēlies "Private"
4. Klikšķini "Create repository"
5. Tad klikšķini "uploading an existing file"
6. Ievelc VISUS failus no šīs mapes (izņemot node_modules)
7. Klikšķini "Commit changes"

## SOLIS 3: Vercel konts un deploy (5 min)

1. Atver https://vercel.com
2. Klikšķini "Sign Up" → "Continue with GitHub"
3. Atļauj Vercel pieeju tavam GitHub
4. Klikšķini "Add New Project"
5. Izvēlies `command-center` repozitoriju
6. Klikšķini "Deploy"
7. Pagaidi 1-2 minūtes — tava lapa būs gatava!

## SOLIS 4: Pieliec API atslēgas (10 min)

Vercel projektā:
1. Ej uz "Settings" → "Environment Variables"
2. Pievieno katru mainīgo:

### Anthropic (Claude AI)
- Atver https://console.anthropic.com
- Izveido API key
- Vercel pieliec: `ANTHROPIC_API_KEY` = tavs atslēga

### Google Sheets (SocialBlade + Rezervācijas)
- Atver https://console.cloud.google.com
- Izveido projektu
- Ieslēdz "Google Sheets API"
- Izveido API key
- Vercel pieliec: `GOOGLE_SHEETS_API_KEY` = tavs atslēga
- Vercel pieliec: `SHEET_ID_SOCIALBLADE` = tavas Sheet ID
- Vercel pieliec: `SHEET_ID_RESERVATIONS` = tavas Sheet ID

### Google Analytics 4
- Google Cloud Console → Ieslēdz "Google Analytics Data API"
- Izveido Service Account → Lejupielādē JSON
- Vercel pieliec: `GA4_CREDENTIALS_JSON` = JSON saturs
- Vercel pieliec: `GA4_PROPERTY_ID_VL` = tavs VL property ID
- Vercel pieliec: `GA4_PROPERTY_ID_DA` = tavs DA property ID
- Vercel pieliec: `GA4_PROPERTY_ID_MO` = tavs MO property ID

3. Pēc visu mainīgo pievienošanas klikšķini "Redeploy"

## SOLIS 5: TV iestatīšana (2 min)

1. Smart TV atver pārlūku (Samsung: "Internet", LG: "Web Browser")
2. Ievadi savu Vercel URL: `https://command-center-xxx.vercel.app`
3. Ieslēdz pilnekrāna režīmu (parasti F11 vai pārlūka iestatījumos)
4. Gatavs! Lapa automātiski atjaunosies ik 5 minūtes.

### Padomi TV:
- Saglabā URL kā grāmatzīmi lai ātri atgrieztos
- Ieslēdz "Screen saver off" TV iestatījumos
- Ja TV izslēdzas — iestati "Always on" vai taimeri

---

## ATJAUNOŠANAS GRAFIKS

| Dati | Avots | Biežums | Izmaksas |
|------|-------|---------|---------|
| E-pasti + AI | Claude API | Ik 30 min (darba dienās 8:30-18:00) | ~$15-40/mēn |
| Kalendārs | Claude API | Kopā ar e-pastiem | ↑ iekļauts |
| ClickUp uzdevumi | Claude API | Kopā ar e-pastiem | ↑ iekļauts |
| Sociālie tīkli | Google Sheets | Ik 1h | bezmaksas |
| Arēnas rezervācijas | Google Sheets | Ik 15 min | bezmaksas |
| Analytics live | GA4 API | Ik 5 min | bezmaksas |

---

## PROBLĒMU RISINĀŠANA

**Lapa nerādās uz TV:**
- Pārbaudi URL pareizību
- Pamēģini citā ierīcē (telefonā/datorā) — ja tur strādā, problēma TV pārlūkā

**Dati nav live (rāda "mock"):**
- Pārbaudi vai API atslēgas ir pareizas Vercel Settings
- Pārbaudi Vercel logus: Deployments → pēdējais → Functions logs

**E-pastiem nav AI ieteikumu:**
- Pārbaudi ANTHROPIC_API_KEY
- Pārbaudi vai Claude API kontā ir kredīts

---

## FAILU STRUKTŪRA

```
dashboard/
├── app/
│   ├── layout.js          ← HTML skelets + auto-refresh
│   ├── page.js            ← GALVENAIS — cyberpunk dashboards
│   └── api/
│       └── dashboard/
│           └── route.js   ← Datu API — orķestrē visu
├── lib/
│   ├── mock-data.js       ← Testa dati (aizstāj ar live)
│   ├── claude-fetcher.js  ← Claude API + MCP zvani
│   ├── sheets-fetcher.js  ← Google Sheets dati
│   ├── analytics-fetcher.js ← GA4 dati
│   └── schedule.js        ← Atjaunošanas grafiks
├── package.json
├── next.config.js
├── jsconfig.json
├── .env.example           ← API atslēgu paraugs
└── .gitignore
```
