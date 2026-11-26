import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, LinearTransition, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLokaliIm } from "../../api/lokalet";
import { useFotoEStilit } from "../../api/stili";
import {
  mesazhiIGabimitTeRezervimit,
  useNdryshoStatusin,
  usePerdorShperblimin,
  useRegjistroPagesen,
  useTerminetELokalit,
} from "../../api/terminet";
import Avatar from "../../components/Avatar";
import BadgeStatusi from "../../components/BadgeStatusi";
import Butoni from "../../components/Butoni";
import DialogKonfirmimi from "../../components/DialogKonfirmimi";
import EkraniINgarkimit from "../../components/EkraniINgarkimit";
import GaleriaEPlote from "../../components/GaleriaEPlote";
import Ikona, { ikonat, type EmriIkones } from "../../components/Ikona";
import { GabimiIFormes } from "../../components/KornizaAuth";
import { useStilet, useTema } from "../../context/TemaContext";
import { dataISO, formatoDaten } from "../../lib/datat";
import { formatoCmimin, formatoKohezgjatjen } from "../../lib/formatimi";
import type { StatusiTerminit, TerminiILokalit } from "../../lib/tipet";
import { FOTO_E_LOKALIT } from "../../lib/studio";
import { hapesira, rrezja, shkronjat, statusetMetaErrta, type Ngjyrat } from "../../theme";

function kthehu() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

export default function DetajetTerminit() {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const { id, data = dataISO(new Date()) } = useLocalSearchParams<{ id: string; data?: string }>();
  const lokaliIm = useLokaliIm();
  const terminet = useTerminetELokalit(lokaliIm.data?.lokali.id, data);
  const ndrysho = useNdryshoStatusin();
  const [dialogu, setDialogu] = useState(false);

  const termini = terminet.data?.find((x) => x.id === id);

  if (!termini && !terminet.isSuccess) {
    return <EkraniINgarkimit pyetjet={[lokaliIm, terminet]} mungon={lokaliIm.isSuccess && !lokaliIm.data} />;
  }

  if (!termini) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <View style={styles.boshIkona}>
          <Ikona emri={ikonat.anulo} madhesia={28} ngjyra={ngjyrat.tekstiDyte} />
        </View>
        <Text style={styles.boshTitulli}>{t("termini.nukUGjet")}</Text>
        <Text style={styles.boshTeksti}>{t("termini.nukUGjetTeksti")}</Text>
        <Butoni titulli={t("termini.kthehu")} ikona={ikonat.kthe} onPress={kthehu} />
      </View>
    );
  }

  const { statusi } = termini;
  const ndryshoNe = (s: StatusiTerminit) => ndrysho.mutate({ terminiId: termini.id, statusi: s });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.permbajtja, { paddingBottom: insets.bottom + hapesira.xxl }]}>
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.hero}>
          <Image source={FOTO_E_LOKALIT} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.9)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroKoka}>
            <View>
              <Text style={styles.heroOra}>{termini.ora_lokale}</Text>
              <Text style={styles.heroData}>
                {formatoDaten(data, t)} · {formatoKohezgjatjen(termini.kohezgjatja_min)}
              </Text>
            </View>
            {/* `key` e rinis animacionin sa herë ndryshon statusi. */}
            <Animated.View key={statusi} entering={ZoomIn.springify().damping(12)}>
              <BadgeStatusi statusi={statusi} />
            </Animated.View>
          </View>
          <View style={styles.heroKlienti}>
            <Avatar emri={termini.klienti_emri} madhesia={48} />
            <View style={styles.heroKlientiTeksti}>
              <Text style={styles.emri} numberOfLines={1}>
                {termini.klienti_emri}
              </Text>
              <Text style={styles.heroSherbimi} numberOfLines={1}>
                {termini.sherbimi_emri} · {termini.berberi_emri.split(" ")[0]}
              </Text>
            </View>
          </View>
          <Rrugetimi statusi={statusi} />
          {termini.arriti_me && (statusi === "ne_pritje" || statusi === "konfirmuar") ? (
            <View style={styles.arriti}>
              <Ikona emri={ikonat.skano} madhesia={14} ngjyra="#0A0A0A" />
              <Text style={styles.arritiTeksti}>
                {t("qr.arriti")} ·{" "}
                {new Date(termini.arriti_me).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          ) : null}
        </Animated.View>

        {ndrysho.isError && <GabimiIFormes mesazhi={mesazhiIGabimitTeRezervimit(ndrysho.error, t)} />}

        <Animated.View entering={FadeInDown.delay(120).duration(420)} style={styles.rrjeta}>
          <Info ikona={ikonat.kalendar} etiketa={formatoDaten(data, t)} vlera={termini.ora_lokale} />
          <Info
            ikona={ikonat.kohezgjatja}
            etiketa={t("termini.kohezgjatja")}
            vlera={formatoKohezgjatjen(termini.kohezgjatja_min)}
          />
          <Info ikona={ikonat.gershere} etiketa={t("termini.sherbimi")} vlera={termini.sherbimi_emri} gjere />
          <Info ikona={ikonat.personi} etiketa={t("termini.berberi")} vlera={termini.berberi_emri} />
          <Info
            ikona={ikonat.cmimi}
            etiketa={t("termini.cmimi")}
            vlera={termini.shperblim ? t("pagesa.falas") : formatoCmimin(termini.cmimi_centa)}
          />
          <Info
            ikona={ikonat.telefoni}
            etiketa={t("termini.telefoni")}
            vlera={termini.klienti_telefoni ?? t("termini.paNumer")}
            gjere
          />
        </Animated.View>

        {termini.foto_stili ? <FotoEStilit shtegu={termini.foto_stili} /> : null}

        {termini.shenime ? (
          <View style={styles.shenime}>
            <View style={styles.shenimeKoka}>
              <Ikona emri={ikonat.shenime} madhesia={16} ngjyra={ngjyrat.ari} />
              <Text style={styles.shenimeTitulli}>{t("termini.shenime")}</Text>
            </View>
            <Text style={styles.shenimeTeksti}>{termini.shenime}</Text>
          </View>
        ) : null}

        {statusi !== "anuluar" && statusi !== "nuk_erdhi" && (
          <Animated.View entering={FadeInDown.delay(200).duration(420)}>
            <Pagesa termini={termini} />
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(260).duration(420)}>
        <Text style={styles.seksioni}>{t("termini.veprimet")}</Text>
        <Animated.View layout={LinearTransition.springify().damping(18)} style={styles.veprimet}>
          {statusi === "ne_pritje" && (
            <Butoni
              titulli={t("termini.konfirmo")}
              ikona={ikonat.konfirmo}
              ngarkohet={ndrysho.isPending}
              onPress={() => ndryshoNe("konfirmuar")}
            />
          )}

          {statusi === "konfirmuar" && (
            <>
              <Butoni
                titulli={t("termini.perfundo")}
                ikona={ikonat.perfundo}
                ngarkohet={ndrysho.isPending}
                onPress={() => ndryshoNe("perfunduar")}
              />
              <Butoni
                titulli={t("termini.nukErdhi")}
                varianti="dytesor"
                ikona={ikonat.personi}
                onPress={() => ndryshoNe("nuk_erdhi")}
              />
            </>
          )}

          {/* Një termin i paguar rikthehet vetëm pasi të zhbëhet pagesa. */}
          {((statusi === "perfunduar" && !termini.paguar_me) || statusi === "nuk_erdhi") && (
            <Butoni
              titulli={t("termini.rikthe")}
              varianti="dytesor"
              ikona={ikonat.kthe}
              onPress={() => ndryshoNe("konfirmuar")}
            />
          )}

          {(statusi === "ne_pritje" || statusi === "konfirmuar") && (
            <Butoni
              titulli={t("zhvendos.butoni")}
              varianti="dytesor"
              ikona={ikonat.zhvendos}
              onPress={() => router.push({ pathname: "/termini/zhvendos", params: { id: termini.id, data } })}
            />
          )}

          {termini.klienti_telefoni && (
            <Butoni
              titulli={t("termini.telefono")}
              varianti="dytesor"
              ikona={ikonat.telefoni}
              onPress={() => Linking.openURL(`tel:${termini.klienti_telefoni?.replace(/\s/g, "")}`)}
            />
          )}

          {(statusi === "ne_pritje" || statusi === "konfirmuar") && (
            <Butoni
              titulli={t("termini.anulo")}
              varianti="rrezik"
              ikona={ikonat.anulo}
              onPress={() => setDialogu(true)}
            />
          )}
        </Animated.View>
        </Animated.View>
      </ScrollView>

      <DialogKonfirmimi
        iDukshem={dialogu}
        titulli={t("termini.anuloTitulli")}
        mesazhi={t("termini.anuloMesazhi", { klienti: termini.klienti_emri, ora: termini.ora_lokale })}
        tekstiKonfirmimit={t("termini.anuloKonfirmo")}
        rrezik
        onAnulo={() => setDialogu(false)}
        onKonfirmo={() => {
          setDialogu(false);
          ndryshoNe("anuluar");
        }}
      />
    </View>
  );
}

// Fotoja që klienti bashkëngjiti gjatë rezervimit (nga bucket-i privat, me lidhje të përkohshme).
const HAPAT: StatusiTerminit[] = ["ne_pritje", "konfirmuar", "perfunduar"];

// Rrugëtimi i terminit: Në pritje → Konfirmuar → Përfunduar. Vijat mbushen me sustë kur ndryshon
// statusi; një termin i anuluar ose pa ardhje e mbush gjithë vijën me të kuqe.
function Rrugetimi({ statusi }: { statusi: StatusiTerminit }) {
  const { t } = useTranslation();
  // Karta është gjithmonë e errët (mbi foto), ndaj ngjyrat e statuseve janë ato të errësirës.
  const statusetMeta = statusetMetaErrta;
  const styles = useStilet(krijoStilet);
  const iMbyllur = statusi === "anuluar" || statusi === "nuk_erdhi";
  const indeksi = iMbyllur ? HAPAT.length - 1 : HAPAT.indexOf(statusi);

  return (
    <View style={styles.rrugetimi}>
      {HAPAT.map((h, i) => (
        <View key={h} style={styles.rrugetimiHapi}>
          <View style={styles.rrugetimiVija}>
            <Animated.View
              layout={LinearTransition.springify().damping(18)}
              style={[
                styles.rrugetimiMbushja,
                {
                  width: i <= indeksi ? "100%" : "0%",
                  backgroundColor: iMbyllur ? statusetMeta[statusi].ngjyra : statusetMeta[h].ngjyra,
                },
              ]}
            />
          </View>
          <Text style={[styles.rrugetimiTeksti, i <= indeksi && styles.rrugetimiTekstiAktiv]} numberOfLines={1}>
            {iMbyllur && i === HAPAT.length - 1 ? t(`statuset.${statusi}`) : t(`statuset.${h}`)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function FotoEStilit({ shtegu }: { shtegu: string }) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const foto = useFotoEStilit(shtegu);
  const [eMadhe, setEMadhe] = useState(false);

  return (
    <View style={styles.shenime}>
      <View style={styles.shenimeKoka}>
        <Ikona emri={ikonat.kamera} madhesia={16} ngjyra={ngjyrat.ari} />
        <Text style={styles.shenimeTitulli}>{t("stili.fotoEStilit")}</Text>
      </View>
      {foto.data ? (
        <Pressable accessibilityRole="imagebutton" accessibilityLabel={t("stili.fotoEStilit")} onPress={() => setEMadhe(true)}>
          <Image source={{ uri: foto.data }} style={styles.fotoEStilit} contentFit="cover" transition={200} />
        </Pressable>
      ) : (
        <View style={[styles.fotoEStilit, styles.qendra]}>
          <ActivityIndicator color={ngjyrat.ari} />
        </View>
      )}
      {foto.data ? (
        <GaleriaEPlote
          fotot={[{ id: shtegu, lokali_id: "", berberi_id: null, foto_url: foto.data, pershkrimi: null, krijuar_me: "" }]}
          indeksi={eMadhe ? 0 : null}
          onMbyll={() => setEMadhe(false)}
        />
      ) : null}
    </View>
  );
}

// Pagesa në lokal: përmbledhja e çmimit, shënimi kesh/kartë dhe shpërblimi i besnikërisë.
function Pagesa({ termini }: { termini: TerminiILokalit }) {
  const { t } = useTranslation();
  const { ngjyrat, statusetMeta } = useTema();
  const styles = useStilet(krijoStilet);
  const pagesa = useRegjistroPagesen();
  const shperblimi = usePerdorShperblimin();
  const iPaguar = termini.paguar_me !== null;
  const gabimi = pagesa.error ?? shperblimi.error;

  return (
    <>
      <Text style={styles.seksioni}>{t("pagesa.titulli")}</Text>
      <View style={styles.pagesa}>
        {termini.zbritja_centa > 0 && !termini.shperblim && (
          <View style={styles.pagesaRreshti}>
            <Ikona emri={ikonat.etiketa} madhesia={15} ngjyra={ngjyrat.ari} />
            <Text style={styles.pagesaTeksti}>
              {t("pagesa.zbritja", {
                shuma: formatoCmimin(termini.zbritja_centa),
                promocioni: termini.promocioni_titulli ?? t("promocionet.titulli"),
              })}
            </Text>
            <Text style={styles.cmimiIVjeter}>{formatoCmimin(termini.cmimi_baze_centa)}</Text>
          </View>
        )}
        {termini.shperblim && (
          <View style={styles.pagesaRreshti}>
            <Ikona emri={ikonat.dhurate} madhesia={15} ngjyra={ngjyrat.ari} />
            <Text style={styles.pagesaTeksti}>{t("pagesa.shperblimi")}</Text>
          </View>
        )}

        <View style={styles.pagesaStatusi}>
          <Ikona
            emri={iPaguar ? ikonat.perfundo : ikonat.ora}
            madhesia={18}
            ngjyra={iPaguar ? statusetMeta.perfunduar.ngjyra : ngjyrat.tekstiZbehte}
          />
          <Text style={[styles.pagesaStatusiTeksti, iPaguar && { color: statusetMeta.perfunduar.ngjyra }]}>
            {iPaguar
              ? t("pagesa.ePaguar", { menyra: t(termini.menyra_e_pageses === "karte" ? "pagesa.karte" : "pagesa.kesh") })
              : t("pagesa.paPaguar")}
          </Text>
          <Text style={styles.pagesaTotali}>
            {termini.shperblim ? t("pagesa.falas") : formatoCmimin(termini.cmimi_centa)}
          </Text>
        </View>

        {gabimi && <GabimiIFormes mesazhi={mesazhiIGabimitTeRezervimit(gabimi, t)} />}

        {iPaguar ? (
          <Butoni
            titulli={t("pagesa.zhbej")}
            varianti="dytesor"
            ikona={ikonat.kthe}
            ngarkohet={pagesa.isPending}
            onPress={() => pagesa.mutate({ terminiId: termini.id, menyra: null })}
          />
        ) : (
          <>
            <Text style={styles.pagesaNdihma}>{t("pagesa.paguanTeksti")}</Text>
            <View style={styles.pagesaButonat}>
              <View style={styles.pagesaButoni}>
                <Butoni
                  titulli={t("pagesa.kesh")}
                  ikona={ikonat.kesh}
                  ngarkohet={pagesa.isPending && pagesa.variables?.menyra === "kesh"}
                  joAktiv={pagesa.isPending}
                  onPress={() => pagesa.mutate({ terminiId: termini.id, menyra: "kesh" })}
                />
              </View>
              <View style={styles.pagesaButoni}>
                <Butoni
                  titulli={t("pagesa.karte")}
                  varianti="dytesor"
                  ikona={ikonat.karte}
                  ngarkohet={pagesa.isPending && pagesa.variables?.menyra === "karte"}
                  joAktiv={pagesa.isPending}
                  onPress={() => pagesa.mutate({ terminiId: termini.id, menyra: "karte" })}
                />
              </View>
            </View>

            {termini.shperblim ? (
              <Butoni
                titulli={t("besnikeria.hiq")}
                varianti="dytesor"
                ikona={ikonat.dhurate}
                ngarkohet={shperblimi.isPending}
                onPress={() => shperblimi.mutate({ terminiId: termini.id, perdor: false })}
              />
            ) : (termini.shperblime_te_disponueshme ?? 0) > 0 ? (
              <>
                <Text style={styles.pagesaNdihma}>
                  {t("besnikeria.gati", { numri: termini.shperblime_te_disponueshme })}
                </Text>
                <Butoni
                  titulli={t("besnikeria.perdor")}
                  varianti="dytesor"
                  ikona={ikonat.dhurate}
                  ngarkohet={shperblimi.isPending}
                  onPress={() => shperblimi.mutate({ terminiId: termini.id, perdor: true })}
                />
              </>
            ) : null}
          </>
        )}
      </View>
    </>
  );
}

type InfoProps = {
  ikona: EmriIkones;
  etiketa: string;
  vlera: string;
  gjere?: boolean;
};

function Info({ ikona, etiketa, vlera, gjere = false }: InfoProps) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  return (
    <View style={[styles.info, gjere && styles.infoGjere]}>
      <View style={styles.infoIkona}>
        <Ikona emri={ikona} madhesia={16} ngjyra={ngjyrat.ari} />
      </View>
      <Text style={styles.infoEtiketa}>{etiketa}</Text>
      <Text style={styles.infoVlera} numberOfLines={1}>
        {vlera}
      </Text>
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
      padding: hapesira.xxl,
      gap: hapesira.sm,
    },
    permbajtja: {
      padding: hapesira.xl,
    },
    hero: {
      borderRadius: rrezja.lg,
      borderCurve: "continuous",
      overflow: "hidden",
      padding: hapesira.lg,
      gap: hapesira.lg,
      marginBottom: hapesira.lg,
      backgroundColor: "#0A0A0A",
    },
    heroKoka: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      paddingTop: hapesira.xl,
    },
    heroOra: {
      ...shkronjat.titull,
      color: "#FFFFFF",
      fontSize: 52,
      lineHeight: 56,
      letterSpacing: -1.8,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
    },
    heroData: {
      ...shkronjat.etiketeBold,
      color: "rgba(255,255,255,0.8)",
      fontSize: 15,
    },
    heroKlienti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.md,
    },
    heroKlientiTeksti: {
      flex: 1,
    },
    heroSherbimi: {
      color: "rgba(255,255,255,0.75)",
      fontSize: 14,
      marginTop: 2,
    },
    emri: {
      ...shkronjat.titull,
      color: "#FFFFFF",
      fontSize: 22,
      letterSpacing: -0.3,
    },
    rrugetimi: {
      flexDirection: "row",
      gap: hapesira.sm,
    },
    rrugetimiHapi: {
      flex: 1,
      gap: 6,
    },
    rrugetimiVija: {
      height: 4,
      borderRadius: 2,
      backgroundColor: "rgba(255,255,255,0.22)",
      overflow: "hidden",
    },
    rrugetimiMbushja: {
      height: 4,
      borderRadius: 2,
    },
    rrugetimiTeksti: {
      ...shkronjat.etiketeBold,
      color: "rgba(255,255,255,0.5)",
      fontSize: 12,
    },
    rrugetimiTekstiAktiv: {
      color: "#FFFFFF",
    },
    rrjeta: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: hapesira.sm,
      marginBottom: hapesira.lg,
    },
    info: {
      flexGrow: 1,
      flexBasis: "45%",
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.md,
      gap: 4,
    },
    infoGjere: {
      flexBasis: "100%",
    },
    infoIkona: {
      width: 30,
      height: 30,
      borderRadius: 9,
      backgroundColor: ngjyrat.ariIErret,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    infoEtiketa: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 12,
      fontWeight: "600",
    },
    infoVlera: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "700",
    },
    shenime: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      marginBottom: hapesira.lg,
      gap: hapesira.sm,
    },
    shenimeKoka: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
    },
    shenimeTitulli: {
      color: ngjyrat.teksti,
      fontSize: 14,
      fontWeight: "700",
    },
    shenimeTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
      lineHeight: 22,
    },
    seksioni: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginTop: hapesira.sm,
      marginBottom: hapesira.md,
    },
    veprimet: {
      gap: hapesira.sm,
    },
    arriti: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 6,
      paddingHorizontal: 12,
      height: 30,
      borderRadius: rrezja.plote,
      backgroundColor: "#F4F1EA",
    },
    arritiTeksti: {
      color: "#0A0A0A",
      fontSize: 13,
      fontWeight: "800",
    },
    fotoEStilit: {
      width: "100%",
      aspectRatio: 3 / 4,
      maxHeight: 360,
      borderRadius: rrezja.md,
      backgroundColor: ngjyrat.siperfaqja2,
    },
    pagesa: {
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      padding: hapesira.lg,
      gap: hapesira.md,
      marginBottom: hapesira.lg,
    },
    pagesaRreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
    },
    pagesaTeksti: {
      flex: 1,
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
    },
    cmimiIVjeter: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 14,
      textDecorationLine: "line-through",
    },
    pagesaStatusi: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
    },
    pagesaStatusiTeksti: {
      flex: 1,
      color: ngjyrat.teksti,
      fontSize: 15,
      fontWeight: "700",
    },
    pagesaTotali: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 20,
    },
    pagesaNdihma: {
      color: ngjyrat.tekstiZbehte,
      fontSize: 13,
      lineHeight: 18,
    },
    pagesaButonat: {
      flexDirection: "row",
      gap: hapesira.sm,
    },
    pagesaButoni: {
      flex: 1,
    },
    boshIkona: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: ngjyrat.siperfaqja,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hapesira.sm,
    },
    boshTitulli: {
      ...shkronjat.titullBold,
      color: ngjyrat.teksti,
      fontSize: 18,
    },
    boshTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      textAlign: "center",
      marginBottom: hapesira.md,
    },
  });
