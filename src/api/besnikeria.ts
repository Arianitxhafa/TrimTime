import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import type { Besnikeria, KartaEBesnikerise } from "../lib/tipet";

// Karta e një klienti në një lokal (stafi me çdo çelës, klienti vetëm me "id:" të vetin).
export function useBesnikeria(lokaliId: string | undefined, celesi: string | undefined, aktiv = true) {
  return useQuery({
    queryKey: ["besnikeria", lokaliId, celesi],
    enabled: Boolean(lokaliId && celesi) && aktiv,
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("besnikeria_e_klientit", { p_lokali_id: lokaliId!, p_celesi: celesi! })
        .maybeSingle<Besnikeria>();
      if (error) throw error;
      return data;
    },
  });
}

export function useKartatEMia() {
  const { sesioni } = useAuth();
  return useQuery({
    queryKey: ["besnikeria", "e-mia", sesioni?.user.id],
    enabled: Boolean(sesioni),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("besnikeria_ime");
      if (error) throw error;
      return (data ?? []) as KartaEBesnikerise[];
    },
  });
}
