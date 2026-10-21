import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TerminetProvider } from "../context/TerminetContext";
import { ngjyrat } from "../theme";

export default function RootLayout() {
  return (
    <TerminetProvider>
      <StatusBar style="light" />
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
      </Stack>
    </TerminetProvider>
  );
}
