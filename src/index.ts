import "dotenv/config";
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { CONFIG } from "./config";
import { score, ScoreResult } from "./scoring";
import { exportCSV, exportHTML, ensureDir, coverNote } from "./exporters";
import { fetchGreenhouse } from "./providers/greenhouse";
import { fetchLever } from "./providers/lever";
import { fetchAshby } from "./providers/ashby";
import { fetchRemotive } from "./providers/remotive";
import { fetchRemoteOK } from "./providers/remoteok";
import { fetchWeWorkRemotely } from "./providers/weworkremotely";

// Crear carpeta de la DB si no existe (fix)
fs.mkdirSync(path.dirname(CONFIG.dbPath), { recursive: true });

const db = new Database(CONFIG.dbPath);

db.exec(`CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT,
  company TEXT,
  url TEXT,
  source TEXT,
  createdAt TEXT,
  lastSeen TEXT
);`);

db.exec(`CREATE TABLE IF NOT EXISTS applications (
  jobId TEXT PRIMARY KEY,
  track TEXT,
  note TEXT,
  appliedAt TEXT
);`);

const upsert =
  db.prepare(`INSERT INTO jobs (id,title,company,url,source,createdAt,lastSeen)
  VALUES (@id,@title,@company,@url,@source,@createdAt,@lastSeen)
  ON CONFLICT(id) DO UPDATE SET lastSeen=@lastSeen;`);

async function run() {
  const dateTag = new Date().toISOString().slice(0, 10);
  const all: any[] = [];

  // Ajusta estas listas a tus empresas favoritas
  const greenhouseBoards = ["docplanner", "github", "stripe", "datadog"];
  const leverCompanies = ["kraken-digital-asset-exchange", "remote", "vercel"];
  const ashbyBoards = ["revolut", "sora", "brex"];

  for (const b of greenhouseBoards)
    try {
      all.push(...(await fetchGreenhouse(b)));
    } catch {}
  for (const c of leverCompanies)
    try {
      all.push(...(await fetchLever(c)));
    } catch {}
  for (const a of ashbyBoards)
    try {
      all.push(...(await fetchAshby(a)));
    } catch {}

  try {
    all.push(...(await fetchRemotive()));
  } catch {}
  try {
    all.push(...(await fetchRemoteOK()));
  } catch {}
  try {
    all.push(...(await fetchWeWorkRemotely()));
  } catch {}

  const withScores = all
    .map((j) => {
      const s: ScoreResult = score(j);
      return { ...j, score: s.total, scoreDetails: s.details };
    })
    .filter((j) => j.score > 0)
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const dedup = withScores.filter((j) => {
    if (!j.url) return false;
    if (seen.has(j.url)) return false;
    seen.add(j.url);
    return true;
  });

  const nowIso = new Date().toISOString();
  for (const j of dedup)
    upsert.run({
      id: j.id,
      title: j.title,
      company: j.company,
      url: j.url,
      source: j.source,
      createdAt: j.createdAt,
      lastSeen: nowIso,
    });

  ensureDir(CONFIG.outputDir);
  exportCSV(dedup as any, CONFIG.outputDir, dateTag);
  exportHTML(dedup as any, CONFIG.outputDir, dateTag);

  const template = fs.readFileSync(
    path.resolve("src/templates/coverLetter.mustache"),
    "utf-8"
  );
  const topBackend = dedup
    .filter((j) =>
      /node|express|typescript|php/i.test(`${j.title} ${j.description || ""}`)
    )
    .slice(0, 5);
  const topMobile = dedup
    .filter((j) =>
      /react\s*native|titanium/i.test(`${j.title} ${j.description || ""}`)
    )
    .slice(0, 5);

  for (const j of topBackend) {
    const note = coverNote(j, "backend", template);
    const fname = `cover-backend-${j.company}-${j.id}.txt`.replace(
      /[^a-z0-9.-]/gi,
      "_"
    );
    fs.writeFileSync(path.join(CONFIG.outputDir, fname), note);
  }
  for (const j of topMobile) {
    const note = coverNote(j, "mobile", template);
    const fname = `cover-mobile-${j.company}-${j.id}.txt`.replace(
      /[^a-z0-9.-]/gi,
      "_"
    );
    fs.writeFileSync(path.join(CONFIG.outputDir, fname), note);
  }

  console.log(`Saved ${dedup.length} jobs. Outputs in ${CONFIG.outputDir}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
