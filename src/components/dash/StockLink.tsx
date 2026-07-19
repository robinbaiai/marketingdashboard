import type { CSSProperties } from "react";
import { stockDigits, xueqiuSymbol, xueqiuUrl } from "@/lib/stockLinks";

export function StockLink({
  code,
  className = "",
  style,
}: {
  code: string | number | null | undefined;
  className?: string;
  style?: CSSProperties;
}) {
  const display = stockDigits(code);
  const symbol = xueqiuSymbol(code);

  if (!display || !symbol) {
    return <span className={className} style={style}>{String(code || "")}</span>;
  }

  return (
    <a
      href={xueqiuUrl(code)}
      target="_blank"
      rel="noopener noreferrer"
      title={`打开雪球 ${symbol}`}
      onClick={(event) => event.stopPropagation()}
      className={`transition-colors hover:text-cyan-300 hover:underline focus:text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-400/70 ${className}`}
      style={style}
    >
      {display}
    </a>
  );
}
