import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  aiAktiv,
  GabimIAsistentit,
  merrFotonPerAsistentin,
  useKeshillaEStilit,
  useRezervoMeFjale,
  type FotojaPerAsistentin,
  type KerkesaERezervimit,
  type OraEAsistentit,
} from "../api/asistenti";
import Butoni from "../components/Butoni";
import Ikona, { ikonat } from "../components/Ikona";
import { GabimiIFormes } from "../components/KornizaAuth";
import { useStilet, useTema } from "../context/TemaContext";
import { useZonaIme } from "../hooks/useZonaIme";
import { formatoDaten } from "../lib/datat";
import { formatoCmimin, formatoDistancen } from "../lib/formatimi";
import { prekja } from "../lib/prekja";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../theme";

const SHEMBUJT = ["asistenti.shembulli1", "asistenti.shembulli2", "asistenti.shembulli3"] as const;

// Asistenti AI: "Rezervo me fjalë" (Claude kupton kërkesën, serveri gjen orët e lira) dhe
// "Këshilltari i stilit" (Claude sugjeron qethje nga një selfie).
export default function Asistenti() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const zona = useZonaIme();

  const [teksti, setTeksti] = useState("");
  const rezervo = useRezervoMeFjale();
  const [foto, setFoto] = useState<FotojaPerAsistentin | null>(null);
  const [paLejeKamere, setPaLejeKamere] = useState(false);
  const stili = useKeshillaEStilit();

  // "Fade · Nesër · 17:00–21:00": çfarë kuptoi asistenti, që përdoruesi ta shohë dhe ta ndreqë.
  function pershkrimi(k: KerkesaERezervimit): string {
    const sherbimi = k.kategoria === "asnje" ? t("asistenti.cdoSherbim") : t(`zbulo.k_${k.kategoria}`);
    return `${sherbimi} · ${formatoDaten(k.data, t)} · ${k.ora_nga}–${k.ora_deri}`;
  }

  function mesazhiIGabimit(e: unknown): string {
    return t(`asistenti.g_${e instanceof GabimIAsistentit ? e.kodi : "rrjeti"}`);
  }

  function gjejOret(t2: string) {
    const kerkesa = t2.trim();
    if (!kerkesa || rezervo.isPending) return;
    prekja.lehte();
    rezervo.mutate({ teksti: kerkesa, pika: zona.pika, qytetiId: zona.qyteti?.id ?? null });
  }

  async function analizo(burimi: "kamera" | "galeria") {
    setPaLejeKamere(false);
    const rezultati = await merrFotonPerAsistentin(burimi).catch(() => null);
    if (rezultati === "pa_leje") {
      setPaLejeKamere(true);
      return;
    }
    if (!rezultati) return;
    setFoto(rezultati);
    prekja.lehte();
    stili.mutate(rezultati);
  }

  function hapOren(o: OraEAsistentit, data: string) {
    prekja.lehte();
    router.push({
      pathname: "/rezervo/[lokaliId]",
      params: { lokaliId: o.lokali_id, sherbimiId: o.sherbimi_id, data, ora: o.ora },
    });
  }

  function gjejBerber(kategoria: string) {
    prekja.lehte();
    router.dismissTo({ pathname: "/zbulo", params: { sherbimi: kategoria } });
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.permbajtja} keyboardShouldPersistTaps="handled">
        <View style={styles.hyrja}>
          <View style={styles.ikonaHyrjes}>
            <Ikona emri={ikonat.asistenti} madhesia={26} ngjyra={ngjyrat.mbiAri} />
          </View>
          <Text style={styles.hyrjaTitulli}>{t("asistenti.hyrjaTitulli")}</Text>
          <Text style={styles.hyrjaTeksti}>{aiAktiv ? t("asistenti.hyrjaTeksti") : t("asistenti.hyrjaTekstiFalas")}</Text>
        </View>

        {/* Rezervo me fjalë */}
        <View style={styles.karta}>
          <View style={styles.kartaKoka}>
            <Ikona emri={ikonat.kalendar} madhesia={18} ngjyra={ngjyrat.bronzi} />
            <Text style={styles.kartaTitulli}>{t("asistenti.rezervoTitulli")}</Text>
          </View>
          <View style={styles.fusha}>
            <TextInput
              value={teksti}
              onChangeText={setTeksti}
              placeholder={t("asistenti.rezervoPlaceholder")}
              placeholderTextColor={ngjyrat.tekstiZbehte}
              style={styles.fushaInput}
              returnKeyType="search"
              onSubmitEditing={() => gjejOret(teksti)}
              maxLength={300}
              accessibilityLabel={t("asistenti.rezervoTitulli")}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shembujt}>
            {SHEMBUJT.map((k) => (
              <Pressable
                key={k}
                accessibilityRole="button"
                onPress={() => {
                  setTeksti(t(k));
                  gjejOret(t(k));
                }}
                style={({ pressed }) => [styles.shembulli, pressed && styles.shtypur]}
              >
                <Text style={styles.shembulliTeksti}>{t(k)}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Butoni
            titulli={rezervo.isPending ? t("asistenti.duke") : t("asistenti.gjej")}
            ikona={ikonat.asistenti}
            ngarkohet={rezervo.isPending}
            joAktiv={teksti.trim() === ""}
            onPress={() => gjejOret(teksti)}
          />

          {rezervo.isError ? <GabimiIFormes mesazhi={mesazhiIGabimit(rezervo.error)} /> : null}
          {rezervo.data ? (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.rezultatet}>
              {rezervo.data.kerkesa.e_qarte ? (
                <>
                  <Text style={styles.kuptova}>{t("asistenti.kuptova", { teksti: pershkrimi(rezervo.data.kerkesa) })}</Text>
                  {rezervo.data.oraret.length === 0 ? (
                    <Text style={styles.shenim}>{t("asistenti.asnjeOre")}</Text>
                  ) : (
                    rezervo.data.oraret.map((o, i) => (
                      <Pressable
                        key={`${o.lokali_id}-${o.fillon_me}`}
                        accessibilityRole="button"
                        onPress={() => hapOren(o, rezervo.data!.kerkesa.data)}
                        style={({ pressed }) => [styles.ora, i > 0 && styles.oraMeKufi, pressed && styles.shtypur]}
                      >
                        <View style={styles.oraKutia}>
                          <Text style={styles.oraTeksti}>{o.ora}</Text>
                        </View>
                        <View style={styles.oraDetajet}>
                          <Text style={styles.oraLokali} numberOfLines={1}>
                            {o.lokali_emri}
                          </Text>
                          <Text style={styles.oraMeta} numberOfLines={1}>
                            {o.sherbimi_emri} · {formatoCmimin(o.cmimi_centa)} · {formatoDistancen(o.distanca_m)}
                          </Text>
                          <Text style={styles.oraMeta}>{formatoDaten(rezervo.data!.kerkesa.data, t)}</Text>
                        </View>
                        <Ikona emri={ikonat.djathtas} madhesia={14} ngjyra={ngjyrat.tekstiZbehte} />
                      </Pressable>
                    ))
                  )}
                </>
              ) : (
                <Text style={styles.shenim}>{t("asistenti.joEQarte")}</Text>
              )}
            </Animated.View>
          ) : null}
        </View>

        {/* Këshilltari i stilit: vetëm me Claude (analiza e fotos ka nevojë për AI). */}
        {aiAktiv && (
        <View style={styles.karta}>
          <View style={styles.kartaKoka}>
            <Ikona emri={ikonat.gershere} madhesia={18} ngjyra={ngjyrat.bronzi} />
            <Text style={styles.kartaTitulli}>{t("asistenti.stiliTitulli")}</Text>
          </View>
          <Text style={styles.kartaTeksti}>{t("asistenti.stiliTeksti")}</Text>
          <View style={styles.butonat}>
            {Platform.OS !== "web" && (
              <Butoni
                titulli={t("asistenti.selfie")}
                ikona={ikonat.kamera}
                joAktiv={stili.isPending}
                onPress={() => void analizo("kamera")}
                style={styles.butoni}
              />
            )}
            <Butoni
              titulli={t("asistenti.galeria")}
              varianti="dytesor"
              joAktiv={stili.isPending}
              onPress={() => void analizo("galeria")}
              style={styles.butoni}
            />
          </View>
          {paLejeKamere ? <Text style={styles.shenim}>{t("portofoli.paLejeKamere")}</Text> : null}

          {foto ? (
            <View style={styles.fotoRreshti}>
              <Image source={{ uri: foto.uri }} style={styles.foto} contentFit="cover" />
              {stili.isPending ? (
                <View style={styles.duke}>
                  <ActivityIndicator color={ngjyrat.ari} />
                  <Text style={styles.shenim}>{t("asistenti.duke")}</Text>
                </View>
              ) : stili.data?.eshte_fytyre ? (
                <View style={styles.forma}>
                  <Text style={styles.formaTitulli}>{t("asistenti.forma", { forma: stili.data.forma_e_fytyres })}</Text>
                  <Text style={styles.shenim}>{stili.data.pershkrimi}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {stili.isError ? <GabimiIFormes mesazhi={mesazhiIGabimit(stili.error)} /> : null}
          {stili.data && !stili.data.eshte_fytyre ? <Text style={styles.shenim}>{t("asistenti.joFytyre")}</Text> : null}
          {stili.data?.eshte_fytyre
            ? stili.data.stilet.map((s, i) => (
                <Animated.View key={s.emri} entering={FadeInDown.delay(i * 80).duration(320)} style={styles.stili}>
                  <Text style={styles.stiliNumri}>{i + 1}</Text>
                  <View style={styles.stiliTeksti}>
                    <Text style={styles.stiliEmri}>{s.emri}</Text>
                    <Text style={styles.shenim}>{s.pse}</Text>
                    <Text style={styles.thuaj}>
                      {t("asistenti.thuajBerberit")}: <Text style={styles.thuajTeksti}>“{s.si_ta_kerkosh}”</Text>
                    </Text>
                    {s.kategoria !== "asnje" ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => gjejBerber(s.kategoria)}
                        style={({ pressed }) => [styles.gjejBerber, pressed && styles.shtypur]}
                      >
                        <Text style={styles.gjejBerberTeksti}>{t("asistenti.gjejBerber")}</Text>
                        <Ikona emri={ikonat.djathtas} madhesia={12} ngjyra={ngjyrat.ari} />
                      </Pressable>
                    ) : null}
                  </View>
                </Animated.View>
              ))
            : null}
        </View>
        )}

        <Text style={styles.privatesia}>{aiAktiv ? t("asistenti.privatesia") : t("asistenti.privatesiaFalas")}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    permbajtja: {
      padding: hapesira.lg,
      gap: hapesira.lg,
      paddingBottom: hapesira.xxl * 2,
    },
    hyrja: {
      alignItems: "center",
      gap: hapesira.sm,
      paddingVertical: hapesira.md,
    },
    ikonaHyrjes: {
      width: 56,
      height: 56,
      borderRadius: 18,
      borderCurve: "continuous",
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hapesira.xs,
    },
    hyrjaTitulli: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 24,
      letterSpacing: -0.4,
      textAlign: "center",
    },
    hyrjaTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      lineHeight: 21,
      textAlign: "center",
      maxWidth: 340,
    },
    karta: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderCurve: "continuous",
      padding: hapesira.lg,
      gap: hapesira.md,
    },
    kartaKoka: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
    },
    kartaTitulli: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 18,
    },
    kartaTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      lineHeight: 21,
    },
    fusha: {
      backgroundColor: ngjyrat.siperfaqja2,
      borderRadius: rrezja.md,
      borderCurve: "continuous",
      paddingHorizontal: hapesira.md,
      height: 50,
      justifyContent: "center",
    },
    fushaInput: {
      color: ngjyrat.teksti,
      fontSize: 16,
      height: "100%",
    },
    shembujt: {
      gap: hapesira.sm,
    },
    shembulli: {
      paddingHorizontal: 12,
      height: 32,
      borderRadius: rrezja.plote,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: ngjyrat.kufiri,
      justifyContent: "center",
    },
    shembulliTeksti: {
      ...shkronjat.etikete,
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    shtypur: {
      opacity: 0.6,
    },
    rezultatet: {
      gap: hapesira.xs,
    },
    kuptova: {
      ...shkronjat.etikete,
      color: ngjyrat.bronzi,
      fontSize: 14,
      marginBottom: hapesira.xs,
    },
    shenim: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      lineHeight: 20,
    },
    ora: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      paddingVertical: hapesira.md,
    },
    oraMeKufi: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ngjyrat.kufiri,
    },
    oraKutia: {
      minWidth: 64,
      paddingVertical: 8,
      borderRadius: rrezja.sm + 2,
      borderCurve: "continuous",
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
    },
    oraTeksti: {
      ...shkronjat.titull,
      color: ngjyrat.ari,
      fontSize: 17,
    },
    oraDetajet: {
      flex: 1,
      gap: 2,
    },
    oraLokali: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 16,
    },
    oraMeta: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    butonat: {
      flexDirection: "row",
      gap: hapesira.sm,
    },
    butoni: {
      flex: 1,
      paddingHorizontal: hapesira.md,
    },
    fotoRreshti: {
      flexDirection: "row",
      gap: hapesira.md,
      alignItems: "center",
    },
    foto: {
      width: 72,
      height: 96,
      borderRadius: rrezja.md,
      borderCurve: "continuous",
      backgroundColor: ngjyrat.siperfaqja2,
    },
    duke: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
    },
    forma: {
      flex: 1,
      gap: 4,
    },
    formaTitulli: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 16,
    },
    stili: {
      flexDirection: "row",
      gap: hapesira.md,
      paddingTop: hapesira.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ngjyrat.kufiri,
    },
    stiliNumri: {
      ...shkronjat.titull,
      color: ngjyrat.ari,
      fontSize: 20,
      width: 22,
    },
    stiliTeksti: {
      flex: 1,
      gap: 4,
    },
    stiliEmri: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 17,
    },
    thuaj: {
      ...shkronjat.etikete,
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
    },
    thuajTeksti: {
      color: ngjyrat.teksti,
    },
    gjejBerber: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "flex-start",
      marginTop: 4,
      paddingVertical: 4,
    },
    gjejBerberTeksti: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.ari,
      fontSize: 14,
    },
    privatesia: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 12,
      lineHeight: 17,
      textAlign: "center",
      paddingHorizontal: hapesira.lg,
    },
  });
