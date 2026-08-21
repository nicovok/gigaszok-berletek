import { randomUUID } from "crypto";
import { db } from "./db";
import { config } from "./config";
import { sendPassCreatedEmail } from "./email";

export type PassInput = {
  child_name: string;
  child_birth_date: string;
  child_notes?: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  remaining_sessions: number;
};

export function passUrl(viewToken: string): string {
  return `${config.baseUrl}/pass/${viewToken}`;
}

export function createPass(input: PassInput, trainerId: string): { id: string; viewToken: string } {
  const id = randomUUID();
  const viewToken = randomUUID();
  const now = Date.now();

  db.prepare(`
    INSERT INTO passes (id, trainer_id, view_token, child_name, child_birth_date, child_notes, parent_name, parent_email, parent_phone, remaining_sessions, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, trainerId, viewToken, input.child_name, input.child_birth_date, input.child_notes ?? null, input.parent_name, input.parent_email, input.parent_phone, input.remaining_sessions, now);

  if (input.remaining_sessions > 0) {
    db.prepare(`INSERT INTO pass_topups (id, pass_id, trainer_id, sessions, created_at) VALUES (?, ?, ?, ?, ?)`)
      .run(randomUUID(), id, trainerId, input.remaining_sessions, now);
  }

  sendPassCreatedEmail({
    to: input.parent_email,
    parentName: input.parent_name,
    childName: input.child_name,
    sessions: input.remaining_sessions,
    passUrl: passUrl(viewToken),
  }).catch(err => console.error("[email] sendPassCreatedEmail failed:", err));

  return { id, viewToken };
}
