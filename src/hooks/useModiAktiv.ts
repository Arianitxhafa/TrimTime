import { useAuth } from "../context/AuthContext";
import { usePreferencat, type Modi } from "../context/PreferencatContext";

// Roli i llogarisë ka përparësi; para hyrjes (ose për llogari të vjetra) përdoret zgjedhja në ekranin e rolit.
export function useModiAktiv(): Modi {
  const { roli } = useAuth();
  const { modi } = usePreferencat();
  return roli ?? modi;
}
