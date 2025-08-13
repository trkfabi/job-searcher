import axios from "axios";
import {
  Job,
  normalizeMoneyToEur,
  textMatches,
  passesGeoPolicy,
  regionAllowed,
} from "../util";
import { CONFIG } from "../config";

export async function fetchRemotive(): Promise<Job[]> {
  const url = `https://remotive.com/api/remote-jobs`;
  const { data } = await axios.get(url, { timeout: 15000 });
  const jobs: Job[] = (data.jobs || [])
    .map((j: any) => {
      const sal = normalizeMoneyToEur(j.salary || j.salary_range || "");
      const content = `${j.title} ${j.description || ""} ${j.job_type || ""} ${
        j.candidate_required_location || ""
      }`;
      const remote = true;
      const job: Job = {
        id: String(j.id),
        title: j.title,
        company: j.company_name,
        remote,
        salaryEurMin: sal.min,
        salaryEurMax: sal.max,
        url: j.url,
        source: "remotive",
        createdAt: j.publication_date,
        description: content,
      };
      return job;
    })
    .filter(
      (j: { title: any; description: any; salaryEurMin: number }) =>
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
