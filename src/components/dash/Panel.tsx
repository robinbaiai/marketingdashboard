import { useEffect, useState, type ReactNode } from "react";

interface PanelProps {
  title: string;
  icon?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  accent?: string;
  expandable?: boolean;
  expandedChildren?: ReactNode;
  expandedRight?: ReactNode;
  expandedBodyClassName?: string;
}

/** 驾驶舱面板容器 — 终端风格 */
export function Panel({
  title,
  icon,
  right,
  children,
  className = "",
  bodyClassName = "",
  accent = "#38bdf8",
  expandable = false,
  expandedChildren,
  expandedRight,
  expandedBodyClassName = "",
}: PanelProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  const titleContent = (
    <>
      {icon && <span className="text-[13px] leading-none" style={{ color: accent }}>{icon}</span>}
      <h2 className="text-[13px] font-semibold tracking-wide text-slate-200">{title}</h2>
    </>
  );

  return (
    <>
      <section
        className={`flex min-h-0 flex-col rounded-md border border-slate-700/40 bg-[#0c1320]/90 shadow-[0_0_24px_rgba(0,0,0,0.35)] backdrop-blur ${className}`}
      >
        <header className="flex h-8 shrink-0 items-center gap-2 border-b border-slate-700/40 px-2.5">
          <span className="inline-block h-3.5 w-1 rounded-sm" style={{ background: accent }} />
          {expandable ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              title="放大查看"
              className="-ml-0.5 flex min-w-0 items-center gap-2 rounded px-0.5 py-0.5 text-left transition hover:bg-slate-800/70 focus:outline-none focus:ring-1 focus:ring-cyan-400/70"
            >
              {titleContent}
            </button>
          ) : (
            titleContent
          )}
          <div className="ml-auto flex items-center gap-2">{right}</div>
        </header>
        <div className={`min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
      </section>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setExpanded(false);
          }}
        >
          <section className="flex h-[70vh] w-[70vw] max-w-[1180px] min-w-[720px] flex-col rounded-md border border-cyan-400/50 bg-[#0c1320] shadow-[0_0_48px_rgba(34,211,238,0.24)] max-lg:h-[78vh] max-lg:w-[94vw] max-lg:min-w-0">
            <header className="flex h-10 shrink-0 items-center gap-2 border-b border-slate-700/50 px-3">
              <span className="inline-block h-4 w-1.5 rounded-sm" style={{ background: accent }} />
              {icon && <span className="text-[18px] leading-none" style={{ color: accent }}>{icon}</span>}
              <h2 className="text-[18px] font-semibold tracking-wide text-slate-100">{title}</h2>
              <div className="ml-auto flex items-center gap-2">
                {expandedRight}
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="rounded px-2 py-1 text-[16px] text-slate-400 transition hover:bg-slate-800 hover:text-slate-50"
                  title="关闭"
                >
                  关闭
                </button>
              </div>
            </header>
            <div className={`min-h-0 flex-1 overflow-hidden bg-[#08111f] ${expandedBodyClassName}`}>
              {expandedChildren ?? (
                <div className="h-full overflow-auto">
                  <div
                    className="h-1/2 w-1/2 origin-top-left"
                    style={{ transform: "scale(2)" }}
                  >
                    {children}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
