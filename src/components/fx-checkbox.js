// <fx-checkbox>: a checkbox drawn to one color -- selected, unselected and
// indeterminate, each enabled or disabled, with a halo on hover, focus and
// press.
//
//   <label><fx-checkbox name="terms" checked></fx-checkbox> I agree</label>
//
// Attributes: checked, disabled, indeterminate, name, value, color (the
// selected color; the --fx-checkbox-color property does the same).
// Form-associated, so it posts with a form, sits in form.elements, follows a
// disabled <fieldset>, and a <label> around it toggles it. Fires `input` and
// `change` (bubbling) when the user changes it, as a native checkbox does.

import { FxFormControl } from "./fx-form-control.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --fx-checkbox-color: var(--fx-interactive);
      --fx-checkbox-border: var(--fx-control-border);
      --fx-checkbox-disabled: var(--fx-text-disabled);
      --fx-checkbox-halo: color-mix(in srgb, var(--fx-checkbox-color) 18%, transparent);
      --fx-checkbox-halo-strong: color-mix(in srgb, var(--fx-checkbox-color) 28%, transparent);
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
      /* The halo shows focus; the page's own focus outline would box it. */
      outline: none !important;
      -webkit-tap-highlight-color: transparent;
    }
    :host(:disabled) { cursor: default; }

    /* The halo: a circle behind the box, shown on hover, focus and press. */
    .halo {
      position: absolute;
      inset: -11px;
      border-radius: 50%;
      background: transparent;
      transition: background-color var(--fx-duration-fast-02) var(--fx-easing-standard);
      pointer-events: none;
    }
    :host(:not(:disabled):hover) .halo { background: color-mix(in srgb, var(--fx-checkbox-border) 12%, transparent); }
    :host(:not(:disabled):focus-visible) .halo,
    :host(:not(:disabled):active) .halo { background: color-mix(in srgb, var(--fx-checkbox-border) 24%, transparent); }
    :host([checked]:not(:disabled):hover) .halo,
    :host([indeterminate]:not(:disabled):hover) .halo { background: var(--fx-checkbox-halo); }
    :host([checked]:not(:disabled):focus-visible) .halo,
    :host([checked]:not(:disabled):active) .halo,
    :host([indeterminate]:not(:disabled):focus-visible) .halo,
    :host([indeterminate]:not(:disabled):active) .halo { background: var(--fx-checkbox-halo-strong); }

    .box {
      position: relative;
      box-sizing: border-box;
      width: 18px;
      height: 18px;
      border: 2px solid var(--fx-checkbox-border);
      border-radius: 2px;
      background: transparent;
      transition: background-color var(--fx-duration-fast-02) var(--fx-easing-standard), border-color var(--fx-duration-fast-02) var(--fx-easing-standard);
    }
    :host([invalid]:not([checked])) .box { border-color: var(--fx-status-error); }
    :host(:disabled) .box { border-color: color-mix(in srgb, var(--fx-checkbox-disabled) 70%, transparent); }
    :host([checked]) .box,
    :host([indeterminate]) .box { border-color: var(--fx-checkbox-color); background: var(--fx-checkbox-color); }
    :host([checked]:disabled) .box { border-color: var(--fx-checkbox-disabled); background: var(--fx-checkbox-disabled); }
    :host([indeterminate]:disabled) .box { opacity: 0.45; }

    svg { position: absolute; inset: 0; width: 100%; height: 100%; fill: none; stroke: #fff; stroke-width: 2.4; stroke-linecap: square; }
    .check { stroke-dasharray: 18; stroke-dashoffset: 18; transition: stroke-dashoffset var(--fx-duration-moderate-01) var(--fx-easing-standard); }
    .dash { opacity: 0; }
    :host([checked]:not([indeterminate])) .check { stroke-dashoffset: 0; }
    :host([indeterminate]) .dash { opacity: 1; }
  </style>
  <span class="halo" part="halo"></span>
  <span class="box" part="box">
    <svg viewBox="0 0 14 14" aria-hidden="true">
      <path class="check" d="M2.6 7.2l2.9 2.9 6-6.2"></path>
      <path class="dash" d="M3.2 7h7.6"></path>
    </svg>
  </span>
`;

export class FxCheckbox extends FxFormControl {
  static observedAttributes = ["checked", "disabled", "indeterminate", "color", "aria-label", "value", "name", "required"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    this.addEventListener("click", (event) => {
      if (this.disabled) {
        event.preventDefault();
        return;
      }
      this.#toggle();
    });
    this.addEventListener("keydown", (event) => {
      if (event.key === " ") event.preventDefault(); // no page scroll
    });
    this.addEventListener("keyup", (event) => {
      if (event.key === " " && !this.disabled) this.#toggle();
    });
  }

  connectedCallback() {
    this.upgradeProperties(["checked", "indeterminate", "value"]);
    this.rememberDefaultChecked();
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  onDisabledChange() {
    this.#render();
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

  get indeterminate() {
    return this.hasAttribute("indeterminate");
  }
  set indeterminate(value) {
    this.toggleAttribute("indeterminate", Boolean(value));
  }

  get value() {
    return this.getAttribute("value") ?? "on";
  }
  set value(value) {
    this.setAttribute("value", String(value));
  }
  get type() {
    return "checkbox";
  }

  updateValidity() {
    this.#render();
  }

  #toggle() {
    this.indeterminate = false;
    this.checked = !this.checked;
    this.fireInput();
    this.fireChange();
  }

  #render() {
    const color = this.getAttribute("color");
    if (color) this.style.setProperty("--fx-checkbox-color", color);
    else this.style.removeProperty("--fx-checkbox-color");
    this.internals.role = "checkbox";
    this.internals.ariaChecked = this.indeterminate ? "mixed" : String(this.checked);
    this.internals.ariaDisabled = String(this.disabled);
    // Reachable by Tab unless disabled.
    if (this.disabled) this.removeAttribute("tabindex");
    else if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");
    this.syncValidity(this.required && !this.checked ? { valueMissing: true } : {}, "Please tick this box.");
    if (this.hasAttribute("invalid") && this.validity.valid) this.removeAttribute("invalid");
    this.syncForm(this.checked ? this.value : null);
  }
}

if (!customElements.get("fx-checkbox")) {
  customElements.define("fx-checkbox", FxCheckbox);
}
