import { Database } from "bun:sqlite";

const sqlite = new Database(Bun.env.DB_PATH ?? "berletek.db");
export const db = sqlite;

export function initDb() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS trainers (
      id TEXT PRIMARY KEY,
      pocketid_sub TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS passes (
      id TEXT PRIMARY KEY,
      trainer_id TEXT NOT NULL,
      view_token TEXT UNIQUE,
      child_name TEXT NOT NULL,
      child_birth_date TEXT NOT NULL,
      child_notes TEXT,
      parent_name TEXT NOT NULL,
      parent_email TEXT NOT NULL,
      parent_phone TEXT NOT NULL,
      remaining_sessions INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(trainer_id) REFERENCES trainers(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      trainer_id TEXT NOT NULL,
      name TEXT NOT NULL,
      scheduled_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at INTEGER NOT NULL,
      FOREIGN KEY(trainer_id) REFERENCES trainers(id)
    );

    CREATE TABLE IF NOT EXISTS session_attendance (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      pass_id TEXT NOT NULL,
      deducted_at INTEGER,
      FOREIGN KEY(session_id) REFERENCES sessions(id),
      FOREIGN KEY(pass_id) REFERENCES passes(id)
    );

    CREATE TABLE IF NOT EXISTS pass_topups (
      id TEXT PRIMARY KEY,
      pass_id TEXT NOT NULL,
      trainer_id TEXT NOT NULL,
      sessions INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(pass_id) REFERENCES passes(id)
    );

    CREATE TABLE IF NOT EXISTS pass_manual_deductions (
      id TEXT PRIMARY KEY,
      pass_id TEXT NOT NULL,
      trainer_id TEXT NOT NULL,
      sessions INTEGER NOT NULL,
      note TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(pass_id) REFERENCES passes(id)
    );

    CREATE INDEX IF NOT EXISTS idx_passes_child_name ON passes(child_name);
    CREATE INDEX IF NOT EXISTS idx_pass_topups_pass_id ON pass_topups(pass_id);
    CREATE INDEX IF NOT EXISTS idx_pass_manual_deductions_pass_id ON pass_manual_deductions(pass_id);
    CREATE INDEX IF NOT EXISTS idx_session_attendance_pass_id ON session_attendance(pass_id);
    CREATE INDEX IF NOT EXISTS idx_session_attendance_session_id ON session_attendance(session_id);
  `);
}
