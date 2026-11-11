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
  // Ngjyrat e tab-eve dhe të hartës, si te aplikacionet e Apple (Harta portokalli, Terminet blu).
  portokalli: string;
  blu: string;
};

// Pamja e ndritshme në stilin e Apple: gri e sistemit, karta të bardha, butona të zinj dhe ar
// i errësuar vetëm për theksim.
export const ngjyratCelta: Ngjyrat = {
  sfondi: "#F2F2F7",
  siperfaqja: "#FFFFFF",
  siperfaqja2: "#E9E9EE",
  kufiri: "#E3E3E8",
  ari: "#111111",
  ariIErret: "#F1ECE2",
  teksti: "#000000",
  tekstiDyte: "#5E5E63",
  tekstiZbehte: "#8E8E93",
  rrezik: "#FF3B30",
  rrezikSfond: "#FFE9E7",
  rrezikKufiri: "#FFC9C4",
  mbiAri: "#FFFFFF",
  mbulesa: "rgba(0,0,0,0.4)",
  gradientiAri: ["#2A2A2A", "#111111", "#000000"],
  xham: "rgba(255,255,255,0.86)",
  kufiriXham: "rgba(0,0,0,0.06)",
  hijaEFotos: ["rgba(0,0,0,0)", "rgba(0,0,0,0.78)"],
  theksi: "#FF3B30",
  vija: "#E3E3E8",
  bronzi: "#9A7B45",
  shiriti: ["#FF3B30", "#FFFFFF", "#0A84FF"],
  tabelat: ["#2C2C2E", "#2B241A", "#1E2633", "#2E1F22"],
  portokalli: "#FF9500",
  blu: "#007AFF",
};

// Pamja kryesore: e zezë OLED, karta gri të errëta dhe ar shampanjë vetëm te veprimet.
export const ngjyratErrta: Ngjyrat = {
  sfondi: "#000000",
  siperfaqja: "#1C1C1E",
  siperfaqja2: "#2C2C2E",
  kufiri: "#2A2A2D",
  ari: "#D4B483",
  ariIErret: "#2A2418",
  teksti: "#FFFFFF",
  tekstiDyte: "#AEAEB2",
  tekstiZbehte: "#8E8E93",
  rrezik: "#FF453A",
  rrezikSfond: "#3A1513",
  rrezikKufiri: "#5C211D",
  mbiAri: "#000000",
  mbulesa: "rgba(0,0,0,0.6)",
  gradientiAri: ["#E6CC9E", "#D4B483", "#B8955F"],
  xham: "rgba(44,44,46,0.82)",
  kufiriXham: "rgba(255,255,255,0.08)",
  hijaEFotos: ["rgba(0,0,0,0)", "rgba(0,0,0,0.85)"],
  theksi: "#FF453A",
  vija: "#2A2A2D",
  bronzi: "#D4B483",
  shiriti: ["#FF453A", "#FFFFFF", "#0A84FF"],
  tabelat: ["#1C1C1E", "#2A2418", "#1A2230", "#2A1C1F"],
  portokalli: "#FF9F0A",
  blu: "#0A84FF",
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
  perfunduar: { ngjyra: "#D4B483", sfondi: "#2A2418", ikona: ikonatEStatuseve.perfunduar },
  anuluar: { ngjyra: "#FF453A", sfondi: "#3A1513", ikona: ikonatEStatuseve.anuluar },
  nuk_erdhi: { ngjyra: "#AEAEB2", sfondi: "#2C2C2E", ikona: ikonatEStatuseve.nuk_erdhi },
};

export const statusetMetaCelta: StatusetMeta = {
  ne_pritje: { ngjyra: "#9A6A00", sfondi: "#FFF4CC", ikona: ikonatEStatuseve.ne_pritje },
  konfirmuar: { ngjyra: "#1E8E3E", sfondi: "#DFF6E4", ikona: ikonatEStatuseve.konfirmuar },
  perfunduar: { ngjyra: "#111111", sfondi: "#E9E9EE", ikona: ikonatEStatuseve.perfunduar },
  anuluar: { ngjyra: "#D70015", sfondi: "#FFE9E7", ikona: ikonatEStatuseve.anuluar },
  nuk_erdhi: { ngjyra: "#5E5E63", sfondi: "#E9E9EE", ikona: ikonatEStatuseve.nuk_erdhi },
};
