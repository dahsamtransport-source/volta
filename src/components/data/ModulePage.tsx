import type { ReactNode } from "react";
import { MODULES, type ModuleDef } from "@/app/modules";
import { PageHeader } from "@/components/common/PageHeader";
import { AccessGate } from "./AccessGate";
import { TableScreen } from "./TableScreen";

export function ModulePage({ path, extra }: { path: ModuleDef["path"]; extra?: ReactNode }) {
  const m = MODULES.find((x) => x.path === path)!;
  return (
    <div>
      <PageHeader title={m.label} en={m.en} description={m.description} />
      <AccessGate requires={m.requires ?? "view"}>
        <div className="space-y-4">
          {m.table && <TableScreen table={m.table} emptyLabel={`لا توجد سجلات ${m.label} بعد`} />}
          {extra}
        </div>
      </AccessGate>
    </div>
  );
}

export function moduleHead(path: ModuleDef["path"]) {
  const m = MODULES.find((x) => x.path === path)!;
  const title = `${m.label} | لحج زيوت`;
  return {
    meta: [
      { title },
      { name: "description", content: m.description },
      { property: "og:title", content: title },
      { property: "og:description", content: m.description },
    ],
  };
}