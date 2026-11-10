// <fx-split-button>: Material 3's split button -- an action, and beside it a
// menu. The leading part does the action; the trailing part opens the menu.
// The menu either picks what the action runs with (a choice, shown on the
// trailing part) or lists other actions (a combo button).
//
//   <fx-split-button value="fast" name="speed">
//     Deploy
//     <fx-option slot="menu" value="fast" note="default">Fast</fx-option>
//     <fx-option slot="menu" value="safe" icon="lock">Safe</fx-option>
//   </fx-split-button>
//
//   <fx-split-button menu="actions" variant="outlined">
//     Save
//     <fx-option slot="menu" value="save-as">Save as…</fx-option>
//     <fx-option slot="menu" value="save-copy">Save a copy</fx-option>
//   </fx-split-button>
//
// Attributes:
//   variant     filled (default) | tonal | outlined
//   trail-variant  the trailing part's own variant, when it differs --
//               a filled action with an outlined chooser beside it
//   size        sm | md (default) | lg
//   menu        choice (default): picking sets `value`, shows it on the
//               trailing part, and fires `change`
//               actions: picking fires `fx:menu-select` ({ value }) and
//               changes nothing
//   value       the chosen option's value (choice menus); posted with `name`
//   menu-label  what the menu is called, for assistive technology
//   type        button (default) | submit -- the leading part submits its form
//   loading, disabled -- as on <fx-button>
//   trail-label what the trailing part says in place of the choice
//   own-menu    the trailing part draws no menu; a click fires
//               `fx:trail-click` with { anchor: DOMRect } for the page to
//               open its own. Set `open` while it is up.
//
// Options are <fx-option slot="menu"> children: value, the label inside,
// and optional icon (an icon name), color (draws the icon in a badge: a
// palette family like teal gives a pale oval with the icon in a deep shade;
// a family and step like red-80, or any CSS color, a solid circle with a
// white icon), note (small text after the label) and disabled. A click on the leading part reaches the page as a click on the
// element; the trailing part's and the menu's clicks stay inside it.

import "./fx-spinner.js";
import { escapeHtml } from "../lib/escape.js";
import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";
import { paletteColor } from "../lib/palette-color.js";
import { follow } from "../lib/follow.js";


/** An option's icon: plain, or in a round badge of its `color`. */
function optionIcon(option) {
  const name = option.getAttribute("icon");
  if (!name) return "";
  const color = option.getAttribute("color")?.trim();
  if (!color) return iconSvg(name);
  const palette = paletteColor(color);
  // A family: a pale oval of it, the icon in a deep shade.
  if (palette && !palette.explicitStep) return `<span class="badge tint" style="--_badge: ${palette.tint}; --_badge-on: ${palette.ink}">${iconSvg(name)}</span>`;
  const [bg, on] = palette ? [palette.fill, palette.on] : [color, "var(--fx-color-white)"];
  return `<span class="badge" style="--_badge: ${escapeHtml(bg)}; --_badge-on: ${on}">${iconSvg(name)}</span>`;
}

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --_fg: var(--fx-text-on-color);
      --_bg: var(--fx-interactive);
      --_border: var(--_bg);
      --_hover-bg: var(--fx-interactive-hover);
      --_radius: var(--fx-radius-lg);
      --_height: var(--fx-size-md);
      display: inline-flex;
      vertical-align: middle;
      box-sizing: border-box !important;
      outline: none !important;
    }
    :host([hidden]) { display: none; }
    :host([size="sm"]) { --_height: var(--fx-size-sm); }
    :host([size="lg"]) { --_height: var(--fx-size-lg); }
    :host([variant="tonal"]) {
      --_fg: var(--fx-interactive-text);
      --_bg: var(--fx-interactive-subtle);
      --_hover-bg: color-mix(in srgb, var(--fx-interactive) 16%, var(--_bg));
    }
    :host([variant="outlined"]), :host([trail-variant="outlined"]) .trail {
      --_fg: var(--fx-interactive-text);
      --_bg: var(--fx-layer);
      --_border: var(--fx-border-strong);
      --_hover-bg: color-mix(in srgb, var(--fx-interactive) 6%, var(--_bg));
    }
    :host([trail-variant="tonal"]) .trail {
      --_fg: var(--fx-interactive-text);
      --_bg: var(--fx-interactive-subtle);
      --_border: var(--_bg);
      --_hover-bg: color-mix(in srgb, var(--fx-interactive) 16%, var(--_bg));
    }
    :host([trail-variant="filled"]) .trail {
      --_fg: var(--fx-text-on-color);
      --_bg: var(--fx-interactive);
      --_border: var(--_bg);
      --_hover-bg: var(--fx-interactive-hover);
    }

    /* Two parts with a small gap: rounded on the outside, nearly square
       where they meet -- the trailing part rounds fully while its menu is
       open. */
    .split { display: inline-flex; gap: 2px; }
    button {
      display: inline-flex;
      align-items: center;
      gap: var(--fx-spacing-03);
      box-sizing: border-box;
      min-height: var(--_height);
      margin: 0;
      border: 1px solid var(--_border);
      background: var(--_bg);
      color: var(--_fg);
      font: 400 var(--fx-font-size-02) / 1.29 var(--fx-font);
      white-space: nowrap;
      cursor: pointer;
      transition: background-color var(--fx-duration-fast-02) var(--fx-easing-standard), border-radius var(--fx-duration-moderate-01) var(--fx-easing-standard);
    }
        button:hover:not(:disabled) { background: var(--_hover-bg); }
    button:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: 2px; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    :host([loading]) .lead:disabled { opacity: 1; cursor: wait; }

    .lead { padding: 0 var(--fx-spacing-04) 0 var(--fx-spacing-05); border-radius: var(--_radius) 3px 3px var(--_radius); }
    .trail { padding: 0 var(--fx-spacing-03); border-radius: 3px var(--_radius) var(--_radius) 3px; }
    :host([open]) .trail { border-radius: var(--_radius); }
    .trail .choice { font-weight: 400; opacity: 0.92; }
    .trail .choice:empty { display: none; }
    .trail svg, .opt svg { width: 1rem; height: 1rem; flex: none; }
    /* An option's icon in a round badge of its color. */
    .badge {
      display: inline-grid;
      place-items: center;
      flex: none;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      background: var(--_badge);
      color: var(--_badge-on);
    }
    .badge svg { width: 0.9375rem; height: 0.9375rem; }
    .badge.tint { width: auto; height: auto; padding: 0.125rem 0.5rem; border-radius: var(--fx-radius-pill); }
    .badge.tint svg { width: 0.875rem; height: 0.875rem; }
    .trail .badge { margin-inline-start: calc(-1 * var(--fx-spacing-01)); }
    .chevron { transition: transform var(--fx-duration-moderate-01) var(--fx-easing-standard); }
    :host([open]) .chevron { transform: rotate(180deg); }

    fx-spinner { display: none; }
    :host([loading]) fx-spinner { display: inline-block; }

    .menu[popover] {
      position: fixed;
      inset: auto;
      margin: 0;
      padding: var(--fx-spacing-02);
      min-width: 12rem;
      border: 1px solid var(--fx-border);
      border-radius: var(--fx-radius-lg);
      background: var(--fx-layer);
      color: var(--fx-text);
      box-shadow: var(--fx-shadow);
    }
    .opt {
      display: flex;
      align-items: center;
      gap: var(--fx-spacing-03);
      width: 100%;
      min-height: var(--fx-size-sm);
      padding: 0 var(--fx-spacing-04) 0 var(--fx-spacing-03);
      border: 0;
      border-radius: var(--fx-radius);
      background: transparent;
      color: inherit;
      font: var(--fx-type-body-compact-01);
      text-align: left;
    }
    .opt:hover:not(:disabled), .opt:focus-visible { background: var(--fx-layer-hover); outline: none; }
    .opt:focus-visible { box-shadow: inset 0 0 0 2px var(--fx-focus); }
    .opt .label { flex: 1; }
    .opt small { color: var(--fx-text-secondary); font: var(--fx-type-helper-01); }
    .opt .tick { display: inline-flex; width: 1rem; color: var(--fx-interactive-text); }
    .opt:not([aria-checked="true"]) .tick svg { visibility: hidden; }
    :host([menu="actions"]) .opt .tick { display: none; }
  </style>
  <span class="split">
    <button type="button" class="lead" part="lead"><slot></slot><fx-spinner size="16" aria-hidden="true"></fx-spinner></button>
    <button type="button" class="trail" part="trail" aria-haspopup="menu" aria-expanded="false"></button>
  </span>
  <div class="menu" popover="auto" role="menu" part="menu"></div>
  <slot name="menu" hidden></slot>
`;

export class FxSplitButton extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["value", "loading", "disabled", "trail-label", "menu-label", "open", "menu"];

  #internals = this.attachInternals();
  #lead;
  #trail;
  #menu;
  #spinner;
  #formDisabled = false;
  #observer = new MutationObserver(() => this.#render());
  #unfollow = () => {};

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open", delegatesFocus: true });
    root.appendChild(template.content.cloneNode(true));
    this.#lead = root.querySelector(".lead");
    this.#trail = root.querySelector(".trail");
    this.#menu = root.querySelector(".menu");
    this.#spinner = root.querySelector("fx-spinner");

    // The leading part: the element's own click, and its form's submit. The
    // trailing part's and the menu's clicks stop inside, so any click that
    // reaches here is the leading part's.
    this.addEventListener("click", (event) => {
      if (this.disabled || this.loading) {
        event.stopImmediatePropagation();
        event.preventDefault();
        return;
      }
      if (this.getAttribute("type") === "submit") this.#internals.form?.requestSubmit();
    });
    this.#trail.addEventListener("click", (event) => {
      event.stopPropagation();
      if (this.hasAttribute("own-menu")) {
        this.dispatchEvent(new CustomEvent("fx:trail-click", { bubbles: true, composed: true, detail: { anchor: this.#trail.getBoundingClientRect() } }));
        return;
      }
      this.#toggleMenu();
    });
    this.#menu.addEventListener("click", (event) => {
      event.stopPropagation();
      const option = event.target.closest(".opt");
      if (option && !option.disabled) this.#pick(option.dataset.value);
    });
    this.#menu.addEventListener("keydown", (event) => this.#menuKeys(event));
    this.#menu.addEventListener("toggle", (event) => {
      const isOpen = event.newState === "open";
      this.toggleAttribute("open", isOpen);
      this.#trail.setAttribute("aria-expanded", String(isOpen));
      if (!isOpen) this.#unfollow();
    });
  }

  connectedCallback() {
    this.#observer.observe(this, { childList: true, subtree: true, attributes: true, characterData: true });
    this.#render();
  }

  disconnectedCallback() {
    this.#observer.disconnect();
    this.#unfollow();
  }

  attributeChangedCallback() {
    this.#render();
  }

  formDisabledCallback(disabled) {
    this.#formDisabled = disabled;
    this.#render();
  }

  formResetCallback() {
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

  get value() {
    return this.getAttribute("value") ?? this.options[0]?.getAttribute("value") ?? "";
  }
  set value(value) {
    this.setAttribute("value", String(value ?? ""));
  }

  get form() {
    return this.#internals.form;
  }

  get options() {
    return [...this.querySelectorAll(':scope > fx-option[slot="menu"]')];
  }

  get menuOpen() {
    return this.hasAttribute("open");
  }

  #isChoice() {
    return this.getAttribute("menu") !== "actions";
  }

  #render() {
    if (!this.#lead) return;
    const chosen = this.options.find((option) => option.getAttribute("value") === this.value);
    const own = this.getAttribute("trail-label");
    const shown = own ?? (this.#isChoice() ? chosen?.textContent.trim() ?? "" : "");
    const icon = this.#isChoice() && chosen ? optionIcon(chosen) : "";
    this.#trail.innerHTML = `${icon}<span class="choice">${escapeHtml(shown)}</span>${iconSvg("chevron-down", { className: "chevron" })}`;
    const menuLabel = this.getAttribute("menu-label") || (this.#isChoice() ? "Choose an option" : "More actions");
    this.#trail.setAttribute("aria-label", shown ? `${menuLabel}: ${shown}` : menuLabel);
    this.#menu.setAttribute("aria-label", menuLabel);
    this.#trail.setAttribute("aria-expanded", String(this.menuOpen));
    this.#lead.disabled = this.disabled || this.loading;
    this.#trail.disabled = this.disabled || this.loading;
    this.#lead.setAttribute("aria-busy", String(this.loading));
    if (this.loading) this.#spinner.setAttribute("fg-color", getComputedStyle(this.#lead).color || "currentColor");
    this.#internals.setFormValue(this.#isChoice() && this.getAttribute("name") ? this.value : null);
  }

  #menuHtml() {
    const choice = this.#isChoice();
    const value = this.value;
    return this.options
      .map((option) => {
        const optionValue = option.getAttribute("value") ?? "";
        const icon = optionIcon(option);
        const note = option.getAttribute("note");
        const role = choice ? `menuitemradio" aria-checked="${optionValue === value}` : "menuitem";
        return `<button type="button" class="opt" role="${role}" data-value="${escapeHtml(optionValue)}" tabindex="-1"${option.hasAttribute("disabled") ? " disabled" : ""}>
          <span class="tick">${iconSvg("check")}</span>${icon}
          <span class="label">${escapeHtml(option.textContent.trim())}${note ? ` <small>${escapeHtml(note)}</small>` : ""}</span>
        </button>`;
      })
      .join("");
  }

  #toggleMenu() {
    if (this.menuOpen) {
      this.#menu.hidePopover();
      return;
    }
    this.#menu.innerHTML = this.#menuHtml();
    this.#menu.showPopover();
    this.#place();
    // Kept on the button while the page scrolls or resizes; closed once it or
    // the menu scrolls out of view.
    this.#unfollow = follow(this.#trail, () => this.#place(), { popup: this.#menu, close: () => this.#menu.hidePopover() });
    (this.#menu.querySelector('[aria-checked="true"]') ?? this.#menu.querySelector(".opt:not(:disabled)"))?.focus();
  }

  // Under the trailing part, or above it when there is no room below.
  #place() {
    const at = this.#trail.getBoundingClientRect();
    const width = this.#menu.offsetWidth;
    const height = this.#menu.offsetHeight;
    this.#menu.style.left = `${Math.round(Math.min(Math.max(at.right - width, 8), window.innerWidth - width - 8))}px`;
    const below = at.bottom + 4;
    this.#menu.style.top = `${Math.round(below + height > window.innerHeight - 8 ? Math.max(8, at.top - height - 4) : below)}px`;
  }

  #pick(value) {
    this.#menu.hidePopover();
    this.#trail.focus();
    if (!this.#isChoice()) {
      this.dispatchEvent(new CustomEvent("fx:menu-select", { bubbles: true, composed: true, detail: { value } }));
      return;
    }
    if (value === this.value) return;
    this.value = value;
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  #menuKeys(event) {
    const options = [...this.#menu.querySelectorAll(".opt:not(:disabled)")];
    const index = options.indexOf(this.shadowRoot.activeElement);
    const move = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (move) {
      event.preventDefault();
      options[(index + move + options.length) % options.length]?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      options[event.key === "Home" ? 0 : options.length - 1]?.focus();
    } else if (event.key === "Tab") {
      this.#menu.hidePopover();
    }
  }
}

if (!customElements.get("fx-split-button")) {
  customElements.define("fx-split-button", FxSplitButton);
}
