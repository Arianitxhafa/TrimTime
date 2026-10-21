import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { AnetariIStafit } from "../lib/tipet";
import { celesat } from "./klienti";

export function useStafi(lokaliId: string | undefined) {
  return useQuery({
    queryKey: celesat.stafi(lokaliId ?? ""),
    enabled: Boolean(lokaliId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("stafi_i_lokalit", { p_lokali_id: lokaliId! });
      if (error) throw error;
      return (data ?? []) as AnetariIStafit[];
    },
  });
}

export function useKrijoFtesen(lokaliId: string) {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("krijo_ftesen", { p_lokali_id: lokaliId });
      if (error) throw error;
      return data as string;
    },
  });
}

export function usePranoFtesen() {
  const klienti = useQueryClient();

  return useMutation({
    mutationFn: async (kodi: string) => {
      const { data, error } = await supabase.rpc("prano_ftesen", { p_kodi: kodi.trim().toUpperCase() });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => klienti.invalidateQueries({ queryKey: ["lokali-im"] }),
  });
}

export function useNdryshoAnetarin(lokaliId: string) {
  const klienti = useQueryClient();

  return useMutation({
    mutationFn: async ({ profiliId, aktiv }: { profiliId: string; aktiv: boolean }) => {
      const { error } = await supabase
        .from("anetaret_e_lokalit")
        .update({ aktiv })
        .eq("lokali_id", lokaliId)
        .eq("profili_id", profiliId);
      if (error) throw error;
    },
    onSuccess: () => klienti.invalidateQueries({ queryKey: celesat.stafi(lokaliId) }),
  });
}
