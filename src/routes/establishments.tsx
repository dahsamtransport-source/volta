import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, moduleHead } from "@/components/data/ModulePage";

export const Route = createFileRoute("/establishments")({
  head: () => moduleHead("/establishments"),
  component: () => <ModulePage path="/establishments" />,
});
