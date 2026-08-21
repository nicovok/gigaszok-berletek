import { requireAuth } from "../middleware";
import { db } from "../db";
import type { Pass } from "../schema";
import { randomUUID } from "crypto";
import { sendSessionDeductedEmail } from "../email";
import { passUrl } from "../pass-ops";

const insertSession = db.prepare(
  `INSERT INTO sessions (id, trainer_id, name, scheduled_at, status, created_at) VALUES (?, ?, ?, ?, 'completed', ?)`
);
const insertAttendance = db.prepare(
  `INSERT INTO session_attendance (id, session_id, pass_id, deducted_at) VALUES (?, ?, ?, ?)`
);
const deductPass = db.prepare(
  `UPDATE passes SET remaining_sessions = remaining_sessions - 1 WHERE id = ? AND remaining_sessions > 0`
);

export const sessionRoutes = {
  // Create session, mark attendance and deduct in one atomic transaction
  "/api/sessions": {
    async POST(req: Request) {
      const auth = await requireAuth(req);
      const { name, pass_ids } = await req.json() as { name: string; pass_ids: string[] };

      const sessionId = randomUUID();
      const now = Date.now();

      // Batch-fetch pass data before writing so emails have accurate pre-decrement values
      const placeholders = pass_ids.map(() => "?").join(",");
      const passList = db.prepare(`SELECT * FROM passes WHERE id IN (${placeholders})`).all(...pass_ids) as Pass[];
      const passesById = new Map(passList.map(p => [p.id, p]));

      db.transaction(() => {
        insertSession.run(sessionId, auth.sub, name, now, now);
        for (const passId of pass_ids) {
          insertAttendance.run(randomUUID(), sessionId, passId, now);
          deductPass.run(passId);
        }
      })();

      // Fire emails after transaction commits — one per attendee, fire-and-forget
      for (const passId of pass_ids) {
        const pass = passesById.get(passId);
        if (pass) {
          sendSessionDeductedEmail({
            to: pass.parent_email,
            parentName: pass.parent_name,
            childName: pass.child_name,
            sessionName: name,
            remainingSessions: Math.max(0, pass.remaining_sessions - 1),
            passUrl: passUrl(pass.view_token),
          }).catch(err => console.error("[email] sendSessionDeductedEmail failed:", err));
        }
      }

      return Response.json({ success: true, session_id: sessionId }, { status: 201 });
    },
  },

  // Usage log
  "/api/usage-log": {
    async GET(req: Request) {
      await requireAuth(req);
      const rows = db.prepare(`
        SELECT
          sa.deducted_at,
          s.name  AS session_name,
          p.child_name,
          p.parent_name
        FROM session_attendance sa
        JOIN sessions s ON sa.session_id = s.id
        JOIN passes   p ON sa.pass_id    = p.id
        ORDER BY sa.deducted_at DESC
        LIMIT 200
      `).all();
      return Response.json(rows);
    },
  },
};
