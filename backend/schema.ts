export type BunRequest<T extends Record<string, string> = Record<string, string>> = Request & {
  params: T;
};

export type Trainer = {
  id: string;
  pocketid_sub: string;
  name: string;
  email: string;
  created_at: number;
};

export type Pass = {
  id: string;
  trainer_id: string;
  view_token: string;
  child_name: string;
  child_birth_date: string;
  child_notes?: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  remaining_sessions: number;
  created_at: number;
};

export type Session = {
  id: string;
  trainer_id: string;
  name: string;
  scheduled_at: number;
  status: "draft" | "completed";
  created_at: number;
};

export type LedgerEntry = {
  timestamp: number;
  label: string;
  type: "deduction" | "topup";
  change: number;
  balance_after: number;
};

export type SessionAttendance = {
  id: string;
  session_id: string;
  pass_id: string;
  deducted_at?: number;
};
