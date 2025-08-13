# Remote Job Hunter — Scraper + Dashboard (TypeScript)

Automatiza la búsqueda de trabajo para **Backend (Node/Express/TypeScript/JS/PHP)** y **Mobile (React Native/Titanium)** con filtros por **remoto**, **EU/Worldwide**, **Spain preferente**, y **≥ €50k**.  
Incluye:

- **Scraper en TypeScript** (Node) que agrega desde varias fuentes, filtra, **puntúa** y exporta shortlist (CSV/HTML) + **cover notes**.
- **API Express + SQLite** para guardar y gestionar **aplicaciones**.
- **Dashboard React** con pestañas **Jobs** y **Applications** para aplicar/seguir tu pipeline.

---

## ✨ Funcionalidades

- **Fuentes**: Greenhouse, Lever, Ashby, Remotive, RemoteOK, WeWorkRemotely (RSS).  
  **Opcional**: LinkedIn vía SerpAPI (requiere `SERPAPI_KEY`).
- **Filtros**: remoto, EU/Worldwide, salario **≥ €50k**, stack (Node/TS/JS/PHP/RN/Titanium), **US-remote sin residencia/permiso** si lo permites.
- **Política geográfica** configurable (permitidos/bloqueados) y **preferencia por Spain** (pasa “Spain”, “Europe”, “Worldwide”; bloquea países concretos si no son Spain).
- **Score con desglose**: explica por qué cada oferta tiene esa puntuación.
- **Exportación**: shortlist diaria en `CSV` y `HTML` + **cover notes** (Mustache).
- **Dashboard**: pestañas **Jobs** (con fecha “Found”) y **Applications** (status, notas, follow-up, CV usado).

---

## 🧱 Estructura del repo

```
.
├─ job-search/            # Scraper (TypeScript)
│  ├─ src/
│  │  ├─ providers/       # greenhouse, lever, ashby, remotive, remoteok, wwr, linkedin (opcional)
│  │  ├─ templates/
│  │  ├─ index.ts         # entrypoint del scraper
│  │  ├─ scoring.ts       # score + breakdown
│  │  ├─ util.ts          # filtros, normalizadores
│  │  └─ config.ts
│  ├─ .env.example
│  └─ data/
│     ├─ jobs.sqlite      # DB (se crea automáticamente)
│     └─ outputs/         # shortlist CSV/HTML + cover notes
│
├─ api/                   # API Express (reusa data/jobs.sqlite)
│  ├─ server.ts
│  └─ .env.example
│
└─ frontend/              # Dashboard (React + Vite)
   ├─ src/
   │  ├─ App.tsx          # Tabs: Jobs / Applications
   │  └─ types.ts
   └─ .env.example
```

> Si prefieres monorepo con workspaces, podemos añadir `pnpm-workspace.yaml` y scripts root.

---

## 🚀 Puesta en marcha

### 1) Scraper (job-search)

```bash
cd job-search
cp .env.example .env
pnpm i    # o npm i / yarn
pnpm start
```

Salidas:

- `data/outputs/shortlist-YYYY-MM-DD.csv`
- `data/outputs/shortlist-YYYY-MM-DD.html`
- Cover notes (`cover-*.txt`) para top Backend/Mobile.

### 2) API (Express)

```bash
cd api
cp .env.example .env   # DB_PATH apunta a ../job-search/data/jobs.sqlite (ajústalo si cambias rutas)
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

## ⚙️ Configuración (.env)

`job-search/.env` (ejemplo):

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
YOUR_NAME=Tu Nombre
YEARS_EXP=15
BACKEND_IMPACT="migrated a legacy ERP..., implemented VERI*FACTU..."
MOBILE_IMPACT="shipped RN apps..., Apple Pay/Google Wallet..."
SERPAPI_KEY=tu_api_key_opcional   # si quieres LinkedIn via SerpAPI
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

## 🔎 Proveedores

- **Greenhouse**: `boards-api.greenhouse.io`
- **Lever**: `api.lever.co`
- **Ashby**: `jobs.ashbyhq.com`
- **Remotive**: `remotive.com/api/remote-jobs`
- **RemoteOK**: `remoteok.com/api`
- **We Work Remotely (WWR)**: RSS `https://weworkremotely.com/categories/remote-programming-jobs.rss`
- **LinkedIn (opcional)**: **SerpAPI** (`SERPAPI_KEY`) → resultados limitados en plan free.

> Braintrust: no expone API pública estable. Se podría añadir via scraper (bajo tu responsabilidad).

---

## 🧠 Scoring & Breakdown

- +5 por **keyword** relevante (`node`, `typescript`, `javascript`, `react native`, `php`, `express`, `titanium`, …)
- +10 **track backend** (Node/TS/PHP)
- +10 **track mobile** (RN/Titanium)
- +8 **seniority** (si no hay salario pero menciona `senior|staff|principal`)
- +5 **EU-friendly** (CET/CEST/EU/EMEA)
- +3 **Worldwide/Anywhere**
- **-50** si salario < mínimo, **-100** si no es remoto
- (Opcional) Penalización por región no preferida

**Desglose visible** en HTML (expandible) y CSV (`scoreBreakdown`).

---

## 🧭 Filtros geográficos

- Acepta **Spain** explícito, **Europe/EU/EMEA**, **Worldwide/Anywhere**, y **US-remote** (si no exige residencia/permiso US).
- Bloquea países no deseados (configurables por env).
- Puedes forzar preferencia por **un país** (`PREFERRED_COUNTRY=spain`):
  - “Remote — Spain” ✅
  - “Remote — Europe” ✅
  - “Remote — Germany” ❌ (a menos que también mencione Spain)
  - “Worldwide” ✅

---

## 📊 Dashboard (Jobs / Applications)

- **Jobs**
  - Búsqueda por título/empresa
  - Columna **Found** (fecha `createdAt`)
  - Acción **Apply / Save** abre modal para guardar la aplicación (status, notas, follow-up, CV).
- **Applications**
  - Lista de aplicaciones guardadas
  - Cambia estado rápido: `interviewing`, `offer`, `rejected`
  - Guarda notas y fecha de **follow-up**.

---

## ⏰ Programación (cron)

Ejemplo: todos los días a las 09:10 (hora local) ejecutar el scraper:

```
10 9 * * * cd /ruta/job-search && pnpm start >> logs.txt 2>&1
```

> Puedes añadir notificaciones por email/Telegram cuando haya nuevos jobs con score > X.

---

## 🗄️ Modelo de datos (SQLite)

- **jobs**  
  `id (PK)`, `title`, `company`, `url`, `source`, `createdAt`, `lastSeen`
- **applications**  
  `jobId (PK)`, `status`, `track`, `note`, `cvVersion`, `coverPath`, `appliedAt`, `nextFollowUp`

---

## 🧩 Roadmap

- Enviar shortlist por email cada mañana
- Importar/exportar **applications** como CSV
- Integrar más fuentes (Workable, Indeed APIs de terceros, boards RN específicos)
- Autocompletar **cover note** con señales del JD (company, stack, impacto)

---

## 🛠️ Troubleshooting

- **`TypeError: Cannot open database because the directory does not exist`**  
  El scraper ya crea la carpeta de DB automáticamente. Si ves esto en la API, revisa `DB_PATH` y que exista la ruta padre:
  ```
  mkdir -p job-search/data
  ```
- **CORS en el dashboard**  
  Asegúrate de que la API corre en `http://localhost:3333` o ajusta `VITE_API_URL`.

---

## 📄 Licencia

MIT — Usa y adapta libremente. Pull requests bienvenidos.
