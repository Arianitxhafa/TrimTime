import { onlineManager } from "@tanstack/react-query";
import * as Network from "expo-network";
import { useSyncExternalStore } from "react";

// A ka internet telefoni? iOS nuk e dallon "WiFi pa internet", ndaj aty mjafton lidhja.
function kaInternet(gjendja: Network.NetworkState): boolean {
  if (gjendja.isConnected === false) return false;
  return gjendja.isInternetReachable !== false;
}

// React Query ndalon kërkesat kur s'ka internet dhe i rinis vetë kur kthehet lidhja.
onlineManager.setEventListener((vendosOnline) => {
  Network.getNetworkStateAsync()
    .then((gjendja) => vendosOnline(kaInternet(gjendja)))
    .catch(() => {});
  const abonimi = Network.addNetworkStateListener((gjendja) => vendosOnline(kaInternet(gjendja)));
  return () => abonimi.remove();
});

export function eshteOnline(): boolean {
  return onlineManager.isOnline();
}

// Për ekranet: rifreskohet sa herë ndryshon lidhja.
export function useEshteOnline(): boolean {
  return useSyncExternalStore(
    (ndryshim) => onlineManager.subscribe(ndryshim),
    () => onlineManager.isOnline(),
    () => true,
  );
}
