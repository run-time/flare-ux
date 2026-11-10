// <fx-radio>: Material 3's radio button. Radios with the same `name` in the
// same form (or, outside a form, the same document or shadow root) are one
// group, as native radios are: picking one clears the others, one Tab stop
// for the group, and the arrow keys move and pick within it.
//
//   <label><fx-radio name="kind" value="bug" checked></fx-radio> Bug</label>
//
// Attributes: name, value (default "on"), checked, disabled, required,
// color (the selected color; or --fx-radio-color). `change` (and `input`)
// when the user picks it. The group's checked one posts name=value.

import { FxFormControl } from "./fx-form-control.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --fx-radio-color: var(--fx-interactive);
      --fx-radio-border: var(--fx-control-border);
      position: relative;
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      box-sizing: content-box !important;
      width: 18px;
      height: 18px;
      vertical-align: middle;
      cursor: pointer;
      outline: none !important;
      -webkit-tap-highlight-color: transparent;
    }
    :host(:disabled) { cursor: default; opacity: 0.45; }
    .halo { position: absolute; inset: -11px; border-radius: 50%; transition: background-color var(--fx-duration-fast-02) var(--fx-easing-standard); pointer-events: none; }
    :host(:not(:disabled):hover) .halo { background: color-mix(in srgb, var(--fx-radio-border) 12%, transparent); }
    :host(:not(:disabled):focus-visible) .halo, :host(:not(:disabled):active) .halo { background: color-mix(in srgb, var(--fx-radio-border) 24%, transparent); }
    :host([checked]:not(:disabled):hover) .halo { background: color-mix(in srgb, var(--fx-radio-color) 18%, transparent); }
    :host([checked]:not(:disabled):focus-visible) .halo, :host([checked]:not(:disabled):active) .halo { background: color-mix(in srgb, var(--fx-radio-color) 28%, transparent); }
    .ring { position: relative; box-sizing: border-box; width: 18px; height: 18px; border: 2px solid var(--fx-radio-border); border-radius: 50%; transition: border-color var(--fx-duration-fast-02) var(--fx-easing-standard); }
    .dot { position: absolute; inset: 3px; border-radius: 50%; background: var(--fx-radio-color); transform: scale(0); transition: transform var(--fx-duration-moderate-01) var(--fx-easing-standard); }
    :host([checked]) .ring { border-color: var(--fx-radio-color); }
    :host([checked]) .dot { transform: scale(1); }
  </style>
  <span class="halo" part="halo"></span>
  <span class="ring" part="ring"><span class="dot"></span></span>
`;

export class FxRadio extends FxFormControl {
  static observedAttributes = ["checked", "disabled", "color", "value", "name", "required", "aria-label"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    this.addEventListener("click", () => {
      if (!this.disabled && !this.checked) this.#pick();
    });
    this.addEventListener("keydown", (event) => this.#keys(event));
  }

  connectedCallback() {
    this.upgradeProperties(["checked", "value"]);
    this.rememberDefaultChecked();
    this.#render();
    this.#syncGroup();
  }

  attributeChangedCallback(name) {
    this.#render();
    if (name === "checked" && this.checked) this.#uncheckOthers();
    if (name === "checked" || name === "name") this.#syncGroup();
  }

  onDisabledChange() {
    this.#render();
    this.#syncGroup();
  }

  formResetCallback() {
    this.checked = this.defaultChecked;
  }

  get checked() {
    return this.hasAttribute("checked");
  }
  set checked(value) {
    this.toggleAttribute("checked", Boolean(value));
  }

  get value() {
    return this.getAttribute("value") ?? "on";
  }
  set value(value) {
    this.setAttribute("value", String(value));
  }
  get type() {
    return "radio";
  }

  /** Every radio in this one's group, in document order. */
  group() {
    const name = this.name;
    if (!name) return [this];
    const scope = this.form ?? this.getRootNode();
    return [...scope.querySelectorAll("fx-radio")].filter((radio) => radio.name === name && (radio.form ?? radio.getRootNode()) === scope);
  }

  #pick() {
    this.checked = true;
    this.focus();
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    this.fireChange();
  }

  #uncheckOthers() {
    for (const radio of this.group()) if (radio !== this && radio.checked) radio.checked = false;
  }

  // One Tab stop per group: the checked radio, else the first enabled one.
  #syncGroup() {
    const group = this.group();
    const stop = group.find((radio) => radio.checked && !radio.disabled) ?? group.find((radio) => !radio.disabled);
    for (const radio of group) {
      if (radio.disabled) radio.removeAttribute("tabindex");
      else radio.setAttribute("tabindex", radio === stop ? "0" : "-1");
      radio.#syncValidityFor(group);
    }
  }

  #syncValidityFor(group) {
    const missing = group.some((radio) => radio.required) && !group.some((radio) => radio.checked);
    this.syncValidity(missing ? { valueMissing: true } : {}, "Please pick one.");
  }

  #keys(event) {
    if (event.key === " ") {
      event.preventDefault();
      if (!this.checked && !this.disabled) this.#pick();
      return;
    }
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const group = this.group().filter((radio) => !radio.disabled);
    const next = group[(group.indexOf(this) + step + group.length) % group.length];
    if (next && next !== this) next.#pick();
  }

  #render() {
    const color = this.getAttribute("color");
    if (color) this.style.setProperty("--fx-radio-color", color);
    else this.style.removeProperty("--fx-radio-color");
    this.internals.role = "radio";
    this.internals.ariaChecked = String(this.checked);
    this.internals.ariaDisabled = String(this.disabled);
    this.syncForm(this.checked ? this.value : null);
  }
}

if (!customElements.get("fx-radio")) customElements.define("fx-radio", FxRadio);
