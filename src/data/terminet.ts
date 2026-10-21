export type StatusiTerminit = "Në pritje" | "Konfirmuar" | "Përfunduar" | "Anuluar";

export const statuset: StatusiTerminit[] = [
  "Në pritje",
  "Konfirmuar",
  "Përfunduar",
  "Anuluar",
];

export type Sherbimi = {
  emri: string;
  cmimi: number;
  kohezgjatja: number;
};

export const sherbimet: Sherbimi[] = [
  { emri: "Prerje klasike", cmimi: 8, kohezgjatja: 30 },
  { emri: "Prerje moderne", cmimi: 10, kohezgjatja: 40 },
  { emri: "Prerje dhe mjekër", cmimi: 13, kohezgjatja: 50 },
  { emri: "Rregullim i mjekrës", cmimi: 5, kohezgjatja: 20 },
  { emri: "Prerje dhe larje", cmimi: 11, kohezgjatja: 45 },
];

export function gjejSherbimin(emri: string): Sherbimi | undefined {
  return sherbimet.find((s) => s.emri === emri);
}

export const oraretEPunes: string[] = Array.from({ length: 19 }, (_, i) => {
  const minutat = 9 * 60 + i * 30;
  const ora = String(Math.floor(minutat / 60)).padStart(2, "0");
  const min = String(minutat % 60).padStart(2, "0");
  return `${ora}:${min}`;
});

export type Termini = {
  id: string;
  klienti: string;
  sherbimi: string;
  ora: string;
  statusi: StatusiTerminit;
  telefoni?: string;
  shenime?: string;
};

export const terminet: Termini[] = [
  {
    id: "1",
    klienti: "Ardi Krasniqi",
    sherbimi: "Prerje klasike",
    ora: "10:00",
    statusi: "Konfirmuar",
    telefoni: "+383 44 123 456",
  },
  {
    id: "2",
    klienti: "Luan Berisha",
    sherbimi: "Prerje dhe mjekër",
    ora: "11:30",
    statusi: "Në pritje",
  },
  {
    id: "3",
    klienti: "Dion Gashi",
    sherbimi: "Rregullim i mjekrës",
    ora: "13:00",
    statusi: "Përfunduar",
  },
  {
    id: "4",
    klienti: "Erion Berisha",
    sherbimi: "Prerje moderne",
    ora: "14:00",
    statusi: "Në pritje",
    shenime: "Preferon anët shumë të shkurtra.",
  },
  {
    id: "5",
    klienti: "Altin Gashi",
    sherbimi: "Prerje dhe larje",
    ora: "15:00",
    statusi: "Konfirmuar",
  },
  {
    id: "6",
    klienti: "Blerim Hoxha",
    sherbimi: "Rregullim i mjekrës",
    ora: "16:00",
    statusi: "Në pritje",
  },
];
