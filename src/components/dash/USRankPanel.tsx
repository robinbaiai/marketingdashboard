import { useState } from "react";
import { Panel } from "./Panel";
import { QuoteRow } from "./QuoteRow";
import { usePolling } from "@/hooks/usePolling";
import { api } from "@/lib/api";
import { fmtYuan } from "@/lib/format";

type Tab = "up" | "down" | "amount" | "active";
const TABS: { key: Tab; label: string }[] = [
  { key: "up", label: "涨幅" },
  { key: "down", label: "跌幅" },
  { key: "amount", label: "成交额" },
  { key: "active", label: "活跃" },
];

/** 美股热门榜单 */
export function USRankPanel({ className = "" }: { className?: string }) {
  const [tab, setTab] = useState<Tab>("active");
  const { data, error } = usePolling(() => api.usRank(tab), 10000, [tab]);

  return (
    <Panel
      className={className}
      title="美股热门榜单"
      icon="★"
      accent="#60a5fa"
      expandable
      right={
        <div className="flex items-center gap-1 text-[11px]">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded px-2 py-0.5 ${tab === t.key ? "bg-blue-500/20 text-blue-300" : "text-slate-400 hover:text-slate-200"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="h-full overflow-y-auto p-1.5">
        <div className="flex items-center justify-between px-2 py-1 text-[10px] text-slate-500">
          <span># 名称</span>
          <span>成交额 · 现价</span>
        </div>
        {data?.map((s, i) => (
          <QuoteRow
            key={s.symbol}
            code={s.symbol}
            name={`${s.ticker} ${s.name}`}
            price={s.price}
            pct={s.pct}
            rank={i + 1}
            amount={s.amount > 0 ? fmtYuan(s.amount) : undefined}
            turnover={s.turnover > 0 ? `${s.turnover.toFixed(1)}%` : undefined}
          />
        ))}
        {!data && (
          <div className="p-6 text-center text-[11px] text-slate-600">
            {error ? <span className="text-rose-400/80">美股数据加载失败<br />{error}</span> : "美股数据加载中…"}
          </div>
        )}
      </div>
    </Panel>
  );
}
