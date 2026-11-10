// The status tones every component speaks: the four alert states, plus info
// and neutral. Each has its own name and its other name -- fail is error,
// unknown is incomplete, pause is warning, pass is success.

export const TONES = ["error", "incomplete", "warning", "success", "info", "neutral"];

const ALIASES = {
  fail: "error",
  failed: "error",
  danger: "error",
  unknown: "incomplete",
  pause: "warning",
  paused: "warning",
  warn: "warning",
  pass: "success",
  passed: "success",
  ok: "success",
};

/** The canonical tone for any of its names; `fallback` for anything else. */
export function toneOf(name, fallback = "neutral") {
  const key = String(name ?? "").trim().toLowerCase();
  if (TONES.includes(key)) return key;
  return ALIASES[key] ?? fallback;
}

/**
 * CSS that gives `selector` -- with & where the tone's name goes, as in
 * ':host([tone="&"])' -- the tone's colors as --_tone, --_tone-bg,
 * --_tone-text, --_tone-fill and --_tone-on. Every name of a tone matches.
 */
export function toneCss(selector) {
  return TONES.map((tone) => {
    const selectors = toneSelectors(selector, tone);
    return `${selectors} { --_tone: var(--fx-status-${tone}); --_tone-bg: var(--fx-status-${tone}-bg); --_tone-text: var(--fx-status-${tone}-text); --_tone-fill: var(--fx-status-${tone}-fill); --_tone-on: var(--fx-status-${tone}-on); }`;
  }).join("\n");
}

/** `selector` once for each name of `tone` -- ':host([tone="&"])' for error matches fail too. */
export function toneSelectors(selector, tone) {
  const names = [tone, ...Object.keys(ALIASES).filter((alias) => ALIASES[alias] === tone)];
  return names.map((name) => selector.replaceAll("&", name)).join(", ");
}
