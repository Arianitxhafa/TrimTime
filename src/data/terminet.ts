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
  {
    id: "4",
    klienti: "Erion Berisha",
    sherbimi: "Prerje moderne",
    ora: "14:00",
    statusi: "Në pritje",
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
