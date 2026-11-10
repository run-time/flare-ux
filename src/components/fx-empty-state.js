// <fx-empty-state>: what a page, a panel or a table shows when there is
// nothing in it -- an icon, a heading, a line on why, and what to do next.
//
//   <fx-empty-state icon="file" heading="No prompts yet">
//     Add one with the + above the list.
//     <fx-button slot="actions" variant="filled" icon="plus">New prompt</fx-button>
//   </fx-empty-state>
//
// Attributes:
//   heading   the first line
//   icon      an icon name, drawn large in a soft circle (default inbox-like
//             "folder"; none="" for no icon)
//   size      sm (inside a card or a table) | md (default, a page)
//   tone      a status tone for the icon's circle -- error for a load that
//             failed, success for "all done"
//
// Slots: the default (the explanation) and actions (buttons).

import { escapeHtml } from "../lib/escape.js";
import { toneCss } from "../lib/tones.js";
import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --_tone-bg: var(--fx-layer-alt);
      --_tone-text: var(--fx-text-secondary);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--fx-spacing-03);
      padding: var(--fx-spacing-09) var(--fx-spacing-06);
      text-align: center;
      color: var(--fx-text-secondary);
      font: var(--fx-type-body-01);
    }
    :host([hidden]) { display: none; }
    ${toneCss(':host([tone="&"])')}
    :host([size="sm"]) { padding: var(--fx-spacing-06) var(--fx-spacing-05); gap: var(--fx-spacing-02); }
    .icon { display: grid; place-items: center; width: 4rem; height: 4rem; margin-bottom: var(--fx-spacing-03); border-radius: 50%; background: var(--_tone-bg); color: var(--_tone-text); }
    .icon svg { width: 2rem; height: 2rem; }
    .icon:empty { display: none; }
    :host([size="sm"]) .icon { width: 2.75rem; height: 2.75rem; margin-bottom: var(--fx-spacing-02); }
    :host([size="sm"]) .icon svg { width: 1.375rem; height: 1.375rem; }
    .heading { margin: 0; color: var(--fx-text); font: var(--fx-type-heading-03); }
    :host([size="sm"]) .heading { font: var(--fx-type-heading-02); }
    .heading:empty { display: none; }
    .body { max-width: 32rem; }
    .actions { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--fx-spacing-03); margin-top: var(--fx-spacing-04); }
    .actions:not(:has(*)) { display: none; }
  </style>
  <div class="icon" part="icon" aria-hidden="true"></div>
  <p class="heading" part="heading" role="heading" aria-level="2"></p>
  <div class="body" part="body"><slot></slot></div>
  <div class="actions" part="actions"><slot name="actions"></slot></div>
`;

export class FxEmptyState extends HTMLElement {
  static observedAttributes = ["heading", "icon"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    this.shadowRoot.querySelector('slot[name="actions"]').addEventListener("slotchange", (event) => {
      this.shadowRoot.querySelector(".actions").hidden = event.target.assignedElements().length === 0;
    });
  }

  connectedCallback() {
    this.#render();
    this.shadowRoot.querySelector(".actions").hidden = !this.querySelector('[slot="actions"]');
  }

  attributeChangedCallback() {
    this.#render();
  }

  #render() {
    const root = this.shadowRoot;
    root.querySelector(".heading").innerHTML = escapeHtml(this.getAttribute("heading") ?? "");
    const icon = this.hasAttribute("icon") ? this.getAttribute("icon") : "folder";
    root.querySelector(".icon").innerHTML = icon ? iconSvg(icon) : "";
  }
}

if (!customElements.get("fx-empty-state")) customElements.define("fx-empty-state", FxEmptyState);
