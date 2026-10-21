import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const celesi = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !celesi) {
  throw new Error(
    "Mungojnë EXPO_PUBLIC_SUPABASE_URL ose EXPO_PUBLIC_SUPABASE_ANON_KEY. Kopjo .env.example si .env dhe plotësoje.",
  );
}

export const supabase = createClient(url, celesi, {
  auth: {
    // Në web gjatë renderimit në server nuk ka `window`, ndaj sesioni ruhet vetëm në pajisje/shfletues.
    storage: Platform.OS === "web" && typeof window === "undefined" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Supabase rekomandon ta ndalojë rifreskimin e token-it kur aplikacioni është në sfond.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (gjendja) => {
    if (gjendja === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
