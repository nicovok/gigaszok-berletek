import { useState, useMemo } from "react";
import type { Pass, LedgerEntry } from "../../backend/schema";
import { createApiClient } from "./api-client";

export function usePassDetail(token: string, onPassesRefreshed: (passes: Pass[]) => void) {
  const [detailPass, setDetailPass] = useState<Pass | null>(null);
  const [detailUsage, setDetailUsage] = useState<LedgerEntry[]>([]);
  const [quickAlkalomName, setQuickAlkalomName] = useState("");
  const api = useMemo(() => createApiClient(token), [token]);

  const openDetail = async (p: Pass) => {
    setDetailPass(p);
    const usage = await api.get<LedgerEntry[]>(`/api/passes/${p.id}/usage`);
    setDetailUsage(usage);
  };

  const refreshDetail = async (passId: string) => {
    const [usage, allPasses] = await Promise.all([
      api.get<LedgerEntry[]>(`/api/passes/${passId}/usage`),
      api.get<Pass[]>("/api/passes"),
    ]);
    setDetailUsage(usage);
    onPassesRefreshed(allPasses);
    const updated = allPasses.find(p => p.id === passId);
    if (updated) setDetailPass(updated);
  };

  const closeDetail = () => {
    setDetailPass(null);
    setDetailUsage([]);
    setQuickAlkalomName("");
  };

  const handleQuickAlkalom = async () => {
    if (!detailPass || !quickAlkalomName.trim()) return;
    await api.post("/api/sessions", { name: quickAlkalomName.trim(), pass_ids: [detailPass.id] });
    setQuickAlkalomName("");
    await refreshDetail(detailPass.id);
  };

  return {
    detailPass, detailUsage, quickAlkalomName, setQuickAlkalomName,
    openDetail, refreshDetail, closeDetail, handleQuickAlkalom,
  };
}
