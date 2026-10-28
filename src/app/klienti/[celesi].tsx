import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBesnikeria } from "../../api/besnikeria";
import { useHistorikuIKlientit, useKlientet, useRuajKlientin } from "../../api/biznesi";
import { useLokaliIm } from "../../api/lokalet";
import Avatar from "../../components/Avatar";
import BadgeStatusi from "../../components/BadgeStatusi";
import Butoni from "../../components/Butoni";
import FushaTekstit from "../../components/FushaTekstit";
import Ikona, { ikonat } from "../../components/Ikona";
import KartaEBesnikerise from "../../components/KartaEBesnikerise";
import { GabimiIFormes } from "../../components/KornizaAuth";
import { useStilet, useTema } from "../../context/TemaContext";
import { formatoDaten } from "../../lib/datat";
import { formatoCmimin } from "../../lib/formatimi";
import type { KlientiILokalit } from "../../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

export default function DetajetEKlientit() {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const { celesi } = useLocalSearchParams<{ celesi: string }>();
  const lokaliIm = useLokaliIm();
  const lokaliId = lokaliIm.data?.lokali.id;
  const klientet = useKlientet(lokaliId);
  const klienti = klientet.data?.find((x) => x.celesi === celesi);

  if (!lokaliId || !klienti) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }
  return <Detajet lokaliId={lokaliId} klienti={klienti} />;
}

function Detajet({ lokaliId, klienti }: { lokaliId: string; klienti: KlientiILokalit }) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const historiku = useHistorikuIKlientit(lokaliId, klienti.celesi);
  const besnikeria = useBesnikeria(lokaliId, klienti.celesi);
  const ruaj = useRuajKlientin(lokaliId);
  const [shenime, setShenime] = useState(klienti.shenime ?? "");

  const shenimetNdryshuan = shenime.trim() !== (klienti.shenime ?? "");

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: klienti.emri }} />
      <ScrollView contentContainerStyle={[styles.permbajtja, { paddingBottom: insets.bottom + hapesira.xxl }]}>
        <View style={styles.hero}>
          <Avatar emri={klienti.emri} madhesia={76} />
          <Text style={styles.emri}>{klienti.emri}</Text>
          {klienti.telefoni ? <Text style={styles.telefoni}>{klienti.telefoni}</Text> : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => ruaj.mutate({ celesi: klienti.celesi, shenime: klienti.shenime, vip: !klienti.vip })}
            style={[styles.vip, klienti.vip && styles.vipAktiv]}
          >
            <Ikona emri={ikonat.yll} madhesia={14} ngjyra={klienti.vip ? ngjyrat.mbiAri : ngjyrat.ari} />
            <Text style={[styles.vipTeksti, klienti.vip && styles.vipTekstiAktiv]}>
              {klienti.vip ? t("klientet.hiqVip") : t("klientet.shenoVip")}
            </Text>
          </Pressable>
        </View>

        <View style={styles.statistikat}>
          <Statistika vlera={String(klienti.vizita)} etiketa={t("klientet.vizitat")} />
          <Statistika vlera={formatoCmimin(klienti.shpenzuar_centa)} etiketa={t("klientet.shpenzuar")} />
          <Statistika vlera={String(klienti.nuk_erdhi)} etiketa={t("klientet.nukErdhi")} />
        </View>

        {besnikeria.data ? (
          <View style={styles.besnikeria}>
            <KartaEBesnikerise besnikeria={besnikeria.data} />
          </View>
        ) : null}

        <View style={styles.veprimet}>
          {klienti.telefoni && (
            <Butoni
              titulli={t("klientet.telefono")}
              varianti="dytesor"
              ikona={ikonat.telefoni}
              onPress={() => Linking.openURL(`tel:${klienti.telefoni?.replace(/\s/g, "")}`)}
              style={styles.veprimi}
            />
          )}
          <Butoni
            titulli={t("klientet.terminIRi")}
            ikona={ikonat.shto}
            onPress={() =>
              router.push({
                pathname: "/shto",
                params: { emri: klienti.emri, telefoni: klienti.telefoni ?? "" },
              })
            }
            style={styles.veprimi}
          />
        </View>

        <GabimiIFormes mesazhi={ruaj.isError ? t("pergjithshme.gabimPapritur") : null} />
        <FushaTekstit
          etiketa={t("klientet.shenime")}
          value={shenime}
          onChangeText={setShenime}
          placeholder={t("klientet.shenimeShembull")}
          shumeRreshta
          maxLength={1000}
        />
        {shenimetNdryshuan && (
          <Butoni
            titulli={t("klientet.ruaj")}
            varianti="dytesor"
            ikona={ikonat.konfirmo}
            ngarkohet={ruaj.isPending}
            onPress={() => ruaj.mutate({ celesi: klienti.celesi, shenime: shenime.trim() || null, vip: klienti.vip })}
          />
        )}

        <Text style={styles.seksioni}>{t("klientet.historiku")}</Text>
        {historiku.isPending ? (
          <ActivityIndicator color={ngjyrat.ari} />
        ) : (historiku.data ?? []).length === 0 ? (
          <Text style={styles.paHistori}>{t("klientet.paHistori")}</Text>
        ) : (
          <View style={styles.grupi}>
            {historiku.data!.map((v, i) => (
              <View key={v.id} style={[styles.vizitaRreshti, i > 0 && styles.meKufi]}>
                <View style={styles.vizitaTeksti}>
                  <Text style={styles.vizitaData}>
                    {formatoDaten(v.data_lokale, t)} · {v.ora_lokale}
                  </Text>
                  <Text style={styles.vizitaSherbimi} numberOfLines={1}>
                    {v.sherbimi_emri} · {v.berberi_emri.split(" ")[0]}
                  </Text>
                </View>
                <View style={styles.vizitaDjathtas}>
                  <BadgeStatusi statusi={v.statusi} />
                  <Text style={styles.vizitaCmimi}>{formatoCmimin(v.cmimi_centa)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Statistika({ vlera, etiketa }: { vlera: string; etiketa: string }) {
  const styles = useStilet(krijoStilet);
  return (
    <View style={styles.statistika}>
      <Text style={styles.statistikaVlera}>{vlera}</Text>
      <Text style={styles.statistikaEtiketa}>{etiketa}</Text>
    </View>
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
    },
    hero: {
      alignItems: "center",
      gap: 6,
      marginBottom: hapesira.xl,
    },
    emri: {
      color: ngjyrat.teksti,
      fontSize: 24,
      fontWeight: "800",
      marginTop: hapesira.sm,
      textAlign: "center",
    },
    telefoni: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
    },
    vip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      height: 32,
      borderRadius: rrezja.plote,
      borderWidth: 1,
      borderColor: ngjyrat.ari,
      marginTop: hapesira.sm,
    },
    vipAktiv: {
      backgroundColor: ngjyrat.ari,
    },
    vipTeksti: {
      color: ngjyrat.ari,
      fontSize: 13,
      fontWeight: "800",
    },
    vipTekstiAktiv: {
      color: ngjyrat.mbiAri,
    },
    statistikat: {
      flexDirection: "row",
      gap: hapesira.sm,
      marginBottom: hapesira.lg,
    },
    besnikeria: {
      marginBottom: hapesira.lg,
    },
    statistika: {
      flex: 1,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.md,
      alignItems: "center",
      gap: 2,
    },
    statistikaVlera: {
      color: ngjyrat.teksti,
      fontSize: 20,
      fontWeight: "800",
    },
    statistikaEtiketa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 12,
      fontWeight: "600",
    },
    veprimet: {
      flexDirection: "row",
      gap: hapesira.sm,
      marginBottom: hapesira.xl,
    },
    veprimi: {
      flex: 1,
    },
    seksioni: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginTop: hapesira.xl,
      marginBottom: hapesira.md,
    },
    paHistori: {
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
    vizitaRreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
      padding: hapesira.md,
    },
    vizitaTeksti: {
      flex: 1,
      gap: 3,
    },
    vizitaData: {
      color: ngjyrat.teksti,
      fontSize: 14,
      fontWeight: "700",
    },
    vizitaSherbimi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    vizitaDjathtas: {
      alignItems: "flex-end",
      gap: 4,
    },
    vizitaCmimi: {
      color: ngjyrat.tekstiDyte,
      fontSize: 12,
      fontWeight: "700",
    },
  });
