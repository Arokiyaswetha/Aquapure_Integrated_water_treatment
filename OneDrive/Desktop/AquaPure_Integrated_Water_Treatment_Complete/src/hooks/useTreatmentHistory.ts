import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TreatmentRecord {
  id: string;
  treatment_id: string;
  date: string;
  treatment_type: string;
  source: string;
  volume_treated: number;
  ph_before: number;
  ph_after: number;
  turbidity_before: number;
  turbidity_after: number;
  tds_before: number;
  tds_after: number;
  status: string;
  operator: string;
}

export const useTreatmentHistory = () => {
  return useQuery({
    queryKey: ["treatment-history"],
    queryFn: async (): Promise<TreatmentRecord[]> => {
      const { data, error } = await supabase
        .from("treatment_history")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return (data ?? []) as TreatmentRecord[];
    },
  });
};
