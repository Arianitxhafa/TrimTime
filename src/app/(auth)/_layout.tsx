import { Stack } from "expo-router";
import { useTema } from "../../context/TemaContext";

// Para hyrjes, përdoruesi zgjedh fillimisht rolin.
export const unstable_settings = { initialRouteName: "roli" };

export default function AuthLayout() {
  const { ngjyrat } = useTema();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: ngjyrat.sfondi },
        animation: "fade",
      }}
    />
  );
}
