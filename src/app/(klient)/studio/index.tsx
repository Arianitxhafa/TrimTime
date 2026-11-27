import { Image } from "expo-image";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStafi } from "../../../api/stafi";
import Ikona, { ikonat } from "../../../components/Ikona";
import LogoStudio from "../../../components/LogoStudio";
import ShiritiIBerberit from "../../../components/ShiritiIBerberit";
import { useStilet, useTema } from "../../../context/TemaContext";
import { useShtypja } from "../../../hooks/useShtypja";
import { prekja } from "../../../lib/prekja";
import { EMRI_I_STUDIOS, FOTO_E_LOKALIT, STUDIO_ID } from "../../../lib/studio";
import type { AnetariIStafit } from "../../../lib/tipet";
import { hapesira, shkronjat, type Ngjyrat } from "../../../theme";

// Tab-i Rezervo: hapi i parë i rezervimit, zgjedhja e berberit. Sipër, karta e Studios çon te faqja
// e plotë (shërbimet, orari, vlerësimet).
export default function Berberet() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const stafi = useStafi(STUDIO_ID);
  const berberet = (stafi.data ?? []).filter((b) => b.aktiv);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + hapesira.lg, paddingBottom: insets.bottom + 110, paddingHorizontal: hapesira.xl }}
    >
      <Animated.Text entering={FadeInDown.duration(380)} style={styles.etiketa}>
        {t("rezervimi.berberet")}
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(60).duration(380)} style={styles.titulli}>
        {t("rezervimi.zgjidhBerberin")}
      </Animated.Text>

      <Animated.View entering={FadeInDown.delay(120).duration(420)}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: "/lokali/[id]", params: { id: STUDIO_ID } })}
          style={({ pressed }) => [styles.studio, pressed && styles.shtypur]}
        >
          <Image source={FOTO_E_LOKALIT} style={styles.studioFoto} contentFit="cover" />
          <View style={styles.studioTeksti}>
            <Text style={styles.studioEmri}>{EMRI_I_STUDIOS}</Text>
            <Text style={styles.studioNentitulli}>{t("rezervimi.shikoStudion")}</Text>
          </View>
          <Ikona emri={ikonat.djathtas} madhesia={16} ngjyra={ngjyrat.tekstiZbehte} />
        </Pressable>
      </Animated.View>

      {stafi.isPending ? (
        <ActivityIndicator color={ngjyrat.ari} style={styles.ngarkimi} />
      ) : berberet.length === 0 ? (
        <Text style={styles.bosh}>{t("rezervimi.paBerbere")}</Text>
      ) : (
        <View style={styles.lista}>
          {berberet.map((b, i) => (
            <KartaEBerberit key={b.profili_id} berberi={b} vonesa={180 + i * 70} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function KartaEBerberit({ berberi, vonesa }: { berberi: AnetariIStafit; vonesa: number }) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const shtypja = useShtypja(0.97);
  return (
    <Animated.View entering={FadeInDown.delay(vonesa).springify().damping(18)}>
      <Animated.View style={shtypja.stili}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={berberi.emri}
          onPressIn={shtypja.onPressIn}
          onPressOut={shtypja.onPressOut}
          onPress={() => {
            prekja.lehte();
            router.push({ pathname: "/rezervo/berberi/[id]", params: { id: berberi.profili_id, emri: berberi.emri } });
          }}
          style={styles.karta}
        >
          {berberi.foto_url ? (
            <Image source={{ uri: berberi.foto_url }} style={styles.foto} contentFit="cover" />
          ) : (
            <LogoStudio madhesia={84} />
          )}
          <View style={styles.kartaTeksti}>
            <View style={styles.emriRreshti}>
              <ShiritiIBerberit gjeresia={28} lartesia={8} />
              <Text style={styles.emri} numberOfLines={1}>
                {berberi.emri.split(" ")[0] || "—"}
              </Text>
            </View>
          </View>
          <Ikona emri={ikonat.djathtas} madhesia={18} ngjyra={ngjyrat.tekstiZbehte} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    etiketa: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    titulli: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 38,
      lineHeight: 42,
      letterSpacing: -1.2,
      fontWeight: "800",
      marginTop: 4,
      marginBottom: hapesira.xl,
    },
    studio: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      backgroundColor: ngjyrat.ariIErret,
      borderRadius: 22,
      borderCurve: "continuous",
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.sm,
      paddingRight: hapesira.lg,
      marginBottom: hapesira.lg,
    },
    studioFoto: {
      width: 56,
      height: 56,
      borderRadius: 16,
    },
    studioTeksti: {
      flex: 1,
    },
    studioEmri: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 16,
    },
    studioNentitulli: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      marginTop: 2,
    },
    lista: {
      gap: hapesira.lg,
    },
    karta: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.lg,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: 32,
      borderCurve: "continuous",
      padding: hapesira.lg,
      paddingRight: hapesira.xl,
      shadowColor: "#8B6914",
      shadowOpacity: 0.1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    foto: {
      width: 84,
      height: 84,
      borderRadius: 42,
    },
    kartaTeksti: {
      flex: 1,
    },
    emriRreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
    },
    emri: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 28,
      letterSpacing: -0.6,
      flexShrink: 1,
    },
    ngarkimi: {
      marginTop: hapesira.xxl,
    },
    bosh: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      textAlign: "center",
      marginTop: hapesira.xxl,
    },
    shtypur: {
      opacity: 0.8,
    },
  });
