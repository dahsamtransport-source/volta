import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, moduleHead } from "@/components/data/ModulePage";

export const Route = createFileRoute("/audit")({
  head: () => moduleHead("/audit"),
  component: () => <ModulePage path="/audit" />,
});
