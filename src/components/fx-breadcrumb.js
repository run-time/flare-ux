// <fx-breadcrumb>: where the page sits -- each level up as a link, the page
// itself last, not a link.
//
//   <fx-breadcrumb>
//     <a href="#/">Factory</a>
//     <a href="#/runs">Runs</a>
//     <span>Run 42</span>
//   </fx-breadcrumb>
//
//   breadcrumb.items = [{ label: "Factory", href: "#/" }, { label: "Run 42" }];
//
// Its children are the levels, read live: an <a> is a level to go to,
// anything else the current page. Or set `items` ([{ label, href? }]).
//
// Attributes:
//   max     the most levels to show; past it the middle ones fold into
//           "…", which opens them (default: show all)
//   label   what the trail is called, for assistive technology
//           (default "Breadcrumb")
//
// A <nav> with an ordered list; the last level has aria-current="page".

import { escapeHtml } from "../lib/escape.js";
import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host { display: block; min-width: 0; font: var(--fx-type-body-compact-01); color: var(--fx-text-secondary); }
    :host([hidden]) { display: none; }
    ol { display: flex; flex-wrap: wrap; align-items: center; gap: var(--fx-spacing-02); margin: 0; padding: 0; list-style: none; }
    li { display: inline-flex; align-items: center; gap: var(--fx-spacing-02); min-width: 0; }
    .sep { display: inline-flex; flex: none; color: var(--fx-text-placeholder); }
    .sep svg { width: 0.875rem; height: 0.875rem; }
    a, .more {
      all: unset;
      max-width: 16rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      border-radius: var(--fx-radius-sm);
      color: var(--fx-link);
      cursor: pointer;
    }
    a:hover, .more:hover { color: var(--fx-link-hover); text-decoration: underline; }
    a:focus-visible, .more:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: 2px; }
    .more { padding: 0 var(--fx-spacing-02); text-decoration: none; letter-spacing: 0.1em; }
    [aria-current] { max-width: 24rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--fx-text); font-weight: 600; }
  </style>
  <nav part="nav"><ol part="list"></ol></nav>
  <slot hidden></slot>
`;

export class FxBreadcrumb extends HTMLElement {
  static observedAttributes = ["max", "label"];

  #items = null;
  #expanded = false;
  #observer = new MutationObserver(() => this.#render());

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    this.shadowRoot.querySelector("ol").addEventListener("click", (event) => {
      if (!event.target.closest(".more")) return;
      this.#expanded = true;
      this.#render();
      this.shadowRoot.querySelector("li:nth-child(2) a")?.focus();
    });
  }

  connectedCallback() {
    this.#observer.observe(this, { childList: true, subtree: true, characterData: true, attributes: true });
    this.#render();
  }

  disconnectedCallback() {
    this.#observer.disconnect();
  }

  attributeChangedCallback() {
    this.#render();
  }

  /** The levels: [{ label, href }] -- from `items`, or read from the children. */
  get items() {
    if (this.#items) return this.#items;
    return [...this.children].map((child) => ({
      label: child.textContent.trim(),
      href: child.localName === "a" ? child.getAttribute("href") : null,
    }));
  }
  set items(items) {
    this.#items = Array.isArray(items) ? items : null;
    this.#expanded = false;
    this.#render();
  }

  #render() {
    const list = this.shadowRoot.querySelector("ol");
    this.shadowRoot.querySelector("nav").setAttribute("aria-label", this.getAttribute("label") || "Breadcrumb");
    const items = this.items.filter((item) => item.label);
    const max = Number(this.getAttribute("max"));
    // Folded: the first level, "…", then the last max - 1 levels.
    const fold = !this.#expanded && max >= 2 && items.length > max;
    const shown = fold ? [items[0], { more: items.length - max }, ...items.slice(items.length - (max - 1))] : items;
    const sep = `<span class="sep" aria-hidden="true">${iconSvg("chevron-right")}</span>`;
    list.innerHTML = shown
      .map((item, index) => {
        const last = index === shown.length - 1;
        const body = item.more
          ? `<button type="button" class="more" aria-label="Show ${item.more} more">…</button>`
          : last || !item.href
            ? `<span${last ? ' aria-current="page"' : ""}>${escapeHtml(item.label)}</span>`
            : `<a href="${escapeHtml(item.href)}" part="link">${escapeHtml(item.label)}</a>`;
        return `<li>${body}${last ? "" : sep}</li>`;
      })
      .join("");
  }
}

if (!customElements.get("fx-breadcrumb")) customElements.define("fx-breadcrumb", FxBreadcrumb);
