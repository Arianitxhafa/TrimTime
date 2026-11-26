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

const CELESI_ONBOARDING = "trimtime.onboarding";
// v3: vendndodhja e saktë është e detyrueshme për hartën e Studio Burimit; ekrani u shfaqet një herë
// edhe përdoruesve që e kaluan versionin e mëparshëm.
const CELESI_LEJET = "trimtime.lejet.v3";
const CELESI_KYCJA = "trimtime.kycja";

type VleraKontekstit = {
  onboardingIPare: boolean;
  perfundoOnboarding: () => void;
  // Ekrani i lejeve (njoftimet, vendndodhja) shfaqet një herë pas hyrjes së parë.
  lejetEPara: boolean;
  perfundoLejet: () => void;
  // Kyçja me Face ID / gjurmë gishti kur hapet aplikacioni.
  kycjaBiometrike: boolean;
  ndryshoKycjen: (aktive: boolean) => void;
};

const PreferencatContext = createContext<VleraKontekstit | null>(null);

export function PreferencatProvider({ children }: { children: ReactNode }) {
  const [onboardingIPare, setOnboardingIPare] = useState(false);
  const [lejetEPara, setLejetEPara] = useState(false);
  const [kycjaBiometrike, setKycjaBiometrike] = useState(false);
  const [ngarkuar, setNgarkuar] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.multiGet([CELESI_ONBOARDING, CELESI_LEJET, CELESI_KYCJA]),
      ngarkoGjuhenERuajtur(),
    ])
      .then(([[[, onboarding], [, lejet], [, kycja]]]) => {
        setOnboardingIPare(onboarding === "po");
        setLejetEPara(lejet === "po");
        setKycjaBiometrike(kycja === "po");
      })
      .catch(() => {})
      .finally(() => setNgarkuar(true));
  }, []);

  const vlera = useMemo<VleraKontekstit>(
    () => ({
      onboardingIPare,
      perfundoOnboarding: () => {
        setOnboardingIPare(true);
        AsyncStorage.setItem(CELESI_ONBOARDING, "po").catch(() => {});
      },
      lejetEPara,
      perfundoLejet: () => {
        setLejetEPara(true);
        AsyncStorage.setItem(CELESI_LEJET, "po").catch(() => {});
      },
      kycjaBiometrike,
      ndryshoKycjen: (aktive) => {
        setKycjaBiometrike(aktive);
        AsyncStorage.setItem(CELESI_KYCJA, aktive ? "po" : "jo").catch(() => {});
      },
    }),
    [onboardingIPare, lejetEPara, kycjaBiometrike],
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
