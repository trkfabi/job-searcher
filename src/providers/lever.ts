import axios from "axios";
import {
  Job,
  normalizeMoneyToEur,
  textMatches,
  passesGeoPolicy,
  regionAllowed,
} from "../util";
import { CONFIG } from "../config";

export async function fetchLever(company: string): Promise<Job[]> {
  const url = `https://api.lever.co/v0/postings/${company}?mode=json`;
  const { data } = await axios.get(url, { timeout: 15000 });
  const jobs: Job[] = data
    .map((j: any) => {
      const content = `${j.text || ""} ${j.description || ""}`;
      const sal = normalizeMoneyToEur(content);
      const remote = /remote|anywhere|distributed/i.test(content);
      const job: Job = {
        id: j.id,
        title: j.text,
        company,
        remote,
        salaryEurMin: sal.min,
        salaryEurMax: sal.max,
        url: j.hostedUrl,
        source: "lever",
        createdAt: j.createdAt
          ? new Date(j.createdAt).toISOString()
          : new Date().toISOString(),
        description: content,
      };
      return job;
    })
    .filter(
      (j: {
        remote: any;
        title: any;
        description: any;
        salaryEurMin: number;
      }) =>
        j.remote &&
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
