import { useEffect, useMemo, useState } from "react";
import { Panel } from "./Panel";
import { usePolling } from "@/hooks/usePolling";
import { api, type MysteryStock, type ParsedChain, type Quote } from "@/lib/api";
import { canonBoardName, unionBoards } from "@/lib/boards";
import { CHAINS, type Chain, type ChainSegment, type ChainStock } from "@/config/dashboard";
import { clsChg, fmtPct, fmtPrice, fmtWan } from "@/lib/format";
import { StockLink } from "./StockLink";

const TNUM = { fontVariantNumeric: "tabular-nums" } as const;

type StockQuote = Pick<Quote, "price" | "pct" | "amount" | "turnover">;

interface DynamicSegment {
  name: string;
  source: "iwencai" | "local";
  count: number;
  stocks: ChainStock[];
  query?: string;
}

const CUSTOM_CHAINS_KEY = "market-dashboard.custom-chains.v1";
const HIDDEN_CHAINS_KEY = "market-dashboard.hidden-chains.v1";
const CHAIN_OVERRIDES_KEY = "market-dashboard.chain-overrides.v1";
const CHAIN_ORDER_KEY = "market-dashboard.chain-order.v1";

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function chainSlug(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "chain";
}

function chainFromParsed(parsed: ParsedChain, base?: Chain): Chain {
  const cleanName = parsed.name.trim() || base?.name || "新产业链";
  return {
    id: base?.id || `custom-${Date.now()}-${chainSlug(cleanName)}`,
    name: cleanName,
    icon: base?.icon || "✚",
    segments: parsed.segments.map((seg) => ({
      name: seg.name,
      desc: seg.desc,
      stocks: seg.stocks.map((stock) => ({
        code: stock.code,
        name: stock.name,
        tag: stock.tag || seg.desc,
        source: parsed.source,
      })),
    })),
    tech: parsed.tech.length ? parsed.tech : [cleanName],
    keywords: parsed.keywords.length ? parsed.keywords : [cleanName],
  };
}

function cleanChainOverrides(overrides: Record<string, Chain>) {
  return Object.fromEntries(
    Object.entries(overrides).filter(([id, chain]) => {
      const stocks = chain.segments.flatMap((seg) => seg.stocks || []);
      if (id === "solid-battery" && !stocks.some((stock) => stock.name === "天奈科技" || marketCode(stock.code) === "sh688116")) {
        return false;
      }
      return !stocks.some((stock) => stock.source === "local");
    })
  );
}

function marketCode(code: string) {
  const c = String(code || "").trim().replace(/\D/g, "").slice(-6).padStart(6, "0");
  if (!c || c === "000000") return "";
  if (/^6/.test(c)) return `sh${c}`;
  if (/^[03]/.test(c)) return `sz${c}`;
  if (/^[489]/.test(c)) return `bj${c}`;
  return c;
}

function rawList(row: MysteryStock, key: string) {
  const value = row.raw?.[key];
  if (Array.isArray(value)) return value.map((x) => String(x)).filter(Boolean);
  if (typeof value === "string") return value.split(/[;,，、/]/).map((x) => x.trim()).filter(Boolean);
  return [];
}

function rowEvidence(row: MysteryStock) {
  return `${row.name} ${JSON.stringify(row.raw || {})}`.toLowerCase();
}

function hasAny(text: string, words?: string[]) {
  if (!words || words.length === 0) return true;
  return words.some((word) => text.includes(word.toLowerCase()));
}

function matchesSegment(row: MysteryStock, segment: ChainSegment) {
  const text = rowEvidence(row);
  if (!hasAny(text, segment.include)) return false;
  if (segment.exclude?.some((word) => text.includes(word.toLowerCase()))) return false;
  return true;
}

function inferTag(row: MysteryStock, fallback: string) {
  const concepts = rawList(row, "所属概念");
  const industries = rawList(row, "所属同花顺行业");
  return concepts.find((x) => x.length <= 8) || industries.at(-1) || fallback.replace(/^[上中下]游\s*·\s*/, "");
}

function toChainStock(row: MysteryStock, segmentName: string): ChainStock | null {
  const code = marketCode(row.code);
  if (!code) return null;
  return {
    code,
    name: row.name,
    tag: inferTag(row, segmentName),
    price: row.price,
    pct: row.pct,
    amount: row.avgAmount3 ? row.avgAmount3 * 10000 : undefined,
    source: "iwencai",
  };
}

function stockQuote(stock: ChainStock, q?: Quote): StockQuote | undefined {
  if (q) return q;
  if (stock.price === undefined && stock.pct === undefined && stock.amount === undefined && stock.turnover === undefined) return undefined;
  return {
    price: stock.price ?? 0,
    pct: stock.pct ?? 0,
    amount: stock.amount ?? 0,
    turnover: stock.turnover ?? 0,
  };
}

function shortTime(ts: number) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function buildTrendQuery(segments: DynamicSegment[]) {
  const parts = segments
    .map((seg) => {
      const names = [...new Set(seg.stocks.map((stock) => stock.name).filter(Boolean))];
      if (names.length === 0) return "";
      return `${seg.name.replace(/\s*·\s*/g, "")}：${names.join("、")}`;
    })
    .filter(Boolean);
  if (parts.length === 0) return "";
  return `${parts.join("")} 以上股票中，哪些股票当前价格在5日和20日均线之上`;
}

function orderedChains(chains: Chain[], order: string[]) {
  if (order.length === 0) return chains;
  const rank = new Map(order.map((id, index) => [id, index]));
  return [...chains].sort((a, b) => {
    const ai = rank.get(a.id);
    const bi = rank.get(b.id);
    if (ai === undefined && bi === undefined) return 0;
    if (ai === undefined) return 1;
    if (bi === undefined) return -1;
    return ai - bi;
  });
}

function moveBefore(order: string[], fromId: string, toId: string) {
  if (fromId === toId) return order;
  const base = order.filter((id) => id !== fromId);
  const toIndex = base.indexOf(toId);
  if (toIndex < 0) return order;
  return [...base.slice(0, toIndex), fromId, ...base.slice(toIndex)];
}

function StockCell({ code, name, tag, q, zoom = false }: { code: string; name: string; tag?: string; q?: StockQuote; zoom?: boolean }) {
  const amount = q && q.amount > 0 ? fmtWan(q.amount) : "—";
  const turnover = q && q.turnover > 0 ? `${q.turnover.toFixed(1)}%` : "—";
  return (
    <div
      className={`rounded border border-slate-700/25 bg-slate-800/15 transition-colors hover:border-cyan-500/35 hover:bg-slate-800/30 ${
        zoom ? "px-3 py-1.5" : "px-2 py-1"
      }`}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-1.5">
          <span className={`truncate font-semibold text-slate-100 ${zoom ? "text-[16px] leading-5" : "text-[11px] leading-4"}`}>{name}</span>
          <StockLink code={code} className={`shrink-0 text-slate-500 ${zoom ? "text-[12px]" : "text-[8.5px]"}`} />
        </div>
        <div className="flex shrink-0 items-baseline gap-2 text-right" style={TNUM}>
          <span className={`font-semibold text-slate-300 ${zoom ? "text-[15px]" : "text-[10px]"}`}>{q ? fmtPrice(q.price) : "—"}</span>
          <span className={`font-bold ${q ? clsChg(q.pct) : "text-slate-600"} ${zoom ? "text-[15px]" : "text-[10px]"}`}>
            {q ? fmtPct(q.pct) : "—"}
          </span>
        </div>
      </div>
      <div className={`mt-0.5 flex min-w-0 items-center gap-1.5 leading-none ${zoom ? "text-[11px]" : "text-[8.5px]"}`}>
        {tag && <span className="max-w-[45%] shrink-0 truncate rounded bg-slate-700/45 px-1.5 py-0.5 text-slate-300">{tag}</span>}
        <span className="text-slate-600">额</span>
        <span className="text-slate-400" style={TNUM}>{amount}</span>
        <span className="text-slate-600">换</span>
        <span className="text-slate-400" style={TNUM}>{turnover}</span>
      </div>
    </div>
  );
}

/** 产业链上下游全景 */
export function ChainPanel({ className = "" }: { className?: string }) {
  const [customChains, setCustomChains] = useState<Chain[]>(() => loadJson<Chain[]>(CUSTOM_CHAINS_KEY, []));
  const [chainOverrides, setChainOverrides] = useState<Record<string, Chain>>(() => cleanChainOverrides(loadJson<Record<string, Chain>>(CHAIN_OVERRIDES_KEY, {})));
  const [hiddenChainIds, setHiddenChainIds] = useState<string[]>(() => loadJson<string[]>(HIDDEN_CHAINS_KEY, []));
  const [chainId, setChainId] = useState(CHAINS[0].id);
  const [refreshTick, setRefreshTick] = useState(0);
  const [editor, setEditor] = useState<{ mode: "add" | "update"; name: string; content: string } | null>(null);
  const [parseState, setParseState] = useState<{ loading: boolean; error: string; warnings: string[] }>({ loading: false, error: "", warnings: [] });
  const [pendingDelete, setPendingDelete] = useState<Chain | null>(null);
  const [chainOrder, setChainOrder] = useState<string[]>(() => loadJson<string[]>(CHAIN_ORDER_KEY, []));
  const [draggingChainId, setDraggingChainId] = useState("");
  const mergedBuiltInChains = useMemo(() => CHAINS.map((c) => chainOverrides[c.id] || c), [chainOverrides]);
  const allChains = useMemo(
    () => orderedChains([...mergedBuiltInChains, ...customChains].filter((c) => !hiddenChainIds.includes(c.id)), chainOrder),
    [mergedBuiltInChains, customChains, hiddenChainIds, chainOrder]
  );
  const activeChainId = allChains.some((c) => c.id === chainId) ? chainId : (allChains[0] || CHAINS[0]).id;
  const chain = allChains.find((c) => c.id === activeChainId) || allChains[0] || CHAINS[0];

  useEffect(() => {
    saveJson(CUSTOM_CHAINS_KEY, customChains);
  }, [customChains]);

  useEffect(() => {
    saveJson(CHAIN_OVERRIDES_KEY, chainOverrides);
  }, [chainOverrides]);

  useEffect(() => {
    saveJson(HIDDEN_CHAINS_KEY, hiddenChainIds);
  }, [hiddenChainIds]);

  useEffect(() => {
    saveJson(CHAIN_ORDER_KEY, chainOrder);
  }, [chainOrder]);

  const chainQueryKey = useMemo(() => chain.segments.map((s) => s.query || "").join("|"), [chain]);
  const { data: dynamicSegments, error: dynamicError } = usePolling(async () => {
    const seen = new Set<string>();
    const segments: DynamicSegment[] = [];
    for (const seg of chain.segments) {
      const fallback = seg.stocks || [];
      if (!seg.query) {
        fallback.forEach((stock) => seen.add(stock.code));
        segments.push({ name: seg.name, source: "local", count: fallback.length, stocks: fallback });
        continue;
      }
      if (refreshTick === 0) {
        fallback.forEach((stock) => seen.add(stock.code));
        segments.push({ name: seg.name, source: "local", count: fallback.length, stocks: fallback, query: seg.query });
        continue;
      }

      try {
        const result = await api.mysterySelect(seg.query, 36, true);
        const stocks = result.rows
          .filter((row) => matchesSegment(row, seg))
          .map((row) => toChainStock(row, seg.name))
          .filter((stock): stock is ChainStock => Boolean(stock))
          .filter((stock) => {
            if (seen.has(stock.code)) return false;
            seen.add(stock.code);
            return true;
          })
          .slice(0, 10);
        const trustedStocks = stocks.length >= 4 || fallback.length === 0 ? stocks : fallback;
        segments.push({
          name: seg.name,
          source: trustedStocks === stocks && stocks.length > 0 ? "iwencai" : "local",
          count: trustedStocks.length,
          stocks: trustedStocks,
          query: seg.query,
        });
      } catch {
        fallback.forEach((stock) => seen.add(stock.code));
        segments.push({ name: seg.name, source: "local", count: fallback.length, stocks: fallback, query: seg.query });
      }
    }
    return segments;
  }, 30 * 60 * 1000, [chainId, chainQueryKey, refreshTick]);

  const segmentData = useMemo<DynamicSegment[]>(
    () => dynamicSegments || chain.segments.map((seg) => ({ name: seg.name, source: "local", count: seg.stocks?.length || 0, stocks: seg.stocks || [], query: seg.query })),
    [dynamicSegments, chain]
  );
  const trendQuery = useMemo(() => buildTrendQuery(segmentData), [segmentData]);
  const codes = useMemo(() => segmentData.flatMap((s) => s.stocks.map((x) => x.code)), [segmentData]);
  const trendCodes = useMemo(() => [...new Set(codes.map(marketCode).filter(Boolean))], [codes]);
  const trendCodesKey = useMemo(() => trendCodes.join(","), [trendCodes]);
  const { data: trendData, error: trendError, updated: trendUpdated } = usePolling(
    () => trendCodes.length
      ? api.trendMa(trendCodes, false)
      : Promise.resolve({ query: "本地MA筛选：当前价 > MA5 且 当前价 > MA20", total: 0, rows: [] }),
    60000,
    [activeChainId, trendCodesKey]
  );
  const trendLoading = trendCodes.length > 0 && !trendData && !trendError;
  const trendResult = trendData
    ? {
      chainId: chain.id,
      chainName: chain.name,
      query: trendData.query,
      updatedAt: trendUpdated,
      total: trendData.total,
      rows: trendData.rows,
    }
    : null;
  const { data: quotes } = usePolling(
    () => (codes.length ? api.quotes(codes) : Promise.resolve({} as Record<string, Quote>)),
    8000,
    [chainId, codes.join(","), refreshTick]
  );
  // 行业+概念双口径合并榜单(适配层统一归一化)
  const { data: boards } = usePolling(() => unionBoards(40), 25000);

  /** 与产业链关联的板块热度(行业/概念双口径,归一化名称匹配) */
  const relatedBoards = useMemo(() => {
    if (!boards) return [];
    const keys = chain.keywords.map(canonBoardName);
    return boards
      .filter((b) => keys.some((k) => b.cname.includes(k) || k.includes(b.cname)))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 8);
  }, [boards, chain]);

  const chainTabs = (zoom = false) => (
    <div className={`flex min-w-0 items-center overflow-x-auto ${zoom ? "w-full max-w-none gap-0.5" : "w-full flex-1 gap-1"}`}>
      {allChains.map((c) => (
        <span
          key={c.id}
          className={`group relative inline-flex shrink-0 ${draggingChainId === c.id ? "opacity-45" : ""}`}
          draggable
          onDragStart={(event) => {
            setDraggingChainId(c.id);
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", c.id);
          }}
          onDragEnd={() => setDraggingChainId("")}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          onDrop={(event) => {
            event.preventDefault();
            const fromId = event.dataTransfer.getData("text/plain") || draggingChainId;
            setDraggingChainId("");
            if (!fromId || fromId === c.id) return;
            const visibleIds = allChains.map((item) => item.id);
            setChainOrder((current) => moveBefore(current.length ? current : visibleIds, fromId, c.id));
            setChainId(fromId);
          }}
        >
          <button
            type="button"
            onClick={() => setChainId(c.id)}
            className={`shrink-0 rounded py-0.5 transition-colors ${
              zoom ? "cursor-grab px-1.5 pr-3 text-[13px] active:cursor-grabbing" : "cursor-grab px-2 pr-3.5 text-[11px] active:cursor-grabbing"
            } ${activeChainId === c.id ? "bg-emerald-500/20 font-semibold text-emerald-300" : "text-slate-400 hover:text-slate-200"}`}
            title="拖拽排序，点击切换"
          >
            <span className="mr-1 opacity-70">{c.icon}</span>{c.name}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setPendingDelete(c);
            }}
            className={`pointer-events-none absolute -right-0.5 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-600 bg-slate-900 text-slate-500 opacity-0 transition hover:border-rose-400/70 hover:bg-rose-500/15 hover:text-rose-300 hover:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 ${
              zoom ? "text-[11px]" : "text-[9px]"
            }`}
            title={`删除${c.name}`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );

  const updateButton = (zoom = false) => {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setParseState({ loading: false, error: "", warnings: [] });
          setEditor({ mode: "update", name: chain.name, content: "" });
        }}
        className={`rounded border border-cyan-500/25 bg-cyan-500/10 font-semibold text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20 ${
          zoom ? "px-2.5 py-1 text-[13px]" : "px-1.5 py-0.5 text-[10px]"
        }`}
        title="粘贴问财结论，用大模型整理并更新当前产业链股票库"
      >
        更新
      </button>
    );
  };

  const addControls = (zoom = false) => {
    if (!zoom) return null;
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setParseState({ loading: false, error: "", warnings: [] });
          setEditor({ mode: "add", name: "", content: "" });
        }}
        className="ml-2 rounded border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[13px] font-semibold text-emerald-300 transition hover:border-emerald-400/50 hover:bg-emerald-500/20"
        title="粘贴问财结论，添加新的产业链"
      >
        Add
      </button>
    );
  };

  const content = (zoom = false) => (
    <div className="flex h-full min-h-0">
      {/* 上中下游三段 */}
      <div className={`grid min-w-0 flex-1 grid-cols-3 ${zoom ? "gap-3 p-3" : "gap-2 p-2"}`} style={{ gridTemplateRows: "1fr auto" }}>
        {chain.segments.map((seg, si) => {
          const current = segmentData[si];
          const stocks = current?.stocks || seg.stocks || [];
          return (
          <div key={seg.name} className="flex min-h-0 flex-col">
            <div className={`flex items-center ${zoom ? "mb-2 gap-2" : "mb-1.5 gap-1.5"}`}>
              <span className={`flex items-center justify-center rounded font-bold ${
                zoom ? "h-8 w-8 text-[16px]" : "h-4.5 w-4.5 text-[10px]"
              } ${
                si === 0 ? "bg-sky-500/20 text-sky-300" : si === 1 ? "bg-violet-500/20 text-violet-300" : "bg-amber-500/20 text-amber-300"
              }`} style={zoom ? undefined : { height: 18, width: 18 }}>
                {["上", "中", "下"][si]}
              </span>
              <div className="min-w-0">
                <span className={`${zoom ? "text-[18px]" : "text-[11px]"} font-semibold text-slate-200`}>{seg.name}</span>
                <span className={`ml-2 hidden text-slate-500 xl:inline ${zoom ? "text-[13px]" : "text-[9px]"}`}>{seg.desc}</span>
              </div>
            </div>
            <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${zoom ? "gap-1.5 pr-1" : "gap-0.5"}`}>
              {!dynamicSegments && seg.query && (
                <div className={`flex items-center justify-center rounded border border-slate-700/30 bg-slate-800/15 text-slate-500 ${zoom ? "h-14 text-[14px]" : "h-9 text-[10px]"}`}>
                  问财筛选中...
                </div>
              )}
              {stocks.map((st) => (
                <StockCell key={st.code} code={st.code} name={st.name} tag={st.tag} q={stockQuote(st, quotes?.[st.code])} zoom={zoom} />
              ))}
              {dynamicSegments && stocks.length === 0 && (
                <div className={`flex items-center justify-center rounded border border-slate-700/30 bg-slate-800/15 text-slate-500 ${zoom ? "h-14 text-[14px]" : "h-9 text-[10px]"}`}>
                  暂无匹配股票
                </div>
              )}
            </div>
          </div>
        );})}
        {/* 关联板块热度 */}
        {relatedBoards.length > 0 && (
          <div className={`col-span-3 rounded border border-slate-700/25 bg-slate-800/10 ${zoom ? "px-4 py-3" : "px-2.5 py-1.5"}`}>
            <span className={`mr-3 font-semibold text-slate-400 ${zoom ? "text-[15px]" : "text-[10px]"}`}>关联板块热度</span>
            <span className={`inline-flex flex-wrap ${zoom ? "gap-x-6 gap-y-2" : "gap-x-4 gap-y-0.5"}`}>
              {relatedBoards.map((b) => (
                <span key={b.code} className={zoom ? "text-[15px]" : "text-[10px]"} style={TNUM}>
                  <span
                    className={`mr-1 rounded-sm px-1 py-px ${
                      zoom ? "text-[12px]" : "text-[8px]"
                    } ${b.kind === "industry" ? "bg-cyan-500/15 text-cyan-400" : "bg-violet-500/15 text-violet-400"}`}
                  >
                    {b.kind === "industry" ? "行业" : "概念"}
                  </span>
                  <span className="text-slate-300">{b.name}</span>
                  <span className={`ml-1 font-semibold ${clsChg(b.pct)}`}>{fmtPct(b.pct)}</span>
                  <span className={`ml-1 text-slate-600 ${zoom ? "text-[13px]" : "text-[9px]"}`}>{b.leadName}</span>
                </span>
              ))}
            </span>
          </div>
        )}
      </div>

      {/* 右侧:趋势选股 + 动态来源 */}
      <div className={`flex shrink-0 flex-col border-l border-slate-700/40 ${zoom ? "w-[380px]" : "w-[300px]"}`}>
        <div className={`border-b border-slate-700/40 ${zoom ? "p-4" : "p-2"}`}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className={`font-semibold text-slate-300 ${zoom ? "text-[16px]" : "text-[10px]"}`}>趋势选股</div>
            <span
              className={`shrink-0 rounded border border-cyan-500/20 bg-cyan-500/10 font-semibold text-cyan-300 ${
                zoom ? "px-2.5 py-1 text-[12px]" : "px-1.5 py-0.5 text-[8.5px]"
              }`}
              title={trendQuery ? "自动本地计算：当前价同时站上5日和20日均线，不消耗问财额度" : "当前产业链暂无股票可查询"}
            >
              {trendLoading ? "自动计算中" : "自动"}
            </span>
          </div>
          <div className={`rounded border border-slate-700/30 bg-slate-950/35 ${zoom ? "p-2" : "p-1.5"}`}>
            <div className={`mb-1 flex items-center justify-between gap-2 text-slate-500 ${zoom ? "text-[12px]" : "text-[8.5px]"}`}>
              <span>本地 MA5 / MA20 上方</span>
              {trendResult && <span>{shortTime(trendResult.updatedAt)} · {trendResult.rows.length}/{trendResult.total || trendResult.rows.length}</span>}
            </div>
            <div className={`${zoom ? "max-h-44 space-y-1" : "max-h-20 space-y-0.5"} overflow-y-auto`}>
              {trendResult?.rows.slice(0, zoom ? 16 : 8).map((row) => (
                <div key={`${row.code}-${row.name}`} className={`flex items-center justify-between gap-2 rounded bg-slate-800/20 px-1.5 py-1 ${zoom ? "text-[12px]" : "text-[9px]"}`}>
                  <div className="flex min-w-0 items-baseline gap-1.5">
                    <span className="truncate font-semibold text-slate-200">{row.name}</span>
                    <StockLink code={marketCode(row.code)} className="shrink-0 text-slate-500" />
                  </div>
                  <span className={`shrink-0 font-semibold ${row.pct === undefined ? "text-slate-500" : clsChg(row.pct)}`} style={TNUM}>
                    {row.pct === undefined ? "—" : fmtPct(row.pct)}
                  </span>
                </div>
              ))}
              {!trendResult && !trendError && (
                <div className={`text-slate-500 ${zoom ? "text-[12px] leading-5" : "text-[8.5px] leading-4"}`}>
                  {trendLoading ? "正在用日K本地计算 MA5/MA20..." : "切换产业链后会自动计算 MA5/MA20，不消耗问财额度。"}
                </div>
              )}
              {trendResult && trendResult.rows.length === 0 && (
                <div className={`text-slate-500 ${zoom ? "text-[12px]" : "text-[8.5px]"}`}>暂无符合趋势条件的股票。</div>
              )}
            </div>
            {trendError && (
              <div className={`mt-1 rounded border border-rose-400/25 bg-rose-500/10 px-2 py-1 text-rose-200 ${zoom ? "text-[12px]" : "text-[8.5px]"}`}>
                {trendError}
              </div>
            )}
          </div>
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto ${zoom ? "p-3" : "p-1.5"}`}>
          <div className={`mb-2 px-0.5 font-semibold text-slate-300 ${zoom ? "text-[16px]" : "text-[10px]"}`}>
            动态发现线索 <span className={`ml-1 font-normal text-slate-500 ${zoom ? "text-[13px]" : "text-[9px]"}`}>产业链刷新才用问财 · 30min</span>
          </div>
          <div className={zoom ? "space-y-2" : "space-y-1"}>
            {segmentData.map((seg) => (
              <div key={seg.name} className={`rounded border border-slate-700/25 bg-slate-800/15 ${zoom ? "px-3 py-2" : "px-2 py-1.5"}`}>
                <div className={`flex items-center justify-between gap-2 ${zoom ? "text-[14px]" : "text-[10px]"}`}>
                  <span className="font-semibold text-slate-300">{seg.name}</span>
                  <span className={seg.source === "iwencai" ? "text-cyan-300" : "text-slate-500"}>
                    {seg.source === "iwencai" ? `动态 ${seg.count}只` : `本地缓存 ${seg.count}只`}
                  </span>
                </div>
                <div className={`mt-1 line-clamp-3 text-slate-500 ${zoom ? "text-[13px] leading-[1.6]" : "text-[9px] leading-[1.45]"}`}>
                  {seg.query || "本分段使用已确认的本地产业链分类。"}
                </div>
              </div>
            ))}
            {dynamicError && (
              <div className={`rounded border border-amber-500/20 bg-amber-500/5 p-2 text-amber-200/80 ${zoom ? "text-[13px]" : "text-[9px]"}`}>
                问财动态筛选暂时不可用，当前显示兜底股票池。
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    if (target.id.startsWith("custom-")) {
      setCustomChains((list) => list.filter((c) => c.id !== target.id));
    } else {
      setHiddenChainIds((ids) => [...new Set([...ids, target.id])]);
    }
    if (chainId === target.id) {
      const next = allChains.find((c) => c.id !== target.id) || CHAINS[0];
      setChainId(next.id);
    }
    setPendingDelete(null);
  };

  const submitEditor = async () => {
    if (!editor || parseState.loading) return;
    const name = editor.name.trim();
    const contentText = editor.content.trim();
    if (!name || !contentText) {
      setParseState({ loading: false, error: "请填写产业链标题，并粘贴问财整理出来的产业链内容。", warnings: [] });
      return;
    }
    setParseState({ loading: true, error: "", warnings: [] });
    try {
      const parsed = await api.parseChain(name, contentText);
      const llmFailed = parsed.source !== "llm" && (parsed.warnings || []).some((warning) => warning.includes("LLM") || warning.includes("大模型"));
      if (llmFailed) {
        setParseState({
          loading: false,
          error: "大模型没有成功返回，暂不保存这次更新。请先确认 CHAIN_LLM_BASE_URL / CHAIN_LLM_API_KEY 后再整理。",
          warnings: parsed.warnings || [],
        });
        return;
      }
      if (editor.mode === "update") {
        const next = chainFromParsed(parsed, chain);
        if (chain.id.startsWith("custom-")) {
          setCustomChains((list) => list.map((item) => (item.id === chain.id ? next : item)));
        } else {
          setChainOverrides((map) => ({ ...map, [chain.id]: next }));
        }
        setChainId(next.id);
      } else {
        if (allChains.some((c) => c.name === parsed.name)) {
          setParseState({ loading: false, error: "这个产业链名称已经存在，可以直接点它的 Update 更新。", warnings: parsed.warnings || [] });
          return;
        }
        const next = chainFromParsed(parsed);
        setCustomChains((list) => [...list, next]);
        setHiddenChainIds((ids) => ids.filter((id) => id !== next.id));
        setChainId(next.id);
      }
      setRefreshTick((x) => x + 1);
      setParseState({ loading: false, error: "", warnings: parsed.warnings || [] });
      setEditor(null);
    } catch (error) {
      setParseState({ loading: false, error: String(error instanceof Error ? error.message : error), warnings: [] });
    }
  };

  return (
    <>
      <Panel
        className={className}
        title="产业链上下游全景"
        icon="⛓"
        accent="#34d399"
        expandable
        expandedChildren={content(true)}
        expandedTitleExtra={<>{updateButton(true)}{addControls(true)}</>}
        expandedRight={chainTabs(true)}
        titleExtra={<div className="flex min-w-0 flex-1 items-center gap-2">{updateButton()}{chainTabs()}</div>}
      >
        {content()}
      </Panel>

      {pendingDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true">
          <div className="w-[360px] rounded-md border border-rose-400/40 bg-[#0c1320] p-4 shadow-[0_0_36px_rgba(244,63,94,0.18)]">
            <div className="text-[15px] font-semibold text-slate-100">确认删除产业链？</div>
            <div className="mt-2 text-[13px] leading-6 text-slate-400">
              将删除 <span className="font-semibold text-rose-200">{pendingDelete.name}</span>。内置产业链会从本机隐藏，自定义产业链会从本机缓存移除。
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded border border-slate-700 px-3 py-1.5 text-[13px] text-slate-300 transition hover:bg-slate-800"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded border border-rose-400/50 bg-rose-500/15 px-3 py-1.5 text-[13px] font-semibold text-rose-200 transition hover:bg-rose-500/25"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {editor && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="flex max-h-[86vh] w-[760px] max-w-[96vw] flex-col rounded-md border border-cyan-400/35 bg-[#0a1220] shadow-[0_0_42px_rgba(34,211,238,0.18)]">
            <div className="flex items-center justify-between border-b border-slate-700/45 px-4 py-3">
              <div>
                <div className="text-[16px] font-semibold text-slate-100">
                  {editor.mode === "update" ? "更新产业链股票库" : "添加产业链"}
                </div>
                <div className="mt-0.5 text-[12px] text-slate-500">粘贴问财的上中下游结论，系统会用大模型整理，失败时自动用本地规则兜底。</div>
              </div>
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="rounded px-2 py-1 text-[14px] text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
              >
                关闭
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              <label className="block">
                <span className="mb-1 block text-[13px] font-semibold text-slate-300">产业链标题</span>
                <input
                  value={editor.name}
                  onChange={(event) => setEditor((current) => current && { ...current, name: event.target.value })}
                  placeholder="例如：创新药、核聚变、商业航天星链"
                  className="h-9 w-full rounded border border-slate-700 bg-slate-950/80 px-3 text-[14px] text-slate-100 outline-none transition focus:border-cyan-400/70"
                  autoFocus={editor.mode === "add"}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[13px] font-semibold text-slate-300">问财结论内容</span>
                <textarea
                  value={editor.content}
                  onChange={(event) => setEditor((current) => current && { ...current, content: event.target.value })}
                  placeholder="把 iWenCai 返回的产业链位置、核心环节、代表股票、核心逻辑整段粘贴到这里"
                  className="h-[320px] w-full resize-none rounded border border-slate-700 bg-slate-950/80 px-3 py-2 text-[13px] leading-6 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/70"
                />
              </label>
              {parseState.error && (
                <div className="rounded border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-200">{parseState.error}</div>
              )}
              {parseState.warnings.length > 0 && (
                <div className="max-h-24 overflow-y-auto rounded border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-[12px] leading-5 text-amber-100/80">
                  {parseState.warnings.slice(0, 6).map((warning) => <div key={warning}>{warning}</div>)}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-slate-700/45 px-4 py-3">
              <div className="text-[12px] text-slate-500">股票名会自动补代码；无法确认代码的股票不会强行加入。</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditor(null)}
                  className="rounded border border-slate-700 px-3 py-1.5 text-[13px] text-slate-300 transition hover:bg-slate-800"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={submitEditor}
                  disabled={parseState.loading}
                  className="rounded border border-cyan-400/50 bg-cyan-500/15 px-3 py-1.5 text-[13px] font-semibold text-cyan-200 transition hover:bg-cyan-500/25 disabled:cursor-wait disabled:opacity-60"
                >
                  {parseState.loading ? "整理中..." : "整理并保存"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
