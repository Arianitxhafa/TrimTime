import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// Dridhje e lehtë në prekje (haptics). Në web nuk ka, ndaj thirrjet aty nuk bëjnë asgjë.
const kaDridhje = Platform.OS !== "web";

export const prekja = {
  lehte: () => {
    if (kaDridhje) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  mesatare: () => {
    if (kaDridhje) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  zgjedhje: () => {
    if (kaDridhje) Haptics.selectionAsync().catch(() => {});
  },
  sukses: () => {
    if (kaDridhje) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  gabim: () => {
    if (kaDridhje) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
};
