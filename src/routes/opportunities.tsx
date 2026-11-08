import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, moduleHead } from "@/components/data/ModulePage";

export const Route = createFileRoute("/opportunities")({
  head: () => moduleHead("/opportunities"),
  component: () => <ModulePage path="/opportunities" />,
});