import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, moduleHead } from "@/components/data/ModulePage";

export const Route = createFileRoute("/products")({
  head: () => moduleHead("/products"),
  component: () => <ModulePage path="/products" />,
});
