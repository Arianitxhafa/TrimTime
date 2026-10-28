import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useLokaliIm } from "../../api/lokalet";
import { useKrijoFtesen, useNdryshoAnetarin, useStafi } from "../../api/stafi";
import Avatar from "../../components/Avatar";
import Butoni from "../../components/Butoni";
import { ikonat } from "../../components/Ikona";
import KartaQr from "../../components/KartaQr";
import { GabimiIFormes } from "../../components/KornizaAuth";
import { qrIFteses } from "../../lib/qr";
import { useAuth } from "../../context/AuthContext";
import { useStilet, useTema } from "../../context/TemaContext";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

export default function MenaxhoStafin() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const { sesioni } = useAuth();
  const lokaliIm = useLokaliIm();
  const lokali = lokaliIm.data?.lokali;
  const eshtePronar = lokaliIm.data?.roli === "pronar";
  const stafi = useStafi(lokali?.id);
  const fto = useKrijoFtesen(lokali?.id ?? "");
  const ndrysho = useNdryshoAnetarin(lokali?.id ?? "");

  if (!lokali || !stafi.data) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.permbajtja}>
      <GabimiIFormes
        mesazhi={fto.isError || ndrysho.isError ? t("pergjithshme.gabimPapritur") : null}
      />

      <View style={styles.grupi}>
        {stafi.data.map((a, i) => {
          const uneVete = a.profili_id === sesioni?.user.id;
          return (
            <View key={a.profili_id} style={[styles.rreshti, i > 0 && styles.rreshtiMeKufi]}>
              <Pressable
                accessibilityRole="button"
                disabled={!eshtePronar && !uneVete}
                onPress={() => router.push({ pathname: "/menaxho/berberi/[id]", params: { id: a.profili_id } })}
                style={({ pressed }) => [styles.personi, pressed && styles.shtypur]}
              >
                <Avatar emri={a.emri || "?"} madhesia={44} />
                <View style={styles.rreshtiTeksti}>
                  <Text style={[styles.emri, !a.aktiv && styles.zbehur]}>{a.emri || "—"}</Text>
                  <Text style={styles.roli}>
                    {a.roli === "pronar" ? t("stafi.pronar") : t("stafi.berber")}
                    {!a.aktiv ? ` · ${t("stafi.joAktiv")}` : ""}
                  </Text>
                </View>
              </Pressable>
              {eshtePronar && !uneVete && a.roli !== "pronar" && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => ndrysho.mutate({ profiliId: a.profili_id, aktiv: !a.aktiv })}
                  hitSlop={8}
                >
                  <Text style={[styles.veprimi, a.aktiv && styles.veprimiRrezik]}>
                    {a.aktiv ? t("stafi.caktivizo") : t("stafi.aktivizo")}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>

      {eshtePronar && (
        <View style={styles.ftesa}>
          {fto.data ? (
            <>
              <KartaQr vlera={qrIFteses(fto.data)} titulli={lokali.emri} nentitulli={fto.data} madhesia={180} />
              <Text style={styles.kodi} selectable>
                {fto.data}
              </Text>
              <Text style={styles.ftesaTeksti}>{t("stafi.ftoTeksti")}</Text>
              <Butoni
                titulli={t("stafi.ndaj")}
                ikona={ikonat.klientet}
                onPress={() =>
                  Share.share({ message: t("stafi.mesazhiNdarjes", { lokali: lokali.emri, kodi: fto.data }) })
                }
              />
            </>
          ) : (
            <Butoni titulli={t("stafi.fto")} ikona={ikonat.shto} ngarkohet={fto.isPending} onPress={() => fto.mutate()} />
          )}
        </View>
      )}
    </ScrollView>
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
    },
    permbajtja: {
      padding: hapesira.xl,
      gap: hapesira.xl,
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
      padding: hapesira.lg,
    },
    rreshtiMeKufi: {
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
    personi: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
    },
    shtypur: {
      opacity: 0.7,
    },
    rreshtiTeksti: {
      flex: 1,
      gap: 2,
    },
    emri: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "700",
    },
    zbehur: {
      color: ngjyrat.tekstiZbehte,
    },
    roli: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    veprimi: {
      color: ngjyrat.ari,
      fontSize: 14,
      fontWeight: "700",
    },
    veprimiRrezik: {
      color: ngjyrat.rrezik,
    },
    ftesa: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      gap: hapesira.md,
    },
    kodi: {
      color: ngjyrat.ari,
      fontSize: 34,
      fontWeight: "800",
      letterSpacing: 6,
      textAlign: "center",
      fontVariant: ["tabular-nums"],
    },
    ftesaTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
    },
  });
