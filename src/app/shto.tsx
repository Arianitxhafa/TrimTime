import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Butoni from "../components/Butoni";
import { ikonat } from "../components/Ikona";
import { useTerminet } from "../context/TerminetContext";
import { oraretEPunes, sherbimet } from "../data/terminet";
import { hapesira, ngjyrat, rrezja } from "../theme";

function kthehu() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/");
  }
}

export default function ShtoTermin() {
  const insets = useSafeAreaInsets();
  const { terminet, shtoTermin } = useTerminet();

  const [klienti, setKlienti] = useState("");
  const [telefoni, setTelefoni] = useState("");
  const [sherbimi, setSherbimi] = useState<string | null>(null);
  const [ora, setOra] = useState<string | null>(null);
  const [shenime, setShenime] = useState("");
  const [provuar, setProvuar] = useState(false);

  const oretEZena = new Set(terminet.filter((t) => t.statusi !== "Anuluar").map((t) => t.ora));

  const gabimet = {
    klienti: klienti.trim().length < 2 ? "Shkruaj emrin e klientit." : null,
    sherbimi: sherbimi ? null : "Zgjidh një shërbim.",
    ora: ora ? null : "Zgjidh një orë të lirë.",
  };
  const iVlefshem = !gabimet.klienti && !gabimet.sherbimi && !gabimet.ora;

  function ruaj() {
    setProvuar(true);
    if (!iVlefshem || !sherbimi || !ora) return;

    shtoTermin({
      klienti: klienti.trim(),
      sherbimi,
      ora,
      telefoni: telefoni.trim() || undefined,
      shenime: shenime.trim() || undefined,
    });
    kthehu();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.permbajtja}
        keyboardShouldPersistTaps="handled"
      >
        <Fusha etiketa="Emri i klientit" gabimi={provuar ? gabimet.klienti : null}>
          <TextInput
            value={klienti}
            onChangeText={setKlienti}
            placeholder="p.sh. Arben Krasniqi"
            placeholderTextColor={ngjyrat.tekstiZbehte}
            style={[styles.input, provuar && gabimet.klienti && styles.inputGabim]}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </Fusha>

        <Fusha etiketa="Telefoni (opsional)">
          <TextInput
            value={telefoni}
            onChangeText={setTelefoni}
            placeholder="+383 4x xxx xxx"
            placeholderTextColor={ngjyrat.tekstiZbehte}
            style={styles.input}
            keyboardType="phone-pad"
          />
        </Fusha>

        <Fusha etiketa="Shërbimi" gabimi={provuar ? gabimet.sherbimi : null}>
          <View style={styles.sherbimet}>
            {sherbimet.map((s) => {
              const aktiv = sherbimi === s.emri;
              return (
                <Pressable
                  key={s.emri}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: aktiv }}
                  onPress={() => setSherbimi(s.emri)}
                  style={({ pressed }) => [
                    styles.sherbimi,
                    aktiv && styles.sherbimiAktiv,
                    pressed && styles.shtypur,
                  ]}
                >
                  <View style={[styles.radio, aktiv && styles.radioAktiv]}>
                    {aktiv && <View style={styles.radioPika} />}
                  </View>
                  <View style={styles.sherbimiTeksti}>
                    <Text style={styles.sherbimiEmri}>{s.emri}</Text>
                    <Text style={styles.sherbimiDetaje}>{s.kohezgjatja} min</Text>
                  </View>
                  <Text style={[styles.sherbimiCmimi, aktiv && styles.tekstiAri]}>€{s.cmimi}</Text>
                </Pressable>
              );
            })}
          </View>
        </Fusha>

        <Fusha etiketa="Ora" gabimi={provuar ? gabimet.ora : null}>
          <View style={styles.oret}>
            {oraretEPunes.map((o) => {
              const eZene = oretEZena.has(o);
              const aktiv = ora === o;
              return (
                <Pressable
                  key={o}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: aktiv, disabled: eZene }}
                  disabled={eZene}
                  onPress={() => setOra(o)}
                  style={({ pressed }) => [
                    styles.ora,
                    aktiv && styles.oraAktiv,
                    eZene && styles.oraEZene,
                    pressed && styles.shtypur,
                  ]}
                >
                  <Text
                    style={[
                      styles.oraTeksti,
                      aktiv && styles.oraTekstiAktiv,
                      eZene && styles.oraTekstiEZene,
                    ]}
                  >
                    {o}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.ndihme}>Oraret e vijëzuara janë tashmë të zëna.</Text>
        </Fusha>

        <Fusha etiketa="Shënime (opsional)">
          <TextInput
            value={shenime}
            onChangeText={setShenime}
            placeholder="Preferencat e klientit…"
            placeholderTextColor={ngjyrat.tekstiZbehte}
            style={[styles.input, styles.inputShenime]}
            multiline
            textAlignVertical="top"
          />
        </Fusha>
      </ScrollView>

      <View style={[styles.fundi, { paddingBottom: insets.bottom + hapesira.md }]}>
        <Butoni titulli="Anulo" varianti="dytesor" onPress={kthehu} style={styles.butoniAnulo} />
        <Butoni titulli="Ruaj terminin" ikona={ikonat.konfirmo} onPress={ruaj} style={styles.butoniRuaj} />
      </View>
    </KeyboardAvoidingView>
  );
}

type FushaProps = {
  etiketa: string;
  gabimi?: string | null;
  children: ReactNode;
};

function Fusha({ etiketa, gabimi, children }: FushaProps) {
  return (
    <View style={styles.fusha}>
      <Text style={styles.etiketa}>{etiketa}</Text>
      {children}
      {gabimi ? <Text style={styles.gabimi}>{gabimi}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ngjyrat.sfondi,
  },
  permbajtja: {
    padding: hapesira.xl,
    paddingBottom: hapesira.xxl,
  },
  shtypur: {
    opacity: 0.85,
  },
  fusha: {
    marginBottom: hapesira.xl,
  },
  etiketa: {
    color: ngjyrat.tekstiDyte,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: hapesira.sm,
  },
  gabimi: {
    color: ngjyrat.rrezik,
    fontSize: 13,
    fontWeight: "600",
    marginTop: hapesira.sm,
  },
  ndihme: {
    color: ngjyrat.tekstiZbehte,
    fontSize: 12,
    marginTop: hapesira.sm,
  },
  input: {
    backgroundColor: ngjyrat.siperfaqja,
    borderRadius: rrezja.md,
    borderWidth: 1,
    borderColor: ngjyrat.kufiri,
    color: ngjyrat.teksti,
    fontSize: 16,
    paddingHorizontal: hapesira.lg,
    height: 52,
  },
  inputGabim: {
    borderColor: ngjyrat.rrezik,
  },
  inputShenime: {
    height: 100,
    paddingTop: hapesira.md,
  },
  sherbimet: {
    gap: hapesira.sm,
  },
  sherbimi: {
    flexDirection: "row",
    alignItems: "center",
    gap: hapesira.md,
    backgroundColor: ngjyrat.siperfaqja,
    borderRadius: rrezja.md,
    borderWidth: 1,
    borderColor: ngjyrat.kufiri,
    padding: hapesira.md,
  },
  sherbimiAktiv: {
    borderColor: ngjyrat.ari,
    backgroundColor: ngjyrat.ariIErret,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: ngjyrat.tekstiZbehte,
    alignItems: "center",
    justifyContent: "center",
  },
  radioAktiv: {
    borderColor: ngjyrat.ari,
  },
  radioPika: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ngjyrat.ari,
  },
  sherbimiTeksti: {
    flex: 1,
  },
  sherbimiEmri: {
    color: ngjyrat.teksti,
    fontSize: 15,
    fontWeight: "700",
  },
  sherbimiDetaje: {
    color: ngjyrat.tekstiZbehte,
    fontSize: 12,
    marginTop: 2,
  },
  sherbimiCmimi: {
    color: ngjyrat.teksti,
    fontSize: 16,
    fontWeight: "800",
  },
  tekstiAri: {
    color: ngjyrat.ari,
  },
  oret: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: hapesira.sm,
  },
  ora: {
    width: "23%",
    flexGrow: 1,
    height: 44,
    borderRadius: rrezja.sm,
    borderWidth: 1,
    borderColor: ngjyrat.kufiri,
    backgroundColor: ngjyrat.siperfaqja,
    alignItems: "center",
    justifyContent: "center",
  },
  oraAktiv: {
    backgroundColor: ngjyrat.ari,
    borderColor: ngjyrat.ari,
  },
  oraEZene: {
    opacity: 0.35,
  },
  oraTeksti: {
    color: ngjyrat.teksti,
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  oraTekstiAktiv: {
    color: ngjyrat.mbiAri,
  },
  oraTekstiEZene: {
    textDecorationLine: "line-through",
  },
  fundi: {
    flexDirection: "row",
    gap: hapesira.md,
    paddingHorizontal: hapesira.xl,
    paddingTop: hapesira.md,
    borderTopWidth: 1,
    borderTopColor: ngjyrat.kufiri,
    backgroundColor: ngjyrat.sfondi,
  },
  butoniAnulo: {
    flex: 1,
  },
  butoniRuaj: {
    flex: 2,
  },
});
