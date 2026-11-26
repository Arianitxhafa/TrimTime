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
    let ndalo: (() => void) | null = null;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") {
          if (aktiv) setGjendja({ pika: PRISHTINA, kaLeje: false });
          return;
        }
        const pozita = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!aktiv) return;
        setGjendja({ pika: { lat: pozita.coords.latitude, lng: pozita.coords.longitude }, kaLeje: true });
        // Si te Google Maps: pika ndiqet ndërsa klienti lëviz (çdo 50 m), që koha deri te Studio të
        // mbetet e saktë.
        const abonimi = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 50 },
          (p) => setGjendja({ pika: { lat: p.coords.latitude, lng: p.coords.longitude }, kaLeje: true }),
        );
        if (aktiv) ndalo = () => abonimi.remove();
        else abonimi.remove();
      } catch {
        if (aktiv) setGjendja({ pika: PRISHTINA, kaLeje: false });
      }
    })();
    return () => {
      aktiv = false;
      ndalo?.();
    };
  }, []);

  const kerkoLeje = useCallback(async () => {
    const pika = await merrVendndodhjen().catch(() => null);
    if (pika) setGjendja({ pika, kaLeje: true });
  }, []);

  return { ...gjendja, kerkoLeje };
}
