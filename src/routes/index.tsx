import { createFileRoute } from "@tanstack/react-router";
import { OverviewDashboard } from "@/components/dashboard/OverviewDashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم | VOLTA" },
      { name: "description", content: "لوحة تشغيل ومؤشرات المبيعات الميدانية في لحج" },
      { property: "og:title", content: "VOLTA | لوحة العمليات الميدانية" },
      { property: "og:description", content: "متابعة المنشآت والزيارات والفرص والمبيعات من لوحة موحدة." },
    ],
  }),
  component: OverviewDashboard,
});
