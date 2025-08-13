import axios from "axios";
import {
  Job,
  normalizeMoneyToEur,
  textMatches,
  passesGeoPolicy,
  regionAllowed,
} from "../util";
import { CONFIG } from "../config";

export async function fetchGreenhouse(boardToken: string): Promise<Job[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`;
  const { data } = await axios.get(url, { timeout: 15000 });
  const jobs: Job[] = (data.jobs || [])
    .map((j: any) => {
      const content: string = j.content || "";
      const sal = normalizeMoneyToEur(content);
      const remote = /remote|anywhere|distributed/i.test(
        j.location?.name || content || ""
      );
      const job: Job = {
        id: String(j.id),
        title: j.title,
        company: boardToken,
        location: j.location?.name,
        remote,
        salaryEurMin: sal.min,
        salaryEurMax: sal.max,
        url: j.absolute_url,
        source: "greenhouse",
        createdAt: j.updated_at,
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
