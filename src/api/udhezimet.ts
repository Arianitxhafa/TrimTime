import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Linking, Platform } from "react-native";
import { useModiAktiv } from "../hooks/useModiAktiv";
import type { Koordinata } from "../lib/tipet";
import { lidhjaEUdhezimeve } from "../lib/vendndodhja";

export type MenyraEUdhetimit = "makine" | "kembe";

export type Rruga = {
  koordinatat: { latitude: number; longitude: number }[];
  distanca_m: number;
  kohezgjatja_s: number;
};

// Serverët falas të OSRM nga FOSSGIS (OpenStreetMap). Kushtet: pa çelës, më së shumti një kërkesë në
// sekondë, me atribuim; rruga kërkohet vetëm kur klienti prek "Udhëzimet".
const SERVERI = "https://routing.openstreetmap.de";
const PROFILI: Record<MenyraEUdhetimit, string> = {
  makine: "routed-car/route/v1/driving",
  kembe: "routed-foot/route/v1/foot",
};

async function merrRrugen(nga: Koordinata, deri: Koordinata, menyra: MenyraEUdhetimit): Promise<Rruga> {
  const url = `${SERVERI}/${PROFILI[menyra]}/${nga.lng},${nga.lat};${deri.lng},${deri.lat}?overview=full&geometries=geojson`;
  const pergjigja = await fetch(url, { headers: { "User-Agent": "TrimTime/1.0" } });
  if (!pergjigja.ok) throw new Error(`OSRM ${pergjigja.status}`);
  const trupi = (await pergjigja.json()) as {
    code: string;
    routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
  };
  const rruga = trupi.routes?.[0];
  if (trupi.code !== "Ok" || !rruga) throw new Error(`OSRM ${trupi.code}`);
  return {
    koordinatat: rruga.geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
    distanca_m: rruga.distance,
    kohezgjatja_s: rruga.duration,
  };
}

export function useRruga(nga: Koordinata | null, deri: Koordinata | null, menyra: MenyraEUdhetimit) {
  return useQuery({
    // E rrumbullakosur në ~10 m, që lëvizjet e vogla të GPS-it të mos e kërkojnë rrugën sërish.
    queryKey: [
      "rruga",
      menyra,
      nga && Math.round(nga.lat * 1e4),
      nga && Math.round(nga.lng * 1e4),
      deri && Math.round(deri.lat * 1e4),
      deri && Math.round(deri.lng * 1e4),
    ],
    enabled: Boolean(nga && deri),
    staleTime: 5 * 60_000,
    retry: 1,
    queryFn: () => merrRrugen(nga!, deri!, menyra),
  });
}

// "Udhëzimet": klienti e sheh rrugën në hartën e TrimTime; ana e biznesit (që s'ka hartë) hap
// aplikacionin e hartave të telefonit.
export function useHapUdhezimet() {
  const modi = useModiAktiv();
  return (lokali: { id: string; lat: number; lng: number }) => {
    if (modi === "klient") {
      router.navigate({ pathname: "/harta", params: { udhezime: lokali.id } });
    } else {
      void Linking.openURL(lidhjaEUdhezimeve(lokali, Platform.OS));
    }
  };
}
