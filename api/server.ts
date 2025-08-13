
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), '../data/jobs.sqlite');
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

const mapJob = (r: any) => ({ id: r.id, title: r.title, company: r.company, url: r.url, source: r.source, createdAt: r.createdAt, lastSeen: r.lastSeen });

app.get('/api/jobs', (req, res) => {
  const { query = '', limit = '200' } = req.query as any;
  const rows = db.prepare(`SELECT id,title,company,url,source,createdAt,lastSeen FROM jobs`).all()
    .map(mapJob)
    .filter(j => {
      const hay = `${j.title} ${j.company}`.toLowerCase();
      return query ? hay.includes(String(query).toLowerCase()) : true;
    })
    .slice(0, Number(limit) || 200);
  res.json({ success: true, results: rows, message: 'OK' });
});

app.get('/api/applications', (_req, res) => {
  const apps = db.prepare(`SELECT * FROM applications`).all();
  res.json({ success: true, results: apps, message: 'OK' });
});

app.post('/api/applications', (req, res) => {
  const { jobId, status = 'applied', track, note = '', cvVersion = '', coverPath = '', appliedAt, nextFollowUp } = req.body || {};
  if (!jobId) return res.status(400).json({ success: false, message: 'jobId is required', results: null });
  const appliedAtIso = appliedAt || new Date().toISOString();
  const stmt = db.prepare(`INSERT INTO applications (jobId,status,track,note,cvVersion,coverPath,appliedAt,nextFollowUp)
    VALUES (@jobId,@status,@track,@note,@cvVersion,@coverPath,@appliedAt,@nextFollowUp)
    ON CONFLICT(jobId) DO UPDATE SET status=@status, track=@track, note=@note, cvVersion=@cvVersion, coverPath=@coverPath, appliedAt=@appliedAt, nextFollowUp=@nextFollowUp`);
  stmt.run({ jobId, status, track, note, cvVersion, coverPath, appliedAt: appliedAtIso, nextFollowUp });
  res.json({ success: true, message: 'Saved', results: { jobId } });
});

app.patch('/api/applications/:jobId', (req, res) => {
  const { jobId } = req.params;
  const { status, note, nextFollowUp } = req.body || {};
  const cur = db.prepare(`SELECT * FROM applications WHERE jobId=?`).get(jobId);
  if (!cur) return res.status(404).json({ success: false, message: 'Not found', results: null });
  const upd = db.prepare(`UPDATE applications SET status=@status, note=@note, nextFollowUp=@nextFollowUp WHERE jobId=@jobId`);
  upd.run({ jobId, status: status ?? cur.status, note: note ?? cur.note, nextFollowUp: nextFollowUp ?? cur.nextFollowUp });
  res.json({ success: true, message: 'Updated', results: { jobId } });
});

const PORT = Number(process.env.PORT || 3333);
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
