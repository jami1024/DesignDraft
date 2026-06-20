// Runtime element selector for the DesignDraft preview. Runs inside the
// Sandpack preview iframe. Reads the build-time data-dd-id="<file>:<line>:<col>"
// stamped by the vite babel plugin and reports the precise source location of
// a clicked element back to the parent workbench. Inert until the parent posts
// { source: "designdraft", action: "enable" }.

type DdSelectPayload = {
  ddId: string;
  file: string | null;
  line: number | null;
  column: number | null;
  tagName: string;
  text: string;
  html: string;
};

const SOURCE = "designdraft";

function parseDdId(el: Element | null): {
  ddId: string;
  file: string | null;
  line: number | null;
  column: number | null;
  host: Element | null;
} {
  let cur: Element | null = el;
  while (cur && cur !== document.body) {
    const id = cur.getAttribute("data-dd-id");
    if (id) {
      const m = id.match(/^(.*):(\d+):(\d+)$/);
      return {
        ddId: id,
        file: m ? m[1] : null,
        line: m ? Number(m[2]) : null,
        column: m ? Number(m[3]) : null,
        host: cur,
      };
    }
    cur = cur.parentElement;
  }
  return { ddId: "", file: null, line: null, column: null, host: el };
}

function init() {
  if ((window as unknown as { __ddSelector?: boolean }).__ddSelector) return;
  (window as unknown as { __ddSelector?: boolean }).__ddSelector = true;

  const hover = document.createElement("div");
  hover.style.cssText =
    "position:fixed;pointer-events:none;z-index:99998;border:2px solid #3B82F6;border-radius:4px;background:rgba(59,130,246,0.08);transition:all .08s ease;display:none;";
  const select = document.createElement("div");
  select.style.cssText =
    "position:fixed;pointer-events:none;z-index:99999;border:2px solid #10B981;border-radius:4px;background:rgba(16,185,129,0.08);display:none;";
  const tip = document.createElement("div");
  tip.style.cssText =
    "position:fixed;z-index:100000;pointer-events:none;background:#1C1917;color:#FAFAF9;font:11px/1.4 monospace;padding:3px 8px;border-radius:4px;white-space:nowrap;display:none;max-width:90vw;overflow:hidden;text-overflow:ellipsis;";

  let enabled = false;
  let selected: Element | null = null;
  const isOwn = (el: Element) => el === hover || el === select || el === tip;

  const place = (box: HTMLElement, el: Element) => {
    const r = el.getBoundingClientRect();
    box.style.display = "block";
    box.style.left = `${r.left}px`;
    box.style.top = `${r.top}px`;
    box.style.width = `${r.width}px`;
    box.style.height = `${r.height}px`;
  };

  const showTip = (el: Element, label: string) => {
    const r = el.getBoundingClientRect();
    tip.textContent = label;
    tip.style.display = "block";
    tip.style.left = `${Math.max(0, Math.min(r.left, window.innerWidth - 320))}px`;
    tip.style.top = `${Math.max(0, r.top - 24)}px`;
  };

  const onMove = (e: MouseEvent) => {
    if (!enabled) return;
    const target = e.target as Element;
    if (!target || target === document.body || isOwn(target)) {
      hover.style.display = "none";
      return;
    }
    place(hover, target);
    const info = parseDdId(target);
    showTip(target, info.ddId || target.tagName.toLowerCase());
  };

  const onClick = (e: MouseEvent) => {
    if (!enabled) return;
    const target = e.target as Element;
    if (!target || target === document.body || isOwn(target)) return;
    e.preventDefault();
    e.stopPropagation();

    const info = parseDdId(target);
    const host = (info.host as Element) ?? target;
    selected = host;
    place(select, host);
    hover.style.display = "none";
    showTip(host, info.ddId || host.tagName.toLowerCase());

    const payload: DdSelectPayload = {
      ddId: info.ddId,
      file: info.file,
      line: info.line,
      column: info.column,
      tagName: host.tagName.toLowerCase(),
      text: (host.textContent ?? "").trim().slice(0, 300),
      html: (host as HTMLElement).outerHTML.slice(0, 4000),
    };
    window.parent.postMessage({ source: SOURCE, type: "select", payload }, "*");
  };

  const clear = () => {
    selected = null;
    select.style.display = "none";
    tip.style.display = "none";
    window.parent.postMessage({ source: SOURCE, type: "clear" }, "*");
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && selected) {
      e.preventDefault();
      clear();
    }
  };

  document.addEventListener("mousemove", onMove, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKey, true);

  const ensureMounted = () => {
    for (const box of [hover, select, tip]) if (!box.isConnected) document.body.appendChild(box);
  };

  window.addEventListener("message", (e: MessageEvent) => {
    const data = e.data as { source?: string; action?: string } | null;
    if (!data || data.source !== SOURCE) return;
    if (data.action === "enable") {
      ensureMounted();
      enabled = true;
    } else if (data.action === "disable") {
      enabled = false;
      hover.style.display = "none";
      clear();
    }
  });

  // announce readiness so the parent can (re)send enable after a recompile
  window.parent.postMessage({ source: SOURCE, type: "ready" }, "*");
}

if (typeof window !== "undefined") {
  if (document.body) init();
  else window.addEventListener("DOMContentLoaded", init);
}

export {};
