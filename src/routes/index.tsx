import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { AccessGate } from "@/components/data/AccessGate";
import { StateNotice } from "@/components/common/StateNotice";

const KPIS = [
  "المنشآت النشطة",
  "زيارات هذا الأسبوع",
  "الفرص المؤهلة",
  "قيمة العروض",
  "قيمة المبيعات",
  "متابعات متأخرة",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نظرة عامة | لحج زيوت" },
      { name: "description", content: "لوحة المبيعات الميدانية لزيوت لحج" },
      { property: "og:title", content: "لحج زيوت | Lahj Oil Field Sales" },
      { property: "og:description", content: "لوحة المبيعات الميدانية لزيوت لحج" },
    ],
  }),
  component: Overview,
});

function Overview() {
  return (
    <div>
      <PageHeader
        title="نظرة عامة"
        en="Overview"
        description="مؤشرات الأداء — تظهر القيم فقط بعد الربط بقاعدة البيانات"
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {KPIS.map((k) => (
          <div key={k} className="glass-panel p-3 animate-rise">
            <div className="text-xs text-muted-foreground">{k}</div>
            <div className="mt-1 text-lg font-semibold text-muted-foreground">—</div>
          </div>
        ))}
      </div>
      <div className="glass-panel">
        <AccessGate>
          <StateNotice kind="empty" title="لا توجد سجلات بعد">
            ستُحسب المؤشرات من الجداول الفعلية بعد التحقق من المخطط.
          </StateNotice>
        </AccessGate>
      </div>
    </div>
  );
}
