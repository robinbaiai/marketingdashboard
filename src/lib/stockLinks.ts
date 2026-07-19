export function stockDigits(code: string | number | null | undefined) {
  const raw = String(code || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return digits.slice(-6).padStart(6, "0");
}

export function xueqiuSymbol(code: string | number | null | undefined) {
  const c = stockDigits(code);
  if (!c) return "";
  if (/^6/.test(c)) return `SH${c}`;
  if (/^[03]/.test(c)) return `SZ${c}`;
  if (/^[489]/.test(c)) return `BJ${c}`;
  return c;
}

export function xueqiuUrl(code: string | number | null | undefined) {
  return `https://xueqiu.com/S/${xueqiuSymbol(code)}`;
}
