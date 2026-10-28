import { useQytetiPrane } from "../api/lokalet";
import { usePreferencat } from "../context/PreferencatContext";
import type { Koordinata } from "../lib/tipet";
import { useVendndodhjaIme } from "./useVendndodhjaIme";

export type ZonaIme = {
  pika: Koordinata;
  qyteti: { id: number; emri: string } | null;
  // true: qyteti vjen nga GPS-i; false: i zgjedhur me dorë ose parazgjedhja (Prishtina).
  ngaGps: boolean;
  // Lista pret derisa të dihet qyteti, që të mos ngarkohen lokalet e gabuara.
  gati: boolean;
  kaLeje: boolean | null;
  kerkoLeje: () => Promise<void>;
};

// Zona e klientit: qyteti i zgjedhur me dorë, ose qyteti ku e vendos GPS-i, ose Prishtina pa leje.
export function useZonaIme(): ZonaIme {
  const { qytetiIZgjedhur } = usePreferencat();
  const gps = useVendndodhjaIme();
  const qytetiGps = useQytetiPrane(gps.pika, gps.kaLeje !== null && !qytetiIZgjedhur);

  if (qytetiIZgjedhur) {
    return {
      pika: { lat: qytetiIZgjedhur.lat, lng: qytetiIZgjedhur.lng },
      qyteti: { id: qytetiIZgjedhur.id, emri: qytetiIZgjedhur.emri },
      ngaGps: false,
      gati: true,
      kaLeje: gps.kaLeje,
      kerkoLeje: gps.kerkoLeje,
    };
  }

  return {
    pika: gps.pika,
    qyteti: qytetiGps.data ? { id: qytetiGps.data.id, emri: qytetiGps.data.emri } : null,
    ngaGps: gps.kaLeje === true,
    gati: gps.kaLeje !== null && !qytetiGps.isPending,
    kaLeje: gps.kaLeje,
    kerkoLeje: gps.kerkoLeje,
  };
}
