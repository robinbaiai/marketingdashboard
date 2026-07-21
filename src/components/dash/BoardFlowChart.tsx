import { useEffect, useMemo, useRef, useState } from "react";
import type { BoardFlow } from "@/lib/api";

const TNUM = { fontVariantNumeric: "tabular-nums" } as const;

/** 高对比配色: 流入保留暖色, 流出改为冷色/蓝绿/紫, 避免整图全是近似绿色。 */
const INFLOW_COLORS = ["#ff4d6d", "#ff8a00", "#ffd166", "#ef476f", "#f97316", "#ff006e", "#fb7185", "#f59e0b", "#fca5a5", "#fbbf24"];
const OUTFLOW_COLORS = ["#00e5ff", "#2dd4bf", "#a78bfa", "#60a5fa", "#22c55e", "#14b8a6", "#38bdf8", "#c084fc", "#4ade80", "#818cf8"];
const DASHES = ["", "6 3", "3 3", "9 4", "2 5"];

const X_TICKS: [number, string][] = [
  [0, "09:30"],
  [59, "10:30"],
  [119, "11:30"],
  [120, "13:00"],
  [179, "14:00"],
  [239, "15:00"],
];

/** 板块实时资金流向图(分钟级累计主力净流入, 东财口径)
 *  progress: 0..1 播放进度(重放用), 1 = 全天 */
export function BoardFlowChart({ flows, progress = 1, zoom = false }: { flows: BoardFlow[]; progress?: number; zoom?: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 400, h: 300 });
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      if (r.width > 60 && r.height > 60) setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const chart = useMemo(() => {
    const series = flows.filter((f) => f.points.length > 2);
    if (!series.length) return null;
    const { w: W, h: H } = size;
    const labelW = zoom ? 190 : 108;
    const leftPad = zoom ? 58 : 34;
    const topPad = zoom ? 32 : 18;
    const bottomPad = zoom ? 38 : 26;
    const labelFontLayout = zoom ? 17 : 8.5;
    const plotH = Math.max(40, H - topPad - bottomPad);
    const n = Math.max(...series.map((s) => s.points.length));
    // 重放进度: 只绘制前 idx 个点
    const idx = Math.max(1, Math.min(n - 1, Math.floor(progress * (n - 1))));
    // 纵坐标按当前已播放的数据动态缩放,播放结束时再切回全天范围
    const visiblePoints = series.flatMap((s) => (progress < 1 ? s.points.slice(0, idx + 1) : s.points));
    const visibleV = visiblePoints.map((p) => p.v);
    let min = Math.min(...visibleV, 0);
    let max = Math.max(...visibleV, 0);
    const range = max - min;
    const pad = range * 0.1 || Math.max(Math.abs(max), Math.abs(min), 1) * 0.08;
    min -= pad;
    max += pad;
    const X = (i: number) => leftPad + (i / Math.max(n - 1, 1)) * (W - leftPad - labelW - 8);
    const Y = (v: number) => topPad + (1 - (v - min) / (max - min)) * plotH;
    // 颜色: 流入侧按暖色, 流出侧按高区分冷色, 并搭配虚线形态。
    let ri = 0;
    let gi = 0;
    const lines = series.map((s, i) => {
      const rank = s.netIn >= 0 ? ri++ : gi++;
      const color = s.netIn >= 0 ? INFLOW_COLORS[rank % INFLOW_COLORS.length] : OUTFLOW_COLORS[rank % OUTFLOW_COLORS.length];
      const seg = s.points.slice(0, idx + 1);
      const pts = seg.map((p, i) => `${X(i).toFixed(1)},${Y(p.v).toFixed(1)}`).join(" ");
      const last = seg[seg.length - 1];
      return {
        s,
        color,
        pts,
        dash: DASHES[i % DASHES.length],
        width: zoom ? (rank < 3 ? 2.8 : 2.1) : rank < 3 ? 1.9 : 1.35,
        lastY: Y(last.v),
        lastV: last.v,
        lastT: last.t,
      };
    });
    // 端点标签去重叠: 按 y 排序后推开(最小间距 11px)
    const labelGap = zoom ? 21 : 12;
    const labels = [...lines]
      .sort((a, b) => a.lastY - b.lastY)
      .map((l) => ({ line: l, labelY: l.lastY }));
    let prevY = -Infinity;
    for (const l of labels) {
      l.labelY = Math.max(l.labelY, prevY + labelGap);
      prevY = l.labelY;
    }
    const labelTop = topPad + labelFontLayout * 0.45;
    const labelBottom = H - bottomPad - (zoom ? 2 : 0);
    for (const l of labels) l.labelY = Math.max(l.labelY, labelTop);
    const overflow = labels.length ? labels[labels.length - 1].labelY - labelBottom : 0;
    if (overflow > 0) for (const l of labels) l.labelY -= overflow;
    for (const l of labels) l.labelY = Math.max(l.labelY, labelTop);
    // Y 刻度: 4 档
    const ticks = [0.2, 0.4, 0.6, 0.8].map((f) => {
      const v = max - f * (max - min);
      return { v, y: Y(v) };
    });
    const cursorSeries = series.find((s) => s.points[idx]) || series.reduce((longest, s) => (s.points.length > longest.points.length ? s : longest), series[0]);
    const cursorPoint = cursorSeries?.points[Math.min(idx, Math.max(0, cursorSeries.points.length - 1))];
    return { W, H, X, Y, min, max, lines, labels, ticks, labelW, leftPad, bottomPad, idx, cursorT: cursorPoint?.t || "" };
  }, [flows, size, progress, zoom]);

  const tickFont = zoom ? 17 : 9;
  const timeFont = zoom ? 15 : 8;
  const labelFont = zoom ? 17 : 8.5;
  const emptyFont = zoom ? "text-[22px]" : "text-[11px]";

  return (
    <div ref={boxRef} className="h-full min-h-0 w-full">
      {chart ? (
        <svg width={chart.W} height={chart.H} className="block">
          {/* 网格与零轴 */}
          {chart.ticks.map((t, i) => (
            <g key={i}>
              <line x1={chart.leftPad} y1={t.y} x2={chart.W - chart.labelW - 8} y2={t.y} stroke="#1e293b" strokeWidth={1} />
              <text x={4} y={t.y + tickFont / 3} fontSize={tickFont} fill="#64748b" style={TNUM}>{(t.v / 1e8).toFixed(0)}亿</text>
            </g>
          ))}
          <line x1={chart.leftPad} y1={chart.Y(0)} x2={chart.W - chart.labelW - 8} y2={chart.Y(0)} stroke="#334155" strokeWidth={1} />
          {/* 时间刻度 */}
          {X_TICKS.map(([i, t]) => (
            <text key={t} x={chart.X(i)} y={chart.H - (zoom ? 12 : 8)} fontSize={timeFont} fill="#64748b" textAnchor="middle">{t}</text>
          ))}
          {/* 板块曲线 */}
          {chart.lines.map((l) => (
            <polyline
              key={l.s.code}
              points={l.pts}
              fill="none"
              stroke={l.color}
              strokeWidth={l.width}
              strokeDasharray={l.dash}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.94}
            />
          ))}
          {/* 端点标签 */}
          {chart.labels.map((l) => (
            <g key={l.line.s.code}>
              <line x1={chart.W - chart.labelW - 8} y1={l.line.lastY} x2={chart.W - chart.labelW + 2} y2={l.labelY} stroke={l.line.color} strokeWidth={zoom ? 1.2 : 0.7} strokeOpacity={0.65} />
              <text x={chart.W - chart.labelW + 6} y={l.labelY + labelFont / 3} fontSize={labelFont} fill="#08111f" stroke="#08111f" strokeWidth={zoom ? 5 : 3} style={TNUM}>
                {l.line.s.name} {l.line.lastV >= 0 ? "+" : ""}{(l.line.lastV / 1e8).toFixed(0)}
              </text>
              <text x={chart.W - chart.labelW + 6} y={l.labelY + labelFont / 3} fontSize={labelFont} fill={l.line.color} style={TNUM}>
                {l.line.s.name} {l.line.lastV >= 0 ? "+" : ""}{(l.line.lastV / 1e8).toFixed(0)}
              </text>
            </g>
          ))}
          {/* 时间游标 */}
          {progress < 1 && (
            <g>
              <line
                x1={chart.X(chart.idx)}
                y1={zoom ? 14 : 8}
                x2={chart.X(chart.idx)}
                y2={chart.H - (zoom ? 34 : 18)}
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text x={chart.X(chart.idx)} y={zoom ? 16 : 8} fontSize={timeFont} fill="#e2e8f0" textAnchor="middle" style={TNUM}>
                {chart.cursorT}
              </text>
            </g>
          )}
        </svg>
      ) : (
        <div className={`flex h-full items-center justify-center text-slate-600 ${emptyFont}`}>板块资金流加载中…</div>
      )}
    </div>
  );
}
