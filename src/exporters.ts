import fs from "fs";
import path from "path";
import Mustache from "mustache";
import { CONFIG } from "./config";
import { Job } from "./util";

export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function exportCSV(jobs: any[], outDir: string, dateTag: string) {
  const rows = [
    [
      "score",
      "scoreBreakdown",
      "title",
      "company",
      "salaryMin",
      "salaryMax",
      "remote",
      "url",
      "source",
      "createdAt",
    ],
    ...jobs.map((j: any) => [
      j.score,
      j.scoreDetails
        ?.map((d: any) => `${d.delta >= 0 ? "+" : ""}${d.delta}:${d.reason}`)
        .join(" | ") || "",
      j.title,
      j.company,
      j.salaryEurMin || "",
      j.salaryEurMax || "",
      j.remote,
      j.url,
      j.source,
      j.createdAt,
    ]),
  ]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  ensureDir(outDir);
  fs.writeFileSync(path.join(outDir, `shortlist-${dateTag}.csv`), rows);
}

export function exportHTML(jobs: any[], outDir: string, dateTag: string) {
  const items = jobs
    .map((j: any) => {
      const breakdown = (j.scoreDetails || [])
        .map(
          (d: any) =>
            `<li><code>${d.delta >= 0 ? "+" : ""}${d.delta}</code> ${
              d.reason
            }</li>`
        )
        .join("");
      return `
    <li>
      <strong>${j.score}</strong> · <a href="${j.url}">${j.title}</a> @ ${
        j.company
      }
      ${
        j.salaryEurMin
          ? `· €${j.salaryEurMin}${j.salaryEurMax ? "–€" + j.salaryEurMax : ""}`
          : ""
      }
      <br><small>${j.source} · ${j.createdAt}</small>
      <details><summary>¿Por qué este score?</summary><ul>${breakdown}</ul></details>
    </li>`;
    })
    .join("\n");
  ensureDir(outDir);
  fs.writeFileSync(
    path.join(outDir, `shortlist-${dateTag}.html`),
    `
<!doctype html><meta charset="utf-8"/>
<h1>Shortlist ${dateTag}</h1><ul>${items}</ul>
`
  );
}

export function coverNote(
  job: Job,
  track: "backend" | "mobile",
  template: string
) {
  const topReason =
    (job as any).scoreDetails?.sort((a: any, b: any) => b.delta - a.delta)[0]
      ?.reason || "";
  const view = {
    name: "Hiring Team",
    track: track === "backend" ? "Backend" : "Mobile (React Native)",
    years: CONFIG.profile.years,
    focus:
      track === "backend"
        ? "scalable APIs, auth, and payments"
        : "cross‑platform mobile apps and native modules",
    impact:
      track === "backend"
        ? CONFIG.profile.backendImpact
        : CONFIG.profile.mobileImpact,
    stack:
      track === "backend"
        ? "Node.js, Express, TypeScript, PostgreSQL/Prisma, Redis, Docker, CI/CD"
        : "React Native, TypeScript, native iOS modules, Apple Pay/Google Wallet, analytics",
    "why-company": `${job.company} ${job.title}`,
    how:
      track === "backend"
        ? "shipping reliable, well‑tested services and improving DX/CI"
        : "accelerating mobile delivery and quality",
    your_name: CONFIG.profile.name,
    topReason,
  };
  return Mustache.render(template, view);
}
