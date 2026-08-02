import { db } from "../db";
import type { LedgerEntry } from "../schema";

type RawDeduction       = { ts: number; label: string };
type RawManualDeduction = { ts: number; sessions: number; note: string | null };
type RawTopup           = { ts: number; sessions: number };
type Event       = { ts: number; label: string; type: "deduction" | "topup"; change: number };

export function buildPassLedger(
  passId: string,
  passCreatedAt: number,
  remainingSessions: number,
  trainerFilter?: string,
): LedgerEntry[] {
  const deductions = (
    trainerFilter
      ? db.prepare(`
          SELECT sa.deducted_at AS ts, s.name AS label
          FROM session_attendance sa
          JOIN sessions s ON sa.session_id = s.id
          WHERE sa.pass_id = ? AND s.trainer_id = ?
        `).all(passId, trainerFilter)
      : db.prepare(`
          SELECT sa.deducted_at AS ts, s.name AS label
          FROM session_attendance sa
          JOIN sessions s ON sa.session_id = s.id
          WHERE sa.pass_id = ?
        `).all(passId)
  ) as RawDeduction[];

  const topups = (
    trainerFilter
      ? db.prepare(`SELECT created_at AS ts, sessions FROM pass_topups WHERE pass_id = ? AND trainer_id = ?`).all(passId, trainerFilter)
      : db.prepare(`SELECT created_at AS ts, sessions FROM pass_topups WHERE pass_id = ?`).all(passId)
  ) as RawTopup[];

  const manualDeductions = (
    trainerFilter
      ? db.prepare(`SELECT created_at AS ts, sessions, note FROM pass_manual_deductions WHERE pass_id = ? AND trainer_id = ?`).all(passId, trainerFilter)
      : db.prepare(`SELECT created_at AS ts, sessions, note FROM pass_manual_deductions WHERE pass_id = ?`).all(passId)
  ) as RawManualDeduction[];

  const events: Event[] = [
    ...deductions.map(d => ({ ts: d.ts, label: d.label, type: "deduction" as const, change: -1 })),
    ...manualDeductions.map(d => ({
      ts: d.ts,
      label: `Manuális levonás${d.note ? `: ${d.note}` : ""}`,
      type: "deduction" as const,
      change: -d.sessions,
    })),
    ...topups.map(t => ({
      ts: t.ts,
      label: `+${t.sessions} alkalom ${t.ts === passCreatedAt ? "(kezdeti)" : "feltöltés"}`,
      type: "topup" as const,
      change: t.sessions,
    })),
  ];
  events.sort((a, b) => a.ts - b.ts);

  const totalChange = events.reduce((sum, e) => sum + e.change, 0);
  let balance = remainingSessions - totalChange;

  const ledger = events.map(e => {
    balance += e.change;
    return { timestamp: e.ts, label: e.label, type: e.type, change: e.change, balance_after: balance };
  });

  ledger.reverse();
  return ledger;
}
