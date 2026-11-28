import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dergoKonfirmimin } from "./konfirmimet";
import { supabase } from "../lib/supabase";

export type StatusiIOres = "e_lire" | "ne_pritje" | "e_rezervuar" | "pa_vend" | "pushim" | "kaluar";

export type OraEBerberit = {
  fillon_me: string;
  ora: string;
  statusi: StatusiIOres;
};

// Të gjitha orët e ditës së një berberi (çdo 30 min), me statusin e secilës, për kohëzgjatjen e
// shërbimeve të zgjedhura. Rifreskohen shpesh: dikush tjetër mund ta zërë orën ndërkohë.
export function useOraretEBerberit(berberiId: string | undefined, data: string, kohezgjatjaMin: number) {
  return useQuery({
    queryKey: ["oraret-e-berberit", berberiId, data, kohezgjatjaMin],
    enabled: Boolean(berberiId) && kohezgjatjaMin > 0,
    staleTime: 10_000,
    refetchInterval: 30_000,
    placeholderData: (meParshme) => meParshme,
    queryFn: async () => {
      const { data: oret, error } = await supabase.rpc("oraret_e_berberit", {
        p_berberi_id: berberiId!,
        p_data: data,
        p_kohezgjatja_min: kohezgjatjaMin,
      });
      if (error) throw error;
      return (oret ?? []) as OraEBerberit[];
    },
  });
}

export type RezervimiMeSherbime = {
  berberiId: string;
  sherbimet: string[];
  fillonMe: string;
  shenime: string | null;
};

// Rezervon shërbimet njëri pas tjetrit te i njëjti berber. Çmimi dhe zbritjet llogariten në server.
export function useRezervoMeSherbime() {
  const klienti = useQueryClient();
  return useMutation({
    mutationFn: async (r: RezervimiMeSherbime) => {
      const { data, error } = await supabase.rpc("rezervo_me_sherbime", {
        p_berberi_id: r.berberiId,
        p_sherbimet: r.sherbimet,
        p_fillon_me: r.fillonMe,
        p_shenime: r.shenime,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (id) => dergoKonfirmimin("termin", id),
    // Edhe kur dështon (p.sh. ora u zu), oraret rifreskohen.
    onSettled: () => {
      klienti.invalidateQueries({ queryKey: ["oraret-e-berberit"] });
      klienti.invalidateQueries({ queryKey: ["terminet-e-mia"] });
    },
  });
}
