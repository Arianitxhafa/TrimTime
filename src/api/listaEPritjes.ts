import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import type { NeListenEPritjes } from "../lib/tipet";

export function useListaImeEPritjes() {
  const { sesioni } = useAuth();
  return useQuery({
    queryKey: ["lista-e-pritjes", sesioni?.user.id],
    enabled: Boolean(sesioni),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("lista_ime_e_pritjes");
      if (error) throw error;
      return (data ?? []) as NeListenEPritjes[];
    },
  });
}

type HyrjaNeListe = { lokaliId: string; sherbimiId: string; data: string; berberiId: string | null };

export function useShtoNeListenEPritjes() {
  const klienti = useQueryClient();
  return useMutation({
    mutationFn: async (h: HyrjaNeListe) => {
      const { error } = await supabase.rpc("shto_ne_listen_e_pritjes", {
        p_lokali_id: h.lokaliId,
        p_sherbimi_id: h.sherbimiId,
        p_data: h.data,
        p_berberi_id: h.berberiId,
      });
      if (error) throw error;
    },
    onSuccess: () => klienti.invalidateQueries({ queryKey: ["lista-e-pritjes"] }),
  });
}

export function useLargohuNgaLista() {
  const klienti = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lista_e_pritjes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => klienti.invalidateQueries({ queryKey: ["lista-e-pritjes"] }),
  });
}

type HyrjaENjoftuar = { id: string; lokali_id: string; data: string; njoftuar_me: string | null };

// Kur lirohet një orë, databaza shënon `njoftuar_me`; ky dëgjues e merr menjëherë dhe
// thërret `kurLirohet`. Thirret një herë, te _layout i klientit.
export function useListaEPritjesLive(kurLirohet: (hyrja: HyrjaENjoftuar) => void) {
  const { sesioni } = useAuth();
  const klienti = useQueryClient();
  const perdoruesiId = sesioni?.user.id;
  // Ref-i lejon që funksioni të ndryshojë pa e rihapur kanalin.
  const thirrja = useRef(kurLirohet);
  useEffect(() => {
    thirrja.current = kurLirohet;
  }, [kurLirohet]);

  useEffect(() => {
    if (!perdoruesiId) return;
    const kanali = supabase
      .channel(`lista-e-pritjes-${perdoruesiId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lista_e_pritjes", filter: `klienti_id=eq.${perdoruesiId}` },
        (ngjarja) => {
          klienti.invalidateQueries({ queryKey: ["lista-e-pritjes"] });
          const hyrja = ngjarja.new as HyrjaENjoftuar;
          if (hyrja.njoftuar_me) thirrja.current(hyrja);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(kanali);
    };
  }, [perdoruesiId, klienti]);
}
