// Keeps an open popup on its anchor. A popover sits in the top layer at a
// fixed position, so it stays put when the page (or any scrolling box the
// anchor is in) scrolls; follow() calls `place` on every scroll and resize
// until the returned function stops it.
//
//   #unfollow = () => {};
//   open:  this.#unfollow = follow(anchor, () => this.#place(), { popup, close });
//   close: this.#unfollow();
//
// With `popup` and `close`: once a scroll carries any part of the anchor or
// the open popup outside the area that scrolled -- the scrolling box (or the
// window), within any scrolling boxes around it, along the way it scrolls --
// `close` is called rather than leaving the popup on a half-hidden anchor.
//
// A scroll event does not leave the shadow root it happens in, so a listener
// on window alone misses a box that scrolls inside a component (an app
// shell's main area, say). The listener goes on every shadow root the anchor
// is drawn inside -- through slots as well as hosts -- and on window.

const parentOf = (node) => node.assignedSlot ?? node.parentNode ?? node.host;

export function follow(anchor, place, { popup, close } = {}) {
  const options = { capture: true, passive: true };
  const targets = [window];
  const scrollers = []; // the anchor's scrolling boxes, innermost first
  for (let node = parentOf(anchor); node; node = parentOf(node)) {
    if (node instanceof ShadowRoot) targets.push(node);
    else if (node instanceof Element && node !== document.documentElement && node !== document.body) {
      const { overflowX, overflowY } = getComputedStyle(node);
      if (/auto|scroll/.test(overflowX + overflowY)) scrollers.push(node);
    }
  }

  // What shows of the box that scrolled: the window, cut by that box and the
  // scrolling boxes outside it.
  const visibleArea = (boxes) => {
    let area = { top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth };
    for (const box of boxes) {
      const rect = box.getBoundingClientRect();
      const top = rect.top + box.clientTop;
      const left = rect.left + box.clientLeft;
      area = {
        top: Math.max(area.top, top),
        left: Math.max(area.left, left),
        bottom: Math.min(area.bottom, top + box.clientHeight),
        right: Math.min(area.right, left + box.clientWidth),
      };
    }
    return area;
  };
  // Only along the way the box scrolls: a menu that hangs past the side of
  // a box that scrolls up and down is fine until it is carried past the top
  // or bottom.
  const inside = (rect, area, box) => {
    const scroller = box ?? document.scrollingElement;
    const down = scroller.scrollHeight > scroller.clientHeight;
    const across = scroller.scrollWidth > scroller.clientWidth;
    return (
      (!down || (rect.top >= area.top - 1 && rect.bottom <= area.bottom + 1)) &&
      (!across || (rect.left >= area.left - 1 && rect.right <= area.right + 1))
    );
  };

  // Scroll events fire before the frame paints, so placing right away keeps
  // the popup on its anchor with no lag.
  const onScroll = (event) => {
    // A scroll inside the popup itself (a long list) moves nothing.
    if (popup && event.composedPath?.().includes(popup)) return;
    place();
    if (!popup || !close || !popup.matches(":popover-open")) return;
    // Only a scroll that moves the anchor: the page, or a box around it.
    const at = event.target instanceof Element ? scrollers.indexOf(event.target) : scrollers.length;
    if (at < 0) return;
    const area = visibleArea(scrollers.slice(at));
    const box = scrollers[at];
    if (!inside(anchor.getBoundingClientRect(), area, box) || !inside(popup.getBoundingClientRect(), area, box)) close();
  };
  for (const target of targets) target.addEventListener("scroll", onScroll, options);
  window.addEventListener("resize", place, { passive: true });
  return () => {
    for (const target of targets) target.removeEventListener("scroll", onScroll, options);
    window.removeEventListener("resize", place, { passive: true });
  };
}
