import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { ngarkoNeStorage, type Fotoja } from "../lib/fotot";
import { STUDIO_ID } from "../lib/studio";
import { supabase } from "../lib/supabase";

export const KATEGORITE_E_PRODUKTEVE = ["pajisje", "stilim", "kujdes", "tjeter"] as const;
export type KategoriaEProduktit = (typeof KATEGORITE_E_PRODUKTEVE)[number];

export type Produkti = {
  id: string;
  lokali_id: string;
  emri: string;
  pershkrimi: string | null;
  kategoria: KategoriaEProduktit;
  cmimi_centa: number;
  foto_url: string | null;
  ne_stok: number | null;
  aktiv: boolean;
  krijuar_me: string;
};

export type StatusiIPorosise = "e_re" | "gati" | "marre" | "anuluar";

export type ArtikulliIPorosise = { id: string; produkti_id: string | null; emri: string; cmimi_centa: number; sasia: number };

export type Porosia = {
  id: string;
  klienti_id: string;
  statusi: StatusiIPorosise;
  totali_centa: number;
  shenime: string | null;
  krijuar_me: string;
  porosite_artikujt: ArtikulliIPorosise[];
  profilet?: { emri: string; telefoni: string | null } | null;
};

const KOLONAT = "id, lokali_id, emri, pershkrimi, kategoria, cmimi_centa, foto_url, ne_stok, aktiv, krijuar_me";

// Katalogu: klienti sheh produktet aktive; stafi edhe ato të fshehura (RLS vendos).
export function useProduktet() {
  return useQuery({
    queryKey: ["produktet"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produktet")
        .select(KOLONAT)
        .eq("lokali_id", STUDIO_ID)
        .order("krijuar_me", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Produkti[];
    },
  });
}

export type NdryshimiIProduktit = Partial<Omit<Produkti, "id" | "lokali_id" | "krijuar_me">> & { foto?: Fotoja | null };

// Shton ose ndryshon një produkt (vetëm pronari). Fotoja e re ngarkohet te bucket-i "lokalet".
export function useRuajProduktin() {
  const klienti = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, foto, ...ndryshimet }: NdryshimiIProduktit & { id?: string }) => {
      let foto_url = ndryshimet.foto_url;
      if (foto) {
        const shtegu = await ngarkoNeStorage("lokalet", `${STUDIO_ID}/produktet`, foto);
        foto_url = supabase.storage.from("lokalet").getPublicUrl(shtegu).data.publicUrl;
      }
      const rreshti = { ...ndryshimet, ...(foto_url !== undefined ? { foto_url } : {}) };
      const { error } = id
        ? await supabase.from("produktet").update(rreshti).eq("id", id)
        : await supabase.from("produktet").insert({ ...rreshti, lokali_id: STUDIO_ID });
      if (error) throw error;
    },
    onSuccess: () => klienti.invalidateQueries({ queryKey: ["produktet"] }),
  });
}

export function useFshiProduktin() {
  const klienti = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("produktet").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => klienti.invalidateQueries({ queryKey: ["produktet"] }),
  });
}

const KOLONAT_E_POROSISE = "id, klienti_id, statusi, totali_centa, shenime, krijuar_me, porosite_artikujt(id, produkti_id, emri, cmimi_centa, sasia)";

// Porositë e klientit që ka hyrë.
export function usePorositeEMia() {
  const { sesioni } = useAuth();
  const id = sesioni?.user.id;
  return useQuery({
    queryKey: ["porosite", "e-mia", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("porosite")
        .select(KOLONAT_E_POROSISE)
        .eq("klienti_id", id!)
        .order("krijuar_me", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Porosia[];
    },
  });
}

// Të gjitha porositë e Studios, për stafin (me emrin dhe telefonin e klientit).
export function usePorositeEStudios(aktiv: boolean) {
  return useQuery({
    queryKey: ["porosite", "studio"],
    enabled: aktiv,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("porosite")
        .select(`${KOLONAT_E_POROSISE}, profilet(emri, telefoni)`)
        .eq("lokali_id", STUDIO_ID)
        .order("krijuar_me", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as Porosia[];
    },
  });
}

export function usePorosit() {
  const klienti = useQueryClient();
  return useMutation({
    mutationFn: async ({ artikujt, shenime }: { artikujt: { produkti_id: string; sasia: number }[]; shenime: string | null }) => {
      const { data, error } = await supabase.rpc("porosit", { p_artikujt: artikujt, p_shenime: shenime });
      if (error) throw error;
      return data as string;
    },
    onSettled: () => {
      klienti.invalidateQueries({ queryKey: ["porosite"] });
      klienti.invalidateQueries({ queryKey: ["produktet"] });
    },
  });
}

export function useNdryshoStatusinEPorosise() {
  const klienti = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, statusi }: { id: string; statusi: StatusiIPorosise }) => {
      const { error } = await supabase.rpc("ndrysho_statusin_e_porosise", { p_porosia_id: id, p_statusi: statusi });
      if (error) throw error;
    },
    onSettled: () => {
      klienti.invalidateQueries({ queryKey: ["porosite"] });
      klienti.invalidateQueries({ queryKey: ["produktet"] });
    },
  });
}
