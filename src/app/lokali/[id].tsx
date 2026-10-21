import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLokali } from "../../api/lokalet";
import { useOrari } from "../../api/orari";
import { useSherbimet } from "../../api/sherbimet";
import { useStafi } from "../../api/stafi";
import Avatar from "../../components/Avatar";
import Butoni from "../../components/Butoni";
import Ikona, { ikonat, type EmriIkones } from "../../components/Ikona";
import { celesiIDites, RENDI_I_DITEVE } from "../../components/RedaktoriIOrarit";
import { useStilet, useTema } from "../../context/TemaContext";
import { formatoCmimin, formatoKohezgjatjen } from "../../lib/formatimi";
import { lidhjaEUdhezimeve } from "../../lib/vendndodhja";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

export default function ProfiliILokalit() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lokali = useLokali(id);
  const sherbimet = useSherbimet(id);
  const orari = useOrari(id);
  const stafi = useStafi(id);

  if (lokali.isPending) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <Stack.Screen options={{ title: "" }} />
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }

  if (!lokali.data) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <Stack.Screen options={{ title: "" }} />
        <Ikona emri={ikonat.anulo} madhesia={32} ngjyra={ngjyrat.tekstiDyte} />
        <Text style={styles.boshTitulli}>{t("profiliLokalit.nukUGjet")}</Text>
        <Text style={styles.boshTeksti}>{t("profiliLokalit.nukUGjetTeksti")}</Text>
        <Butoni titulli={t("profiliLokalit.kthehu")} varianti="dytesor" ikona={ikonat.kthe} onPress={() => router.back()} />
      </View>
    );
  }

  const l = lokali.data;
  const sherbimetAktive = (sherbimet.data ?? []).filter((s) => s.aktiv);
  const berberet = (stafi.data ?? []).filter((a) => a.aktiv);
  const sot = new Date().getDay();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: l.emri }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        <View style={styles.kopertina}>
          {l.kopertina_url ? (
            <Image source={{ uri: l.kopertina_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.kopertinaBosh]}>
              <Ikona emri={ikonat.gershere} madhesia={48} ngjyra={ngjyrat.ari} />
            </View>
          )}
        </View>

        <View style={styles.permbajtja}>
          <View style={styles.koka}>
            <View style={styles.logo}>
              {l.logo_url ? (
                <Image source={{ uri: l.logo_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <Text style={styles.logoShkronja}>{l.emri.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <View style={styles.kokaTeksti}>
              <Text style={styles.emri}>{l.emri}</Text>
              <View style={styles.statusiRreshti}>
                <View style={[styles.pika, { backgroundColor: l.i_hapur_tani ? "#3DD68C" : ngjyrat.tekstiZbehte }]} />
                <Text style={[styles.statusi, { color: l.i_hapur_tani ? "#3DD68C" : ngjyrat.tekstiDyte }]}>
                  {l.i_hapur_tani ? t("lokali.hapur") : t("lokali.mbyllur")}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.adresaRreshti}>
            <Ikona emri={ikonat.harta} madhesia={16} ngjyra={ngjyrat.tekstiDyte} />
            <Text style={styles.adresa}>
              {l.adresa}, {l.qyteti}
            </Text>
          </View>

          <View style={styles.veprimet}>
            {l.telefoni ? (
              <Veprimi
                ikona={ikonat.telefoni}
                teksti={t("profiliLokalit.thirr")}
                onPress={() => Linking.openURL(`tel:${l.telefoni?.replace(/\s/g, "")}`)}
              />
            ) : null}
            <Veprimi
              ikona={ikonat.harta}
              teksti={t("profiliLokalit.udhezimet")}
              onPress={() => Linking.openURL(lidhjaEUdhezimeve(l, Platform.OS))}
            />
          </View>

          <Text style={styles.seksioni}>{t("profiliLokalit.sherbimet")}</Text>
          {sherbimetAktive.length === 0 ? (
            <Text style={styles.paTeDhena}>{t("profiliLokalit.paSherbime")}</Text>
          ) : (
            <View style={styles.grupi}>
              {sherbimetAktive.map((s, i) => (
                <View key={s.id} style={[styles.sherbimi, i > 0 && styles.meKufi]}>
                  <View style={styles.sherbimiTeksti}>
                    <Text style={styles.sherbimiEmri}>{s.emri}</Text>
                    {s.pershkrimi ? <Text style={styles.sherbimiPershkrimi}>{s.pershkrimi}</Text> : null}
                    <Text style={styles.sherbimiKoha}>{formatoKohezgjatjen(s.kohezgjatja_min)}</Text>
                  </View>
                  <Text style={styles.sherbimiCmimi}>{formatoCmimin(s.cmimi_centa)}</Text>
                </View>
              ))}
            </View>
          )}

          {berberet.length > 0 && (
            <>
              <Text style={styles.seksioni}>{t("profiliLokalit.berberet")}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.berberetScroll}
                contentContainerStyle={styles.berberet}
              >
                {berberet.map((b) => (
                  <View key={b.profili_id} style={styles.berberi}>
                    <Avatar emri={b.emri || "?"} madhesia={60} />
                    <Text style={styles.berberiEmri} numberOfLines={1}>
                      {b.emri.split(" ")[0] || "—"}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={styles.seksioni}>{t("profiliLokalit.orari")}</Text>
          <View style={styles.grupi}>
            {RENDI_I_DITEVE.map((dita, i) => {
              const intervalet = (orari.data ?? []).filter((o) => o.dita === dita);
              const eSotme = dita === sot;
              return (
                <View key={dita} style={[styles.orariRreshti, i > 0 && styles.meKufi]}>
                  <Text style={[styles.orariDita, eSotme && styles.eSotme]}>
                    {t(celesiIDites(dita))}
                    {eSotme ? ` · ${t("profiliLokalit.sot")}` : ""}
                  </Text>
                  <Text style={[styles.orariOret, eSotme && styles.eSotme]}>
                    {intervalet.length === 0
                      ? t("orari.mbyllur")
                      : intervalet.map((o) => `${o.hapet}–${o.mbyllet}`).join(", ")}
                  </Text>
                </View>
              );
            })}
          </View>

          {l.pershkrimi ? (
            <>
              <Text style={styles.seksioni}>{t("profiliLokalit.rreth")}</Text>
              <Text style={styles.pershkrimi}>{l.pershkrimi}</Text>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
        <View style={styles.fundiTeksti}>
          {l.cmimi_min !== null && (
            <Text style={styles.fundiCmimi}>{t("lokali.ngaCmimi", { cmimi: formatoCmimin(l.cmimi_min) })}</Text>
          )}
          <Text style={styles.fundiShenim}>{t("profiliLokalit.rezervimiSeShpejti")}</Text>
        </View>
        <Butoni titulli={t("profiliLokalit.rezervo")} joAktiv onPress={() => {}} style={styles.rezervo} />
      </View>
    </View>
  );
}

function Veprimi({ ikona, teksti, onPress }: { ikona: EmriIkones; teksti: string; onPress: () => void }) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.veprimi, pressed && styles.shtypur]}
    >
      <Ikona emri={ikona} madhesia={18} ngjyra={ngjyrat.ari} />
      <Text style={styles.veprimiTeksti}>{teksti}</Text>
    </Pressable>
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
      gap: hapesira.sm,
      padding: hapesira.xxl,
    },
    boshTitulli: {
      color: ngjyrat.teksti,
      fontSize: 18,
      fontWeight: "800",
    },
    boshTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      textAlign: "center",
      marginBottom: hapesira.md,
    },
    kopertina: {
      height: 220,
      backgroundColor: ngjyrat.siperfaqja2,
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
      flexDirection: "row",
      alignItems: "flex-end",
      gap: hapesira.md,
      marginTop: -32,
      marginBottom: hapesira.md,
    },
    logo: {
      width: 76,
      height: 76,
      borderRadius: 22,
      backgroundColor: ngjyrat.ari,
      borderWidth: 4,
      borderColor: ngjyrat.sfondi,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    logoShkronja: {
      color: ngjyrat.mbiAri,
      fontSize: 30,
      fontWeight: "800",
    },
    kokaTeksti: {
      flex: 1,
      paddingBottom: 4,
      gap: 4,
    },
    emri: {
      color: ngjyrat.teksti,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.4,
    },
    statusiRreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    pika: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statusi: {
      fontSize: 14,
      fontWeight: "700",
    },
    adresaRreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      marginBottom: hapesira.lg,
    },
    adresa: {
      flex: 1,
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
    },
    veprimet: {
      flexDirection: "row",
      gap: hapesira.sm,
      marginBottom: hapesira.xl,
    },
    veprimi: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: hapesira.sm,
      height: 46,
      borderRadius: rrezja.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
    },
    veprimiTeksti: {
      color: ngjyrat.teksti,
      fontSize: 14,
      fontWeight: "700",
    },
    shtypur: {
      opacity: 0.8,
    },
    seksioni: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginTop: hapesira.lg,
      marginBottom: hapesira.md,
    },
    paTeDhena: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 14,
    },
    grupi: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      overflow: "hidden",
    },
    meKufi: {
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
    sherbimi: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      padding: hapesira.lg,
    },
    sherbimiTeksti: {
      flex: 1,
      gap: 3,
    },
    sherbimiEmri: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "700",
    },
    sherbimiPershkrimi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      lineHeight: 18,
    },
    sherbimiKoha: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
    },
    sherbimiCmimi: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "800",
    },
    berberetScroll: {
      marginHorizontal: -hapesira.xl,
    },
    berberet: {
      paddingHorizontal: hapesira.xl,
      gap: hapesira.lg,
    },
    berberi: {
      alignItems: "center",
      gap: hapesira.sm,
      width: 72,
    },
    berberiEmri: {
      color: ngjyrat.teksti,
      fontSize: 13,
      fontWeight: "600",
    },
    orariRreshti: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: hapesira.md,
      paddingHorizontal: hapesira.lg,
      paddingVertical: hapesira.md,
    },
    orariDita: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
    },
    orariOret: {
      color: ngjyrat.teksti,
      fontSize: 14,
      fontVariant: ["tabular-nums"],
      textAlign: "right",
      flexShrink: 1,
    },
    eSotme: {
      color: ngjyrat.ari,
      fontWeight: "800",
    },
    pershkrimi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      lineHeight: 22,
    },
    fundi: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
    fundiTeksti: {
      flex: 1,
      gap: 2,
    },
    fundiCmimi: {
      color: ngjyrat.teksti,
      fontSize: 17,
      fontWeight: "800",
    },
    fundiShenim: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 12,
    },
    rezervo: {
      minWidth: 130,
    },
  });
