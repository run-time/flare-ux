// <fx-segmented-button>: Material 3's segmented buttons -- a row of options
// joined into one outlined control, the chosen ones filled, with a check
// before a chosen text label.
//
//   <fx-segmented-button name="frame" value="1w" label="Time frame">
//     <fx-option value="1d">1d</fx-option>
//     <fx-option value="1w">1w</fx-option>
//     <fx-option value="all">All</fx-option>
//   </fx-segmented-button>
//   <fx-segmented-button value="compact" icon-only>
//     <fx-option value="compact" title="Compact"><svg>…</svg></fx-option>
//     <fx-option value="detail" title="Detail" icon="settings"></fx-option>
//   </fx-segmented-button>
//
// Options are the element's <fx-option> children: value, the label inside
// (text or an <svg>), and optional icon (an icon name), title,
// disabled. Attributes: value (comma-separated with `multiple`), multiple,
// label (aria-label for the group), size (xs | sm | md; dense = xs),
// icon-only (no check mark, square
// segments), plus FxFormControl's name, disabled, required. `input` and
// `change` when the user picks; `values` is the list with `multiple`.

import { FxFormControl } from "./fx-form-control.js";
import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";
import { escapeHtml } from "../lib/escape.js";

const CHECK = `<svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`;

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --fx-segmented-color: var(--fx-interactive-text);
      --fx-segmented-selected-bg: var(--fx-interactive-subtle);
      --fx-segmented-border: var(--fx-border-strong);
      --fx-segmented-fg: var(--fx-text);
      display: inline-flex;
      vertical-align: middle;
      box-sizing: border-box !important;
    }
    :host([hidden]) { display: none; }
    .group {
      display: inline-flex;
      border: 1px solid var(--fx-segmented-border);
      border-radius: 999px;
      overflow: hidden;
    }
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      min-height: var(--fx-size-sm);
      margin: 0;
      padding: 0 var(--fx-spacing-05);
      border: 0;
      border-left: 1px solid var(--fx-segmented-border);
      background: transparent;
      color: var(--fx-segmented-fg);
      font: 400 var(--fx-font-size-02) var(--fx-font);
      white-space: nowrap;
      cursor: pointer;
      transition: background-color var(--fx-duration-fast-02) var(--fx-easing-standard), color var(--fx-duration-fast-02) var(--fx-easing-standard);
    }
    button:first-child { border-left: 0; }
    button:hover:not(:disabled) { background: color-mix(in srgb, var(--fx-segmented-color) 8%, transparent); }
    button:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: -2px; }
    button[aria-checked="true"] { background: var(--fx-segmented-selected-bg); color: var(--fx-segmented-color); }
    button:disabled { opacity: 0.45; cursor: default; }
    .check { width: 0.85rem; height: 0.85rem; flex: none; display: none; }
    button[aria-checked="true"] .check { display: block; }
    :host([icon-only]) .check { display: none !important; }
    :host([icon-only]) button { padding: 0 var(--fx-spacing-04); }
    button svg:not(.check) { width: 1rem; height: 1rem; flex: none; }
    :host(:is([dense], [size="xs"])) button { min-height: var(--fx-size-xs); padding: 0 var(--fx-spacing-04); font-size: var(--fx-font-size-01); }
    :host([size="md"]) button { min-height: var(--fx-size-md); }
    :host(:is([dense], [size="xs"])[icon-only]) button { padding: 0 var(--fx-spacing-03); }
  </style>
  <div class="group" part="group"></div>
`;

export class FxSegmentedButton extends FxFormControl {
  static observedAttributes = ["value", "multiple", "disabled", "label", "name", "required"];

  #group;
  #values = [];
  #observer = new MutationObserver(() => this.#render());

  constructor() {
    super();
    this.attachShadow({ mode: "open", delegatesFocus: true }).appendChild(template.content.cloneNode(true));
    this.#group = this.shadowRoot.querySelector(".group");
    this.#group.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (button && !button.disabled) this.#pick(button.dataset.value);
    });
    this.#group.addEventListener("keydown", (event) => this.#keys(event));
  }

  connectedCallback() {
    this.upgradeProperties(["value", "values"]);
    this.#observer.observe(this, { childList: true, subtree: true, attributes: true, characterData: true });
    this.#render();
  }

  disconnectedCallback() {
    this.#observer.disconnect();
  }

  attributeChangedCallback(name) {
    if (name === "value") this.#values = this.#parse(this.getAttribute("value"));
    this.#render();
  }

  onDisabledChange() {
    this.#render();
  }

  formResetCallback() {
    this.#values = this.#parse(this.getAttribute("value"));
    this.#render();
  }

  #parse(text) {
    if (text === null || text === undefined || text === "") return [];
    return this.hasAttribute("multiple") ? String(text).split(",").map((part) => part.trim()).filter(Boolean) : [String(text)];
  }

  get value() {
    return this.#values.join(",");
  }
  set value(value) {
    this.#values = this.#parse(value);
    this.#render();
  }

  /** The chosen values, as a list (one item without `multiple`). */
  get values() {
    return [...this.#values];
  }
  set values(list) {
    this.#values = (Array.isArray(list) ? list : []).map(String);
    this.#render();
  }

  get options() {
    return [...this.querySelectorAll(":scope > fx-option")];
  }

  #pick(value) {
    if (this.hasAttribute("multiple")) {
      this.#values = this.#values.includes(value) ? this.#values.filter((item) => item !== value) : [...this.#values, value];
    } else {
      if (this.#values[0] === value) return;
      this.#values = [value];
    }
    this.#render();
    this.shadowRoot.querySelector(`button[data-value="${CSS.escape(value)}"]`)?.focus();
    this.fireInput();
    this.fireChange();
  }

  #keys(event) {
    const buttons = [...this.#group.querySelectorAll("button:not(:disabled)")];
    const index = buttons.indexOf(this.shadowRoot.activeElement);
    if (index < 0) return;
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (step) {
      event.preventDefault();
      const next = buttons[(index + step + buttons.length) % buttons.length];
      next.focus();
      // One choice: moving picks, as a radio group does.
      if (!this.hasAttribute("multiple")) this.#pick(next.dataset.value);
    }
  }

  #render() {
    if (!this.#group) return;
    const multiple = this.hasAttribute("multiple");
    const focused = this.shadowRoot.activeElement?.dataset?.value;
    const options = this.options;
    const selectedFirst = options.find((option) => this.#values.includes(option.getAttribute("value") ?? ""));
    this.#group.setAttribute("role", multiple ? "group" : "radiogroup");
    const label = this.getAttribute("label");
    if (label) this.#group.setAttribute("aria-label", label);
    else this.#group.removeAttribute("aria-label");
    this.#group.innerHTML = options
      .map((option, index) => {
        const value = option.getAttribute("value") ?? "";
        const on = this.#values.includes(value);
        const icon = option.getAttribute("icon");
        const title = option.getAttribute("title") ?? option.getAttribute("aria-label") ?? "";
        const content = option.innerHTML.trim();
        // One Tab stop: the chosen one, else the first.
        const tabStop = multiple || (selectedFirst ? option === selectedFirst : index === 0);
        return `<button type="button" part="segment${on ? " segment-selected" : ""}" role="${multiple ? "checkbox" : "radio"}" aria-checked="${on}" data-value="${escapeHtml(value)}"
          ${title ? `title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}"` : ""} tabindex="${tabStop ? 0 : -1}"
          ${this.disabled || option.hasAttribute("disabled") ? "disabled" : ""}>${CHECK}${icon ? iconSvg(icon) : ""}${content}</button>`;
      })
      .join("");
    if (focused) this.shadowRoot.querySelector(`button[data-value="${CSS.escape(focused)}"]`)?.focus();
    this.syncValidity(this.required && !this.#values.length ? { valueMissing: true } : {}, "Please pick one.");
    if (multiple) {
      const data = new FormData();
      for (const value of this.#values) data.append(this.name, value);
      this.syncForm(this.name ? data : null);
    } else this.syncForm(this.#values[0] ?? null);
  }
}

if (!customElements.get("fx-segmented-button")) customElements.define("fx-segmented-button", FxSegmentedButton);
