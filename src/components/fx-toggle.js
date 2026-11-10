// <fx-toggle>: an on/off switch -- a pill track with a
// round knob, green when on -- with its state's word beside it.
//
//   <label><fx-toggle name="alerts" checked></fx-toggle> Email alerts</label>
//   <fx-toggle aria-label="Dark mode" on-label="Dark" off-label="Light"></fx-toggle>
//
// Attributes: checked, disabled, on-label / off-label (the state's word,
// "On" and "Off" by default), hide-state (no word), size (sm | md), color
// (the on color; or --fx-toggle-on-color), plus FxFormControl's name,
// value, required. Form-associated; a <label> around it flips it. Fires
// `input` and `change` when the user flips it, as a native checkbox does.

import { FxFormControl } from "./fx-form-control.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --fx-toggle-on-color: var(--fx-status-success);
      --_w: 3rem;
      --_h: 1.5rem;
      --_knob: 1.125rem;
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: var(--fx-spacing-03);
      vertical-align: middle;
      box-sizing: border-box !important;
      cursor: pointer;
      font: var(--fx-type-body-compact-01);
      color: var(--fx-text);
    }
    :host([size="sm"]) { --_w: 2rem; --_h: 1rem; --_knob: 0.625rem; }
    :host([hidden]) { display: none; }
    :host(:disabled) { cursor: not-allowed; color: var(--fx-text-disabled); }
    label { display: contents; cursor: inherit; }
    input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      opacity: 0;
      cursor: inherit;
    }
    .track {
      position: relative;
      flex: none;
      width: var(--_w);
      height: var(--_h);
      border-radius: var(--fx-radius-pill);
      background: var(--fx-border-strong);
      transition: background-color var(--fx-duration-fast-02) var(--fx-easing-standard);
    }
    .knob {
      position: absolute;
      top: calc((var(--_h) - var(--_knob)) / 2);
      left: calc((var(--_h) - var(--_knob)) / 2);
      width: var(--_knob);
      height: var(--_knob);
      border-radius: 50%;
      background: var(--fx-color-white);
      transition: transform var(--fx-duration-fast-02) var(--fx-easing-standard);
    }
    /* A tick in the small knob once on. */
    .tick { display: none; position: absolute; inset: 0; width: 100%; height: 100%; fill: none; stroke: var(--fx-toggle-on-color); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
    :host([size="sm"][checked]) .tick { display: block; }
    input:checked ~ .track { background: var(--fx-toggle-on-color); }
    input:checked ~ .track .knob { transform: translateX(calc(var(--_w) - var(--_h))); }
    input:focus-visible ~ .track { outline: 2px solid var(--fx-focus); outline-offset: 2px; }
    input:disabled ~ .track { background: var(--fx-border); }
    input:disabled ~ .track .knob { background: var(--fx-text-disabled); }
    .state { min-width: 1.6em; }
    :host([hide-state]) .state { display: none; }
  </style>
  <label part="toggle">
    <input type="checkbox" role="switch" />
    <span class="track" part="track"><span class="knob" part="knob"><svg class="tick" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.6 5.2 4.3 6.9 7.4 3.4"/></svg></span></span>
    <span class="state" part="state" aria-hidden="true"></span>
  </label>
`;

export class FxToggle extends FxFormControl {
  static observedAttributes = ["checked", "disabled", "on-label", "off-label", "aria-label", "color", "value", "name", "required", "hide-state"];

  #input;
  #state;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open", delegatesFocus: true });
    root.appendChild(template.content.cloneNode(true));
    this.#input = root.querySelector("input");
    this.#input.setAttribute("data-focus", "");
    this.#state = root.querySelector(".state");
    // A <label> around it clicks the element itself, not the switch inside:
    // pass that click on, so the label's text flips it too. A click on the
    // switch itself starts inside and is the switch's own.
    this.addEventListener("click", (event) => {
      if (event.composedPath()[0] !== this || this.disabled) return;
      this.#input.click();
    });
    this.#input.addEventListener("change", () => {
      this.checked = this.#input.checked;
      this.fireInput();
      this.fireChange();
    });
  }

  connectedCallback() {
    this.upgradeProperties(["checked", "value"]);
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

  #render() {
    this.#input.checked = this.checked;
    this.#input.disabled = this.disabled;
    this.#state.textContent = this.checked ? (this.getAttribute("on-label") ?? "On") : (this.getAttribute("off-label") ?? "Off");
    // color="#0f62fe" or color="var(--fx-interactive)": the on color.
    const color = this.getAttribute("color");
    if (color) this.style.setProperty("--fx-toggle-on-color", color);
    else this.style.removeProperty("--fx-toggle-on-color");
    const ariaLabel = this.getAttribute("aria-label");
    if (ariaLabel) this.#input.setAttribute("aria-label", ariaLabel);
    else this.#input.removeAttribute("aria-label");
    this.syncValidity(this.required && !this.checked ? { valueMissing: true } : {}, "Please switch this on.", this.#input);
    this.syncForm(this.checked ? this.value : null);
  }
}

if (!customElements.get("fx-toggle")) {
  customElements.define("fx-toggle", FxToggle);
}
