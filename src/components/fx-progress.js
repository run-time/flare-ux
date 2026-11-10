// <fx-progress>: how far along something is -- a bar that fills, with a
// label above and what it is doing (or how much is done) under it. Without
// a value it is indeterminate: a band that sweeps across, for work whose
// end is not known yet.
//
//   <fx-progress label="Uploading" value="40"></fx-progress>
//   <fx-progress label="Cloning factory-ui" helper-text="Receiving objects"></fx-progress>
//   <fx-progress label="Checks" value="7" max="10" show-value="count" tone="pass"></fx-progress>
//
// Attributes:
//   value        how much is done, 0 to max; absent = indeterminate
//   max          the whole (default 100)
//   label        what it measures, above the bar
//   helper-text  a line under it -- the step it is on, an estimate
//   show-value   percent (default) | count ("7 of 10") | none -- shown
//                beside the label when there is a value
//   tone         a status tone for the bar: error (fail) shows a stopped
//                bar, success (pass) a finished one; any tone colors it
//   size         sm (a 4px bar) | md (default, 8px)
//
// role="progressbar" with aria-valuenow / max (none when indeterminate)
// and the label as its name; the helper text describes it.

import { escapeHtml } from "../lib/escape.js";
import { toneCss, toneOf } from "../lib/tones.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --_tone: var(--fx-interactive);
      --_track: color-mix(in srgb, var(--fx-text) 12%, transparent);
      --_height: 0.5rem;
      display: block;
      min-width: 8rem;
      font: var(--fx-type-body-compact-01);
      color: var(--fx-text);
    }
    :host([hidden]) { display: none; }
    :host([size="sm"]) { --_height: 0.25rem; }
    ${toneCss(':host([tone="&"])')}
    .head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--fx-spacing-04); margin-bottom: var(--fx-spacing-03); }
    .head:not(:has(:not(:empty))) { display: none; }
    .label { font: var(--fx-type-label-01); color: var(--fx-text-secondary); }
    .amount { color: var(--fx-text-secondary); font: var(--fx-type-helper-01); font-variant-numeric: tabular-nums; }
    .track { position: relative; height: var(--_height); overflow: hidden; border-radius: var(--fx-radius-pill); background: var(--_track); }
    .bar {
      position: absolute;
      inset: 0 auto 0 0;
      width: var(--_done, 0%);
      border-radius: inherit;
      background: var(--_tone);
      transition: width var(--fx-duration-moderate-02) var(--fx-easing-standard);
    }
    /* Not known yet: a band sweeping across. */
    :host(:not([value])) .bar { width: 35%; animation: fx-progress-sweep 1.4s var(--fx-easing-standard) infinite; }
    @keyframes fx-progress-sweep { from { left: -35%; } to { left: 100%; } }
    @media (prefers-reduced-motion: reduce) {
      :host(:not([value])) .bar { width: 100%; left: 0; animation: fx-progress-pulse 2s ease-in-out infinite; }
      @keyframes fx-progress-pulse { 50% { opacity: 0.4; } }
    }
    .helper { margin-top: var(--fx-spacing-03); color: var(--fx-text-secondary); font: var(--fx-type-helper-01); }
    .helper:empty { display: none; }
    :host([tone="error"]) .helper, :host([tone="fail"]) .helper, :host([tone="failed"]) .helper, :host([tone="danger"]) .helper { color: var(--fx-status-error-text); }
  </style>
  <div class="head"><span class="label" part="label"></span><span class="amount" part="value"></span></div>
  <div class="track" part="track"><div class="bar" part="bar"></div></div>
  <div class="helper" part="helper-text"></div>
`;

export class FxProgress extends HTMLElement {
  static observedAttributes = ["value", "max", "label", "helper-text", "show-value", "tone"];

  #internals = this.attachInternals();

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    this.#internals.role = "progressbar";
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  get value() {
    const value = this.getAttribute("value");
    return value === null || value === "" ? null : Number(value);
  }
  set value(value) {
    if (value === null || value === undefined || value === "") this.removeAttribute("value");
    else this.setAttribute("value", String(value));
  }

  get max() {
    const max = Number(this.getAttribute("max"));
    return Number.isFinite(max) && max > 0 ? max : 100;
  }
  set max(value) {
    this.setAttribute("max", String(value));
  }

  #render() {
    const root = this.shadowRoot;
    const max = this.max;
    const raw = this.value;
    const value = raw === null || !Number.isFinite(raw) ? null : Math.min(max, Math.max(0, raw));
    const label = this.getAttribute("label") ?? "";
    const show = this.getAttribute("show-value") ?? "percent";
    const percent = value === null ? null : Math.round((value / max) * 100);

    root.querySelector(".label").textContent = label;
    root.querySelector(".amount").textContent =
      value === null || show === "none" ? "" : show === "count" ? `${value} of ${max}` : `${percent}%`;
    root.querySelector(".helper").innerHTML = escapeHtml(this.getAttribute("helper-text") ?? "");
    this.style.setProperty("--_done", value === null ? "0%" : `${(value / max) * 100}%`);

    // Its name and state for assistive technology.
    const internals = this.#internals;
    internals.ariaLabel = label || this.getAttribute("aria-label") || "Progress";
    internals.ariaValueMin = "0";
    internals.ariaValueMax = String(max);
    internals.ariaValueNow = value === null ? null : String(value);
    internals.ariaValueText = value === null ? null : show === "count" ? `${value} of ${max}` : `${percent}%`;
    internals.ariaDescription = this.getAttribute("helper-text") || null;
    internals.ariaBusy = String(value === null || (value < max && toneOf(this.getAttribute("tone"), "") !== "error"));
  }
}

if (!customElements.get("fx-progress")) customElements.define("fx-progress", FxProgress);
