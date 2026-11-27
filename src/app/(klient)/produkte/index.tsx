import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KATEGORITE_E_PRODUKTEVE, useProduktet, type KategoriaEProduktit, type Produkti } from "../../../api/dyqani";
import Ikona, { ikonat } from "../../../components/Ikona";
import { useShporta } from "../../../context/ShportaContext";
import { useStilet, useTema } from "../../../context/TemaContext";
import { useShtypja } from "../../../hooks/useShtypja";
import { formatoCmimin } from "../../../lib/formatimi";
import { prekja } from "../../../lib/prekja";
import { hapesira, shkronjat, type Ngjyrat } from "../../../theme";

type Renditja = "teRejat" | "cmimiRrites" | "cmimiZbrites";
const RENDITJET: Renditja[] = ["teRejat", "cmimiRrites", "cmimiZbrites"];
const DITE_TE_REJA = 14;

// Dyqani i Studios: kërkimi dhe "Porositë", kategoritë, renditja dhe rrjeta me produktet. Butoni i
// shportës noton poshtë sapo shtohet diçka.
export default function Produktet() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const produktet = useProduktet();
  const shporta = useShporta();
  const [kerkimi, setKerkimi] = useState("");
  const [kategoria, setKategoria] = useState<KategoriaEProduktit | null>(null);
  const [renditja, setRenditja] = useState<Renditja>("teRejat");

  const lista = useMemo(() => {
    const k = kerkimi.trim().toLowerCase();
    const te = (produktet.data ?? []).filter(
      (p) => p.aktiv && (!kategoria || p.kategoria === kategoria) && (!k || p.emri.toLowerCase().includes(k)),
    );
    if (renditja === "cmimiRrites") return [...te].sort((a, b) => a.cmimi_centa - b.cmimi_centa);
    if (renditja === "cmimiZbrites") return [...te].sort((a, b) => b.cmimi_centa - a.cmimi_centa);
    return te;
  }, [produktet.data, kerkimi, kategoria, renditja]);

  const koka = (
    <View style={styles.koka}>
      <Animated.View entering={FadeInDown.duration(380)} style={styles.rreshtiISiperm}>
        <View style={styles.kerkimi}>
          <Ikona emri={ikonat.kerko} madhesia={18} ngjyra={ngjyrat.tekstiDyte} />
          <TextInput
            value={kerkimi}
            onChangeText={setKerkimi}
            placeholder={t("dyqani.kerko")}
            placeholderTextColor={ngjyrat.tekstiZbehte}
            accessibilityLabel={t("dyqani.kerko")}
            returnKeyType="search"
            autoCorrect={false}
            style={styles.kerkimiFusha}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/porosite")}
          style={({ pressed }) => [styles.porosite, pressed && styles.shtypur]}
        >
          <Ikona emri={ikonat.shenime} madhesia={18} ngjyra={ngjyrat.teksti} />
          <Text style={styles.porositeTeksti}>{t("dyqani.porosite")}</Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(380)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipet}>
          {[null, ...KATEGORITE_E_PRODUKTEVE].map((k) => {
            const aktiv = kategoria === k;
            return (
              <Pressable
                key={k ?? "te-gjitha"}
                accessibilityRole="button"
                accessibilityState={{ selected: aktiv }}
                onPress={() => {
                  prekja.zgjedhje();
                  setKategoria(k);
                }}
                style={[styles.chip, aktiv && styles.chipAktiv]}
              >
                <Text style={[styles.chipTeksti, aktiv && styles.chipTekstiAktiv]}>
                  {k ? t(`dyqani.kategoria_${k}`) : t("dyqani.teGjitha")}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(110).duration(380)} style={styles.renditjet}>
        <Text style={styles.renditjaEtiketa}>{t("dyqani.renditja")}</Text>
        {RENDITJET.map((r) => (
          <Pressable
            key={r}
            accessibilityRole="button"
            accessibilityState={{ selected: renditja === r }}
            onPress={() => {
              prekja.zgjedhje();
              setRenditja(r);
            }}
            hitSlop={6}
          >
            <Text style={[styles.renditja, renditja === r && styles.renditjaAktive]}>{t(`dyqani.${r}`)}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={lista}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.kolonat}
        contentContainerStyle={{ paddingTop: insets.top + hapesira.md, paddingBottom: insets.bottom + 180, paddingHorizontal: hapesira.lg }}
        ListHeaderComponent={koka}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => <KartaEProduktit produkti={item} vonesa={Math.min(index, 8) * 50} />}
        ListEmptyComponent={
          produktet.isPending ? (
            <ActivityIndicator color={ngjyrat.ari} style={styles.ngarkimi} />
          ) : (
            <View style={styles.bosh}>
              <Ikona emri={ikonat.dhurate} madhesia={30} ngjyra={ngjyrat.ari} />
              <Text style={styles.boshTeksti}>
                {(produktet.data ?? []).some((p) => p.aktiv) ? t("dyqani.asnjePerputhet") : t("dyqani.bosh")}
              </Text>
            </View>
          )
        }
      />

      {shporta.numri > 0 ? (
        <Animated.View entering={ZoomIn.springify().damping(14)} style={[styles.shportaVendi, { bottom: insets.bottom + 96 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("dyqani.shporta")}
            onPress={() => router.push("/shporta")}
            style={({ pressed }) => [styles.shporta, pressed && styles.shtypur]}
          >
            <View style={styles.shportaNumri}>
              <Animated.Text key={shporta.numri} entering={ZoomIn.springify()} style={styles.shportaNumriTeksti}>
                {shporta.numri}
              </Animated.Text>
            </View>
            <Text style={styles.shportaTeksti}>{t("dyqani.shikoShporten")}</Text>
            <Text style={styles.shportaTotali}>{formatoCmimin(shporta.totali)}</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

function KartaEProduktit({ produkti: p, vonesa }: { produkti: Produkti; vonesa: number }) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const shtypja = useShtypja(0.96);
  // "Tani" merret një herë, kur shfaqet karta.
  const [tani] = useState(() => Date.now());
  const iRi = tani - new Date(p.krijuar_me).getTime() < DITE_TE_REJA * 86_400_000;
  const mbaroi = p.ne_stok === 0;

  return (
    <Animated.View entering={FadeInDown.delay(vonesa).springify().damping(18)} style={styles.kartaVendi}>
      <Animated.View style={shtypja.stili}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${p.emri}, ${formatoCmimin(p.cmimi_centa)}`}
          onPressIn={shtypja.onPressIn}
          onPressOut={shtypja.onPressOut}
          onPress={() => router.push({ pathname: "/produkti/[id]", params: { id: p.id } })}
          style={styles.karta}
        >
          <View style={styles.fotoKutia}>
            {p.foto_url ? (
              <Image source={{ uri: p.foto_url }} style={styles.foto} contentFit="contain" transition={200} />
            ) : (
              <Ikona emri={ikonat.dhurate} madhesia={36} ngjyra={ngjyrat.tekstiZbehte} />
            )}
            {iRi && !mbaroi ? (
              <View style={styles.distinktivi}>
                <Text style={styles.distinktiviTeksti}>{t("dyqani.iRi")}</Text>
              </View>
            ) : null}
            {mbaroi ? (
              <View style={[styles.distinktivi, styles.distinktiviMbaroi]}>
                <Text style={styles.distinktiviTeksti}>{t("dyqani.mbaroi")}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.kartaTeksti}>
            <Text style={styles.emri} numberOfLines={1}>
              {p.emri}
            </Text>
            <Text style={styles.kategoria} numberOfLines={1}>
              {t(`dyqani.kategoria_${p.kategoria}`)}
            </Text>
            <Text style={styles.cmimi}>{formatoCmimin(p.cmimi_centa)}</Text>
          </View>
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
    koka: {
      gap: hapesira.md,
      marginBottom: hapesira.md,
    },
    rreshtiISiperm: {
      flexDirection: "row",
      gap: hapesira.sm,
    },
    kerkimi: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      height: 52,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.siperfaqja,
      paddingHorizontal: hapesira.lg,
    },
    kerkimiFusha: {
      flex: 1,
      height: 52,
      color: ngjyrat.teksti,
      fontSize: 16,
    },
    porosite: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: 52,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.siperfaqja,
      paddingHorizontal: hapesira.lg,
    },
    porositeTeksti: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 15,
    },
    chipet: {
      gap: hapesira.sm,
    },
    chip: {
      height: 40,
      borderRadius: 20,
      paddingHorizontal: hapesira.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      backgroundColor: ngjyrat.siperfaqja,
      justifyContent: "center",
    },
    chipAktiv: {
      backgroundColor: ngjyrat.ari,
      borderColor: ngjyrat.ari,
    },
    chipTeksti: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 14,
    },
    chipTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    renditjet: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      flexWrap: "wrap",
    },
    renditjaEtiketa: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    renditja: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      fontWeight: "600",
    },
    renditjaAktive: {
      color: ngjyrat.ari,
      textDecorationLine: "underline",
    },
    kolonat: {
      gap: hapesira.md,
    },
    kartaVendi: {
      flex: 1,
      marginBottom: hapesira.md,
    },
    karta: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: 24,
      borderCurve: "continuous",
      borderWidth: 1.5,
      borderColor: ngjyrat.kufiri,
      overflow: "hidden",
    },
    fotoKutia: {
      height: 150,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
    },
    foto: {
      width: "82%",
      height: "88%",
    },
    distinktivi: {
      position: "absolute",
      top: 0,
      right: 0,
      backgroundColor: ngjyrat.ari,
      borderBottomLeftRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    distinktiviMbaroi: {
      backgroundColor: ngjyrat.rrezik,
    },
    distinktiviTeksti: {
      color: ngjyrat.mbiAri,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
    kartaTeksti: {
      padding: hapesira.md,
      gap: 2,
    },
    emri: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 16,
    },
    kategoria: {
      color: ngjyrat.tekstiDyte,
      fontSize: 12,
    },
    cmimi: {
      ...shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 17,
      marginTop: 4,
    },
    ngarkimi: {
      marginTop: hapesira.xxl,
    },
    bosh: {
      alignItems: "center",
      gap: hapesira.md,
      paddingVertical: hapesira.xxl * 2,
    },
    boshTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      textAlign: "center",
    },
    shportaVendi: {
      position: "absolute",
      left: hapesira.lg,
      right: hapesira.lg,
    },
    shporta: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      height: 60,
      borderRadius: 30,
      backgroundColor: ngjyrat.ari,
      paddingHorizontal: hapesira.md,
      shadowColor: "#000",
      shadowOpacity: 0.22,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    shportaNumri: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.22)",
      alignItems: "center",
      justifyContent: "center",
    },
    shportaNumriTeksti: {
      color: ngjyrat.mbiAri,
      fontSize: 16,
      fontWeight: "800",
    },
    shportaTeksti: {
      ...shkronjat.etiketeBold,
      flex: 1,
      color: ngjyrat.mbiAri,
      fontSize: 16,
    },
    shportaTotali: {
      ...shkronjat.titull,
      color: ngjyrat.mbiAri,
      fontSize: 17,
    },
    shtypur: {
      opacity: 0.85,
    },
  });
