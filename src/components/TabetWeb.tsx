import { Tabs } from "expo-router";
import { useTema } from "../context/TemaContext";
import Ikona, { type EmriIkones } from "./Ikona";

export type TabiWeb = { emri: string; titulli: string; ikona: EmriIkones; numri?: number };

// Në web nuk ka shirit native tab-esh: këtu përdoret shiriti i zakonshëm poshtë, me të njëjtat tab-e.
export default function TabetWeb({ tabet }: { tabet: TabiWeb[] }) {
  const { ngjyrat } = useTema();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ngjyrat.ari,
        tabBarInactiveTintColor: ngjyrat.tekstiZbehte,
        tabBarStyle: { backgroundColor: ngjyrat.siperfaqja, borderTopColor: ngjyrat.kufiri },
        sceneStyle: { backgroundColor: ngjyrat.sfondi },
      }}
    >
      {tabet.map((tab) => (
        <Tabs.Screen
          key={tab.emri}
          name={tab.emri}
          options={{
            title: tab.titulli,
            tabBarBadge: tab.numri ? tab.numri : undefined,
            tabBarIcon: ({ color }) => <Ikona emri={tab.ikona} madhesia={22} ngjyra={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
