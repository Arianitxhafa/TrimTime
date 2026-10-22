import { Redirect } from "expo-router";
import { useModiAktiv } from "../hooks/useModiAktiv";

// Hyrja e aplikacionit pas autentikimit: dërgon te tab-et e rolit.
export default function Index() {
  const modi = useModiAktiv();
  return <Redirect href={modi === "biznes" ? "/sot" : "/zbulo"} />;
}
