import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useStilet, useTema } from "../context/TemaContext";
import { useModiAktiv } from "../hooks/useModiAktiv";
import { hapesira, rrezja, type Ngjyrat } from "../theme";
import Avatar from "./Avatar";
import DialogKonfirmimi from "./DialogKonfirmimi";
import Ikona, { ikonat, type EmriIkones } from "./Ikona";

export default function EkraniProfilit() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { sesioni, emriIShfaqur, dil } = useAuth();
  const modi = useModiAktiv();
  const [dialogu, setDialogu] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.permbajtja, { paddingTop: insets.top + hapesira.xl }]}
      >
        <View style={styles.koka}>
          <Avatar emri={emriIShfaqur || t("profili.perdorues")} madhesia={84} />
          <Text style={styles.emri}>{emriIShfaqur || t("profili.perdorues")}</Text>
          {sesioni?.user.email ? <Text style={styles.email}>{sesioni.user.email}</Text> : null}
          <View style={styles.roli}>
            <Ikona emri={modi === "biznes" ? ikonat.lokali : ikonat.gershere} madhesia={14} ngjyra={ngjyrat.ari} />
            <Text style={styles.roliTeksti}>
              {modi === "biznes" ? t("roli.etiketaBiznes") : t("roli.etiketaKlient")}
            </Text>
          </View>
        </View>

        <Text style={styles.seksioni}>{t("profili.llogaria")}</Text>
        <View style={styles.grupi}>
          {modi === "klient" && (
            <Rreshti ikona={ikonat.dhurate} titulli={t("profili.kartat")} onPress={() => router.push("/kartat")} />
          )}
          <Rreshti
            ikona={ikonat.cilesimet}
            titulli={t("profili.cilesimet")}
            meKufi={modi === "klient"}
            onPress={() => router.push("/cilesimet")}
          />
          <Rreshti ikona={ikonat.dil} titulli={t("profili.dil")} rrezik meKufi onPress={() => setDialogu(true)} />
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
      <Ikona emri={ikona} madhesia={20} ngjyra={ngjyra} />
      <Text style={[styles.rreshtiTeksti, { color: ngjyra }]}>{titulli}</Text>
      {!rrezik && <Ikona emri={ikonat.djathtas} madhesia={16} ngjyra={ngjyrat.tekstiZbehte} />}
    </Pressable>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    permbajtja: {
      paddingHorizontal: hapesira.xl,
      paddingBottom: hapesira.xxl,
    },
    koka: {
      alignItems: "center",
      gap: hapesira.sm,
      marginBottom: hapesira.xxl,
    },
    emri: {
      color: ngjyrat.teksti,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.3,
      marginTop: hapesira.xs,
      textAlign: "center",
    },
    email: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
    },
    seksioni: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: hapesira.md,
    },
    roli: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: rrezja.plote,
      backgroundColor: ngjyrat.ariIErret,
      marginTop: hapesira.xs,
    },
    roliTeksti: {
      color: ngjyrat.teksti,
      fontSize: 13,
      fontWeight: "700",
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
      height: 56,
    },
    rreshtiMeKufi: {
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
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
