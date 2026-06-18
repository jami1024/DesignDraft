export type SelectedElementInfo = {
  path: string;
  html: string;
  text: string;
  tagName: string;
  stableId?: string;
  parentStableId?: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  depth: number;
};

export const ELEMENT_SELECTOR_MESSAGE_TYPE = "designdraft:element-selected";
export const ELEMENT_SELECTOR_CLEAR_TYPE = "designdraft:element-cleared";

export function getElementSelectorScript(): string {
  return `
(function() {
  if (window.__designdraftSelector) return;
  window.__designdraftSelector = true;

  var hoverOverlay = document.createElement('div');
  hoverOverlay.id = '__dd-hover';
  hoverOverlay.style.cssText = 'position:fixed;pointer-events:none;z-index:99998;border:2px solid #3B82F6;border-radius:4px;background:rgba(59,130,246,0.08);transition:all 0.1s ease;display:none;';
  document.body.appendChild(hoverOverlay);

  var selectOverlay = document.createElement('div');
  selectOverlay.id = '__dd-select';
  selectOverlay.style.cssText = 'position:fixed;pointer-events:none;z-index:99999;border:2px solid #10B981;border-radius:4px;background:rgba(16,185,129,0.08);display:none;';
  document.body.appendChild(selectOverlay);

  var tooltip = document.createElement('div');
  tooltip.id = '__dd-tooltip';
  tooltip.style.cssText = 'position:fixed;z-index:100000;pointer-events:none;background:#1C1917;color:#FAFAF9;font-size:11px;font-family:monospace;padding:3px 8px;border-radius:4px;white-space:nowrap;display:none;max-width:400px;overflow:hidden;text-overflow:ellipsis;';
  document.body.appendChild(tooltip);

  var breadcrumb = document.createElement('div');
  breadcrumb.id = '__dd-breadcrumb';
  breadcrumb.style.cssText = 'position:fixed;bottom:8px;left:50%;transform:translateX(-50%);z-index:100001;pointer-events:none;background:#1C1917;color:#FAFAF9;font-size:11px;font-family:monospace;padding:4px 12px;border-radius:6px;white-space:nowrap;display:none;max-width:80vw;overflow:hidden;text-overflow:ellipsis;';
  document.body.appendChild(breadcrumb);

  var lastHoverTarget = null;
  var selectedEl = null;

  function isControlElement(el) {
    return el.id && el.id.startsWith('__dd-');
  }

  function getDomPath(el) {
    var parts = [];
    var current = el;
    while (current && current !== document.body) {
      var selector = current.tagName.toLowerCase();
      if (current.id && !current.id.startsWith('__dd-')) {
        selector += '#' + CSS.escape(current.id);
        parts.unshift(selector);
        break;
      }
      var ddId = current.getAttribute('data-designdraft-id');
      if (ddId) {
        selector = '[data-designdraft-id="' + ddId + '"]';
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

  function getElementLabel(el) {
    var label = el.tagName.toLowerCase();
    var ddId = el.getAttribute('data-designdraft-id');
    if (ddId) return label + '[' + ddId + ']';
    if (el.id && !el.id.startsWith('__dd-')) return label + '#' + el.id;
    if (el.className && typeof el.className === 'string') {
      var cls = el.className.trim().split(/\\s+/).slice(0, 2).join('.');
      if (cls) return label + '.' + cls;
    }
    return label;
  }

  function getBreadcrumbPath(el) {
    var parts = [];
    var current = el;
    var depth = 0;
    while (current && current !== document.body && depth < 6) {
      var tag = current.tagName.toLowerCase();
      var ddId = current.getAttribute('data-designdraft-id');
      if (ddId) {
        parts.unshift(tag + '[' + ddId + ']');
      } else {
        parts.unshift(tag);
      }
      current = current.parentElement;
      depth++;
    }
    return parts.join(' > ');
  }

  function getDepth(el) {
    var d = 0;
    var current = el;
    while (current && current !== document.body) {
      d++;
      current = current.parentElement;
    }
    return d;
  }

  function getStableId(el) {
    var ddId = el.getAttribute ? el.getAttribute('data-designdraft-id') : null;
    return ddId || '';
  }

  function getParentStableId(el) {
    var current = el.parentElement;
    while (current && current !== document.body) {
      var ddId = current.getAttribute ? current.getAttribute('data-designdraft-id') : null;
      if (ddId) return ddId;
      current = current.parentElement;
    }
    return '';
  }

  function buildElementInfo(el) {
    var rect = el.getBoundingClientRect();
    return {
      path: getDomPath(el),
      html: el.outerHTML.substring(0, 5000),
      text: (el.innerText || '').substring(0, 500),
      tagName: el.tagName.toLowerCase(),
      stableId: getStableId(el),
      parentStableId: getParentStableId(el),
      boundingBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      depth: getDepth(el)
    };
  }

  function positionOverlay(overlay, el) {
    var rect = el.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
  }

  function updateTooltip(el) {
    var label = getElementLabel(el);
    var rect = el.getBoundingClientRect();
    tooltip.textContent = label;
    tooltip.style.display = 'block';
    tooltip.style.left = Math.min(rect.left, window.innerWidth - 300) + 'px';
    tooltip.style.top = Math.max(0, rect.top - 26) + 'px';
  }

  function updateBreadcrumb(el) {
    breadcrumb.textContent = getBreadcrumbPath(el);
    breadcrumb.style.display = 'block';
  }

  function sendSelection(el) {
    var info = buildElementInfo(el);
    window.parent.postMessage({ type: '${ELEMENT_SELECTOR_MESSAGE_TYPE}', payload: info }, '*');
  }

  function selectElement(el) {
    selectedEl = el;
    positionOverlay(selectOverlay, el);
    updateTooltip(el);
    updateBreadcrumb(el);
    sendSelection(el);
  }

  function clearSelection() {
    selectedEl = null;
    selectOverlay.style.display = 'none';
    breadcrumb.style.display = 'none';
    window.parent.postMessage({ type: '${ELEMENT_SELECTOR_CLEAR_TYPE}' }, '*');
  }

  document.addEventListener('mousemove', function(e) {
    var target = e.target;
    if (!target || target === document.body || target === document.documentElement || isControlElement(target)) {
      hoverOverlay.style.display = 'none';
      if (!selectedEl) {
        tooltip.style.display = 'none';
      }
      lastHoverTarget = null;
      return;
    }
    if (target === lastHoverTarget) return;
    if (target === selectedEl) {
      hoverOverlay.style.display = 'none';
      lastHoverTarget = target;
      return;
    }
    lastHoverTarget = target;
    positionOverlay(hoverOverlay, target);
    if (!selectedEl) {
      updateTooltip(target);
    }
  }, true);

  document.addEventListener('click', function(e) {
    var target = e.target;
    if (!target || target === document.body || target === document.documentElement || isControlElement(target)) return;

    e.preventDefault();
    e.stopPropagation();

    selectElement(target);
    hoverOverlay.style.display = 'none';
  }, true);

  document.addEventListener('wheel', function(e) {
    if (!selectedEl) return;

    e.preventDefault();
    e.stopPropagation();

    var next = null;
    if (e.deltaY < 0) {
      // scroll up -> parent
      var parent = selectedEl.parentElement;
      if (parent && parent !== document.body && parent !== document.documentElement) {
        next = parent;
      }
    } else if (e.deltaY > 0) {
      // scroll down -> first meaningful child
      var children = Array.from(selectedEl.children).filter(function(c) {
        return !isControlElement(c) && c.offsetWidth > 0 && c.offsetHeight > 0;
      });
      if (children.length > 0) {
        next = children[0];
      }
    }

    if (next) {
      selectElement(next);
    }
  }, { passive: false, capture: true });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && selectedEl) {
      e.preventDefault();
      clearSelection();
      tooltip.style.display = 'none';
    }

    if (!selectedEl) return;

    // Arrow left/right to navigate siblings
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      var parent = selectedEl.parentElement;
      if (!parent) return;
      var siblings = Array.from(parent.children).filter(function(c) {
        return !isControlElement(c) && c.offsetWidth > 0 && c.offsetHeight > 0;
      });
      var idx = siblings.indexOf(selectedEl);
      if (idx === -1) return;
      var nextIdx = e.key === 'ArrowRight' ? idx + 1 : idx - 1;
      if (nextIdx >= 0 && nextIdx < siblings.length) {
        selectElement(siblings[nextIdx]);
      }
    }
  }, true);

  document.addEventListener('mouseleave', function() {
    hoverOverlay.style.display = 'none';
    if (!selectedEl) {
      tooltip.style.display = 'none';
    }
  });
})();
`;
}
