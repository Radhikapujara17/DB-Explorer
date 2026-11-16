import { createFileRoute } from "@tanstack/react-router";
import { AppContent } from "../App";

export const Route = createFileRoute("/aggregation")({
  head: () => ({
    meta: [
      { title: "Aggregation Pipeline Visualizer — DB Explorer" },
      {
        name: "description",
        content: "Multi-stage MongoDB aggregation pipeline builder with live stage inspector and analytics visualization.",
      },
    ],
  }),
  component: AggregationPageRoute,
});

function AggregationPageRoute() {
  return <AppContent initialMode="aggregation" />;
}
