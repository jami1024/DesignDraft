export type SelectedElementInfo = {
  path: string;
  html: string;
  text: string;
  tagName: string;
  stableId?: string;
  boundingBox: { x: number; y: number; width: number; height: number };
};

export const ELEMENT_SELECTOR_MESSAGE_TYPE = "designdraft:element-selected";
export const ELEMENT_SELECTOR_CLEAR_TYPE = "designdraft:element-cleared";

export function getElementSelectorScript(): string {
  return `
(function() {
  if (window.__designdraftSelector) return;
  window.__designdraftSelector = true;

  var overlay = document.createElement('div');
  overlay.id = '__dd-overlay';
  overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:99999;border:2px solid #3B82F6;border-radius:4px;background:rgba(59,130,246,0.08);transition:all 0.15s ease;display:none;';
  document.body.appendChild(overlay);

  var tooltip = document.createElement('div');
  tooltip.id = '__dd-tooltip';
  tooltip.style.cssText = 'position:fixed;z-index:100000;pointer-events:none;background:#1C1917;color:#FAFAF9;font-size:11px;font-family:monospace;padding:2px 6px;border-radius:4px;white-space:nowrap;display:none;';
  document.body.appendChild(tooltip);

  var lastTarget = null;

  function getDomPath(el) {
    var parts = [];
    var current = el;
    while (current && current !== document.body) {
      var selector = current.tagName.toLowerCase();
      if (current.id) {
        selector += '#' + current.id;
        parts.unshift(selector);
        break;
      }
      var parent = current.parentElement;
      if (parent) {
        var siblings = Array.from(parent.children).filter(function(c) { return c.tagName === current.tagName; });
        if (siblings.length > 1) {
          var index = siblings.indexOf(current) + 1;
          selector += ':nth-of-type(' + index + ')';
        }
      }
      parts.unshift(selector);
      current = parent;
    }
    return 'body > ' + parts.join(' > ');
  }

  function isControlElement(el) {
    return el.id && el.id.startsWith('__dd-');
  }

  document.addEventListener('mousemove', function(e) {
    var target = e.target;
    if (!target || target === document.body || target === document.documentElement || isControlElement(target)) {
      overlay.style.display = 'none';
      tooltip.style.display = 'none';
      lastTarget = null;
      return;
    }
    if (target === lastTarget) return;
    lastTarget = target;

    var rect = target.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';

    var label = target.tagName.toLowerCase();
    if (target.id) label += '#' + target.id;
    else if (target.className && typeof target.className === 'string') {
      var cls = target.className.trim().split(/\\s+/).slice(0, 2).join('.');
      if (cls) label += '.' + cls;
    }
    tooltip.textContent = label;
    tooltip.style.display = 'block';
    tooltip.style.left = Math.min(rect.left, window.innerWidth - 200) + 'px';
    tooltip.style.top = Math.max(0, rect.top - 24) + 'px';
  }, true);

  document.addEventListener('click', function(e) {
    var target = e.target;
    if (!target || target === document.body || target === document.documentElement || isControlElement(target)) return;

    e.preventDefault();
    e.stopPropagation();

    var rect = target.getBoundingClientRect();
    var stableId = '';
    var el = target;
    while (el && el !== document.body) {
      if (el.getAttribute && el.getAttribute('data-designdraft-id')) {
        stableId = el.getAttribute('data-designdraft-id');
        break;
      }
      el = el.parentElement;
    }

    var info = {
      path: getDomPath(target),
      html: target.outerHTML.substring(0, 2000),
      text: (target.innerText || '').substring(0, 500),
      tagName: target.tagName.toLowerCase(),
      stableId: stableId,
      boundingBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    };

    window.parent.postMessage({ type: '${ELEMENT_SELECTOR_MESSAGE_TYPE}', payload: info }, '*');
  }, true);

  document.addEventListener('mouseleave', function() {
    overlay.style.display = 'none';
    tooltip.style.display = 'none';
    lastTarget = null;
  });
})();
`;
}
