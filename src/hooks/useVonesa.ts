import { useEffect, useState } from "react";

// Kthen vlerën vetëm pasi të ketë ndaluar së ndryshuari për `ms` milisekonda.
export function useVonesa<T>(vlera: T, ms = 300): T {
  const [eVonuar, setEVonuar] = useState(vlera);

  useEffect(() => {
    const id = setTimeout(() => setEVonuar(vlera), ms);
    return () => clearTimeout(id);
  }, [vlera, ms]);

  return eVonuar;
}
