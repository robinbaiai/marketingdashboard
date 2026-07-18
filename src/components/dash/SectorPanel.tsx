import { useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "./Panel";
import { QuoteRow } from "./QuoteRow";
import { usePolling } from "@/hooks/usePolling";
import { api, type Board } from "@/lib/api";
import { clsChg, fmtPct, fmtYuan, hexChg } from "@/lib/format";

type Kind = "01" | "02";

/** 成分股轮播间隔(ms) */
const ROTATE_MS = 10000;

function BoardRow({ b, maxAbs, active, onClick, zoom = false }: { b: Board; maxAbs: number; active: boolean; onClick: () => void; zoom?: boolean }) {
  const w = maxAbs > 0 ? Math.min(100, (Math.abs(b.pct) / maxAbs) * 100) : 0;
  const ref = useRef<HTMLButtonElement>(null);
  // 轮播/选中时滚动到可视区域
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [active]);
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`group grid w-full items-center rounded text-left transition-colors ${
        active ? "bg-cyan-500/10 ring-1 ring-cyan-500/40" : "hover:bg-slate-800/40"
      }`}
      style={{
        gridTemplateColumns: zoom ? "72px minmax(190px,1fr) 120px 190px" : "24px minmax(0,1fr) 76px 96px",
        gap: zoom ? 16 : 8,
        padding: zoom ? "10px 12px" : "5px 8px",
      }}
    >
      <span className={zoom ? "text-[18px] text-slate-500" : "text-[10px] text-slate-600"}>{b.code.slice(-4)}</span>
      <span className="min-w-0">
        <span className={`block truncate text-slate-200 group-hover:text-cyan-300 ${zoom ? "text-[20px] font-semibold leading-7" : "text-[12px]"}`}>{b.name}</span>
        <span className={`${zoom ? "mt-2 h-2" : "mt-0.5 h-1"} block rounded-full bg-slate-800`}>
          <span className={`${zoom ? "h-2" : "h-1"} block rounded-full transition-all`} style={{ width: `${w}%`, background: hexChg(b.pct) }} />
        </span>
      </span>
      <span className={`text-right font-semibold ${zoom ? "text-[22px]" : "text-[12px]"} ${clsChg(b.pct)}`} style={{ fontVariantNumeric: "tabular-nums" }}>
        {fmtPct(b.pct)}
      </span>
      <span className={`truncate text-right text-slate-400 ${zoom ? "text-[18px]" : "text-[11px]"}`}>
        {b.leadName} <span className={clsChg(b.leadPct)}>{fmtPct(b.leadPct)}</span>
      </span>
    </button>
  );
}

export function SectorPanel({ className = "" }: { className?: string }) {
  const [kind, setKind] = useState<Kind>("01");
  const [dir, setDir] = useState<0 | 1>(0);
  const [selected, setSelected] = useState<Board | null>(null);
  const [q, setQ] = useState("");
  // 轮播: 默认开启, 手动点击板块后暂停
  const [auto, setAuto] = useState(true);
  const [idx, setIdx] = useState(0);

  // 全量拉取(行业 124 / 概念 ~800), 前端本地搜索过滤
  const { data: boards, error } = usePolling(() => api.boards(kind, dir, kind === "01" ? 300 : 1000), 15000, [kind, dir]);
  const { data: stocks } = usePolling(
    () => (selected ? api.boardStocks(selected.code, 300) : Promise.resolve(null)),
    15000,
    [selected?.code]
  );

  const filtered = useMemo(() => boards?.filter((b) => !q || b.name.includes(q)), [boards, q]);
  const maxAbs = filtered ? Math.max(...filtered.map((b) => Math.abs(b.pct)), 0.01) : 1;

  // 榜单/搜索变化时回到第一个板块
  useEffect(() => setIdx(0), [kind, dir, q]);
  // 定时推进轮播索引
  useEffect(() => {
    if (!auto || !filtered?.length) return;
    const t = window.setInterval(() => setIdx((i) => i + 1), ROTATE_MS);
    return () => window.clearInterval(t);
  }, [auto, filtered?.length]);
  // 轮播模式下同步选中项
  useEffect(() => {
    if (!auto || !filtered?.length) return;
    const next = filtered[idx % filtered.length];
    setSelected((current) => (current?.code === next.code ? current : next));
  }, [auto, idx, filtered]);

  const pick = (b: Board) => {
    setAuto(false);
    setSelected(selected?.code === b.code && !auto ? null : b);
  };

  const controls = (zoom = false) => (
    <div className={`flex items-center gap-1 ${zoom ? "text-[14px]" : "text-[11px]"}`}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索板块"
        className={`rounded border border-slate-700/50 bg-slate-800/40 px-1.5 py-0.5 text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-500/50 ${zoom ? "w-32 text-[14px]" : "w-20 text-[11px]"}`}
      />
      <button
        onClick={() => setAuto((a) => !a)}
        title={auto ? `轮播中(${ROTATE_MS / 1000}s),点击暂停` : "已暂停,点击恢复轮播"}
        className={`rounded px-2 py-0.5 ${auto ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-slate-200"}`}
      >
        轮播
      </button>
      {([["01", "行业"], ["02", "概念"]] as [Kind, string][]).map(([k, label]) => (
        <button
          key={k}
          onClick={() => { setKind(k); setAuto(true); }}
          className={`rounded px-2 py-0.5 ${kind === k ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-slate-200"}`}
        >
          {label}
        </button>
      ))}
      <span className="mx-1 h-3 w-px bg-slate-700" />
      {([0, 1] as const).map((d) => (
        <button
          key={d}
          onClick={() => setDir(d)}
          className={`rounded px-2 py-0.5 ${dir === d ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:text-slate-200"}`}
        >
          {d === 0 ? "领涨" : "领跌"}
        </button>
      ))}
    </div>
  );

  const content = (zoom = false) => (
    <div className="flex h-full min-h-0">
      {/* 板块列表 */}
      <div className={`min-w-0 flex-1 overflow-y-auto [overflow-anchor:none] ${zoom ? "p-4" : "p-1.5"}`}>
        <div
          className={`grid text-slate-500 ${zoom ? "px-3 py-2 text-[18px]" : "gap-2 px-2 py-1 text-[10px]"}`}
          style={{
            gridTemplateColumns: zoom ? "72px minmax(190px,1fr) 120px 190px" : "24px minmax(0,1fr) 76px 96px",
            gap: zoom ? 16 : 8,
          }}
        >
          <span>代码</span>
          <span>板块 / 强度{filtered ? ` (${filtered.length})` : ""}</span>
          <span className="text-right">涨跌幅</span>
          <span className="text-right">领涨股</span>
        </div>
        {filtered?.map((b) => (
          <BoardRow key={b.code} b={b} maxAbs={maxAbs} active={selected?.code === b.code}
            onClick={() => pick(b)} zoom={zoom} />
        ))}
        {!filtered && (
          <div className={`p-6 text-center text-slate-600 ${zoom ? "text-[16px]" : "text-[11px]"}`}>
            {error ? <span className="text-rose-400/80">数据源连接失败,自动重试中…<br />{error}</span> : "板块数据加载中…"}
          </div>
        )}
        {filtered?.length === 0 && (
          <div className={`p-6 text-center text-slate-600 ${zoom ? "text-[16px]" : "text-[11px]"}`}>无匹配「{q}」的板块</div>
        )}
      </div>

      {/* 成分股侧栏 */}
      {selected && (
        <div className={`${zoom ? "w-[46%] p-4" : "w-[min(440px,52%)] p-2"} shrink-0 overflow-y-auto border-l border-slate-700/40 [overflow-anchor:none]`}>
          <div className="mb-2 flex items-baseline justify-between">
            <span className={`font-semibold text-cyan-300 ${zoom ? "text-[24px]" : "text-[12px]"}`}>{selected.name}</span>
            <span className={`font-semibold ${zoom ? "text-[24px]" : "text-[12px]"} ${clsChg(selected.pct)}`}>{fmtPct(selected.pct)}</span>
          </div>
          <div className={`mb-3 grid grid-cols-2 gap-1 text-slate-500 ${zoom ? "text-[18px]" : "text-[10px]"}`}>
            <span>5日 <span className={clsChg(selected.pct5)}>{fmtPct(selected.pct5)}</span></span>
            <span>20日 <span className={clsChg(selected.pct20)}>{fmtPct(selected.pct20)}</span></span>
          </div>
          <div className={zoom ? "space-y-2" : "space-y-0.5"}>
            {stocks?.map((s) => (
              <QuoteRow
                key={s.code}
                code={s.code}
                name={s.name}
                price={s.price}
                pct={s.pct}
                amount={s.amount > 0 ? fmtYuan(s.amount) : undefined}
                turnover={s.turnover > 0 ? `${s.turnover.toFixed(1)}%` : undefined}
                spark
                boards
                flow
              />
            ))}
            {stocks && <div className={`px-1.5 pt-1 text-right text-slate-600 ${zoom ? "text-[13px]" : "text-[9px]"}`}>全量 {stocks.length} 只成分股</div>}
            {!stocks && <div className={`p-4 text-center text-slate-600 ${zoom ? "text-[15px]" : "text-[10px]"}`}>成分股加载中…</div>}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Panel
      className={className}
      title="市场板块实时热点"
      icon="▤"
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
