"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";

const TABS = [
  { id: "", label: "Svi" },
  { id: "GK", label: "GK" },
  { id: "DF", label: "DF" },
  { id: "MF", label: "MF" },
  { id: "FW", label: "FW" },
] as const;

export function PositionFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const active = searchParams.get("pos") ?? "";

  const select = useCallback(
    (pos: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (pos) {
        params.set("pos", pos);
      } else {
        params.delete("pos");
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => select(tab.id)}
          className={`position-pill ${active === tab.id ? "position-pill-active" : ""}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
