import { QueryClient } from "@tanstack/react-query";

export const klientiIQuery = new QueryClient({
  defaultOptions: {
    queries: {
      // Të dhënat konsiderohen të freskëta për 1 minutë; pastaj rifreskohen në sfond.
      staleTime: 60_000,
      retry: 1,
    },
  },
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
