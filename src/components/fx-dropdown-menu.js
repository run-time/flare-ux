/**
 * An icon button that opens a short menu of actions.
 *
 *   <fx-dropdown-menu label="Actions">
 *     <fx-icon slot="trigger" name="plus"></fx-icon>   (optional: a ⋮ by default)
 *     <button data-value="rename"><fx-icon name="edit"></fx-icon> Rename</button>
 *     <hr>
 *     <button data-value="delete" data-tone="danger">Delete</button>
 *   </fx-dropdown-menu>
 *
 * Choosing an item fires `fx:menu-select` (bubbling, composed) with
 * `detail.value` set to its data-value, then closes the menu.
 *
 * The menu is a popover, so it renders in the top layer: a scrolling or
 * overflow-hidden column cannot clip it, and the browser handles the outside
 * click and Escape that close it. It is placed under the button, lined up
 * with the button's right edge (`align="start"` for the left), and flips
 * above when there is no room below. Arrow keys, Home and End move between
 * items; focus returns to the button when the menu closes.
 *
 * `open` is reflected on the host while the menu is showing, so a page that
 * re-renders on a timer can leave it alone until it closes.
 *
 * The page sizes the icons inside the trigger and the items -- shadow styles
 * reach a slotted element but not what is inside it:
 *   fx-dropdown-menu [slot="trigger"] svg, fx-dropdown-menu > button svg { … }
 */
import { follow } from "../lib/follow.js";

let nextId = 0;

export class FxDropdownMenu extends HTMLElement {
  #menu;
  #trigger;
  #restoreFocus = false;
  #wasOpen = false;

  constructor() {
    super();
    const id = `fx-menu-${(nextId += 1)}`;
    this.attachShadow({ mode: "open" }).innerHTML = `
      <style>
        :host { display: inline-flex; position: relative; }
        .trigger {
          all: unset;
          box-sizing: border-box;
          display: inline-grid;
          place-items: center;
          width: var(--fx-dropdown-menu-trigger-size, var(--fx-size-sm));
          height: var(--fx-dropdown-menu-trigger-size, var(--fx-size-sm));
          border-radius: var(--fx-dropdown-menu-trigger-radius, var(--fx-radius));
          color: var(--fx-text-secondary);
          cursor: pointer;
        }
        .trigger:hover, :host([open]) .trigger { background: var(--fx-interactive-subtle); color: var(--fx-interactive-text); }
        .trigger:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: 1px; }
        ::slotted([slot="trigger"]) { display: grid; place-items: center; }
        .default-icon { width: 1.25rem; height: 1.25rem; }
        :host(:has(> [slot="trigger"])) .default-icon { display: none; }
        .menu {
          position: fixed;
          inset: auto;
          margin: 0;
          min-width: 10rem;
          padding: var(--fx-spacing-02);
          border: 1px solid var(--fx-border);
          border-radius: var(--fx-radius-lg);
          background: var(--fx-layer);
          z-index: var(--fx-z-dropdown);
          color: var(--fx-text);
          box-shadow: var(--fx-shadow);
        }
        .menu:popover-open { display: flex; flex-direction: column; gap: 0.1rem; }
        ::slotted(button) {
          all: unset;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 0.55rem;
          width: 100%;
          min-height: var(--fx-size-sm);
          padding: 0 var(--fx-spacing-04);
          border-radius: var(--fx-radius);
          color: var(--fx-text);
          font: var(--fx-type-body-compact-01);
          white-space: nowrap;
          cursor: pointer;
        }
        ::slotted(button:hover), ::slotted(button:focus-visible) { background: var(--fx-layer-hover); outline: none; }
        ::slotted(button:focus-visible) { box-shadow: inset 0 0 0 2px var(--fx-focus); }
        ::slotted(hr) { all: unset; display: block; height: 1px; margin: var(--fx-spacing-02) 0; background: var(--fx-border); }
        ::slotted(button[data-tone="danger"]) { color: var(--fx-status-error-text); }
        ::slotted(button[data-tone="danger"]:hover), ::slotted(button[data-tone="danger"]:focus-visible) { background: var(--fx-status-error-bg); }
        ::slotted(button[disabled]) { opacity: 0.45; cursor: default; }
      </style>
      <button type="button" class="trigger" part="trigger" aria-haspopup="menu" aria-expanded="false" aria-controls="${id}">
        <slot name="trigger"></slot><svg class="default-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>
      </button>
      <div class="menu" id="${id}" part="menu" role="menu" popover>
        <slot></slot>
      </div>`;
    this.#trigger = this.shadowRoot.querySelector(".trigger");
    this.#menu = this.shadowRoot.querySelector(".menu");

    // An open popover closes itself on pointerdown anywhere outside it --
    // this button included -- so by the time the click lands it is already
    // shut. Remember whether it was open, or the click would reopen it.
    this.#trigger.addEventListener("pointerdown", () => {
      this.#wasOpen = this.#menu.matches(":popover-open");
    });
    this.#trigger.addEventListener("click", (event) => {
      // The row or card behind the button must not also take the click.
      event.stopPropagation();
      if (this.#wasOpen) this.#wasOpen = false;
      else this.#menu.togglePopover();
    });
    this.#menu.addEventListener("toggle", (event) => this.#onToggle(event.newState === "open"));
    this.#menu.addEventListener("click", (event) => this.#onChoose(event));
    this.#menu.addEventListener("keydown", (event) => this.#onKey(event));
  }

  connectedCallback() {
    this.#trigger.setAttribute("aria-label", this.getAttribute("label") ?? "Menu");
    this.#trigger.title = this.getAttribute("label") ?? "";
  }

  disconnectedCallback() {
    this.#unfollow();
  }

  get #items() {
    return [...this.querySelectorAll(":scope > button:not([slot]):not([disabled])")];
  }

  #close = () => this.#menu.hidePopover();
  #unfollow = () => {};

  // The items are this element's own children, so focus on one is reported
  // by the tree this element sits in -- a page's shadow root, usually -- not
  // by document.activeElement.
  #focused() {
    return this.getRootNode().activeElement ?? null;
  }

  #onToggle(open) {
    this.toggleAttribute("open", open);
    this.#trigger.setAttribute("aria-expanded", String(open));
    if (open) {
      for (const item of this.querySelectorAll(":scope > button:not([slot])")) {
        item.setAttribute("role", "menuitem");
        item.tabIndex = -1;
      }
      this.#place();
      this.#items[0]?.focus();
      // Kept on the button while the page scrolls or resizes; closed once it or
      // the menu scrolls out of view.
      this.#unfollow = follow(this.#trigger, () => this.#place(), { popup: this.#menu, close: this.#close });
    } else {
      this.#unfollow();
      if (this.#restoreFocus || this.contains(this.#focused())) {
        this.#trigger.focus();
      }
      this.#restoreFocus = false;
    }
  }

  #place() {
    const anchor = this.#trigger.getBoundingClientRect();
    const menu = this.#menu.getBoundingClientRect();
    const gap = 4;
    const edge = 8;
    const below = anchor.bottom + gap;
    const top =
      below + menu.height > window.innerHeight - edge && anchor.top - gap - menu.height >= edge
        ? anchor.top - gap - menu.height
        : below;
    let left = this.getAttribute("align") === "start" ? anchor.left : anchor.right - menu.width;
    left = Math.min(Math.max(edge, left), window.innerWidth - menu.width - edge);
    this.#menu.style.top = `${Math.round(top)}px`;
    this.#menu.style.left = `${Math.round(left)}px`;
  }

  #onChoose(event) {
    const item = event.target.closest?.("button[data-value]");
    if (!item || item.disabled || item.parentElement !== this) return;
    event.stopPropagation();
    this.#restoreFocus = true;
    this.#close();
    this.dispatchEvent(
      new CustomEvent("fx:menu-select", {
        detail: { value: item.dataset.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #onKey(event) {
    const items = this.#items;
    if (!items.length) return;
    const at = items.indexOf(this.#focused());
    let next = -1;
    if (event.key === "ArrowDown") next = (at + 1) % items.length;
    else if (event.key === "ArrowUp") next = (at - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else if (event.key === "Tab") {
      this.#close();
      return;
    } else return;
    event.preventDefault();
    items[next].focus();
  }
}

if (!customElements.get("fx-dropdown-menu")) customElements.define("fx-dropdown-menu", FxDropdownMenu);
