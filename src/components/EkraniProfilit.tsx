import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBesnikeria } from "../api/besnikeria";
import { useLokali } from "../api/lokalet";
import { useTerminetEMia } from "../api/terminet";
import { useHapUdhezimet } from "../api/udhezimet";
import { useAuth } from "../context/AuthContext";
import { useStilet, useTema } from "../context/TemaContext";
import { useModiAktiv } from "../hooks/useModiAktiv";
import { formatoDaten } from "../lib/datat";
import { formatoCmimin } from "../lib/formatimi";
import { EMRI_I_STUDIOS, FOTO_E_LOKALIT, INSTAGRAMI, STUDIO_ID } from "../lib/studio";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../theme";
import Avatar from "./Avatar";
import DialogKonfirmimi from "./DialogKonfirmimi";
import Ikona, { ikonat, type EmriIkones } from "./Ikona";
import KartaEBesnikerise from "./KartaEBesnikerise";
import ShiritiIBerberit from "./ShiritiIBerberit";

const LARTESIA_E_BANERIT = 210;

// Profili: baneri me foton e Studios, avatari mbi të, shifrat e klientit (vizita, shpenzuar,
// termini i radhës), karta e besnikërisë, kontaktet e Studios dhe llogaria.
// `meTitullNative` mbetet për pajtueshmëri: koka tani është baneri, jo titulli i iOS.
export default function EkraniProfilit(_props: { meTitullNative?: boolean }) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { sesioni, emriIShfaqur, dil } = useAuth();
  const modi = useModiAktiv();
  const eshteKlient = modi === "klient";
  const [dialogu, setDialogu] = useState(false);

  const studio = useLokali(STUDIO_ID).data;
  const terminet = useTerminetEMia();
  const hapUdhezimet = useHapUdhezimet();
  const besnikeria = useBesnikeria(
    STUDIO_ID,
    sesioni ? `id:${sesioni.user.id}` : undefined,
    eshteKlient && Boolean(studio?.besnikeria_aktive),
  );

  const lista = eshteKlient ? (terminet.data ?? []) : [];
  const teKryera = lista.filter((x) => x.statusi === "perfunduar");
  const shpenzuar = teKryera.reduce((shuma, x) => shuma + x.cmimi_centa, 0);
  const tani = terminet.dataUpdatedAt;
  const iRadhes = lista
    .filter((x) => (x.statusi === "ne_pritje" || x.statusi === "konfirmuar") && new Date(x.fillon_me).getTime() > tani)
    .sort((a, b) => a.fillon_me.localeCompare(b.fillon_me))[0];

  const emri = emriIShfaqur || t("profili.perdorues");

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        {/* Baneri: brendësia e Studios, që zbehet te sfondi. */}
        <View style={[styles.baneri, { height: LARTESIA_E_BANERIT + insets.top }]}>
          <Image source={FOTO_E_LOKALIT} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0.1)", ngjyrat.sfondi]}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <View style={styles.koka}>
          <Animated.View entering={ZoomIn.springify().damping(13)} style={styles.avatari}>
            <Avatar emri={emri} madhesia={96} />
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(120).duration(420)} style={styles.emri}>
            {emri}
          </Animated.Text>
          {sesioni?.user.email ? <Text style={styles.email}>{sesioni.user.email}</Text> : null}
          <Animated.View entering={FadeInDown.delay(180).duration(420)} style={styles.roli}>
            <Ikona emri={eshteKlient ? ikonat.gershere : ikonat.lokali} madhesia={13} ngjyra={ngjyrat.ari} />
            <Text style={styles.roliTeksti}>
              {eshteKlient ? t("roli.etiketaKlient") : `${t("roli.etiketaBiznes")} · ${EMRI_I_STUDIOS}`}
            </Text>
          </Animated.View>
        </View>

        <View style={styles.permbajtja}>
          {eshteKlient ? (
            <Animated.View entering={FadeInDown.delay(240).duration(450)} style={styles.shifrat}>
              <Shifra vlera={String(teKryera.length)} etiketa={t("profili.vizita")} />
              <Shifra vlera={formatoCmimin(shpenzuar)} etiketa={t("profili.shpenzuar")} />
              <Shifra
                vlera={iRadhes ? formatoDaten(iRadhes.data_lokale, t) : "—"}
                etiketa={iRadhes ? `${t("profili.iRadhes")} · ${iRadhes.ora_lokale}` : t("profili.iRadhes")}
                onPress={() => router.navigate(iRadhes ? "/terminet-e-mia" : "/studio")}
              />
            </Animated.View>
          ) : null}

          {eshteKlient && studio?.besnikeria_aktive && studio.besnikeria_shperblimi ? (
            <Animated.View entering={FadeInDown.delay(300).duration(450)} style={styles.besnikeria}>
              <KartaEBesnikerise
                besnikeria={
                  besnikeria.data ?? {
                    vizita: 0,
                    te_disponueshme: 0,
                    progresi: 0,
                    nevojiten: studio.besnikeria_vizita,
                    shperblimi: studio.besnikeria_shperblimi,
                  }
                }
                shenimi={t("besnikeria.tregoNeLokal")}
              />
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(340).duration(450)}>
            <View style={styles.seksioniRreshti}>
              <Text style={styles.seksioni}>{EMRI_I_STUDIOS}</Text>
              <ShiritiIBerberit gjeresia={40} lartesia={5} />
            </View>
            <View style={styles.grupi}>
              {eshteKlient ? (
                <Rreshti ikona={ikonat.gershere} titulli={t("profili.shikoStudion")} onPress={() => router.navigate("/studio")} />
              ) : null}
              {studio?.telefoni ? (
                <Rreshti
                  ikona={ikonat.telefoni}
                  titulli={t("profili.thirrStudion")}
                  meKufi={eshteKlient}
                  onPress={() => void Linking.openURL(`tel:${studio.telefoni?.replace(/\s/g, "")}`)}
                />
              ) : null}
              {studio ? (
                <Rreshti ikona={ikonat.harta} titulli={t("profili.udhezimet")} meKufi onPress={() => hapUdhezimet(studio)} />
              ) : null}
              <Rreshti ikona={ikonat.kamera} titulli="Instagram · @studioburimi" meKufi onPress={() => void Linking.openURL(INSTAGRAMI)} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(450)}>
            <Text style={[styles.seksioni, styles.seksioniTjeter]}>{t("profili.llogaria")}</Text>
            <View style={styles.grupi}>
              <Rreshti ikona={ikonat.personi} titulli={t("profili.teDhenat")} onPress={() => router.push("/profili-im")} />
              {eshteKlient ? (
                <Rreshti ikona={ikonat.dhurate} titulli={t("profili.kartat")} meKufi onPress={() => router.push("/kartat")} />
              ) : null}
              {eshteKlient ? (
                <Rreshti ikona={ikonat.qr} titulli={t("profili.jeBerber")} meKufi onPress={() => router.push("/bashkohu")} />
              ) : null}
              <Rreshti ikona={ikonat.cilesimet} titulli={t("profili.cilesimet")} meKufi onPress={() => router.push("/cilesimet")} />
              <Rreshti ikona={ikonat.dil} titulli={t("profili.dil")} rrezik meKufi onPress={() => setDialogu(true)} />
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      <DialogKonfirmimi
        iDukshem={dialogu}
        titulli={t("profili.dilTitulli")}
        mesazhi={t("profili.dilMesazhi")}
        tekstiKonfirmimit={t("profili.dilKonfirmo")}
        rrezik
        onAnulo={() => setDialogu(false)}
        onKonfirmo={() => {
          setDialogu(false);
          dil();
        }}
      />
    </View>
  );
}

function Shifra({ vlera, etiketa, onPress }: { vlera: string; etiketa: string; onPress?: () => void }) {
  const styles = useStilet(krijoStilet);
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.shifra, pressed && styles.shtypur]}
    >
      <Text style={styles.shifraVlera} numberOfLines={1} adjustsFontSizeToFit>
        {vlera}
      </Text>
      <Text style={styles.shifraEtiketa} numberOfLines={2}>
        {etiketa}
      </Text>
    </Pressable>
  );
}

type RreshtiProps = {
  ikona: EmriIkones;
  titulli: string;
  rrezik?: boolean;
  meKufi?: boolean;
  onPress: () => void;
};

function Rreshti({ ikona, titulli, rrezik = false, meKufi = false, onPress }: RreshtiProps) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const ngjyra = rrezik ? ngjyrat.rrezik : ngjyrat.teksti;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.rreshti, meKufi && styles.rreshtiMeKufi, pressed && styles.shtypur]}
    >
      <View style={[styles.rreshtiIkona, rrezik && styles.rreshtiIkonaRrezik]}>
        <Ikona emri={ikona} madhesia={17} ngjyra={rrezik ? ngjyrat.rrezik : ngjyrat.ari} />
      </View>
      <Text style={[styles.rreshtiTeksti, { color: ngjyra }]}>{titulli}</Text>
      {!rrezik && <Ikona emri={ikonat.djathtas} madhesia={14} ngjyra={ngjyrat.tekstiZbehte} />}
    </Pressable>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    baneri: {
      overflow: "hidden",
      backgroundColor: "#0A0A0A",
    },
    koka: {
      alignItems: "center",
      gap: 4,
      marginTop: -56,
      paddingHorizontal: hapesira.xl,
      marginBottom: hapesira.xl,
    },
    avatari: {
      borderRadius: 54,
      borderWidth: 4,
      borderColor: ngjyrat.sfondi,
      marginBottom: hapesira.xs,
    },
    emri: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 26,
      letterSpacing: -0.5,
      fontWeight: "800",
      textAlign: "center",
    },
    email: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
    },
    roli: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: rrezja.plote,
      backgroundColor: ngjyrat.ariIErret,
      marginTop: hapesira.sm,
    },
    roliTeksti: {
      color: ngjyrat.teksti,
      fontSize: 13,
      fontWeight: "700",
    },
    permbajtja: {
      paddingHorizontal: hapesira.xl,
    },
    shifrat: {
      flexDirection: "row",
      gap: hapesira.sm,
      marginBottom: hapesira.lg,
    },
    shifra: {
      flex: 1,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderCurve: "continuous",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.md,
      gap: 2,
    },
    shifraVlera: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 20,
      letterSpacing: -0.4,
      fontVariant: ["tabular-nums"],
    },
    shifraEtiketa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 12,
      fontWeight: "600",
    },
    besnikeria: {
      marginBottom: hapesira.lg,
    },
    seksioniRreshti: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: hapesira.md,
    },
    seksioni: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    seksioniTjeter: {
      marginTop: hapesira.xl,
      marginBottom: hapesira.md,
    },
    grupi: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderCurve: "continuous",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ngjyrat.kufiri,
      overflow: "hidden",
    },
    rreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      paddingHorizontal: hapesira.lg,
      height: 56,
    },
    rreshtiMeKufi: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ngjyrat.kufiri,
    },
    rreshtiIkona: {
      width: 30,
      height: 30,
      borderRadius: 9,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
    },
    rreshtiIkonaRrezik: {
      backgroundColor: ngjyrat.rrezikSfond,
    },
    rreshtiTeksti: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
    },
    shtypur: {
      opacity: 0.85,
    },
  });
