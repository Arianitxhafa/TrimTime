import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { terminet as terminetFillestare, type StatusiTerminit, type Termini } from "../data/terminet";

type Veprimi =
  | { lloji: "shto"; termini: Omit<Termini, "id" | "statusi"> }
  | { lloji: "ndrysho-statusin"; id: string; statusi: StatusiTerminit }
  | { lloji: "fshi"; id: string };

function rendit(lista: Termini[]): Termini[] {
  return [...lista].sort((a, b) => a.ora.localeCompare(b.ora));
}

function reducer(gjendja: Termini[], veprimi: Veprimi): Termini[] {
  switch (veprimi.lloji) {
    case "shto":
      return rendit([
        ...gjendja,
        { ...veprimi.termini, id: String(Date.now()), statusi: "Në pritje" },
      ]);
    case "ndrysho-statusin":
      return gjendja.map((t) =>
        t.id === veprimi.id ? { ...t, statusi: veprimi.statusi } : t,
      );
    case "fshi":
      return gjendja.filter((t) => t.id !== veprimi.id);
  }
}

type VleraKontekstit = {
  terminet: Termini[];
  shtoTermin: (termini: Omit<Termini, "id" | "statusi">) => void;
  ndryshoStatusin: (id: string, statusi: StatusiTerminit) => void;
  fshiTermin: (id: string) => void;
};

const TerminetContext = createContext<VleraKontekstit | null>(null);

export function TerminetProvider({ children }: { children: ReactNode }) {
  const [terminet, dispatch] = useReducer(reducer, terminetFillestare, rendit);

  const vlera = useMemo<VleraKontekstit>(
    () => ({
      terminet,
      shtoTermin: (termini) => dispatch({ lloji: "shto", termini }),
      ndryshoStatusin: (id, statusi) => dispatch({ lloji: "ndrysho-statusin", id, statusi }),
      fshiTermin: (id) => dispatch({ lloji: "fshi", id }),
    }),
    [terminet],
  );

  return <TerminetContext.Provider value={vlera}>{children}</TerminetContext.Provider>;
}

export function useTerminet(): VleraKontekstit {
  const vlera = useContext(TerminetContext);
  if (!vlera) {
    throw new Error("useTerminet duhet përdorur brenda TerminetProvider");
  }
  return vlera;
}
