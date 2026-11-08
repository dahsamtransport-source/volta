import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, moduleHead } from "@/components/data/ModulePage";

export const Route = createFileRoute("/districts")({
  head: () => moduleHead("/districts"),
  component: () => <ModulePage path="/districts" />,
});