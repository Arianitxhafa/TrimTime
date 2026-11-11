import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLokali, useLokaletPrane } from "../../api/lokalet";
import { useRruga, type MenyraEUdhetimit } from "../../api/udhezimet";
import Ikona, { ikonat } from "../../components/Ikona";
import { useStilet, useTema } from "../../context/TemaContext";
import { useVendndodhjaIme } from "../../hooks/useVendndodhjaIme";
import { formatoCmimin, formatoDistancen, formatoKohezgjatjen } from "../../lib/formatimi";
import { prekja } from "../../lib/prekja";
import type { Koordinata } from "../../lib/tipet";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../../theme";

const ZMADHIMI = { latitudeDelta: 0.08, longitudeDelta: 0.08 };

// Rrezja e kërkimit sa gjysma e lartësisë së hartës (1° gjerësi ≈ 111 km).
function rrezjaERajonit(r: Region): number {
  return Math.min(Math.max((r.latitudeDelta * 111) / 2, 1), 100);
}

// Harta: berberët pranë, fleta me detaje kur preket njëri dhe udhëzimet (rruga portokalli) pa dalë
// nga aplikacioni.
export default function Harta() {
  const { t } = useTranslation();
  const { ngjyrat, eshteErret } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const harta = useRef<MapView>(null);
  const { pika, kaLeje } = useVendndodhjaIme();
  // Butonat dhe atribuimi qëndrojnë mbi shiritin e tab-eve (Liquid Glass), që noton mbi hartë.
  const poshte = insets.bottom + 64;

  // Pa kërkim manual, kërkohet rreth vendndodhjes së përdoruesit.
  const [kerkimiManual, setKerkimiManual] = useState<{ qendra: Koordinata; rrezjaKm: number } | null>(null);
  const kerkimi = kerkimiManual ?? { qendra: pika, rrezjaKm: 10 };
  const [rajoniILevizur, setRajoniILevizur] = useState<Region | null>(null);
  const [zgjedhuri, setZgjedhuri] = useState<string | null>(null);

  // Udhëzimet: "/harta?udhezime=<lokali>" vjen nga fleta, profili, kartat dhe terminet.
  const { udhezime } = useLocalSearchParams<{ udhezime?: string }>();
  const destinacioni = useLokali(udhezime).data ?? null;
  const [menyra, setMenyra] = useState<MenyraEUdhetimit>("makine");
  const deri = udhezime && destinacioni ? { lat: destinacioni.lat, lng: destinacioni.lng } : null;
  const rruga = useRruga(kaLeje ? pika : null, deri, menyra);

  // Sapo dihet vendndodhja, harta qendërzohet aty (pa udhëzime aktive).
  useEffect(() => {
    if (kaLeje === null || udhezime) return;
    harta.current?.animateToRegion({ latitude: pika.lat, longitude: pika.lng, ...ZMADHIMI }, 400);
  }, [kaLeje, pika, udhezime]);

  // Rruga e re: harta shfaq gjithë rrugën, nga klienti deri te berberi.
  useEffect(() => {
    if (!rruga.data) return;
    harta.current?.fitToCoordinates(rruga.data.koordinatat, {
      edgePadding: { top: insets.top + 190, right: 50, bottom: poshte + 60, left: 50 },
      animated: true,
    });
  }, [rruga.data, insets.top, poshte]);

  const lokalet = useLokaletPrane(
    {
      pika: kerkimi.qendra,
      rrezjaKm: kerkimi.rrezjaKm,
      kerkimi: "",
      vetemHapur: false,
      cmimiMax: null,
      renditja: "distanca",
      limit: 300,
    },
    kaLeje !== null,
  );

  function kerkoKetu() {
    if (!rajoniILevizur) return;
    setKerkimiManual({
      qendra: { lat: rajoniILevizur.latitude, lng: rajoniILevizur.longitude },
      rrezjaKm: rrezjaERajonit(rajoniILevizur),
    });
    setRajoniILevizur(null);
    setZgjedhuri(null);
  }

  function hapFleten(id: string) {
    prekja.lehte();
    setZgjedhuri(id);
    router.push({ pathname: "/harta-lokali/[id]", params: { id } });
  }

  function mbyllRrugen() {
    prekja.lehte();
    router.setParams({ udhezime: undefined });
  }

  const ngaKatalogu = (lokalet.data ?? []).filter((l) => l.burimi !== "trimtime");
  const atribuimi = [
    ngaKatalogu.length > 0 || udhezime ? "© OpenStreetMap contributors" : null,
    ngaKatalogu.some((l) => l.burimi === "numrat") ? "Numrat.com" : null,
    udhezime ? "FOSSGIS" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.container}>
      <MapView
        ref={harta}
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: pika.lat, longitude: pika.lng, ...ZMADHIMI }}
        userInterfaceStyle={eshteErret ? "dark" : "light"}
        showsUserLocation={kaLeje === true}
        showsMyLocationButton={false}
        tintColor={ngjyrat.portokalli}
        onPress={() => setZgjedhuri(null)}
        onRegionChangeComplete={(r, detajet) => {
          // Vetëm lëvizjet e përdoruesit e shfaqin butonin "Kërko në këtë zonë".
          if (detajet?.isGesture && !udhezime) setRajoniILevizur(r);
        }}
      >
        {rruga.data ? (
          <Polyline
            coordinates={rruga.data.koordinatat}
            strokeColor={ngjyrat.portokalli}
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}

        {(lokalet.data ?? []).map((l) => {
          const theksuar = l.id === zgjedhuri || l.id === udhezime;
          return (
            <Marker
              key={l.id}
              coordinate={{ latitude: l.lat, longitude: l.lng }}
              onPress={(e) => {
                e.stopPropagation();
                hapFleten(l.id);
              }}
              tracksViewChanges={false}
            >
              <View style={[styles.shenjuesi, theksuar && styles.shenjuesiZgjedhur]}>
                <Text style={[styles.shenjuesiTeksti, theksuar && styles.shenjuesiTekstiZgjedhur]}>
                  {l.cmimi_min !== null ? formatoCmimin(l.cmimi_min) : l.emri.charAt(0)}
                </Text>
              </View>
            </Marker>
          );
        })}

        {/* Destinacioni duket edhe kur nuk është në listën e zonës aktuale. */}
        {destinacioni && udhezime && !(lokalet.data ?? []).some((l) => l.id === udhezime) ? (
          <Marker
            coordinate={{ latitude: destinacioni.lat, longitude: destinacioni.lng }}
            onPress={(e) => {
              e.stopPropagation();
              hapFleten(destinacioni.id);
            }}
          >
            <View style={[styles.shenjuesi, styles.shenjuesiZgjedhur]}>
              <Text style={[styles.shenjuesiTeksti, styles.shenjuesiTekstiZgjedhur]}>{destinacioni.emri.charAt(0)}</Text>
            </View>
          </Marker>
        ) : null}
      </MapView>

      <View style={[styles.siper, { top: insets.top + hapesira.md }]} pointerEvents="box-none">
        {udhezime ? (
          <View style={styles.rruga}>
            <View style={styles.rrugaKoka}>
              <Ikona emri={ikonat.harta} madhesia={18} ngjyra={ngjyrat.portokalli} />
              <Text style={styles.rrugaEmri} numberOfLines={1}>
                {destinacioni?.emri ?? " "}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("harta.mbyllRrugen")}
                onPress={mbyllRrugen}
                hitSlop={10}
                style={styles.mbyll}
              >
                <Ikona emri={ikonat.mbyll} madhesia={14} ngjyra={ngjyrat.tekstiDyte} />
              </Pressable>
            </View>

            {kaLeje === false ? (
              <Text style={styles.rrugaShenim}>{t("harta.paLejeRruga")}</Text>
            ) : rruga.isError ? (
              <Text style={styles.rrugaShenim}>{t("harta.gabimRruga")}</Text>
            ) : rruga.data ? (
              <Text style={styles.rrugaKoha}>
                {formatoKohezgjatjen(Math.max(1, Math.round(rruga.data.kohezgjatja_s / 60)))}
                <Text style={styles.rrugaDistanca}>  ·  {formatoDistancen(rruga.data.distanca_m)}</Text>
              </Text>
            ) : (
              <ActivityIndicator color={ngjyrat.portokalli} style={styles.rrugaNgarkimi} />
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
          </View>
        ) : rajoniILevizur ? (
          <Pressable accessibilityRole="button" onPress={kerkoKetu} style={styles.kerkoKetu}>
            <Ikona emri={ikonat.kerko} madhesia={16} ngjyra={ngjyrat.mbiAri} />
            <Text style={styles.kerkoKetuTeksti}>{t("harta.kerkoKetu")}</Text>
          </Pressable>
        ) : lokalet.isFetching ? (
          <View style={styles.ngarkimi}>
            <ActivityIndicator color={ngjyrat.portokalli} />
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
          style={[styles.butoniVendit, { bottom: poshte + hapesira.md }]}
        >
          <Ikona emri={ikonat.harta} madhesia={20} ngjyra={ngjyrat.portokalli} />
        </Pressable>
      )}

      {atribuimi ? (
        <View style={[styles.atribuimi, { bottom: poshte + hapesira.sm }]} pointerEvents="none">
          <Text style={styles.atribuimiTeksti}>{atribuimi}</Text>
        </View>
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
    shenjuesi: {
      minWidth: 34,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: rrezja.plote,
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1.5,
      borderColor: ngjyrat.portokalli,
      alignItems: "center",
    },
    shenjuesiZgjedhur: {
      backgroundColor: ngjyrat.portokalli,
      transform: [{ scale: 1.15 }],
    },
    shenjuesiTeksti: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 13,
    },
    shenjuesiTekstiZgjedhur: {
      color: "#FFFFFF",
    },
    siper: {
      position: "absolute",
      left: hapesira.lg,
      right: hapesira.lg,
      alignItems: "center",
    },
    rruga: {
      alignSelf: "stretch",
      backgroundColor: ngjyrat.xham,
      borderRadius: rrezja.lg,
      borderCurve: "continuous",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ngjyrat.kufiriXham,
      padding: hapesira.md,
      gap: hapesira.sm,
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
    },
    rrugaKoka: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
    },
    rrugaEmri: {
      ...shkronjat.titullBold,
      flex: 1,
      color: ngjyrat.teksti,
      fontSize: 16,
    },
    mbyll: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: ngjyrat.siperfaqja2,
      alignItems: "center",
      justifyContent: "center",
    },
    rrugaKoha: {
      ...shkronjat.titull,
      color: ngjyrat.portokalli,
      fontSize: 26,
      letterSpacing: -0.4,
    },
    rrugaDistanca: {
      ...shkronjat.etikete,
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
    },
    rrugaShenim: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      lineHeight: 20,
    },
    rrugaNgarkimi: {
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
    kerkoKetu: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      backgroundColor: ngjyrat.portokalli,
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
      ...shkronjat.etiketeBold,
      color: "#FFFFFF",
      fontSize: 14,
    },
    ngarkimi: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.plote,
      padding: hapesira.sm,
    },
    butoniVendit: {
      position: "absolute",
      right: hapesira.lg,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: ngjyrat.xham,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ngjyrat.kufiriXham,
      alignItems: "center",
      justifyContent: "center",
      elevation: 3,
    },
    atribuimi: {
      position: "absolute",
      left: hapesira.md,
      backgroundColor: ngjyrat.xham,
      borderRadius: rrezja.sm,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    atribuimiTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 11,
      fontWeight: "600",
    },
  });
