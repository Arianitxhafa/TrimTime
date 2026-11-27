import * as Location from "expo-location";
import type { Koordinata } from "./tipet";

export async function merrVendndodhjen(): Promise<Koordinata | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;
  const pozita = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { lat: pozita.coords.latitude, lng: pozita.coords.longitude };
}

export type AdresaEGjetur = { adresa: string; qyteti: string };

// Nga koordinatat te adresa e lexueshme; null kur shërbimi nuk e gjen.
export async function gjejAdresen(k: Koordinata): Promise<AdresaEGjetur | null> {
  try {
    const [rezultati] = await Location.reverseGeocodeAsync({ latitude: k.lat, longitude: k.lng });
    if (!rezultati) return null;
    const rruga = [rezultati.street, rezultati.streetNumber].filter(Boolean).join(" ");
    return {
      adresa: rruga || rezultati.name || "",
      qyteti: rezultati.city || rezultati.subregion || rezultati.region || "",
    };
  } catch {
    return null;
  }
}
