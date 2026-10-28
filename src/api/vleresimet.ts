import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Vleresimi } from "../lib/tipet";

const FAQJA = 20;

export function useVleresimetELokalit(lokaliId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["vleresimet", lokaliId],
    enabled: Boolean(lokaliId),
    initialPageParam: 0,
    getNextPageParam: (faqjaEFundit: Vleresimi[], faqet) =>
      faqjaEFundit.length < FAQJA ? undefined : faqet.length * FAQJA,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc("vleresimet_e_lokalit", {
        p_lokali_id: lokaliId!,
        p_limit: FAQJA,
        p_offset: pageParam,
      });
      if (error) throw error;
      return (data ?? []) as Vleresimi[];
    },
  });
}

function useInvalidoVleresimet() {
  const klienti = useQueryClient();
  return () => {
    klienti.invalidateQueries({ queryKey: ["vleresimet"] });
    klienti.invalidateQueries({ queryKey: ["terminet-e-mia"] });
    klienti.invalidateQueries({ queryKey: ["lokali"] });
    klienti.invalidateQueries({ queryKey: ["lokali-im"] });
    klienti.invalidateQueries({ queryKey: ["lokalet-prane"] });
  };
}

export function useVleresoTerminin() {
  const invalido = useInvalidoVleresimet();
  return useMutation({
    mutationFn: async ({ terminiId, yjet, komenti }: { terminiId: string; yjet: number; komenti: string }) => {
      const { error } = await supabase.rpc("vlereso_terminin", {
        p_termini_id: terminiId,
        p_yjet: yjet,
        p_komenti: komenti.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: invalido,
  });
}

// Pronari i përgjigjet një vlerësimi; teksti bosh e heq përgjigjen.
export function usePergjigjuVleresimit() {
  const invalido = useInvalidoVleresimet();
  return useMutation({
    mutationFn: async ({ vleresimiId, pergjigjja }: { vleresimiId: string; pergjigjja: string }) => {
      const { error } = await supabase.rpc("pergjigju_vleresimit", {
        p_vleresimi_id: vleresimiId,
        p_pergjigjja: pergjigjja,
      });
      if (error) throw error;
    },
    onSuccess: invalido,
  });
}
