// <fx-accordion>: a section that opens and shuts -- a header with a chevron
// in front, and the content under it. Stack them for a list of sections;
// nest them for groups of cards.
//
//   <fx-accordion open>
//     <span slot="header">Build <fx-count-badge>3</fx-count-badge></span>
//     <fx-button slot="actions" variant="text" icon="refresh" aria-label="Rerun"></fx-button>
//     …the content…
//   </fx-accordion>
//
// Slots: header (the title, and counts or chips beside it -- nothing
// clickable), actions (buttons and links at the end of the header row,
// which do their own thing and never open or shut it), and the content.
//
// Attributes:
//   open         showing its content
//   name         one open at a time among accordions with the same name
//   cycle        a group of nested accordions, cycled as one: a click opens
//                it; again, with its cards folded, opens every card; again
//                shuts it -- and shutting a group whose cards were all open
//                folds them, ready for next time. Its chevron sits halfway
//                while it is open with every card folded.
//   storage-key  remember open / shut in this browser (localStorage
//                fx.accordion.<key>)
//   variant      plain (default: rules between sections) | card (a box)
//   disabled
//
// Events: fx:toggle ({ open }) after it opens or shuts (bubbles: a group
// hears its cards). Methods: show(), hide(), toggle().
//
// The header is a button with aria-expanded; the content is a region named
// by it, and inert while shut so nothing in it takes focus.

import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";

let uid = 0;

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host { display: block; border-bottom: 1px solid var(--fx-border); color: var(--fx-text); }
    :host([hidden]) { display: none; }
    :host([variant="card"]) { border: 1px solid var(--fx-border); border-radius: var(--fx-radius); background: var(--fx-layer); }
    .head {
      display: flex;
      align-items: center;
      gap: var(--fx-spacing-03);
      min-height: var(--fx-size-md);
      padding: 0 var(--fx-spacing-04) 0 var(--fx-spacing-03);
      cursor: pointer;
    }
    .head:hover { background: var(--fx-layer-hover); }
    :host([variant="card"]) .head { border-radius: var(--fx-radius); }
    :host([disabled]) .head { cursor: not-allowed; color: var(--fx-text-disabled); background: none; }
    .toggle {
      all: unset;
      flex: 1;
      display: flex;
      align-items: center;
      gap: var(--fx-spacing-03);
      min-width: 0;
      min-height: var(--fx-size-md);
      font: var(--fx-type-heading-01);
      cursor: inherit;
    }
    .toggle:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: -2px; border-radius: var(--fx-radius-sm); }
    .title { display: flex; flex-wrap: wrap; align-items: center; gap: var(--fx-spacing-03); min-width: 0; }
    .chevron { display: inline-flex; flex: none; color: var(--fx-text-secondary); transition: transform var(--fx-duration-moderate-01) var(--fx-easing-standard); }
    .chevron svg { width: 1rem; height: 1rem; }
    :host([open]) .chevron { transform: rotate(90deg); }
    :host([open][partial]) .chevron { transform: rotate(45deg); }
    .actions { display: inline-flex; align-items: center; gap: var(--fx-spacing-02); flex: none; cursor: default; }

    /* The content slides open: its row grows from nothing to its height. */
    .body {
      display: grid;
      grid-template-rows: 0fr;
      visibility: hidden;
      transition: grid-template-rows var(--fx-duration-moderate-02) var(--fx-easing-standard), visibility 0s linear var(--fx-duration-moderate-02);
    }
    :host([open]) .body { grid-template-rows: 1fr; visibility: visible; transition-delay: 0s; }
    .inner { min-height: 0; overflow: hidden; }
    .content { padding: var(--fx-spacing-02) var(--fx-spacing-04) var(--fx-spacing-05) calc(var(--fx-spacing-03) + 1rem + var(--fx-spacing-03)); }
  </style>
  <div class="head" part="header">
    <button type="button" class="toggle" part="toggle" aria-expanded="false">
      <span class="chevron" aria-hidden="true"></span>
      <span class="title"><slot name="header"></slot></span>
    </button>
    <span class="actions" part="actions"><slot name="actions"></slot></span>
  </div>
  <div class="body" role="region" part="body">
    <div class="inner"><div class="content" part="content"><slot></slot></div></div>
  </div>
`;

export class FxAccordion extends HTMLElement {
  static observedAttributes = ["open", "disabled"];

  #id = `fx-accordion-${++uid}`;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.appendChild(template.content.cloneNode(true));
    root.querySelector(".chevron").innerHTML = iconSvg("chevron-right");
    const toggle = root.querySelector(".toggle");
    const body = root.querySelector(".body");
    toggle.id = `${this.#id}-header`;
    body.id = `${this.#id}-body`;
    toggle.setAttribute("aria-controls", body.id);
    body.setAttribute("aria-labelledby", toggle.id);

    // The whole header row opens and shuts it -- except its actions.
    root.querySelector(".head").addEventListener("click", (event) => {
      if (event.composedPath().some((node) => node.classList?.contains("actions"))) return;
      this.#activate();
    });
    // A card opening or shutting inside a group moves the group's chevron.
    this.addEventListener("fx:toggle", (event) => {
      if (event.target !== this) this.#markPartial();
    });
  }

  connectedCallback() {
    const key = this.getAttribute("storage-key");
    if (key) {
      try {
        const saved = localStorage.getItem(`fx.accordion.${key}`);
        if (saved !== null) this.toggleAttribute("open", saved === "1");
      } catch {}
    }
    this.#sync();
    this.#markPartial();
  }

  attributeChangedCallback(name) {
    this.#sync();
    if (name === "open" && this.open && this.getAttribute("name")) this.#closeSiblings();
  }

  get open() {
    return this.hasAttribute("open");
  }
  set open(value) {
    this.#set(Boolean(value));
  }

  show() {
    this.#set(true);
  }
  hide() {
    this.#set(false);
  }
  toggle() {
    this.#set(!this.open);
  }

  // ----------------------------------------------------------- behavior

  #set(open) {
    if (open === this.open) return;
    this.toggleAttribute("open", open);
    const key = this.getAttribute("storage-key");
    if (key) {
      try {
        localStorage.setItem(`fx.accordion.${key}`, open ? "1" : "0");
      } catch {}
    }
    this.dispatchEvent(new CustomEvent("fx:toggle", { bubbles: true, detail: { open } }));
    this.#markPartial();
  }

  /** A click on the header: a plain toggle, or a group's three-step cycle. */
  #activate() {
    if (this.hasAttribute("disabled")) return;
    const cards = this.#cards();
    if (!this.hasAttribute("cycle") || cards.length === 0) {
      this.toggle();
      return;
    }
    const allShut = cards.every((card) => !card.open);
    const allOpen = cards.every((card) => card.open);
    if (!this.open) this.#set(true);
    else if (allShut) cards.forEach((card) => card.show());
    else {
      this.#set(false);
      // Shutting a fully open group folds its cards for next time; a mix
      // is kept as it was.
      if (allOpen) cards.forEach((card) => card.hide());
    }
    this.#markPartial();
  }

  /** The accordions directly inside this one (not inside a nested one). */
  #cards() {
    return [...this.querySelectorAll("fx-accordion")].filter((card) => card.parentElement?.closest("fx-accordion") === this);
  }

  #markPartial() {
    const cards = this.hasAttribute("cycle") ? this.#cards() : [];
    this.toggleAttribute("partial", this.open && cards.length > 0 && cards.every((card) => !card.open));
  }

  #closeSiblings() {
    const name = this.getAttribute("name");
    const scope = this.parentNode ?? document;
    for (const other of scope.querySelectorAll(`fx-accordion[name="${CSS.escape(name)}"]`)) {
      if (other !== this && other.open) other.hide();
    }
  }

  #sync() {
    const root = this.shadowRoot;
    const toggle = root.querySelector(".toggle");
    toggle.setAttribute("aria-expanded", String(this.open));
    toggle.toggleAttribute("disabled", this.hasAttribute("disabled"));
    root.querySelector(".inner").inert = !this.open;
  }
}

if (!customElements.get("fx-accordion")) customElements.define("fx-accordion", FxAccordion);
