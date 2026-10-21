import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import type { Koordinata } from "../lib/tipet";
import { PRISHTINA, merrVendndodhjen } from "../lib/vendndodhja";

type Gjendja = {
  pika: Koordinata;
  // null derisa të dihet nëse leja është dhënë.
  kaLeje: boolean | null;
};

// Vendndodhja e përdoruesit; Prishtina kur leja mungon, që ekrani të ketë gjithmonë rezultate.
export function useVendndodhjaIme() {
  const [gjendja, setGjendja] = useState<Gjendja>({ pika: PRISHTINA, kaLeje: null });

  useEffect(() => {
    let aktiv = true;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") {
          if (aktiv) setGjendja({ pika: PRISHTINA, kaLeje: false });
          return;
        }
        const pozita = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (aktiv) {
          setGjendja({ pika: { lat: pozita.coords.latitude, lng: pozita.coords.longitude }, kaLeje: true });
        }
      } catch {
        if (aktiv) setGjendja({ pika: PRISHTINA, kaLeje: false });
      }
    })();
    return () => {
      aktiv = false;
    };
  }, []);

  const kerkoLeje = useCallback(async () => {
    const pika = await merrVendndodhjen().catch(() => null);
    if (pika) setGjendja({ pika, kaLeje: true });
  }, []);

  return { ...gjendja, kerkoLeje };
}
