import { useQuery } from "@tanstack/react-query";
import { ngarkoNeStorage, type Fotoja } from "../lib/fotot";
import { supabase } from "../lib/supabase";

const BUCKET = "stilet";

// Pas rezervimit: fotoja ngarkohet në dosjen e klientit dhe lidhet me terminin.
export async function bashkangjitFotonEStilit(terminiId: string, klientiId: string, foto: Fotoja) {
  const shtegu = await ngarkoNeStorage(BUCKET, klientiId, foto);
  const { error } = await supabase.rpc("vendos_foton_e_stilit", { p_termini_id: terminiId, p_shtegu: shtegu });
  if (error) throw error;
}

// Bucket-i është privat: stafi merr një lidhje të përkohshme (1 orë).
export function useFotoEStilit(shtegu: string | null | undefined) {
  return useQuery({
    queryKey: ["foto-e-stilit", shtegu],
    enabled: Boolean(shtegu),
    staleTime: 50 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(shtegu!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
