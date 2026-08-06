import { requireAuth } from "../middleware";
import { db } from "../db";
import type { BunRequest, Pass } from "../schema";
import { buildPassLedger } from "../queries/ledger";
import { randomUUID } from "crypto";
import { config } from "../config";
import { sendPassCreatedEmail, sendPassToppedUpEmail } from "../email";

type DeductInput = { sessions: number; note?: string };

function passUrl(viewToken: string) {
  return `${config.baseUrl}/pass/${viewToken}`;
}

type PassInput = Omit<Pass, "id" | "trainer_id" | "created_at">;

export const passRoutes = {
  "/api/passes": {
    async GET(req: Request) {
      await requireAuth(req);
      const passes = db.prepare(`SELECT * FROM passes ORDER BY child_name ASC`).all();
      return Response.json(passes);
    },
    async POST(req: Request) {
      const auth = await requireAuth(req);
      const body = await req.json() as PassInput;
      const id = randomUUID();
      const viewToken = randomUUID();
      const now = Date.now();
      db.prepare(`
        INSERT INTO passes (id, trainer_id, view_token, child_name, child_birth_date, child_notes, parent_name, parent_email, parent_phone, remaining_sessions, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, auth.sub, viewToken, body.child_name, body.child_birth_date, body.child_notes ?? null, body.parent_name, body.parent_email, body.parent_phone, body.remaining_sessions, now);
      if (body.remaining_sessions > 0) {
        db.prepare(`INSERT INTO pass_topups (id, pass_id, trainer_id, sessions, created_at) VALUES (?, ?, ?, ?, ?)`)
          .run(randomUUID(), id, auth.sub, body.remaining_sessions, now);
      }
      sendPassCreatedEmail({
        to: body.parent_email,
        parentName: body.parent_name,
        childName: body.child_name,
        sessions: body.remaining_sessions,
        passUrl: passUrl(viewToken),
      }).catch(err => console.error("[email] sendPassCreatedEmail failed:", err));
      return Response.json({ id, ...body, trainer_id: auth.sub }, { status: 201 });
    },
  },

  "/api/passes/:id": {
    async PUT(req: Request) {
      await requireAuth(req);
      const id = (req as BunRequest<{ id: string }>).params.id;
      const body = await req.json() as PassInput;
      db.prepare(`
        UPDATE passes SET child_name = ?, child_birth_date = ?, child_notes = ?, parent_name = ?, parent_email = ?, parent_phone = ?, remaining_sessions = ?
        WHERE id = ?
      `).run(body.child_name, body.child_birth_date, body.child_notes ?? null, body.parent_name, body.parent_email, body.parent_phone, body.remaining_sessions, id);
      return Response.json({ success: true });
    },
    async DELETE(req: Request) {
      await requireAuth(req);
      const id = (req as BunRequest<{ id: string }>).params.id;
      db.prepare(`DELETE FROM passes WHERE id = ?`).run(id);
      return Response.json({ success: true });
    },
  },

  "/api/passes/:id/usage": {
    async GET(req: Request) {
      await requireAuth(req);
      const id = (req as BunRequest<{ id: string }>).params.id;
      const pass = db.prepare(`SELECT remaining_sessions, created_at FROM passes WHERE id = ?`)
        .get(id) as { remaining_sessions: number; created_at: number } | undefined;
      if (!pass) return Response.json([]);
      return Response.json(buildPassLedger(id, pass.created_at, pass.remaining_sessions));
    },
  },

  "/api/pass-view/:token": {
    async GET(req: Request) {
      const token = (req as BunRequest<{ token: string }>).params.token;
      const pass = db.prepare(`SELECT * FROM passes WHERE view_token = ?`).get(token) as Pass | undefined;
      if (!pass) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json({ pass, ledger: buildPassLedger(pass.id, pass.created_at, pass.remaining_sessions) });
    },
  },

  "/api/passes/:id/deduct": {
    async POST(req: Request) {
      const auth = await requireAuth(req);
      const id = (req as BunRequest<{ id: string }>).params.id;
      const { sessions, note } = await req.json() as DeductInput;
      if (!sessions || sessions < 1) return Response.json({ error: "Invalid sessions" }, { status: 400 });
      const now = Date.now();
      db.prepare(`UPDATE passes SET remaining_sessions = MAX(0, remaining_sessions - ?) WHERE id = ?`).run(sessions, id);
      db.prepare(`INSERT INTO pass_manual_deductions (id, pass_id, trainer_id, sessions, note, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
        .run(randomUUID(), id, auth.sub, sessions, note ?? null, now);
      return Response.json({ success: true });
    },
  },

  "/api/passes/:id/topup": {
    async POST(req: Request) {
      const auth = await requireAuth(req);
      const id = (req as BunRequest<{ id: string }>).params.id;
      const { sessions } = await req.json() as { sessions: number };
      const now = Date.now();
      db.prepare(`UPDATE passes SET remaining_sessions = remaining_sessions + ? WHERE id = ?`).run(sessions, id);
      db.prepare(`INSERT INTO pass_topups (id, pass_id, trainer_id, sessions, created_at) VALUES (?, ?, ?, ?, ?)`)
        .run(randomUUID(), id, auth.sub, sessions, now);
      const pass = db.prepare(`SELECT * FROM passes WHERE id = ?`).get(id) as Pass | undefined;
      if (pass) {
        sendPassToppedUpEmail({
          to: pass.parent_email,
          parentName: pass.parent_name,
          childName: pass.child_name,
          addedSessions: sessions,
          remainingSessions: pass.remaining_sessions,
          passUrl: passUrl(pass.view_token),
        }).catch(err => console.error("[email] sendPassToppedUpEmail failed:", err));
      }
      return Response.json({ success: true });
    },
  },
};
