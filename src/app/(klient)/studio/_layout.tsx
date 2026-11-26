import { Stack } from "expo-router";
import { useOpsionetEStackut } from "../../../components/opsionetETabeve";

export default function Layout() {
  const opsionet = useOpsionetEStackut();
  return (
    <Stack screenOptions={opsionet}>
      <Stack.Screen name="index" options={{ title: "" }} />
    </Stack>
  );
}
