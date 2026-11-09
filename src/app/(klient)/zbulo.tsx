import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLokaletPrane } from "../../api/lokalet";
import Butoni from "../../components/Butoni";
import FiltratEKerkimit, {
  FILTRAT_FILLESTARE,
  KATEGORITE,
  numeroFiltrat,
  type Filtrat,
} from "../../components/FiltratEKerkimit";
import Ikona, { ikonat } from "../../components/Ikona";
import KartaELokalit from "../../components/KartaELokalit";
import Marka from "../../components/Marka";
import { SkeletiIKartes } from "../../components/Skeleti";
import ZgjedhesiIQytetit from "../../components/ZgjedhesiIQytetit";
import { useAuth } from "../../context/AuthContext";
import { useStilet, useTema } from "../../context/TemaContext";
import { useVonesa } from "../../hooks/useVonesa";
import { useZonaIme } from "../../hooks/useZonaIme";
import { prekja } from "../../lib/prekja";
import { hapesira, shkronjat, type Ngjyrat } from "../../theme";

// Përveç qytetit, shfaqen edhe lokalet brenda kësaj rrezeje nga klienti (lagjet në periferi).
const RREZJA_KM = 10;

type CelesiIMuajit = `koha.m${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11}`;

function pershendetjaESotme(): "zbulo.mirmengjes" | "zbulo.mirdita" | "zbulo.mirembrema" {
  const ora = new Date().getHours();
  return ora < 11 ? "zbulo.mirmengjes" : ora < 18 ? "zbulo.mirdita" : "zbulo.mirembrema";
}

// Numri i "botimit" është java e vitit (ISO 8601), si numri i një reviste javore.
function javaEVitit(d: Date): number {
  const data = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dita = data.getUTCDay() || 7;
  data.setUTCDate(data.getUTCDate() + 4 - dita);
  const filliVitit = new Date(Date.UTC(data.getUTCFullYear(), 0, 1));
  return Math.ceil(((data.getTime() - filliVitit.getTime()) / 86_400_000 + 1) / 7);
}

export default function Zbulo() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { emriIShfaqur } = useAuth();
  const zona = useZonaIme();
  const { pika, kaLeje, kerkoLeje } = zona;
  const [zgjedhesi, setZgjedhesi] = useState(false);

  const [kerkimi, setKerkimi] = useState("");
  const [filtrat, setFiltrat] = useState<Filtrat>(FILTRAT_FILLESTARE);
  const [fleta, setFleta] = useState(false);
  const kerkimiIVonuar = useVonesa(kerkimi);
  const nrFiltrave = numeroFiltrat(filtrat);
  const ndrysho = <K extends keyof Filtrat>(celesi: K, vlera: Filtrat[K]) => setFiltrat((f) => ({ ...f, [celesi]: vlera }));

  const lokalet = useLokaletPrane(
    {
      pika,
      rrezjaKm: RREZJA_KM,
      kerkimi: kerkimiIVonuar,
      vetemHapur: filtrat.vetemHapur,
      cmimiMax: filtrat.cmimiMax,
      renditja: filtrat.renditja,
      qytetiId: zona.qyteti?.id ?? null,
      sherbimi: filtrat.sherbimi,
      vleresimiMin: filtrat.vleresimiMin,
      distancaMaxKm: filtrat.distancaKm,
      vetemOnline: filtrat.vetemOnline,
      vetemOferta: filtrat.vetemOferta,
    },
    // Pret derisa të dihet qyteti, që të mos ngarkohen lokalet e një qyteti tjetër.
    zona.gati,
  );

  const kaFiltra = nrFiltrave > 0 || kerkimi.trim() !== "";
  const emriIPare = emriIShfaqur.includes("@") ? "" : emriIShfaqur.split(" ")[0];
  const sot = new Date();
  const botimi = `No.${javaEVitit(sot)} · ${t(`koha.m${sot.getMonth()}` as CelesiIMuajit)} ${sot.getFullYear()}`;

  function pastroFiltrat() {
    setKerkimi("");
    setFiltrat(FILTRAT_FILLESTARE);
  }

  const koka = (
    <View>
      <View style={styles.masthead}>
        <Marka madhesia={30} />
        <View style={styles.veprimet}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("zona.zgjidhQytetin")}
            onPress={() => {
              prekja.lehte();
              setZgjedhesi(true);
            }}
            hitSlop={6}
            style={({ pressed }) => [styles.qyteti, pressed && styles.shtypur]}
          >
            <Text style={styles.qytetiTeksti} numberOfLines={1}>
              {zona.qyteti?.emri ?? t("zona.zgjidhQytetin")}
            </Text>
            <Text style={styles.qytetiTeksti}>↓</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("qr.skano")}
            onPress={() => {
              prekja.lehte();
              router.push("/skano");
            }}
            hitSlop={6}
            style={({ pressed }) => [styles.skano, pressed && styles.shtypur]}
          >
            <Ikona emri={ikonat.skano} madhesia={18} ngjyra={ngjyrat.teksti} />
          </Pressable>
        </View>
      </View>

      <View style={styles.vijaETrashe} />
      <View style={styles.botimi}>
        <Text style={styles.botimiTeksti}>{botimi}</Text>
        <Text style={styles.botimiTeksti} numberOfLines={1}>
          {t(pershendetjaESotme())}
          {emriIPare ? `, ${emriIPare}` : ""}
        </Text>
      </View>
      <View style={styles.vijaEHolle} />

      <Text style={styles.titulli}>{t("zbulo.titulliRevistes")}</Text>
      <Text style={styles.titulliKursive}>
        {zona.qyteti
          ? t("zbulo.titulliQyteti", { qyteti: zona.qyteti.emri })
          : t("zbulo.titulliKosova")}
      </Text>
      <Text style={styles.hyrja}>{t("zbulo.gatiPerLook")}</Text>

      <View style={styles.kerkimi}>
        <Ikona emri={ikonat.kerko} madhesia={18} ngjyra={ngjyrat.teksti} />
        <TextInput
          value={kerkimi}
          onChangeText={setKerkimi}
          placeholder={t("zbulo.kerko")}
          placeholderTextColor={ngjyrat.tekstiZbehte}
          style={styles.kerkimiInput}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel={t("zbulo.kerko")}
        />
        {kerkimi !== "" && (
          <Pressable accessibilityRole="button" accessibilityLabel={t("zbulo.pastroFiltrat")} onPress={() => setKerkimi("")} hitSlop={10}>
            <Ikona emri={ikonat.pastro} madhesia={18} ngjyra={ngjyrat.tekstiDyte} />
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={nrFiltrave > 0 ? `${t("zbulo.filtrat")} (${nrFiltrave})` : t("zbulo.filtrat")}
          onPress={() => {
            prekja.lehte();
            setFleta(true);
          }}
          hitSlop={6}
          style={({ pressed }) => [styles.filtratButoni, nrFiltrave > 0 && styles.filtratButoniAktiv, pressed && styles.shtypur]}
        >
          <Ikona emri={ikonat.filtrat} madhesia={16} ngjyra={nrFiltrave > 0 ? ngjyrat.mbiAri : ngjyrat.teksti} />
          <Text style={[styles.filtratTeksti, nrFiltrave > 0 && styles.filtratTekstiAktiv]}>
            {nrFiltrave > 0 ? `${t("zbulo.filtrat")} · ${nrFiltrave}` : t("zbulo.filtrat")}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtratScroll}
        contentContainerStyle={styles.filtrat}
      >
        <Chip teksti={t("zbulo.hapurTani")} aktiv={filtrat.vetemHapur} onPress={() => ndrysho("vetemHapur", !filtrat.vetemHapur)} />
        <Chip teksti={t("zbulo.online")} aktiv={filtrat.vetemOnline} onPress={() => ndrysho("vetemOnline", !filtrat.vetemOnline)} />
        <Chip teksti={t("zbulo.meOferte")} aktiv={filtrat.vetemOferta} onPress={() => ndrysho("vetemOferta", !filtrat.vetemOferta)} />
        {KATEGORITE.map((k) => (
          <Chip
            key={k}
            teksti={t(`zbulo.k_${k}`)}
            aktiv={filtrat.sherbimi === k}
            onPress={() => ndrysho("sherbimi", filtrat.sherbimi === k ? null : k)}
          />
        ))}
      </ScrollView>

      {kaLeje === false && !zona.qyteti && (
        <View style={styles.leja}>
          <Text style={styles.lejaTeksti}>{t("zbulo.paLeje")}</Text>
          <Pressable accessibilityRole="button" onPress={kerkoLeje} hitSlop={8}>
            <Text style={styles.lejaButoni}>{t("zbulo.lejoVendndodhjen")} →</Text>
          </Pressable>
        </View>
      )}

      {lokalet.data && lokalet.data.length > 0 && (
        <View style={styles.seksioni}>
          <Text style={styles.seksioniTeksti}>{t("zbulo.neKeteBotim")}</Text>
          <Text style={styles.seksioniTeksti}>{t("zbulo.rezultatet", { numri: lokalet.data.length })}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FiltratEKerkimit
        iDukshem={fleta}
        filtrat={filtrat}
        ndrysho={setFiltrat}
        numri={lokalet.data && !lokalet.isPlaceholderData ? lokalet.data.length : null}
        onMbyll={() => setFleta(false)}
      />
      <ZgjedhesiIQytetit
        iDukshem={zgjedhesi}
        qytetiAktual={zona.qyteti?.id ?? null}
        onMbyll={() => setZgjedhesi(false)}
        onVendndodhjaIme={() => void kerkoLeje()}
      />
      <FlatList
        style={styles.lista0}
        contentContainerStyle={[styles.lista, { paddingTop: insets.top + hapesira.md }]}
        data={lokalet.data ?? []}
        keyExtractor={(l) => l.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={koka}
        ItemSeparatorComponent={() => <View style={{ height: hapesira.xxl }} />}
        ListFooterComponent={
          (lokalet.data ?? []).some((l) => l.burimi === "osm") ? (
            <Text style={styles.atribuimi}>{t("pergjithshme.atribuimiOsm")}</Text>
          ) : undefined
        }
        renderItem={({ item, index }) => <KartaELokalit lokali={item} indeksi={index} />}
        refreshControl={
          <RefreshControl refreshing={lokalet.isRefetching} onRefresh={() => void lokalet.refetch()} tintColor={ngjyrat.teksti} />
        }
        ListEmptyComponent={
          lokalet.isPending ? (
            <View style={styles.skeletet}>
              <SkeletiIKartes />
              <SkeletiIKartes />
            </View>
          ) : (
            <View style={styles.bosh}>
              <Text style={styles.boshTitulli}>{lokalet.isError ? t("zbulo.gabim") : t("zbulo.asnje")}</Text>
              {!lokalet.isError && <Text style={styles.boshTeksti}>{t("zbulo.asnjeTeksti")}</Text>}
              {lokalet.isError ? (
                <Butoni titulli={t("zbulo.provoPerseri")} varianti="dytesor" ikona={ikonat.kthe} onPress={() => lokalet.refetch()} />
              ) : (
                kaFiltra && (
                  <Butoni titulli={t("zbulo.pastroFiltrat")} varianti="dytesor" ikona={ikonat.kthe} onPress={pastroFiltrat} />
                )
              )}
            </View>
          )
        }
      />
    </View>
  );
}

function Chip({ teksti, aktiv, onPress }: { teksti: string; aktiv: boolean; onPress: () => void }) {
  const styles = useStilet(krijoStilet);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: aktiv }}
      onPress={() => {
        prekja.zgjedhje();
        onPress();
      }}
      style={[styles.chip, aktiv && styles.chipAktiv]}
    >
      <Text style={[styles.chipTeksti, aktiv && styles.chipTekstiAktiv]}>{teksti}</Text>
    </Pressable>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    lista0: {
      flex: 1,
    },
    lista: {
      paddingHorizontal: hapesira.xl,
      paddingBottom: hapesira.xxl * 2,
    },
    masthead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: hapesira.md,
      paddingBottom: hapesira.sm,
    },
    veprimet: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      flexShrink: 1,
    },
    qyteti: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      maxWidth: 160,
      paddingHorizontal: 10,
      height: 34,
      borderWidth: 1.5,
      borderColor: ngjyrat.vija,
    },
    qytetiTeksti: {
      flexShrink: 1,
      fontFamily: shkronjat.monoBold,
      color: ngjyrat.teksti,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    skano: {
      width: 34,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: ngjyrat.vija,
    },
    shtypur: {
      opacity: 0.6,
    },
    vijaETrashe: {
      height: 4,
      backgroundColor: ngjyrat.vija,
    },
    botimi: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: hapesira.md,
      paddingVertical: 6,
    },
    botimiTeksti: {
      flexShrink: 1,
      fontFamily: shkronjat.mono,
      color: ngjyrat.teksti,
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    vijaEHolle: {
      height: 1,
      backgroundColor: ngjyrat.vija,
    },
    titulli: {
      fontFamily: shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 52,
      lineHeight: 54,
      letterSpacing: -1.6,
      marginTop: hapesira.xl,
    },
    titulliKursive: {
      fontFamily: shkronjat.kursive,
      color: ngjyrat.teksti,
      fontSize: 44,
      lineHeight: 50,
      letterSpacing: -1,
    },
    hyrja: {
      fontFamily: shkronjat.kursive,
      color: ngjyrat.tekstiDyte,
      fontSize: 17,
      lineHeight: 24,
      marginTop: hapesira.md,
      marginBottom: hapesira.xl,
    },
    kerkimi: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      borderBottomWidth: 1.5,
      borderBottomColor: ngjyrat.vija,
      height: 50,
      marginBottom: hapesira.lg,
    },
    kerkimiInput: {
      flex: 1,
      color: ngjyrat.teksti,
      fontSize: 16,
      height: "100%",
    },
    filtratButoni: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      height: 34,
      borderWidth: 1.5,
      borderColor: ngjyrat.vija,
    },
    filtratButoniAktiv: {
      backgroundColor: ngjyrat.ari,
    },
    filtratTeksti: {
      fontFamily: shkronjat.monoBold,
      color: ngjyrat.teksti,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    filtratTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    filtratScroll: {
      marginHorizontal: -hapesira.xl,
      marginBottom: hapesira.xl,
      flexGrow: 0,
    },
    filtrat: {
      paddingHorizontal: hapesira.xl,
      gap: hapesira.sm,
    },
    chip: {
      paddingHorizontal: 12,
      height: 34,
      borderWidth: 1.5,
      borderColor: ngjyrat.vija,
      justifyContent: "center",
    },
    chipAktiv: {
      backgroundColor: ngjyrat.ari,
    },
    chipTeksti: {
      fontFamily: shkronjat.monoBold,
      color: ngjyrat.teksti,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    chipTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    leja: {
      gap: hapesira.sm,
      borderLeftWidth: 3,
      borderLeftColor: ngjyrat.theksi,
      paddingLeft: hapesira.md,
      paddingVertical: 4,
      marginBottom: hapesira.xl,
    },
    lejaTeksti: {
      fontFamily: shkronjat.kursive,
      color: ngjyrat.teksti,
      fontSize: 15,
      lineHeight: 21,
    },
    lejaButoni: {
      fontFamily: shkronjat.monoBold,
      color: ngjyrat.theksi,
      fontSize: 12,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    seksioni: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: hapesira.md,
    },
    seksioniTeksti: {
      fontFamily: shkronjat.monoBold,
      color: ngjyrat.tekstiDyte,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    skeletet: {
      gap: hapesira.xl,
    },
    atribuimi: {
      fontFamily: shkronjat.mono,
      color: ngjyrat.tekstiZbehte,
      fontSize: 10,
      letterSpacing: 0.5,
      textAlign: "center",
      marginTop: hapesira.xxl,
    },
    bosh: {
      alignItems: "center",
      paddingVertical: hapesira.xxl,
      gap: hapesira.md,
    },
    boshTitulli: {
      fontFamily: shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 26,
      textAlign: "center",
    },
    boshTeksti: {
      fontFamily: shkronjat.kursive,
      color: ngjyrat.tekstiDyte,
      fontSize: 16,
      lineHeight: 22,
      textAlign: "center",
      marginBottom: hapesira.md,
      maxWidth: 300,
    },
  });
