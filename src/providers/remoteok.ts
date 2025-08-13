import axios from "axios";
import {
  Job,
  normalizeMoneyToEur,
  textMatches,
  passesGeoPolicy,
  regionAllowed,
} from "../util";
import { CONFIG } from "../config";

export async function fetchRemoteOK(): Promise<Job[]> {
  const url = `https://remoteok.com/api`;
  const { data } = await axios.get(url, { timeout: 15000 });
  const rows = Array.isArray(data) ? data : [];
  const jobs: Job[] = rows
    .filter((r: any) => r?.id && r?.position)
    .map((j: any) => {
      const content = `${j.position} ${(j.tags || []).join(" ")} ${
        j.description || ""
      } ${j.location || ""}`;
      const sal = normalizeMoneyToEur(j.salary || content);
      const remote = true;
      const job: Job = {
        id: String(j.id),
        title: j.position,
        company: j.company || "RemoteOK",
        remote,
        salaryEurMin: sal.min,
        salaryEurMax: sal.max,
        url: j.url || j.apply_url || "",
        source: "remoteok",
        createdAt: j.date || new Date().toISOString(),
        description: content,
      };
      return job;
    })
    .filter(
      (j) =>
        passesGeoPolicy(
          `${j.title} ${j.description || ""}`,
          CONFIG.allowUSRemote
        ) &&
        regionAllowed(
          `${j.title} ${j.description || ""}`,
          CONFIG.allowedLocHints,
          CONFIG.blockedLocHints,
          process.env.PREFERRED_COUNTRY
        ) &&
        (j.salaryEurMin ? j.salaryEurMin >= CONFIG.minSalaryEur : true) &&
        textMatches(`${j.title} ${j.description || ""}`, CONFIG.keywords)
    );
  return jobs;
}
