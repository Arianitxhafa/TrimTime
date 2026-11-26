import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLokali } from "../../api/lokalet";
import { useRruga, type MenyraEUdhetimit } from "../../api/udhezimet";
import Butoni from "../../components/Butoni";
import Ikona, { ikonat } from "../../components/Ikona";
import Xham from "../../components/Xham";
import { useStilet, useTema } from "../../context/TemaContext";
import { useVendndodhjaIme } from "../../hooks/useVendndodhjaIme";
import { formatoDistancen, formatoKohezgjatjen } from "../../lib/formatimi";
import { prekja } from "../../lib/prekja";
import { STUDIO_ID } from "../../lib/studio";
import { lidhjaEUdhezimeve } from "../../lib/vendndodhja";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../../theme";

const ZMADHIMI = { latitudeDelta: 0.012, longitudeDelta: 0.012 };

// Harta, si te Google Maps: ku je ti, ku është Studio Burimi dhe rruga mes jush, me kohën dhe distancën
// me makinë ose në këmbë. Rruga rifreskohet ndërsa klienti lëviz.
export default function Harta() {
  const { t } = useTranslation();
  const { ngjyrat, eshteErret } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const harta = useRef<MapView>(null);
  const studio = useLokali(STUDIO_ID).data ?? null;
  const { pika, kaLeje } = useVendndodhjaIme();
  const [menyra, setMenyra] = useState<MenyraEUdhetimit>("makine");
  const deri = studio ? { lat: studio.lat, lng: studio.lng } : null;
  const rruga = useRruga(kaLeje ? pika : null, deri, menyra);
  // Butonat poshtë qëndrojnë mbi shiritin e tab-eve, që noton mbi hartë.
  const poshte = insets.bottom + 64;

  // Harta shfaq gjithë rrugën kur ajo vjen, ose vetëm Studion kur s'ka leje.
  const rrugaEShfaqur = useRef<string | null>(null);
  useEffect(() => {
    if (rruga.data) {
      const celesi = `${menyra}-${rruga.data.distanca_m}`;
      if (rrugaEShfaqur.current === celesi) return;
      rrugaEShfaqur.current = celesi;
      harta.current?.fitToCoordinates(rruga.data.koordinatat, {
        edgePadding: { top: insets.top + 210, right: 60, bottom: poshte + 110, left: 60 },
        animated: true,
      });
    } else if (studio && kaLeje === false) {
      harta.current?.animateToRegion({ latitude: studio.lat, longitude: studio.lng, ...ZMADHIMI }, 400);
    }
  }, [rruga.data, studio, kaLeje, menyra, insets.top, poshte]);

  function qendrozo() {
    prekja.lehte();
    if (rruga.data) {
      rrugaEShfaqur.current = null;
      harta.current?.fitToCoordinates(rruga.data.koordinatat, {
        edgePadding: { top: insets.top + 210, right: 60, bottom: poshte + 110, left: 60 },
        animated: true,
      });
    } else if (kaLeje) {
      harta.current?.animateToRegion({ latitude: pika.lat, longitude: pika.lng, ...ZMADHIMI }, 400);
    }
  }

  if (!studio) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.portokalli} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={harta}
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: studio.lat, longitude: studio.lng, ...ZMADHIMI }}
        userInterfaceStyle={eshteErret ? "dark" : "light"}
        showsUserLocation={kaLeje === true}
        showsMyLocationButton={false}
        showsCompass={false}
        tintColor={ngjyrat.portokalli}
      >
        {rruga.data ? (
          <Polyline
            coordinates={rruga.data.koordinatat}
            strokeColor={ngjyrat.portokalli}
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
            lineDashPattern={menyra === "kembe" ? [2, 10] : undefined}
          />
        ) : null}
        <Marker coordinate={{ latitude: studio.lat, longitude: studio.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={styles.shenjuesi}>
            <View style={styles.shenjuesiHapesira} />
            <View style={styles.gjilpera}>
              <Ikona emri={ikonat.gershere} madhesia={18} ngjyra="#FFFFFF" />
            </View>
            <View style={styles.shenjuesiHapesira}>
              <Text style={styles.emriNeHarte} numberOfLines={1}>
                {studio.emri}
              </Text>
            </View>
          </View>
        </Marker>
      </MapView>

      {/* Karta sipër: Studio, koha dhe distanca, makinë ose këmbë. */}
      <View style={[styles.siper, { top: insets.top + hapesira.sm }]} pointerEvents="box-none">
        <Xham style={styles.karta}>
          <View style={styles.kartaKoka}>
            <View style={styles.ikonaStudios}>
              <Ikona emri={ikonat.gershere} madhesia={16} ngjyra="#FFFFFF" />
            </View>
            <View style={styles.kartaTeksti}>
              <Text style={styles.emri} numberOfLines={1}>
                {studio.emri}
              </Text>
              <Text style={styles.adresa} numberOfLines={1}>
                {studio.adresa}, {studio.qyteti}
              </Text>
            </View>
          </View>

          {kaLeje === false ? (
            <Text style={styles.shenim}>{t("harta.paLejeRruga")}</Text>
          ) : rruga.isError ? (
            <Text style={styles.shenim}>{t("harta.gabimRruga")}</Text>
          ) : rruga.data ? (
            <Text style={styles.koha} accessibilityLiveRegion="polite">
              {formatoKohezgjatjen(Math.max(1, Math.round(rruga.data.kohezgjatja_s / 60)))}
              <Text style={styles.distanca}>  ·  {formatoDistancen(rruga.data.distanca_m)}</Text>
            </Text>
          ) : (
            <ActivityIndicator color={ngjyrat.portokalli} style={styles.ngarkimi} />
          )}

          <View style={styles.menyrat}>
            {(["makine", "kembe"] as const).map((m) => (
              <Pressable
                key={m}
                accessibilityRole="button"
                accessibilityState={{ selected: menyra === m }}
                onPress={() => {
                  prekja.zgjedhje();
                  setMenyra(m);
                }}
                style={[styles.menyra, menyra === m && styles.menyraAktive]}
              >
                <Text style={[styles.menyraTeksti, menyra === m && styles.menyraTekstiAktiv]}>{t(`harta.${m}`)}</Text>
              </Pressable>
            ))}
          </View>
        </Xham>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("harta.vendndodhjaIme")}
        onPress={qendrozo}
        style={[styles.butoniVendit, { bottom: poshte + 96 }]}
      >
        <Xham style={styles.butoniVenditXham} iPrekshem>
          <Ikona emri={ikonat.vendi} madhesia={20} ngjyra={ngjyrat.portokalli} />
        </Xham>
      </Pressable>

      {/* Veprimet poshtë: rezervo, ose hap navigimin hap pas hapi te hartat e telefonit. */}
      <Xham style={[styles.fundi, { bottom: poshte + hapesira.sm }]}>
        <Butoni
          titulli={t("profiliLokalit.rezervo")}
          ikona={ikonat.kalendar}
          onPress={() => router.push({ pathname: "/rezervo/[lokaliId]", params: { lokaliId: studio.id } })}
          style={styles.gjysme}
        />
        <Butoni
          titulli={t("harta.niseRrugen")}
          ikona={ikonat.harta}
          varianti="dytesor"
          onPress={() => void Linking.openURL(lidhjaEUdhezimeve(studio, Platform.OS))}
          style={styles.gjysme}
        />
      </Xham>

      {rruga.data ? (
        <Text style={[styles.atribuimi, { bottom: poshte + 84 }]} pointerEvents="none">
          {t("harta.atribuimiRruges")}
        </Text>
      ) : null}
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    qendra: {
      alignItems: "center",
      justifyContent: "center",
    },
    shenjuesi: {
      width: 160,
      alignItems: "center",
    },
    // E njëjta lartësi sipër dhe poshtë rrethit, që qendra e pamjes të bjerë te pika e Studios.
    shenjuesiHapesira: {
      height: 26,
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 4,
    },
    gjilpera: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 3,
      borderColor: "#FFFFFF",
      backgroundColor: ngjyrat.portokalli,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    emriNeHarte: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 13,
      backgroundColor: ngjyrat.xham,
      borderRadius: 6,
      overflow: "hidden",
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    siper: {
      position: "absolute",
      left: hapesira.lg,
      right: hapesira.lg,
    },
    karta: {
      borderRadius: rrezja.lg,
      padding: hapesira.md,
      gap: hapesira.sm,
    },
    kartaKoka: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
    },
    ikonaStudios: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: ngjyrat.portokalli,
      alignItems: "center",
      justifyContent: "center",
    },
    kartaTeksti: {
      flex: 1,
    },
    emri: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 16,
    },
    adresa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    koha: {
      ...shkronjat.titull,
      color: ngjyrat.portokalli,
      fontSize: 28,
      letterSpacing: -0.4,
    },
    distanca: {
      ...shkronjat.etikete,
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
    },
    shenim: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      lineHeight: 20,
    },
    ngarkimi: {
      alignSelf: "flex-start",
      paddingVertical: 6,
    },
    menyrat: {
      flexDirection: "row",
      backgroundColor: ngjyrat.siperfaqja2,
      borderRadius: rrezja.sm + 2,
      padding: 3,
    },
    menyra: {
      flex: 1,
      height: 32,
      borderRadius: rrezja.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    menyraAktive: {
      backgroundColor: ngjyrat.siperfaqja,
    },
    menyraTeksti: {
      ...shkronjat.etikete,
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    menyraTekstiAktiv: {
      color: ngjyrat.teksti,
    },
    butoniVendit: {
      position: "absolute",
      right: hapesira.lg,
    },
    butoniVenditXham: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    fundi: {
      position: "absolute",
      left: hapesira.md,
      right: hapesira.md,
      flexDirection: "row",
      gap: hapesira.sm,
      padding: hapesira.sm,
      borderRadius: 26,
    },
    gjysme: {
      flex: 1,
      minHeight: 48,
    },
    atribuimi: {
      position: "absolute",
      left: hapesira.md,
      color: ngjyrat.tekstiDyte,
      fontSize: 10,
      fontWeight: "600",
    },
  });
