import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

export type Fotoja = { uri: string; mimeType: string };

export type BurimiIFotos = "kamera" | "galeria";

// Hap kamerën ose galerinë. Kthen null kur përdoruesi anulon; "pa_leje" kur kamera është refuzuar.
export async function zgjidhFoton(burimi: BurimiIFotos, aspekti: [number, number] = [4, 5]): Promise<Fotoja | null | "pa_leje"> {
  const opsionet: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: aspekti,
    // Fotot e qethjeve nuk kanë nevojë për cilësinë e plotë; ngarkohen më shpejt.
    quality: 0.7,
  };

  if (burimi === "kamera") {
    const leja = await ImagePicker.requestCameraPermissionsAsync();
    if (!leja.granted) return "pa_leje";
  }

  const rezultati =
    burimi === "kamera" ? await ImagePicker.launchCameraAsync(opsionet) : await ImagePicker.launchImageLibraryAsync(opsionet);
  if (rezultati.canceled || !rezultati.assets?.[0]) return null;
  const asset = rezultati.assets[0];
  return { uri: asset.uri, mimeType: asset.mimeType ?? "image/jpeg" };
}

function prapashtesa(mimeType: string) {
  return mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
}

// Ngarkon një foto në Storage dhe kthen shtegun brenda bucket-it.
export async function ngarkoNeStorage(bucket: string, dosja: string, foto: Fotoja): Promise<string> {
  const shtegu = `${dosja}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${prapashtesa(foto.mimeType)}`;
  const bajtet = await (await fetch(foto.uri)).arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(shtegu, bajtet, { contentType: foto.mimeType, upsert: false });
  if (error) throw error;
  return shtegu;
}
