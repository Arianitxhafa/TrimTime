import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { PreferencatProvider, usePreferencat } from "../context/PreferencatContext";
import { TemaProvider, useTema } from "../context/TemaContext";
import { TerminetProvider } from "../context/TerminetContext";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <TemaProvider>
      <PreferencatProvider>
        <AuthProvider>
          <TerminetProvider>
            <Navigimi />
          </TerminetProvider>
        </AuthProvider>
      </PreferencatProvider>
    </TemaProvider>
  );
}

function Navigimi() {
  const { t } = useTranslation();
  const { ngjyrat, eshteErret } = useTema();
  const { sesioni, ngarkohet } = useAuth();
  const { modi, onboardingIPare } = usePreferencat();

  useEffect(() => {
    if (!ngarkohet) SplashScreen.hideAsync().catch(() => {});
  }, [ngarkohet]);

  // Splash screen-i mbetet derisa të dihet nëse përdoruesi ka hyrë.
  if (ngarkohet) return null;

  const kaHyre = sesioni !== null;

  // Stack.Protected fsheh ekranet që nuk lejohen. Kur një kusht ndryshon (p.sh. pas
  // hyrjes ose ndërrimit të modit), Expo Router kalon vetë te ekrani i parë i lejuar.
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
        <Stack.Protected guard={!onboardingIPare}>
          <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "fade" }} />
        </Stack.Protected>

        <Stack.Protected guard={onboardingIPare && !kaHyre}>
          <Stack.Screen name="(auth)" options={{ headerShown: false, animation: "fade" }} />
        </Stack.Protected>

        <Stack.Protected guard={onboardingIPare && kaHyre}>
          <Stack.Screen name="index" options={{ headerShown: false }} />

          <Stack.Protected guard={modi === "klient"}>
            <Stack.Screen name="(klient)" options={{ headerShown: false, animation: "fade" }} />
          </Stack.Protected>

          <Stack.Protected guard={modi === "biznes"}>
            <Stack.Screen name="(biznes)" options={{ headerShown: false, animation: "fade" }} />
            <Stack.Screen name="termini/[id]" options={{ title: "Detajet e terminit" }} />
            <Stack.Screen name="shto" options={{ title: "Termin i ri", presentation: "modal" }} />
          </Stack.Protected>

          <Stack.Screen name="cilesimet" options={{ title: t("cilesimet.titulli") }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}
