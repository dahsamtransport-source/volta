import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, moduleHead } from "@/components/data/ModulePage";
import { LineItemsGrid } from "@/components/data/LineItemsGrid";

export const Route = createFileRoute("/sales")({
  head: () => moduleHead("/sales"),
  component: () => <ModulePage path="/sales" extra={<LineItemsGrid />} />,
});