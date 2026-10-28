import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shkurtoOren } from "../lib/formatimi";
import { supabase } from "../lib/supabase";
import type { Promocioni, PromocioniIRi } from "../lib/tipet";

const KOLONAT = "id, lokali_id, titulli, perqindja, sherbimi_id, ditet, ora_nga, ora_deri, vlen_nga, vlen_deri, aktiv";

// Për klientin RLS kthen vetëm promocionet aktive; stafi i sheh të gjitha.
export function usePromocionet(lokaliId: string | undefined) {
  return useQuery({
    queryKey: ["promocionet", lokaliId],
    enabled: Boolean(lokaliId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promocionet")
        .select(KOLONAT)
        .eq("lokali_id", lokaliId!)
        .order("aktiv", { ascending: false })
        .order("perqindja", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p) => ({
        ...p,
        ora_nga: p.ora_nga ? shkurtoOren(p.ora_nga) : null,
        ora_deri: p.ora_deri ? shkurtoOren(p.ora_deri) : null,
      })) as Promocioni[];
    },
  });
}

function useInvalidoPromocionet(lokaliId: string) {
  const klienti = useQueryClient();
  return () => {
    klienti.invalidateQueries({ queryKey: ["promocionet", lokaliId] });
    klienti.invalidateQueries({ queryKey: ["cmimi-i-terminit"] });
    klienti.invalidateQueries({ queryKey: ["lokali-im"] });
    klienti.invalidateQueries({ queryKey: ["lokali", lokaliId] });
    klienti.invalidateQueries({ queryKey: ["lokalet-prane"] });
  };
}

export function useRuajPromocionin(lokaliId: string) {
  const invalido = useInvalidoPromocionet(lokaliId);
  return useMutation({
    mutationFn: async ({ id, ...promocioni }: PromocioniIRi & { id?: string }) => {
      const { error } = id
        ? await supabase.from("promocionet").update(promocioni).eq("id", id)
        : await supabase.from("promocionet").insert({ ...promocioni, lokali_id: lokaliId });
      if (error) throw error;
    },
    onSuccess: invalido,
  });
}

export function useFshiPromocionin(lokaliId: string) {
  const invalido = useInvalidoPromocionet(lokaliId);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promocionet").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalido,
  });
}
