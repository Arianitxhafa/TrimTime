import { FunctionsHttpError } from "@supabase/supabase-js";
import { useMutation } from "@tanstack/react-query";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import type { Kategoria } from "../components/FiltratEKerkimit";
import { gjuhaAktuale } from "../i18n";
import { supabase } from "../lib/supabase";
import type { Koordinata } from "../lib/tipet";

export type KategoriaEAsistentit = Kategoria | "asnje";

export type StiliIRekomanduar = {
  emri: string;
  pse: string;
  kategoria: KategoriaEAsistentit;
  si_ta_kerkosh: string;
};

export type KeshillaEStilit = {
  eshte_fytyre: boolean;
  forma_e_fytyres: string;
  pershkrimi: string;
  stilet: StiliIRekomanduar[];
};

export type KerkesaERezervimit = {
  e_qarte: boolean;
  kategoria: KategoriaEAsistentit;
  data: string;
  ora_nga: string;
  ora_deri: string;
  kuptova: string;
};

export type OraEAsistentit = {
  lokali_id: string;
  lokali_emri: string;
  adresa: string;
  sherbimi_id: string;
  sherbimi_emri: string;
  cmimi_centa: number;
  distanca_m: number;
  fillon_me: string;
  ora: string;
};

// Kodet që kthen Edge Function-i (shih supabase/functions/asistenti), plus "rrjeti" për lidhjen.
export type KodiIGabimit = "kufiri" | "pa_konfigurim" | "refuzim" | "foto" | "i_zene" | "pa_llogari" | "rrjeti";

export class GabimIAsistentit extends Error {
  constructor(public kodi: KodiIGabimit) {
    super(kodi);
  }
}

async function thirrAsistentin<T>(trupi: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("asistenti", {
    body: { ...trupi, gjuha: gjuhaAktuale() },
  });
  if (!error) return data as T;
  if (error instanceof FunctionsHttpError) {
    // 404: funksioni nuk është vendosur ende në Supabase.
    if (error.context.status === 404) throw new GabimIAsistentit("pa_konfigurim");
    const trupiIGabimit = await error.context.json().catch(() => null);
    const kodi = trupiIGabimit?.gabim;
    if (["kufiri", "pa_konfigurim", "refuzim", "foto", "i_zene", "pa_llogari"].includes(kodi)) {
      throw new GabimIAsistentit(kodi);
    }
  }
  throw new GabimIAsistentit("rrjeti");
}

export type FotojaPerAsistentin = { base64: string; uri: string };

// Selfie me kamerën e përparme ose foto nga galeria, e zvogëluar në 1024 px (Claude e lexon mirë,
// dërgohet shpejt dhe kushton më pak). null kur anulohet; "pa_leje" kur kamera refuzohet.
export async function merrFotonPerAsistentin(burimi: "kamera" | "galeria"): Promise<FotojaPerAsistentin | null | "pa_leje"> {
  const opsionet: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [3, 4],
    quality: 1,
    cameraType: ImagePicker.CameraType.front,
  };
  if (burimi === "kamera") {
    const leja = await ImagePicker.requestCameraPermissionsAsync();
    if (!leja.granted) return "pa_leje";
  }
  const zgjedhja =
    burimi === "kamera" ? await ImagePicker.launchCameraAsync(opsionet) : await ImagePicker.launchImageLibraryAsync(opsionet);
  const asset = zgjedhja.canceled ? null : zgjedhja.assets?.[0];
  if (!asset) return null;

  const konteksti = ImageManipulator.ImageManipulator.manipulate(asset.uri);
  konteksti.resize({ width: 1024, height: null });
  const imazhi = await konteksti.renderAsync();
  const rezultati = await imazhi.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress: 0.7, base64: true });
  if (!rezultati.base64) return null;
  return { base64: rezultati.base64, uri: rezultati.uri };
}

export function useKeshillaEStilit() {
  return useMutation({
    mutationFn: (foto: FotojaPerAsistentin) =>
      thirrAsistentin<KeshillaEStilit>({ veprimi: "stili", foto: foto.base64, lloji: "image/jpeg" }),
  });
}

export type RezultatiIRezervimit = { kerkesa: KerkesaERezervimit; oraret: OraEAsistentit[] };

// Claude e kthen fjalinë në shërbim + ditë + orë; pastaj serveri gjen orët e lira në lokalet pranë.
export function useRezervoMeFjale() {
  return useMutation({
    mutationFn: async (p: { teksti: string; pika: Koordinata; qytetiId: number | null }): Promise<RezultatiIRezervimit> => {
      const kerkesa = await thirrAsistentin<KerkesaERezervimit>({ veprimi: "rezervo", teksti: p.teksti });
      if (!kerkesa.e_qarte) return { kerkesa, oraret: [] };
      const { data, error } = await supabase.rpc("oraret_per_asistentin", {
        p_lat: p.pika.lat,
        p_lng: p.pika.lng,
        p_qyteti_id: p.qytetiId,
        p_kategoria: kerkesa.kategoria === "asnje" ? null : kerkesa.kategoria,
        p_data: kerkesa.data,
        p_ora_nga: kerkesa.ora_nga,
        p_ora_deri: kerkesa.ora_deri,
        p_limit: 6,
      });
      if (error) throw new GabimIAsistentit("rrjeti");
      return { kerkesa, oraret: (data ?? []) as OraEAsistentit[] };
    },
  });
}
