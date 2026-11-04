import { createFileRoute } from "@tanstack/react-router";
import { AppContent } from "../App";
import { ConnectionProvider } from "../context/ConnectionContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Database Explorer — High-Performance MongoDB Studio & AI Query Assistant" },
      {
        name: "description",
        content:
          "High-performance visual MongoDB studio: connection profiles, schema discovery, index inspector, visual query builder, aggregation pipeline visualizer, and Gemini AI query assistant.",
      },
      { property: "og:title", content: "Database Explorer — MongoDB Studio & AI Query Assistant" },
      {
        property: "og:description",
        content:
          "Explore MongoDB visually: connection profiles, schema discovery, index inspector, visual query builder, aggregation pipeline visualizer, and an AI natural-language query assistant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudioApp,
});

function StudioApp() {
  return (
    <ConnectionProvider>
      <AppContent />
    </ConnectionProvider>
  );
}
