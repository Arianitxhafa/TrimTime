import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AppState, StyleSheet, Text, View } from "react-native";
import { usePreferencat } from "../context/PreferencatContext";
import { useTema } from "../context/TemaContext";
import { verifiko } from "../lib/biometria";
import { hapesira } from "../theme";
import Butoni from "./Butoni";
import { ikonat } from "./Ikona";
import Marka, { Drita } from "./Marka";

// Kur kyçja është aktive, aplikacioni mbulohet sa herë hapet ose kthehet nga sfondi,
// derisa përdoruesi të verifikohet me Face ID / gjurmë gishti.
export default function KycjaBiometrike({ aktive, children }: { aktive: boolean; children: ReactNode }) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const { kycjaBiometrike } = usePreferencat();
  const kycur = aktive && kycjaBiometrike;
  // Kur kyçja aktivizohet nga Cilësimet, përdoruesi sapo u verifikua: kyçet herën tjetër që del në sfond.
  const [shkycur, setShkycur] = useState(() => !kycjaBiometrike);
  const dukeVerifikuar = useRef(false);

  const shkyc = useCallback(async () => {
    if (dukeVerifikuar.current) return;
    dukeVerifikuar.current = true;
    try {
      if (await verifiko(t("biometria.shkyc"))) setShkycur(true);
    } finally {
      dukeVerifikuar.current = false;
    }
  }, [t]);

  // Kyçet sapo aplikacioni del në sfond; kur kthehet, kërkon verifikimin vetë.
  useEffect(() => {
    if (!kycur) return;
    const abonimi = AppState.addEventListener("change", (gjendja) => {
      if (gjendja === "background") setShkycur(false);
      if (gjendja === "active") void shkyc();
    });
    return () => abonimi.remove();
  }, [kycur, shkyc]);

  useEffect(() => {
    if (kycur && !shkycur) void shkyc();
  }, [kycur, shkycur, shkyc]);

  // Mbulesë mbi aplikacionin, jo zëvendësim: navigimi ruhet dhe pas shkyçjes vazhdon aty ku ishte.
  return (
    <>
      {children}
      {kycur && !shkycur ? (
        <View style={[styles.ekrani, { backgroundColor: ngjyrat.sfondi }]}>
          <Drita lartesia={420} />
          <Marka madhesia={64} />
          <Text style={[styles.teksti, { color: ngjyrat.tekstiDyte }]}>{t("biometria.kycur")}</Text>
          <View style={styles.butoni}>
            <Butoni titulli={t("biometria.shkyc")} ikona={ikonat.biometria} onPress={() => void shkyc()} />
          </View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  ekrani: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center",
    gap: hapesira.lg,
    padding: hapesira.xxl,
  },
  teksti: {
    fontSize: 16,
    textAlign: "center",
  },
  butoni: {
    alignSelf: "stretch",
    marginTop: hapesira.xl,
  },
});
