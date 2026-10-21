export type StatusiTerminit = "Në pritje" | "Konfirmuar" | "Përfunduar";

export type Termini = {
  id: string;
  klienti: string;
  sherbimi: string;
  ora: string;
  statusi: StatusiTerminit;
};

export const terminet: Termini[] = [
  {
    id: "1",
    klienti: "Ardi Krasniqi",
    sherbimi: "Prerje klasike",
    ora: "10:00",
    statusi: "Konfirmuar",
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
];
