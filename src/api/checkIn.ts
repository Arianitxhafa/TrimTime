import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type CheckIn = { termini_id: string; ora_lokale: string; sherbimi_emri: string };

// Klienti skanon QR-në e lokalit: shënohet që arriti për terminin e tij të sotëm aty.
export function useBejCheckIn() {
  const klienti = useQueryClient();
  return useMutation({
    mutationFn: async (lokaliId: string) => {
      const { data, error } = await supabase.rpc("bej_check_in", { p_lokali_id: lokaliId }).single<CheckIn>();
      if (error) throw error;
      return data;
    },
    onSuccess: () => klienti.invalidateQueries({ queryKey: ["terminet-e-mia"] }),
  });
}
