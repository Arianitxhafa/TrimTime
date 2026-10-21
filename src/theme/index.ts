import type { EmriIkones } from "../components/Ikona";
import type { StatusiTerminit } from "../data/terminet";

export const ngjyrat = {
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
  mbiAri: "#14110A",
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

type MetaStatusi = {
  ngjyra: string;
  sfondi: string;
  ikona: EmriIkones;
};

export const statusetMeta: Record<StatusiTerminit, MetaStatusi> = {
  "Në pritje": {
    ngjyra: "#F5A524",
    sfondi: "#2B2112",
    ikona: { ios: "hourglass", android: "hourglass_top" },
  },
  Konfirmuar: {
    ngjyra: "#3DD68C",
    sfondi: "#11271D",
    ikona: { ios: "checkmark.circle.fill", android: "check_circle" },
  },
  Përfunduar: {
    ngjyra: "#7C9CFF",
    sfondi: "#161C33",
    ikona: { ios: "checkmark.seal.fill", android: "task_alt" },
  },
  Anuluar: {
    ngjyra: "#F04452",
    sfondi: "#2B1418",
    ikona: { ios: "xmark.circle.fill", android: "cancel" },
  },
};
