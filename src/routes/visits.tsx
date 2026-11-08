import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, moduleHead } from "@/components/data/ModulePage";

export const Route = createFileRoute("/visits")({
  head: () => moduleHead("/visits"),
  component: () => <ModulePage path="/visits" />,
});