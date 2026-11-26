import FaqjaELokalit from "../../../components/FaqjaELokalit";
import { STUDIO_ID } from "../../../lib/studio";

// Ekrani i parë i klientit: Studio Burimi, me shërbimet, çmimet, orarin dhe rezervimin.
export default function Studio() {
  return <FaqjaELokalit id={STUDIO_ID} neTab />;
}
