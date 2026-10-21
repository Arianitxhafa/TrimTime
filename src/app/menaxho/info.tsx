import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ngarkoFoton, useLokaliIm, usePerditesoLokalin } from "../../api/lokalet";
import Butoni from "../../components/Butoni";
import FushaTekstit from "../../components/FushaTekstit";
import Ikona, { ikonat } from "../../components/Ikona";
import { GabimiIFormes } from "../../components/KornizaAuth";
import ZgjedhesiVendndodhjes from "../../components/ZgjedhesiVendndodhjes";
import { useStilet, useTema } from "../../context/TemaContext";
import type { Koordinata, Lokali } from "../../lib/tipet";
import { hapesira, rrezja, type Ngjyrat } from "../../theme";

export default function MenaxhoInfon() {
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const lokaliIm = useLokaliIm();

  if (!lokaliIm.data) {
    return (
      <View style={[styles.container, styles.qendra]}>
        <ActivityIndicator color={ngjyrat.ari} />
      </View>
    );
  }
  return <Forma lokali={lokaliIm.data.lokali} />;
}

type LlojiIFotos = "kopertina" | "logo";

function Forma({ lokali }: { lokali: Lokali }) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const insets = useSafeAreaInsets();
  const perditeso = usePerditesoLokalin(lokali.id);

  const [emri, setEmri] = useState(lokali.emri);
  const [pershkrimi, setPershkrimi] = useState(lokali.pershkrimi ?? "");
  const [telefoni, setTelefoni] = useState(lokali.telefoni ?? "");
  const [adresa, setAdresa] = useState(lokali.adresa);
  const [qyteti, setQyteti] = useState(lokali.qyteti);
  const [vendndodhja, setVendndodhja] = useState<Koordinata>({ lat: lokali.lat, lng: lokali.lng });
  const [provuar, setProvuar] = useState(false);
  const [ngarkohetFoto, setNgarkohetFoto] = useState<LlojiIFotos | null>(null);
  const [gabimiFotos, setGabimiFotos] = useState<string | null>(null);

  const gabimet = {
    emri: emri.trim().length >= 2 ? null : t("wizard.gabimEmri"),
    adresa: adresa.trim().length >= 3 ? null : t("wizard.gabimAdresa"),
    qyteti: qyteti.trim().length >= 2 ? null : t("wizard.gabimQyteti"),
  };

  async function zgjidhFoton(lloji: LlojiIFotos) {
    setGabimiFotos(null);
    const rezultati = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: lloji === "logo" ? [1, 1] : [16, 9],
      quality: 0.8,
    });
    if (rezultati.canceled) return;
    const asset = rezultati.assets[0];

    setNgarkohetFoto(lloji);
    try {
      const url = await ngarkoFoton(lokali.id, lloji, asset.uri, asset.mimeType);
      await perditeso.mutateAsync(lloji === "logo" ? { logo_url: url } : { kopertina_url: url });
    } catch {
      setGabimiFotos(t("pergjithshme.gabimPapritur"));
    } finally {
      setNgarkohetFoto(null);
    }
  }

  function ruaj() {
    setProvuar(true);
    if (gabimet.emri || gabimet.adresa || gabimet.qyteti) return;
    perditeso.mutate(
      {
        emri: emri.trim(),
        pershkrimi: pershkrimi.trim() || null,
        telefoni: telefoni.trim() || null,
        adresa: adresa.trim(),
        qyteti: qyteti.trim(),
        vendndodhja,
      },
      { onSuccess: () => router.back() },
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.permbajtja} keyboardShouldPersistTaps="handled">
        <GabimiIFormes mesazhi={gabimiFotos ?? (perditeso.isError ? t("pergjithshme.gabimPapritur") : null)} />

        <Text style={styles.etiketa}>{t("info.kopertina")}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("info.kopertina")}
          onPress={() => zgjidhFoton("kopertina")}
          style={styles.kopertina}
        >
          {lokali.kopertina_url ? (
            <Image source={{ uri: lokali.kopertina_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={styles.fotoBosh}>
              <Ikona emri={ikonat.shto} madhesia={22} ngjyra={ngjyrat.ari} />
              <Text style={styles.fotoBoshTeksti}>{t("info.shtoFoton")}</Text>
            </View>
          )}
          {ngarkohetFoto === "kopertina" && (
            <View style={styles.fotoNgarkohet}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          )}
        </Pressable>

        <View style={styles.logoRreshti}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("info.logo")}
            onPress={() => zgjidhFoton("logo")}
            style={styles.logo}
          >
            {lokali.logo_url ? (
              <Image source={{ uri: lokali.logo_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <Text style={styles.logoShkronja}>{lokali.emri.charAt(0).toUpperCase()}</Text>
            )}
            {ngarkohetFoto === "logo" && (
              <View style={styles.fotoNgarkohet}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            )}
          </Pressable>
          <View style={styles.logoTeksti}>
            <Text style={styles.logoTitulli}>{t("info.logo")}</Text>
            <Pressable accessibilityRole="button" onPress={() => zgjidhFoton("logo")} hitSlop={6}>
              <Text style={styles.lidhja}>{lokali.logo_url ? t("info.ndryshoFoton") : t("info.shtoFoton")}</Text>
            </Pressable>
          </View>
        </View>

        <FushaTekstit
          etiketa={t("wizard.emri")}
          value={emri}
          onChangeText={setEmri}
          autoCapitalize="words"
          maxLength={80}
          gabimi={provuar ? gabimet.emri : null}
        />
        <FushaTekstit
          etiketa={t("wizard.pershkrimi")}
          value={pershkrimi}
          onChangeText={setPershkrimi}
          placeholder={t("wizard.pershkrimiShembull")}
          shumeRreshta
          maxLength={1000}
        />
        <FushaTekstit
          etiketa={t("wizard.telefoni")}
          ikona={ikonat.telefoni}
          value={telefoni}
          onChangeText={setTelefoni}
          keyboardType="phone-pad"
          maxLength={30}
        />

        <Text style={styles.etiketa}>{t("wizard.vendTitulli")}</Text>
        <ZgjedhesiVendndodhjes vlera={vendndodhja} onNdrysho={setVendndodhja} />
        <FushaTekstit
          etiketa={t("wizard.adresa")}
          value={adresa}
          onChangeText={setAdresa}
          maxLength={200}
          gabimi={provuar ? gabimet.adresa : null}
        />
        <FushaTekstit
          etiketa={t("wizard.qyteti")}
          value={qyteti}
          onChangeText={setQyteti}
          autoCapitalize="words"
          maxLength={80}
          gabimi={provuar ? gabimet.qyteti : null}
        />
      </ScrollView>

      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
        <Butoni titulli={t("info.ruaj")} ngarkohet={perditeso.isPending && !ngarkohetFoto} onPress={ruaj} />
      </View>
    </KeyboardAvoidingView>
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
      paddingBottom: hapesira.xxl,
    },
    etiketa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
      marginBottom: hapesira.sm,
    },
    kopertina: {
      height: 170,
      borderRadius: rrezja.lg,
      overflow: "hidden",
      backgroundColor: ngjyrat.ariIErret,
      borderWidth: 1,
      borderColor: ngjyrat.kufiri,
      marginBottom: hapesira.lg,
    },
    fotoBosh: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: hapesira.sm,
    },
    fotoBoshTeksti: {
      color: ngjyrat.ari,
      fontSize: 14,
      fontWeight: "700",
    },
    fotoNgarkohet: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
    },
    logoRreshti: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.lg,
      marginBottom: hapesira.xl,
    },
    logo: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: ngjyrat.ari,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    logoShkronja: {
      color: ngjyrat.mbiAri,
      fontSize: 30,
      fontWeight: "800",
    },
    logoTeksti: {
      gap: 4,
    },
    logoTitulli: {
      color: ngjyrat.teksti,
      fontSize: 16,
      fontWeight: "700",
    },
    lidhja: {
      color: ngjyrat.ari,
      fontSize: 14,
      fontWeight: "700",
    },
    fundi: {
      paddingHorizontal: hapesira.xl,
      paddingTop: hapesira.md,
      borderTopWidth: 1,
      borderTopColor: ngjyrat.kufiri,
    },
  });
