import { requireAuth } from "../middleware";
import { db } from "../db";
import type { Pass, SessionAttendance } from "../schema";
import { randomUUID } from "crypto";
import { config } from "../config";
import { sendSessionDeductedEmail } from "../email";

export const sessionRoutes = {
  // Create session, mark attendance and deduct in one atomic call
  "/api/sessions": {
    async POST(req: Request) {
      const auth = await requireAuth(req);


      const { name, pass_ids } = await req.json() as { name: string; pass_ids: string[] };

      const sessionId = randomUUID();
      const now = Date.now();

      db.prepare(`INSERT INTO sessions (id, trainer_id, name, scheduled_at, status, created_at) VALUES (?, ?, ?, ?, 'completed', ?)`)
        .run(sessionId, auth.sub, name, now, now);

      for (const passId of pass_ids) {
        db.prepare(`INSERT INTO session_attendance (id, session_id, pass_id, deducted_at) VALUES (?, ?, ?, ?)`)
          .run(randomUUID(), sessionId, passId, now);
        db.prepare(`UPDATE passes SET remaining_sessions = remaining_sessions - 1 WHERE id = ? AND remaining_sessions > 0`)
          .run(passId);
        const pass = db.prepare(`SELECT * FROM passes WHERE id = ?`).get(passId) as Pass | undefined;
        if (pass) {
          sendSessionDeductedEmail({
            to: pass.parent_email,
            parentName: pass.parent_name,
            childName: pass.child_name,
            sessionName: name,
            remainingSessions: pass.remaining_sessions,
            passUrl: `${config.baseUrl}/pass/${pass.view_token}`,
          }).catch(err => console.error("[email] sendSessionDeductedEmail failed:", err));
        }
      }

      return Response.json({ success: true, session_id: sessionId }, { status: 201 });
    },
  },

  // Usage log
  "/api/usage-log": {
    async GET(req: Request) {
      const auth = await requireAuth(req);


      const rows = db.prepare(`
        SELECT
          sa.deducted_at,
          s.name  AS session_name,
          p.child_name,
          p.parent_name
        FROM session_attendance sa
        JOIN sessions s ON sa.session_id = s.id
        JOIN passes   p ON sa.pass_id    = p.id
        WHERE s.trainer_id = ?
        ORDER BY sa.deducted_at DESC
        LIMIT 200
      `).all(auth.sub);

      return Response.json(rows);
    },
  },
};
