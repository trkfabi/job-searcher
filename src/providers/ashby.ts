import axios from "axios";
import {
  Job,
  normalizeMoneyToEur,
  textMatches,
  passesGeoPolicy,
  regionAllowed,
} from "../util";
import { CONFIG } from "../config";

export async function fetchAshby(boardToken: string): Promise<Job[]> {
  const url = `https://jobs.ashbyhq.com/api/non-user-ats-boards/${boardToken}/jobs`;
  const { data } = await axios.get(url, { timeout: 15000 });
  const jobs: Job[] = (data.jobs || [])
    .map((j: any) => {
      const full = JSON.stringify(j);
      const sal = normalizeMoneyToEur(full);
      const remote = /remote|anywhere|distributed/i.test(full);
      const job: Job = {
        id: String(j.jobId),
        title: j.title,
        company: boardToken,
        remote,
        salaryEurMin: sal.min,
        salaryEurMax: sal.max,
        url: `https://jobs.ashbyhq.com/${boardToken}/${j.jobId}`,
        source: "ashby",
        createdAt: new Date(j.createdAt).toISOString(),
        description: full,
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
