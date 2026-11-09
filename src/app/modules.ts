import {
  LayoutDashboard,
  Store,
  MapPinned,
  Users,
  CalendarCheck,
  Target,
  Package,
  FileText,
  Receipt,
  RefreshCw,
  ScrollText,
  BarChart3,
  ShieldCheck,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import type { FieldSalesTable } from "@/data/client";
import type { Capability } from "@/lib/auth/roles";

export interface ModuleDef {
  path:
    | "/"
    | "/establishments"
    | "/districts"
    | "/representatives"
    | "/visits"
    | "/opportunities"
    | "/products"
    | "/quotes"
    | "/sales"
    | "/sync"
    | "/audit"
    | "/reports"
    | "/admin"
    | "/setup";
  label: string;
  en: string;
  icon: LucideIcon;
  group: "ops" | "catalog" | "system";
  table?: FieldSalesTable;
  requires?: Capability;
  description: string;
}

export const MODULES: ModuleDef[] = [
  {
    path: "/",
    label: "نظرة عامة",
    en: "Overview",
    icon: LayoutDashboard,
    group: "ops",
    description: "مؤشرات الأداء الميدانية",
  },
  {
    path: "/establishments",
    label: "المنشآت",
    en: "Establishments",
    icon: Store,
    group: "ops",
    table: "establishments",
    description: "إدارة علاقات المنشآت والعملاء",
  },
  {
    path: "/visits",
    label: "الزيارات",
    en: "Visits",
    icon: CalendarCheck,
    group: "ops",
    table: "visits",
    description: "تخطيط وتسجيل الزيارات الميدانية",
  },
  {
    path: "/opportunities",
    label: "الفرص",
    en: "Opportunities",
    icon: Target,
    group: "ops",
    table: "opportunities",
    description: "مسار الفرص البيعية",
  },
  {
    path: "/quotes",
    label: "عروض الأسعار",
    en: "Quotes",
    icon: FileText,
    group: "ops",
    table: "quotes",
    description: "عروض الأسعار وبنودها",
  },
  {
    path: "/sales",
    label: "المبيعات",
    en: "Sales",
    icon: Receipt,
    group: "ops",
    table: "sales",
    requires: "view",
    description: "المبيعات وسير التأكيد",
  },
  {
    path: "/districts",
    label: "المديريات",
    en: "Districts",
    icon: MapPinned,
    group: "catalog",
    table: "districts",
    description: "مديريات محافظة لحج",
  },
  {
    path: "/representatives",
    label: "المندوبون",
    en: "Representatives",
    icon: Users,
    group: "catalog",
    table: "representatives",
    description: "المندوبون وتوزيع المديريات",
  },
  {
    path: "/products",
    label: "المنتجات",
    en: "Products",
    icon: Package,
    group: "catalog",
    table: "products",
    description: "كتالوج الزيوت والمنتجات",
  },
  {
    path: "/reports",
    label: "التقارير",
    en: "Reports",
    icon: BarChart3,
    group: "system",
    description: "تقارير الأداء",
  },
  {
    path: "/sync",
    label: "مركز المزامنة",
    en: "Sync center",
    icon: RefreshCw,
    group: "system",
    table: "sync_events",
    description: "قائمة الانتظار والتعارضات",
  },
  {
    path: "/audit",
    label: "سجل التدقيق",
    en: "Audit log",
    icon: ScrollText,
    group: "system",
    table: "audit_log",
    requires: "view_audit",
    description: "العمليات الحساسة",
  },
  {
    path: "/admin",
    label: "المستخدمون والأدوار",
    en: "Users & roles",
    icon: ShieldCheck,
    group: "system",
    requires: "admin_users",
    description: "إدارة الصلاحيات (للمدير فقط)",
  },
  {
    path: "/setup",
    label: "الإعداد والاتصال",
    en: "Setup",
    icon: Settings2,
    group: "system",
    description: "حالة الاتصال والأمان",
  },
];

export const GROUP_LABEL = {
  ops: "العمليات",
  catalog: "البيانات الأساسية",
  system: "النظام",
} as const;
