// <fx-chart>: a bar, column, line or area chart drawn in SVG -- one axis,
// thin marks, a legend, a tooltip on hover or arrow keys, and the numbers
// as a table on demand.
//
//   chart.data = {
//     labels: ["Mon", "Tue", "Wed"],
//     series: [
//       { name: "Passed", values: [42, 51, 47] },
//       { name: "Failed", values: [3, 6, 2], color: "fail" },
//     ],
//   };
//   <fx-chart type="column" label="Runs this week" stacked></fx-chart>
//
// Or the same object as JSON in a `data` attribute. `colors` beside labels
// ([one per label]) colors each category on its own -- each slice of a pie,
// or each bar of a single-series chart.
//
// Attributes:
//   type          column (default: vertical bars) | bar (horizontal) | line |
//                 area | pie (the first series' values, one slice a label)
//   label         what it shows -- its name for assistive technology, and the
//                 table's caption
//   stacked       series stack (column, bar, area) rather than sit side by side
//   wide          bars fill their category, 4px apart, instead of thin
//                 bars (24px at most) with space around them
//   value-labels  each bar's value at its tip, where it fits (single-series
//                 bars read best this way)
//   unit, prefix  around every value: unit="ms" gives 120ms, prefix="$" $4.2K
//   decimals      digits after the point (default: as given, up to 2)
//   height        the plot's height (default 16rem)
//   y-min, y-max  the value axis's ends (default: from the data, from 0 for
//                 bars and areas)
//   no-table      hide the "Show table" button
//
// Each series takes a color: none for the chart palette in its order
// (--fx-color-chart-*, picked so neighbors stay apart -- also for color-blind
// readers), a status tone (pass, fail, …) for series that are states, or any
// CSS color. A series keeps its color when others are hidden from the legend.
//
// Two or more series get a legend; clicking an entry hides or shows that
// series. A line chart of up to four series also names each at its end.
//
// Keyboard: the plot takes focus; Left / Right (Up / Down for bars) step
// through the categories with the tooltip, and the values are read out.
// Events: fx:series-toggle ({ name, hidden }).

import { escapeHtml } from "../lib/escape.js";
import { toneOf, TONES } from "../lib/tones.js";

// The chart colors in series order: dark blue first, the grays last, every
// neighbor far enough apart to tell even under color blindness.
const ORDER = [9, 5, 15, 11, 13, 12, 1, 14, 3, 6, 2, 7, 10, 4, 16, 8];
const STATUS_WORDS = new Set([...TONES, "fail", "failed", "danger", "unknown", "pause", "paused", "warn", "pass", "passed", "ok"]);
const GAP = 2; // the surface gap between touching marks
const BAR_MAX = 24; // a bar is never thicker -- unless wide
const WIDE_GAP = 4; // the gap between wide bars

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --fx-chart-surface: var(--fx-layer);
      --_height: 16rem;
      position: relative;
      display: block;
      min-width: 0;
      color: var(--fx-text);
      font: var(--fx-type-body-compact-01);
    }
    :host([hidden]) { display: none; }
    .legend { display: flex; flex-wrap: wrap; gap: var(--fx-spacing-02) var(--fx-spacing-05); margin: 0 0 var(--fx-spacing-04); padding: 0; list-style: none; }
    .legend:empty { display: none; }
    .legend button {
      all: unset;
      display: inline-flex;
      align-items: center;
      gap: var(--fx-spacing-03);
      border-radius: var(--fx-radius-sm);
      color: var(--fx-text-secondary);
      font: var(--fx-type-helper-01);
      cursor: pointer;
    }
    .legend button:hover { color: var(--fx-text); }
    .legend button:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: 2px; }
    .legend button[aria-pressed="false"] { opacity: 0.45; text-decoration: line-through; }
    .key { flex: none; width: 0.75rem; height: 0.75rem; border-radius: 2px; }
    .key.line { height: 2px; border-radius: 1px; }
    .plot { position: relative; height: var(--_height); outline: none; border-radius: var(--fx-radius-sm); }
    .plot:focus-visible { box-shadow: 0 0 0 2px var(--fx-focus); }
    svg { display: block; width: 100%; height: 100%; overflow: visible; }
    svg text { fill: var(--fx-text-secondary); font: var(--fx-type-helper-01); font-variant-numeric: tabular-nums; }
    svg .end-label { fill: var(--fx-text); }
    .grid { stroke: var(--fx-border); stroke-width: 1; shape-rendering: crispEdges; }
    .base { stroke: var(--fx-border-strong); stroke-width: 1; shape-rendering: crispEdges; }
    .cross { stroke: var(--fx-border-strong); stroke-width: 1; shape-rendering: crispEdges; }
    .band { fill: var(--fx-layer-hover); opacity: 0.6; }
    .ring { stroke: var(--fx-chart-surface); stroke-width: 2; }
    .slices path, .slices circle { stroke: var(--fx-chart-surface); stroke-width: 2; stroke-linejoin: round; }
    .slice-hover { fill: none; stroke: var(--fx-text); stroke-width: 2; }
    .legend .entry { display: inline-flex; align-items: center; gap: var(--fx-spacing-03); color: var(--fx-text-secondary); font: var(--fx-type-helper-01); }
    .tip {
      position: absolute;
      z-index: 1;
      min-width: 9rem;
      max-width: 16rem;
      padding: var(--fx-spacing-03) var(--fx-spacing-04);
      border-radius: var(--fx-radius);
      background: var(--fx-inverse);
      color: var(--fx-inverse-text);
      box-shadow: var(--fx-shadow);
      font: var(--fx-type-helper-01);
      pointer-events: none;
    }
    .tip[hidden] { display: none; }
    .tip .title { margin-bottom: var(--fx-spacing-02); font-weight: 600; }
    .tip .row { display: flex; align-items: center; gap: var(--fx-spacing-03); }
    .tip .row .name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tip .row .value { font-variant-numeric: tabular-nums; font-weight: 600; }
    .tip .total { margin-top: var(--fx-spacing-02); padding-top: var(--fx-spacing-02); border-top: 1px solid color-mix(in srgb, currentColor 25%, transparent); }
    .tip .key { box-shadow: 0 0 0 1px color-mix(in srgb, currentColor 30%, transparent); }
    .empty { display: grid; place-items: center; height: 100%; color: var(--fx-text-secondary); }
    .foot { display: flex; justify-content: flex-end; margin-top: var(--fx-spacing-03); }
    :host([no-table]) .foot { display: none; }
    .toggle { all: unset; border-radius: var(--fx-radius-sm); color: var(--fx-link); font: var(--fx-type-helper-01); cursor: pointer; }
    .toggle:hover { text-decoration: underline; }
    .toggle:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: 2px; }
    table { width: 100%; margin-top: var(--fx-spacing-03); border-collapse: collapse; font: var(--fx-type-body-compact-01); }
    table[hidden] { display: none; }
    caption { padding-bottom: var(--fx-spacing-02); text-align: left; color: var(--fx-text-secondary); font: var(--fx-type-helper-01); }
    th, td { padding: var(--fx-spacing-02) var(--fx-spacing-04); border-bottom: 1px solid var(--fx-border); text-align: right; font-variant-numeric: tabular-nums; }
    th:first-child, td:first-child { text-align: left; }
    thead th { color: var(--fx-text-secondary); font: var(--fx-type-heading-01); }
    .spoken { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  </style>
  <ul class="legend" part="legend"></ul>
  <div class="plot" part="plot" tabindex="0">
    <svg aria-hidden="true"></svg>
    <div class="tip" part="tooltip" hidden></div>
  </div>
  <div class="spoken" aria-live="polite"></div>
  <div class="foot"><button type="button" class="toggle" aria-expanded="false">Show table</button></div>
  <table part="table" hidden></table>
`;

let measurer = null;
/** The width of `text` in px at the chart's small type. */
function textWidth(text, font) {
  measurer ??= document.createElement("canvas").getContext("2d");
  measurer.font = font;
  return measurer.measureText(String(text)).width;
}

/** Round ticks covering min..max: about `count` of them, on 1/2/5 steps. */
function niceTicks(min, max, count = 5) {
  if (min === max) max = min + 1;
  const raw = (max - min) / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / magnitude;
  const step = (fraction >= 7.5 ? 10 : fraction >= 3.5 ? 5 : fraction >= 1.5 ? 2 : 1) * magnitude;
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
  return ticks;
}

/** A bar from `base` to `end` along its value axis, its data end rounded. */
function barPath(vertical, cross, thickness, base, end) {
  const length = Math.abs(end - base);
  if (length < 0.5) return "";
  const r = Math.min(4, thickness / 2, length);
  const a = cross;
  const b = cross + thickness;
  if (vertical) {
    const up = end < base; // larger values draw upward
    const s = up ? 1 : -1;
    return `M${a},${base}V${end + s * r}Q${a},${end} ${a + r},${end}H${b - r}Q${b},${end} ${b},${end + s * r}V${base}Z`;
  }
  const right = end > base;
  const s = right ? -1 : 1;
  return `M${base},${a}H${end + s * r}Q${end},${a} ${end},${a + r}V${b - r}Q${end},${b} ${end + s * r},${b}H${base}Z`;
}

export class FxChart extends HTMLElement {
  static observedAttributes = ["type", "label", "stacked", "wide", "value-labels", "unit", "prefix", "decimals", "height", "y-min", "y-max", "data"];

  #data = { labels: [], series: [] };
  #hidden = new Set();
  #layout = null; // what the last draw measured, for the pointer and keys
  #active = -1;
  #frame = 0;
  #resize = new ResizeObserver(() => this.#schedule());

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.appendChild(template.content.cloneNode(true));
    const plot = root.querySelector(".plot");
    plot.addEventListener("pointermove", (event) => this.#hoverAt(event));
    plot.addEventListener("pointerleave", () => this.#show(-1));
    plot.addEventListener("focus", () => this.#show(Math.max(0, this.#active)));
    plot.addEventListener("blur", () => this.#show(-1));
    plot.addEventListener("keydown", (event) => this.#keys(event));
    root.querySelector(".legend").addEventListener("click", (event) => {
      const button = event.target.closest("button[data-series]");
      if (!button) return;
      const name = button.dataset.series;
      if (this.#hidden.has(name)) this.#hidden.delete(name);
      else this.#hidden.add(name);
      this.dispatchEvent(new CustomEvent("fx:series-toggle", { bubbles: true, detail: { name, hidden: this.#hidden.has(name) } }));
      this.#draw();
    });
    root.querySelector(".toggle").addEventListener("click", (event) => {
      const table = root.querySelector("table");
      table.hidden = !table.hidden;
      event.currentTarget.textContent = table.hidden ? "Show table" : "Hide table";
      event.currentTarget.setAttribute("aria-expanded", String(!table.hidden));
    });
  }

  connectedCallback() {
    if (Object.prototype.hasOwnProperty.call(this, "data")) {
      const value = this.data;
      delete this.data;
      this.data = value;
    }
    this.#resize.observe(this);
    this.#schedule();
  }

  disconnectedCallback() {
    this.#resize.disconnect();
    cancelAnimationFrame(this.#frame);
  }

  attributeChangedCallback(name) {
    if (name === "data") {
      try {
        this.#setData(JSON.parse(this.getAttribute("data") || "{}"));
      } catch {
        this.#setData({});
      }
    }
    this.#schedule();
  }

  /** { labels: string[], series: [{ name, values: number[], color? }] } */
  get data() {
    return this.#data;
  }
  set data(value) {
    this.#setData(value);
    this.#schedule();
  }

  #setData(value) {
    const labels = Array.isArray(value?.labels) ? value.labels.map(String) : [];
    const series = Array.isArray(value?.series) ? value.series : [];
    this.#data = {
      labels,
      colors: Array.isArray(value?.colors) ? value.colors : null,
      series: series.map((one, index) => ({
        name: String(one.name ?? `Series ${index + 1}`),
        values: labels.map((_, i) => {
          const v = Number(one.values?.[i]);
          return Number.isFinite(v) ? v : null;
        }),
        color: one.color,
        index,
      })),
    };
    for (const name of [...this.#hidden]) if (!this.#data.series.some((one) => one.name === name)) this.#hidden.delete(name);
  }

  // ------------------------------------------------------------ helpers

  get #type() {
    const type = this.getAttribute("type");
    return ["bar", "line", "area", "pie"].includes(type) ? type : "column";
  }

  /** A given color: a status tone's, or as written. */
  #resolve(given) {
    return STATUS_WORDS.has(String(given).toLowerCase()) ? `var(--fx-status-${toneOf(given)})` : String(given);
  }

  /** The palette's color for the nth series (or slice), in its order. */
  #paletteAt(index) {
    const step = ORDER[index];
    if (step === undefined) {
      if (index === ORDER.length) console.warn("fx-chart: more than 16 series -- fold the rest into “Other”, or split the chart.");
      return "var(--fx-color-chart-08)";
    }
    return `var(--fx-color-chart-${String(step).padStart(2, "0")})`;
  }

  /** A series' color: its own, or the palette's in order. */
  #colorOf(series) {
    return series.color ? this.#resolve(series.color) : this.#paletteAt(series.index);
  }

  /** A category's own color, when `colors` gives one (single series, pie). */
  #pointColor(index, series) {
    const given = this.#data.colors?.[index];
    if (given) return this.#resolve(given);
    return this.#type === "pie" ? this.#paletteAt(index) : this.#colorOf(series);
  }

  #format(value, axis = false) {
    if (value === null || value === undefined) return "–";
    const given = this.getAttribute("decimals");
    const decimals = given === null || given === "" ? NaN : Number(given);
    const big = axis && Math.abs(value) >= 10000;
    const text = new Intl.NumberFormat(undefined, {
      notation: big ? "compact" : "standard",
      maximumFractionDigits: big ? 1 : Number.isFinite(decimals) ? decimals : 2,
      minimumFractionDigits: !big && Number.isFinite(decimals) ? decimals : 0,
    }).format(value);
    return `${this.getAttribute("prefix") ?? ""}${text}${this.getAttribute("unit") ?? ""}`;
  }

  #schedule() {
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => this.#draw());
  }

  // ------------------------------------------------------------- drawing

  #draw() {
    const root = this.shadowRoot;
    if (!root || !this.isConnected) return;
    const height = this.getAttribute("height");
    if (height) this.style.setProperty("--_height", height);
    else this.style.removeProperty("--_height");

    const type = this.#type;
    const stacked = this.hasAttribute("stacked") && type !== "line";
    const vertical = type !== "bar";
    const { labels, series } = this.#data;
    const shown = series.filter((one) => !this.#hidden.has(one.name));

    this.#drawLegend(series, type);
    this.#drawTable(labels, series);
    const label = this.getAttribute("label") || "Chart";
    root.querySelector(".plot").setAttribute("aria-label", `${label}: ${labels.length} ${type === "line" || type === "area" ? "points" : "categories"}. Use the arrow keys to read each, or show the table.`);
    root.querySelector(".plot").setAttribute("role", "group");

    const svg = root.querySelector("svg");
    const plot = root.querySelector(".plot");
    const width = plot.clientWidth;
    const heightPx = plot.clientHeight;
    if (!labels.length || !series.length || width < 40) {
      svg.innerHTML = "";
      plot.querySelector(".empty")?.remove();
      if (!labels.length || !series.length) plot.insertAdjacentHTML("beforeend", '<div class="empty">No data</div>');
      this.#layout = null;
      return;
    }
    plot.querySelector(".empty")?.remove();

    if (type === "pie") {
      this.#pie(svg, width, heightPx);
      if (this.#active >= this.#layout.count) this.#active = -1;
      if (this.#active >= 0) this.#show(this.#active, true);
      return;
    }

    const smallFont = `400 12px ${getComputedStyle(this).fontFamily}`;

    // The value domain: stacks add up; bars and areas start from zero.
    let lo = Infinity;
    let hi = -Infinity;
    labels.forEach((_, i) => {
      if (stacked) {
        let up = 0;
        let down = 0;
        for (const one of shown) {
          const v = one.values[i] ?? 0;
          if (v >= 0) up += v;
          else down += v;
        }
        lo = Math.min(lo, down);
        hi = Math.max(hi, up);
      } else {
        for (const one of shown) {
          const v = one.values[i];
          if (v === null) continue;
          lo = Math.min(lo, v);
          hi = Math.max(hi, v);
        }
      }
    });
    if (!Number.isFinite(lo)) [lo, hi] = [0, 1];
    if (type !== "line") [lo, hi] = [Math.min(0, lo), Math.max(0, hi)];
    const yMin = this.getAttribute("y-min");
    const yMax = this.getAttribute("y-max");
    if (yMin !== null && yMin !== "" && Number.isFinite(Number(yMin))) lo = Number(yMin);
    if (yMax !== null && yMax !== "" && Number.isFinite(Number(yMax))) hi = Number(yMax);
    const ticks = niceTicks(lo, hi, vertical ? Math.max(2, Math.round(heightPx / 56)) : Math.max(2, Math.round(width / 110)));
    const d0 = ticks[0];
    const d1 = ticks[ticks.length - 1];

    // Room for the axis labels.
    const tickWidth = Math.max(...ticks.map((t) => textWidth(this.#format(t, true), smallFont)));
    const catWidth = Math.max(...labels.map((t) => textWidth(t, smallFont)));
    const endLabels = type === "line" && shown.length > 1 && shown.length <= 4;
    const endWidth = endLabels ? Math.min(120, Math.max(...shown.map((one) => textWidth(one.name, smallFont)))) + 10 : 0;
    const left = vertical ? Math.ceil(tickWidth) + 10 : Math.ceil(Math.min(catWidth, width * 0.38)) + 12;
    const right = vertical ? Math.max(8, endWidth) : Math.ceil(textWidth(this.#format(d1, true), smallFont) / 2) + 4;
    const top = 8;
    const bottom = vertical ? 24 : 22;
    const plotW = Math.max(10, width - left - right);
    const plotH = Math.max(10, heightPx - top - bottom);

    const scale = (v) => (vertical ? top + plotH - ((v - d0) / (d1 - d0)) * plotH : left + ((v - d0) / (d1 - d0)) * plotW);
    const zero = scale(Math.max(d0, Math.min(d1, 0)));
    const count = labels.length;
    const band = (vertical ? plotW : plotH) / count;
    const center = (i) => (vertical ? left : top) + band * (i + 0.5);

    const parts = [];
    // Gridlines and value-axis ticks: hairline, solid, recessive.
    for (const t of ticks) {
      const p = Math.round(scale(t)) + 0.5;
      if (vertical) {
        parts.push(`<line class="${t === 0 && type !== "line" ? "base" : "grid"}" x1="${left}" x2="${left + plotW}" y1="${p}" y2="${p}"/>`);
        parts.push(`<text x="${left - 8}" y="${p}" text-anchor="end" dominant-baseline="middle">${escapeHtml(this.#format(t, true))}</text>`);
      } else {
        parts.push(`<line class="${t === 0 ? "base" : "grid"}" x1="${p}" x2="${p}" y1="${top}" y2="${top + plotH}"/>`);
        parts.push(`<text x="${p}" y="${top + plotH + 16}" text-anchor="middle">${escapeHtml(this.#format(t, true))}</text>`);
      }
    }
    // Category labels -- every nth when they would collide.
    if (vertical) {
      const every = Math.max(1, Math.ceil((catWidth + 12) / band));
      labels.forEach((text, i) => {
        if (i % every) return;
        parts.push(`<text x="${center(i)}" y="${top + plotH + 17}" text-anchor="middle">${escapeHtml(text)}</text>`);
      });
    } else {
      const room = left - 12;
      labels.forEach((text, i) => {
        let shownText = text;
        while (shownText.length > 1 && textWidth(shownText, smallFont) > room) shownText = `${shownText.slice(0, -2)}…`;
        parts.push(`<text x="${left - 8}" y="${center(i)}" text-anchor="end" dominant-baseline="middle"><title>${escapeHtml(text)}</title>${escapeHtml(shownText)}</text>`);
      });
    }
    // The highlight band for the active category goes under the marks.
    parts.push('<g class="highlight"></g>');

    if (type === "column" || type === "bar") parts.push(this.#bars({ shown, labels, stacked, vertical, scale, zero, band, center, top, left, plotW, plotH, smallFont }));
    else parts.push(this.#lines({ shown, labels, stacked, area: type === "area", scale, zero, center, left, plotW, endLabels, smallFont }));
    parts.push('<g class="hover"></g>');

    svg.setAttribute("viewBox", `0 0 ${width} ${heightPx}`);
    svg.innerHTML = parts.join("");
    this.#layout = { vertical, type, stacked, band, center, scale, top, left, plotW, plotH, shown, labels, count, width, height: heightPx };
    if (this.#active >= count) this.#active = -1;
    if (this.#active >= 0) this.#show(this.#active, true);
  }

  #bars({ shown, labels, stacked, vertical, scale, zero, band, center, smallFont }) {
    const out = [];
    const tip = (cross, thickness, end, value, sign) => this.#tipLabel({ vertical, cross, thickness, end, value, sign, room: band, font: smallFont });
    const valueLabels = this.hasAttribute("value-labels");
    const k = stacked ? 1 : shown.length || 1;
    // Wide: the bars fill their category, 4px from each other and from the
    // next category's; else thin bars with air around them.
    const wide = this.hasAttribute("wide");
    const inner = wide ? WIDE_GAP : GAP;
    const thickness = wide
      ? Math.max(2, (band - WIDE_GAP - inner * (k - 1)) / k)
      : Math.max(2, Math.min(BAR_MAX, (band * 0.72 - GAP * (k - 1)) / k));
    const groupWidth = thickness * k + inner * (k - 1);
    labels.forEach((_, i) => {
      const start = center(i) - groupWidth / 2;
      if (stacked) {
        let up = 0;
        let down = 0;
        // Which segment ends each direction gets the rounded end.
        const lastUp = shown.findLastIndex((one) => (one.values[i] ?? 0) > 0);
        const lastDown = shown.findLastIndex((one) => (one.values[i] ?? 0) < 0);
        shown.forEach((one, s) => {
          const v = one.values[i] ?? 0;
          if (!v) return;
          const from = v > 0 ? up : down;
          const to = from + v;
          if (v > 0) up = to;
          else down = to;
          // A 2px surface gap after every segment but the first.
          const gap = from === 0 ? 0 : GAP;
          let a = scale(from);
          const b = scale(to);
          const dir = Math.sign(b - a);
          a += dir * gap;
          if (Math.abs(b - a) < 0.5) return;
          const round = (v > 0 && s === lastUp) || (v < 0 && s === lastDown);
          out.push(`<path fill="${this.#colorOf(one)}" d="${round ? barPath(vertical, start, thickness, a, b) : this.#square(vertical, start, thickness, a, b)}"/>`);
        });
        if (valueLabels && shown.length) {
          const total = up + down;
          out.push(tip(start, thickness, scale(up || down), total, up ? 1 : -1));
        }
      } else {
        shown.forEach((one, s) => {
          const v = one.values[i];
          if (v === null) return;
          const at = start + s * (thickness + inner);
          const fill = shown.length === 1 && this.#data.colors ? this.#pointColor(i, one) : this.#colorOf(one);
          out.push(`<path fill="${fill}" d="${barPath(vertical, at, thickness, zero, scale(v))}"/>`);
          if (valueLabels) out.push(tip(at, thickness, scale(v), v, Math.sign(v) || 1));
        });
      }
    });
    return out.join("");
  }

  #square(vertical, cross, thickness, a, b) {
    if (vertical) return `M${cross},${a}V${b}H${cross + thickness}V${a}Z`;
    return `M${a},${cross}H${b}V${cross + thickness}H${a}Z`;
  }

  /** A value at a bar's tip -- only where it fits: over a column, within
   *  the room its bar has (its own width, or the whole band when single). */
  #tipLabel({ vertical, cross, thickness, end, value, sign, room, font }) {
    const text = this.#format(value);
    const w = textWidth(text, font);
    if (vertical) {
      const space = this.#data.series.length - this.#hidden.size > 1 && !this.hasAttribute("stacked") ? thickness + GAP : room;
      if (w + 4 > space) return "";
      const y = sign > 0 ? end - 6 : end + 14;
      return `<text x="${cross + thickness / 2}" y="${y}" text-anchor="middle">${escapeHtml(text)}</text>`;
    }
    if (thickness < 10) return "";
    const x = sign > 0 ? end + 6 : end - 6;
    return `<text x="${x}" y="${cross + thickness / 2}" text-anchor="${sign > 0 ? "start" : "end"}" dominant-baseline="middle">${escapeHtml(text)}</text>`;
  }

  #lines({ shown, labels, stacked, area, scale, zero, center, left, plotW, endLabels, smallFont }) {
    const out = [];
    const totals = labels.map(() => 0);
    const ends = [];
    for (const one of shown) {
      const color = this.#colorOf(one);
      const points = labels.map((_, i) => {
        const v = one.values[i];
        if (v === null) return null;
        const base = stacked ? totals[i] : 0;
        if (stacked) totals[i] += v;
        return { x: center(i), y: scale(base + v), y0: scale(base) };
      });
      // Runs of known points; a gap in the data is a gap in the line.
      const runs = [];
      let run = [];
      for (const p of points) {
        if (p) run.push(p);
        else if (run.length) runs.push(run), (run = []);
      }
      if (run.length) runs.push(run);
      for (const r of runs) {
        const line = r.map((p, j) => `${j ? "L" : "M"}${p.x},${p.y}`).join("");
        if (area) {
          const back = [...r].reverse().map((p) => `L${p.x},${stacked ? p.y0 : zero}`).join("");
          out.push(`<path d="${line}${back}Z" fill="${color}" fill-opacity="${stacked ? 0.35 : 0.1}"/>`);
        }
        out.push(`<path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`);
        if (r.length === 1) out.push(`<circle class="ring" cx="${r[0].x}" cy="${r[0].y}" r="4" fill="${color}"/>`);
      }
      const last = [...points].reverse().find(Boolean);
      if (last) {
        out.push(`<circle class="ring" cx="${last.x}" cy="${last.y}" r="4" fill="${color}"/>`);
        ends.push({ y: last.y, x: last.x, name: one.name });
      }
    }
    // Names at the line ends -- unless two would collide; then the legend
    // carries them.
    if (endLabels) {
      const sorted = [...ends].sort((a, b) => a.y - b.y);
      const clear = sorted.every((e, i) => i === 0 || e.y - sorted[i - 1].y >= 14);
      if (clear) {
        for (const e of ends) {
          let name = e.name;
          while (name.length > 1 && textWidth(name, smallFont) > 110) name = `${name.slice(0, -2)}…`;
          out.push(`<text class="end-label" x="${left + plotW + 10}" y="${e.y}" dominant-baseline="middle">${escapeHtml(name)}</text>`);
        }
      }
    }
    return out.join("");
  }

  /** A pie of the first series: slices clockwise from twelve o'clock, a
   *  2px surface gap between them. */
  #pie(svg, width, height) {
    const values = (this.#data.series[0]?.values ?? []).map((v) => Math.max(0, v ?? 0));
    const total = values.reduce((a, b) => a + b, 0) || 1;
    const r = Math.max(10, Math.min(width, height) / 2 - 6);
    const cx = width / 2;
    const cy = height / 2;
    const slices = [];
    let angle = -Math.PI / 2;
    const parts = [];
    values.forEach((v, i) => {
      const sweep = (v / total) * Math.PI * 2;
      const start = angle;
      angle += sweep;
      slices.push({ start, end: angle, value: v });
      if (!v) return;
      const fill = this.#pointColor(i);
      if (sweep >= Math.PI * 2 - 1e-6) {
        parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`);
        return;
      }
      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(angle);
      const y2 = cy + r * Math.sin(angle);
      parts.push(`<path class="slice" data-i="${i}" fill="${fill}" d="M${cx},${cy}L${x1},${y1}A${r},${r} 0 ${sweep > Math.PI ? 1 : 0} 1 ${x2},${y2}Z"/>`);
    });
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.innerHTML = `<g class="slices">${parts.join("")}</g><g class="highlight"></g><g class="hover"></g>`;
    this.#layout = { type: "pie", cx, cy, r, slices, total, count: values.length, width, height, labels: this.#data.labels, shown: this.#data.series.slice(0, 1) };
  }

  #drawLegend(series, type) {
    const legend = this.shadowRoot.querySelector(".legend");
    if (type === "pie") {
      legend.innerHTML = this.#data.labels
        .map((text, i) => `<li><span class="entry"><span class="key" style="background:${this.#pointColor(i)}"></span>${escapeHtml(text)}</span></li>`)
        .join("");
      return;
    }
    if (series.length < 2) {
      legend.innerHTML = "";
      return;
    }
    const lineKey = type === "line";
    legend.innerHTML = series
      .map(
        (one) => `<li><button type="button" data-series="${escapeHtml(one.name)}" aria-pressed="${!this.#hidden.has(one.name)}">
          <span class="key${lineKey ? " line" : ""}" style="background:${this.#colorOf(one)}"></span>${escapeHtml(one.name)}</button></li>`,
      )
      .join("");
  }

  #drawTable(labels, series) {
    const table = this.shadowRoot.querySelector("table");
    const label = this.getAttribute("label") || "";
    table.innerHTML = `${label ? `<caption>${escapeHtml(label)}</caption>` : ""}
      <thead><tr><th scope="col"></th>${series.map((one) => `<th scope="col">${escapeHtml(one.name)}</th>`).join("")}</tr></thead>
      <tbody>${labels
        .map((text, i) => `<tr><th scope="row">${escapeHtml(text)}</th>${series.map((one) => `<td>${escapeHtml(this.#format(one.values[i]))}</td>`).join("")}</tr>`)
        .join("")}</tbody>`;
  }

  // -------------------------------------------------- hover and keyboard

  #hoverAt(event) {
    const layout = this.#layout;
    if (!layout) return;
    const rect = this.shadowRoot.querySelector(".plot").getBoundingClientRect();
    const scaleX = layout.width / rect.width;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleX;
    if (layout.type === "pie") {
      const dx = x - layout.cx;
      const dy = y - layout.cy;
      if (Math.hypot(dx, dy) > layout.r) return this.#show(-1);
      let a = Math.atan2(dy, dx);
      if (a < -Math.PI / 2) a += Math.PI * 2;
      const index = layout.slices.findIndex((slice) => a >= slice.start && a < slice.end && slice.value > 0);
      return this.#show(index, false, { x: event.clientX - rect.left, y: event.clientY - rect.top });
    }
    const along = layout.vertical ? x - layout.left : y - layout.top;
    const span = layout.vertical ? layout.plotW : layout.plotH;
    if (along < 0 || along > span) return this.#show(-1);
    this.#show(Math.min(layout.count - 1, Math.floor(along / layout.band)), false, { x: event.clientX - rect.left, y: event.clientY - rect.top });
  }

  #keys(event) {
    const layout = this.#layout;
    if (!layout) return;
    const pie = layout.type === "pie";
    const back = pie || layout.vertical ? "ArrowLeft" : "ArrowUp";
    const next = pie || layout.vertical ? "ArrowRight" : "ArrowDown";
    let index = this.#active;
    if (event.key === next) index = Math.min(layout.count - 1, index + 1);
    else if (event.key === back) index = Math.max(0, index - 1);
    else if (event.key === "Home") index = 0;
    else if (event.key === "End") index = layout.count - 1;
    else if (event.key === "Escape") index = -1;
    else return;
    event.preventDefault();
    this.#show(index, true);
  }

  /** A pie's slice: outlined, with its name, value and share. */
  #showSlice(index, speak, pointer) {
    const layout = this.#layout;
    const root = this.shadowRoot;
    const tip = root.querySelector(".tip");
    const { cx, cy, r, slices, total, labels } = layout;
    const slice = slices[index];
    const hover = root.querySelector(".hover");
    if (!slice) return;
    const mid = (slice.start + slice.end) / 2;
    const x1 = cx + r * Math.cos(slice.start);
    const y1 = cy + r * Math.sin(slice.start);
    const x2 = cx + r * Math.cos(slice.end);
    const y2 = cy + r * Math.sin(slice.end);
    const big = slice.end - slice.start > Math.PI ? 1 : 0;
    hover.innerHTML = slice.end - slice.start >= Math.PI * 2 - 1e-6
      ? `<circle class="slice-hover" cx="${cx}" cy="${cy}" r="${r - 1}"/>`
      : `<path class="slice-hover" d="M${cx},${cy}L${x1},${y1}A${r},${r} 0 ${big} 1 ${x2},${y2}Z"/>`;
    const share = new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1 }).format(slice.value / total);
    tip.innerHTML = `<div class="title">${escapeHtml(labels[index])}</div><div class="row"><span class="name">${escapeHtml(this.#data.series[0]?.name ?? "")}</span><span class="value">${escapeHtml(this.#format(slice.value))}</span></div><div class="row"><span class="name">Share</span><span class="value">${share}</span></div>`;
    tip.hidden = false;
    const plot = root.querySelector(".plot");
    const k = plot.getBoundingClientRect().width / layout.width || 1;
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    let x = pointer ? pointer.x + 14 : (cx + Math.cos(mid) * r * 0.6) * k + 8;
    let y = pointer ? pointer.y - h / 2 : (cy + Math.sin(mid) * r * 0.6) * k - h / 2;
    if (x + w > plot.clientWidth) x = (pointer ? pointer.x - 14 : x - 16) - w;
    tip.style.left = `${Math.max(0, x)}px`;
    tip.style.top = `${Math.max(0, Math.min(plot.clientHeight - h, y))}px`;
    if (speak) root.querySelector(".spoken").textContent = `${labels[index]}: ${this.#format(slice.value)}, ${share}`;
  }

  /** Show category `index` (or nothing, -1): its band, its points, the tooltip. */
  #show(index, speak = false, pointer = null) {
    const layout = this.#layout;
    const root = this.shadowRoot;
    const tip = root.querySelector(".tip");
    const highlight = root.querySelector(".highlight");
    const hover = root.querySelector(".hover");
    this.#active = index;
    if (!layout || index < 0 || !highlight) {
      tip.hidden = true;
      if (highlight) highlight.innerHTML = "";
      if (hover) hover.innerHTML = "";
      return;
    }
    if (layout.type === "pie") return this.#showSlice(index, speak, pointer);
    const { vertical, band, center, top, left, plotW, plotH, shown, labels, type, stacked, scale } = layout;
    const c = center(index);
    if (type === "line" || type === "area") {
      highlight.innerHTML = `<line class="cross" x1="${Math.round(c) + 0.5}" x2="${Math.round(c) + 0.5}" y1="${top}" y2="${top + plotH}"/>`;
      let total = 0;
      hover.innerHTML = shown
        .map((one) => {
          const v = one.values[index];
          if (v === null) return "";
          const y = scale(stacked ? (total += v) : v);
          return `<circle class="ring" cx="${c}" cy="${y}" r="5" fill="${this.#colorOf(one)}"/>`;
        })
        .join("");
    } else {
      hover.innerHTML = "";
      highlight.innerHTML = vertical
        ? `<rect class="band" x="${c - band / 2}" y="${top}" width="${band}" height="${plotH}" rx="2"/>`
        : `<rect class="band" x="${left}" y="${c - band / 2}" width="${plotW}" height="${band}" rx="2"/>`;
    }

    // The tooltip: the category, then each series beside its key.
    const rows = shown.map((one) => ({ one, v: one.values[index] }));
    const key = (one) => `<span class="key${type === "line" ? " line" : ""}" style="background:${this.#colorOf(one)}"></span>`;
    const total = rows.reduce((sum, row) => sum + (row.v ?? 0), 0);
    tip.innerHTML = `<div class="title">${escapeHtml(labels[index])}</div>${rows
      .map((row) => `<div class="row">${shown.length > 1 ? key(row.one) : ""}<span class="name">${escapeHtml(row.one.name)}</span><span class="value">${escapeHtml(this.#format(row.v))}</span></div>`)
      .join("")}${stacked && shown.length > 1 ? `<div class="row total"><span class="name">Total</span><span class="value">${escapeHtml(this.#format(total))}</span></div>` : ""}`;
    tip.hidden = false;

    // Beside the category, inside the chart.
    const plot = root.querySelector(".plot");
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const scaleBack = plot.getBoundingClientRect().width / layout.width || 1;
    let x;
    let y;
    if (vertical) {
      const at = c * scaleBack;
      x = at + band * scaleBack * 0.5 + 8;
      if (x + w > plot.clientWidth) x = at - band * scaleBack * 0.5 - 8 - w;
      y = pointer ? pointer.y - h / 2 : top * scaleBack;
    } else {
      const at = c * scaleBack;
      x = pointer ? pointer.x + 12 : (left + plotW / 2) * scaleBack;
      if (x + w > plot.clientWidth) x = (pointer?.x ?? x) - 12 - w;
      y = at + (band * scaleBack) / 2 + 4;
      if (y + h > plot.clientHeight) y = at - (band * scaleBack) / 2 - 4 - h;
    }
    tip.style.left = `${Math.max(0, Math.min(plot.clientWidth - w, x))}px`;
    tip.style.top = `${Math.max(-8, Math.min(plot.clientHeight - h + 8, y))}px`;

    if (speak) {
      root.querySelector(".spoken").textContent = `${labels[index]}: ${rows.map((row) => `${row.one.name} ${this.#format(row.v)}`).join(", ")}${stacked && shown.length > 1 ? `, total ${this.#format(total)}` : ""}`;
    }
  }
}

if (!customElements.get("fx-chart")) customElements.define("fx-chart", FxChart);
