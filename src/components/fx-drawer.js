// <fx-drawer>: a panel that slides in from the edge of the window over the
// page -- the details of a row, a form too long for a dialog. Its inner edge
// can be dragged (or moved with the arrow keys) to make it wider.
//
//   <fx-drawer headline="Build #42" storage-key="build">
//     …content…
//     <fx-button slot="actions" variant="filled">Re-run</fx-button>
//   </fx-drawer>
//   drawer.show();   // or drawer.open = true
//
// Attributes:
//   open         reflects; set or remove it to open or close
//   headline     the title at the top
//   placement    end (the default, the right in left-to-right text) | start
//   modal        dims the page behind and keeps focus inside; a click on the
//                dim closes it. Without it the page stays usable.
//   width        the starting width, any CSS length (default min(32rem, 90vw))
//   storage-key  remember a dragged width in this browser under that key
//   no-resize    no drag handle
//
// Methods: show(), close(). Escape closes it. Events: `close` once closed;
// `cancel` (cancelable) before Escape or the dim closes it.
// Focus moves to the close button on open and back where it was on close.

import "./fx-button.js";
import { escapeHtml } from "../lib/escape.js";

const MIN_WIDTH = 280;

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host { display: contents; }
    dialog {
      position: fixed;
      inset: 0 0 0 auto;
      width: var(--_width, min(32rem, 90vw));
      max-width: 95vw;
      height: 100dvh;
      max-height: none;
      margin: 0;
      padding: 0;
      border: 0;
      border-left: 1px solid var(--fx-border);
      background: var(--fx-layer);
      color: var(--fx-text);
      box-shadow: var(--fx-shadow-lg);
      z-index: var(--fx-z-drawer);
      overflow: visible;
    }
    :host([placement="start"]) dialog { inset: 0 auto 0 0; border-left: 0; border-right: 1px solid var(--fx-border); }
    dialog[open] { display: flex; flex-direction: column; animation: fx-drawer-in var(--fx-duration-moderate-02) var(--fx-easing-entrance); }
    :host([placement="start"]) dialog[open] { animation-name: fx-drawer-in-start; }
    dialog::backdrop { background: var(--fx-overlay); }
    @keyframes fx-drawer-in { from { transform: translateX(100%); } }
    @keyframes fx-drawer-in-start { from { transform: translateX(-100%); } }
    .head {
      flex: none;
      display: flex;
      align-items: center;
      gap: var(--fx-spacing-03);
      min-height: var(--fx-size-lg);
      padding: var(--fx-spacing-03) var(--fx-spacing-03) var(--fx-spacing-03) var(--fx-spacing-05);
      border-bottom: 1px solid var(--fx-border);
    }
    .headline { flex: 1; min-width: 0; margin: 0; font: var(--fx-type-heading-02); overflow-wrap: anywhere; }
    .body { flex: 1; min-height: 0; overflow: auto; padding: var(--fx-spacing-05); font: var(--fx-type-body-01); }
    .actions { flex: none; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--fx-spacing-03); padding: var(--fx-spacing-04) var(--fx-spacing-05); border-top: 1px solid var(--fx-border); background: var(--fx-layer-alt); }
    .actions[hidden] { display: none; }
    .handle {
      position: absolute;
      top: 0;
      bottom: 0;
      left: -4px;
      width: 8px;
      cursor: col-resize;
      touch-action: none;
      outline: none;
    }
    :host([placement="start"]) .handle { left: auto; right: -4px; }
    .handle::after { content: ""; position: absolute; top: 0; bottom: 0; left: 3px; width: 2px; background: transparent; transition: background-color var(--fx-duration-fast-02); }
    .handle:hover::after, .handle:focus-visible::after, :host([resizing]) .handle::after { background: var(--fx-interactive); }
    :host([no-resize]) .handle { display: none; }
    :host([resizing]) dialog { user-select: none; }
  </style>
  <dialog part="drawer">
    <div class="handle" part="handle" role="separator" aria-orientation="vertical" aria-label="Resize" tabindex="0"></div>
    <header class="head" part="header">
      <h2 class="headline" part="headline"></h2>
      <slot name="header-actions"></slot>
      <fx-button class="close" variant="text" icon="close" aria-label="Close"></fx-button>
    </header>
    <div class="body" part="body"><slot></slot></div>
    <footer class="actions" part="actions"><slot name="actions"></slot></footer>
  </dialog>
`;

export class FxDrawer extends HTMLElement {
  static observedAttributes = ["open", "headline", "width"];

  #dialog;
  #handle;
  #lastFocused = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    this.#dialog = this.shadowRoot.querySelector("dialog");
    this.#handle = this.shadowRoot.querySelector(".handle");
    this.shadowRoot.querySelector(".close").addEventListener("click", () => this.close());
    const actions = this.shadowRoot.querySelector('slot[name="actions"]');
    actions.addEventListener("slotchange", () => {
      actions.parentElement.hidden = actions.assignedElements().length === 0;
    });
    actions.parentElement.hidden = true;

    // Escape: the modal dialog's own cancel, or our own listener when it is
    // not modal (a non-modal dialog ignores Escape).
    this.#dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      this.#requestClose();
    });
    this.#dialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !this.hasAttribute("modal")) {
        event.stopPropagation();
        this.#requestClose();
      }
    });
    // A click on the dim lands on the dialog itself.
    let pressedBackdrop = false;
    this.#dialog.addEventListener("pointerdown", (event) => {
      pressedBackdrop = event.target === this.#dialog && this.hasAttribute("modal");
    });
    this.#dialog.addEventListener("click", (event) => {
      if (pressedBackdrop && event.target === this.#dialog) {
        const box = this.#dialog.getBoundingClientRect();
        const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
        if (!inside) this.#requestClose();
      }
    });
    this.#dialog.addEventListener("close", () => {
      if (this.hasAttribute("open")) this.removeAttribute("open");
    });

    this.#handle.addEventListener("pointerdown", (event) => this.#startResize(event));
    this.#handle.addEventListener("keydown", (event) => this.#resizeKeys(event));
    this.#handle.addEventListener("dblclick", () => this.#setWidth(null));
  }

  connectedCallback() {
    this.#applyStoredWidth();
    if (this.hasAttribute("open")) this.#openDialog();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "headline") {
      this.shadowRoot.querySelector(".headline").innerHTML = escapeHtml(newValue ?? "");
      this.#dialog.setAttribute("aria-label", newValue ?? "");
      return;
    }
    if (name === "width") {
      this.#applyStoredWidth();
      return;
    }
    if (name === "open" && (oldValue === null) !== (newValue === null)) {
      if (newValue !== null) this.#openDialog();
      else this.#closeDialog();
    }
  }

  get open() {
    return this.hasAttribute("open");
  }
  set open(value) {
    this.toggleAttribute("open", Boolean(value));
  }

  show() {
    this.open = true;
  }

  close() {
    this.open = false;
  }

  #requestClose() {
    if (this.dispatchEvent(new Event("cancel", { cancelable: true }))) this.close();
  }

  #openDialog() {
    if (!this.isConnected || this.#dialog.open) return;
    this.#lastFocused = document.activeElement;
    if (this.hasAttribute("modal")) this.#dialog.showModal();
    else this.#dialog.show();
    requestAnimationFrame(() => this.shadowRoot.querySelector(".close")?.focus());
  }

  #closeDialog() {
    if (!this.#dialog.open) return;
    this.#dialog.close();
    if (this.#lastFocused instanceof HTMLElement && this.#lastFocused.isConnected) this.#lastFocused.focus();
    this.#lastFocused = null;
    this.dispatchEvent(new Event("close"));
  }

  // ------------------------------------------------------------ width

  get #storageKey() {
    const key = this.getAttribute("storage-key");
    return key ? `fx.drawer-width.${key}` : null;
  }

  #applyStoredWidth() {
    let stored = null;
    try {
      stored = this.#storageKey ? Number(localStorage.getItem(this.#storageKey)) || null : null;
    } catch {
      stored = null;
    }
    const width = stored ? `${this.#clamp(stored)}px` : this.getAttribute("width");
    if (width) this.style.setProperty("--_width", width);
    else this.style.removeProperty("--_width");
    this.#syncHandle();
  }

  #clamp(px) {
    return Math.round(Math.max(MIN_WIDTH, Math.min(px, window.innerWidth * 0.95)));
  }

  #setWidth(px) {
    if (px === null) {
      try {
        if (this.#storageKey) localStorage.removeItem(this.#storageKey);
      } catch {}
      this.#applyStoredWidth();
      return;
    }
    const width = this.#clamp(px);
    this.style.setProperty("--_width", `${width}px`);
    try {
      if (this.#storageKey) localStorage.setItem(this.#storageKey, String(width));
    } catch {}
    this.#syncHandle();
  }

  #syncHandle() {
    const width = Math.round(this.#dialog.getBoundingClientRect().width) || 0;
    this.#handle.setAttribute("aria-valuemin", String(MIN_WIDTH));
    this.#handle.setAttribute("aria-valuemax", String(Math.round(window.innerWidth * 0.95)));
    if (width) this.#handle.setAttribute("aria-valuenow", String(width));
  }

  #startResize(event) {
    event.preventDefault();
    this.#handle.setPointerCapture(event.pointerId);
    this.toggleAttribute("resizing", true);
    const start = event.clientX;
    const startWidth = this.#dialog.getBoundingClientRect().width;
    const sign = this.getAttribute("placement") === "start" ? 1 : -1;
    const move = (e) => this.#setWidth(startWidth + sign * (e.clientX - start));
    const up = () => {
      this.removeAttribute("resizing");
      this.#handle.removeEventListener("pointermove", move);
      this.#handle.removeEventListener("pointerup", up);
      this.#handle.removeEventListener("pointercancel", up);
    };
    this.#handle.addEventListener("pointermove", move);
    this.#handle.addEventListener("pointerup", up);
    this.#handle.addEventListener("pointercancel", up);
  }

  #resizeKeys(event) {
    const grow = this.getAttribute("placement") === "start" ? "ArrowRight" : "ArrowLeft";
    const shrink = this.getAttribute("placement") === "start" ? "ArrowLeft" : "ArrowRight";
    const step = event.shiftKey ? 64 : 16;
    const width = this.#dialog.getBoundingClientRect().width;
    if (event.key === grow) this.#setWidth(width + step);
    else if (event.key === shrink) this.#setWidth(width - step);
    else if (event.key === "Home") this.#setWidth(MIN_WIDTH);
    else if (event.key === "End") this.#setWidth(window.innerWidth);
    else return;
    event.preventDefault();
  }
}

if (!customElements.get("fx-drawer")) customElements.define("fx-drawer", FxDrawer);
