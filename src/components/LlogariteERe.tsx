import { useTranslation } from "react-i18next";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOut, LinearTransition } from "react-native-reanimated";
import { useLlogaritePerAprovim, useNdryshoStatusinELlogarise } from "../api/klientet";
import { useStilet, useTema } from "../context/TemaContext";
import { dataISO, formatoDaten } from "../lib/datat";
import { prekja } from "../lib/prekja";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../theme";
import Avatar from "./Avatar";
import Ikona, { ikonat } from "./Ikona";

// Llogaritë e reja që presin aprovimin, sipër listës së klientëve (vetëm për pronarin). Aprovo e
// lejon klientin të rezervojë; Refuzo i shfaq atij "Refuzuar". Rreshti largohet me animacion.
export default function LlogariteERe({ aktiv }: { aktiv: boolean }) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const llogarite = useLlogaritePerAprovim(aktiv);
  const ndrysho = useNdryshoStatusinELlogarise();
  const lista = llogarite.data ?? [];
  if (!aktiv || lista.length === 0) return null;
  const nePritje = lista.filter((l) => l.statusi === "ne_pritje").length;

  return (
    <Animated.View entering={FadeInDown.duration(400)} layout={LinearTransition} style={styles.karta}>
      <View style={styles.koka}>
        <Text style={styles.titulli}>{t("aprovimi.titulli")}</Text>
        {nePritje > 0 ? (
          <View style={styles.numri}>
            <Text style={styles.numriTeksti}>{nePritje}</Text>
          </View>
        ) : null}
      </View>
      {lista.map((l) => (
        <Animated.View key={l.id} exiting={FadeOut.duration(250)} layout={LinearTransition} style={styles.rreshti}>
          <Avatar emri={l.emri || "?"} madhesia={40} />
          <View style={styles.teksti}>
            <Text style={styles.emri} numberOfLines={1}>
              {l.emri || t("profili.perdorues")}
            </Text>
            <Pressable
              accessibilityRole="link"
              disabled={!l.telefoni}
              onPress={() => void Linking.openURL(`tel:${l.telefoni}`)}
            >
              <Text style={styles.detaje} numberOfLines={1}>
                {l.telefoni ?? "—"} · {formatoDaten(dataISO(new Date(l.krijuar_me)), t)}
                {l.statusi === "refuzuar" ? ` · ${t("pritja.refuzuar")}` : ""}
              </Text>
            </Pressable>
          </View>
          {l.statusi === "ne_pritje" ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("aprovimi.refuzo")}
              disabled={ndrysho.isPending}
              onPress={() => {
                prekja.mesatare();
                ndrysho.mutate({ id: l.id, statusi: "refuzuar" });
              }}
              style={({ pressed }) => [styles.butoni, styles.butoniRefuzo, pressed && styles.shtypur]}
            >
              <Ikona emri={ikonat.mbyll} madhesia={16} ngjyra={ngjyrat.rrezik} />
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("aprovimi.aprovo")}
            disabled={ndrysho.isPending}
            onPress={() => {
              prekja.sukses();
              ndrysho.mutate({ id: l.id, statusi: "aprovuar" });
            }}
            style={({ pressed }) => [styles.butoni, styles.butoniAprovo, pressed && styles.shtypur]}
          >
            <Ikona emri={ikonat.konfirmo} madhesia={16} ngjyra={ngjyrat.mbiAri} />
            <Text style={styles.butoniTeksti}>{t("aprovimi.aprovo")}</Text>
          </Pressable>
        </Animated.View>
      ))}
    </Animated.View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    karta: {
      marginHorizontal: hapesira.xl,
      marginBottom: hapesira.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderCurve: "continuous",
      borderWidth: 1,
      borderColor: ngjyrat.theksi,
      padding: hapesira.lg,
      gap: hapesira.md,
    },
    koka: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
    },
    titulli: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 17,
    },
    numri: {
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      paddingHorizontal: 6,
      backgroundColor: ngjyrat.theksi,
      alignItems: "center",
      justifyContent: "center",
    },
    numriTeksti: {
      color: "#1A1712",
      fontSize: 13,
      fontWeight: "800",
    },
    rreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
    },
    teksti: {
      flex: 1,
    },
    emri: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 16,
    },
    detaje: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      marginTop: 2,
    },
    butoni: {
      height: 38,
      borderRadius: 19,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    butoniRefuzo: {
      width: 38,
      backgroundColor: ngjyrat.rrezikSfond,
    },
    butoniAprovo: {
      paddingHorizontal: 14,
      backgroundColor: ngjyrat.ari,
    },
    butoniTeksti: {
      color: ngjyrat.mbiAri,
      fontSize: 14,
      fontWeight: "700",
    },
    shtypur: {
      opacity: 0.75,
    },
  });
