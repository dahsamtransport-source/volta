import type { ReactNode } from "react";
import { useSession } from "@/data/session";
import { can, type Capability } from "@/lib/auth/roles";
import { KEY_REASON_TEXT } from "@/lib/config";
import { StateNotice } from "@/components/common/StateNotice";

/** Fail-closed gate: renders children only with a valid key, a signed-in user and a trusted role. */
export function AccessGate({
  requires = "view",
  children,
}: {
  requires?: Capability;
  children: ReactNode;
}) {
  const { keyCheck, loading, access } = useSession();
  if (!keyCheck.ok)
    return (
      <StateNotice kind="setup" title="لم يتم ربط قاعدة البيانات بعد">
        {KEY_REASON_TEXT[keyCheck.reason]} لا تُعرض أي بيانات حتى يكتمل الإعداد.
      </StateNotice>
    );
  if (loading) return <StateNotice kind="loading" title="جارٍ التحقق من الجلسة…" />;
  if (access.status === "signed_out")
    return (
      <StateNotice kind="setup" title="يلزم تسجيل الدخول">
        سجّل الدخول من صفحة الإعداد للوصول إلى البيانات.
      </StateNotice>
    );
  if (access.status === "no_role")
    return (
      <StateNotice kind="denied" title="لا يوجد دور مسند لحسابك">
        يجب أن يضبط المدير field_sales_role في app_metadata.
      </StateNotice>
    );
  if (access.status === "invalid_claims")
    return (
      <StateNotice kind="denied" title="صلاحيات الحساب غير صالحة">
        {access.detail}
      </StateNotice>
    );
  if (!can(access, requires))
    return <StateNotice kind="denied" title="ليست لديك صلاحية لهذه الشاشة" />;
  return <>{children}</>;
}
