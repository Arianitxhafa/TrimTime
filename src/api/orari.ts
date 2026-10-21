import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shkurtoOren } from "../lib/formatimi";
import { supabase } from "../lib/supabase";
import type { IntervaliIOrarit } from "../lib/tipet";
import { celesat } from "./klienti";

export function useOrari(lokaliId: string | undefined) {
  return useQuery({
    queryKey: celesat.orari(lokaliId ?? ""),
    enabled: Boolean(lokaliId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("oraret_e_lokalit")
        .select("dita, hapet, mbyllet")
        .eq("lokali_id", lokaliId!)
        .order("dita")
        .order("hapet");
      if (error) throw error;
      return (data ?? []).map((o) => ({
        dita: o.dita,
        hapet: shkurtoOren(o.hapet),
        mbyllet: shkurtoOren(o.mbyllet),
      })) as IntervaliIOrarit[];
    },
  });
}

export function useRuajOrarin(lokaliId: string) {
  const klienti = useQueryClient();

  return useMutation({
    mutationFn: async (orari: IntervaliIOrarit[]) => {
      const { error } = await supabase.rpc("ruaj_orarin", { p_lokali_id: lokaliId, p_oraret: orari });
      if (error) throw error;
    },
    onSuccess: () => {
      klienti.invalidateQueries({ queryKey: celesat.orari(lokaliId) });
      klienti.invalidateQueries({ queryKey: ["lokali-im"] });
      klienti.invalidateQueries({ queryKey: celesat.lokali(lokaliId) });
    },
  });
}

// Orari i parazgjedhur: e hënë–e shtunë 09:00–19:00, e diel e mbyllur.
export const orariIParazgjedhur: IntervaliIOrarit[] = [1, 2, 3, 4, 5, 6].map((dita) => ({
  dita,
  hapet: "09:00",
  mbyllet: "19:00",
}));
