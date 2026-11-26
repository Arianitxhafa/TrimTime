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

// Studio Burimi: bardh e zi si logoja, me të kuqen dhe blunë e shtyllës së berberit vetëm për theksim.
// Pamja e ndritshme: letër e ngrohtë, karta të bardha, butona të zinj.
export const ngjyratCelta: Ngjyrat = {
  sfondi: "#F4F2EE",
  siperfaqja: "#FFFFFF",
  siperfaqja2: "#EAE7E1",
  kufiri: "#E0DCD4",
  ari: "#0A0A0A",
  ariIErret: "#EFEBE4",
  teksti: "#0A0A0A",
  tekstiDyte: "#57534D",
  tekstiZbehte: "#8A857D",
  rrezik: "#D92D20",
  rrezikSfond: "#FDECEA",
  rrezikKufiri: "#F7C6C0",
  mbiAri: "#FFFFFF",
  mbulesa: "rgba(0,0,0,0.4)",
  gradientiAri: ["#2A2A2A", "#111111", "#000000"],
  xham: "rgba(255,255,255,0.84)",
  kufiriXham: "rgba(0,0,0,0.07)",
  hijaEFotos: ["rgba(0,0,0,0)", "rgba(0,0,0,0.78)"],
  theksi: "#C62F34",
  vija: "#E0DCD4",
  bronzi: "#C62F34",
  shiriti: ["#C62F34", "#FFFFFF", "#1F5BC6"],
  tabelat: ["#1A1A1A", "#262320", "#1B2230", "#2A1C1D"],
  jeshile: "#248A3D",
  portokalli: "#E07A00",
  blu: "#1F5BC6",
  vjollce: "#8E44AD",
  roze: "#D6336C",
};

// Pamja kryesore: e zezë si logoja, karta grafit dhe butona të bardhë kockë.
export const ngjyratErrta: Ngjyrat = {
  sfondi: "#0A0A0A",
  siperfaqja: "#161616",
  siperfaqja2: "#232323",
  kufiri: "#2A2A2A",
  ari: "#F4F1EA",
  ariIErret: "#24221F",
  teksti: "#F7F5F0",
  tekstiDyte: "#A8A49C",
  tekstiZbehte: "#77736C",
  rrezik: "#FF5A4F",
  rrezikSfond: "#3A1513",
  rrezikKufiri: "#5C211D",
  mbiAri: "#0A0A0A",
  mbulesa: "rgba(0,0,0,0.6)",
  gradientiAri: ["#FFFFFF", "#F4F1EA", "#D9D4C9"],
  xham: "rgba(22,22,22,0.8)",
  kufiriXham: "rgba(255,255,255,0.09)",
  hijaEFotos: ["rgba(0,0,0,0)", "rgba(0,0,0,0.85)"],
  theksi: "#E5484D",
  vija: "#2A2A2A",
  bronzi: "#E5484D",
  shiriti: ["#E5484D", "#F4F1EA", "#2F6FDE"],
  tabelat: ["#161616", "#24221F", "#1A2230", "#2A1C1F"],
  jeshile: "#30D158",
  portokalli: "#FF9F0A",
  blu: "#2F6FDE",
  vjollce: "#BF5AF2",
  roze: "#FF375F",
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
  perfunduar: { ngjyra: "#F4F1EA", sfondi: "#24221F", ikona: ikonatEStatuseve.perfunduar },
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
