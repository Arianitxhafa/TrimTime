import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import MapView from "react-native-maps";
import { useStilet, useTema } from "../context/TemaContext";
import type { Koordinata } from "../lib/tipet";
import { gjejAdresen, merrVendndodhjen, type AdresaEGjetur } from "../lib/vendndodhja";
import { rrezja, type Ngjyrat } from "../theme";
import Butoni from "./Butoni";
import Ikona, { ikonat } from "./Ikona";

type Props = {
  vlera: Koordinata;
  onNdrysho: (k: Koordinata) => void;
  // Thirret me adresën e gjetur sa herë që harta ndalon së lëvizuri.
  onAdresa?: (a: AdresaEGjetur) => void;
};

const ZMADHIMI = { latitudeDelta: 0.005, longitudeDelta: 0.005 };

// Harta lëviz poshtë një kunje fikse në qendër: qendra e hartës është vendndodhja.
export default function ZgjedhesiVendndodhjes({ vlera, onNdrysho, onAdresa }: Props) {
  const { t } = useTranslation();
  const { ngjyrat, eshteErret } = useTema();
  const styles = useStilet(krijoStilet);
  const harta = useRef<MapView>(null);
  const [kerkohet, setKerkohet] = useState(false);

  async function perdorVendndodhjen() {
    setKerkohet(true);
    const k = await merrVendndodhjen().catch(() => null);
    setKerkohet(false);
    if (!k) return;
    harta.current?.animateToRegion({ latitude: k.lat, longitude: k.lng, ...ZMADHIMI }, 500);
  }

  return (
    <View style={styles.container}>
      <View style={styles.harta}>
        <MapView
          ref={harta}
          style={StyleSheet.absoluteFill}
          initialRegion={{ latitude: vlera.lat, longitude: vlera.lng, ...ZMADHIMI }}
          userInterfaceStyle={eshteErret ? "dark" : "light"}
          showsUserLocation
          showsMyLocationButton={false}
          onRegionChangeComplete={async (r) => {
            const k = { lat: r.latitude, lng: r.longitude };
            onNdrysho(k);
            if (onAdresa) {
              const adresa = await gjejAdresen(k);
              if (adresa) onAdresa(adresa);
            }
          }}
        />
        <View pointerEvents="none" style={styles.kunja}>
          <View style={styles.kunjaKoka}>
            <Ikona emri={ikonat.gershere} madhesia={16} ngjyra={ngjyrat.mbiAri} />
          </View>
          <View style={styles.kunjaBishti} />
        </View>
      </View>
      <Butoni
        titulli={t("wizard.perdorVendndodhjen")}
        varianti="dytesor"
        ikona={ikonat.harta}
        ngarkohet={kerkohet}
        onPress={perdorVendndodhjen}
      />
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      gap: 12,
      marginBottom: 16,
    },
    harta: {
      height: 260,
      borderRadius: rrezja.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
    },
    // Maja e kunjës bie saktësisht në qendër të hartës.
    kunja: {
      position: "absolute",
      left: "50%",
      top: "50%",
      marginLeft: -18,
      marginTop: -48,
      alignItems: "center",
    },
    kunjaKoka: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: ngjyrat.ari,
      borderWidth: 3,
      borderColor: ngjyrat.siperfaqja,
      alignItems: "center",
      justifyContent: "center",
    },
    kunjaBishti: {
      width: 3,
      height: 12,
      backgroundColor: ngjyrat.ari,
    },
  });
