import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBejCheckIn, type CheckIn } from "../api/checkIn";
import { mesazhiIGabimitTeRezervimit } from "../api/terminet";
import Butoni from "../components/Butoni";
import Ikona, { ikonat } from "../components/Ikona";
import Xham from "../components/Xham";
import { useStilet, useTema } from "../context/TemaContext";
import { useModiAktiv } from "../hooks/useModiAktiv";
import { prekja } from "../lib/prekja";
import { lexoQr } from "../lib/qr";
import { hapesira, type Ngjyrat } from "../theme";

type Rezultati =
  | { lloji: "checkin"; lokaliId: string; teDhenat: CheckIn }
  | { lloji: "gabim"; mesazhi: string; lokaliId?: string };

// Skaneri i QR-ve të TrimTime: klienti bën check-in në lokal, berberi bashkohet me ftesë.
export default function Skano() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const modi = useModiAktiv();
  const [leja, kerkoLejen] = useCameraPermissions();
  const checkIn = useBejCheckIn();
  const [rezultati, setRezultati] = useState<Rezultati | null>(null);
  const [duke, setDuke] = useState(false);

  function mbyll() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  function uSkanua({ data }: BarcodeScanningResult) {
    if (duke || rezultati) return;
    setDuke(true);
    const qr = lexoQr(data);

    if (qr?.lloji === "lokali") {
      prekja.sukses();
      if (modi !== "klient") {
        router.replace({ pathname: "/lokali/[id]", params: { id: qr.lokaliId } });
        return;
      }
      checkIn.mutate(qr.lokaliId, {
        onSuccess: (teDhenat) => setRezultati({ lloji: "checkin", lokaliId: qr.lokaliId, teDhenat }),
        onError: (e) => {
          prekja.gabim();
          setRezultati({ lloji: "gabim", mesazhi: mesazhiIGabimitTeRezervimit(e, t), lokaliId: qr.lokaliId });
        },
        onSettled: () => setDuke(false),
      });
      return;
    }

    if (qr?.lloji === "ftesa" && modi === "biznes") {
      prekja.sukses();
      router.replace({ pathname: "/bashkohu", params: { kodi: qr.kodi } });
      return;
    }

    prekja.gabim();
    setRezultati({ lloji: "gabim", mesazhi: t("qr.iPanjohur") });
    setDuke(false);
  }

  const kaLeje = leja?.granted === true;

  return (
    <View style={styles.container}>
      {kaLeje && !rezultati ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={duke ? undefined : uSkanua}
        />
      ) : null}

      {kaLeje && !rezultati ? (
        <View style={styles.mbulesa} pointerEvents="none">
          <Text style={[styles.titulli, { marginTop: insets.top + 80 }]}>{t("qr.skanoTitulli")}</Text>
          <Text style={styles.teksti}>{t("qr.skanoTeksti")}</Text>
          <View style={styles.korniza}>
            <View style={[styles.kendi, styles.kendiMajtasLart]} />
            <View style={[styles.kendi, styles.kendiDjathtasLart]} />
            <View style={[styles.kendi, styles.kendiMajtasPoshte]} />
            <View style={[styles.kendi, styles.kendiDjathtasPoshte]} />
          </View>
        </View>
      ) : null}

      {leja && !kaLeje ? (
        <View style={styles.qendra}>
          <View style={styles.ikonaEMadhe}>
            <Ikona emri={ikonat.skano} madhesia={34} ngjyra={ngjyrat.ari} />
          </View>
          <Text style={styles.titulli}>{t("qr.skanoTitulli")}</Text>
          <Text style={styles.teksti}>{Platform.OS === "web" ? t("qr.vetemTelefon") : t("qr.paLeje")}</Text>
          {Platform.OS !== "web" && (
            <Butoni titulli={t("qr.lejoKameren")} ikona={ikonat.kamera} onPress={() => void kerkoLejen()} />
          )}
        </View>
      ) : null}

      {rezultati ? (
        <View style={styles.qendra}>
          <Animated.View
            entering={ZoomIn.springify().damping(12)}
            style={[styles.rrethi, rezultati.lloji === "gabim" && styles.rrethiGabim]}
          >
            <Ikona
              emri={rezultati.lloji === "checkin" ? ikonat.konfirmo : ikonat.gabim}
              madhesia={44}
              ngjyra={rezultati.lloji === "checkin" ? ngjyrat.mbiAri : ngjyrat.rrezik}
            />
          </Animated.View>
          <Animated.View entering={FadeIn.delay(150)} style={styles.rezultatiTeksti}>
            <Text style={styles.titulli}>
              {rezultati.lloji === "checkin" ? t("qr.checkInTitulli") : rezultati.mesazhi}
            </Text>
            {rezultati.lloji === "checkin" ? (
              <Text style={styles.teksti}>
                {t("qr.checkInTeksti", { sherbimi: rezultati.teDhenat.sherbimi_emri, ora: rezultati.teDhenat.ora_lokale })}
              </Text>
            ) : null}
          </Animated.View>
          <View style={styles.butonat}>
            {rezultati.lokaliId ? (
              <Butoni
                titulli={t("qr.hapLokalin")}
                ikona={ikonat.lokali}
                varianti={rezultati.lloji === "checkin" ? "dytesor" : "kryesor"}
                onPress={() => router.replace({ pathname: "/lokali/[id]", params: { id: rezultati.lokaliId! } })}
              />
            ) : (
              <Butoni titulli={t("qr.skano")} ikona={ikonat.skano} onPress={() => setRezultati(null)} />
            )}
            {rezultati.lloji === "checkin" && <Butoni titulli={t("lejet.vazhdo")} onPress={mbyll} />}
          </View>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("pergjithshme.anulo")}
        onPress={mbyll}
        hitSlop={10}
        style={[styles.mbyll, { top: insets.top + hapesira.md }]}
      >
        <Xham style={styles.mbyllXham}>
          <Ikona emri={ikonat.mbyll} madhesia={20} ngjyra="#FFFFFF" />
        </Xham>
      </Pressable>
    </View>
  );
}

const KORNIZA = 250;

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    // Gjithmonë e errët, si kamera, edhe në modin e çelët.
    container: {
      flex: 1,
      backgroundColor: "#0B0B0F",
    },
    mbulesa: {
      ...StyleSheet.absoluteFill,
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.35)",
      gap: hapesira.sm,
    },
    korniza: {
      width: KORNIZA,
      height: KORNIZA,
      marginTop: hapesira.xxl,
    },
    kendi: {
      position: "absolute",
      width: 44,
      height: 44,
      borderColor: ngjyrat.ari,
    },
    kendiMajtasLart: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 18 },
    kendiDjathtasLart: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 18 },
    kendiMajtasPoshte: { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 18 },
    kendiDjathtasPoshte: { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 18 },
    qendra: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: hapesira.xxl,
      gap: hapesira.md,
    },
    ikonaEMadhe: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
    },
    titulli: {
      color: "#FFFFFF",
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.4,
      textAlign: "center",
    },
    teksti: {
      color: "rgba(255,255,255,0.8)",
      fontSize: 15,
      lineHeight: 21,
      textAlign: "center",
      maxWidth: 300,
    },
    rrethi: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
    },
    rrethiGabim: {
      backgroundColor: ngjyrat.rrezikSfond,
    },
    rezultatiTeksti: {
      alignItems: "center",
      gap: hapesira.sm,
    },
    butonat: {
      alignSelf: "stretch",
      gap: hapesira.sm,
      marginTop: hapesira.lg,
    },
    mbyll: {
      position: "absolute",
      right: hapesira.lg,
    },
    mbyllXham: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
    },
  });
