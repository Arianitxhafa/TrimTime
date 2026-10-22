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
};

export const ngjyratErrta: Ngjyrat = {
  sfondi: "#0B0B0F",
  siperfaqja: "#15151C",
  siperfaqja2: "#1D1D27",
  kufiri: "#2A2A36",
  ari: "#E8B04B",
  ariIErret: "#2A2213",
  teksti: "#F5F5F7",
  tekstiDyte: "#A1A1AE",
  tekstiZbehte: "#6B6B78",
  rrezik: "#F04452",
  rrezikSfond: "#2B1418",
  rrezikKufiri: "#4A1E25",
  mbiAri: "#14110A",
  mbulesa: "rgba(0,0,0,0.7)",
};

// Ari është më i errët në modin e çelët që teksti mbi të të ketë kontrast të mjaftueshëm.
export const ngjyratCelta: Ngjyrat = {
  sfondi: "#F7F5F0",
  siperfaqja: "#FFFFFF",
  siperfaqja2: "#F0EDE6",
  kufiri: "#E4E0D6",
  ari: "#C9952F",
  ariIErret: "#F6EBD3",
  teksti: "#15151C",
  tekstiDyte: "#5C5C68",
  tekstiZbehte: "#8E8E99",
  rrezik: "#D92D3A",
  rrezikSfond: "#FDE8EA",
  rrezikKufiri: "#F7C5CA",
  mbiAri: "#14110A",
  mbulesa: "rgba(21,21,28,0.45)",
};

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
