import { Redirect } from "expo-router";
import { usePreferencat } from "../context/PreferencatContext";

// Hyrja e aplikacionit pas autentikimit: dërgon te tab-et e modit aktiv.
export default function Index() {
  const { modi } = usePreferencat();
  return <Redirect href={modi === "biznes" ? "/sot" : "/zbulo"} />;
}
