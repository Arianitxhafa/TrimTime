import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

// Sa klientë të aprovuar ka Studio (distinktivi "klientë" te Ballina). Null kur funksioni mungon
// (migrimi s'është ekzekutuar ende): distinktivi thjesht nuk shfaqet.
export function useNumriIKlienteve() {
  return useQuery({
    queryKey: ["numri-i-klienteve"],
    staleTime: 10 * 60_000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("numri_i_klienteve");
      if (error) return null;
      return typeof data === "number" && data > 0 ? data : null;
    },
  });
}

