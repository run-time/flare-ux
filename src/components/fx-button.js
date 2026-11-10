// <fx-button>: a button. Three optional parts, in order -- an icon, the
// text, and a spinner while it is loading -- so a button can be an icon
// alone, an icon and text, text alone, or any of those with a spinner.
//
//   <fx-button variant="filled" icon="refresh">Resync</fx-button>
//   <fx-button icon="refresh" aria-label="Sync now"></fx-button>
//   <fx-button variant="text" icon="trash" fg-color="var(--fx-status-error)" aria-label="Delete"></fx-button>
//   <fx-button loading>Saving</fx-button>
//
// Attributes:
//   variant   Material 3's emphasis, highest first:
//               filled    the one main action in a view (alias primary)
//               tonal     an important action that is not the main one
//               outlined  a secondary action (the default; alias secondary)
//               text      a low-emphasis action, often beside another
//                         button or icon-only in a toolbar (alias tertiary,
//                         ghost)
//               link      reads as a link, inline with text
//               danger    a destructive main action (filled, red)
//   icon      an icon name (see fx-icon); or put an <svg slot="icon"> inside
//   loading   shows the spinner after the text and blocks clicks
//   disabled
//   type      button (default) | submit | reset -- acts on its form
//   size      xs | sm | md (default) | lg -- 24, 32, 40, 48px (--fx-size-*)
//   fg-color  the text and icon color (property fgColor)
//   bg-color  the fill (property bgColor); with fg-color, e.g. a red trash can
//
// Clicks reach the page as a click on <fx-button> itself, so
// `event.target.closest("[data-x]")` and `button.disabled = true` work as
// they do with <button>. An icon-only button needs an aria-label (or a
// title) to say what it does.

import "./fx-spinner.js";
import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";

// State a screen reader reads off the focusable button, so set on the host
// and copied in: a disclosure's aria-expanded, a toggle's aria-pressed, a
// menu trigger's aria-haspopup. (aria-controls cannot point across the
// shadow boundary, so it is not.)
const FORWARDED_ARIA = ["aria-expanded", "aria-pressed", "aria-haspopup"];

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      /* Each variant sets these; fg-color and bg-color override them. */
      --_fg: var(--fx-interactive-text);
      --_bg: var(--fx-layer);
      --_border: var(--fx-border-strong);
      --_hover-border: var(--fx-interactive);
      --_hover-bg: color-mix(in srgb, var(--fx-interactive) 6%, var(--fx-layer));
      --_height: var(--fx-size-md);
      --_pad: var(--fx-spacing-05);
      --_icon: 1.25rem;
      display: inline-flex;
      vertical-align: middle;
      box-sizing: border-box !important;
      outline: none !important;
    }
    :host([hidden]) { display: none; }
    :host([variant="primary"]), :host([variant="filled"]) {
      --_fg: var(--fx-text-on-color);
      --_bg: var(--fx-interactive);
      --_border: var(--_bg);
      --_hover-border: var(--fx-interactive-hover);
      --_hover-bg: var(--fx-interactive-hover);
    }
    :host([variant="danger"]) {
      --_fg: var(--fx-text-on-color);
      --_bg: var(--fx-status-error);
      --_border: var(--_bg);
      --_hover-border: var(--fx-color-red-60-hover);
      --_hover-bg: var(--fx-color-red-60-hover);
    }
    :host([variant="tonal"]) {
      --_fg: var(--fx-interactive-text);
      --_bg: var(--fx-interactive-subtle);
      --_border: var(--_bg);
      --_hover-border: var(--_hover-bg);
      --_hover-bg: color-mix(in srgb, var(--fx-interactive) 16%, var(--_bg));
    }
    :host(:is([variant="tertiary"], [variant="text"], [variant="ghost"])) {
      --_bg: transparent;
      --_border: transparent;
      --_hover-border: transparent;
      --_hover-bg: color-mix(in srgb, var(--_fg) 10%, transparent);
    }
    :host([variant="link"]) {
      --_fg: var(--fx-link);
      --_bg: transparent;
      --_border: transparent;
      --_hover-border: transparent;
      --_hover-bg: transparent;
    }
    :host([size="xs"]) { --_height: var(--fx-size-xs); --_pad: var(--fx-spacing-03); --_icon: 1rem; }
    :host([size="sm"]) { --_height: var(--fx-size-sm); --_pad: var(--fx-spacing-04); --_icon: 1rem; }
    :host([size="lg"]) { --_height: var(--fx-size-lg); --_pad: var(--fx-spacing-06); }
    /* fg-color / bg-color: set as --fx-button-fg / --fx-button-bg. */
    :host([fg-color]) { --_fg: var(--fx-button-fg); }
    :host([bg-color]) { --_bg: var(--fx-button-bg); --_border: var(--fx-button-bg); --_hover-border: var(--fx-button-bg); --_hover-bg: color-mix(in srgb, var(--fx-button-bg) 88%, #000); }
    :host([fg-color]:is([variant="tertiary"], [variant="text"], [variant="ghost"]):not([bg-color])) { --_hover-bg: color-mix(in srgb, var(--fx-button-fg) 12%, transparent); }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--fx-spacing-03);
      box-sizing: border-box;
      min-height: var(--_height);
      margin: 0;
      padding: 0 var(--_pad);
      border: 1px solid var(--_border);
      border-radius: var(--fx-radius);
      background: var(--_bg);
      color: var(--_fg);
      font: 400 var(--fx-font-size-02) / 1.29 var(--fx-font);
      white-space: nowrap;
      cursor: pointer;
      transition: background-color var(--fx-duration-fast-02) var(--fx-easing-standard), border-color var(--fx-duration-fast-02) var(--fx-easing-standard);
    }
    :host([size="xs"]) button { font-size: var(--fx-font-size-01); }
    button:hover:not(:disabled) { border-color: var(--_hover-border); background: var(--_hover-bg); }
    button:active:not(:disabled) { background: color-mix(in srgb, var(--_hover-bg) 85%, var(--_fg)); }
    button:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: 2px; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    :host([loading]) button:disabled { opacity: 1; cursor: wait; }

    :host([variant="link"]) button { min-height: 0; padding: 0; font-weight: 400; }
    :host([variant="link"]) button:hover:not(:disabled) { text-decoration: underline; text-underline-offset: 0.15em; }

    /* Icon only: a square. */
    :host(:not([has-text])) button { padding: 0; width: var(--_height); }
    :host(:not([has-text])[variant="link"]) button { width: auto; }

    .icon { display: inline-flex; flex: none; }
    .icon:not(.has-icon) { display: none; }
    .icon svg, ::slotted(svg) { width: var(--_icon); height: var(--_icon); }
    .text:not(.has-text) { display: none; }
    fx-spinner { display: none; flex: none; }
    :host([loading]) fx-spinner { display: inline-block; }
    /* Icon only and loading: the spinner takes the icon's place. */
    :host([loading]:not([has-text])) .icon { display: none; }
  </style>
  <button type="button" part="button">
    <span class="icon" part="icon"><slot name="icon"></slot></span>
    <span class="text" part="text"><slot></slot></span>
    <fx-spinner size="16" part="spinner" aria-hidden="true"></fx-spinner>
  </button>
`;

// Enter in a form's text field submits it through its first submit button
// -- but browsers only count a native <button> as one, so a form whose
// submit is an <fx-button> or <fx-split-button> would stop submitting on
// Enter once it has more than one field. Where a form has no native submit,
// Enter in a field presses its first enabled custom one, as the browser
// would. Listening on the document in the capture phase, through shadow
// roots via the composed path, covers forms inside components too.
const SUBMITS = 'fx-button[type="submit"], fx-split-button[type="submit"]';
const NOT_TEXT = new Set(["checkbox", "radio", "button", "submit", "reset", "file", "image", "color", "range", "hidden"]);
document.addEventListener(
  "keydown",
  (event) => {
    if (event.key !== "Enter" || event.isComposing || event.defaultPrevented || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
    const field = event.composedPath()[0];
    if (!(field instanceof HTMLInputElement) || NOT_TEXT.has(field.type)) return;
    const form = field.form;
    if (!form || form.querySelector('button[type="submit"], button:not([type]), input[type="submit"], input[type="image"]')) return;
    const submits = [...form.querySelectorAll(SUBMITS)];
    // No submit control of any kind: the browser's own rule applies.
    if (!submits.length) return;
    const submit = submits.find((element) => !element.disabled && !element.loading);
    event.preventDefault();
    // No live submit (it is working, or switched off): Enter does nothing,
    // as it would with a disabled native one.
    if (submit) form.requestSubmit();
  },
  true,
);

export class FxButton extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["icon", "loading", "disabled", "fg-color", "bg-color", "aria-label", "title", ...FORWARDED_ARIA];

  #internals = this.attachInternals();
  #button;
  #icon;
  #text;
  #spinner;
  #formDisabled = false;
  // The icon drawn now: undefined until the first render.
  #iconName = undefined;
  // The spinner's color, set only when it changes.
  #spinnerColor = "";

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open", delegatesFocus: true });
    root.appendChild(template.content.cloneNode(true));
    this.#button = root.querySelector("button");
    this.#icon = root.querySelector(".icon");
    this.#text = root.querySelector(".text");
    this.#spinner = root.querySelector("fx-spinner");
    root.querySelector("slot:not([name])").addEventListener("slotchange", () => this.#render());
    root.querySelector('slot[name="icon"]').addEventListener("slotchange", () => this.#render());
    // A click while disabled or loading never reaches the page; a submit or
    // reset button acts on its form.
    this.addEventListener("click", (event) => {
      if (this.disabled || this.loading) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return;
      }
      const form = this.#internals.form;
      const type = this.getAttribute("type");
      if (form && type === "submit") form.requestSubmit();
      else if (form && type === "reset") form.reset();
    });
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  formDisabledCallback(disabled) {
    this.#formDisabled = disabled;
    this.#render();
  }

  get disabled() {
    return this.#formDisabled || this.hasAttribute("disabled");
  }
  set disabled(value) {
    this.toggleAttribute("disabled", Boolean(value));
  }

  get loading() {
    return this.hasAttribute("loading");
  }
  set loading(value) {
    this.toggleAttribute("loading", Boolean(value));
  }

  get fgColor() {
    return this.getAttribute("fg-color") ?? "";
  }
  set fgColor(value) {
    if (value) this.setAttribute("fg-color", value);
    else this.removeAttribute("fg-color");
  }

  get bgColor() {
    return this.getAttribute("bg-color") ?? "";
  }
  set bgColor(value) {
    if (value) this.setAttribute("bg-color", value);
    else this.removeAttribute("bg-color");
  }

  get form() {
    return this.#internals.form;
  }

  #render() {
    if (!this.#button) return;
    const name = this.getAttribute("icon");
    const slotted = this.querySelector(':scope > [slot="icon"]');
    // The named icon, unless one is slotted in. Rewritten only when the name
    // changes: rewriting the slot's contents fires slotchange, which renders
    // again -- every render rewriting it froze the page.
    const iconSlot = this.#icon.querySelector("slot");
    if (this.#iconName !== name) {
      this.#iconName = name;
      iconSlot.innerHTML = name ? iconSvg(name) : "";
    }
    this.#icon.classList.toggle("has-icon", Boolean(slotted || (name && iconSvg(name))));

    const hasText = [...this.childNodes].some(
      (node) => (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) || (node.nodeType === Node.ELEMENT_NODE && !node.hasAttribute("slot")),
    );
    this.toggleAttribute("has-text", hasText);
    this.#text.classList.toggle("has-text", hasText);

    const fg = this.getAttribute("fg-color");
    const bg = this.getAttribute("bg-color");
    if (fg) this.style.setProperty("--fx-button-fg", fg);
    else this.style.removeProperty("--fx-button-fg");
    if (bg) this.style.setProperty("--fx-button-bg", bg);
    else this.style.removeProperty("--fx-button-bg");
    // The spinner in the button's own text color.
    // Only while it shows, and only when the color moved.
    if (this.loading && this.isConnected) {
      const color = getComputedStyle(this.#button).color || "currentColor";
      if (color !== this.#spinnerColor) {
        this.#spinnerColor = color;
        this.#spinner.setAttribute("fg-color", color);
      }
    }

    this.#button.disabled = this.disabled || this.loading;
    this.#button.setAttribute("aria-busy", String(this.loading));
    // An icon-only button is named by its aria-label or title.
    const label = this.getAttribute("aria-label") || (!hasText ? this.getAttribute("title") : "");
    if (label) this.#button.setAttribute("aria-label", label);
    else this.#button.removeAttribute("aria-label");
    for (const name of FORWARDED_ARIA) {
      const value = this.getAttribute(name);
      if (value === null) this.#button.removeAttribute(name);
      else this.#button.setAttribute(name, value);
    }
  }
}

if (!customElements.get("fx-button")) {
  customElements.define("fx-button", FxButton);
}
