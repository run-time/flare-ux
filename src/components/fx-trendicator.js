// <fx-trendicator>: a reading in a circle with an arrow that points where it
// is heading -- a glucose reading from a CGM, or any number with a trend.
// Click it (with hours-of-history) for a small graph of the recent readings.
//
//   <fx-trendicator value="92" trend="+2"></fx-trendicator>
//   <fx-trendicator value="57" trend="-11" theme="low" rotation="180" alert></fx-trendicator>
//   <fx-trendicator value="HIGH" trend="above 400" theme="maxhigh" rotation="off"></fx-trendicator>
//   <fx-trendicator value="172" trend="34m ago" theme="error" rotation="off"></fx-trendicator>
//
// Attributes:
//   value       the reading, large in the circle (LOW, HIGH and values over four characters are set smaller)
//   trend       a line under it: a change ("+2"), a note ("34m ago")
//   theme       default | high | maxhigh | low | maxlow | error (a dashed
//               ring, the trend in a pill)
//   rotation    where the arrow points, in degrees: 0 up, 45 up-right, 90
//               right (the default), 135 down-right, 180 down; off for none
//   alert       the arrow drawn hollow -- a fast change ("true", or present)
//   size        the circle's width in px (default 140); everything scales
//   fg-color, bg-color, ind-color   override the theme's text, fill and
//               ring/arrow colors (fgColor / bgColor / indColor work too);
//               fg-color sets the value, and the trend at 70% opacity
//   value-color, trend-color   the value's and the trend's own colors,
//               ahead of fg-color (valueColor / trendColor work too)
//   hours-of-history  > 0 makes it a button: a click shows or hides a graph
//               of the readings; the graph starts at this many hours
//   history-src a URL returning { readings: [{ time, value }] } (or the
//               array) for the graph -- fetched once, shared by every
//               trendicator with the same URL. Or set the `history` property.
//   benchmark-high, benchmark-low   the graph's high and low lines (default
//               180 and 70; benchmarkHigh / benchmarkLow work too)
//
// The graph: dots for the readings (red under low, yellow over high), the
// out-of-range bands shaded, a title "Last 2 hours", a tooltip with each
// reading's time and value (39 reads LOW, 401 HIGH). Click the graph for the
// next window (2, 4, 6, 8 hours); double-click the trendicator to move every
// open graph on the page to the next window.
//
// trendicatorHtml(reading, overrides?, benchmarks?) turns a CGM reading
// ({ value, trend: { symbol }, value_difference, status, minutes_ago }) into
// the element's markup: stale, out-of-range and missing readings included.

import { escapeHtml } from "../lib/escape.js";

const WINDOWS = [2, 4, 6, 8];

// The themes: [text, fill, ring and arrow], as Flare UX colors.
const THEMES = {
  default: ["var(--fx-color-black)", "var(--fx-color-gray-20)", "var(--fx-color-gray-50)"],
  high: ["var(--fx-color-black)", "var(--fx-status-warning)", "var(--fx-color-gray-50)"],
  maxhigh: ["var(--fx-color-black)", "var(--fx-status-warning)", "var(--fx-status-warning)"],
  low: ["var(--fx-color-white)", "var(--fx-status-error-fill)", "var(--fx-color-gray-50)"],
  maxlow: ["var(--fx-color-white)", "var(--fx-status-error-fill)", "var(--fx-status-error-fill)"],
  error: ["var(--fx-status-error)", "var(--fx-color-white)", "var(--fx-status-error)"],
};

const DIRECTIONS = { 0: "rising", 45: "rising slowly", 90: "steady", 135: "falling slowly", 180: "falling" };

// ---------------------------------------------------- shared history

/** Readings by URL: fetched once, shared by every trendicator using it. */
const loads = new Map();
const open = new Set(); // trendicators whose graph is showing
let sharedWindow = 0; // the window double-click moves every graph to

function loadHistory(src) {
  if (!loads.has(src)) {
    loads.set(
      src,
      fetch(src)
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`${response.status}`))))
        .then((body) => (Array.isArray(body) ? body : body?.readings ?? [])),
    );
  }
  return loads.get(src);
}

/** "3:05pm" */
function clock(time) {
  const d = new Date(time);
  let h = d.getHours();
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")}${ampm}`;
}

// ---------------------------------------------------------- the helper

/**
 * A CGM reading as fx-trendicator markup -- missing, stale (over 20 minutes),
 * below 40, above 400, or in range with its arrow, change and theme.
 */
export function trendicatorHtml(reading, overrides = {}, benchmarks = { high: 240, low: 60 }) {
  const props = { "benchmark-high": benchmarks.high, "benchmark-low": benchmarks.low, "hours-of-history": 2, ...overrides };
  const extra = Object.entries(props)
    .map(([key, value]) => `${escapeHtml(key)}="${escapeHtml(value)}"`)
    .join(" ");
  const tag = (attrs) =>
    `<fx-trendicator ${Object.entries(attrs)
      .filter(([, value]) => value !== undefined && value !== false)
      .map(([key, value]) => (value === true ? key : `${key}="${escapeHtml(value)}"`))
      .join(" ")} ${extra}></fx-trendicator>`;

  if (!reading || !reading.value) return tag({ value: "??", trend: "?", rotation: "off", theme: "default" });
  if (reading.minutes_ago > 20) return tag({ value: reading.value, trend: `${reading.minutes_ago}m ago`, rotation: "off", theme: "error" });
  const value = parseInt(reading.value, 10);
  if (value < 40) return tag({ value: "LOW", trend: "below 40", rotation: "off", theme: "low" });
  if (value > 400) return tag({ value: "HIGH", trend: "above 400", rotation: "off", theme: "high" });

  const ARROWS = { "—": "off", "⇈": "0", "↑": "0", "↗": "45", "→": "90", "↘": "135", "↓": "180", "⇊": "180", "?": "off", "!": "off" };
  const symbol = reading.trend?.symbol || "—";
  const difference = reading.value_difference;
  const trend = difference ? (difference > 0 ? `+${difference}` : `${difference}`) : "";
  const theme = value === 39 ? "maxlow" : value === 401 ? "maxhigh" : reading.status === "LOW" ? "low" : reading.status === "HIGH" ? "high" : "default";
  return tag({ value: reading.value, trend, rotation: ARROWS[symbol] || "off", theme, alert: symbol === "⇈" || symbol === "⇊" ? "true" : undefined });
}

// ---------------------------------------------------------- the element

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --_s: 140px; --_b: 10px; --_ib: 3px; --_r: 20px; --_fs: 50px; --_ts: 20px; --_rot: 225deg;
      --_fg: var(--fx-color-black); --_bg: var(--fx-color-gray-20); --_ind: var(--fx-color-gray-50);
      display: inline-block;
      position: relative;
      vertical-align: top;
      outline: none;
    }
    :host([hidden]) { display: none; }
    :host([history]) { cursor: pointer; }
    :host(:focus-visible) .main-circle { box-shadow: 0 0 0 3px var(--fx-layer), 0 0 0 5px var(--fx-focus); }
    .wrapper { display: inline-flex; flex-direction: column; align-items: center; }
    .container { position: relative; display: inline-block; }
    .main-circle {
      box-sizing: content-box;
      width: var(--_s);
      height: var(--_s);
      border-radius: 50%;
      border: var(--_b) solid var(--_ind);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 10;
      background-color: var(--_bg);
    }
    :host([theme="error"]) .main-circle { border-style: dashed; }
    .inner-border {
      position: absolute;
      inset: 0;
      box-sizing: border-box;
      border-radius: 50%;
      border: var(--_ib) solid var(--fx-color-white);
    }
    .value-text { position: relative; z-index: 20; margin: 0; color: var(--_vc); font: 700 var(--_fs) / 1 var(--fx-font); }
    .trend-text {
      position: relative;
      z-index: 20;
      margin: -2px 0 0;
      color: var(--_tc);
      font: 400 var(--_ts) / 1.2 var(--fx-font);
    }
    .trend-text:empty { display: none; }
    :host([theme="error"]) .trend-text {
      margin-top: 2px;
      padding: 0 calc(var(--_r) / 2);
      border-radius: var(--_r);
      background: var(--_fg);
      color: var(--_bg);
    }
    /* The arrow: a square rounded on three corners, turned so its sharp
       corner points the way the reading is heading, behind the circle. */
    .arrow {
      position: absolute;
      top: 0;
      left: 0;
      box-sizing: content-box;
      width: var(--_s);
      height: var(--_s);
      background-color: var(--_ind);
      border: var(--_b) solid var(--_ind);
      border-radius: 50% 50% 50% 0;
      transform: rotate(var(--_rot));
      z-index: 1;
    }
    .arrow[hidden] { display: none; }
    /* Alert: the arrow hollow -- only its outline shows past the circle. */
    :host([data-alert]) .arrow::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: var(--_s);
      height: var(--_s);
      background-color: var(--fx-trendicator-surface, var(--fx-color-white));
      border-radius: 50% 50% 50% 0;
      z-index: 4;
      pointer-events: none;
    }

    /* The history graph, under the circle. */
    .slot {
      position: relative;
      z-index: 100;
      margin-top: var(--_gap);
      padding: 0 var(--fx-spacing-02) var(--fx-spacing-02);
      border-radius: calc(var(--_r) * 0.4);
      background: var(--_ind);
      box-shadow: 0 2px 8px rgb(0 0 0 / 0.13);
      cursor: pointer;
    }
    .slot[hidden] { display: none; }
    .graph { position: relative; margin-top: var(--_offset); }
    .title { margin-bottom: 2px; color: var(--fx-color-white); font: 500 13px / 1.3 var(--fx-font); text-align: center; }
    .graph svg { display: block; border-radius: 4px; }
    .plot-bg { fill: var(--fx-color-gray-10); }
    .dot { fill: var(--fx-color-blue-50); }
    .dot.low { fill: var(--fx-color-red-50); }
    .dot.high { fill: var(--fx-color-yellow-30); }
    .band-low { fill: var(--fx-color-red-50); fill-opacity: 0.1; }
    .band-high { fill: var(--fx-color-yellow-30); fill-opacity: 0.1; }
    .line-low { stroke: var(--fx-color-red-50); stroke-width: 1; opacity: 0.6; }
    .line-high { stroke: var(--fx-color-yellow-30); stroke-width: 1; opacity: 0.6; }
    .note { padding: 8px; color: var(--fx-color-white); background: var(--fx-status-error); font: 12px var(--fx-font-mono); }
    .tip {
      position: absolute;
      z-index: 10;
      padding: 2px 7px;
      background: var(--fx-color-gray-100);
      color: var(--fx-color-white);
      font: 13px / 1.4 var(--fx-font);
      white-space: nowrap;
      pointer-events: none;
    }
    .tip[hidden] { display: none; }
    .tip b { margin-left: 0.4em; }
  </style>
  <div class="wrapper">
    <div class="container">
      <div class="main-circle" part="circle">
        <div class="inner-border"></div>
        <div class="value-text" part="value"></div>
        <div class="trend-text" part="trend"></div>
      </div>
      <div class="arrow" part="arrow"></div>
    </div>
    <div class="slot" part="history" hidden></div>
  </div>
`;

export class FxTrendicator extends HTMLElement {
  static observedAttributes = [
    "value", "trend", "theme", "rotation", "alert", "size",
    "fg-color", "bg-color", "ind-color", "fgcolor", "bgcolor", "indcolor",
    "value-color", "trend-color", "valuecolor", "trendcolor",
    "hours-of-history", "history-src", "benchmark-high", "benchmark-low", "benchmarkhigh", "benchmarklow",
  ];

  #history = null; // readings set as a property
  #readings = null; // the readings the graph draws from
  #error = "";
  #visible = false;
  #window = 0; // index into WINDOWS
  #internals = this.attachInternals();

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.appendChild(template.content.cloneNode(true));
    this.addEventListener("click", (event) => {
      if (!this.#hasHistory()) return;
      if (event.composedPath().some((node) => node.classList?.contains("slot"))) return;
      this.#toggle();
    });
    this.addEventListener("dblclick", (event) => {
      if (!this.#hasHistory() || !this.#readings) return;
      event.stopPropagation();
      sharedWindow = (sharedWindow + 1) % WINDOWS.length;
      for (const one of open) one.#setWindow(sharedWindow);
    });
    this.addEventListener("keydown", (event) => {
      if (!this.#hasHistory()) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.#toggle();
      } else if (this.#visible && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
        event.preventDefault();
        this.#setWindow((this.#window + (event.key === "ArrowRight" ? 1 : WINDOWS.length - 1)) % WINDOWS.length);
      }
    });
    const slot = root.querySelector(".slot");
    // The graph: a click moves it to the next window; a dot shows its reading.
    slot.addEventListener("click", (event) => {
      event.stopPropagation();
      if (this.#readings) this.#setWindow((this.#window + 1) % WINDOWS.length);
    });
    slot.addEventListener("pointerover", (event) => this.#tip(event.target.closest?.("circle.dot")));
    slot.addEventListener("pointerout", (event) => {
      if (event.target.closest?.("circle.dot")) this.#tip(null);
    });
  }

  connectedCallback() {
    if (Object.prototype.hasOwnProperty.call(this, "history")) {
      const value = this.history;
      delete this.history;
      this.history = value;
    }
    this.#render();
    this.#preload();
  }

  disconnectedCallback() {
    open.delete(this);
  }

  attributeChangedCallback(name) {
    if (name === "history-src") {
      this.#readings = null;
      this.#preload();
    }
    this.#render();
  }

  // ------------------------------------------------------------ values

  get value() {
    return this.getAttribute("value") || "";
  }
  get trend() {
    return this.getAttribute("trend") || "";
  }
  get theme() {
    const theme = this.getAttribute("theme");
    return THEMES[theme] ? theme : "default";
  }
  get size() {
    return Number.parseInt(this.getAttribute("size"), 10) || 140;
  }
  get rotation() {
    const r = this.getAttribute("rotation");
    if (r === "off") return "off";
    const parsed = Number.parseInt(r, 10);
    return Number.isNaN(parsed) ? 90 : parsed;
  }
  get alert() {
    const a = this.getAttribute("alert");
    return a !== null && a !== "false";
  }
  get hoursOfHistory() {
    const v = parseFloat(this.getAttribute("hours-of-history"));
    return !Number.isNaN(v) && v > 0 ? v : 0;
  }

  /** The graph's readings: [{ time, value }] -- or use history-src. */
  get history() {
    return this.#history;
  }
  set history(readings) {
    this.#history = Array.isArray(readings) ? readings : null;
    this.#readings = this.#history;
    this.#error = "";
    this.#render();
  }

  #attr(...names) {
    for (const name of names) {
      const value = this.getAttribute(name);
      if (value !== null && value !== "") return value;
    }
    return null;
  }
  #benchmark(which, fallback) {
    const value = Number(this.#attr(`benchmark-${which}`, `benchmark${which}`));
    return this.#attr(`benchmark-${which}`, `benchmark${which}`) !== null && !Number.isNaN(value) ? value : fallback;
  }
  #hasHistory() {
    return this.hoursOfHistory > 0;
  }

  // ----------------------------------------------------------- history

  async #preload() {
    const src = this.getAttribute("history-src");
    if (!this.#hasHistory() || this.#history || !src || !this.isConnected) return;
    try {
      this.#readings = await loadHistory(src);
      this.#error = "";
    } catch {
      this.#readings = null;
      this.#error = "Error loading graph";
    }
    this.#drawGraph();
  }

  #toggle() {
    this.#visible = !this.#visible;
    if (this.#visible) {
      // Opening starts at the first window, as hours-of-history sets it.
      const start = WINDOWS.indexOf(Math.round(this.hoursOfHistory));
      this.#window = start >= 0 ? start : 0;
      open.add(this);
    } else open.delete(this);
    this.#render();
  }

  #setWindow(index) {
    this.#window = index;
    this.#drawGraph();
  }

  // ------------------------------------------------------------ render

  #render() {
    const root = this.shadowRoot;
    const size = this.size;
    const b = Math.round(size * 0.068);
    const r = Math.round(size * 0.14);
    const rotation = this.rotation;
    const value = this.value;
    const [fg, bg, ind] = THEMES[this.theme];
    const set = (name, v) => this.style.setProperty(name, v);
    set("--_s", `${size}px`);
    set("--_b", `${b}px`);
    set("--_ib", `${Math.round(size * 0.02)}px`);
    set("--_r", `${r}px`);
    // Up to four characters fill the circle; a longer value shrinks to fit.
    const scale = value === "LOW" || value === "HIGH" ? 0.3 : 0.36 * Math.min(1, 4 / Math.max(1, String(value).length));
    set("--_fs", `${Math.round(size * scale)}px`);
    set("--_ts", `${Math.round(size * 0.14)}px`);
    set("--_rot", `${rotation === "off" ? 0 : rotation + 135}deg`);
    // fg-color colors the value, and the trend at 70%; value-color and
    // trend-color win over it.
    const text = this.#attr("fg-color", "fgcolor") ?? fg;
    set("--_fg", text);
    set("--_vc", this.#attr("value-color", "valuecolor") ?? text);
    set("--_tc", this.#attr("trend-color", "trendcolor") ?? `color-mix(in srgb, ${text} 70%, transparent)`);
    set("--_bg", this.#attr("bg-color", "bgcolor") ?? bg);
    set("--_ind", this.#attr("ind-color", "indcolor") ?? ind);
    set("--_gap", `${Math.round(size * 0.12) + (rotation !== 0 && rotation !== 180 && rotation !== "off" ? -10 : 0)}px`);
    set("--_offset", `${rotation === 180 ? 40 : 8}px`);
    this.toggleAttribute("data-alert", this.alert);

    root.querySelector(".value-text").textContent = value;
    root.querySelector(".trend-text").textContent = this.trend;
    root.querySelector(".arrow").hidden = rotation === "off";

    // What it says to assistive technology, and whether it is a button.
    const direction = rotation === "off" ? "" : DIRECTIONS[rotation] ?? `heading ${rotation}°`;
    const spoken = [value, this.trend, direction && `${direction}${this.alert ? " quickly" : ""}`].filter(Boolean).join(", ");
    const history = this.#hasHistory();
    this.toggleAttribute("history", history);
    this.#internals.role = history ? "button" : "img";
    this.#internals.ariaLabel = history ? `${spoken}. Show the last readings` : spoken;
    this.#internals.ariaExpanded = history ? String(this.#visible) : null;
    if (history && !this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
    if (!history && this.getAttribute("tabindex") === "0") this.removeAttribute("tabindex");

    root.querySelector(".slot").hidden = !(history && this.#visible);
    if (history && this.#visible) this.#drawGraph();
  }

  #drawGraph() {
    const slot = this.shadowRoot.querySelector(".slot");
    if (!this.#visible) return;
    const hours = WINDOWS[this.#window];
    const title = `<div class="title">Last ${hours} hour${hours === 1 ? "" : "s"}</div>`;
    if (this.#error) {
      slot.innerHTML = `<div class="graph">${title}<div class="note">${escapeHtml(this.#error)}</div></div>`;
      return;
    }
    if (!this.#readings) {
      slot.innerHTML = `<div class="graph">${title}<div class="note">Loading…</div></div>`;
      return;
    }
    const since = Date.now() - hours * 3600000;
    const readings = this.#readings
      .map((one) => ({ time: new Date(one.time).getTime(), value: Number(one.value) }))
      .filter((one) => Number.isFinite(one.time) && Number.isFinite(one.value) && one.time >= since)
      .sort((a, b) => a.time - b.time);
    if (!readings.length) {
      slot.innerHTML = `<div class="graph">${title}<div class="note">•• no data ••</div></div>`;
      return;
    }
    const width = 160;
    const height = 80;
    const margin = 10;
    const LOW = this.#benchmark("low", 70);
    const HIGH = this.#benchmark("high", 180);
    const values = readings.map((one) => one.value);
    const min = Math.min(...values, LOW, HIGH);
    const max = Math.max(...values, LOW, HIGH);
    const xStep = readings.length > 1 ? (width - 2 * margin) / (readings.length - 1) : 0;
    const y = (v) => height - margin - ((v - min) / (max - min || 1)) * (height - 2 * margin);
    const lowY = y(LOW);
    const highY = y(HIGH);
    this.#shown = readings;
    slot.innerHTML = `<div class="graph">${title}
      <svg width="${width}" height="${height}" role="img" aria-label="${escapeHtml(`${readings.length} readings over the last ${hours} hours, from ${Math.min(...values)} to ${Math.max(...values)}`)}">
        <rect class="plot-bg" x="0" y="0" width="${width}" height="${height}"/>
        <rect class="band-high" x="0" y="0" width="${width}" height="${Math.max(0, highY)}"/>
        <rect class="band-low" x="0" y="${Math.min(height, lowY)}" width="${width}" height="${Math.max(0, height - lowY)}"/>
        <line class="line-low" x1="0" x2="${width}" y1="${lowY}" y2="${lowY}"/>
        <line class="line-high" x1="0" x2="${width}" y1="${highY}" y2="${highY}"/>
        ${readings
          .map((one, i) => `<circle class="dot${one.value < LOW ? " low" : one.value > HIGH ? " high" : ""}" data-i="${i}" cx="${readings.length > 1 ? margin + i * xStep : width / 2}" cy="${y(one.value)}" r="2.6"/>`)
          .join("")}
      </svg>
      <div class="tip" hidden></div></div>`;
  }

  #shown = [];

  /** A dot's time and reading, above it. */
  #tip(dot) {
    const tip = this.shadowRoot.querySelector(".tip");
    if (!tip) return;
    if (!dot) {
      tip.hidden = true;
      return;
    }
    const one = this.#shown[Number(dot.dataset.i)];
    if (!one) return;
    const LOW = this.#benchmark("low", 70);
    const HIGH = this.#benchmark("high", 180);
    const shown = one.value === 39 ? "LOW" : one.value === 401 ? "HIGH" : one.value;
    const color = one.value < LOW ? "var(--fx-color-red-40)" : one.value > HIGH ? "var(--fx-color-yellow-30)" : "var(--fx-color-blue-40)";
    tip.innerHTML = `${clock(one.time)}<b style="color:${color}">${escapeHtml(shown)}</b>`;
    tip.hidden = false;
    const graph = tip.parentElement.getBoundingClientRect();
    const at = dot.getBoundingClientRect();
    tip.style.left = `${at.left - graph.left - 18}px`;
    tip.style.top = `${at.top - graph.top - 32}px`;
  }
}

if (!customElements.get("fx-trendicator")) customElements.define("fx-trendicator", FxTrendicator);
