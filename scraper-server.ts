// scraper-server.ts (en raíz del repo)
import "dotenv/config";
import express from "express";
import { spawn } from "child_process";

const app = express();
app.use(express.json());

/**
 * POST /run → ejecuta tu CLI: node --env-file=.env --import tsx src/index.ts
 * Responde cuando el proceso termina; devuelve logs mínimos.
 */
app.post(
  "/run",
  async (
    _req: any,
    res: {
      json: (arg0: { ok: boolean; code: number | null; log: string }) => void;
    }
  ) => {
    const logs: string[] = [];
    const proc = spawn(
      "node",
      ["--env-file=.env", "--import", "tsx", "src/index.ts"],
      {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
        env: process.env,
      }
    );

    proc.stdout.on("data", (d) => logs.push(d.toString()));
    proc.stderr.on("data", (d) => logs.push(d.toString()));

    proc.on("close", (code) => {
      res.json({
        ok: code === 0,
        code,
        log: logs.join(""),
      });
    });
  }
);

const PORT = Number(process.env.SCRAPER_PORT || 4000);
app.listen(PORT, () => console.log(`Scraper server listening on ${PORT}`));
