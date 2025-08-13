import axios from "axios";
import { parseStringPromise } from "xml2js";
import { Job, normalizeMoneyToEur, textMatches, regionAllowed } from "../util";
import { CONFIG } from "../config";

export async function fetchWeWorkRemotely(): Promise<Job[]> {
  const url =
    "https://weworkremotely.com/categories/remote-programming-jobs.rss";
  const { data } = await axios.get(url, { timeout: 15000 });
  const parsed = await parseStringPromise(data);
  const items = parsed.rss.channel[0].item || [];

  const jobs: Job[] = items
    .map((it: any) => {
      const title = it.title[0] || "";
      const desc = it.description[0] || "";
      const link = it.link[0];
      const pubDate = it.pubDate[0];

      const sal = normalizeMoneyToEur(`${title} ${desc}`);
      const remote = true; // WWR es siempre remoto
      const company = title.split(":")[0].trim();

      return {
        id: link,
        title,
        company,
        location: "",
        remote,
        salaryEurMin: sal.min,
        salaryEurMax: sal.max,
        url: link,
        source: "weworkremotely",
        createdAt: new Date(pubDate).toISOString(),
        description: desc,
      };
    })
    .filter(
      (j: {
        remote: any;
        title: any;
        description: any;
        salaryEurMin: number;
      }) =>
        j.remote &&
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
