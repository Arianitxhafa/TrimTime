import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

// Sa klientë të aprovuar ka Studio (distinktivi "klientë" te Ballina). Null kur funksioni mungon
// (migrimi s'është ekzekutuar ende): distinktivi thjesht nuk shfaqet.
export function useNumriIKlienteve() {
  return useQuery({
    queryKey: ["numri-i-klienteve"],
    staleTime: 10 * 60_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("numri_i_klienteve");
      if (error) return null;
      return typeof data === "number" && data > 0 ? data : null;
    },
  });
}

export type LlogariNePritje = {
  id: string;
  emri: string;
  telefoni: string | null;
  statusi: "ne_pritje" | "refuzuar";
  krijuar_me: string;
};

// Llogaritë që presin aprovimin (dhe të refuzuarat), vetëm për pronarin e Studios.
export function useLlogaritePerAprovim(aktiv: boolean) {
  return useQuery({
    queryKey: ["llogarite-per-aprovim"],
    enabled: aktiv,
    refetchInterval: 60_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("llogarite_per_aprovim");
      if (error) throw error;
      return (data ?? []) as LlogariNePritje[];
    },
  });
}

export function useNdryshoStatusinELlogarise() {
  const klienti = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, statusi }: { id: string; statusi: "aprovuar" | "refuzuar" }) => {
      const { error } = await supabase.rpc("ndrysho_statusin_e_llogarise", { p_profili_id: id, p_statusi: statusi });
      if (error) throw error;
    },
    onSuccess: () => {
      klienti.invalidateQueries({ queryKey: ["llogarite-per-aprovim"] });
      klienti.invalidateQueries({ queryKey: ["numri-i-klienteve"] });
    },
  });
}
