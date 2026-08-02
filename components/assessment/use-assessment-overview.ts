"use client";

import { useCallback, useEffect, useState } from "react";
import type { CompetencyOverview } from "@/types/assessment";

export function useAssessmentOverview() {
  const [overview, setOverview] = useState<CompetencyOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/assessment/overview", { cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 401 ? "Yetkinlik verilerini görmek için giriş yapmalısın." : "Ölçme verileri alınamadı.");
      const data = await response.json() as { overview: CompetencyOverview };
      setOverview(data.overview);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Ölçme verileri alınamadı.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return { overview, loading, error, reload: load };
}
