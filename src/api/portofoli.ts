import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ngarkoNeStorage, type Fotoja } from "../lib/fotot";
import { supabase } from "../lib/supabase";
import type { FotoEPortofolit } from "../lib/tipet";

const BUCKET = "lokalet";

export function usePortofoli(lokaliId: string | undefined) {
  return useQuery({
    queryKey: ["portofoli", lokaliId],
    enabled: Boolean(lokaliId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portofoli")
        .select("id, lokali_id, berberi_id, foto_url, pershkrimi, krijuar_me")
        .eq("lokali_id", lokaliId!)
        .order("krijuar_me", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as FotoEPortofolit[];
    },
  });
}

// Fotoja ruhet në <lokali_id>/portofoli/ (rregullat e Storage lejojnë çdo anëtar të stafit).
export function useShtoNePortofol(lokaliId: string) {
  const klienti = useQueryClient();
  return useMutation({
    mutationFn: async ({ foto, pershkrimi }: { foto: Fotoja; pershkrimi: string }) => {
      const shtegu = await ngarkoNeStorage(BUCKET, `${lokaliId}/portofoli`, foto);
      const url = supabase.storage.from(BUCKET).getPublicUrl(shtegu).data.publicUrl;
      const { error } = await supabase
        .from("portofoli")
        .insert({ lokali_id: lokaliId, foto_url: url, pershkrimi: pershkrimi.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => klienti.invalidateQueries({ queryKey: ["portofoli", lokaliId] }),
  });
}

export function useFshiNgaPortofoli(lokaliId: string) {
  const klienti = useQueryClient();
  return useMutation({
    mutationFn: async (foto: FotoEPortofolit) => {
      const { error } = await supabase.from("portofoli").delete().eq("id", foto.id);
      if (error) throw error;
      // Skedari hiqet pas rreshtit; nëse dështon, mbetet vetëm një skedar pa përdorim.
      const shtegu = foto.foto_url.split(`/object/public/${BUCKET}/`)[1];
      if (shtegu) await supabase.storage.from(BUCKET).remove([decodeURIComponent(shtegu)]);
    },
    onSuccess: () => klienti.invalidateQueries({ queryKey: ["portofoli", lokaliId] }),
  });
}
