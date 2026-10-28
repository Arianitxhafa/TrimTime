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

// Roli i zgjedhur para hyrjes: vendos cilat tab-e shfaqen dhe ruhet në llogari gjatë regjistrimit.
export type Modi = "klient" | "biznes";

// Qyteti i zgjedhur me dorë; null: ndiqet GPS-i.
export type QytetiIZgjedhur = { id: number; emri: string; lat: number; lng: number };

const CELESI_MODIT = "trimtime.modi";
const CELESI_ONBOARDING = "trimtime.onboarding";
const CELESI_LEJET = "trimtime.lejet";
const CELESI_QYTETI = "trimtime.qyteti";
const CELESI_KYCJA = "trimtime.kycja";

type VleraKontekstit = {
  modi: Modi;
  ndryshoModin: (modi: Modi) => void;
  onboardingIPare: boolean;
  perfundoOnboarding: () => void;
  // Ekrani "Lejo njoftimet dhe vendndodhjen" shfaqet një herë pas hyrjes së parë.
  lejetEPara: boolean;
  perfundoLejet: () => void;
  qytetiIZgjedhur: QytetiIZgjedhur | null;
  zgjidhQytetin: (qyteti: QytetiIZgjedhur | null) => void;
  // Kyçja me Face ID / gjurmë gishti kur hapet aplikacioni.
  kycjaBiometrike: boolean;
  ndryshoKycjen: (aktive: boolean) => void;
};

const PreferencatContext = createContext<VleraKontekstit | null>(null);

export function PreferencatProvider({ children }: { children: ReactNode }) {
  const [modi, setModi] = useState<Modi>("klient");
  const [onboardingIPare, setOnboardingIPare] = useState(false);
  const [lejetEPara, setLejetEPara] = useState(false);
  const [qytetiIZgjedhur, setQytetiIZgjedhur] = useState<QytetiIZgjedhur | null>(null);
  const [kycjaBiometrike, setKycjaBiometrike] = useState(false);
  const [ngarkuar, setNgarkuar] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.multiGet([CELESI_MODIT, CELESI_ONBOARDING, CELESI_LEJET, CELESI_QYTETI, CELESI_KYCJA]),
      ngarkoGjuhenERuajtur(),
    ])
      .then(([[[, modiIRuajtur], [, onboarding], [, lejet], [, qyteti], [, kycja]]]) => {
        if (modiIRuajtur === "klient" || modiIRuajtur === "biznes") setModi(modiIRuajtur);
        setOnboardingIPare(onboarding === "po");
        setLejetEPara(lejet === "po");
        setKycjaBiometrike(kycja === "po");
        if (qyteti) {
          try {
            setQytetiIZgjedhur(JSON.parse(qyteti) as QytetiIZgjedhur);
          } catch {
            // Vlerë e dëmtuar: ndiqet GPS-i.
          }
        }
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
      lejetEPara,
      perfundoLejet: () => {
        setLejetEPara(true);
        AsyncStorage.setItem(CELESI_LEJET, "po").catch(() => {});
      },
      qytetiIZgjedhur,
      zgjidhQytetin: (q) => {
        setQytetiIZgjedhur(q);
        (q ? AsyncStorage.setItem(CELESI_QYTETI, JSON.stringify(q)) : AsyncStorage.removeItem(CELESI_QYTETI)).catch(
          () => {},
        );
      },
      kycjaBiometrike,
      ndryshoKycjen: (aktive) => {
        setKycjaBiometrike(aktive);
        AsyncStorage.setItem(CELESI_KYCJA, aktive ? "po" : "jo").catch(() => {});
      },
    }),
    [modi, onboardingIPare, lejetEPara, qytetiIZgjedhur, kycjaBiometrike],
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
