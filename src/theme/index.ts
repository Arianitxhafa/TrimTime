import type { EmriIkones } from "../components/Ikona";
import type { StatusiTerminit } from "../lib/tipet";

export type Ngjyrat = {
  sfondi: string;
  siperfaqja: string;
  siperfaqja2: string;
  kufiri: string;
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
  // Gradienti i arit (butonat kryesorë, theksimet): nga i ndriçuari te i thelli.
  gradientiAri: readonly [string, string, string];
  // Mbushja e kartave "xham" kur blur-i nuk është i disponueshëm (Android, web).
  xham: string;
  kufiriXham: string;
  // Gradienti mbi fotot, që teksti i bardhë të lexohet.
  hijaEFotos: readonly [string, string];
  // E kuqja e revistës: përdoret rrallë, vetëm për theksim (numra, zbritje, pika).
  theksi: string;
  // Vijat e holla që ndajnë seksionet, si në faqen e një reviste.
  vija: string;
};

// Dizajni "editorial": letër krem, bojë e zezë dhe një e kuqe. "Ari" mbetet emri i ngjyrës
// kryesore në kod (butonat, ikonat), por tani është boja e zezë e faqes.
export const ngjyratCelta: Ngjyrat = {
  sfondi: "#F3EEE4",
  siperfaqja: "#FAF7F0",
  siperfaqja2: "#E9E2D4",
  kufiri: "#D5CCBB",
  ari: "#15130F",
  ariIErret: "#E6DECE",
  teksti: "#15130F",
  tekstiDyte: "#5A5448",
  tekstiZbehte: "#928A7B",
  rrezik: "#B8102B",
  rrezikSfond: "#F4E1DE",
  rrezikKufiri: "#E7BFB9",
  mbiAri: "#F3EEE4",
  mbulesa: "rgba(21,19,15,0.5)",
  gradientiAri: ["#15130F", "#15130F", "#15130F"],
  xham: "rgba(243,238,228,0.94)",
  kufiriXham: "rgba(21,19,15,0.14)",
  hijaEFotos: ["rgba(21,19,15,0)", "rgba(21,19,15,0.86)"],
  theksi: "#C8102E",
  vija: "#15130F",
};

// "Botimi i natës": e njëjta faqe me ngjyrat e kthyera.
export const ngjyratErrta: Ngjyrat = {
  sfondi: "#11100E",
  siperfaqja: "#191815",
  siperfaqja2: "#24221D",
  kufiri: "#38342C",
  ari: "#F1EADC",
  ariIErret: "#2A2721",
  teksti: "#F1EADC",
  tekstiDyte: "#ADA594",
  tekstiZbehte: "#756E61",
  rrezik: "#EF5A5F",
  rrezikSfond: "#2C1716",
  rrezikKufiri: "#4C2422",
  mbiAri: "#11100E",
  mbulesa: "rgba(0,0,0,0.72)",
  gradientiAri: ["#F1EADC", "#F1EADC", "#F1EADC"],
  xham: "rgba(17,16,14,0.94)",
  kufiriXham: "rgba(241,234,220,0.14)",
  hijaEFotos: ["rgba(17,16,14,0)", "rgba(17,16,14,0.88)"],
  theksi: "#EF5A5F",
  vija: "#F1EADC",
};

// Revista është e sheshtë: pa hije. Emrat mbeten që komponentët të mos ndryshojnë.
export const hijet = {
  karte: {},
  ari: {},
} as const;

// Titujt me serif (Playfair Display) dhe etiketat me mono (IBM Plex Mono), si në një revistë.
// Ngarkohen te _layout.tsx; teksti i zakonshëm mbetet me shkronjat e sistemit.
export const shkronjat = {
  titull: "PlayfairDisplay_900Black",
  titullBold: "PlayfairDisplay_700Bold",
  kursive: "PlayfairDisplay_400Regular_Italic",
  kursiveBold: "PlayfairDisplay_700Bold_Italic",
  mono: "IBMPlexMono_500Medium",
  monoBold: "IBMPlexMono_600SemiBold",
} as const;

export const hapesira = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

// Këndet janë pothuajse të drejta, si faqja e shtypur.
export const rrezja = {
  sm: 2,
  md: 3,
  lg: 4,
  plote: 2,
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

// Ngjyra boje të zbehura, si në letër të shtypur.
export const statusetMetaErrta: StatusetMeta = {
  ne_pritje: { ngjyra: "#E0B05A", sfondi: "#2B2416", ikona: ikonatEStatuseve.ne_pritje },
  konfirmuar: { ngjyra: "#7FB98B", sfondi: "#18251B", ikona: ikonatEStatuseve.konfirmuar },
  perfunduar: { ngjyra: "#F1EADC", sfondi: "#2A2721", ikona: ikonatEStatuseve.perfunduar },
  anuluar: { ngjyra: "#EF5A5F", sfondi: "#2C1716", ikona: ikonatEStatuseve.anuluar },
  nuk_erdhi: { ngjyra: "#ADA594", sfondi: "#24221D", ikona: ikonatEStatuseve.nuk_erdhi },
};

export const statusetMetaCelta: StatusetMeta = {
  ne_pritje: { ngjyra: "#8A5A00", sfondi: "#F1E4C8", ikona: ikonatEStatuseve.ne_pritje },
  konfirmuar: { ngjyra: "#245C33", sfondi: "#DDE8D6", ikona: ikonatEStatuseve.konfirmuar },
  perfunduar: { ngjyra: "#15130F", sfondi: "#E6DECE", ikona: ikonatEStatuseve.perfunduar },
  anuluar: { ngjyra: "#B8102B", sfondi: "#F4E1DE", ikona: ikonatEStatuseve.anuluar },
  nuk_erdhi: { ngjyra: "#5A5448", sfondi: "#E9E2D4", ikona: ikonatEStatuseve.nuk_erdhi },
};
