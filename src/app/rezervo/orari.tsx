import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, SlideInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLokali } from "../../api/lokalet";
import { useOraretEBerberit, useRezervoMeSherbime, type OraEBerberit, type StatusiIOres } from "../../api/rezervimi";
import { useSherbimet } from "../../api/sherbimet";
import { mesazhiIGabimitTeRezervimit } from "../../api/terminet";
import Butoni from "../../components/Butoni";
import Ikona, { ikonat } from "../../components/Ikona";
import { GabimiIFormes } from "../../components/KornizaAuth";
import ShiritiIBerberit from "../../components/ShiritiIBerberit";
import { useStilet, useTema } from "../../context/TemaContext";
import { dataISO, formatoDaten, shtoDite } from "../../lib/datat";
import { formatoCmimin, formatoKohezgjatjen } from "../../lib/formatimi";
import { prekja } from "../../lib/prekja";
import { STUDIO_ID } from "../../lib/studio";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../../theme";

const DITE_PERPARA = 30;

// Orari i rezervimit: ditët me shigjeta, të gjitha orët e berberit me statusin e tyre (e lirë, në
// pritje, e rezervuar) dhe legjenda poshtë. Vetëm orët e lira zgjidhen; konfirmimi rezervon në server.
export default function OrariIRezervimit() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { berberiId, emri, sherbimet: sherbimetParam = "" } = useLocalSearchParams<{
    berberiId: string;
    emri?: string;
    sherbimet?: string;
  }>();
  const idteESherbimeve = useMemo(() => sherbimetParam.split(",").filter(Boolean), [sherbimetParam]);
  const sherbimet = useSherbimet(STUDIO_ID);
  const studio = useLokali(STUDIO_ID).data;
  const teZgjedhurat = idteESherbimeve
    .map((sid) => (sherbimet.data ?? []).find((s) => s.id === sid))
    .filter((s) => s !== undefined);
  const kohezgjatja = teZgjedhurat.reduce((shuma, s) => shuma + s.kohezgjatja_min + s.pushimi_pas_min, 0);
  const totali = teZgjedhurat.reduce((shuma, s) => shuma + s.cmimi_centa, 0);

  const sot = dataISO(new Date());
  const [data, setData] = useState(sot);
  const [ora, setOra] = useState<OraEBerberit | null>(null);
  const oret = useOraretEBerberit(berberiId, data, kohezgjatja);
  const rezervo = useRezervoMeSherbime();
  const [uRezervua, setURezervua] = useState(false);

  function ndryshoDiten(dite: number) {
    prekja.zgjedhje();
    setOra(null);
    rezervo.reset();
    setData((d) => shtoDite(d, dite));
  }

  function konfirmo() {
    if (!ora || !berberiId) return;
    rezervo.mutate(
      { berberiId, sherbimet: idteESherbimeve, fillonMe: ora.fillon_me, shenime: null },
      {
        onSuccess: () => {
          prekja.sukses();
          setURezervua(true);
        },
        onError: () => {
          prekja.gabim();
          setOra(null);
        },
      },
    );
  }

  if (uRezervua && ora) {
    return (
      <View style={[styles.container, styles.suksesi, { paddingBottom: insets.bottom + hapesira.xl }]}>
        <Stack.Screen options={{ title: "", headerBackVisible: false, gestureEnabled: false }} />
        <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.suksesiRrethi}>
          <Ikona emri={ikonat.konfirmo} madhesia={46} ngjyra={ngjyrat.mbiAri} />
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(150)} style={styles.suksesiTitulli}>
          {t("rezervimi.suksesTitulli")}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(220)} style={styles.suksesiTeksti}>
          {studio?.pranimi_automatik
            ? t("rezervimi.suksesKonfirmuar", { data: formatoDaten(data, t).toLowerCase(), ora: ora.ora })
            : t("rezervimi.suksesPritje", { data: formatoDaten(data, t).toLowerCase(), ora: ora.ora })}
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(300)} style={styles.bileta}>
          <Text style={styles.biletaOra}>{ora.ora}</Text>
          <Text style={styles.biletaTeksti}>
            {formatoDaten(data, t)} · {emri}
          </Text>
          <Text style={styles.biletaSherbimet} numberOfLines={2}>
            {teZgjedhurat.map((s) => s.emri).join(" + ")} · {formatoCmimin(totali)}
          </Text>
          <ShiritiIBerberit gjeresia={56} lartesia={6} style={styles.biletaShtylla} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(380)} style={styles.suksesiButonat}>
          <Butoni
            titulli={t("rezervimi.shikoTerminet")}
            ikona={ikonat.kalendar}
            onPress={() => {
              router.dismissAll();
              router.navigate("/terminet-e-mia");
            }}
          />
          <Butoni
            titulli={t("rezervimi.kthehuBallina")}
            varianti="dytesor"
            onPress={() => {
              router.dismissAll();
              router.navigate("/ballina");
            }}
          />
        </Animated.View>
      </View>
    );
  }

  const lista = oret.data ?? [];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t("rezervimi.orariTitulli") }} />
      <ScrollView contentContainerStyle={[styles.permbajtja, { paddingBottom: insets.bottom + 170 }]}>
        <Animated.View entering={FadeInDown.duration(380)} style={styles.ditet}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("rezervimi.ditaEMeparshme")}
            disabled={data <= sot}
            onPress={() => ndryshoDiten(-1)}
            style={[styles.shigjeta, data <= sot && styles.joAktiv]}
          >
            <Ikona emri={ikonat.majtas} madhesia={18} ngjyra={ngjyrat.teksti} />
          </Pressable>
          <View style={styles.data}>
            <Animated.Text key={data} entering={FadeIn.duration(250)} style={styles.dataTeksti} numberOfLines={1}>
              {formatoDaten(data, t)}
            </Animated.Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("rezervimi.ditaETjeter")}
            disabled={data >= shtoDite(sot, DITE_PERPARA)}
            onPress={() => ndryshoDiten(1)}
            style={styles.shigjeta}
          >
            <Ikona emri={ikonat.djathtas} madhesia={18} ngjyra={ngjyrat.teksti} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={data === sot}
            onPress={() => {
              prekja.zgjedhje();
              setOra(null);
              setData(sot);
            }}
            style={[styles.sot, data === sot && styles.joAktiv]}
          >
            <Text style={styles.sotTeksti}>{t("koha.sot")}</Text>
          </Pressable>
        </Animated.View>

        <Text style={styles.kohezgjatja}>
          {emri} · {formatoKohezgjatjen(kohezgjatja)}
        </Text>

        {oret.isPending ? (
          <ActivityIndicator color={ngjyrat.ari} style={styles.ngarkimi} />
        ) : lista.length === 0 ? (
          <Animated.View entering={FadeIn} style={styles.bosh}>
            <Ikona emri={ikonat.ora} madhesia={26} ngjyra={ngjyrat.tekstiDyte} />
            <Text style={styles.boshTeksti}>{t("rezervimi.nukPunon")}</Text>
          </Animated.View>
        ) : (
          <View key={data} style={styles.rrjeta}>
            {lista.map((o, i) => (
              <Animated.View key={o.fillon_me} entering={FadeIn.delay(Math.min(i, 24) * 18).duration(220)} style={styles.qeliza}>
                <Ora
                  ora={o}
                  zgjedhur={ora?.fillon_me === o.fillon_me}
                  onZgjidh={() => {
                    prekja.zgjedhje();
                    rezervo.reset();
                    setOra(o);
                  }}
                />
              </Animated.View>
            ))}
          </View>
        )}

        <View style={styles.legjenda}>
          <Legjenda statusi="e_lire" teksti={t("rezervimi.eLire")} />
          <Legjenda statusi="ne_pritje" teksti={t("rezervimi.nePritje")} />
          <Legjenda statusi="e_rezervuar" teksti={t("rezervimi.eRezervuar")} />
        </View>
        <Text style={styles.shenimi}>{t("rezervimi.shenimiPritjes")}</Text>
      </ScrollView>

      <Animated.View entering={SlideInDown.springify().damping(18)} style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
        {rezervo.isError ? <GabimiIFormes mesazhi={mesazhiIGabimitTeRezervimit(rezervo.error, t)} /> : null}
        {ora ? (
          <Animated.Text key={ora.fillon_me} entering={FadeInDown.duration(220)} style={styles.permbledhja}>
            {formatoDaten(data, t)} · {ora.ora} · {formatoCmimin(totali)}
          </Animated.Text>
        ) : null}
        <Butoni
          titulli={ora ? t("rezervimi.konfirmo") : t("rezervimi.zgjidhOren")}
          joAktiv={!ora || teZgjedhurat.length === 0}
          ngarkohet={rezervo.isPending}
          onPress={konfirmo}
        />
      </Animated.View>
    </View>
  );
}

function Ora({ ora, zgjedhur, onZgjidh }: { ora: OraEBerberit; zgjedhur: boolean; onZgjidh: () => void }) {
  const styles = useStilet(krijoStilet);
  const eLire = ora.statusi === "e_lire";
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: zgjedhur, disabled: !eLire }}
      accessibilityLabel={ora.ora}
      disabled={!eLire}
      onPress={onZgjidh}
      style={({ pressed }) => [
        styles.ora,
        stiliIStatusit(styles, ora.statusi),
        zgjedhur && styles.oraZgjedhur,
        pressed && styles.oraShtypur,
      ]}
    >
      <Text style={[styles.oraTeksti, tekstiIStatusit(styles, ora.statusi), zgjedhur && styles.oraTekstiZgjedhur]}>
        {ora.ora}
      </Text>
    </Pressable>
  );
}

function stiliIStatusit(styles: ReturnType<typeof krijoStilet>, s: StatusiIOres) {
  switch (s) {
    case "e_lire":
      return styles.oraELire;
    case "ne_pritje":
      return styles.oraNePritje;
    case "e_rezervuar":
      return styles.oraERezervuar;
    default:
      return styles.oraJoAktive;
  }
}

function tekstiIStatusit(styles: ReturnType<typeof krijoStilet>, s: StatusiIOres) {
  switch (s) {
    case "e_lire":
      return null;
    case "ne_pritje":
      return styles.tekstiNePritje;
    case "e_rezervuar":
      return styles.tekstiERezervuar;
    default:
      return styles.tekstiJoAktiv;
  }
}

function Legjenda({ statusi, teksti }: { statusi: "e_lire" | "ne_pritje" | "e_rezervuar"; teksti: string }) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const ngjyra = statusi === "e_lire" ? ngjyrat.siperfaqja : statusi === "ne_pritje" ? ngjyrat.ari : ngjyrat.rrezik;
  return (
    <View style={styles.legjendaRreshti}>
      <View style={[styles.legjendaPika, { backgroundColor: ngjyra }]} />
      <Text style={styles.legjendaTeksti}>{teksti}</Text>
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    permbajtja: {
      padding: hapesira.xl,
    },
    ditet: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
    },
    shigjeta: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      alignItems: "center",
      justifyContent: "center",
    },
    data: {
      flex: 1,
      height: 48,
      borderRadius: 24,
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: hapesira.sm,
    },
    dataTeksti: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 16,
    },
    sot: {
      height: 48,
      borderRadius: 24,
      paddingHorizontal: hapesira.lg,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
    },
    sotTeksti: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.ari,
      fontSize: 15,
    },
    joAktiv: {
      opacity: 0.4,
    },
    kohezgjatja: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      marginTop: hapesira.md,
      marginBottom: hapesira.md,
    },
    ngarkimi: {
      marginTop: hapesira.xxl,
    },
    bosh: {
      alignItems: "center",
      gap: hapesira.sm,
      paddingVertical: hapesira.xxl,
    },
    boshTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      textAlign: "center",
    },
    rrjeta: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: hapesira.md,
    },
    qeliza: {
      width: "31.5%",
    },
    ora: {
      height: 64,
      borderRadius: 20,
      borderCurve: "continuous",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    oraELire: {
      backgroundColor: ngjyrat.siperfaqja,
      borderColor: ngjyrat.kufiri,
    },
    oraNePritje: {
      backgroundColor: ngjyrat.ariIErret,
      borderColor: ngjyrat.ari,
    },
    oraERezervuar: {
      backgroundColor: ngjyrat.rrezikSfond,
      borderColor: ngjyrat.rrezikKufiri,
    },
    oraJoAktive: {
      backgroundColor: ngjyrat.siperfaqja2,
      borderColor: ngjyrat.siperfaqja2,
      opacity: 0.6,
    },
    oraZgjedhur: {
      backgroundColor: ngjyrat.ari,
      borderColor: ngjyrat.ari,
      transform: [{ scale: 1.05 }],
    },
    oraShtypur: {
      opacity: 0.8,
    },
    oraTeksti: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 18,
      fontVariant: ["tabular-nums"],
    },
    tekstiNePritje: {
      color: ngjyrat.ari,
    },
    tekstiERezervuar: {
      color: ngjyrat.rrezik,
      textDecorationLine: "line-through",
    },
    tekstiJoAktiv: {
      color: ngjyrat.tekstiZbehte,
    },
    oraTekstiZgjedhur: {
      color: ngjyrat.mbiAri,
    },
    legjenda: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: hapesira.lg,
      marginTop: hapesira.xl,
    },
    legjendaRreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    legjendaPika: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
    },
    legjendaTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
    },
    shenimi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      lineHeight: 20,
      marginTop: hapesira.md,
    },
    fundi: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      gap: hapesira.sm,
      backgroundColor: ngjyrat.sfondi,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ngjyrat.kufiri,
    },
    permbledhja: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 15,
      textAlign: "center",
    },
    suksesi: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: hapesira.xl,
      gap: hapesira.md,
    },
    suksesiRrethi: {
      width: 104,
      height: 104,
      borderRadius: 52,
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hapesira.md,
    },
    suksesiTitulli: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 28,
      textAlign: "center",
    },
    suksesiTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 16,
      lineHeight: 22,
      textAlign: "center",
    },
    bileta: {
      alignSelf: "stretch",
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderCurve: "continuous",
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      marginTop: hapesira.md,
    },
    biletaOra: {
      ...shkronjat.titull,
      color: ngjyrat.ari,
      fontSize: 44,
      lineHeight: 48,
      letterSpacing: -1.4,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
    },
    biletaTeksti: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 17,
    },
    biletaSherbimet: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      marginTop: 2,
    },
    biletaShtylla: {
      marginTop: hapesira.md,
    },
    suksesiButonat: {
      alignSelf: "stretch",
      gap: hapesira.sm,
      marginTop: hapesira.lg,
    },
  });
