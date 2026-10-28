import type { PostgrestError } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import type {
  CmimiITerminit,
  MenyraEPageses,
  OraELire,
  StatusiTerminit,
  TerminiIKlientit,
  TerminiILokalit,
} from "../lib/tipet";

const celesat = {
  oraret: (p: object) => ["oraret-e-lira", p] as const,
  teMiat: ["terminet-e-mia"] as const,
  lokalit: (lokaliId: string, data: string) => ["terminet-e-lokalit", lokaliId, data] as const,
};

// Kodet TT00x vijnë nga funksionet e rezervimit në databazë.
export function mesazhiIGabimitTeRezervimit(gabimi: unknown, t: TFunction): string {
  switch ((gabimi as PostgrestError | null)?.code) {
    case "TT001":
      return t("rezervimi.gabimOraZene");
    case "TT002":
      return t("rezervimi.gabimAfati");
    case "TT003":
      return t("rezervimi.gabimNukMundet");
    case "TT004":
      return t("rezervimi.gabimLokali");
    case "TT005":
      return t("vleresimet.gabimNukMundet");
    case "TT006":
      return t("besnikeria.gabimPaShperblim");
    default:
      return t("pergjithshme.gabimPapritur");
  }
}

type ParametratEOrareve = {
  lokaliId: string;
  sherbimiId: string | null;
  data: string;
  berberiId: string | null;
  perjashtoTerminin?: string;
  perStafin?: boolean;
};

export function useOraretELira(p: ParametratEOrareve) {
  return useQuery({
    queryKey: celesat.oraret(p),
    enabled: Boolean(p.sherbimiId),
    staleTime: 15_000,
    // Oraret mund t'i zërë dikush tjetër; rifreskohen rregullisht ndërsa ekrani është i hapur.
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("oraret_e_lira", {
        p_lokali_id: p.lokaliId,
        p_sherbimi_id: p.sherbimiId!,
        p_data: p.data,
        p_berberi_id: p.berberiId,
        p_perjashto_terminin: p.perjashtoTerminin ?? null,
        p_per_stafin: p.perStafin ?? false,
      });
      if (error) throw error;
      return (data ?? []) as OraELire[];
    },
  });
}

function useInvalidoTerminet() {
  const klienti = useQueryClient();
  return () => {
    klienti.invalidateQueries({ queryKey: ["oraret-e-lira"] });
    klienti.invalidateQueries({ queryKey: celesat.teMiat });
    klienti.invalidateQueries({ queryKey: ["terminet-e-lokalit"] });
    klienti.invalidateQueries({ queryKey: ["terminet-e-periudhes"] });
    klienti.invalidateQueries({ queryKey: ["klientet"] });
    klienti.invalidateQueries({ queryKey: ["analitika"] });
    klienti.invalidateQueries({ queryKey: ["besnikeria"] });
    klienti.invalidateQueries({ queryKey: ["lista-e-pritjes"] });
  };
}

type Rezervimi = {
  lokaliId: string;
  sherbimiId: string;
  fillonMe: string;
  berberiId: string | null;
  shenime: string | null;
};

export function useRezervoTermin() {
  const invalido = useInvalidoTerminet();
  return useMutation({
    mutationFn: async (r: Rezervimi) => {
      const { data, error } = await supabase.rpc("rezervo_termin", {
        p_lokali_id: r.lokaliId,
        p_sherbimi_id: r.sherbimiId,
        p_fillon_me: r.fillonMe,
        p_berberi_id: r.berberiId,
        p_shenime: r.shenime,
      });
      if (error) throw error;
      return data as string;
    },
    // Edhe kur dështon (p.sh. ora u zu), oraret duhet të rifreskohen.
    onSettled: invalido,
  });
}

export function useTerminetEMia() {
  return useQuery({
    queryKey: celesat.teMiat,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("terminet_e_mia");
      if (error) throw error;
      return (data ?? []) as TerminiIKlientit[];
    },
  });
}

export function useAnuloTerminin() {
  const invalido = useInvalidoTerminet();
  return useMutation({
    mutationFn: async (terminiId: string) => {
      const { error } = await supabase.rpc("anulo_terminin", { p_termini_id: terminiId });
      if (error) throw error;
    },
    onSettled: invalido,
  });
}

export function useRiplanifikoTerminin() {
  const invalido = useInvalidoTerminet();
  return useMutation({
    mutationFn: async ({ terminiId, fillonMe }: { terminiId: string; fillonMe: string }) => {
      const { error } = await supabase.rpc("riplanifiko_terminin", {
        p_termini_id: terminiId,
        p_fillon_me: fillonMe,
      });
      if (error) throw error;
    },
    onSettled: invalido,
  });
}

export function useTerminetELokalit(lokaliId: string | undefined, data: string) {
  return useQuery({
    queryKey: celesat.lokalit(lokaliId ?? "", data),
    enabled: Boolean(lokaliId),
    queryFn: async () => {
      const { data: rreshtat, error } = await supabase.rpc("terminet_e_lokalit", {
        p_lokali_id: lokaliId!,
        p_data: data,
      });
      if (error) throw error;
      return (rreshtat ?? []) as TerminiILokalit[];
    },
  });
}

export function useNdryshoStatusin() {
  const invalido = useInvalidoTerminet();
  return useMutation({
    mutationFn: async ({ terminiId, statusi }: { terminiId: string; statusi: StatusiTerminit }) => {
      // Anulimi kalon nga funksioni në databazë; ndryshimet e tjera i lejon RLS për stafin.
      const { error } =
        statusi === "anuluar"
          ? await supabase.rpc("anulo_terminin", { p_termini_id: terminiId })
          : await supabase.from("terminet").update({ statusi }).eq("id", terminiId);
      if (error) throw error;
    },
    onSettled: invalido,
  });
}

// Pagesa në lokal; `menyra: null` e zhbën shënimin.
export function useRegjistroPagesen() {
  const invalido = useInvalidoTerminet();
  return useMutation({
    mutationFn: async ({ terminiId, menyra }: { terminiId: string; menyra: MenyraEPageses | null }) => {
      const { error } = await supabase.rpc("regjistro_pagesen", { p_termini_id: terminiId, p_menyra: menyra });
      if (error) throw error;
    },
    onSettled: invalido,
  });
}

export function usePerdorShperblimin() {
  const invalido = useInvalidoTerminet();
  return useMutation({
    mutationFn: async ({ terminiId, perdor }: { terminiId: string; perdor: boolean }) => {
      const { error } = await supabase.rpc("perdor_shperblimin", { p_termini_id: terminiId, p_perdor: perdor });
      if (error) throw error;
    },
    onSettled: invalido,
  });
}

// Çmimi me promocionin e orës së zgjedhur, i llogaritur në server si gjatë rezervimit.
export function useCmimiITerminit(lokaliId: string, sherbimiId: string | null, fillonMe: string | null) {
  return useQuery({
    queryKey: ["cmimi-i-terminit", lokaliId, sherbimiId, fillonMe],
    enabled: Boolean(sherbimiId && fillonMe),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("cmimi_i_terminit", { p_lokali_id: lokaliId, p_sherbimi_id: sherbimiId!, p_fillon_me: fillonMe! })
        .maybeSingle<CmimiITerminit>();
      if (error) throw error;
      return data;
    },
  });
}

type TerminINgaStafi = {
  lokaliId: string;
  sherbimiId: string;
  fillonMe: string;
  berberiId: string;
  emriKlientit: string;
  telefoni: string | null;
  shenime: string | null;
};

export function useShtoTerminNgaStafi() {
  const invalido = useInvalidoTerminet();
  return useMutation({
    mutationFn: async (r: TerminINgaStafi) => {
      const { data, error } = await supabase.rpc("shto_termin_nga_stafi", {
        p_lokali_id: r.lokaliId,
        p_sherbimi_id: r.sherbimiId,
        p_fillon_me: r.fillonMe,
        p_berberi_id: r.berberiId,
        p_emri_klientit: r.emriKlientit,
        p_telefoni: r.telefoni,
        p_shenime: r.shenime,
      });
      if (error) throw error;
      return data as string;
    },
    onSettled: invalido,
  });
}

// Rifreskon terminet e lokalit sa herë që dikush rezervon, anulon ose ndryshon një termin.
// Thirret një herë, te _layout i biznesit, që mbetet i hapur nën të gjitha ekranet e stafit.
export function useTerminetLiveILokalit(lokaliId: string | undefined) {
  const klienti = useQueryClient();

  useEffect(() => {
    if (!lokaliId) return;
    const kanali = supabase
      .channel(`terminet-${lokaliId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "terminet", filter: `lokali_id=eq.${lokaliId}` },
        () => {
          klienti.invalidateQueries({ queryKey: ["terminet-e-lokalit", lokaliId] });
          klienti.invalidateQueries({ queryKey: ["terminet-e-periudhes", lokaliId] });
          klienti.invalidateQueries({ queryKey: ["klientet", lokaliId] });
          klienti.invalidateQueries({ queryKey: ["analitika", lokaliId] });
          klienti.invalidateQueries({ queryKey: ["oraret-e-lira"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(kanali);
    };
  }, [lokaliId, klienti]);
}
