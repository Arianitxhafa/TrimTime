import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useOpsionetEStackut } from "../../../components/opsionetETabeve";

// Titulli i madh i iOS që tkurret kur lëviz lista.
export default function Layout() {
  const { t } = useTranslation();
  const opsionet = useOpsionetEStackut();
  return (
    <Stack screenOptions={opsionet}>
      <Stack.Screen name="index" options={{ title: t("tabs.zbulo") }} />
    </Stack>
  );
}
