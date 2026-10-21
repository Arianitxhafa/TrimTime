import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { useStilet, useTema } from "../context/TemaContext";
import { hapesira, rrezja, type Ngjyrat } from "../theme";
import Ikona, { ikonat, type EmriIkones } from "./Ikona";

type Props = Omit<TextInputProps, "style" | "secureTextEntry"> & {
  etiketa: string;
  ikona?: EmriIkones;
  gabimi?: string | null;
  fjalekalim?: boolean;
  shumeRreshta?: boolean;
};

export default function FushaTekstit({
  etiketa,
  ikona,
  gabimi,
  fjalekalim = false,
  shumeRreshta = false,
  ...props
}: Props) {
  const { t } = useTranslation();
  const { ngjyrat } = useTema();
  const styles = useStilet(krijoStilet);
  const [fshehur, setFshehur] = useState(true);
  const [fokus, setFokus] = useState(false);

  return (
    <View style={styles.fusha}>
      <Text style={styles.etiketa}>{etiketa}</Text>
      <View
        style={[
          styles.kutia,
          shumeRreshta && styles.kutiaShumeRreshta,
          fokus && styles.kutiaFokus,
          gabimi ? styles.kutiaGabim : null,
        ]}
      >
        {ikona && <Ikona emri={ikona} madhesia={18} ngjyra={fokus ? ngjyrat.ari : ngjyrat.tekstiZbehte} />}
        <TextInput
          {...props}
          accessibilityLabel={etiketa}
          placeholderTextColor={ngjyrat.tekstiZbehte}
          secureTextEntry={fjalekalim && fshehur}
          multiline={shumeRreshta}
          textAlignVertical={shumeRreshta ? "top" : "center"}
          onFocus={(e) => {
            setFokus(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFokus(false);
            props.onBlur?.(e);
          }}
          style={[styles.input, shumeRreshta && styles.inputShumeRreshta]}
        />
        {fjalekalim && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(fshehur ? "auth.shfaqFjalekalimin" : "auth.fshihFjalekalimin")}
            onPress={() => setFshehur((v) => !v)}
            hitSlop={10}
          >
            <Ikona
              emri={fshehur ? ikonat.syri : ikonat.syriMbyllur}
              madhesia={18}
              ngjyra={ngjyrat.tekstiDyte}
            />
          </Pressable>
        )}
      </View>
      {gabimi ? <Text style={styles.gabimi}>{gabimi}</Text> : null}
    </View>
  );
}

const krijoStilet = (ngjyrat: Ngjyrat) =>
  StyleSheet.create({
    fusha: {
      marginBottom: hapesira.lg,
    },
    etiketa: {
      color: ngjyrat.tekstiDyte,
      fontSize: 13,
      fontWeight: "700",
      marginBottom: hapesira.sm,
    },
    kutia: {
      flexDirection: "row",
      alignItems: "center",
      gap: hapesira.sm,
      backgroundColor: ngjyrat.siperfaqja,
      borderRadius: rrezja.md,
      borderWidth: 1.5,
      borderColor: ngjyrat.kufiri,
      paddingHorizontal: hapesira.lg,
      height: 54,
    },
    kutiaShumeRreshta: {
      height: 112,
      alignItems: "flex-start",
      paddingVertical: hapesira.md,
    },
    kutiaFokus: {
      borderColor: ngjyrat.ari,
    },
    kutiaGabim: {
      borderColor: ngjyrat.rrezik,
    },
    input: {
      flex: 1,
      height: "100%",
      color: ngjyrat.teksti,
      fontSize: 16,
    },
    inputShumeRreshta: {
      height: "100%",
      paddingTop: 0,
    },
    gabimi: {
      color: ngjyrat.rrezik,
      fontSize: 13,
      fontWeight: "600",
      marginTop: 6,
    },
  });
