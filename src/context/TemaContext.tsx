import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import {
  ngjyratCelta,
  ngjyratErrta,
  statusetMetaCelta,
  statusetMetaErrta,
  type Ngjyrat,
  type StatusetMeta,
} from "../theme";

export type ZgjedhjaTemes = "sistemi" | "celet" | "erret";

const CELESI_RUAJTJES = "trimtime.tema";

type VleraKontekstit = {
  zgjedhja: ZgjedhjaTemes;
  ndryshoZgjedhjen: (zgjedhja: ZgjedhjaTemes) => void;
  eshteErret: boolean;
  ngjyrat: Ngjyrat;
  statusetMeta: StatusetMeta;
};

const TemaContext = createContext<VleraKontekstit | null>(null);

function eshteZgjedhjeEVlefshme(vlera: string | null): vlera is ZgjedhjaTemes {
  return vlera === "sistemi" || vlera === "celet" || vlera === "erret";
}

export function TemaProvider({ children }: { children: ReactNode }) {
  const skemaESistemit = useColorScheme();
  const [zgjedhja, setZgjedhja] = useState<ZgjedhjaTemes>("sistemi");
  const [ngarkuar, setNgarkuar] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CELESI_RUAJTJES)
      .then((vlera) => {
        if (eshteZgjedhjeEVlefshme(vlera)) setZgjedhja(vlera);
      })
      .catch(() => {})
      .finally(() => setNgarkuar(true));
  }, []);

  const eshteErret =
    zgjedhja === "sistemi" ? skemaESistemit !== "light" : zgjedhja === "erret";

  const vlera = useMemo<VleraKontekstit>(
    () => ({
      zgjedhja,
      ndryshoZgjedhjen: (e) => {
        setZgjedhja(e);
        AsyncStorage.setItem(CELESI_RUAJTJES, e).catch(() => {});
      },
      eshteErret,
      ngjyrat: eshteErret ? ngjyratErrta : ngjyratCelta,
      statusetMeta: eshteErret ? statusetMetaErrta : statusetMetaCelta,
    }),
    [zgjedhja, eshteErret],
  );

  // Pa këtë, ekrani do të shfaqej për një çast me temën e gabuar para se të lexohet zgjedhja.
  if (!ngarkuar) return null;

  return <TemaContext.Provider value={vlera}>{children}</TemaContext.Provider>;
}

export function useTema(): VleraKontekstit {
  const vlera = useContext(TemaContext);
  if (!vlera) {
    throw new Error("useTema duhet përdorur brenda TemaProvider");
  }
  return vlera;
}

// Krijon stilet nga ngjyrat e temës aktive dhe i rindërton vetëm kur ndërrohet tema.
// `krijo` duhet të jetë funksion jashtë komponentit që thërret StyleSheet.create.
export function useStilet<T>(krijo: (ngjyrat: Ngjyrat) => T): T {
  const { ngjyrat } = useTema();
  return useMemo(() => krijo(ngjyrat), [krijo, ngjyrat]);
}
