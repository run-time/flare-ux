// <fx-app-shell>: an app's frame -- a
// header across the top, a left panel for navigation that can be dragged
// wider or narrower (or folded to a rail of icons), and the page beside it,
// scrolling on its own.
//
//   <fx-app-shell storage-key="my-app">
//     <a slot="brand" href="#/">My App</a>
//     <fx-button slot="header-actions" variant="text" icon="settings" aria-label="Settings"></fx-button>
//     <fx-nav slot="nav" label="Main"></fx-nav>
//     <main>…the page…</main>
//   </fx-app-shell>
//
// Attributes:
//   nav-width    the panel's starting width in px (default 256)
//   rail         the panel folded to a 48px rail of icons (reflects); an
//                fx-nav in the panel is told to draw itself as a rail too
//   storage-key  remember the width and the fold in this browser under
//                fx.shell.<key>
//   no-header    no header row
//
// The panel's edge is a separator: drag it, or focus it and use the arrow
// keys (Shift for bigger steps), Home and End; double-click it to go back to
// the starting width. Dragged below the narrowest width it folds to the
// rail. On a narrow screen (under 672px, the md breakpoint) the panel
// is hidden and the header's menu button opens it over the page.
//
// Slots: brand, header-actions, nav, nav-footer, and the default slot for
// the page. Events: fx:nav-resize ({ width, rail }).

import "./fx-button.js";

const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 192;
const MAX_WIDTH = 480;
const RAIL_WIDTH = 48;
const NARROW = "(max-width: 671.98px)";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --fx-shell-header-bg: var(--fx-color-gray-100);
      --fx-shell-header-text: var(--fx-color-gray-10);
      --fx-shell-header-height: 3rem;
      --_nav: ${DEFAULT_WIDTH}px;
      display: grid;
      grid-template-columns: var(--_nav) minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr);
      grid-template-areas: "header header" "nav main";
      height: 100dvh;
      background: var(--fx-background);
      color: var(--fx-text);
    }
    :host([hidden]) { display: none; }
    :host([rail]) { --_nav: ${RAIL_WIDTH}px; }

    header {
      grid-area: header;
      display: flex;
      align-items: center;
      gap: var(--fx-spacing-03);
      height: var(--fx-shell-header-height);
      padding: 0 var(--fx-spacing-03) 0 0;
      background: var(--fx-shell-header-bg);
      color: var(--fx-shell-header-text);
      border-bottom: 1px solid var(--fx-color-gray-80);
    }
    :host([no-header]) header { display: none; }
    :host([no-header]) { grid-template-rows: 0 minmax(0, 1fr); }
    .menu {
      --fx-focus: var(--fx-color-white);
      display: grid;
      place-items: center;
      width: var(--fx-shell-header-height);
      height: var(--fx-shell-header-height);
    }
    .brand { display: flex; align-items: center; min-width: 0; font: 600 var(--fx-font-size-02) var(--fx-font); white-space: nowrap; }
    ::slotted([slot="brand"]) { color: inherit !important; text-decoration: none; }
    .spacer { flex: 1; }
    .actions { display: flex; align-items: center; gap: var(--fx-spacing-02); --fx-focus: var(--fx-color-white); }

    aside {
      grid-area: nav;
      position: relative;
      display: flex;
      flex-direction: column;
      min-width: 0;
      background: var(--fx-layer);
      border-right: 1px solid var(--fx-border);
    }
    .nav-scroll { flex: 1; min-height: 0; overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; }
    .nav-footer { flex: none; border-top: 1px solid var(--fx-border); }
    .nav-footer:not(.has) { display: none; }

    /* The separator: a strip over the panel's edge, a line when hovered,
       focused or dragged. */
    .handle {
      position: absolute;
      top: 0;
      bottom: 0;
      right: -4px;
      z-index: 2;
      width: 8px;
      cursor: col-resize;
      touch-action: none;
      outline: none;
    }
    .handle::after { content: ""; position: absolute; top: 0; bottom: 0; left: 3px; width: 2px; background: transparent; transition: background-color var(--fx-duration-fast-02) var(--fx-easing-standard); }
    .handle:hover::after, :host([resizing]) .handle::after { background: var(--fx-interactive); }
    .handle:focus-visible::after { background: var(--fx-focus); width: 3px; }
    :host([resizing]) { cursor: col-resize; user-select: none; }

    .main { grid-area: main; min-width: 0; min-height: 0; overflow: auto; }

    .scrim { display: none; }

    @media ${NARROW} {
      :host { grid-template-columns: minmax(0, 1fr); grid-template-areas: "header" "main"; }
      aside {
        position: fixed;
        top: var(--fx-shell-header-height);
        bottom: 0;
        left: 0;
        z-index: var(--fx-z-drawer);
        width: min(${DEFAULT_WIDTH}px, 85vw);
        transform: translateX(-100%);
        visibility: hidden;
        transition: transform var(--fx-duration-moderate-02) var(--fx-easing-standard), visibility 0s linear var(--fx-duration-moderate-02);
      }
      :host([mobile-open]) aside { transform: none; visibility: visible; transition-delay: 0s; box-shadow: var(--fx-shadow-lg); }
      .handle { display: none; }
      :host([mobile-open]) .scrim { display: block; position: fixed; inset: var(--fx-shell-header-height) 0 0 0; z-index: calc(var(--fx-z-drawer) - 1); background: var(--fx-overlay); }
    }
  </style>
  <header part="header">
    <fx-button class="menu" variant="text" size="lg" icon="menu" fg-color="var(--fx-shell-header-text)" aria-label="Menu" aria-expanded="true"></fx-button>
    <div class="brand" part="brand"><slot name="brand"></slot></div>
    <div class="spacer"></div>
    <div class="actions" part="header-actions"><slot name="header-actions"></slot></div>
  </header>
  <aside part="nav">
    <div class="nav-scroll"><slot name="nav"></slot></div>
    <div class="nav-footer" part="nav-footer"><slot name="nav-footer"></slot></div>
    <div class="handle" part="handle" role="separator" aria-orientation="vertical" aria-label="Resize navigation" tabindex="0"></div>
  </aside>
  <div class="scrim" part="scrim"></div>
  <div class="main" part="main"><slot></slot></div>
`;

export class FxAppShell extends HTMLElement {
  static observedAttributes = ["rail", "nav-width"];

  #width = DEFAULT_WIDTH;
  #handle;
  #menu;
  #narrow = window.matchMedia(NARROW);

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    this.#handle = this.shadowRoot.querySelector(".handle");
    this.#menu = this.shadowRoot.querySelector(".menu");
    this.#handle.addEventListener("pointerdown", (event) => this.#startDrag(event));
    this.#handle.addEventListener("keydown", (event) => this.#keys(event));
    this.#handle.addEventListener("dblclick", () => this.#set(this.#startWidth(), false));
    this.#menu.addEventListener("click", () => this.toggleNav());
    this.shadowRoot.querySelector(".scrim").addEventListener("click", () => this.removeAttribute("mobile-open"));
    const footer = this.shadowRoot.querySelector('slot[name="nav-footer"]');
    footer.addEventListener("slotchange", () => footer.parentElement.classList.toggle("has", footer.assignedElements().length > 0));
    // A link picked in the panel closes it on a narrow screen.
    this.shadowRoot.querySelector('slot[name="nav"]').addEventListener("click", (event) => {
      if (this.#narrow.matches && event.composedPath().some((node) => node.localName === "a")) this.removeAttribute("mobile-open");
    });
    this.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.hasAttribute("mobile-open")) {
        this.removeAttribute("mobile-open");
        this.#menu.focus();
      }
    });
    this.#narrow.addEventListener("change", () => this.#sync());
  }

  connectedCallback() {
    const saved = this.#load();
    this.#width = this.#clamp(saved?.width ?? this.#startWidth());
    if (saved && typeof saved.rail === "boolean") this.toggleAttribute("rail", saved.rail);
    this.#sync();
  }

  attributeChangedCallback(name) {
    if (name === "nav-width" && !this.#load()) this.#width = this.#clamp(this.#startWidth());
    this.#sync();
  }

  /** The panel's width in px (its open width, even while folded to the rail). */
  get navWidth() {
    return this.#width;
  }
  set navWidth(px) {
    this.#set(px, false);
  }

  get rail() {
    return this.hasAttribute("rail");
  }
  set rail(value) {
    this.#set(this.#width, Boolean(value));
  }

  /** The menu button: the rail on a wide screen, the overlay on a narrow one. */
  toggleNav() {
    if (this.#narrow.matches) this.toggleAttribute("mobile-open");
    else this.#set(this.#width, !this.rail);
    this.#sync();
  }

  #startWidth() {
    return Number(this.getAttribute("nav-width")) || DEFAULT_WIDTH;
  }

  #clamp(px) {
    return Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Number(px) || DEFAULT_WIDTH)));
  }

  get #key() {
    const key = this.getAttribute("storage-key");
    return key ? `fx.shell.${key}` : null;
  }

  #load() {
    if (!this.#key) return null;
    try {
      const saved = JSON.parse(localStorage.getItem(this.#key) ?? "null");
      return saved && typeof saved === "object" ? saved : null;
    } catch {
      return null;
    }
  }

  #set(width, rail) {
    this.#width = this.#clamp(width);
    this.toggleAttribute("rail", rail);
    if (this.#key) {
      try {
        localStorage.setItem(this.#key, JSON.stringify({ width: this.#width, rail }));
      } catch {}
    }
    this.#sync();
    this.dispatchEvent(new CustomEvent("fx:nav-resize", { bubbles: true, composed: true, detail: { width: this.#width, rail } }));
  }

  #sync() {
    const rail = this.rail;
    this.style.setProperty("--_nav", `${rail ? RAIL_WIDTH : this.#width}px`);
    for (const nav of this.querySelectorAll(':scope > [slot="nav"]')) {
      if (nav.localName === "fx-nav") nav.toggleAttribute("rail", rail && !this.#narrow.matches);
    }
    const open = this.#narrow.matches ? this.hasAttribute("mobile-open") : !rail;
    this.#menu.setAttribute("aria-expanded", String(open));
    this.#menu.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    this.#handle.setAttribute("aria-valuemin", String(RAIL_WIDTH));
    this.#handle.setAttribute("aria-valuemax", String(MAX_WIDTH));
    this.#handle.setAttribute("aria-valuenow", String(rail ? RAIL_WIDTH : this.#width));
  }

  #startDrag(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    this.#handle.setPointerCapture(event.pointerId);
    this.toggleAttribute("resizing", true);
    const left = this.shadowRoot.querySelector("aside").getBoundingClientRect().left;
    const move = (e) => {
      const width = e.clientX - left;
      // Pulled well past the narrowest: fold to the rail; back out: unfold.
      if (width < MIN_WIDTH - 48) this.#set(this.#width, true);
      else this.#set(width, false);
    };
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

  #keys(event) {
    const step = event.shiftKey ? 64 : 16;
    const now = this.rail ? RAIL_WIDTH : this.#width;
    if (event.key === "ArrowRight") this.#set(this.rail ? MIN_WIDTH : now + step, false);
    else if (event.key === "ArrowLeft") {
      if (this.rail) return;
      if (now - step < MIN_WIDTH) this.#set(this.#width, true);
      else this.#set(now - step, false);
    } else if (event.key === "Home") this.#set(this.#width, true);
    else if (event.key === "End") this.#set(MAX_WIDTH, false);
    else if (event.key === "Enter") this.#set(this.#width, !this.rail);
    else return;
    event.preventDefault();
  }
}

if (!customElements.get("fx-app-shell")) customElements.define("fx-app-shell", FxAppShell);
