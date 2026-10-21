// Tipet e të dhënave siç i kthen Supabase (emrat e kolonave të databazës).

export type RoliNeLokal = "pronar" | "berber";

export type Lokali = {
  id: string;
  pronari_id: string;
  emri: string;
  pershkrimi: string | null;
  adresa: string;
  qyteti: string;
  telefoni: string | null;
  logo_url: string | null;
  kopertina_url: string | null;
  zona_kohore: string;
  i_publikuar: boolean;
  krijuar_me: string;
  lat: number;
  lng: number;
  i_hapur_tani: boolean;
  cmimi_min: number | null;
};

export type LokaliPrane = {
  id: string;
  emri: string;
  adresa: string;
  qyteti: string;
  logo_url: string | null;
  kopertina_url: string | null;
  lat: number;
  lng: number;
  distanca_m: number;
  i_hapur_tani: boolean;
  cmimi_min: number | null;
  nr_sherbimeve: number;
};

export type Sherbimi = {
  id: string;
  lokali_id: string;
  emri: string;
  pershkrimi: string | null;
  cmimi_centa: number;
  kohezgjatja_min: number;
  pushimi_pas_min: number;
  aktiv: boolean;
  renditja: number;
};

export type SherbimiIRi = Pick<Sherbimi, "emri" | "cmimi_centa" | "kohezgjatja_min"> &
  Partial<Pick<Sherbimi, "pershkrimi" | "aktiv" | "pushimi_pas_min">>;

// Ora ruhet si "HH:MM" (Postgres e kthen "HH:MM:SS").
export type IntervaliIOrarit = {
  dita: number;
  hapet: string;
  mbyllet: string;
};

export type AnetariIStafit = {
  profili_id: string;
  emri: string;
  foto_url: string | null;
  roli: RoliNeLokal;
  aktiv: boolean;
};

export type Koordinata = { lat: number; lng: number };

export type TeDhenatELokalit = {
  emri: string;
  pershkrimi: string | null;
  adresa: string;
  qyteti: string;
  telefoni: string | null;
  vendndodhja: Koordinata;
};
