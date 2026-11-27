import type { EmriIkones } from "../components/Ikona";
import type { StatusiTerminit } from "../lib/tipet";

export type Ngjyrat = {
  sfondi: string;
  siperfaqja: string;
  siperfaqja2: string;
  kufiri: string;
  // Ngjyra kryesore e veprimeve (butonat, ikonat aktive): ar shampanjë në errësirë, e zezë në dritë.
  ari: string;
  ariIErret: string;
  teksti: string;
  tekstiDyte: string;
  tekstiZbehte: string;
  rrezik: string;
  rrezikSfond: string;
  rrezikKufiri: string;
  mbiAri: string;
  mbulesa: string;
  gradientiAri: readonly [string, string, string];
  // Mbushja e etiketave mbi foto.
  xham: string;
  kufiriXham: string;
  // Gradienti mbi fotot, që teksti i bardhë të lexohet.
  hijaEFotos: readonly [string, string];
  // E kuqja e shiritit të berberit: vetëm për theksim (zbritje, pika, njoftime).
  theksi: string;
  // Vijat e holla prej bronzi që ndajnë seksionet.
  vija: string;
  // Ari i theksimeve (oraret e lira, etiketat), i errësuar në dritë që të lexohet.
  bronzi: string;
  // Ngjyrat e shiritit të berberit: e kuqe, krem, blu.
  shiriti: readonly [string, string, string];
  // Sfondi i kopertinave të lokaleve pa foto (zgjidhet sipas emrit).
  tabelat: readonly string[];
  // Ngjyrat e tab-eve, si te aplikacionet e Apple: Zbulo jeshile, Harta portokalli, Terminet blu,
  // Profili vjollcë.
  jeshile: string;
  portokalli: string;
  blu: string;
  vjollce: string;
  // Tab-i Lokali te berberi.
  roze: string;
};

// Studio Burimi: krem i ngrohtë dhe ar, si një berberi klasike. Ari i errët (kafe-ari) mbart veprimet
// në dritë, ari i ndritshëm në errësirë; e kuqja dhe bluja e shtyllës së berberit mbeten për theksim.
// Pamja e ndritshme (kryesore): letër krem, karta të bardha, butona ari të errët.
export const ngjyratCelta: Ngjyrat = {
  sfondi: "#F6F3EE",
  siperfaqja: "#FFFFFF",
  siperfaqja2: "#EFE9DF",
  kufiri: "#E6DCCB",
  ari: "#8B6914",
  ariIErret: "#F3EAD7",
  teksti: "#1A1712",
  tekstiDyte: "#6B6256",
  tekstiZbehte: "#9A9184",
  rrezik: "#C0392B",
  rrezikSfond: "#FBEAE7",
  rrezikKufiri: "#F2C9C2",
  mbiAri: "#FFFFFF",
  mbulesa: "rgba(26,23,18,0.4)",
  gradientiAri: ["#A57E1E", "#8B6914", "#6E5310"],
  xham: "rgba(255,255,255,0.88)",
  kufiriXham: "rgba(139,105,20,0.14)",
  hijaEFotos: ["rgba(0,0,0,0)", "rgba(0,0,0,0.78)"],
  theksi: "#D4A833",
  vija: "#E6DCCB",
  bronzi: "#8B6914",
  shiriti: ["#C62F34", "#FFFFFF", "#1F5BC6"],
  tabelat: ["#2A2418", "#3A2F1A", "#1E2633", "#2E1F22"],
  jeshile: "#2E7D4F",
  portokalli: "#B7791F",
  blu: "#1F5BC6",
  vjollce: "#7A4E9E",
  roze: "#B83A5E",
};

// Pamja e errët: e zezë e ngrohtë, karta grafit me kufi ari dhe butona ari të ndritshëm.
export const ngjyratErrta: Ngjyrat = {
  sfondi: "#0B0B0A",
  siperfaqja: "#171614",
  siperfaqja2: "#22201C",
  kufiri: "#3A3220",
  ari: "#D4A833",
  ariIErret: "#2A2414",
  teksti: "#F6F1E7",
  tekstiDyte: "#B8AE9C",
  tekstiZbehte: "#857C6E",
  rrezik: "#FF6B5E",
  rrezikSfond: "#3A1513",
  rrezikKufiri: "#5C211D",
  mbiAri: "#1A1712",
  mbulesa: "rgba(0,0,0,0.6)",
  gradientiAri: ["#E6C25A", "#D4A833", "#B08A22"],
  xham: "rgba(23,22,20,0.84)",
  kufiriXham: "rgba(212,168,51,0.18)",
  hijaEFotos: ["rgba(0,0,0,0)", "rgba(0,0,0,0.85)"],
  theksi: "#D4A833",
  vija: "#3A3220",
  bronzi: "#D4A833",
  shiriti: ["#E5484D", "#F4F1EA", "#2F6FDE"],
  tabelat: ["#171614", "#2A2414", "#1A2230", "#2A1C1F"],
  jeshile: "#3DBE6E",
  portokalli: "#E0A030",
  blu: "#4A8BEF",
  vjollce: "#B48BE0",
  roze: "#E86A8E",
};

// Si Apple: pa hije në errësirë; vetëm një hije shumë e lehtë te kartat në dritë.
export const hijet = {
  karte: {},
  ari: {},
} as const;

// SF Pro (shkronjat e sistemit) me peshat e Apple. Përdoren me "...shkronjat.titull" brenda stileve.
export const shkronjat = {
  titull: { fontFamily: "System", fontWeight: "700" },
  titullBold: { fontFamily: "System", fontWeight: "600" },
  kursive: { fontFamily: "System", fontWeight: "400" },
  kursiveBold: { fontFamily: "System", fontWeight: "600" },
  etikete: { fontFamily: "System", fontWeight: "500" },
  etiketeBold: { fontFamily: "System", fontWeight: "600" },
} as const;

export const hapesira = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

// Kënde të buta si te iOS (kartat 20, butonat 14).
export const rrezja = {
  sm: 8,
  md: 14,
  lg: 20,
  plote: 999,
} as const;

export type MetaStatusi = {
  ngjyra: string;
  sfondi: string;
  ikona: EmriIkones;
};

export type StatusetMeta = Record<StatusiTerminit, MetaStatusi>;

const ikonatEStatuseve: Record<StatusiTerminit, EmriIkones> = {
  ne_pritje: { ios: "hourglass", android: "hourglass_top" },
  konfirmuar: { ios: "checkmark.circle.fill", android: "check_circle" },
  perfunduar: { ios: "checkmark.seal.fill", android: "task_alt" },
  anuluar: { ios: "xmark.circle.fill", android: "cancel" },
  nuk_erdhi: { ios: "person.fill.xmark", android: "person_off" },
};

// Ngjyrat e sistemit të Apple për statuset.
export const statusetMetaErrta: StatusetMeta = {
  ne_pritje: { ngjyra: "#FFD60A", sfondi: "#332B05", ikona: ikonatEStatuseve.ne_pritje },
  konfirmuar: { ngjyra: "#30D158", sfondi: "#0E2E17", ikona: ikonatEStatuseve.konfirmuar },
  perfunduar: { ngjyra: "#D4A833", sfondi: "#2A2414", ikona: ikonatEStatuseve.perfunduar },
  anuluar: { ngjyra: "#FF453A", sfondi: "#3A1513", ikona: ikonatEStatuseve.anuluar },
  nuk_erdhi: { ngjyra: "#AEAEB2", sfondi: "#2C2C2E", ikona: ikonatEStatuseve.nuk_erdhi },
};

export const statusetMetaCelta: StatusetMeta = {
  ne_pritje: { ngjyra: "#9A6A00", sfondi: "#FFF4CC", ikona: ikonatEStatuseve.ne_pritje },
  konfirmuar: { ngjyra: "#1E8E3E", sfondi: "#DFF6E4", ikona: ikonatEStatuseve.konfirmuar },
  perfunduar: { ngjyra: "#8B6914", sfondi: "#F3EAD7", ikona: ikonatEStatuseve.perfunduar },
  anuluar: { ngjyra: "#D70015", sfondi: "#FFE9E7", ikona: ikonatEStatuseve.anuluar },
  nuk_erdhi: { ngjyra: "#5E5E63", sfondi: "#E9E9EE", ikona: ikonatEStatuseve.nuk_erdhi },
};
