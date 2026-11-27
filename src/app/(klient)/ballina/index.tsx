import { router } from "expo-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNumriIKlienteve } from "../../../api/klientet";
import { useLokali } from "../../../api/lokalet";
import { useOrari } from "../../../api/orari";
import { useHapUdhezimet } from "../../../api/udhezimet";
import { useTerminetEMia } from "../../../api/terminet";
import Butoni from "../../../components/Butoni";
import Ikona, { ikonat, type EmriIkones } from "../../../components/Ikona";
import LogoStudio from "../../../components/LogoStudio";
import ShiritiIBerberit from "../../../components/ShiritiIBerberit";
import TerminiIRadhes from "../../../components/TerminiIRadhes";
import { useAuth } from "../../../context/AuthContext";
import { useStilet, useTema } from "../../../context/TemaContext";
import { useShtypja } from "../../../hooks/useShtypja";
import { EMRI_I_STUDIOS, INSTAGRAMI, STUDIO_ID } from "../../../lib/studio";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../../../theme";

// Ballina e klientit: logoja, termini i radhës, karta "Termine" (rezervo, terminet e mia), karta e
// Studios (hapur/mbyllur, rruga) dhe kontaktet. Gjithçka hyn me radhë.
export default function Ballina() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { emriIShfaqur } = useAuth();
  const studio = useLokali(STUDIO_ID).data;
  const hapUdhezimet = useHapUdhezimet();
  const orari = useOrari(STUDIO_ID).data ?? [];
  const terminet = useTerminetEMia();
  const klientet = useNumriIKlienteve();

  const tani = terminet.dataUpdatedAt;
  const iRadhes = (terminet.data ?? [])
    .filter((x) => (x.statusi === "ne_pritje" || x.statusi === "konfirmuar") && new Date(x.fillon_me).getTime() > tani)
    .sort((a, b) => a.fillon_me.localeCompare(b.fillon_me))[0];

  const sot = new Date().getDay();
  const intervaletESotme = orari.filter((o) => o.dita === sot);
  const mbylletSot = intervaletESotme.length ? intervaletESotme[intervaletESotme.length - 1].mbyllet : null;
  const emriIPare = emriIShfaqur.includes("@") || /^\+?\d+$/.test(emriIShfaqur) ? "" : emriIShfaqur.split(" ")[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + hapesira.md, paddingBottom: insets.bottom + 110 }}
    >
      <View style={styles.koka}>
        <LogoStudio madhesia={64} />
        <View style={styles.kokaTeksti}>
          <Text style={styles.emri}>{EMRI_I_STUDIOS}</Text>
          <Text style={styles.pershendetja} numberOfLines={1}>
            {emriIPare ? t("ballina.pershendetjaMeEmer", { emri: emriIPare }) : t("ballina.pershendetja")}
          </Text>
        </View>
        <ShiritiIBerberit gjeresia={36} lartesia={6} />
      </View>

      <View style={styles.permbajtja}>
        {iRadhes ? <TerminiIRadhes termini={iRadhes} /> : null}

        <Karta vonesa={100}>
          <View style={styles.kartaKoka}>
            <View style={styles.ikonaKuti}>
              <Ikona emri={ikonat.kalendar} madhesia={22} ngjyra={ngjyrat.ari} />
            </View>
            {klientet.data ? (
              <Animated.View entering={ZoomIn.delay(350).springify()} style={styles.distinktivi}>
                <Ikona emri={ikonat.klientet} madhesia={16} ngjyra={ngjyrat.mbiAri} />
                <View>
                  <Text style={styles.distinktiviNumri}>{klientet.data}</Text>
                  <Text style={styles.distinktiviEtiketa}>{t("ballina.klient")}</Text>
                </View>
              </Animated.View>
            ) : null}
          </View>
          <Text style={styles.kartaTitulli}>{t("ballina.termineTitulli")}</Text>
          <Text style={styles.kartaTeksti}>{t("ballina.termineTeksti")}</Text>
          <Butoni
            titulli={t("ballina.rezervo")}
            ikona={ikonat.kalendar}
            onPress={() => router.navigate("/studio")}
          />
          <Butoni
            titulli={t("ballina.terminetEMia")}
            ikona={ikonat.ora}
            varianti="dytesor"
            onPress={() => router.navigate("/terminet-e-mia")}
          />
        </Karta>

        <Karta vonesa={180}>
          <View style={styles.kartaKoka}>
            <View style={styles.ikonaKuti}>
              <Ikona emri={ikonat.gershere} madhesia={22} ngjyra={ngjyrat.ari} />
            </View>
            {studio && orari.length > 0 ? (
              <View style={[styles.statusi, studio.i_hapur_tani ? styles.statusiHapur : null]}>
                <View style={[styles.pika, { backgroundColor: studio.i_hapur_tani ? ngjyrat.jeshile : ngjyrat.tekstiZbehte }]} />
                <Text style={styles.statusiTeksti}>
                  {studio.i_hapur_tani
                    ? mbylletSot
                      ? t("ballina.hapurDeri", { ora: mbylletSot })
                      : t("lokali.hapur")
                    : t("lokali.mbyllur")}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.kartaTitulli}>{EMRI_I_STUDIOS}</Text>
          <Text style={styles.kartaTeksti}>
            {studio ? `${studio.adresa}, ${studio.qyteti}` : t("ballina.studioTeksti")}
          </Text>
          <Butoni
            titulli={t("ballina.shikoStudion")}
            ikona={ikonat.gershere}
            onPress={() => router.push({ pathname: "/lokali/[id]", params: { id: STUDIO_ID } })}
          />
          <Butoni titulli={t("ballina.rruga")} ikona={ikonat.harta} varianti="dytesor" onPress={() => studio && hapUdhezimet(studio)} />
        </Karta>

        <Animated.View entering={FadeInDown.delay(260).duration(420)} style={styles.kontaktet}>
          {studio?.telefoni ? (
            <Kontakti
              ikona={ikonat.telefoni}
              etiketa={t("profiliLokalit.thirr")}
              onPress={() => void Linking.openURL(`tel:${studio.telefoni?.replace(/\s/g, "")}`)}
            />
          ) : null}
          <Kontakti ikona={ikonat.kamera} etiketa="Instagram" onPress={() => void Linking.openURL(INSTAGRAMI)} />
          <Kontakti ikona={ikonat.harta} etiketa={t("profiliLokalit.udhezimet")} onPress={() => studio && hapUdhezimet(studio)} />
        </Animated.View>
      </View>
    </ScrollView>
  );
}

function Karta({ children, vonesa }: { children: ReactNode; vonesa: number }) {
  const styles = useStilet(krijoStilet);
  return (
    <Animated.View entering={FadeInDown.delay(vonesa).springify().damping(18)} style={styles.karta}>
      {children}
    </Animated.View>
  );
}

function Kontakti({ ikona, etiketa, onPress }: { ikona: EmriIkones; etiketa: string; onPress: () => void }) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const shtypja = useShtypja(0.9);
  return (
    <Animated.View style={shtypja.stili}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={etiketa}
        onPressIn={shtypja.onPressIn}
        onPressOut={shtypja.onPressOut}
        onPress={onPress}
        style={styles.kontakti}
      >
        <Ikona emri={ikona} madhesia={24} ngjyra={ngjyrat.ari} />
      </Pressable>
    </Animated.View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    koka: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      paddingHorizontal: hapesira.xl,
      marginBottom: hapesira.lg,
    },
    kokaTeksti: {
      flex: 1,
    },
    emri: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 26,
      letterSpacing: -0.6,
      fontWeight: "800",
    },
    pershendetja: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      marginTop: 2,
    },
    permbajtja: {
      paddingHorizontal: hapesira.xl,
      gap: hapesira.lg,
    },
    karta: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: 28,
      borderCurve: "continuous",
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.xl,
      gap: hapesira.md,
      shadowColor: "#8B6914",
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2,
    },
    kartaKoka: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    ikonaKuti: {
      width: 52,
      height: 52,
      borderRadius: 16,
      borderCurve: "continuous",
      borderWidth: 1.5,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
    },
    distinktivi: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: ngjyrat.theksi,
      borderRadius: rrezja.md,
      paddingHorizontal: hapesira.md,
      paddingVertical: 6,
    },
    distinktiviNumri: {
      ...shkronjat.titull,
      color: "#1A1712",
      fontSize: 20,
      lineHeight: 22,
    },
    distinktiviEtiketa: {
      ...shkronjat.etiketeBold,
      color: "#1A1712",
      fontSize: 10,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    kartaTitulli: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 30,
      letterSpacing: -0.8,
      fontWeight: "800",
    },
    kartaTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 16,
      lineHeight: 22,
      marginBottom: hapesira.xs,
    },
    statusi: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: rrezja.plote,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    statusiHapur: {
      backgroundColor: ngjyrat.ariIErret,
    },
    pika: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusiTeksti: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 13,
    },
    kontaktet: {
      flexDirection: "row",
      justifyContent: "center",
      gap: hapesira.lg,
      marginTop: hapesira.sm,
    },
    kontakti: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: ngjyrat.ariIErret,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      alignItems: "center",
      justifyContent: "center",
    },
  });
