import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLokaletPrane } from "../../api/lokalet";
import Ikona, { ikonat } from "../../components/Ikona";
import KartaELokalit from "../../components/KartaELokalit";
import { useStilet, useTema } from "../../context/TemaContext";
import { useVendndodhjaIme } from "../../hooks/useVendndodhjaIme";
import { formatoCmimin } from "../../lib/formatimi";
import type { Koordinata } from "../../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

const ZMADHIMI = { latitudeDelta: 0.08, longitudeDelta: 0.08 };

// Rrezja e kërkimit sa gjysma e lartësisë së hartës (1° gjerësi ≈ 111 km).
function rrezjaERajonit(r: Region): number {
  return Math.min(Math.max((r.latitudeDelta * 111) / 2, 1), 100);
}

export default function Harta() {
  const { t } = useTranslation();
  const { ngjyrat, eshteErret } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const harta = useRef<MapView>(null);
  const { pika, kaLeje } = useVendndodhjaIme();

  // Pa kërkim manual, kërkohet rreth vendndodhjes së përdoruesit.
  const [kerkimiManual, setKerkimiManual] = useState<{ qendra: Koordinata; rrezjaKm: number } | null>(null);
  const kerkimi = kerkimiManual ?? { qendra: pika, rrezjaKm: 10 };
  const [rajoniILevizur, setRajoniILevizur] = useState<Region | null>(null);
  const [zgjedhuri, setZgjedhuri] = useState<string | null>(null);

  // Sapo dihet vendndodhja, harta qendërzohet aty.
  useEffect(() => {
    if (kaLeje === null) return;
    harta.current?.animateToRegion({ latitude: pika.lat, longitude: pika.lng, ...ZMADHIMI }, 400);
  }, [kaLeje, pika]);

  const lokalet = useLokaletPrane(
    {
      pika: kerkimi.qendra,
      rrezjaKm: kerkimi.rrezjaKm,
      kerkimi: "",
      vetemHapur: false,
      cmimiMax: null,
      renditja: "distanca",
    },
    kaLeje !== null,
  );

  const lokaliIZgjedhur = lokalet.data?.find((l) => l.id === zgjedhuri);

  function kerkoKetu() {
    if (!rajoniILevizur) return;
    setKerkimiManual({
      qendra: { lat: rajoniILevizur.latitude, lng: rajoniILevizur.longitude },
      rrezjaKm: rrezjaERajonit(rajoniILevizur),
    });
    setRajoniILevizur(null);
    setZgjedhuri(null);
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={harta}
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: pika.lat, longitude: pika.lng, ...ZMADHIMI }}
        userInterfaceStyle={eshteErret ? "dark" : "light"}
        showsUserLocation={kaLeje === true}
        showsMyLocationButton={false}
        onPress={() => setZgjedhuri(null)}
        onRegionChangeComplete={(r, detajet) => {
          // Vetëm lëvizjet e përdoruesit e shfaqin butonin "Kërko në këtë zonë".
          if (detajet?.isGesture) setRajoniILevizur(r);
        }}
      >
        {(lokalet.data ?? []).map((l) => {
          const zgjedhur = l.id === zgjedhuri;
          return (
            <Marker
              key={l.id}
              coordinate={{ latitude: l.lat, longitude: l.lng }}
              onPress={(e) => {
                e.stopPropagation();
                setZgjedhuri(l.id);
              }}
              tracksViewChanges={false}
            >
              <View style={[styles.shenjuesi, zgjedhur && styles.shenjuesiZgjedhur]}>
                <Text style={[styles.shenjuesiTeksti, zgjedhur && styles.shenjuesiTekstiZgjedhur]}>
                  {l.cmimi_min !== null ? formatoCmimin(l.cmimi_min) : l.emri.charAt(0)}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      <View style={[styles.siper, { top: insets.top + hapesira.md }]} pointerEvents="box-none">
        {rajoniILevizur ? (
          <Pressable accessibilityRole="button" onPress={kerkoKetu} style={styles.kerkoKetu}>
            <Ikona emri={ikonat.kerko} madhesia={16} ngjyra={ngjyrat.mbiAri} />
            <Text style={styles.kerkoKetuTeksti}>{t("harta.kerkoKetu")}</Text>
          </Pressable>
        ) : lokalet.isFetching ? (
          <View style={styles.ngarkimi}>
            <ActivityIndicator color={ngjyrat.ari} />
          </View>
        ) : null}
      </View>

      {kaLeje && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("harta.vendndodhjaIme")}
          onPress={() =>
            harta.current?.animateToRegion({ latitude: pika.lat, longitude: pika.lng, ...ZMADHIMI }, 400)
          }
          style={[styles.butoniVendit, { bottom: (lokaliIZgjedhur ? 120 : 0) + hapesira.xl }]}
        >
          <Ikona emri={ikonat.harta} madhesia={20} ngjyra={ngjyrat.teksti} />
        </Pressable>
      )}

      {lokaliIZgjedhur && (
        <View style={styles.karta}>
          <KartaELokalit lokali={lokaliIZgjedhur} kompakte />
        </View>
      )}
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    shenjuesi: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: rrezja.plote,
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1.5,
      borderColor: ngjyrat.ari,
    },
    shenjuesiZgjedhur: {
      backgroundColor: ngjyrat.ari,
      transform: [{ scale: 1.12 }],
    },
    shenjuesiTeksti: {
      color: ngjyrat.teksti,
      fontSize: 13,
      fontWeight: "800",
    },
    shenjuesiTekstiZgjedhur: {
      color: ngjyrat.mbiAri,
    },
    siper: {
      position: "absolute",
      left: 0,
      right: 0,
      alignItems: "center",
    },
    kerkoKetu: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      backgroundColor: ngjyrat.ari,
      paddingHorizontal: hapesira.lg,
      height: 42,
      borderRadius: rrezja.plote,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    kerkoKetuTeksti: {
      color: ngjyrat.mbiAri,
      fontSize: 14,
      fontWeight: "800",
    },
    ngarkimi: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.plote,
      padding: hapesira.sm,
    },
    butoniVendit: {
      position: "absolute",
      right: hapesira.xl,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      alignItems: "center",
      justifyContent: "center",
      elevation: 3,
    },
    karta: {
      position: "absolute",
      left: hapesira.lg,
      right: hapesira.lg,
      bottom: hapesira.lg,
    },
  });
