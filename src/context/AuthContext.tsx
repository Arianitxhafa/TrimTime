import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import type { Modi } from "./PreferencatContext";

export type Profili = {
  id: string;
  emri: string;
  telefoni: string | null;
  foto_url: string | null;
};

type VleraKontekstit = {
  sesioni: Session | null;
  profili: Profili | null;
  // Emri për t'u shfaqur: nga profili, nga regjistrimi ose nga email-i.
  emriIShfaqur: string;
  // Roli i ruajtur në llogari gjatë regjistrimit; null për llogaritë e vjetra pa rol.
  roli: Modi | null;
  ngarkohet: boolean;
  dil: () => Promise<void>;
};

const AuthContext = createContext<VleraKontekstit | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesioni, setSesioni] = useState<Session | null>(null);
  const [ngarkohet, setNgarkohet] = useState(true);
  const [profili, setProfili] = useState<Profili | null>(null);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSesioni(data.session))
      .finally(() => setNgarkohet(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_ngjarja, sesioniIRi) => setSesioni(sesioniIRi));

    return () => subscription.unsubscribe();
  }, []);

  const perdoruesiId = sesioni?.user.id;

  useEffect(() => {
    if (!perdoruesiId) return;
    let aktiv = true;
    supabase
      .from("profilet")
      .select("id, emri, telefoni, foto_url")
      .eq("id", perdoruesiId)
      .maybeSingle<Profili>()
      .then(({ data }) => {
        if (aktiv && data) setProfili(data);
      });
    return () => {
      aktiv = false;
    };
  }, [perdoruesiId]);

  // Profili i një përdoruesi të mëparshëm nuk shfaqet pas daljes ose ndërrimit të llogarisë.
  const profiliAktual = profili?.id === perdoruesiId ? profili : null;

  const vlera = useMemo<VleraKontekstit>(() => {
    const emriNgaRegjistrimi = sesioni?.user.user_metadata?.emri;
    const roliILlogarise = sesioni?.user.user_metadata?.roli;
    return {
      roli: roliILlogarise === "klient" || roliILlogarise === "biznes" ? roliILlogarise : null,
      sesioni,
      profili: profiliAktual,
      emriIShfaqur:
        profiliAktual?.emri ||
        (typeof emriNgaRegjistrimi === "string" ? emriNgaRegjistrimi : "") ||
        sesioni?.user.email ||
        "",
      ngarkohet,
      dil: async () => {
        await supabase.auth.signOut();
      },
    };
  }, [sesioni, profiliAktual, ngarkohet]);

  return <AuthContext.Provider value={vlera}>{children}</AuthContext.Provider>;
}

export function useAuth(): VleraKontekstit {
  const vlera = useContext(AuthContext);
  if (!vlera) {
    throw new Error("useAuth duhet përdorur brenda AuthProvider");
  }
  return vlera;
}
