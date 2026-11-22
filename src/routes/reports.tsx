import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, moduleHead } from "@/components/data/ModulePage";

export const Route = createFileRoute("/reports")({
  head: () => moduleHead("/reports"),
  component: () => <ModulePage path="/reports" />,
});
