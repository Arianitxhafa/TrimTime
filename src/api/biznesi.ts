import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { shkurtoOren } from "../lib/formatimi";
import { supabase } from "../lib/supabase";
import type {
  Analitika,
  IntervaliIOrarit,
  KlientiILokalit,
  Pushimi,
  TerminiIKalendarit,
  VizitaEKlientit,
} from "../lib/tipet";

// ── Kalendari ──────────────────────────────────────────────────────────────

export function useTerminetEPeriudhes(lokaliId: string | undefined, nga: string, deri: string) {
  return useQuery({
    queryKey: ["terminet-e-periudhes", lokaliId, nga, deri],
    enabled: Boolean(lokaliId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("terminet_e_periudhes", {
        p_lokali_id: lokaliId!,
        p_nga: nga,
        p_deri: deri,
      });
      if (error) throw error;
      return (data ?? []) as TerminiIKalendarit[];
    },
  });
}

// Pushimet që prekin periudhën [nga, deri) (datat ISO në UTC).
export function usePushimet(lokaliId: string | undefined, nga: string, deri: string, profiliId?: string) {
  return useQuery({
    queryKey: ["pushimet", lokaliId, nga, deri, profiliId ?? null],
    enabled: Boolean(lokaliId),
    queryFn: async () => {
      let pyetja = supabase
        .from("pushimet_e_stafit")
        .select("id, profili_id, fillon_me, mbaron_me, arsyeja")
        .eq("lokali_id", lokaliId!)
        .lt("fillon_me", deri)
        .gt("mbaron_me", nga)
        .order("fillon_me");
      if (profiliId) pyetja = pyetja.eq("profili_id", profiliId);
      const { data, error } = await pyetja;
      if (error) throw error;
      return (data ?? []) as Pushimi[];
    },
  });
}

function useInvalidoKalendarin() {
  const klienti = useQueryClient();
  return () => {
    klienti.invalidateQueries({ queryKey: ["terminet-e-periudhes"] });
    klienti.invalidateQueries({ queryKey: ["terminet-e-lokalit"] });
    klienti.invalidateQueries({ queryKey: ["oraret-e-lira"] });
    klienti.invalidateQueries({ queryKey: ["pushimet"] });
  };
}

export function useShtoPushim(lokaliId: string) {
  const invalido = useInvalidoKalendarin();
  return useMutation({
    mutationFn: async (p: Omit<Pushimi, "id">) => {
      const { error } = await supabase.from("pushimet_e_stafit").insert({ ...p, lokali_id: lokaliId });
      if (error) throw error;
    },
    onSuccess: invalido,
  });
}

export function useFshiPushim() {
  const invalido = useInvalidoKalendarin();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pushimet_e_stafit").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalido,
  });
}

export function useZhvendosTerminin() {
  const invalido = useInvalidoKalendarin();
  return useMutation({
    mutationFn: async (p: { terminiId: string; fillonMe: string; berberiId: string }) => {
      const { error } = await supabase.rpc("zhvendos_terminin_nga_stafi", {
        p_termini_id: p.terminiId,
        p_fillon_me: p.fillonMe,
        p_berberi_id: p.berberiId,
      });
      if (error) throw error;
    },
    onSettled: invalido,
  });
}

// ── Orari i berberit ───────────────────────────────────────────────────────

export type OrariIBerberit = { orarIVecante: boolean; oraret: IntervaliIOrarit[] };

export function useOrariIBerberit(lokaliId: string | undefined, profiliId: string | undefined) {
  return useQuery({
    queryKey: ["orari-i-berberit", lokaliId, profiliId],
    enabled: Boolean(lokaliId && profiliId),
    queryFn: async (): Promise<OrariIBerberit> => {
      const [anetaresia, oraret] = await Promise.all([
        supabase
          .from("anetaret_e_lokalit")
          .select("orar_i_vecante")
          .eq("lokali_id", lokaliId!)
          .eq("profili_id", profiliId!)
          .single<{ orar_i_vecante: boolean }>(),
        supabase
          .from("oraret_e_stafit")
          .select("dita, hapet, mbyllet")
          .eq("lokali_id", lokaliId!)
          .eq("profili_id", profiliId!)
          .order("dita")
          .order("hapet"),
      ]);
      if (anetaresia.error) throw anetaresia.error;
      if (oraret.error) throw oraret.error;
      return {
        orarIVecante: anetaresia.data.orar_i_vecante,
        oraret: (oraret.data ?? []).map((o) => ({
          dita: o.dita,
          hapet: shkurtoOren(o.hapet),
          mbyllet: shkurtoOren(o.mbyllet),
        })),
      };
    },
  });
}

export function useRuajOrarinEBerberit(lokaliId: string, profiliId: string) {
  const klienti = useQueryClient();
  return useMutation({
    mutationFn: async ({ orarIVecante, oraret }: OrariIBerberit) => {
      const { error } = await supabase.rpc("ruaj_orarin_e_berberit", {
        p_lokali_id: lokaliId,
        p_profili_id: profiliId,
        p_orar_i_vecante: orarIVecante,
        p_oraret: orarIVecante ? oraret : [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      klienti.invalidateQueries({ queryKey: ["orari-i-berberit", lokaliId, profiliId] });
      klienti.invalidateQueries({ queryKey: ["oraret-e-lira"] });
    },
  });
}

// ── Klientët ───────────────────────────────────────────────────────────────

export function useKlientet(lokaliId: string | undefined) {
  return useQuery({
    queryKey: ["klientet", lokaliId],
    enabled: Boolean(lokaliId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("klientet_e_lokalit", { p_lokali_id: lokaliId! });
      if (error) throw error;
      return (data ?? []) as KlientiILokalit[];
    },
  });
}

export function useHistorikuIKlientit(lokaliId: string | undefined, celesi: string) {
  return useQuery({
    queryKey: ["historiku-i-klientit", lokaliId, celesi],
    enabled: Boolean(lokaliId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("historiku_i_klientit", {
        p_lokali_id: lokaliId!,
        p_celesi: celesi,
      });
      if (error) throw error;
      return (data ?? []) as VizitaEKlientit[];
    },
  });
}

export function useRuajKlientin(lokaliId: string) {
  const klienti = useQueryClient();
  return useMutation({
    mutationFn: async (p: { celesi: string; shenime: string | null; vip: boolean }) => {
      const { error } = await supabase
        .from("shenimet_e_klienteve")
        .upsert({ lokali_id: lokaliId, celesi: p.celesi, shenime: p.shenime, vip: p.vip });
      if (error) throw error;
    },
    onSuccess: () => klienti.invalidateQueries({ queryKey: ["klientet", lokaliId] }),
  });
}

// ── Analitika ──────────────────────────────────────────────────────────────

export function useAnalitika(lokaliId: string | undefined, nga: string, deri: string) {
  return useQuery({
    queryKey: ["analitika", lokaliId, nga, deri],
    enabled: Boolean(lokaliId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("analitika_e_lokalit", {
        p_lokali_id: lokaliId!,
        p_nga: nga,
        p_deri: deri,
      });
      if (error) throw error;
      return data as Analitika | null;
    },
  });
}
