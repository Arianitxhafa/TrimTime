import { Stack } from "expo-router";
import { useTema } from "../../context/TemaContext";

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
