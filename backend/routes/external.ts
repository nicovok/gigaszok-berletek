import { db } from "../db";
import { config } from "../config";
import { randomUUID } from "crypto";
import { sendPassCreatedEmail } from "../email";
import type { Trainer } from "../schema";

type ExternalPassInput = {
  trainer_email: string;
  child_name: string;
  child_birth_date: string;
  child_notes?: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  remaining_sessions: number;
};

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

      const body = await req.json() as ExternalPassInput;

      const trainer = db.prepare(`SELECT * FROM trainers WHERE email = ?`).get(body.trainer_email) as Trainer | undefined;
      if (!trainer) {
        return Response.json({ error: `No trainer found with email: ${body.trainer_email}` }, { status: 404 });
      }

      const id = randomUUID();
      const viewToken = randomUUID();
      const now = Date.now();

      db.prepare(`
        INSERT INTO passes (id, trainer_id, view_token, child_name, child_birth_date, child_notes, parent_name, parent_email, parent_phone, remaining_sessions, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, trainer.id, viewToken, body.child_name, body.child_birth_date, body.child_notes ?? null, body.parent_name, body.parent_email, body.parent_phone, body.remaining_sessions, now);

      if (body.remaining_sessions > 0) {
        db.prepare(`INSERT INTO pass_topups (id, pass_id, trainer_id, sessions, created_at) VALUES (?, ?, ?, ?, ?)`)
          .run(randomUUID(), id, trainer.id, body.remaining_sessions, now);
      }

      const passUrl = `${config.baseUrl}/pass/${viewToken}`;

      sendPassCreatedEmail({
        to: body.parent_email,
        parentName: body.parent_name,
        childName: body.child_name,
        sessions: body.remaining_sessions,
        passUrl,
      }).catch(err => console.error("[email] sendPassCreatedEmail failed:", err));

      return Response.json({ id, view_token: viewToken, pass_url: passUrl }, { status: 201 });
    },
  },
};
