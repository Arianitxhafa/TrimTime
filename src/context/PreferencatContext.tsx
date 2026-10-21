import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ngarkoGjuhenERuajtur } from "../i18n";

// I njëjti përdorues mund të jetë klient dhe berber; modi vendos cilat tab-e shfaqen.
export type Modi = "klient" | "biznes";

const CELESI_MODIT = "trimtime.modi";
const CELESI_ONBOARDING = "trimtime.onboarding";

type VleraKontekstit = {
  modi: Modi;
  ndryshoModin: (modi: Modi) => void;
  onboardingIPare: boolean;
  perfundoOnboarding: () => void;
};

const PreferencatContext = createContext<VleraKontekstit | null>(null);

export function PreferencatProvider({ children }: { children: ReactNode }) {
  const [modi, setModi] = useState<Modi>("klient");
  const [onboardingIPare, setOnboardingIPare] = useState(false);
  const [ngarkuar, setNgarkuar] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.multiGet([CELESI_MODIT, CELESI_ONBOARDING]),
      ngarkoGjuhenERuajtur(),
    ])
      .then(([[[, modiIRuajtur], [, onboarding]]]) => {
        if (modiIRuajtur === "klient" || modiIRuajtur === "biznes") setModi(modiIRuajtur);
        setOnboardingIPare(onboarding === "po");
      })
      .catch(() => {})
      .finally(() => setNgarkuar(true));
  }, []);

  const vlera = useMemo<VleraKontekstit>(
    () => ({
      modi,
      ndryshoModin: (m) => {
        setModi(m);
        AsyncStorage.setItem(CELESI_MODIT, m).catch(() => {});
      },
      onboardingIPare,
      perfundoOnboarding: () => {
        setOnboardingIPare(true);
        AsyncStorage.setItem(CELESI_ONBOARDING, "po").catch(() => {});
      },
    }),
    [modi, onboardingIPare],
  );

  if (!ngarkuar) return null;

  return <PreferencatContext.Provider value={vlera}>{children}</PreferencatContext.Provider>;
}

export function usePreferencat(): VleraKontekstit {
  const vlera = useContext(PreferencatContext);
  if (!vlera) {
    throw new Error("usePreferencat duhet përdorur brenda PreferencatProvider");
  }
  return vlera;
}
