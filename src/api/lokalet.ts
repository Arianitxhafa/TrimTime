import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import type {
  IntervaliIOrarit,
  Koordinata,
  Lokali,
  LokaliPrane,
  RoliNeLokal,
  SherbimiIRi,
  TeDhenatELokalit,
} from "../lib/tipet";
import { celesat } from "./klienti";

const KOLONAT_E_LOKALIT =
  "id, pronari_id, emri, pershkrimi, adresa, qyteti, telefoni, logo_url, kopertina_url, zona_kohore, i_publikuar, krijuar_me, lat, lng, i_hapur_tani, cmimi_min";

// PostGIS e pranon pikën si tekst EWKT; gjatësia (lng) shkon e para.
export function pikaEWKT({ lat, lng }: Koordinata): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

export type LokaliIm = { lokali: Lokali; roli: RoliNeLokal } | null;

// Lokali ku punon përdoruesi (si pronar ose berber), ose null nëse nuk ka.
export function useLokaliIm() {
  const { sesioni } = useAuth();
  const perdoruesiId = sesioni?.user.id;

  return useQuery({
    queryKey: celesat.lokaliIm(perdoruesiId),
    enabled: Boolean(perdoruesiId),
    queryFn: async (): Promise<LokaliIm> => {
      const { data: anetaresia, error } = await supabase
        .from("anetaret_e_lokalit")
        .select("lokali_id, roli")
        .eq("profili_id", perdoruesiId!)
        .eq("aktiv", true)
        .order("krijuar_me", { ascending: true })
        .limit(1)
        .maybeSingle<{ lokali_id: string; roli: RoliNeLokal }>();
      if (error) throw error;
      if (!anetaresia) return null;

      const { data: lokali, error: gabimiLokalit } = await supabase
        .from("lokalet_me_koordinata")
        .select(KOLONAT_E_LOKALIT)
        .eq("id", anetaresia.lokali_id)
        .single<Lokali>();
      if (gabimiLokalit) throw gabimiLokalit;
      return { lokali, roli: anetaresia.roli };
    },
  });
}

export function useLokali(id: string | undefined) {
  return useQuery({
    queryKey: celesat.lokali(id ?? ""),
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lokalet_me_koordinata")
        .select(KOLONAT_E_LOKALIT)
        .eq("id", id!)
        .maybeSingle<Lokali>();
      if (error) throw error;
      return data;
    },
  });
}

export type ParametratEKerkimit = {
  pika: Koordinata;
  rrezjaKm: number;
  kerkimi: string;
  vetemHapur: boolean;
  cmimiMax: number | null;
  renditja: "distanca" | "cmimi";
};

export function useLokaletPrane(p: ParametratEKerkimit, aktiv = true) {
  return useQuery({
    queryKey: celesat.lokaletPrane(p),
    enabled: aktiv,
    // Rezultatet e mëparshme mbeten në ekran derisa të vijnë të rejat (pa "dridhje").
    placeholderData: (meParshme) => meParshme,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("lokalet_prane", {
        p_lat: p.pika.lat,
        p_lng: p.pika.lng,
        p_rrezja_km: p.rrezjaKm,
        p_kerkimi: p.kerkimi.trim() || null,
        p_vetem_hapur: p.vetemHapur,
        p_cmimi_max: p.cmimiMax,
        p_renditja: p.renditja,
      });
      if (error) throw error;
      return (data ?? []) as LokaliPrane[];
    },
  });
}

type KrijimiILokalit = {
  teDhenat: TeDhenatELokalit;
  orari: IntervaliIOrarit[];
  sherbimet: SherbimiIRi[];
};

// Krijon lokalin, orarin dhe shërbimet e para. Pronari bëhet anëtar nga trigger-i në databazë.
export function useKrijoLokalin() {
  const { sesioni } = useAuth();
  const klienti = useQueryClient();

  return useMutation({
    mutationFn: async ({ teDhenat, orari, sherbimet }: KrijimiILokalit) => {
      const perdoruesiId = sesioni?.user.id;
      if (!perdoruesiId) throw new Error("Pa sesion");

      const { data, error } = await supabase
        .from("lokalet")
        .insert({
          pronari_id: perdoruesiId,
          emri: teDhenat.emri,
          pershkrimi: teDhenat.pershkrimi,
          adresa: teDhenat.adresa,
          qyteti: teDhenat.qyteti,
          telefoni: teDhenat.telefoni,
          vendndodhja: pikaEWKT(teDhenat.vendndodhja),
        })
        .select("id")
        .single<{ id: string }>();
      if (error) throw error;

      const { error: gabimiOrarit } = await supabase.rpc("ruaj_orarin", {
        p_lokali_id: data.id,
        p_oraret: orari,
      });
      if (gabimiOrarit) throw gabimiOrarit;

      if (sherbimet.length > 0) {
        const { error: gabimiSherbimeve } = await supabase
          .from("sherbimet")
          .insert(sherbimet.map((s, i) => ({ ...s, lokali_id: data.id, renditja: i })));
        if (gabimiSherbimeve) throw gabimiSherbimeve;
      }

      return data.id;
    },
    onSuccess: () => klienti.invalidateQueries({ queryKey: ["lokali-im"] }),
  });
}

type NdryshimiILokalit = Partial<TeDhenatELokalit> & {
  i_publikuar?: boolean;
  logo_url?: string | null;
  kopertina_url?: string | null;
};

export function usePerditesoLokalin(lokaliId: string) {
  const klienti = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendndodhja, ...ndryshimet }: NdryshimiILokalit) => {
      const { error } = await supabase
        .from("lokalet")
        .update({ ...ndryshimet, ...(vendndodhja ? { vendndodhja: pikaEWKT(vendndodhja) } : {}) })
        .eq("id", lokaliId);
      if (error) throw error;
    },
    onSuccess: () => {
      klienti.invalidateQueries({ queryKey: ["lokali-im"] });
      klienti.invalidateQueries({ queryKey: celesat.lokali(lokaliId) });
      klienti.invalidateQueries({ queryKey: ["lokalet-prane"] });
    },
  });
}

// Ngarkon një foto në Storage dhe kthen adresën publike.
export async function ngarkoFoton(
  lokaliId: string,
  lloji: "logo" | "kopertina",
  uri: string,
  mimeType: string | undefined,
): Promise<string> {
  const tipi = mimeType ?? "image/jpeg";
  const prapashtesa = tipi === "image/png" ? "png" : tipi === "image/webp" ? "webp" : "jpg";
  // Emër i ri në çdo ngarkim, që cache-i i imazheve të mos shfaqë foton e vjetër.
  const shtegu = `${lokaliId}/${lloji}-${Date.now()}.${prapashtesa}`;

  const pergjigjja = await fetch(uri);
  const bajtet = await pergjigjja.arrayBuffer();

  const { error } = await supabase.storage
    .from("lokalet")
    .upload(shtegu, bajtet, { contentType: tipi, upsert: false });
  if (error) throw error;

  return supabase.storage.from("lokalet").getPublicUrl(shtegu).data.publicUrl;
}
