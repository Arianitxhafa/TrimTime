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
};

export const ngjyratErrta: Ngjyrat = {
  sfondi: "#0B0B0F",
  siperfaqja: "#141419",
  siperfaqja2: "#1C1C23",
  kufiri: "#26262F",
  ari: "#D4A853",
  ariIErret: "#2A2214",
  teksti: "#F7F5F0",
  tekstiDyte: "#A6A3AD",
  tekstiZbehte: "#6C6A75",
  rrezik: "#F04452",
  rrezikSfond: "#2B1418",
  rrezikKufiri: "#4A1E25",
  mbiAri: "#17120A",
  mbulesa: "rgba(0,0,0,0.72)",
  gradientiAri: ["#F3D79A", "#D4A853", "#A8802F"],
  xham: "rgba(22,22,28,0.72)",
  kufiriXham: "rgba(255,255,255,0.09)",
  hijaEFotos: ["rgba(11,11,15,0)", "rgba(11,11,15,0.92)"],
};

// Ari është më i errët në modin e çelët që teksti mbi të të ketë kontrast të mjaftueshëm.
export const ngjyratCelta: Ngjyrat = {
  sfondi: "#F7F5F0",
  siperfaqja: "#FFFFFF",
  siperfaqja2: "#F0EDE6",
  kufiri: "#E6E1D6",
  ari: "#B8862B",
  ariIErret: "#F6EBD3",
  teksti: "#15151C",
  tekstiDyte: "#5C5C68",
  tekstiZbehte: "#8E8E99",
  rrezik: "#D92D3A",
  rrezikSfond: "#FDE8EA",
  rrezikKufiri: "#F7C5CA",
  mbiAri: "#17120A",
  mbulesa: "rgba(21,21,28,0.45)",
  gradientiAri: ["#EBC77A", "#C9972F", "#9C7222"],
  xham: "rgba(255,255,255,0.78)",
  kufiriXham: "rgba(21,21,28,0.08)",
  hijaEFotos: ["rgba(11,11,15,0)", "rgba(11,11,15,0.85)"],
};

// Hije e butë dhe e thellë për kartat që "ngrihen" mbi sfond.
export const hijet = {
  karte: {
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  ari: {
    shadowColor: "#D4A853",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

export const hapesira = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const rrezja = {
  sm: 10,
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

export const statusetMetaErrta: StatusetMeta = {
  ne_pritje: { ngjyra: "#F5A524", sfondi: "#2B2112", ikona: ikonatEStatuseve.ne_pritje },
  konfirmuar: { ngjyra: "#3DD68C", sfondi: "#11271D", ikona: ikonatEStatuseve.konfirmuar },
  perfunduar: { ngjyra: "#7C9CFF", sfondi: "#161C33", ikona: ikonatEStatuseve.perfunduar },
  anuluar: { ngjyra: "#F04452", sfondi: "#2B1418", ikona: ikonatEStatuseve.anuluar },
  nuk_erdhi: { ngjyra: "#A1A1AE", sfondi: "#1D1D27", ikona: ikonatEStatuseve.nuk_erdhi },
};

export const statusetMetaCelta: StatusetMeta = {
  ne_pritje: { ngjyra: "#B26A00", sfondi: "#FDF1DC", ikona: ikonatEStatuseve.ne_pritje },
  konfirmuar: { ngjyra: "#1A8754", sfondi: "#E2F5EA", ikona: ikonatEStatuseve.konfirmuar },
  perfunduar: { ngjyra: "#3B5BD9", sfondi: "#E8EDFD", ikona: ikonatEStatuseve.perfunduar },
  anuluar: { ngjyra: "#D92D3A", sfondi: "#FDE8EA", ikona: ikonatEStatuseve.anuluar },
  nuk_erdhi: { ngjyra: "#5C5C68", sfondi: "#F0EDE6", ikona: ikonatEStatuseve.nuk_erdhi },
};
