import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLokaliIm } from "../../api/lokalet";
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
import Ikona, { ikonat, type EmriIkones } from "../../components/Ikona";
import { GabimiIFormes } from "../../components/KornizaAuth";
import { useStilet, useTema } from "../../context/TemaContext";
import { dataISO, formatoDaten } from "../../lib/datat";
import { formatoCmimin, formatoKohezgjatjen } from "../../lib/formatimi";
import type { StatusiTerminit, TerminiILokalit } from "../../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

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

  if (!termini) {
    return (
      <View style={[styles.container, styles.qendra]}>
        {terminet.isPending || lokaliIm.isPending ? (
          <ActivityIndicator color={ngjyrat.ari} />
        ) : (
          <>
            <View style={styles.boshIkona}>
              <Ikona emri={ikonat.anulo} madhesia={28} ngjyra={ngjyrat.tekstiDyte} />
            </View>
            <Text style={styles.boshTitulli}>{t("termini.nukUGjet")}</Text>
            <Text style={styles.boshTeksti}>{t("termini.nukUGjetTeksti")}</Text>
            <Butoni titulli={t("termini.kthehu")} ikona={ikonat.kthe} onPress={kthehu} />
          </>
        )}
      </View>
    );
  }

  const { statusi } = termini;
  const ndryshoNe = (s: StatusiTerminit) => ndrysho.mutate({ terminiId: termini.id, statusi: s });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.permbajtja, { paddingBottom: insets.bottom + hapesira.xxl }]}>
        <View style={styles.hero}>
          <Avatar emri={termini.klienti_emri} madhesia={76} />
          <Text style={styles.emri}>{termini.klienti_emri}</Text>
          <BadgeStatusi statusi={statusi} />
        </View>

        {ndrysho.isError && <GabimiIFormes mesazhi={mesazhiIGabimitTeRezervimit(ndrysho.error, t)} />}

        <View style={styles.rrjeta}>
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
        </View>

        {termini.shenime ? (
          <View style={styles.shenime}>
            <View style={styles.shenimeKoka}>
              <Ikona emri={ikonat.shenime} madhesia={16} ngjyra={ngjyrat.ari} />
              <Text style={styles.shenimeTitulli}>{t("termini.shenime")}</Text>
            </View>
            <Text style={styles.shenimeTeksti}>{termini.shenime}</Text>
          </View>
        ) : null}

        {statusi !== "anuluar" && statusi !== "nuk_erdhi" && <Pagesa termini={termini} />}

        <Text style={styles.seksioni}>{t("termini.veprimet")}</Text>
        <View style={styles.veprimet}>
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
        </View>
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
      alignItems: "center",
      gap: hapesira.md,
      paddingVertical: hapesira.xl,
    },
    emri: {
      color: ngjyrat.teksti,
      fontSize: 26,
      fontWeight: "800",
      letterSpacing: -0.3,
      textAlign: "center",
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
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginTop: hapesira.sm,
      marginBottom: hapesira.md,
    },
    veprimet: {
      gap: hapesira.sm,
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
      color: ngjyrat.teksti,
      fontSize: 20,
      fontWeight: "800",
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
      color: ngjyrat.teksti,
      fontSize: 18,
      fontWeight: "700",
    },
    boshTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      textAlign: "center",
      marginBottom: hapesira.md,
    },
  });
