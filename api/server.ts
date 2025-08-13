import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

const DB_PATH =
  process.env.DB_PATH || path.resolve(process.cwd(), "../data/jobs.sqlite");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);

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
  status TEXT DEFAULT 'applied',
  track TEXT,
  note TEXT,
  cvVersion TEXT,
  coverPath TEXT,
  appliedAt TEXT,
  nextFollowUp TEXT
);`);

const app = express();
app.use(cors());
app.use(express.json());

const KEYWORDS = (
  process.env.KEYWORDS ||
  "node,express,typescript,javascript,php,react native,titanium"
)
  .split(/[,|]/)
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function computeScore(j: {
  title: string;
  source: string;
  createdAt?: string;
}) {
  let s = 0;
  const t = `${j.title} ${j.source}`.toLowerCase();
  const reasons: string[] = [];

  // keywords
  KEYWORDS.forEach((k) => {
    if (t.includes(k)) {
      s += 5;
      reasons.push(`+5 keyword: "${k}"`);
    }
  });

  // tracks
  if (/(react\s*native|titanium)/.test(t)) {
    s += 10;
    reasons.push(`+10 track mobile (RN/Titanium)`);
  }
  if (/(node|express|typescript|php)/.test(t)) {
    s += 10;
    reasons.push(`+10 track backend (Node/TS/PHP)`);
  }

  // seniority hints
  if (/(senior|staff|principal)/.test(t)) {
    s += 8;
    reasons.push(`+8 seniority`);
  }

  // EU hints (muy básico; puedes mejorar si guardas description)
  if (/(europe|eu|emea|cet|cest|utc\+?\s*[0-2])/.test(t)) {
    s += 5;
    reasons.push(`+5 EU-friendly`);
  }

  return { score: s, scoreReasons: reasons };
}

const mapJob = (r: any) => {
  const base = {
    id: r.id,
    title: r.title,
    company: r.company,
    url: r.url,
    source: r.source,
    createdAt: r.createdAt,
    lastSeen: r.lastSeen,
  };
  const { score, scoreReasons } = computeScore(base);
  return { ...base, score, scoreReasons };
};

app.get(
  "/api/jobs",
  (
    req: { query: any },
    res: {
      json: (arg0: {
        success: boolean;
        results: {
          score: number;
          scoreReasons: string[];
          id: any;
          title: any;
          company: any;
          url: any;
          source: any;
          createdAt: any;
          lastSeen: any;
        }[];
        message: string;
      }) => void;
    }
  ) => {
    const { query = "", limit = "200" } = req.query as any;
    const rows = db
      .prepare(
        `SELECT id,title,company,url,source,createdAt,lastSeen FROM jobs`
      )
      .all()
      .map(mapJob)
      .filter((j) => {
        const hay = `${j.title} ${j.company}`.toLowerCase();
        return query ? hay.includes(String(query).toLowerCase()) : true;
      })
      .slice(0, Number(limit) || 200);
    res.json({ success: true, results: rows, message: "OK" });
  }
);

app.get(
  "/api/applications",
  (
    _req: any,
    res: {
      json: (arg0: {
        success: boolean;
        results: unknown[];
        message: string;
      }) => void;
    }
  ) => {
    const apps = db.prepare(`SELECT * FROM applications`).all();
    res.json({ success: true, results: apps, message: "OK" });
  }
);

app.post("/api/applications", (req: any, res: any) => {
  const {
    jobId,
    status = "applied",
    track,
    note = "",
    cvVersion = "",
    coverPath = "",
    appliedAt,
    nextFollowUp,
  } = req.body || {};
  if (!jobId)
    return res
      .status(400)
      .json({ success: false, message: "jobId is required", results: null });
  const appliedAtIso = appliedAt || new Date().toISOString();
  const stmt =
    db.prepare(`INSERT INTO applications (jobId,status,track,note,cvVersion,coverPath,appliedAt,nextFollowUp)
    VALUES (@jobId,@status,@track,@note,@cvVersion,@coverPath,@appliedAt,@nextFollowUp)
    ON CONFLICT(jobId) DO UPDATE SET status=@status, track=@track, note=@note, cvVersion=@cvVersion, coverPath=@coverPath, appliedAt=@appliedAt, nextFollowUp=@nextFollowUp`);
  stmt.run({
    jobId,
    status,
    track,
    note,
    cvVersion,
    coverPath,
    appliedAt: appliedAtIso,
    nextFollowUp,
  });
  res.json({ success: true, message: "Saved", results: { jobId } });
});

app.patch("/api/applications/:jobId", (req: any, res: any) => {
  const { jobId } = req.params;
  const { status, note, nextFollowUp } = req.body || {};
  const cur = db.prepare(`SELECT * FROM applications WHERE jobId=?`).get(jobId);
  if (!cur)
    return res
      .status(404)
      .json({ success: false, message: "Not found", results: null });
  const upd = db.prepare(
    `UPDATE applications SET status=@status, note=@note, nextFollowUp=@nextFollowUp WHERE jobId=@jobId`
  );
  upd.run({
    jobId,
    status: status ?? cur.status,
    note: note ?? cur.note,
    nextFollowUp: nextFollowUp ?? cur.nextFollowUp,
  });
  res.json({ success: true, message: "Updated", results: { jobId } });
});

const PORT = Number(process.env.PORT || 3333);
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
