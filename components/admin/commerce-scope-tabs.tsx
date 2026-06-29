import Link from "next/link";
import type { Route } from "next";

import type { CommerceScope } from "@/lib/admin/commerce-filters";

export function CommerceScopeTabs({
  basePath,
  currentScope,
  tabs,
  query
}: {
  basePath: Route;
  currentScope: CommerceScope;
  tabs: Array<{ value: CommerceScope; label: string }>;
  query?: string;
}) {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="admin-scope-tabs">
      {tabs.map((tab) => {
        const params = new URLSearchParams();
        if (tab.value !== "production") {
          params.set("scope", tab.value);
        }
        if (query) {
          params.set("q", query);
        }
        const href = params.toString() ? `${basePath}?${params.toString()}` : basePath;

        return (
          <Link
            key={tab.value}
            className={currentScope === tab.value ? "admin-scope-tab active" : "admin-scope-tab"}
            href={href as Route}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
