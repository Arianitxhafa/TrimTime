// Tipet e të dhënave siç i kthen Supabase (emrat e kolonave të databazës).

export type RoliNeLokal = "pronar" | "berber";

export type Lokali = {
  id: string;
  pronari_id: string | null;
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
  burimi: BurimiILokalit;
  pranimi_automatik: boolean;
  anulimi_deri_ore: number;
};

// "osm": lokal i importuar nga OpenStreetMap, pa pronar në TrimTime.
export type BurimiILokalit = "trimtime" | "osm";

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
  burimi: BurimiILokalit;
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

export type StatusiTerminit = "ne_pritje" | "konfirmuar" | "perfunduar" | "anuluar" | "nuk_erdhi";

export const STATUSET: StatusiTerminit[] = ["ne_pritje", "konfirmuar", "perfunduar", "anuluar", "nuk_erdhi"];

// Statuset që ende zënë kohën e berberit.
export const STATUSET_AKTIVE: StatusiTerminit[] = ["ne_pritje", "konfirmuar"];

export type OraELire = {
  fillon_me: string;
  // "HH:MM" sipas orës së lokalit.
  ora: string;
  berberi_id: string;
};

export type TerminiIKlientit = {
  id: string;
  lokali_id: string;
  lokali_emri: string;
  lokali_adresa: string;
  lokali_qyteti: string;
  lokali_logo_url: string | null;
  lokali_telefoni: string | null;
  lat: number;
  lng: number;
  sherbimi_id: string;
  sherbimi_emri: string;
  kohezgjatja_min: number;
  berberi_id: string;
  berberi_emri: string;
  fillon_me: string;
  // "YYYY-MM-DD" dhe "HH:MM" sipas orës së lokalit.
  data_lokale: string;
  ora_lokale: string;
  statusi: StatusiTerminit;
  cmimi_centa: number;
  shenime: string | null;
  mund_te_ndryshohet: boolean;
};

export type TerminiILokalit = {
  id: string;
  klienti_id: string | null;
  klienti_emri: string;
  klienti_telefoni: string | null;
  sherbimi_id: string;
  sherbimi_emri: string;
  kohezgjatja_min: number;
  berberi_id: string;
  berberi_emri: string;
  fillon_me: string;
  ora_lokale: string;
  statusi: StatusiTerminit;
  cmimi_centa: number;
  shenime: string | null;
};

export type TerminiIKalendarit = {
  id: string;
  klienti_emri: string;
  sherbimi_emri: string;
  kohezgjatja_min: number;
  berberi_id: string;
  berberi_emri: string;
  fillon_me: string;
  data_lokale: string;
  ora_lokale: string;
  // Minutat nga mesnata sipas orës së lokalit, për pozicionin në kalendar.
  minuta_e_dites: number;
  statusi: StatusiTerminit;
  cmimi_centa: number;
};

export type Pushimi = {
  id: string;
  profili_id: string;
  fillon_me: string;
  mbaron_me: string;
  arsyeja: string | null;
};

export type KlientiILokalit = {
  // "id:…", "tel:…" ose "emri:…" (shih celesi_i_klientit në databazë).
  celesi: string;
  emri: string;
  telefoni: string | null;
  klienti_id: string | null;
  vizita: number;
  shpenzuar_centa: number;
  vizita_e_fundit: string | null;
  termini_i_ardhshem: string | null;
  nuk_erdhi: number;
  vip: boolean;
  shenime: string | null;
};

export type VizitaEKlientit = {
  id: string;
  data_lokale: string;
  ora_lokale: string;
  sherbimi_emri: string;
  berberi_emri: string;
  statusi: StatusiTerminit;
  cmimi_centa: number;
  shenime: string | null;
};

type RreshtiIAnalitikes = { emri: string; termine: number; te_ardhura: number };

export type Analitika = {
  te_ardhura: number;
  termine: number;
  perfunduar: number;
  anuluar: number;
  nuk_erdhi: number;
  klientet_e_rinj: number;
  klientet_qe_kthehen: number;
  sipas_dites: { data: string; termine: number; te_ardhura: number }[];
  sherbimet: RreshtiIAnalitikes[];
  berberet: RreshtiIAnalitikes[];
  oret: { ora: number; termine: number }[];
};
