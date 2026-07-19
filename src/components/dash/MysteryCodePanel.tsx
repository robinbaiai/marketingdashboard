import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { Panel } from "./Panel";
import { api, type MysteryResult, type MysteryStrategy } from "@/lib/api";
import { clsChg, fmtPct, fmtPrice, fmtYuan } from "@/lib/format";
import { Spinner } from "@/components/ui/spinner";
import { StockLink } from "./StockLink";

const LS_KEY = "dash:mystery-strategies";
const RESULT_CACHE_KEY = "dash:mystery-results";

const DEFAULT_STRATEGIES: MysteryStrategy[] = [
  {
    id: "volume-expansion-fixed",
    name: "固定区间放量",
    query:
      "A股，2026年7月15日至2026年7月17日区间日均成交额除以2026年6月18日至2026年7月16日区间日均成交额大于3，2026年7月15日至2026年7月17日区间日均成交额大于1亿元，2026年7月13日至2026年7月17日区间涨跌幅大于0且小于15%，非ST，非退市，按2026年7月15日至2026年7月17日区间日均成交额除以2026年6月18日至2026年7月16日区间日均成交额从高到低排序",
  },
  {
    id: "volume-expansion-rolling",
    name: "滚动放量",
    query:
      "A股，最近3日区间日均成交额除以前20日区间日均成交额大于3，最近3日区间日均成交额大于1亿元，最近5日区间涨跌幅大于0且小于15%，非ST，非退市，按最近3日区间日均成交额除以前20日区间日均成交额从高到低排序",
  },
];

const TNUM = { fontVariantNumeric: "tabular-nums" } as const;
const TABLE_COLS = {
  base: "62px minmax(96px,1fr) 64px 64px 86px 86px 72px",
  zoom: "72px minmax(112px,1fr) 68px 78px 90px 84px 76px",
};

function loadStrategies(): MysteryStrategy[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    if (Array.isArray(raw) && raw.every((x) => x?.id && x?.name && x?.query)) {
      return raw.map((item) => {
        const defaults = DEFAULT_STRATEGIES.find((strategy) => strategy.id === item.id);
        return defaults ? { ...defaults, name: item.name || defaults.name } : item;
      });
    }
  } catch { /* ignore invalid localStorage */ }
  return DEFAULT_STRATEGIES;
}

function loadResultCache(): Record<string, MysteryResult> {
  try {
    const raw = JSON.parse(localStorage.getItem(RESULT_CACHE_KEY) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

function errorMessage(error?: string | null) {
  if (!error) return "";
  if (error.includes("IWENCAI_QUOTA_EXHAUSTED") || error.includes("次数已用完")) return "问财今日次数已用完，明日恢复或升级权益后可继续刷新。";
  if (error.includes("IWENCAI_AUTH_FAILED")) return "问财鉴权失败，请检查本机 IWENCAI_API_KEY。";
  return error.replace(/^HTTP 502:?\s*/i, "");
}

function ResultTable({ result, loading, error, stale = false, zoom = false }: { result: MysteryResult | null; loading: boolean; error?: string | null; stale?: boolean; zoom?: boolean }) {
  if (loading && !result) {
    return (
      <div className={`flex h-full flex-col items-center justify-center gap-3 text-slate-500 ${zoom ? "text-[18px]" : "text-[11px]"}`}>
        <Spinner className={zoom ? "size-9 text-cyan-300" : "size-5 text-cyan-300"} />
        <span>问财选股中…</span>
      </div>
    );
  }
  if (error && !result) {
    return <div className={`p-6 text-center text-rose-400/80 ${zoom ? "text-[18px]" : "text-[11px]"}`}>问财暂不可用<br />{errorMessage(error)}</div>;
  }
  if (!result) {
    return (
      <div className={`flex h-full items-center justify-center p-6 text-center text-slate-600 ${zoom ? "text-[16px]" : "text-[11px]"}`}>
        选择策略后点击“查询”调用问财；未点击前不会消耗额度。
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`shrink-0 border-b border-slate-700/35 text-slate-500 ${zoom ? "px-4 py-3 text-[14px]" : "px-2 py-1 text-[10px]"}`}>
        同花顺问财 · 共 {result.total} 条
        {stale && <span className="ml-2 text-amber-300/85">显示上次成功缓存 · {errorMessage(error)}</span>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          className={`sticky top-0 z-10 grid gap-2 border-b border-slate-700/35 bg-[#08111f]/95 text-slate-500 backdrop-blur ${zoom ? "px-4 py-2 text-[14px]" : "px-2 py-1 text-[10px]"}`}
          style={{ gridTemplateColumns: zoom ? TABLE_COLS.zoom : TABLE_COLS.base }}
        >
          <span>代码</span><span>名称</span><span className="text-right">现价</span><span className="text-right">涨跌</span><span className="text-right">3日均额</span><span className="text-right">放量倍数</span><span className="text-right">5日涨幅</span>
        </div>
        {result.rows.map((row) => (
          <div
            key={`${row.code}-${row.name}`}
            className={`grid items-center gap-2 border-b border-slate-800/60 transition hover:bg-slate-800/35 ${zoom ? "px-4 py-3 text-[17px]" : "px-2 py-1.5 text-[11px]"}`}
            style={{ gridTemplateColumns: zoom ? TABLE_COLS.zoom : TABLE_COLS.base }}
          >
            <StockLink code={row.code} className="text-slate-500" style={TNUM} />
            <span className="min-w-0 truncate font-semibold text-slate-200">{row.name}</span>
            <span className="text-right text-slate-300" style={TNUM}>{row.price != null ? fmtPrice(row.price) : "—"}</span>
            <span className={`text-right font-semibold ${row.pct != null ? clsChg(row.pct) : "text-slate-600"}`} style={TNUM}>{row.pct != null ? fmtPct(row.pct) : "—"}</span>
            <span className="text-right text-slate-300" style={TNUM}>{row.avgAmount3 != null ? fmtYuan(row.avgAmount3) : "—"}</span>
            <span className="text-right font-semibold text-cyan-300" style={TNUM}>{row.ratio != null ? `${row.ratio.toFixed(2)}x` : "—"}</span>
            <span className={`text-right ${row.rangePct5 != null ? clsChg(row.rangePct5) : "text-slate-600"}`} style={TNUM}>{row.rangePct5 != null ? fmtPct(row.rangePct5) : "—"}</span>
          </div>
        ))}
        {result.rows.length === 0 && (
          <div className={`p-6 text-center text-slate-600 ${zoom ? "text-[16px]" : "text-[11px]"}`}>该策略暂无结果，可尝试放宽条件。</div>
        )}
      </div>
    </div>
  );
}

export function MysteryCodePanel({ className = "" }: { className?: string }) {
  const [strategies, setStrategies] = useState<MysteryStrategy[]>(loadStrategies);
  const [resultCache, setResultCache] = useState<Record<string, MysteryResult>>(loadResultCache);
  const [selectedId, setSelectedId] = useState(() => loadStrategies()[0]?.id || DEFAULT_STRATEGIES[0].id);
  const [draft, setDraft] = useState(DEFAULT_STRATEGIES[1].query);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [result, setResult] = useState<MysteryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(0);
  const selected = strategies.find((s) => s.id === selectedId) || strategies[0] || DEFAULT_STRATEGIES[0];
  const query = selected?.query || DEFAULT_STRATEGIES[0].query;
  const activeResult = result?.query === query ? result : null;
  const cachedResult = resultCache[selected?.id || ""]?.query === query ? resultCache[selected?.id || ""] : null;
  const visibleResult = activeResult || (error ? cachedResult : null);
  const isLoading = loading && !visibleResult;

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(strategies));
  }, [strategies]);

  const runQuery = async () => {
    if (!selected || loading) return;
    setLoading(true);
    setError(null);
    try {
      const next = await api.mysterySelect(query, 30);
      setResult(next);
      setUpdated(Date.now());
      setResultCache((cache) => {
        const updatedCache = { ...cache, [selected.id]: next };
        localStorage.setItem(RESULT_CACHE_KEY, JSON.stringify(updatedCache));
        return updatedCache;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const addStrategy = () => {
    const queryText = draft.trim();
    if (!queryText) return;
    const next: MysteryStrategy = {
      id: `strategy-${Date.now()}`,
      name: `策略 ${strategies.length + 1}`,
      query: queryText,
    };
    setStrategies((items) => [...items, next]);
    setSelectedId(next.id);
  };

  const selectStrategy = (strategy: MysteryStrategy) => {
    setSelectedId(strategy.id);
    setDraft(strategy.query);
    setError(null);
  };

  const startRename = (strategy: MysteryStrategy, surface: string) => {
    selectStrategy(strategy);
    setEditingKey(`${surface}:${strategy.id}`);
    setEditingName(strategy.name);
  };

  const commitRename = (id: string) => {
    const name = editingName.trim();
    setStrategies((items) =>
      items.map((strategy, index) =>
        strategy.id === id ? { ...strategy, name: name || `策略 ${index + 1}` } : strategy
      )
    );
    setEditingKey(null);
    setEditingName("");
  };

  const removeStrategy = (id: string) => {
    setStrategies((items) => {
      const next = items.filter((s) => s.id !== id);
      if (selectedId === id) {
        const fallback = next[0] || DEFAULT_STRATEGIES[0];
        setSelectedId(fallback.id);
        setDraft(fallback.query);
      }
      return next.length ? next : DEFAULT_STRATEGIES;
    });
  };

  const controls = (zoom = false) => (
    <span className="flex items-center gap-2">
      <span className={`text-slate-500 ${zoom ? "text-[14px]" : "text-[10px]"}`}>
        {updated ? `更新 ${new Date(updated).toLocaleTimeString("zh-CN", { hour12: false })}` : cachedResult ? "缓存" : "手动查询"}
      </span>
      <button
        type="button"
        onClick={runQuery}
        disabled={loading}
        className={`rounded border border-cyan-500/25 bg-cyan-500/10 font-semibold text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20 disabled:cursor-wait disabled:opacity-60 ${
          zoom ? "px-2.5 py-1 text-[13px]" : "px-1.5 py-0.5 text-[10px]"
        }`}
      >
        {loading ? "查询中" : "查询"}
      </button>
    </span>
  );

  const content = (zoom = false) => (
    <div className="flex h-full min-h-0">
      <div className={`${zoom ? "w-[32%] p-4" : "w-[38%] p-2"} flex shrink-0 flex-col border-r border-slate-700/40`}>
        <div className={`mb-2 font-semibold text-slate-300 ${zoom ? "text-[18px]" : "text-[11px]"}`}>策略库</div>
        <div className={`min-h-0 space-y-1 overflow-y-auto ${zoom ? "flex-1" : "shrink-0"}`}>
          {strategies.map((strategy) => {
            const active = strategy.id === selected?.id;
            const surface = zoom ? "dialog" : "panel";
            const editing = editingKey === `${surface}:${strategy.id}`;
            return (
            <div
              key={strategy.id}
              title={strategy.query}
              className={`group w-full rounded border text-left transition ${zoom ? "px-3 py-2.5" : "px-2 py-1.5"} ${
                active ? "border-cyan-500/50 bg-cyan-500/10" : "border-slate-700/30 bg-slate-800/15 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    startRename(strategy, surface);
                  }}
                  className={`flex shrink-0 items-center justify-center rounded border transition focus:border-cyan-500/50 focus:text-cyan-300 focus:outline-none ${
                    zoom ? "h-8 w-8" : "h-6 w-6"
                  } ${
                    active
                      ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-300"
                      : "border-transparent text-slate-600 hover:border-cyan-500/35 hover:bg-cyan-500/10 hover:text-cyan-300"
                  }`}
                  title="编辑策略名称"
                  aria-label={`编辑 ${strategy.name}`}
                >
                  <Pencil className={zoom ? "size-4" : "size-3.5"} />
                </button>
                {editing ? (
                  <input
                    value={editingName}
                    autoFocus
                    onFocus={(event) => event.currentTarget.select()}
                    onChange={(event) => setEditingName(event.target.value)}
                    onBlur={() => commitRename(strategy.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.currentTarget.blur();
                      if (event.key === "Escape") {
                        setEditingName(strategy.name);
                        event.currentTarget.blur();
                      }
                    }}
                    className={`min-w-0 flex-1 truncate rounded border border-cyan-400/50 bg-slate-950/40 px-1 py-0.5 font-semibold text-slate-200 outline-none ${zoom ? "text-[16px]" : "text-[12px]"}`}
                    aria-label="策略名称"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => selectStrategy(strategy)}
                    className={`min-w-0 flex-1 truncate px-1 py-0.5 text-left font-semibold text-slate-200 outline-none ${zoom ? "text-[16px]" : "text-[12px]"}`}
                  >
                    {strategy.name}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeStrategy(strategy.id)}
                  className={`shrink-0 text-slate-600 outline-none hover:text-rose-400 focus:text-rose-400 ${zoom ? "text-[16px]" : "text-[10px]"}`}
                >
                  删除
                </button>
              </div>
            </div>
            );
          })}
        </div>
        <div className={`${zoom ? "mt-3" : "mt-2"} shrink-0 border-t border-slate-700/35 pt-2`}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className={`h-20 w-full resize-none rounded border border-slate-700/50 bg-slate-900/50 p-2 text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-500/60 ${zoom ? "text-[14px]" : "text-[10px]"}`}
            placeholder="输入问财选股条件"
          />
          <button
            type="button"
            onClick={addStrategy}
            className={`mt-1 w-full rounded bg-cyan-500/20 font-semibold text-cyan-300 hover:bg-cyan-500/30 ${zoom ? "py-2 text-[15px]" : "py-1 text-[11px]"}`}
          >
            添加策略
          </button>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <ResultTable result={visibleResult} loading={isLoading} error={error} stale={!activeResult && Boolean(visibleResult && error)} zoom={zoom} />
      </div>
    </div>
  );

  return (
    <Panel
      className={className}
      title="神秘代码"
      icon="⌘"
      accent="#22d3ee"
      expandable
      expandedChildren={content(true)}
      expandedRight={controls(true)}
      right={controls()}
    >
      {content()}
    </Panel>
  );
}
