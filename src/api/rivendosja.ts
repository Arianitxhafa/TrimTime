import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

// Email-i i rikuperimit: llogaritë me telefon s'kanë email të vërtetë, ndaj kodi për fjalëkalim të
// ri dërgohet këtu. E sheh dhe e ndryshon vetëm vetë përdoruesi.
export async function ruajEmailinERikuperimit(perdoruesiId: string, email: string | null) {
  if (!email) {
    const { error } = await supabase.from("rikuperimi").delete().eq("perdoruesi_id", perdoruesiId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from("rikuperimi")
    .upsert({ perdoruesi_id: perdoruesiId, email: email.toLowerCase(), ndryshuar_me: new Date().toISOString() });
  if (error) throw error;
}

export function useEmailIRikuperimit() {
  const { sesioni } = useAuth();
  const id = sesioni?.user.id;
  return useQuery({
    queryKey: ["rikuperimi", id],
    enabled: Boolean(id),
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.from("rikuperimi").select("email").eq("perdoruesi_id", id!).maybeSingle();
      if (error) throw error;
      return (data?.email as string | undefined) ?? null;
    },
  });
}

export function useRuajEmailinERikuperimit() {
  const { sesioni } = useAuth();
  const klienti = useQueryClient();
  return useMutation({
    mutationFn: (email: string | null) => ruajEmailinERikuperimit(sesioni!.user.id, email),
    onSuccess: () => klienti.invalidateQueries({ queryKey: ["rikuperimi"] }),
  });
}

// Funksioni "dergo-kodin" në server dërgon kodin 6-shifror te email-i i rikuperimit. Përgjigjja
// është e njëjtë edhe kur numri s'ka llogari ose email.
export async function kerkoKodin(telefoni: string, gjuha: string) {
  const { error } = await supabase.functions.invoke("dergo-kodin", { body: { telefoni, gjuha } });
  if (error) throw error;
}

export type PergjigjaERivendosjes = "ok" | "kodi_gabim" | "fjalekalimi_i_shkurter";

// Klienti (pa hyrë) vendos fjalëkalimin e ri me kodin nga email-i.
export async function rivendosMeKod(telefoni: string, kodi: string, fjalekalimi: string): Promise<PergjigjaERivendosjes> {
  const { data, error } = await supabase.rpc("rivendos_fjalekalimin_me_kod", {
    p_telefoni: telefoni,
    p_kodi: kodi,
    p_fjalekalimi: fjalekalimi,
  });
  if (error) throw error;
  return data as PergjigjaERivendosjes;
}
