import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Sherbimi, SherbimiIRi } from "../lib/tipet";
import { celesat } from "./klienti";

export function useSherbimet(lokaliId: string | undefined) {
  return useQuery({
    queryKey: celesat.sherbimet(lokaliId ?? ""),
    enabled: Boolean(lokaliId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sherbimet")
        .select("id, lokali_id, emri, pershkrimi, cmimi_centa, kohezgjatja_min, pushimi_pas_min, aktiv, renditja")
        .eq("lokali_id", lokaliId!)
        .order("renditja")
        .order("krijuar_me");
      if (error) throw error;
      return (data ?? []) as Sherbimi[];
    },
  });
}

function useInvalidoSherbimet(lokaliId: string) {
  const klienti = useQueryClient();
  return () => {
    klienti.invalidateQueries({ queryKey: celesat.sherbimet(lokaliId) });
    // Çmimi minimal i lokalit varet nga shërbimet.
    klienti.invalidateQueries({ queryKey: ["lokali-im"] });
    klienti.invalidateQueries({ queryKey: celesat.lokali(lokaliId) });
  };
}

// Krijon një shërbim të ri ose përditëson një ekzistues (kur jepet id).
export function useRuajSherbimin(lokaliId: string) {
  const invalido = useInvalidoSherbimet(lokaliId);

  return useMutation({
    mutationFn: async ({ id, ...sherbimi }: SherbimiIRi & { id?: string; renditja?: number }) => {
      const { error } = id
        ? await supabase.from("sherbimet").update(sherbimi).eq("id", id)
        : await supabase.from("sherbimet").insert({ ...sherbimi, lokali_id: lokaliId });
      if (error) throw error;
    },
    onSuccess: invalido,
  });
}

export function useFshiSherbimin(lokaliId: string) {
  const invalido = useInvalidoSherbimet(lokaliId);

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sherbimet").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalido,
  });
}
