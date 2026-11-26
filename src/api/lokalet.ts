import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { STUDIO_ID } from "../lib/studio";
import type {
  Koordinata,
  Lokali,
  RoliNeLokal,
  TeDhenatELokalit,
} from "../lib/tipet";
import { celesat } from "./klienti";

const KOLONAT_E_LOKALIT =
  "id, pronari_id, emri, pershkrimi, adresa, qyteti, telefoni, logo_url, kopertina_url, zona_kohore, i_publikuar, krijuar_me, lat, lng, i_hapur_tani, cmimi_min, burimi, pranimi_automatik, anulimi_deri_ore, vleresimi_mesatar, nr_vleresimeve, besnikeria_aktive, besnikeria_vizita, besnikeria_shperblimi, promocioni_max";

// PostGIS e pranon pikën si tekst EWKT; gjatësia (lng) shkon e para.
export function pikaEWKT({ lat, lng }: Koordinata): string {
  return `SRID=4326;POINT(${lng} ${lat})`;
}

export type LokaliIm = { lokali: Lokali; roli: RoliNeLokal } | null;

// Studio Burimi, kur përdoruesi punon aty (si pronar ose berber); null për klientët.
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
        .eq("lokali_id", STUDIO_ID)
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

type NdryshimiILokalit = Partial<TeDhenatELokalit> & {
  i_publikuar?: boolean;
  pranimi_automatik?: boolean;
  anulimi_deri_ore?: number;
  besnikeria_aktive?: boolean;
  besnikeria_vizita?: number;
  besnikeria_shperblimi?: string | null;
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
