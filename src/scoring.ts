import { Job } from "./util";
import { CONFIG } from "./config";

export type ScoreDetail = { reason: string; delta: number };
export type ScoreResult = { total: number; details: ScoreDetail[] };

export function score(job: Job): ScoreResult {
  const details: ScoreDetail[] = [];
  const add = (reason: string, delta: number) =>
    details.push({ reason, delta });

  const t = `${job.title} ${job.description || ""}`.toLowerCase();

  // Hard filters
  if (!job.remote) add("No es remoto", -100);
  if (job.salaryEurMin && job.salaryEurMin < CONFIG.minSalaryEur) {
    add(`Salario < €${CONFIG.minSalaryEur}`, -50);
  }

  // Stack match
  CONFIG.keywords.forEach((k) => {
    if (t.includes(k)) add(`Keyword match: "${k}"`, +5);
  });

  // Tracks
  if (/react\s*native|titanium/.test(t)) add("Track mobile (RN/Titanium)", +10);
  if (/(^|\W)(node|express|typescript|php)(\W|$)/.test(t))
    add("Track backend (Node/TS/PHP)", +10);

  // Seniority si falta salario
  if (!job.salaryEurMin && /(senior|staff|principal)/.test(t))
    add("Seniority alto sin salario publicado", +8);

  // Timezone EU
  if (
    /(europe|eu timezone|emea|cet|cest|utc\+?\s*[0-2])/.test(t) ||
    job.timezoneNote
  ) {
    add("Compatible con huso horario EU", +5);
  }

  // Worldwide/global
  if (/(worldwide|global|anywhere)/.test(t))
    add("Worldwide/Global/Anywhere", +3);

  const total = details.reduce((s, d) => s + d.delta, 0);
  return { total, details };
}
