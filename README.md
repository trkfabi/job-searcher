# Remote Job Hunter — Scraper + Dashboard (TypeScript)

Automates job searching for **Backend (Node/Express/TypeScript/JS/PHP)** and **Mobile (React Native/Titanium)** with filters for **remote**, **EU/Worldwide**, **Spain preferred**, and **≥ €50k**.  
Includes:

- **Scraper in TypeScript** (Node) that aggregates from multiple sources, filters, **scores**, and exports a shortlist (CSV/HTML) + **cover notes**.
- **Express API + SQLite** to store and manage **applications**.
- **React Dashboard** with **Jobs** and **Applications** tabs to apply and track your pipeline.

---

## ✨ Features

- **Sources**: Greenhouse, Lever, Ashby, Remotive, RemoteOK, WeWorkRemotely (RSS).  
  **Optional**: LinkedIn via SerpAPI (requires `SERPAPI_KEY`).
- **Filters**: remote, EU/Worldwide, salary **≥ €50k**, stack (Node/TS/JS/PHP/RN/Titanium), **US-remote without residency/visa** if allowed.
- **Configurable location policy** (allowed/blocked) and **preference for Spain** (accepts “Spain”, “Europe”, “Worldwide”; blocks specific countries if not Spain).
- **Score with breakdown**: explains why each job received that score.
- **Export**: daily shortlist in `CSV` and `HTML` + **cover notes** (Mustache).
- **Dashboard**: **Jobs** tab (with “Found” date) and **Applications** tab (status, notes, follow-up, CV used).

---

## 🧱 Repo Structure

```
.
├─ job-search/            # Scraper (TypeScript)
│  ├─ src/
│  │  ├─ providers/       # greenhouse, lever, ashby, remotive, remoteok, wwr, linkedin (optional)
│  │  ├─ templates/
│  │  ├─ index.ts         # scraper entrypoint
│  │  ├─ scoring.ts       # score + breakdown
│  │  ├─ util.ts          # filters, normalizers
│  │  └─ config.ts
│  ├─ .env.example
│  └─ data/
│     ├─ jobs.sqlite      # DB (auto-created)
│     └─ outputs/         # shortlist CSV/HTML + cover notes
│
├─ api/                   # Express API (reuses data/jobs.sqlite)
│  ├─ server.ts
│  └─ .env.example
│
└─ frontend/              # Dashboard (React + Vite)
   ├─ src/
   │  ├─ App.tsx          # Tabs: Jobs / Applications
   │  └─ types.ts
   └─ .env.example
```

## 🚀 Getting Started

### 1) Scraper (job-search)

```bash
cd job-search
cp .env.example .env
pnpm i    # or npm i / yarn
pnpm start
```

Outputs:

- `data/outputs/shortlist-YYYY-MM-DD.csv`
- `data/outputs/shortlist-YYYY-MM-DD.html`
- Cover notes (`cover-*.txt`) for top Backend/Mobile.

### 2) API (Express)

```bash
cd api
cp .env.example .env   # DB_PATH points to ../job-search/data/jobs.sqlite (adjust if paths change)
pnpm i
pnpm dev               # http://localhost:3333
```

### 3) Frontend (React + Vite)

```bash
cd frontend
cp .env.example .env   # VITE_API_URL=http://localhost:3333
pnpm i
pnpm dev               # http://localhost:5173
```

---

## ⚙️ Configuration (.env)

`job-search/.env` (example):

```
KEYWORDS=node,express,typescript,javascript,php,react native,titanium
MIN_SALARY_EUR=50000
EU_TIMEZONES=UTC,UTC+1,UTC+2
ALLOW_US_REMOTE=true
ALLOWED_LOCATION_HINTS=spain,europe,eu,emea,worldwide,anywhere,us,americas
BLOCKED_LOCATION_HINTS=south africa,za,germany,france,italy
PREFERRED_COUNTRY=spain
OUTPUT_DIR=./data/outputs
DB_PATH=./data/jobs.sqlite
YOUR_NAME=Your Name
YEARS_EXP=15
BACKEND_IMPACT="migrated a legacy ERP..., implemented VERI*FACTU..."
MOBILE_IMPACT="shipped RN apps..., Apple Pay/Google Wallet..."
SERPAPI_KEY=your_optional_api_key   # if you want LinkedIn via SerpAPI
```

`api/.env`:

```
PORT=3333
DB_PATH=../job-search/data/jobs.sqlite
```

`frontend/.env`:

```
VITE_API_URL=http://localhost:3333
```

---

## 🔎 Providers

- **Greenhouse**: `boards-api.greenhouse.io`
- **Lever**: `api.lever.co`
- **Ashby**: `jobs.ashbyhq.com`
- **Remotive**: `remotive.com/api/remote-jobs`
- **RemoteOK**: `remoteok.com/api`
- **We Work Remotely (WWR)**: RSS `https://weworkremotely.com/categories/remote-programming-jobs.rss`

---

## 🧠 Scoring & Breakdown

- +5 for **relevant keyword** (`node`, `typescript`, `javascript`, `react native`, `php`, `express`, `titanium`, …)
- +10 **backend track** (Node/TS/PHP)
- +10 **mobile track** (RN/Titanium)
- +8 **seniority** (if no salary but mentions `senior|staff|principal`)
- +5 **EU-friendly** (CET/CEST/EU/EMEA)
- +3 **Worldwide/Anywhere**
- **-50** if salary < minimum, **-100** if not remote
- (Optional) Penalty for non-preferred region

**Visible breakdown** in HTML (expandable) and CSV (`scoreBreakdown`).

---

## 🧭 Geographic Filters

- Accepts **Spain** explicitly, **Europe/EU/EMEA**, **Worldwide/Anywhere**, and **US-remote** (if no residency/visa required).
- Blocks unwanted countries (configurable via env).
- You can enforce preference for **one country** (`PREFERRED_COUNTRY=spain`):
  - “Remote — Spain” ✅
  - “Remote — Europe” ✅
  - “Remote — Germany” ❌ (unless also mentions Spain)
  - “Worldwide” ✅

---

## 📊 Dashboard (Jobs / Applications)

- **Jobs**
  - Search by title/company
  - **Found** column (date `createdAt`)
  - **Apply / Save** action opens a modal to store the application (status, notes, follow-up, CV).
- **Applications**
  - List of saved applications
  - Quick status change: `interviewing`, `offer`, `rejected`
  - Store notes and **follow-up** date.

---

## ⏰ Scheduling (cron)

Example: every day at 09:10 (local time) run the scraper:

```
10 9 * * * cd /path/job-search && pnpm start >> logs.txt 2>&1
```

---

## 🗄️ Data Model (SQLite)

- **jobs**  
  `id (PK)`, `title`, `company`, `url`, `source`, `createdAt`, `lastSeen`
- **applications**  
  `jobId (PK)`, `status`, `track`, `note`, `cvVersion`, `coverPath`, `appliedAt`, `nextFollowUp`

---

## 🧩 Roadmap

- Email shortlist every morning
- Import/export **applications** as CSV
- Integrate more sources (Workable, Indeed via third-party APIs, RN-specific boards)
- Auto-fill **cover note** with JD signals (company, stack, impact)

---

## 🛠️ Troubleshooting

- **`TypeError: Cannot open database because the directory does not exist`**  
  The scraper already creates the DB folder automatically. If you see this in the API, check `DB_PATH` and ensure the parent path exists:
  ```
  mkdir -p job-search/data
  ```

---

## 📄 License
