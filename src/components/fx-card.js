// <fx-card>: a box that groups one thing -- a repository, a run, a setting.
// An optional header (heading, a line under it, actions), the content, and
// an optional footer.
//
//   <fx-card heading="factory-ui" subheading="main · 3 open PRs">
//     <fx-button slot="actions" variant="text" icon="external" aria-label="Open"></fx-button>
//     …the content…
//     <fx-button slot="footer" variant="text">View runs</fx-button>
//   </fx-card>
//
//   <fx-card href="#/repos/atlas">…</fx-card>      the whole card is a link
//
// Attributes:
//   heading, subheading   the header's two lines (or use the header slot)
//   variant   outlined (default: a border) | elevated (a shadow) | filled
//             (the alternate layer, no border)
//   href      the whole card goes there; it lifts on hover
//   padding   none | sm | md (default) -- around the content
//   tone      a status tone: a bar down its left edge in that color
//
// Slots: header (in place of heading / subheading), actions (end of the
// header), the default (content), footer.

import { escapeHtml } from "../lib/escape.js";
import { toneCss } from "../lib/tones.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --_pad: var(--fx-spacing-05);
      --_edge: transparent;
      display: block;
      min-width: 0;
      color: var(--fx-text);
      font: var(--fx-type-body-01);
    }
    :host([hidden]) { display: none; }
    ${toneCss(':host([tone="&"])')}
    :host([tone]) { --_edge: var(--_tone); }
    :host([padding="none"]) { --_pad: 0; }
    :host([padding="sm"]) { --_pad: var(--fx-spacing-04); }
    .card {
      position: relative;
      display: flex;
      flex-direction: column;
      height: 100%;
      box-sizing: border-box;
      overflow: hidden;
      border: 1px solid var(--fx-border);
      border-left: 3px solid var(--_edge);
      border-radius: var(--fx-radius-lg);
      background: var(--fx-layer);
      color: inherit;
      text-decoration: none;
      transition: box-shadow var(--fx-duration-fast-02) var(--fx-easing-standard), border-color var(--fx-duration-fast-02) var(--fx-easing-standard);
    }
    :host(:not([tone])) .card { border-left-width: 1px; border-left-color: var(--fx-border); }
    :host([variant="elevated"]) .card { border-color: transparent; box-shadow: var(--fx-shadow-sm); }
    :host([variant="filled"]) .card { border-color: transparent; background: var(--fx-layer-alt); }
    /* A tone's bar shows whatever the variant does to the border. */
    :host([tone]) .card { border-left-color: var(--_edge); }
    a.card { cursor: pointer; }
    a.card:hover { border-color: var(--fx-border-strong); box-shadow: var(--fx-shadow); }
    a.card:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: 2px; }
    .head { display: flex; align-items: flex-start; gap: var(--fx-spacing-03); padding: var(--_pad) var(--_pad) 0; }
    :host([padding="none"]) .head { padding: var(--fx-spacing-05) var(--fx-spacing-05) 0; }
    .head[hidden] { display: none; }
    .titles { flex: 1; min-width: 0; }
    .heading { margin: 0; font: var(--fx-type-heading-02); overflow-wrap: anywhere; }
    .sub { margin: var(--fx-spacing-01) 0 0; color: var(--fx-text-secondary); font: var(--fx-type-helper-01); }
    .heading:empty, .sub:empty { display: none; }
    .actions { display: inline-flex; align-items: center; gap: var(--fx-spacing-02); flex: none; margin: calc(-1 * var(--fx-spacing-02)) calc(-1 * var(--fx-spacing-02)) 0 0; }
    .body { flex: 1; padding: var(--_pad); }
    .foot { display: flex; flex-wrap: wrap; align-items: center; gap: var(--fx-spacing-03); padding: var(--fx-spacing-03) var(--_pad); border-top: 1px solid var(--fx-border); }
    :host([padding="none"]) .foot { padding: var(--fx-spacing-03) var(--fx-spacing-05); }
    .foot[hidden] { display: none; }
  </style>
`;

const inner = `
  <div class="head" part="header">
    <div class="titles"><slot name="header"><p class="heading" part="heading" role="heading" aria-level="3"></p><p class="sub" part="subheading"></p></slot></div>
    <span class="actions" part="actions"><slot name="actions"></slot></span>
  </div>
  <div class="body" part="body"><slot></slot></div>
  <div class="foot" part="footer"><slot name="footer"></slot></div>
`;

export class FxCard extends HTMLElement {
  static observedAttributes = ["heading", "subheading", "href"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  #render() {
    const root = this.shadowRoot;
    const href = this.getAttribute("href");
    let card = root.querySelector(".card");
    const wantTag = href ? "a" : "div";
    if (!card || card.localName !== wantTag) {
      card?.remove();
      card = document.createElement(wantTag);
      card.className = "card";
      card.setAttribute("part", "card");
      card.innerHTML = inner;
      root.append(card);
      card.addEventListener("slotchange", () => this.#render());
    }
    if (href) card.setAttribute("href", href);
    root.querySelector(".heading").innerHTML = escapeHtml(this.getAttribute("heading") ?? "");
    root.querySelector(".sub").innerHTML = escapeHtml(this.getAttribute("subheading") ?? "");
    // The header and footer show only when there is something in them.
    const has = (slot) => Boolean(this.querySelector(`:scope > [slot="${slot}"]`));
    root.querySelector(".head").hidden = !this.getAttribute("heading") && !this.getAttribute("subheading") && !has("header") && !has("actions");
    root.querySelector(".foot").hidden = !has("footer");
  }
}

if (!customElements.get("fx-card")) customElements.define("fx-card", FxCard);
