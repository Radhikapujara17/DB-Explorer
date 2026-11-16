import { createFileRoute } from "@tanstack/react-router";
import { AppContent } from "../App";

export const Route = createFileRoute("/aggregation")({
  head: () => ({
    meta: [
      { title: "Aggregation Pipeline Visualizer — MongoLens Studio" },
      {
        name: "description",
        content:
          "Multi-stage MongoDB aggregation pipeline studio with live stage inspector, analytics chart visualization, and JSON query export in MongoLens.",
      },
      { property: "og:title", content: "Aggregation Pipeline Visualizer — MongoLens Studio" },
      {
        property: "og:description",
        content:
          "Build and test multi-stage MongoDB aggregation pipelines with real-time stage outputs, analytics charts, and BSON inspector.",
      },
      { property: "og:image", content: "/og-image.svg" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AggregationPageRoute,
});

function AggregationPageRoute() {
  return <AppContent initialMode="aggregation" />;
}
