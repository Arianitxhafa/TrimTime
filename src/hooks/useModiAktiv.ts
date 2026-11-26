import { useLokaliIm } from "../api/lokalet";

// "biznes" për stafin e Studio Burimit (pronar ose berber), "klient" për të gjithë të tjerët.
export type Modi = "klient" | "biznes";

// Roli vjen nga databaza (anetaret_e_lokalit), jo nga zgjedhja e përdoruesit: kush bashkohet me kodin
// e ftesës kalon vetë te pjesa e biznesit.
export function useModiAktiv(): Modi {
  const lokaliIm = useLokaliIm();
  return lokaliIm.data ? "biznes" : "klient";
}
