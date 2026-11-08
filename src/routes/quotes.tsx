import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, moduleHead } from "@/components/data/ModulePage";
import { LineItemsGrid } from "@/components/data/LineItemsGrid";

export const Route = createFileRoute("/quotes")({
  head: () => moduleHead("/quotes"),
  component: () => <ModulePage path="/quotes" extra={<LineItemsGrid />} />,
});