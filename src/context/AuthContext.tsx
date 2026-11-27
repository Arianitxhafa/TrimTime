import type { Session } from "@supabase/supabase-js";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { eshteEmailITelefonit, telefoniNgaEmaili } from "../lib/telefoni";

export type Profili = {
  id: string;
  emri: string;
  telefoni: string | null;
  foto_url: string | null;
  // 'ne_pritje' derisa Studio ta aprovojë llogarinë; null para migrimit të aprovimit.
  statusi: "ne_pritje" | "aprovuar" | "refuzuar" | null;
};

type VleraKontekstit = {
  sesioni: Session | null;
  profili: Profili | null;
  // Emri për t'u shfaqur: nga profili, nga regjistrimi ose nga email-i.
  emriIShfaqur: string;
  ngarkohet: boolean;
  // true derisa të vijë profili i përdoruesit që ka hyrë (statusi i aprovimit).
  profiliNgarkohet: boolean;
  rifreskoProfilin: () => Promise<void>;
  dil: () => Promise<void>;
  // Fshin përgjithmonë llogarinë dhe të dhënat e saj (Apple dhe Google e kërkojnë brenda aplikacionit).
  fshijLlogarine: () => Promise<void>;
  // Ruan emrin dhe telefonin; profili në aplikacion përditësohet menjëherë.
  ruajProfilin: (ndryshimet: { emri: string; telefoni: string | null }) => Promise<void>;
};

const AuthContext = createContext<VleraKontekstit | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesioni, setSesioni] = useState<Session | null>(null);
  const [ngarkohet, setNgarkohet] = useState(true);
  const [profili, setProfili] = useState<Profili | null>(null);
  const [rifreskimi, setRifreskimi] = useState(0);
  const [profiliIdINgarkuar, setProfiliIdINgarkuar] = useState<string | null>(null);

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
    void (async () => {
      // "*": para migrimit të aprovimit kolona "statusi" mungon dhe del null.
      const pergjigja = await supabase.from("profilet").select("*").eq("id", perdoruesiId).maybeSingle<Profili>();
      if (!aktiv) return;
      if (pergjigja.data) setProfili({ ...pergjigja.data, statusi: pergjigja.data.statusi ?? null });
      setProfiliIdINgarkuar(perdoruesiId);
    })();
    return () => {
      aktiv = false;
    };
  }, [perdoruesiId, rifreskimi]);

  // Profili i një përdoruesi të mëparshëm nuk shfaqet pas daljes ose ndërrimit të llogarisë.
  const profiliAktual = profili?.id === perdoruesiId ? profili : null;

  const vlera = useMemo<VleraKontekstit>(() => {
    const emriNgaRegjistrimi = sesioni?.user.user_metadata?.emri;
    return {
      sesioni,
      profili: profiliAktual,
      emriIShfaqur:
        profiliAktual?.emri ||
        (typeof emriNgaRegjistrimi === "string" ? emriNgaRegjistrimi : "") ||
        (eshteEmailITelefonit(sesioni?.user.email) ? telefoniNgaEmaili(sesioni!.user.email!) : sesioni?.user.email) ||
        "",
      ngarkohet,
      profiliNgarkohet: Boolean(perdoruesiId) && profiliIdINgarkuar !== perdoruesiId,
      rifreskoProfilin: async () => {
        setRifreskimi((n) => n + 1);
      },
      dil: async () => {
        await supabase.auth.signOut();
      },
      fshijLlogarine: async () => {
        const id = sesioni?.user.id;
        if (!id) throw new Error("Pa sesion");
        // Fotot e stilit në Storage: SQL nuk mund t'i fshijë, ndaj i fshin aplikacioni së pari.
        const { data: fotot } = await supabase.storage.from("stilet").list(id, { limit: 1000 });
        if (fotot && fotot.length > 0) {
          await supabase.storage.from("stilet").remove(fotot.map((f) => `${id}/${f.name}`));
        }
        const { error } = await supabase.rpc("fshij_llogarine");
        if (error) throw error;
        if (Platform.OS !== "web") await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
        // Llogaria s'ekziston më në server: sesioni pastrohet vetëm në këtë telefon.
        await supabase.auth.signOut({ scope: "local" });
      },
      ruajProfilin: async ({ emri, telefoni }) => {
        if (!sesioni) throw new Error("Pa sesion");
        const { data, error } = await supabase
          .from("profilet")
          .update({ emri, telefoni })
          .eq("id", sesioni.user.id)
          .select("*")
          .single<Profili>();
        if (error) throw error;
        setProfili(data);
      },
    };
  }, [sesioni, profiliAktual, ngarkohet, perdoruesiId, profiliIdINgarkuar]);

  return <AuthContext.Provider value={vlera}>{children}</AuthContext.Provider>;
}

export function useAuth(): VleraKontekstit {
  const vlera = useContext(AuthContext);
  if (!vlera) {
    throw new Error("useAuth duhet përdorur brenda AuthProvider");
  }
  return vlera;
}
