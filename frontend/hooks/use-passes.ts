import { useEffect, useState } from "react";
import type { Pass } from "../../backend/schema";
import { createApiClient } from "./api-client";

export function usePasses(token: string) {
  const [passes, setPasses] = useState<Pass[]>([]);
  const api = createApiClient(token);

  const load = async () => {
    const p = await api.get<Pass[]>("/api/passes");
    setPasses(p);
  };

  useEffect(() => { load(); }, []);

  return { passes, setPasses, load, api };
}
