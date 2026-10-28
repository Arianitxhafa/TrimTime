import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQytetet } from "../api/lokalet";
import { usePreferencat } from "../context/PreferencatContext";
import { useStilet, useTema } from "../context/TemaContext";
import { prekja } from "../lib/prekja";
import { hapesira, rrezja, type Ngjyrat } from "../theme";
import Ikona, { ikonat } from "./Ikona";

type Props = {
  iDukshem: boolean;
  qytetiAktual: number | null;
  onMbyll: () => void;
  // Thirret kur klienti zgjedh "Vendndodhja ime" (kërkon lejen nëse mungon).
  onVendndodhjaIme: () => void;
};

// Lista e qyteteve me numrin e lokaleve; zgjedhja ruhet derisa klienti të kthehet te GPS-i.
export default function ZgjedhesiIQytetit({ iDukshem, qytetiAktual, onMbyll, onVendndodhjaIme }: Props) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { qytetiIZgjedhur, zgjidhQytetin } = usePreferencat();
  const qytetet = useQytetet(iDukshem);
  const [kerkimi, setKerkimi] = useState("");

  const teFiltruara = useMemo(() => {
    const k = kerkimi.trim().toLocaleLowerCase("sq");
    return (qytetet.data ?? [])
      .filter((q) => !k || q.emri.toLocaleLowerCase("sq").includes(k))
      .sort((a, b) => b.nr_lokaleve - a.nr_lokaleve || a.emri.localeCompare(b.emri, "sq"));
  }, [qytetet.data, kerkimi]);

  return (
    <Modal visible={iDukshem} animationType="slide" presentationStyle="pageSheet" onRequestClose={onMbyll}>
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <View style={styles.koka}>
          <Text style={styles.titulli}>{t("zona.zgjidhQytetin")}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t("pergjithshme.anulo")} onPress={onMbyll} hitSlop={10}>
            <Ikona emri={ikonat.mbyll} madhesia={22} ngjyra={ngjyrat.tekstiDyte} />
          </Pressable>
        </View>

        <View style={styles.kerkimi}>
          <Ikona emri={ikonat.kerko} madhesia={18} ngjyra={ngjyrat.tekstiZbehte} />
          <TextInput
            value={kerkimi}
            onChangeText={setKerkimi}
            placeholder={t("zona.kerko")}
            placeholderTextColor={ngjyrat.tekstiZbehte}
            style={styles.kerkimiInput}
            autoCorrect={false}
          />
        </View>

        <FlatList
          data={teFiltruara}
          keyExtractor={(q) => String(q.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.lista}
          ListHeaderComponent={
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                prekja.zgjedhje();
                zgjidhQytetin(null);
                onVendndodhjaIme();
                onMbyll();
              }}
              style={({ pressed }) => [styles.rreshti, styles.gps, pressed && styles.shtypur]}
            >
              <View style={styles.gpsIkona}>
                <Ikona emri={ikonat.harta} madhesia={18} ngjyra={ngjyrat.mbiAri} />
              </View>
              <View style={styles.rreshtiTeksti}>
                <Text style={styles.emri}>{t("zona.vendndodhjaIme")}</Text>
                <Text style={styles.numri}>{t("zona.vendndodhjaImeTeksti")}</Text>
              </View>
              {!qytetiIZgjedhur && <Ikona emri={ikonat.konfirmo} madhesia={18} ngjyra={ngjyrat.ari} />}
            </Pressable>
          }
          renderItem={({ item }) => {
            const aktiv = qytetiIZgjedhur?.id === item.id || (!qytetiIZgjedhur && qytetiAktual === item.id);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: aktiv }}
                onPress={() => {
                  prekja.zgjedhje();
                  zgjidhQytetin({ id: item.id, emri: item.emri, lat: item.lat, lng: item.lng });
                  onMbyll();
                }}
                style={({ pressed }) => [styles.rreshti, pressed && styles.shtypur]}
              >
                <View style={styles.rreshtiTeksti}>
                  <Text style={[styles.emri, aktiv && styles.emriAktiv]}>{item.emri}</Text>
                  <Text style={styles.numri}>{t("zona.nrLokaleve", { numri: item.nr_lokaleve })}</Text>
                </View>
                {aktiv && <Ikona emri={ikonat.konfirmo} madhesia={18} ngjyra={ngjyrat.ari} />}
              </Pressable>
            );
          }}
          ListEmptyComponent={qytetet.isPending ? <ActivityIndicator color={ngjyrat.ari} style={styles.ngarkimi} /> : undefined}
        />
      </View>
    </Modal>
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
      justifyContent: "space-between",
      padding: hapesira.xl,
    },
    titulli: {
      color: ngjyrat.teksti,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.4,
    },
    kerkimi: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      marginHorizontal: hapesira.xl,
      marginBottom: hapesira.md,
      paddingHorizontal: hapesira.md,
      height: 48,
      borderRadius: rrezja.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
    },
    kerkimiInput: {
      flex: 1,
      color: ngjyrat.teksti,
      fontSize: 15,
      height: "100%",
    },
    lista: {
      paddingHorizontal: hapesira.xl,
      paddingBottom: hapesira.xxl,
    },
    rreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      paddingVertical: hapesira.md + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: ngjyrat.kufiri,
    },
    gps: {
      marginBottom: hapesira.sm,
    },
    gpsIkona: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
    },
    shtypur: {
      opacity: 0.6,
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
    emriAktiv: {
      color: ngjyrat.ari,
    },
    numri: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
    },
    ngarkimi: {
      marginTop: hapesira.xxl,
    },
  });
