// <fx-slider>: a value picked by dragging along a track -- a limit, a
// threshold, a volume. A native range input underneath, so the keyboard
// (arrows, Page Up / Down, Home, End), touch and screen readers work as
// they do everywhere; drawn to match the other fields.
//
//   <fx-slider label="Max parallel runs" name="parallel" min="1" max="8" value="3"></fx-slider>
//   <fx-slider label="Opacity" value="80" suffix="%" step="5"></fx-slider>
//
// Attributes: label, name, value, min (0), max (100), step (1), suffix (after
// the shown value: "%", " runs"), show-value (default on; "false" hides
// it), ticks (a mark at every step, for few steps), supporting-text, block
// (full width), plus FxFormControl's disabled and required.
//
// Form-associated: posts name=value, resets to its value attribute, and
// fires input while dragging and change when let go -- as a range input.

import { FxFormControl } from "./fx-form-control.js";
import { escapeHtml } from "../lib/escape.js";

let uid = 0;

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --_pct: 50%;
      display: inline-flex;
      flex-direction: column;
      gap: var(--fx-spacing-03);
      width: 16rem;
      max-width: 100%;
      font: var(--fx-type-body-compact-01);
      color: var(--fx-text);
    }
    :host([hidden]) { display: none; }
    :host([block]) { display: flex; width: 100%; }
    .head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--fx-spacing-04); }
    .label { color: var(--fx-text-secondary); font: var(--fx-type-label-01); letter-spacing: 0.02em; }
    .value { color: var(--fx-text); font-variant-numeric: tabular-nums; }
    :host([show-value="false"]) .value { display: none; }
    .row { position: relative; display: flex; align-items: center; height: 1.5rem; }
    input {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 1.5rem;
      margin: 0;
      background: transparent;
      cursor: pointer;
    }
    input:disabled { cursor: not-allowed; }
    /* The track: filled up to the thumb in the interactive color. */
    input::-webkit-slider-runnable-track {
      height: 0.25rem;
      border-radius: var(--fx-radius-pill);
      background: linear-gradient(to right, var(--_fill) var(--_pct), var(--_rest) var(--_pct));
    }
    input::-moz-range-track { height: 0.25rem; border-radius: var(--fx-radius-pill); background: var(--_rest); }
    input::-moz-range-progress { height: 0.25rem; border-radius: var(--fx-radius-pill); background: var(--_fill); }
    input::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 1rem;
      height: 1rem;
      margin-top: -0.375rem;
      border: 2px solid var(--fx-layer);
      border-radius: 50%;
      background: var(--_fill);
      box-shadow: 0 0 0 1px var(--_fill), var(--fx-shadow-sm);
      transition: transform var(--fx-duration-fast-02) var(--fx-easing-standard);
    }
    input::-moz-range-thumb { width: 0.75rem; height: 0.75rem; border: 2px solid var(--fx-layer); border-radius: 50%; background: var(--_fill); box-shadow: 0 0 0 1px var(--_fill); }
    input:hover:not(:disabled)::-webkit-slider-thumb, input:active::-webkit-slider-thumb { transform: scale(1.2); }
    input:focus-visible { outline: none; }
    input:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 1px var(--_fill), 0 0 0 4px color-mix(in srgb, var(--fx-focus) 40%, transparent); }
    input:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 4px color-mix(in srgb, var(--fx-focus) 40%, transparent); }
    :host { --_fill: var(--fx-interactive); --_rest: var(--fx-border); }
    :host(:disabled) { --_fill: var(--fx-text-disabled); }
    .ticks { position: absolute; inset: 50% 0.5rem auto; display: flex; justify-content: space-between; height: 0; pointer-events: none; }
    .ticks span { width: 2px; height: 0.5rem; margin-top: 0.4rem; border-radius: 1px; background: var(--fx-border-strong); }
    .ends { display: flex; justify-content: space-between; color: var(--fx-text-secondary); font: var(--fx-type-helper-01); font-variant-numeric: tabular-nums; }
    .support { color: var(--fx-text-secondary); font: var(--fx-type-helper-01); }
    .support:empty { display: none; }
    :host([invalid]) .support { color: var(--fx-status-error-text); }
  </style>
  <div class="head"><label class="label" part="label"></label><output class="value" part="value"></output></div>
  <div class="row"><input type="range" part="input" data-focus><div class="ticks" aria-hidden="true"></div></div>
  <div class="ends" aria-hidden="true"><span class="min"></span><span class="max"></span></div>
  <div class="support" part="supporting-text"></div>
`;

export class FxSlider extends FxFormControl {
  static observedAttributes = ["label", "value", "min", "max", "step", "suffix", "ticks", "supporting-text", "disabled", "name", "aria-label"];

  #input;
  #id = `fx-slider-${++uid}`;
  #dirty = false;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open", delegatesFocus: true });
    root.appendChild(template.content.cloneNode(true));
    this.#input = root.querySelector("input");
    this.#input.id = this.#id;
    root.querySelector(".label").htmlFor = this.#id;
    this.#input.addEventListener("input", () => {
      this.#dirty = true;
      this.#paint();
      // The native input event is composed already; nothing to re-fire.
    });
    this.#input.addEventListener("change", () => this.fireChange());
  }

  connectedCallback() {
    this.upgradeProperties(["value"]);
    this.#render();
  }

  attributeChangedCallback(name) {
    if (name === "value" && this.#dirty) return this.#paint();
    this.#render();
  }

  onDisabledChange() {
    this.#render();
  }

  formResetCallback() {
    this.#dirty = false;
    this.#input.value = this.getAttribute("value") ?? this.#middle();
    this.#paint();
  }

  get value() {
    return this.#input.value;
  }
  set value(value) {
    this.#dirty = true;
    this.#input.value = String(value);
    this.#paint();
  }
  get valueAsNumber() {
    return Number(this.#input.value);
  }
  get min() {
    return Number(this.#input.min);
  }
  get max() {
    return Number(this.#input.max);
  }
  get focusTarget() {
    return this.#input;
  }

  #middle() {
    const min = Number(this.getAttribute("min") ?? 0);
    const max = Number(this.getAttribute("max") ?? 100);
    return String(min + (max - min) / 2);
  }

  #render() {
    const root = this.shadowRoot;
    const input = this.#input;
    input.min = this.getAttribute("min") ?? "0";
    input.max = this.getAttribute("max") ?? "100";
    input.step = this.getAttribute("step") ?? "1";
    input.disabled = this.disabled;
    if (!this.#dirty) input.value = this.getAttribute("value") ?? this.#middle();
    const label = this.getAttribute("label") ?? "";
    root.querySelector(".label").textContent = label;
    if (!label && this.getAttribute("aria-label")) input.setAttribute("aria-label", this.getAttribute("aria-label"));
    root.querySelector(".min").textContent = `${input.min}${this.getAttribute("suffix") ?? ""}`;
    root.querySelector(".max").textContent = `${input.max}${this.getAttribute("suffix") ?? ""}`;
    const support = root.querySelector(".support");
    support.innerHTML = escapeHtml(this.getAttribute("supporting-text") ?? "");
    if (support.textContent) {
      support.id = `${this.#id}-support`;
      input.setAttribute("aria-describedby", support.id);
    } else input.removeAttribute("aria-describedby");
    // A mark at every step, when there are few enough to read.
    const steps = (Number(input.max) - Number(input.min)) / Number(input.step || 1);
    root.querySelector(".ticks").innerHTML = this.hasAttribute("ticks") && steps > 0 && steps <= 20 ? "<span></span>".repeat(Math.round(steps) + 1) : "";
    this.#paint();
  }

  /** The fill, the shown value, and what the form posts. */
  #paint() {
    const input = this.#input;
    const min = Number(input.min);
    const max = Number(input.max);
    const pct = max > min ? ((Number(input.value) - min) / (max - min)) * 100 : 0;
    this.style.setProperty("--_pct", `${pct}%`);
    const shown = `${input.value}${this.getAttribute("suffix") ?? ""}`;
    this.shadowRoot.querySelector(".value").textContent = shown;
    input.setAttribute("aria-valuetext", shown);
    this.syncForm(this.disabled ? null : input.value);
    this.syncValidity({}, "", input);
  }

  updateValidity() {
    this.#paint();
  }
}

if (!customElements.get("fx-slider")) customElements.define("fx-slider", FxSlider);
