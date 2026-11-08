import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, moduleHead } from "@/components/data/ModulePage";

export const Route = createFileRoute("/representatives")({
  head: () => moduleHead("/representatives"),
  component: () => <ModulePage path="/representatives" />,
});