import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Produkti } from "../api/dyqani";

export type ArtikulliIShportes = { produkti: Produkti; sasia: number };

type VleraKontekstit = {
  artikujt: ArtikulliIShportes[];
  numri: number;
  // Vetëm për t'u shfaqur; totali i vërtetë llogaritet në server kur porositet.
  totali: number;
  shto: (produkti: Produkti, sasia?: number) => void;
  ndryshoSasine: (produktiId: string, sasia: number) => void;
  hiq: (produktiId: string) => void;
  pastro: () => void;
};

const MAX_SASIA = 20;

const ShportaContext = createContext<VleraKontekstit | null>(null);

// Shporta e dyqanit, në memorie gjatë përdorimit të aplikacionit.
export function ShportaProvider({ children }: { children: ReactNode }) {
  const [artikujt, setArtikujt] = useState<ArtikulliIShportes[]>([]);

  const vlera = useMemo<VleraKontekstit>(
    () => ({
      artikujt,
      numri: artikujt.reduce((s, a) => s + a.sasia, 0),
      totali: artikujt.reduce((s, a) => s + a.sasia * a.produkti.cmimi_centa, 0),
      shto: (produkti, sasia = 1) =>
        setArtikujt((lista) => {
          const ekziston = lista.find((a) => a.produkti.id === produkti.id);
          if (ekziston) {
            return lista.map((a) =>
              a.produkti.id === produkti.id ? { ...a, sasia: Math.min(MAX_SASIA, a.sasia + sasia) } : a,
            );
          }
          return [...lista, { produkti, sasia: Math.min(MAX_SASIA, sasia) }];
        }),
      ndryshoSasine: (produktiId, sasia) =>
        setArtikujt((lista) =>
          sasia <= 0
            ? lista.filter((a) => a.produkti.id !== produktiId)
            : lista.map((a) => (a.produkti.id === produktiId ? { ...a, sasia: Math.min(MAX_SASIA, sasia) } : a)),
        ),
      hiq: (produktiId) => setArtikujt((lista) => lista.filter((a) => a.produkti.id !== produktiId)),
      pastro: () => setArtikujt([]),
    }),
    [artikujt],
  );

  return <ShportaContext.Provider value={vlera}>{children}</ShportaContext.Provider>;
}

export function useShporta(): VleraKontekstit {
  const vlera = useContext(ShportaContext);
  if (!vlera) throw new Error("useShporta duhet përdorur brenda ShportaProvider");
  return vlera;
}
