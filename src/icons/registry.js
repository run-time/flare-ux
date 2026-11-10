// The icon registry: every icon fx-icon (and fx-button, fx-text-field, …)
// can draw, gathered from named sets.
//
//   registerIconSet("my-app", { viewBox: "0 0 24 24", style: "stroke", icons: { rocket: "<path …/>" } });
//   iconSvg("rocket")        // core first, then each set in the order it registered
//   iconSvg("my-app:rocket") // that set only
//
// A set's `style` says how its shapes are painted: "stroke" (outlines in
// currentColor, like the core set) or "fill" (solid shapes in currentColor). An icon is the inner markup of its <svg>; one drawn on a
// different grid from its set is { viewBox, body }, and one that paints
// itself differently is { attrs, body }.

const sets = new Map();
const listeners = new Set();

const PAINT = {
  stroke: 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"',
  fill: 'fill="currentColor"',
};

/** Add (or replace) a set of icons, found by name or as `<prefix>:<name>`. */
export function registerIconSet(prefix, { viewBox = "0 0 24 24", style = "stroke", icons = {} } = {}) {
  sets.set(prefix, { viewBox, style, icons });
  for (const listener of listeners) listener(prefix);
}

/** Called with a set's prefix whenever one registers, so drawn icons can catch up. */
export function onIconSetRegistered(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Where `name` resolves: { prefix, name, set, icon }, or null. */
export function findIcon(name) {
  if (!name) return null;
  const colon = name.indexOf(":");
  if (colon > 0) {
    const prefix = name.slice(0, colon);
    const own = name.slice(colon + 1);
    const set = sets.get(prefix);
    return set?.icons[own] ? { prefix, name: own, set, icon: set.icons[own] } : null;
  }
  for (const [prefix, set] of sets) {
    if (set.icons[name]) return { prefix, name, set, icon: set.icons[name] };
  }
  return null;
}

/** The icon as an <svg> string, hidden from assistive technology; "" when unknown. */
export function iconSvg(name, { className = "" } = {}) {
  const found = findIcon(name);
  if (!found) return "";
  const { set, icon } = found;
  const body = typeof icon === "string" ? icon : icon.body;
  const viewBox = (typeof icon === "object" && icon.viewBox) || set.viewBox;
  const paint = (typeof icon === "object" && icon.attrs) || PAINT[set.style] || PAINT.fill;
  const cls = className ? ` class="${className}"` : "";
  return `<svg${cls} viewBox="${viewBox}" ${paint} aria-hidden="true" focusable="false" data-set="${found.prefix}">${body}</svg>`;
}

/** Every registered icon: [{ name, prefix, use }] -- `use` is what to write in name="…". */
export function iconNames() {
  const taken = new Set();
  const list = [];
  for (const [prefix, set] of sets) {
    for (const name of Object.keys(set.icons)) {
      const use = taken.has(name) ? `${prefix}:${name}` : name;
      taken.add(name);
      list.push({ name, prefix, use });
    }
  }
  return list;
}

/** The registered sets' prefixes, in lookup order. */
export function iconSets() {
  return [...sets.keys()];
}
