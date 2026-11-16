import { createFileRoute } from "@tanstack/react-router";
import { AppContent } from "../App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MongoLens — Next-Gen MongoDB Web GUI, Query Studio & Compass Alternative" },
      {
        name: "description",
        content:
          "MongoLens is a high-performance web-based MongoDB GUI and query studio. Features in-line editing, aggregation pipeline visualizer, BSON type badges, schema discovery, and AI natural language query assistant.",
      },
      { property: "og:title", content: "MongoLens — Next-Gen MongoDB Web GUI & Query Studio" },
      {
        property: "og:description",
        content:
          "Explore MongoDB visually with MongoLens: in-line spreadsheet editing, visual query builder, multi-stage aggregation pipeline visualizer, and Gemini AI query copilot.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-image.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/og-image.svg" },
    ],
    links: [
      { rel: "canonical", href: "https://mongolens.dev/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "MongoLens",
          alternateName: "MongoLens Studio",
          operatingSystem: "All (Web Browser)",
          applicationCategory: "DeveloperApplication",
          description:
            "High-performance web-based MongoDB GUI and query studio featuring visual query building, aggregation pipeline visualization, in-line table editing, and Gemini AI query copilot.",
          url: "https://mongolens.dev/",
          image: "https://mongolens.dev/og-image.svg",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          featureList: [
            "Web-Based MongoDB GUI & Compass Alternative",
            "Visual Query Builder with Relaxed Shell Syntax",
            "Multi-Stage Aggregation Pipeline Visualizer",
            "In-Line Spreadsheet-Style Table Cell Editing",
            "AI Natural Language Query Assistant",
            "Interactive Schema Discovery & Type Badges",
            "CSV, NDJSON, and JSON Array Export/Import",
            "Zero-FOUC Multi-Theme System",
          ],
        }),
      },
    ],
  }),
  component: StudioApp,
});

function StudioApp() {
  return <AppContent initialMode="explorer" />;
}
