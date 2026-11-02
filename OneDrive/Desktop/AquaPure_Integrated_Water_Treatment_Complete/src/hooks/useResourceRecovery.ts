import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResourceRecoveryRecord {
  id: string;
  date: string;
  sludge_generated_kg: number;
  sludge_dry_solids_pct: number;
  biogas_yield_m3: number;
  methane_content_pct: number;
  reclaimed_water_m3: number;
  reuse_application: string;
  notes: string | null;
}

export interface DateRange {
  from?: string; // ISO yyyy-mm-dd
  to?: string;
}

export const useResourceRecovery = (range?: DateRange) => {
  return useQuery({
    queryKey: ["resource-recovery", range?.from ?? null, range?.to ?? null],
    queryFn: async (): Promise<ResourceRecoveryRecord[]> => {
      let q = supabase.from("resource_recovery").select("*").order("date", { ascending: true });
      if (range?.from) q = q.gte("date", range.from);
      if (range?.to) q = q.lte("date", range.to);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ResourceRecoveryRecord[];
    },
  });
};
