import { db } from "../db";
import { config } from "../config";
import { createPass, passUrl, type PassInput } from "../pass-ops";
import type { Trainer } from "../schema";

function requireApiKey(req: Request): boolean {
  if (!config.externalApiKey) return false;
  return req.headers.get("X-API-Key") === config.externalApiKey;
}

export const externalRoutes = {
  "/api/external/passes": {
    async POST(req: Request) {
      if (!requireApiKey(req)) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await req.json() as PassInput;

      const trainer = db.prepare(`SELECT * FROM trainers LIMIT 1`).get() as Trainer | undefined;
      if (!trainer) {
        return Response.json({ error: "No trainer found" }, { status: 404 });
      }

      const { id, viewToken } = createPass(body, trainer.id);

      return Response.json({ id, view_token: viewToken, pass_url: passUrl(viewToken) }, { status: 201 });
    },
  },
};
