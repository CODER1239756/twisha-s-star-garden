import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { GardenCanvas } from "@/garden/GardenCanvas";
import { useGarden } from "@/garden/store";
import { EntryScreen, GardenOverlay } from "@/garden/ui/GardenUI";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Twisha's Garden — plant a thought, watch it bloom" },
      { name: "description", content: "A cinematic little garden where every thought you write becomes a living flower." },
      { property: "og:title", content: "Twisha's Garden" },
      { property: "og:description", content: "Plant a thought and watch it grow from seed to bloom." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Garden,
});

function Garden() {
  const hydrated = useGarden((s) => s.hydrated);
  const hydrate = useGarden((s) => s.hydrate);
  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);
  return (
    <main className="fixed inset-0 overflow-hidden bg-background">
      {hydrated && <GardenCanvas />}
      <GardenOverlay />
      <EntryScreen />
    </main>
  );
}
