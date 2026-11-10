import * as LidhjetExpo from "expo-linking";
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Linking, Platform, Pressable, Share, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useStilet, useTema } from "../context/TemaContext";
import { useShtypja } from "../hooks/useShtypja";
import { formatoCmimin, formatoDistancen } from "../lib/formatimi";
import { prekja } from "../lib/prekja";
import type { LokaliPrane } from "../lib/tipet";
import { lidhjaEUdhezimeve } from "../lib/vendndodhja";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../theme";
import Ikona, { ikonat } from "./Ikona";
import KopertinaELokalit from "./KopertinaELokalit";

type Props = {
  lokali: LokaliPrane;
  // Në hartë karta është më e ngushtë dhe pa kopertinë të madhe.
  kompakte?: boolean;
  // Pozicioni në listë: kartat e para hyjnë njëra pas tjetrës.
  indeksi?: number;
};

// Lokali si kartë iOS. Prekja e shkurtër hap profilin; prekja e gjatë (iPhone) tregon parapamjen e
// profilit dhe menunë me Rezervo, Thirr, Udhëzimet dhe Ndaj.
export default function KartaELokalit({ lokali, kompakte = false, indeksi }: Props) {
  const { t } = useTranslation();
  const { ngjyrat, statusetMeta } = useTema();
  const styles = useStilet(krijoStilet);
  const shtypja = useShtypja(0.97);
  const kaVleresim = lokali.vleresimi_mesatar != null && lokali.nr_vleresimeve > 0;
  const vleresimi = kaVleresim ? Number(lokali.vleresimi_mesatar).toFixed(1).replace(".", ",") : null;

  // Orari i panjohur (shumica e lokaleve nga OpenStreetMap): nuk shkruajmë "Mbyllur".
  const statusi = lokali.ka_orar ? (lokali.i_hapur_tani ? t("lokali.hapur") : t("lokali.mbyllur")) : null;
  const ngjyraEStatusit = lokali.i_hapur_tani ? statusetMeta.konfirmuar.ngjyra : ngjyrat.tekstiZbehte;
  const detajet = [
    formatoDistancen(lokali.distanca_m),
    lokali.cmimi_min !== null ? t("lokali.ngaCmimi", { cmimi: formatoCmimin(lokali.cmimi_min) }) : null,
  ].filter(Boolean);
  const rezervimi = lokali.rezervim_online
    ? t("zbulo.online")
    : lokali.telefoni
      ? t("lokali.meTelefon")
      : t("lokali.paTermin");

  const href = { pathname: "/lokali/[id]", params: { id: lokali.id } } as const;
  const thirr = () => Linking.openURL(`tel:${lokali.telefoni?.replace(/\s/g, "")}`);
  const udhezimet = () => Linking.openURL(lidhjaEUdhezimeve(lokali, Platform.OS));
  const ndaj = () =>
    Share.share({
      message: `${lokali.emri} · ${lokali.adresa}, ${lokali.qyteti}\n${LidhjetExpo.createURL(`/lokali/${lokali.id}`)}`,
    });

  if (kompakte) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={lokali.emri}
        onPress={() => {
          prekja.lehte();
          router.push(href);
        }}
        style={({ pressed }) => [styles.kompakte, pressed && styles.shtypur]}
      >
        <KopertinaELokalit emri={lokali.emri} fotoUrl={lokali.kopertina_url} style={styles.kopertinaKompakte} />
        <View style={styles.teksti}>
          <Text style={styles.emriKompakt} numberOfLines={1}>
            {lokali.emri}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {vleresimi ? `★ ${vleresimi} · ` : ""}
            {[statusi, ...detajet].filter(Boolean).join(" · ")}
          </Text>
        </View>
        {lokali.promocioni_max ? (
          <Text style={styles.promo}>{t("promocionet.etiketa", { perqindja: lokali.promocioni_max })}</Text>
        ) : null}
        <Ikona emri={ikonat.djathtas} madhesia={14} ngjyra={ngjyrat.tekstiZbehte} />
      </Pressable>
    );
  }

  return (
    <Animated.View entering={indeksi !== undefined && indeksi < 8 ? FadeInDown.delay(indeksi * 60).duration(380) : undefined}>
      <Link href={href} asChild>
        <Link.Trigger>
          {/* Link-u (asChild) nuk pranon stile në listë: animacioni i shtypjes është te View-ja brenda. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={lokali.emri}
            onPressIn={() => {
              prekja.lehte();
              shtypja.onPressIn();
            }}
            onPressOut={shtypja.onPressOut}
          >
            <Animated.View style={[styles.karta, shtypja.stili]}>
            <View>
              <KopertinaELokalit emri={lokali.emri} fotoUrl={lokali.kopertina_url} style={styles.kopertina} />
              {vleresimi ? (
                <View style={styles.vleresimi}>
                  <Text style={styles.vleresimiTeksti}>★ {vleresimi}</Text>
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
              <View style={styles.rreshtiEmrit}>
                <Text style={styles.emri} numberOfLines={1}>
                  {lokali.emri}
                </Text>
                <Ikona emri={ikonat.djathtas} madhesia={14} ngjyra={ngjyrat.tekstiZbehte} />
              </View>
              <Text style={styles.adresa} numberOfLines={1}>
                {lokali.adresa}, {lokali.qyteti}
              </Text>
              <View style={styles.detajet}>
                {statusi ? (
                  <>
                    <View style={[styles.pika, { backgroundColor: ngjyraEStatusit }]} />
                    <Text style={[styles.meta, { color: ngjyraEStatusit }]}>{statusi}</Text>
                    <Text style={styles.meta}>·</Text>
                  </>
                ) : null}
                <Text style={styles.meta} numberOfLines={1}>
                  {detajet.join(" · ")}
                </Text>
              </View>
              <View style={styles.fundi}>
                <Ikona
                  emri={lokali.rezervim_online ? ikonat.kalendar : lokali.telefoni ? ikonat.telefoni : ikonat.harta}
                  madhesia={13}
                  ngjyra={ngjyrat.bronzi}
                />
                <Text style={styles.rezervimi}>{rezervimi}</Text>
              </View>
            </View>
            </Animated.View>
          </Pressable>
        </Link.Trigger>
        <Link.Preview />
        <Link.Menu>
          {lokali.rezervim_online ? (
            <Link.MenuAction
              title={t("profiliLokalit.rezervo")}
              icon="calendar.badge.plus"
              onPress={() => router.push({ pathname: "/rezervo/[lokaliId]", params: { lokaliId: lokali.id } })}
            />
          ) : null}
          {lokali.telefoni ? <Link.MenuAction title={t("profiliLokalit.thirr")} icon="phone" onPress={thirr} /> : null}
          <Link.MenuAction title={t("profiliLokalit.udhezimet")} icon="map" onPress={udhezimet} />
          <Link.MenuAction title={t("profiliLokalit.ndaj")} icon="square.and.arrow.up" onPress={() => void ndaj()} />
        </Link.Menu>
      </Link>
    </Animated.View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    karta: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderCurve: "continuous",
      overflow: "hidden",
    },
    kopertina: {
      height: 150,
    },
    vleresimi: {
      position: "absolute",
      left: hapesira.md,
      bottom: hapesira.md,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: ngjyrat.xham,
      borderRadius: rrezja.plote,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    vleresimiTeksti: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 13,
    },
    vleresimiNumri: {
      ...shkronjat.etikete,
      color: ngjyrat.tekstiDyte,
      fontSize: 12,
    },
    promoEtiketa: {
      position: "absolute",
      top: hapesira.md,
      right: hapesira.md,
      backgroundColor: ngjyrat.theksi,
      borderRadius: rrezja.plote,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    promoEtiketaTeksti: {
      ...shkronjat.etiketeBold,
      color: "#FFFFFF",
      fontSize: 12,
    },
    trupi: {
      paddingHorizontal: hapesira.lg,
      paddingTop: hapesira.md,
      paddingBottom: hapesira.lg,
      gap: 3,
    },
    rreshtiEmrit: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
    },
    emri: {
      ...shkronjat.titullBold,
      flex: 1,
      color: ngjyrat.teksti,
      fontSize: 19,
      letterSpacing: -0.3,
    },
    adresa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
    },
    detajet: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
    },
    pika: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    meta: {
      flexShrink: 1,
      ...shkronjat.etikete,
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    fundi: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: hapesira.sm,
      paddingTop: hapesira.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: ngjyrat.kufiri,
    },
    rezervimi: {
      ...shkronjat.etikete,
      color: ngjyrat.bronzi,
      fontSize: 13,
    },
    kompakte: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      padding: hapesira.md,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.lg,
      borderCurve: "continuous",
    },
    kopertinaKompakte: {
      width: 56,
      height: 56,
      borderRadius: rrezja.sm + 4,
      borderCurve: "continuous",
    },
    shtypur: {
      opacity: 0.85,
    },
    teksti: {
      flex: 1,
      gap: 3,
    },
    emriKompakt: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 17,
    },
    promo: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.theksi,
      fontSize: 12,
    },
  });
