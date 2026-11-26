import { useLocalSearchParams } from "expo-router";
import FaqjaELokalit from "../../components/FaqjaELokalit";

// Faqja e lokalit jashtë tab-eve: "Shiko si klient" te biznesi, kodi QR, terminet dhe kartat.
export default function Lokali() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FaqjaELokalit id={id} />;
}
