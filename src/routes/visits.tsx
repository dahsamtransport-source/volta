import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, moduleHead } from "@/components/data/ModulePage";
import { VisitCapture } from "@/components/data/VisitCapture";

export const Route = createFileRoute("/visits")({
  head: () => moduleHead("/visits"),
  component: () => <ModulePage path="/visits" extra={<VisitCapture />} />,
});
