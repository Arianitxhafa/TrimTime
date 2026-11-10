import type { EmriIkones } from "../components/Ikona";
import type { StatusiTerminit } from "../lib/tipet";

export type Ngjyrat = {
  sfondi: string;
  siperfaqja: string;
  siperfaqja2: string;
  kufiri: string;
  // Ngjyra kryesore e veprimeve (butonat, ikonat aktive): e gjelbër berberie në dritë, bronz në errësirë.
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
  // Bronzi i tabelave të berberisë, i errësuar sa duhet që teksti të lexohet.
  bronzi: string;
  // Ngjyrat e shiritit të berberit: e kuqe, krem, blu.
  shiriti: readonly [string, string, string];
  // Sfondi i tabelave të lokaleve pa foto (zgjidhet sipas emrit).
  tabelat: readonly string[];
};

// "Barbershop klasik" i ditës: letër krem, bojë e gjelbër e thellë dhe bronz.
export const ngjyratCelta: Ngjyrat = {
  sfondi: "#F4ECDD",
  siperfaqja: "#FBF7EE",
  siperfaqja2: "#ECE2CF",
  kufiri: "#DDCFB4",
  ari: "#1F3A2E",
  ariIErret: "#E2E6D6",
  teksti: "#1B2620",
  tekstiDyte: "#4D5A51",
  tekstiZbehte: "#7A8378",
  rrezik: "#A3221D",
  rrezikSfond: "#F6E0DA",
  rrezikKufiri: "#E8BDB4",
  mbiAri: "#F7F0E2",
  mbulesa: "rgba(19,38,29,0.5)",
  gradientiAri: ["#2A4B3C", "#1F3A2E", "#16291F"],
  xham: "rgba(251,247,238,0.94)",
  kufiriXham: "rgba(31,58,46,0.16)",
  hijaEFotos: ["rgba(16,30,23,0)", "rgba(16,30,23,0.85)"],
  theksi: "#B3261E",
  vija: "#C9AE7E",
  bronzi: "#80612F",
  shiriti: ["#B3261E", "#F7F0E2", "#1F4E8C"],
  tabelat: ["#1F3A2E", "#3A2A1E", "#1D2E44", "#4A1F24"],
};

// "Barbershop klasik" i natës: e gjelbër e thellë, krem dhe bronz i ndritshëm.
export const ngjyratErrta: Ngjyrat = {
  sfondi: "#12241B",
  siperfaqja: "#183026",
  siperfaqja2: "#203C30",
  kufiri: "#2E4C3E",
  ari: "#CDAA6D",
  ariIErret: "#24392C",
  teksti: "#F3E9D6",
  tekstiDyte: "#C5BCA8",
  tekstiZbehte: "#8F9C90",
  rrezik: "#F2786C",
  rrezikSfond: "#3A1E1A",
  rrezikKufiri: "#5A2A24",
  mbiAri: "#12241B",
  mbulesa: "rgba(0,0,0,0.65)",
  gradientiAri: ["#DCBD84", "#CDAA6D", "#B8935A"],
  xham: "rgba(18,36,27,0.92)",
  kufiriXham: "rgba(205,170,109,0.3)",
  hijaEFotos: ["rgba(10,22,16,0)", "rgba(10,22,16,0.88)"],
  theksi: "#E5574D",
  vija: "#4C6A55",
  bronzi: "#CDAA6D",
  shiriti: ["#C7302A", "#F3E9D6", "#2D63A8"],
  tabelat: ["#1C3A2C", "#3B2B1F", "#1E3048", "#4B2126"],
};

// Hije e butë, si një tabelë e varur në mur.
export const hijet = {
  karte: {
    shadowColor: "#0B1A12",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  ari: {
    shadowColor: "#0B1A12",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
} as const;

// Titujt me Fraunces (serif klasik i tabelave) dhe etiketat me Inter, që lexohet mirë edhe e vogël.
// Ngarkohen te _layout.tsx; teksti i zakonshëm mbetet me shkronjat e sistemit.
export const shkronjat = {
  titull: "Fraunces_700Bold",
  titullBold: "Fraunces_600SemiBold",
  kursive: "Fraunces_400Regular_Italic",
  kursiveBold: "Fraunces_600SemiBold_Italic",
  etikete: "Inter_600SemiBold",
  etiketeBold: "Inter_700Bold",
} as const;

export const hapesira = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

// Kënde të buta, si buzët e një tabele druri.
export const rrezja = {
  sm: 6,
  md: 10,
  lg: 16,
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

export const statusetMetaErrta: StatusetMeta = {
  ne_pritje: { ngjyra: "#E7C27A", sfondi: "#33301B", ikona: ikonatEStatuseve.ne_pritje },
  konfirmuar: { ngjyra: "#8FD19E", sfondi: "#1D3A27", ikona: ikonatEStatuseve.konfirmuar },
  perfunduar: { ngjyra: "#F3E9D6", sfondi: "#2A4234", ikona: ikonatEStatuseve.perfunduar },
  anuluar: { ngjyra: "#F2786C", sfondi: "#3A1E1A", ikona: ikonatEStatuseve.anuluar },
  nuk_erdhi: { ngjyra: "#C5BCA8", sfondi: "#203C30", ikona: ikonatEStatuseve.nuk_erdhi },
};

export const statusetMetaCelta: StatusetMeta = {
  ne_pritje: { ngjyra: "#835500", sfondi: "#F3E3BF", ikona: ikonatEStatuseve.ne_pritje },
  konfirmuar: { ngjyra: "#1E5E34", sfondi: "#D9EAD5", ikona: ikonatEStatuseve.konfirmuar },
  perfunduar: { ngjyra: "#1F3A2E", sfondi: "#E2E6D6", ikona: ikonatEStatuseve.perfunduar },
  anuluar: { ngjyra: "#A3221D", sfondi: "#F6E0DA", ikona: ikonatEStatuseve.anuluar },
  nuk_erdhi: { ngjyra: "#4D5A51", sfondi: "#ECE2CF", ikona: ikonatEStatuseve.nuk_erdhi },
};
