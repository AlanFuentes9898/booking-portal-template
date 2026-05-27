"use client";

import { useState } from "react";
import { formatAmount } from "@/components/admin/payment-badge";

type Bucket = { label: string; key: string; total: number };

export function RevenueBarChart({
  data,
  currency,
}: {
  data: Bucket[];
  currency: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = data.reduce((m, d) => (d.total > m ? d.total : m), 0);
  const safeMax = max > 0 ? max : 1;

  return (
    <div>
      <div className="flex items-end gap-1.5 h-48">
        {data.map((d, i) => {
          const h = (d.total / safeMax) * 100;
          const isHover = hover === i;
          return (
            <div
              key={d.key}
              className="flex-1 flex flex-col items-center justify-end relative group min-w-0"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {isHover && d.total > 0 && (
                <div className="absolute -top-1 -translate-y-full z-10 whitespace-nowrap rounded-md bg-[color:var(--color-brand-ink)] px-2 py-1 text-[11px] text-white shadow-lg">
                  {formatAmount(d.total, currency)}
                </div>
              )}
              <div
                className={`w-full rounded-t-md transition-colors ${
                  isHover
                    ? "bg-[color:var(--color-brand-pink)]"
                    : "bg-[color:var(--color-brand-green)]"
                }`}
                style={{ height: `${Math.max(h, d.total > 0 ? 4 : 0)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-2">
        {data.map((d, i) => (
          <div
            key={d.key}
            className="flex-1 text-center text-[10px] text-[color:var(--color-brand-muted)] tabular-nums min-w-0 truncate"
            style={{
              opacity: data.length > 16 && i % 2 !== 0 ? 0 : 1,
            }}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
