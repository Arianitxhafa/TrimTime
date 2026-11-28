import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import "../lib/lidhja";

// Sa kohë ruhen të dhënat në telefon për t'u shfaqur pa internet.
export const MOSHA_E_CACHE = 24 * 60 * 60 * 1000;

export const klientiIQuery = new QueryClient({
  defaultOptions: {
    queries: {
      // Të dhënat konsiderohen të freskëta për 1 minutë; pastaj rifreskohen në sfond.
      staleTime: 60_000,
      // Mbahen një ditë, që pa internet aplikacioni të tregojë të fundit që janë parë.
      gcTime: MOSHA_E_CACHE,
      retry: 1,
    },
    mutations: {
      // Pa internet veprimi dështon menjëherë me mesazh, në vend që butoni të mbetet duke pritur.
      networkMode: "always",
    },
  },
});

// Cache-i ruhet në telefon (AsyncStorage) dhe rikthehet kur hapet aplikacioni, edhe offline.
export const ruajtesiICache = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "studioburimi.cache.v1",
  throttleTime: 1000,
});

// Çelësat e cache-it në një vend, që invalidimi të jetë i saktë.
export const celesat = {
  lokaliIm: (perdoruesiId: string | undefined) => ["lokali-im", perdoruesiId] as const,
  lokali: (id: string) => ["lokali", id] as const,
  lokaletPrane: (parametrat: object) => ["lokalet-prane", parametrat] as const,
  sherbimet: (lokaliId: string) => ["sherbimet", lokaliId] as const,
  orari: (lokaliId: string) => ["orari", lokaliId] as const,
  stafi: (lokaliId: string) => ["stafi", lokaliId] as const,
};
