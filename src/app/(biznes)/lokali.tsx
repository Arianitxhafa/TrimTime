import { Image } from "expo-image";
import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShtypja } from "../../hooks/useShtypja";
import { usePorositeEStudios, useProduktet } from "../../api/dyqani";
import { useLokaliIm, usePerditesoLokalin } from "../../api/lokalet";
import { useOrari } from "../../api/orari";
import { useSherbimet } from "../../api/sherbimet";
import Butoni from "../../components/Butoni";
import Ikona, { ikonat, type EmriIkones } from "../../components/Ikona";
import LogoStudio from "../../components/LogoStudio";
import { FOTO_E_LOKALIT, STUDIO_ID } from "../../lib/studio";
import { GabimiIFormes } from "../../components/KornizaAuth";
import { useAuth } from "../../context/AuthContext";
import { useStilet, useTema } from "../../context/TemaContext";
import type { Lokali } from "../../lib/tipet";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../../theme";

export default function TabiLokali() {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const { data, isPending, isError, refetch } = useLokaliIm();

  if (isPending) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }

  if (isError) {
    return <PaLokal gabim onRiprovo={refetch} />;
  }

  if (!data) return <PaLokal />;

  return <PaneliILokalit lokali={data.lokali} eshtePronar={data.roli === "pronar"} />;
}

function PaLokal({ gabim = false, onRiprovo }: { gabim?: boolean; onRiprovo?: () => void }) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, styles.qendra, { paddingTop: insets.top }]}>
      <View style={styles.ilustrimi}>
        <View style={styles.ilustrimiBrenda}>
          <Ikona emri={ikonat.lokali} madhesia={38} ngjyra={ngjyrat.mbiAri} />
        </View>
      </View>
      <Text style={styles.boshTitulli}>{gabim ? t("zbulo.gabim") : t("lokali.krijoTitulli")}</Text>
      {!gabim && <Text style={styles.boshTeksti}>{t("lokali.krijoTeksti")}</Text>}
      <View style={styles.boshButonat}>
        {gabim ? (
          <Butoni titulli={t("zbulo.provoPerseri")} ikona={ikonat.kthe} onPress={() => onRiprovo?.()} />
        ) : (
          <Butoni titulli={t("lokali.keKod")} ikona={ikonat.qr} onPress={() => router.push("/bashkohu")} />
        )}
      </View>
    </View>
  );
}

function PaneliILokalit({ lokali, eshtePronar }: { lokali: Lokali; eshtePronar: boolean }) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const sherbimet = useSherbimet(lokali.id);
  const orari = useOrari(lokali.id);
  const perditeso = usePerditesoLokalin(lokali.id);
  const perdoruesiId = useAuth().sesioni?.user.id;
  const porosite = usePorositeEStudios(true);
  const produktet = useProduktet();
  const porositeEHapura = porosite.data?.filter((p) => p.statusi === "e_re" || p.statusi === "gati").length;

  const scrollY = useSharedValue(0);
  const neScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });
  // Kopertina ngrihet më ngadalë se lista dhe zmadhohet kur tërhiqet poshtë.
  const stiliIKopertines = useAnimatedStyle(() => {
    const y = scrollY.get();
    return {
      transform: [
        { translateY: y > 0 ? y * 0.45 : y / 2 },
        { scale: interpolate(y, [-200, 0], [1.4, 1], Extrapolation.CLAMP) },
      ],
    };
  });

  const kaSherbime = (sherbimet.data ?? []).some((s) => s.aktiv);
  const kaOrar = (orari.data ?? []).length > 0;
  const mundTePublikohet = kaSherbime && kaOrar;

  return (
    <Animated.ScrollView
      style={styles.container}
      onScroll={neScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
    >
      <View style={[styles.kopertina, { height: 240 + insets.top }]}>
        <Animated.View style={[StyleSheet.absoluteFill, stiliIKopertines]}>
        {lokali.kopertina_url ? (
          <Image source={{ uri: lokali.kopertina_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : lokali.id === STUDIO_ID ? (
          <Image source={FOTO_E_LOKALIT} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.kopertinaBosh]}>
            <Ikona emri={ikonat.gershere} madhesia={48} ngjyra={ngjyrat.ari} />
          </View>
        )}
        </Animated.View>
        <LinearGradient
          colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0)", ngjyrat.sfondi]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.permbajtja}>
        <View style={styles.koka}>
          <View style={styles.logo}>
            {lokali.logo_url ? (
              <Image source={{ uri: lokali.logo_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : lokali.id === STUDIO_ID ? (
              <LogoStudio madhesia={80} />
            ) : (
              <Text style={styles.logoShkronja}>{lokali.emri.charAt(0).toUpperCase()}</Text>
            )}
          </View>
          <Text style={styles.emri}>{lokali.emri}</Text>
          <Text style={styles.adresa}>
            {lokali.adresa}, {lokali.qyteti}
          </Text>
        </View>

        {eshtePronar ? (
          <Animated.View entering={FadeInDown.delay(120).duration(420)} style={styles.karta}>
            <View style={styles.publikimi}>
              <View style={[styles.pika, { backgroundColor: lokali.i_publikuar ? "#3DD68C" : ngjyrat.tekstiZbehte }]} />
              <View style={styles.publikimiTeksti}>
                <Text style={styles.kartaTitulli}>
                  {lokali.i_publikuar ? t("lokali.publikuar") : t("lokali.draft")}
                </Text>
                <Text style={styles.kartaTeksti}>
                  {lokali.i_publikuar ? t("lokali.publikuarTeksti") : t("lokali.draftTeksti")}
                </Text>
              </View>
              <Switch
                value={lokali.i_publikuar}
                disabled={perditeso.isPending || (!lokali.i_publikuar && !mundTePublikohet)}
                onValueChange={(v) => perditeso.mutate({ i_publikuar: v })}
                trackColor={{ true: ngjyrat.ari, false: ngjyrat.kufiri }}
                thumbColor="#FFFFFF"
                accessibilityLabel={t("lokali.publikuar")}
              />
            </View>
            <GabimiIFormes mesazhi={perditeso.isError ? t("pergjithshme.gabimPapritur") : null} />
            {!lokali.i_publikuar && (
              <View style={styles.kushtet}>
                <Text style={styles.kushtetTitulli}>{t("lokali.kushtet")}</Text>
                <Kushti iPlotesuar={kaSherbime} teksti={t("lokali.kushtiSherbimet")} />
                <Kushti iPlotesuar={kaOrar} teksti={t("lokali.kushtiOrari")} />
                <Kushti iPlotesuar={Boolean(lokali.kopertina_url)} teksti={t("lokali.kushtiFoto")} />
              </View>
            )}
          </Animated.View>
        ) : (
          <View style={styles.karta}>
            <Text style={styles.kartaTitulli}>{t("lokali.jeBerber")}</Text>
            <Text style={styles.kartaTeksti}>{t("lokali.jeBerberTeksti")}</Text>
          </View>
        )}

        <Text style={styles.seksioni}>{t("lokali.menaxho")}</Text>
        <View style={styles.pllakat}>
          {[
            ...(eshtePronar
              ? [
                  { ikona: ikonat.lokali, titulli: t("lokali.info"), href: "/menaxho/info" as Href },
                  { ikona: ikonat.ora, titulli: t("lokali.orari"), href: "/menaxho/orari" as Href },
                  {
                    ikona: ikonat.gershere,
                    titulli: t("lokali.sherbimet"),
                    vlera: sherbimet.data ? String(sherbimet.data.length) : undefined,
                    href: "/menaxho/sherbimet" as Href,
                  },
                ]
              : []),
            { ikona: ikonat.klientet, titulli: t("lokali.stafi"), href: "/menaxho/stafi" as Href },
            {
              ikona: ikonat.shenime,
              titulli: t("dyqani.porosite"),
              vlera: porositeEHapura ? String(porositeEHapura) : undefined,
              href: "/menaxho/porosite" as Href,
            },
            ...(eshtePronar
              ? [
                  {
                    ikona: ikonat.cante,
                    titulli: t("dyqani.produktet"),
                    vlera: produktet.data ? String(produktet.data.length) : undefined,
                    href: "/menaxho/produktet" as Href,
                  },
                ]
              : []),
            ...(perdoruesiId
              ? [
                  {
                    ikona: ikonat.kalendar,
                    titulli: t("berberi.orariIm"),
                    href: { pathname: "/menaxho/berberi/[id]", params: { id: perdoruesiId } } as Href,
                  },
                ]
              : []),
            { ikona: ikonat.kamera, titulli: t("portofoli.titulli"), href: "/menaxho/portofoli" as Href },
            { ikona: ikonat.qr, titulli: t("qr.titulli"), href: "/menaxho/qr" as Href },
            {
              ikona: ikonat.yll,
              titulli: t("lokali.vleresimet"),
              vlera:
                lokali.vleresimi_mesatar != null && lokali.nr_vleresimeve > 0
                  ? `★ ${Number(lokali.vleresimi_mesatar).toFixed(1)}`
                  : undefined,
              href: { pathname: "/vleresimet/[lokaliId]", params: { lokaliId: lokali.id } } as Href,
            },
            ...(eshtePronar
              ? [
                  { ikona: ikonat.etiketa, titulli: t("lokali.promocionet"), href: "/menaxho/promocionet" as Href },
                  {
                    ikona: ikonat.dhurate,
                    titulli: t("lokali.besnikeria"),
                    vlera: lokali.besnikeria_aktive ? `${lokali.besnikeria_vizita}+1` : undefined,
                    href: "/menaxho/besnikeria" as Href,
                  },
                  { ikona: ikonat.grafik, titulli: t("analitika.titulli"), href: "/menaxho/analitika" as Href },
                ]
              : []),
            {
              ikona: ikonat.zbulo,
              titulli: t("lokali.shikoPublik"),
              href: { pathname: "/lokali/[id]", params: { id: lokali.id } } as Href,
            },
          ].map((a, i) => (
            <Pllaka key={a.titulli} {...a} vonesa={180 + i * 45} />
          ))}
        </View>
      </View>
    </Animated.ScrollView>
  );
}

function Kushti({ iPlotesuar, teksti }: { iPlotesuar: boolean; teksti: string }) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  return (
    <View style={styles.kushti}>
      <Ikona
        emri={iPlotesuar ? ikonat.perfundo : ikonat.ora}
        madhesia={16}
        ngjyra={iPlotesuar ? "#3DD68C" : ngjyrat.tekstiZbehte}
      />
      <Text style={[styles.kushtiTeksti, iPlotesuar && styles.kushtiIPlotesuar]}>{teksti}</Text>
    </View>
  );
}

type PllakaProps = {
  ikona: EmriIkones;
  titulli: string;
  href: Href;
  vlera?: string;
  vonesa: number;
};

// Pllakë e menysë: ikona në rreth, titulli dhe një vlerë e shkurtër; zvogëlohet pak nën gisht.
function Pllaka({ ikona, titulli, href, vlera, vonesa }: PllakaProps) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const shtypja = useShtypja(0.95);
  return (
    <Animated.View entering={FadeInDown.delay(vonesa).duration(400)} style={styles.pllakaVendi}>
      <Animated.View style={shtypja.stili}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={vlera ? `${titulli}, ${vlera}` : titulli}
          onPressIn={shtypja.onPressIn}
          onPressOut={shtypja.onPressOut}
          onPress={() => router.push(href)}
          style={styles.pllaka}
        >
          <View style={styles.pllakaKoka}>
            <View style={styles.rreshtiIkona}>
              <Ikona emri={ikona} madhesia={18} ngjyra={ngjyrat.ari} />
            </View>
            {vlera ? <Text style={styles.rreshtiVlera}>{vlera}</Text> : null}
          </View>
          <Text style={styles.pllakaTitulli} numberOfLines={2}>
            {titulli}
          </Text>
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
    qendra: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: hapesira.xxl,
    },
    ilustrimi: {
      width: 132,
      height: 132,
      borderRadius: 66,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hapesira.xl,
    },
    ilustrimiBrenda: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
    },
    boshTitulli: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 24,
      textAlign: "center",
      marginBottom: hapesira.sm,
    },
    boshTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
      maxWidth: 340,
    },
    boshButonat: {
      alignSelf: "stretch",
      gap: hapesira.lg,
      marginTop: hapesira.xxl,
      alignItems: "center",
    },
    lidhja: {
      color: ngjyrat.ari,
      fontSize: 14,
      fontWeight: "700",
      textAlign: "center",
    },
    kopertina: {
      overflow: "hidden",
      backgroundColor: "#0A0A0A",
    },
    pllakat: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: hapesira.sm,
    },
    pllakaVendi: {
      width: "48.5%",
    },
    pllaka: {
      minHeight: 104,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderCurve: "continuous",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.md,
      justifyContent: "space-between",
      gap: hapesira.md,
    },
    pllakaKoka: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    pllakaTitulli: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 15,
    },
    kopertinaBosh: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: ngjyrat.ariIErret,
    },
    permbajtja: {
      paddingHorizontal: hapesira.xl,
    },
    koka: {
      alignItems: "center",
      marginTop: -44,
      marginBottom: hapesira.xl,
    },
    logo: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: "#0A0A0A",
      borderWidth: 4,
      borderColor: ngjyrat.sfondi,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    logoShkronja: {
      ...shkronjat.titull,
      color: ngjyrat.mbiAri,
      fontSize: 36,
    },
    emri: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 24,
      letterSpacing: -0.3,
      marginTop: hapesira.md,
      textAlign: "center",
    },
    adresa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      marginTop: 4,
      textAlign: "center",
    },
    karta: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      gap: 4,
      marginBottom: hapesira.xxl,
    },
    publikimi: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
    },
    publikimiTeksti: {
      flex: 1,
      gap: 2,
    },
    pika: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    kartaTitulli: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "800",
    },
    kartaTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      lineHeight: 18,
    },
    kushtet: {
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
      marginTop: hapesira.md,
      paddingTop: hapesira.md,
      gap: hapesira.sm,
    },
    kushtetTitulli: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.tekstiDyte,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    kushti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
    },
    kushtiTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
    },
    kushtiIPlotesuar: {
      color: ngjyrat.teksti,
    },
    seksioni: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: hapesira.md,
    },
    grupi: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      overflow: "hidden",
    },
    rreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      paddingHorizontal: hapesira.lg,
      height: 58,
    },
    rreshtiMeKufi: {
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
    shtypur: {
      backgroundColor: ngjyrat.siperfaqja2,
    },
    rreshtiIkona: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
    },
    rreshtiTitulli: {
      flex: 1,
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "600",
    },
    rreshtiVlera: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      fontWeight: "600",
    },
  });
