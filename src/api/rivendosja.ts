import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

// Pronari krijon një kod 6-shifror për numrin e klientit që ka harruar fjalëkalimin (vlen 30 minuta).
export function useKrijoKodinERivendosjes() {
  return useMutation({
    mutationFn: async (telefoni: string) => {
      const { data, error } = await supabase.rpc("krijo_kodin_e_rivendosjes", { p_telefoni: telefoni });
      if (error) throw error;
      return data as string;
    },
  });
}

export type PergjigjaERivendosjes = "ok" | "kodi_gabim" | "fjalekalimi_i_shkurter";

// Klienti (pa hyrë) vendos fjalëkalimin e ri me kodin që i dha Studio.
export async function rivendosMeKod(telefoni: string, kodi: string, fjalekalimi: string): Promise<PergjigjaERivendosjes> {
  const { data, error } = await supabase.rpc("rivendos_fjalekalimin_me_kod", {
    p_telefoni: telefoni,
    p_kodi: kodi,
    p_fjalekalimi: fjalekalimi,
  });
  if (error) throw error;
  return data as PergjigjaERivendosjes;
}
