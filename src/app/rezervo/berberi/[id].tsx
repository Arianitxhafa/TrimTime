import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, LinearTransition, SlideInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSherbimet } from "../../../api/sherbimet";
import { useStafi } from "../../../api/stafi";
import Butoni from "../../../components/Butoni";
import Ikona, { ikonat } from "../../../components/Ikona";
import LogoStudio from "../../../components/LogoStudio";
import ShiritiIBerberit from "../../../components/ShiritiIBerberit";
import { useStilet, useTema } from "../../../context/TemaContext";
import { formatoCmimin, formatoKohezgjatjen } from "../../../lib/formatimi";
import { prekja } from "../../../lib/prekja";
import { STUDIO_ID } from "../../../lib/studio";
import { hapesira, shkronjat, type Ngjyrat } from "../../../theme";

const MAX_SHERBIME = 5;

// Profili i berberit: emri dhe shërbimet e Studios. Klienti zgjedh një ose disa shërbime me "+";
// të zgjedhurat mbushen me ar. Poshtë, totali dhe "Zgjidh datën dhe orën".
export default function ProfiliIBerberit() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { id, emri: emriNgaLista } = useLocalSearchParams<{ id: string; emri?: string }>();
  const stafi = useStafi(STUDIO_ID);
  const sherbimet = useSherbimet(STUDIO_ID);
  const [zgjedhur, setZgjedhur] = useState<string[]>([]);

  const berberi = (stafi.data ?? []).find((b) => b.profili_id === id);
  const emri = (berberi?.emri ?? emriNgaLista ?? "").split(" ")[0] || "—";
  const aktive = (sherbimet.data ?? []).filter((s) => s.aktiv);
  const teZgjedhurat = zgjedhur.map((sid) => aktive.find((s) => s.id === sid)).filter((s) => s !== undefined);
  const totali = teZgjedhurat.reduce((shuma, s) => shuma + s.cmimi_centa, 0);
  const kohezgjatja = teZgjedhurat.reduce((shuma, s) => shuma + s.kohezgjatja_min, 0);

  function ndrysho(sid: string) {
    setZgjedhur((lista) => {
      if (lista.includes(sid)) {
        prekja.lehte();
        return lista.filter((x) => x !== sid);
      }
      if (lista.length >= MAX_SHERBIME) {
        prekja.gabim();
        return lista;
      }
      prekja.zgjedhje();
      return [...lista, sid];
    });
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t("rezervimi.profiliIBerberit") }} />
      <ScrollView contentContainerStyle={[styles.permbajtja, { paddingBottom: insets.bottom + 150 }]}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.koka}>
          <Animated.View entering={ZoomIn.springify().damping(13)}>
            {berberi?.foto_url ? (
              <Image source={{ uri: berberi.foto_url }} style={styles.foto} contentFit="cover" />
            ) : (
              <LogoStudio madhesia={96} />
            )}
          </Animated.View>
          <View style={styles.emriRreshti}>
            <ShiritiIBerberit gjeresia={28} lartesia={8} />
            <Text style={styles.emri}>{emri}</Text>
          </View>
          <Text style={styles.nentitulli}>{t("rezervimi.zgjidhSherbimet")}</Text>
        </Animated.View>

        {sherbimet.isPending ? (
          <ActivityIndicator color={ngjyrat.ari} style={styles.ngarkimi} />
        ) : (
          <View style={styles.lista}>
            {aktive.map((s, i) => {
              const aktiv = zgjedhur.includes(s.id);
              const radha = zgjedhur.indexOf(s.id) + 1;
              return (
                <Animated.View key={s.id} entering={FadeInDown.delay(100 + Math.min(i, 10) * 50).duration(380)} layout={LinearTransition}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: aktiv }}
                    accessibilityLabel={`${s.emri}, ${formatoCmimin(s.cmimi_centa)}`}
                    onPress={() => ndrysho(s.id)}
                    style={({ pressed }) => [styles.sherbimi, aktiv && styles.sherbimiAktiv, pressed && styles.shtypur]}
                  >
                    <View style={styles.sherbimiTeksti}>
                      <Text style={[styles.sherbimiEmri, aktiv && styles.tekstiAktiv]}>
                        {aktiv ? "◆ " : ""}
                        {s.emri}
                      </Text>
                      <Text style={[styles.sherbimiKoha, aktiv && styles.tekstiAktivDyte]}>
                        {formatoKohezgjatjen(s.kohezgjatja_min)}
                      </Text>
                    </View>
                    <Text style={[styles.sherbimiCmimi, aktiv && styles.tekstiAktiv]}>{formatoCmimin(s.cmimi_centa)}</Text>
                    <View style={[styles.plus, aktiv && styles.plusAktiv]}>
                      {aktiv ? (
                        <Animated.Text key={radha} entering={ZoomIn.springify()} style={styles.plusNumri}>
                          {radha}
                        </Animated.Text>
                      ) : (
                        <Ikona emri={ikonat.shto} madhesia={16} ngjyra={ngjyrat.tekstiDyte} />
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Animated.View
        entering={SlideInDown.springify().damping(18).delay(250)}
        style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}
      >
        {teZgjedhurat.length > 0 ? (
          <Animated.Text key={`${totali}-${kohezgjatja}`} entering={FadeInDown.duration(220)} style={styles.permbledhja}>
            {t("rezervimi.permbledhja", {
              numri: teZgjedhurat.length,
              kohezgjatja: formatoKohezgjatjen(kohezgjatja),
              totali: formatoCmimin(totali),
            })}
          </Animated.Text>
        ) : null}
        <Butoni
          titulli={t("rezervimi.zgjidhDatenDheOren")}
          ikona={ikonat.kalendar}
          joAktiv={teZgjedhurat.length === 0}
          onPress={() =>
            router.push({
              pathname: "/rezervo/orari",
              params: { berberiId: id, emri, sherbimet: zgjedhur.join(",") },
            })
          }
        />
      </Animated.View>
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
    koka: {
      alignItems: "center",
      gap: hapesira.sm,
      marginBottom: hapesira.xl,
    },
    foto: {
      width: 96,
      height: 96,
      borderRadius: 48,
    },
    emriRreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      marginTop: hapesira.sm,
    },
    emri: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 34,
      letterSpacing: -1,
      fontWeight: "800",
    },
    nentitulli: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
    },
    ngarkimi: {
      marginTop: hapesira.xxl,
    },
    lista: {
      gap: hapesira.md,
    },
    sherbimi: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      minHeight: 76,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: 28,
      borderCurve: "continuous",
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      paddingVertical: hapesira.md,
      paddingLeft: hapesira.xl,
      paddingRight: hapesira.md,
    },
    sherbimiAktiv: {
      backgroundColor: ngjyrat.ari,
      borderColor: ngjyrat.ari,
      shadowColor: "#8B6914",
      shadowOpacity: 0.25,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    sherbimiTeksti: {
      flex: 1,
      gap: 2,
    },
    sherbimiEmri: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 19,
    },
    sherbimiKoha: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    sherbimiCmimi: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.tekstiDyte,
      fontSize: 16,
    },
    tekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    tekstiAktivDyte: {
      color: ngjyrat.mbiAri,
      opacity: 0.8,
    },
    plus: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.siperfaqja2,
      alignItems: "center",
      justifyContent: "center",
    },
    plusAktiv: {
      backgroundColor: "rgba(255,255,255,0.22)",
      borderColor: "rgba(255,255,255,0.35)",
    },
    plusNumri: {
      color: ngjyrat.mbiAri,
      fontSize: 16,
      fontWeight: "800",
    },
    shtypur: {
      opacity: 0.85,
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
  });
