import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, moduleHead } from "@/components/data/ModulePage";

export const Route = createFileRoute("/sync")({
  head: () => moduleHead("/sync"),
  component: () => <ModulePage path="/sync" />,
});
