import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TemaProvider, useTema } from "../context/TemaContext";
import { TerminetProvider } from "../context/TerminetContext";
import { ngarkoGjuhenERuajtur } from "../i18n";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [gati, setGati] = useState(false);

  useEffect(() => {
    ngarkoGjuhenERuajtur().finally(() => setGati(true));
  }, []);

  if (!gati) return null;

  return (
    <TemaProvider>
      <TerminetProvider>
        <Navigimi />
      </TerminetProvider>
    </TemaProvider>
  );
}

function Navigimi() {
  const { t } = useTranslation();
  const { ngjyrat, eshteErret } = useTema();

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <>
      <StatusBar style={eshteErret ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: ngjyrat.sfondi },
          headerTintColor: ngjyrat.ari,
          headerTitleStyle: { color: ngjyrat.teksti, fontWeight: "700" },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: ngjyrat.sfondi },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false, title: "Terminet" }} />
        <Stack.Screen name="termini/[id]" options={{ title: "Detajet e terminit" }} />
        <Stack.Screen name="shto" options={{ title: "Termin i ri", presentation: "modal" }} />
        <Stack.Screen name="cilesimet" options={{ title: t("cilesimet.titulli") }} />
      </Stack>
    </>
  );
}
