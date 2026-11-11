import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import MapView, { Marker, Polyline, type Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLokali, useLokaletPrane } from "../../api/lokalet";
import { useRruga, type MenyraEUdhetimit } from "../../api/udhezimet";
import Ikona, { ikonat } from "../../components/Ikona";
import Xham from "../../components/Xham";
import { useStilet, useTema } from "../../context/TemaContext";
import { useVendndodhjaIme } from "../../hooks/useVendndodhjaIme";
import { useVonesa } from "../../hooks/useVonesa";
import { formatoDistancen, formatoKohezgjatjen } from "../../lib/formatimi";
import { prekja } from "../../lib/prekja";
import type { Koordinata } from "../../lib/tipet";
import { hapesira, rrezja, shkronjat, type Ngjyrat } from "../../theme";

// Zmadhimi fillestar: lagjja rreth klientit, aq afër sa emrat e lokaleve të lexohen.
const ZMADHIMI = { latitudeDelta: 0.03, longitudeDelta: 0.03 };
// Emrat shfaqen pranë gjilpërave vetëm kur harta është afër; më larg do të mbuloheshin njëri-tjetrin.
const KUFIRI_I_EMRAVE = 0.05;
// Kërkimi me emër mbulon gjithë Kosovën, jo vetëm zonën në ekran.
const RREZJA_E_KERKIMIT_KM = 200;

// Rrezja e kërkimit sa gjysma e lartësisë së hartës (1° gjerësi ≈ 111 km).
function rrezjaERajonit(r: Region): number {
  return Math.min(Math.max((r.latitudeDelta * 111) / 2, 1), 100);
}

// Harta, si te Google Maps: çdo berber me gjilpërë dhe emër, kërkim sipër, fleta me detaje kur preket
// njëri dhe udhëzimet (rruga portokalli) pa dalë nga aplikacioni.
export default function Harta() {
  const { t } = useTranslation();
  const { ngjyrat, eshteErret } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const harta = useRef<MapView>(null);
  const { pika, kaLeje } = useVendndodhjaIme();
  // Butonat dhe atribuimi qëndrojnë mbi shiritin e tab-eve (Liquid Glass), që noton mbi hartë.
  const poshte = insets.bottom + 64;

  // Pa kërkim manual, kërkohet rreth vendndodhjes së përdoruesit.
  const [kerkimiManual, setKerkimiManual] = useState<{ qendra: Koordinata; rrezjaKm: number } | null>(null);
  const kerkimi = kerkimiManual ?? { qendra: pika, rrezjaKm: 10 };
  const [rajoniILevizur, setRajoniILevizur] = useState<Region | null>(null);
  const [zgjedhuri, setZgjedhuri] = useState<string | null>(null);
  const [meEmra, setMeEmra] = useState(true);

  // Kërkimi me emër dhe dy filtrat e shpejtë.
  const [teksti, setTeksti] = useState("");
  const tekstiIVonuar = useVonesa(teksti).trim();
  const [vetemHapur, setVetemHapur] = useState(false);
  const [vetemOnline, setVetemOnline] = useState(false);

  // Udhëzimet: "/harta?udhezime=<lokali>" vjen nga fleta, profili, kartat dhe terminet.
  const { udhezime } = useLocalSearchParams<{ udhezime?: string }>();
  const destinacioni = useLokali(udhezime).data ?? null;
  const [menyra, setMenyra] = useState<MenyraEUdhetimit>("makine");
  const deri = udhezime && destinacioni ? { lat: destinacioni.lat, lng: destinacioni.lng } : null;
  const rruga = useRruga(kaLeje ? pika : null, deri, menyra);

  // Sapo dihet vendndodhja, harta qendërzohet aty (pa udhëzime aktive).
  useEffect(() => {
    if (kaLeje === null || udhezime) return;
    harta.current?.animateToRegion({ latitude: pika.lat, longitude: pika.lng, ...ZMADHIMI }, 400);
  }, [kaLeje, pika, udhezime]);

  // Rruga e re: harta shfaq gjithë rrugën, nga klienti deri te berberi.
  useEffect(() => {
    if (!rruga.data) return;
    harta.current?.fitToCoordinates(rruga.data.koordinatat, {
      edgePadding: { top: insets.top + 190, right: 50, bottom: poshte + 60, left: 50 },
      animated: true,
    });
  }, [rruga.data, insets.top, poshte]);

  const lokalet = useLokaletPrane(
    {
      pika: kerkimi.qendra,
      rrezjaKm: tekstiIVonuar ? RREZJA_E_KERKIMIT_KM : kerkimi.rrezjaKm,
      kerkimi: tekstiIVonuar,
      vetemHapur,
      cmimiMax: null,
      renditja: "distanca",
      limit: 300,
      vetemOnline,
    },
    kaLeje !== null,
  );

  // Rezultatet e një kërkimi me emër mund të jenë në qytet tjetër: harta i shfaq të gjitha.
  const rezultatet = lokalet.data;
  const rezultatetEVjetra = lokalet.isPlaceholderData;
  const kerkimiIShfaqur = useRef("");
  useEffect(() => {
    if (!tekstiIVonuar) {
      kerkimiIShfaqur.current = "";
      return;
    }
    if (rezultatetEVjetra || !rezultatet || kerkimiIShfaqur.current === tekstiIVonuar) return;
    kerkimiIShfaqur.current = tekstiIVonuar;
    if (rezultatet.length === 0) return;
    if (rezultatet.length === 1) {
      const iVetmi = rezultatet[0];
      harta.current?.animateToRegion({ latitude: iVetmi.lat, longitude: iVetmi.lng, ...ZMADHIMI }, 400);
      return;
    }
    harta.current?.fitToCoordinates(
      rezultatet.slice(0, 40).map((l) => ({ latitude: l.lat, longitude: l.lng })),
      { edgePadding: { top: insets.top + 150, right: 50, bottom: poshte + 60, left: 50 }, animated: true },
    );
  }, [tekstiIVonuar, rezultatet, rezultatetEVjetra, insets.top, poshte]);

  function kerkoKetu() {
    if (!rajoniILevizur) return;
    setKerkimiManual({
      qendra: { lat: rajoniILevizur.latitude, lng: rajoniILevizur.longitude },
      rrezjaKm: rrezjaERajonit(rajoniILevizur),
    });
    setRajoniILevizur(null);
    setZgjedhuri(null);
  }

  function hapFleten(id: string) {
    prekja.lehte();
    Keyboard.dismiss();
    setZgjedhuri(id);
    router.push({ pathname: "/harta-lokali/[id]", params: { id } });
  }

  function mbyllRrugen() {
    prekja.lehte();
    router.setParams({ udhezime: undefined });
  }

  const ngaKatalogu = (lokalet.data ?? []).filter((l) => l.burimi !== "trimtime");
  const atribuimi = [
    ngaKatalogu.length > 0 || udhezime ? "© OpenStreetMap contributors" : null,
    ngaKatalogu.some((l) => l.burimi === "numrat") ? "Numrat.com" : null,
    udhezime ? "FOSSGIS" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.container}>
      <MapView
        ref={harta}
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: pika.lat, longitude: pika.lng, ...ZMADHIMI }}
        userInterfaceStyle={eshteErret ? "dark" : "light"}
        showsUserLocation={kaLeje === true}
        showsMyLocationButton={false}
        tintColor={ngjyrat.portokalli}
        onPress={() => {
          Keyboard.dismiss();
          setZgjedhuri(null);
        }}
        onRegionChangeComplete={(r, detajet) => {
          setMeEmra(r.latitudeDelta <= KUFIRI_I_EMRAVE);
          // Vetëm lëvizjet e përdoruesit e shfaqin butonin "Kërko në këtë zonë".
          if (detajet?.isGesture && !udhezime && !tekstiIVonuar) setRajoniILevizur(r);
        }}
      >
        {rruga.data ? (
          <Polyline
            coordinates={rruga.data.koordinatat}
            strokeColor={ngjyrat.portokalli}
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}

        {(lokalet.data ?? []).map((l) => {
          const theksuar = l.id === zgjedhuri || l.id === udhezime;
          const meEmer = meEmra || theksuar;
          return (
            <Marker
              // Çelësi ndryshon bashkë me pamjen: gjilpëra rivizatohet edhe me tracksViewChanges={false}.
              key={`${l.id}-${meEmer ? "e" : "p"}-${theksuar ? "z" : "n"}`}
              coordinate={{ latitude: l.lat, longitude: l.lng }}
              zIndex={theksuar ? 3 : l.rezervim_online ? 2 : 1}
              onPress={(e) => {
                e.stopPropagation();
                hapFleten(l.id);
              }}
              tracksViewChanges={false}
            >
              <Shenjuesi emri={l.emri} meEmer={meEmer} theksuar={theksuar} online={l.rezervim_online} />
            </Marker>
          );
        })}

        {/* Destinacioni duket edhe kur nuk është në listën e zonës aktuale. */}
        {destinacioni && udhezime && !(lokalet.data ?? []).some((l) => l.id === udhezime) ? (
          <Marker
            coordinate={{ latitude: destinacioni.lat, longitude: destinacioni.lng }}
            onPress={(e) => {
              e.stopPropagation();
              hapFleten(destinacioni.id);
            }}
          >
            <Shenjuesi emri={destinacioni.emri} meEmer theksuar online={false} />
          </Marker>
        ) : null}
      </MapView>

      <View style={[styles.siper, { top: insets.top + hapesira.sm }]} pointerEvents="box-none">
        {udhezime ? (
          <Xham style={styles.rruga}>
            <View style={styles.rrugaKoka}>
              <Ikona emri={ikonat.harta} madhesia={18} ngjyra={ngjyrat.portokalli} />
              <Text style={styles.rrugaEmri} numberOfLines={1}>
                {destinacioni?.emri ?? " "}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("harta.mbyllRrugen")}
                onPress={mbyllRrugen}
                hitSlop={10}
                style={styles.mbyll}
              >
                <Ikona emri={ikonat.mbyll} madhesia={14} ngjyra={ngjyrat.tekstiDyte} />
              </Pressable>
            </View>

            {kaLeje === false ? (
              <Text style={styles.rrugaShenim}>{t("harta.paLejeRruga")}</Text>
            ) : rruga.isError ? (
              <Text style={styles.rrugaShenim}>{t("harta.gabimRruga")}</Text>
            ) : rruga.data ? (
              <Text style={styles.rrugaKoha}>
                {formatoKohezgjatjen(Math.max(1, Math.round(rruga.data.kohezgjatja_s / 60)))}
                <Text style={styles.rrugaDistanca}>  ·  {formatoDistancen(rruga.data.distanca_m)}</Text>
              </Text>
            ) : (
              <ActivityIndicator color={ngjyrat.portokalli} style={styles.rrugaNgarkimi} />
            )}

            <View style={styles.menyrat}>
              {(["makine", "kembe"] as const).map((m) => (
                <Pressable
                  key={m}
                  accessibilityRole="button"
                  accessibilityState={{ selected: menyra === m }}
                  onPress={() => {
                    prekja.zgjedhje();
                    setMenyra(m);
                  }}
                  style={[styles.menyra, menyra === m && styles.menyraAktive]}
                >
                  <Text style={[styles.menyraTeksti, menyra === m && styles.menyraTekstiAktiv]}>{t(`harta.${m}`)}</Text>
                </Pressable>
              ))}
            </View>
          </Xham>
        ) : (
          <>
            {/* Shiriti i kërkimit prej xhami, si te Google Maps dhe Apple Maps. */}
            <Xham style={styles.kerkimi}>
              <Ikona emri={ikonat.kerko} madhesia={18} ngjyra={ngjyrat.tekstiDyte} />
              <TextInput
                value={teksti}
                onChangeText={setTeksti}
                placeholder={t("harta.kerko")}
                placeholderTextColor={ngjyrat.tekstiZbehte}
                accessibilityLabel={t("harta.kerko")}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                style={styles.kerkimiFusha}
              />
              {lokalet.isFetching ? (
                <ActivityIndicator color={ngjyrat.portokalli} />
              ) : teksti ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("harta.pastroKerkimin")}
                  onPress={() => setTeksti("")}
                  hitSlop={10}
                >
                  <Ikona emri={ikonat.pastro} madhesia={18} ngjyra={ngjyrat.tekstiZbehte} />
                </Pressable>
              ) : null}
            </Xham>

            <View style={styles.filtrat}>
              <Filtri teksti={t("harta.hapurTani")} aktiv={vetemHapur} onPress={() => setVetemHapur((v) => !v)} />
              <Filtri teksti={t("harta.rezervoOnline")} aktiv={vetemOnline} onPress={() => setVetemOnline((v) => !v)} />
            </View>

            {rajoniILevizur ? (
              <Pressable accessibilityRole="button" onPress={kerkoKetu} style={styles.kerkoKetu}>
                <Ikona emri={ikonat.kerko} madhesia={16} ngjyra="#FFFFFF" />
                <Text style={styles.kerkoKetuTeksti}>{t("harta.kerkoKetu")}</Text>
              </Pressable>
            ) : tekstiIVonuar && lokalet.isSuccess && !lokalet.isFetching && (lokalet.data ?? []).length === 0 ? (
              <Xham style={styles.paRezultate}>
                <Text style={styles.paRezultateTeksti}>{t("harta.paRezultate", { kerkimi: tekstiIVonuar })}</Text>
              </Xham>
            ) : null}
          </>
        )}
      </View>

      {kaLeje && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("harta.vendndodhjaIme")}
          onPress={() =>
            harta.current?.animateToRegion({ latitude: pika.lat, longitude: pika.lng, ...ZMADHIMI }, 400)
          }
          style={[styles.butoniVendit, { bottom: poshte + hapesira.md }]}
        >
          <Xham style={styles.butoniVenditXham} iPrekshem>
            <Ikona emri={ikonat.vendi} madhesia={20} ngjyra={ngjyrat.portokalli} />
          </Xham>
        </Pressable>
      )}

      {atribuimi ? (
        <View style={[styles.atribuimi, { bottom: poshte + hapesira.sm }]} pointerEvents="none">
          <Xham style={styles.atribuimiXham}>
            <Text style={styles.atribuimiTeksti}>{atribuimi}</Text>
          </Xham>
        </View>
      ) : null}
    </View>
  );
}

// Gjilpëra e një lokali: rreth me gërshërë (jeshil kur rezervohet në aplikacion) dhe emri poshtë.
// Hapësira bosh sipër është sa etiketa poshtë, që qendra e pamjes, pra pika në hartë, të bjerë
// saktësisht te rrethi, njësoj në Apple Maps dhe Google Maps.
function Shenjuesi({
  emri,
  meEmer,
  theksuar,
  online,
}: {
  emri: string;
  meEmer: boolean;
  theksuar: boolean;
  online: boolean;
}) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const ngjyra = online ? ngjyrat.jeshile : ngjyrat.portokalli;
  return (
    <View style={[styles.shenjuesi, !meEmer && styles.shenjuesiPaEmer]}>
      {meEmer ? <View style={styles.shenjuesiHapesira} /> : null}
      <View style={[styles.gjilpera, { backgroundColor: ngjyra }, theksuar && styles.gjilperaZgjedhur]}>
        <Ikona emri={ikonat.gershere} madhesia={theksuar ? 16 : 13} ngjyra="#FFFFFF" />
      </View>
      {meEmer ? (
        <View style={styles.shenjuesiHapesira}>
          <Text style={[styles.emriNeHarte, theksuar && styles.emriNeHarteZgjedhur]} numberOfLines={2}>
            {emri}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function Filtri({ teksti, aktiv, onPress }: { teksti: string; aktiv: boolean; onPress: () => void }) {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: aktiv }}
      onPress={() => {
        prekja.zgjedhje();
        onPress();
      }}
    >
      <Xham style={styles.filtri} ngjyrimi={aktiv ? ngjyrat.portokalli : undefined} iPrekshem>
        <Text style={[styles.filtriTeksti, aktiv && styles.filtriTekstiAktiv]}>{teksti}</Text>
      </Xham>
    </Pressable>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: ngjyrat.sfondi,
    },
    shenjuesi: {
      width: 132,
      alignItems: "center",
    },
    shenjuesiPaEmer: {
      width: 34,
    },
    // E njëjta lartësi sipër dhe poshtë rrethit (shih Shenjuesi).
    shenjuesiHapesira: {
      height: 34,
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 2,
    },
    gjilpera: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 3,
    },
    gjilperaZgjedhur: {
      width: 34,
      height: 34,
      borderRadius: 17,
      marginVertical: -4,
    },
    emriNeHarte: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 11,
      lineHeight: 13,
      textAlign: "center",
      backgroundColor: ngjyrat.xham,
      borderRadius: 6,
      overflow: "hidden",
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    emriNeHarteZgjedhur: {
      fontSize: 12,
      backgroundColor: ngjyrat.siperfaqja,
    },
    siper: {
      position: "absolute",
      left: hapesira.lg,
      right: hapesira.lg,
      alignItems: "center",
      gap: hapesira.sm,
    },
    kerkimi: {
      alignSelf: "stretch",
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      height: 50,
      borderRadius: 25,
      paddingHorizontal: hapesira.lg,
    },
    kerkimiFusha: {
      flex: 1,
      height: 50,
      color: ngjyrat.teksti,
      fontSize: 17,
    },
    filtrat: {
      alignSelf: "stretch",
      flexDirection: "row",
      gap: hapesira.sm,
    },
    filtri: {
      height: 36,
      borderRadius: 18,
      paddingHorizontal: 14,
      justifyContent: "center",
    },
    filtriTeksti: {
      ...shkronjat.etiketeBold,
      color: ngjyrat.teksti,
      fontSize: 14,
    },
    filtriTekstiAktiv: {
      color: "#FFFFFF",
    },
    paRezultate: {
      borderRadius: rrezja.md,
      paddingHorizontal: hapesira.lg,
      paddingVertical: hapesira.md,
    },
    paRezultateTeksti: {
      color: ngjyrat.teksti,
      fontSize: 14,
      textAlign: "center",
    },
    rruga: {
      alignSelf: "stretch",
      borderRadius: rrezja.lg,
      padding: hapesira.md,
      gap: hapesira.sm,
    },
    rrugaKoka: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
    },
    rrugaEmri: {
      ...shkronjat.titullBold,
      flex: 1,
      color: ngjyrat.teksti,
      fontSize: 16,
    },
    mbyll: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: ngjyrat.siperfaqja2,
      alignItems: "center",
      justifyContent: "center",
    },
    rrugaKoha: {
      ...shkronjat.titull,
      color: ngjyrat.portokalli,
      fontSize: 26,
      letterSpacing: -0.4,
    },
    rrugaDistanca: {
      ...shkronjat.etikete,
      color: ngjyrat.tekstiDyte,
      fontSize: 15,
    },
    rrugaShenim: {
      color: ngjyrat.tekstiDyte,
      fontSize: 14,
      lineHeight: 20,
    },
    rrugaNgarkimi: {
      alignSelf: "flex-start",
      paddingVertical: 6,
    },
    menyrat: {
      flexDirection: "row",
      backgroundColor: ngjyrat.siperfaqja2,
      borderRadius: rrezja.sm + 2,
      padding: 3,
    },
    menyra: {
      flex: 1,
      height: 32,
      borderRadius: rrezja.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    menyraAktive: {
      backgroundColor: ngjyrat.siperfaqja,
    },
    menyraTeksti: {
      ...shkronjat.etikete,
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
    },
    menyraTekstiAktiv: {
      color: ngjyrat.teksti,
    },
    kerkoKetu: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      backgroundColor: ngjyrat.portokalli,
      paddingHorizontal: hapesira.lg,
      height: 42,
      borderRadius: rrezja.plote,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    kerkoKetuTeksti: {
      ...shkronjat.etiketeBold,
      color: "#FFFFFF",
      fontSize: 14,
    },
    butoniVendit: {
      position: "absolute",
      right: hapesira.lg,
    },
    butoniVenditXham: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    atribuimi: {
      position: "absolute",
      left: hapesira.md,
    },
    atribuimiXham: {
      borderRadius: rrezja.sm,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    atribuimiTeksti: {
      color: ngjyrat.tekstiDyte,
      fontSize: 11,
      fontWeight: "600",
    },
  });
