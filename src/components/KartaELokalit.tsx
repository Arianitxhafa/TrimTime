import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useStilet, useTema } from "../context/TemaContext";
import { useShtypja } from "../hooks/useShtypja";
import { formatoCmimin, formatoDistancen } from "../lib/formatimi";
import { prekja } from "../lib/prekja";
import type { LokaliPrane } from "../lib/tipet";
import { hapesira, hijet, rrezja, shkronjat, type Ngjyrat } from "../theme";
import Ikona, { ikonat } from "./Ikona";
import KopertinaELokalit from "./KopertinaELokalit";

type Props = {
  lokali: LokaliPrane;
  // Në hartë karta është më e ngushtë dhe pa kopertinë.
  kompakte?: boolean;
  // Pozicioni në listë: kartat e para hyjnë njëra pas tjetrës.
  indeksi?: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Lokali si kartë berberie: kopertina (foto ose tabelë e gjeneruar), vlerësimi dhe oferta mbi të,
// pastaj emri me serif dhe detajet.
export default function KartaELokalit({ lokali, kompakte = false, indeksi }: Props) {
  const { t } = useTranslation();
  const { ngjyrat, statusetMeta } = useTema();
  const styles = useStilet(krijoStilet);
  const shtypja = useShtypja(0.98);
  const kaVleresim = lokali.vleresimi_mesatar != null && lokali.nr_vleresimeve > 0;
  const ngjyraEStatusit =
    lokali.ka_orar && lokali.i_hapur_tani ? statusetMeta.konfirmuar.ngjyra : ngjyrat.tekstiZbehte;

  function hap() {
    prekja.lehte();
    router.push({ pathname: "/lokali/[id]", params: { id: lokali.id } });
  }

  // Orari i panjohur (shumica e lokaleve nga OpenStreetMap): nuk shkruajmë "Mbyllur".
  const statusi = lokali.ka_orar ? (lokali.i_hapur_tani ? t("lokali.hapur") : t("lokali.mbyllur")) : null;
  const detajet = [
    statusi,
    formatoDistancen(lokali.distanca_m),
    lokali.cmimi_min !== null ? t("lokali.ngaCmimi", { cmimi: formatoCmimin(lokali.cmimi_min) }) : null,
  ].filter(Boolean);
  const rezervimi = lokali.rezervim_online ? null : lokali.telefoni ? t("lokali.meTelefon") : t("lokali.paTermin");

  if (kompakte) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={lokali.emri}
        onPress={hap}
        style={({ pressed }) => [styles.kompakte, pressed && styles.shtypur]}
      >
        <KopertinaELokalit emri={lokali.emri} fotoUrl={lokali.kopertina_url} style={styles.kopertinaKompakte} />
        <View style={styles.teksti}>
          <Text style={styles.emriKompakt} numberOfLines={1}>
            {lokali.emri}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {kaVleresim ? `★ ${Number(lokali.vleresimi_mesatar).toFixed(1)} · ` : ""}
            {detajet.join(" · ")}
          </Text>
        </View>
        {lokali.promocioni_max ? (
          <Text style={styles.promo}>{t("promocionet.etiketa", { perqindja: lokali.promocioni_max })}</Text>
        ) : null}
        <Ikona emri={ikonat.djathtas} madhesia={16} ngjyra={ngjyrat.tekstiZbehte} />
      </Pressable>
    );
  }

  return (
    <Animated.View entering={indeksi !== undefined && indeksi < 8 ? FadeInDown.delay(indeksi * 70).duration(420) : undefined}>
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={lokali.emri}
        onPressIn={shtypja.onPressIn}
        onPressOut={shtypja.onPressOut}
        onPress={hap}
        style={[styles.karta, hijet.karte, shtypja.stili]}
      >
        <View>
          <KopertinaELokalit emri={lokali.emri} fotoUrl={lokali.kopertina_url} style={styles.kopertina} />
          {kaVleresim ? (
            <View style={styles.vleresimi}>
              <Text style={styles.vleresimiTeksti}>★ {Number(lokali.vleresimi_mesatar).toFixed(1)}</Text>
              <Text style={styles.vleresimiNumri}>({lokali.nr_vleresimeve})</Text>
            </View>
          ) : null}
          {lokali.promocioni_max ? (
            <View style={styles.promoEtiketa}>
              <Text style={styles.promoEtiketaTeksti}>
                {t("promocionet.etiketa", { perqindja: lokali.promocioni_max })}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.trupi}>
          <Text style={styles.emri} numberOfLines={2}>
            {lokali.emri}
          </Text>
          <Text style={styles.adresa} numberOfLines={1}>
            {lokali.adresa}, {lokali.qyteti}
          </Text>
          <View style={styles.detajet}>
            {statusi ? <View style={[styles.pika, { backgroundColor: ngjyraEStatusit }]} /> : null}
            <Text style={styles.meta} numberOfLines={1}>
              {detajet.join("  ·  ")}
            </Text>
          </View>
          {rezervimi ? (
            <View style={styles.etiketa}>
              <Ikona emri={lokali.telefoni ? ikonat.telefoni : ikonat.harta} madhesia={13} ngjyra={ngjyrat.bronzi} />
              <Text style={styles.etiketaTeksti}>{rezervimi}</Text>
            </View>
          ) : (
            <View style={styles.etiketa}>
              <Ikona emri={ikonat.kalendar} madhesia={13} ngjyra={ngjyrat.bronzi} />
              <Text style={styles.etiketaTeksti}>{t("zbulo.online")}</Text>
            </View>
          )}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    karta: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      overflow: "hidden",
    },
    kopertina: {
      height: 140,
    },
    vleresimi: {
      position: "absolute",
      top: 20,
      left: hapesira.md,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: ngjyrat.xham,
      borderRadius: rrezja.plote,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    vleresimiTeksti: {
      fontFamily: shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 13,
    },
    vleresimiNumri: {
      fontFamily: shkronjat.etikete,
      color: ngjyrat.tekstiDyte,
      fontSize: 12,
    },
    promoEtiketa: {
      position: "absolute",
      top: 20,
      right: hapesira.md,
      backgroundColor: ngjyrat.theksi,
      borderRadius: rrezja.plote,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    promoEtiketaTeksti: {
      fontFamily: shkronjat.etiketeBold,
      color: "#FFFFFF",
      fontSize: 12,
    },
    trupi: {
      padding: hapesira.lg,
      gap: 4,
    },
    emri: {
      fontFamily: shkronjat.titull,
      color: ngjyrat.teksti,
      fontSize: 23,
      lineHeight: 28,
      letterSpacing: -0.3,
    },
    adresa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
    },
    detajet: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      marginTop: 6,
    },
    pika: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    meta: {
      flexShrink: 1,
      fontFamily: shkronjat.etikete,
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    etiketa: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      marginTop: hapesira.sm,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: rrezja.plote,
      borderWidth: 1,
      borderColor: ngjyrat.vija,
    },
    etiketaTeksti: {
      fontFamily: shkronjat.etikete,
      color: ngjyrat.bronzi,
      fontSize: 12,
    },
    kompakte: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      padding: hapesira.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
    },
    kopertinaKompakte: {
      width: 56,
      height: 56,
      borderRadius: rrezja.md,
    },
    shtypur: {
      opacity: 0.85,
    },
    teksti: {
      flex: 1,
      gap: 4,
    },
    emriKompakt: {
      fontFamily: shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 18,
    },
    promo: {
      fontFamily: shkronjat.etiketeBold,
      color: ngjyrat.theksi,
      fontSize: 12,
    },
  });
