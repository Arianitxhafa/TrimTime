import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKlientet } from "../../api/biznesi";
import { useLokaliIm } from "../../api/lokalet";
import Avatar from "../../components/Avatar";
import Butoni from "../../components/Butoni";
import { Drita } from "../../components/Marka";
import Ikona, { ikonat } from "../../components/Ikona";
import { useStilet, useTema } from "../../context/TemaContext";
import { dataISO, formatoDaten } from "../../lib/datat";
import { formatoCmimin } from "../../lib/formatimi";
import type { KlientiILokalit } from "../../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

type Filtri = "teGjithe" | "vip" | "meMosardhje";

export default function Klientet() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const lokaliIm = useLokaliIm();
  const klientet = useKlientet(lokaliIm.data?.lokali.id);
  const [kerkimi, setKerkimi] = useState("");
  const [filtri, setFiltri] = useState<Filtri>("teGjithe");

  const teFiltruar = useMemo(() => {
    const k = kerkimi.trim().toLowerCase();
    const shifrat = k.replace(/\D/g, "");
    return (klientet.data ?? []).filter(
      (x) =>
        (filtri === "teGjithe" || (filtri === "vip" ? x.vip : x.nuk_erdhi > 0)) &&
        (k === "" ||
          x.emri.toLowerCase().includes(k) ||
          (shifrat !== "" && (x.telefoni ?? "").replace(/\D/g, "").includes(shifrat))),
    );
  }, [klientet.data, kerkimi, filtri]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + hapesira.lg }]}>
      <Drita lartesia={260} />
      <Text style={styles.titulli}>{t("tabs.klientet")}</Text>

      <View style={styles.kerkimi}>
        <Ikona emri={ikonat.kerko} madhesia={18} ngjyra={ngjyrat.tekstiZbehte} />
        <TextInput
          value={kerkimi}
          onChangeText={setKerkimi}
          placeholder={t("klientet.kerko")}
          placeholderTextColor={ngjyrat.tekstiZbehte}
          style={styles.kerkimiInput}
          autoCorrect={false}
          accessibilityLabel={t("klientet.kerko")}
        />
        {kerkimi !== "" && (
          <Pressable accessibilityRole="button" onPress={() => setKerkimi("")} hitSlop={10}>
            <Ikona emri={ikonat.pastro} madhesia={18} ngjyra={ngjyrat.tekstiDyte} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtratScroll} contentContainerStyle={styles.filtrat}>
        {(["teGjithe", "vip", "meMosardhje"] as const).map((f) => (
          <Pressable
            key={f}
            accessibilityRole="button"
            accessibilityState={{ selected: filtri === f }}
            onPress={() => setFiltri(f)}
            style={[styles.chip, filtri === f && styles.chipAktiv]}
          >
            <Text style={[styles.chipTeksti, filtri === f && styles.chipTekstiAktiv]}>{t(`klientet.${f}`)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={teFiltruar}
        keyExtractor={(x) => x.celesi}
        contentContainerStyle={styles.lista}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <View style={styles.ndarja} />}
        refreshControl={
          <RefreshControl refreshing={klientet.isRefetching} onRefresh={() => void klientet.refetch()} tintColor={ngjyrat.ari} />
        }
        renderItem={({ item }) => <Rreshti klienti={item} />}
        ListEmptyComponent={
          lokaliIm.isPending || klientet.isLoading ? (
            <ActivityIndicator color={ngjyrat.ari} style={styles.ngarkimi} />
          ) : !lokaliIm.data ? (
            <View style={styles.bosh}>
              <Text style={styles.boshTeksti}>{t("sot.paLokal")}</Text>
              <Butoni titulli={t("sot.hapLokalin")} ikona={ikonat.lokali} onPress={() => router.navigate("/lokali")} />
            </View>
          ) : klientet.isError ? (
            <View style={styles.bosh}>
              <Text style={styles.boshTeksti}>{t("pergjithshme.gabimPapritur")}</Text>
              <Butoni titulli={t("zbulo.provoPerseri")} varianti="dytesor" ikona={ikonat.kthe} onPress={() => klientet.refetch()} />
            </View>
          ) : (
            <View style={styles.bosh}>
              <View style={styles.boshIkona}>
                <Ikona emri={ikonat.klientet} madhesia={28} ngjyra={ngjyrat.ari} />
              </View>
              <Text style={styles.boshTitulli}>{t("klientet.bosh")}</Text>
              <Text style={styles.boshTeksti}>{t("klientet.boshTeksti")}</Text>
            </View>
          )
        }
      />
    </View>
  );
}

function Rreshti({ klienti }: { klienti: KlientiILokalit }) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);

  const informacioni = klienti.termini_i_ardhshem
    ? t("klientet.iArdhshem", { data: formatoDaten(dataISO(new Date(klienti.termini_i_ardhshem)), t) })
    : klienti.vizita_e_fundit
      ? t("klientet.eFundit", { data: formatoDaten(dataISO(new Date(klienti.vizita_e_fundit)), t) })
      : klienti.telefoni ?? "";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: "/klienti/[celesi]", params: { celesi: klienti.celesi } })}
      style={({ pressed }) => [styles.rreshti, pressed && styles.shtypur]}
    >
      <Avatar emri={klienti.emri} madhesia={44} />
      <View style={styles.rreshtiTeksti}>
        <View style={styles.emriRreshti}>
          <Text style={styles.emri} numberOfLines={1}>
            {klienti.emri}
          </Text>
          {klienti.vip && <Ikona emri={ikonat.yll} madhesia={14} ngjyra={ngjyrat.ari} />}
        </View>
        <Text style={styles.info} numberOfLines={1}>
          {informacioni}
        </Text>
      </View>
      <View style={styles.numrat}>
        <Text style={styles.shpenzuar}>{formatoCmimin(klienti.shpenzuar_centa)}</Text>
        <Text style={styles.vizita}>{t("klientet.vizita", { numri: klienti.vizita })}</Text>
      </View>
    </Pressable>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    titulli: {
      color: ngjyrat.teksti,
      fontSize: 30,
      fontWeight: "800",
      letterSpacing: -0.6,
      paddingHorizontal: hapesira.xl,
      marginBottom: hapesira.lg,
    },
    kerkimi: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      paddingHorizontal: hapesira.md,
      height: 48,
      marginHorizontal: hapesira.xl,
      marginBottom: hapesira.md,
    },
    kerkimiInput: {
      flex: 1,
      color: ngjyrat.teksti,
      fontSize: 15,
      height: "100%",
    },
    filtratScroll: {
      flexGrow: 0,
      marginBottom: hapesira.md,
    },
    filtrat: {
      paddingHorizontal: hapesira.xl,
      gap: hapesira.sm,
    },
    chip: {
      paddingHorizontal: 14,
      height: 36,
      borderRadius: rrezja.plote,
      backgroundColor: ngjyrat.siperfaqja,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      justifyContent: "center",
    },
    chipAktiv: {
      backgroundColor: ngjyrat.teksti,
      borderColor: ngjyrat.teksti,
    },
    chipTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
    },
    chipTekstiAktiv: {
      color: ngjyrat.sfondi,
    },
    lista: {
      paddingHorizontal: hapesira.xl,
      paddingBottom: hapesira.xxl,
    },
    ndarja: {
      height: 1,
      backgroundColor: ngjyrat.kufiri,
      marginLeft: 56,
    },
    rreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      paddingVertical: hapesira.md,
    },
    shtypur: {
      opacity: 0.7,
    },
    rreshtiTeksti: {
      flex: 1,
      gap: 3,
    },
    emriRreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    emri: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "700",
      flexShrink: 1,
    },
    info: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    numrat: {
      alignItems: "flex-end",
      gap: 3,
    },
    shpenzuar: {
      color: ngjyrat.teksti,
      fontSize: 15,
      fontWeight: "800",
    },
    vizita: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 12,
    },
    ngarkimi: {
      marginTop: hapesira.xxl,
    },
    bosh: {
      alignItems: "center",
      gap: hapesira.sm,
      paddingVertical: hapesira.xxl,
    },
    boshIkona: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hapesira.sm,
    },
    boshTitulli: {
      color: ngjyrat.teksti,
      fontSize: 17,
      fontWeight: "800",
    },
    boshTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      textAlign: "center",
      maxWidth: 300,
      marginBottom: hapesira.md,
    },
  });
