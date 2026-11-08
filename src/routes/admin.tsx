import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, moduleHead } from "@/components/data/ModulePage";

export const Route = createFileRoute("/admin")({
  head: () => moduleHead("/admin"),
  component: () => <ModulePage path="/admin" />,
});