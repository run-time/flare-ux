// <fx-nav>: a side navigation -- links in groups, each group with a heading
// that folds it away. Narrowed to a rail
// it shows each link's icon alone, with its label on hover.
//
//   const nav = document.querySelector("fx-nav");
//   nav.items = [
//     { id: "home", label: "Home", href: "#/", icon: "home" },
//     { heading: "Components", id: "components", items: [
//       { id: "button", label: "Button", href: "#/button" },
//       { id: "dialog", label: "Dialog", href: "#/dialog", badge: { count: 2, tone: "info" } },
//     ] },
//   ];
//   nav.selected = "button";
//
// Properties / attributes:
//   items      links ({ id, label, href, icon?, badge? }) and groups
//              ({ heading, id, items, collapsed? }), one level deep
//   selected   the current link's id (attribute too)
//   rail       icons only (attribute) -- fx-app-shell sets it when narrowed
//   label      the navigation's accessible name
//   filter     a search field above the links (attribute; its value is the
//              placeholder, "Filter" when empty): typing hides the links
//              that do not match and marks the match in those that do;
//              groups open while it filters, and one whose heading matches
//              shows all its links. Down moves into the links, Enter opens
//              the first match, Escape clears it. Hidden in the rail.
//
// Links are real links: a plain click fires `fx:nav-select` ({ id, href })
// and follows the link unless a listener calls preventDefault(). A group's
// fold is remembered for the page in fx.nav.<label>.
//
// Or in markup -- <a> and <fx-nav-group> children -- when there is nothing
// to compute:
//   <fx-nav label="Docs" selected="intro">
//     <a href="#/intro" data-id="intro" data-icon="home">Introduction</a>
//     <fx-nav-group heading="Guides"><a href="#/theming" data-id="theming">Theming</a></fx-nav-group>
//   </fx-nav>

import { escapeHtml } from "../lib/escape.js";
import { toneOf } from "../lib/tones.js";
import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";
import "./fx-text-field.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      font: var(--fx-type-body-compact-01);
      color: var(--fx-text-secondary);
    }
    :host([hidden]) { display: none; }
    nav { display: flex; flex-direction: column; padding: var(--fx-spacing-03) 0; }
    .filter { display: none; padding: var(--fx-spacing-04) var(--fx-spacing-04) var(--fx-spacing-02); }
    :host([filter]:not([rail])) .filter { display: block; }
    .filter fx-text-field { width: 100%; }
    .label mark { border-radius: 2px; background: var(--fx-color-teal-20); color: var(--fx-color-teal-100); }
    .no-match { padding: var(--fx-spacing-03) var(--fx-spacing-05); color: var(--fx-text-secondary); font: var(--fx-type-helper-01); }
    ul { list-style: none; margin: 0; padding: 0; }
    .link, .group-head {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--fx-spacing-04);
      min-height: var(--fx-size-sm);
      padding: 0 var(--fx-spacing-05);
      color: inherit;
      text-decoration: none;
      cursor: pointer;
    }
    .link:hover, .group-head:hover { background: var(--fx-layer-hover); color: var(--fx-text); }
    .link:focus-visible, .group-head:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: -2px; }
    .link[aria-current="page"] { background: var(--fx-layer-selected); color: var(--fx-text); font-weight: 600; }
    /* The selected marker: a bar down the inner edge. */
    .link[aria-current="page"]::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--fx-interactive); }
    .group .link { padding-left: var(--fx-spacing-06); }
    .icon { display: inline-flex; flex: none; }
    .icon svg { width: 1.125rem; height: 1.125rem; }
    .label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .badge {
      flex: none;
      min-width: 1.25rem;
      padding: 0 var(--fx-spacing-02);
      border-radius: var(--fx-radius-pill);
      background: var(--_tone);
      color: var(--_tone-on);
      font: 600 var(--fx-font-size-01) / 1.25rem var(--fx-font);
      text-align: center;
    }
    .group-head {
      all: unset;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: var(--fx-spacing-04);
      width: 100%;
      min-height: var(--fx-size-sm);
      margin-top: var(--fx-spacing-03);
      padding: 0 var(--fx-spacing-05);
      color: var(--fx-text);
      font: var(--fx-type-heading-01);
      cursor: pointer;
    }
    .chevron { width: 1rem; height: 1rem; transition: transform var(--fx-duration-moderate-01) var(--fx-easing-standard); }
    .group-head[aria-expanded="false"] .chevron { transform: rotate(-90deg); }
    .group-head[aria-expanded="false"] + ul { display: none; }

    /* The rail: icons only, centered; groups open, their headings a rule. */
    :host([rail]) .link { justify-content: center; padding: 0; }
    :host([rail]) .label, :host([rail]) .badge, :host([rail]) .chevron, :host([rail]) .group-head .label { display: none; }
    :host([rail]) .group-head { justify-content: center; min-height: 1px; height: 1px; margin: var(--fx-spacing-03) var(--fx-spacing-04); padding: 0; background: var(--fx-border); pointer-events: none; }
    :host([rail]) .group-head[aria-expanded="false"] + ul { display: block; }
    :host([rail]) .link:not(:has(.icon svg))::after { content: attr(data-initial); font-weight: 600; }
  </style>
  <div class="filter" part="filter"><fx-text-field type="search" icon="search" size="sm" block aria-label="Filter the navigation"></fx-text-field></div>
  <nav part="nav"></nav>
`;

export class FxNav extends HTMLElement {
  static observedAttributes = ["selected", "label", "rail", "filter"];

  #items = null;
  #nav;
  // A group's fold, by id, once somebody has folded or opened it.
  #folds = {};
  #observer = new MutationObserver(() => this.#render());
  #query = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    this.#nav = this.shadowRoot.querySelector("nav");
    this.#nav.addEventListener("click", (event) => {
      const head = event.target.closest(".group-head");
      if (head) {
        this.#fold(head.dataset.group);
        return;
      }
      const link = event.target.closest(".link");
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const select = new CustomEvent("fx:nav-select", { bubbles: true, composed: true, cancelable: true, detail: { id: link.dataset.id, href: link.getAttribute("href") } });
      if (!this.dispatchEvent(select)) event.preventDefault();
      else this.selected = link.dataset.id;
    });

    // The filter: typing narrows the links; Down goes into them, Enter
    // opens the first, Escape clears it.
    const field = this.shadowRoot.querySelector(".filter fx-text-field");
    field.addEventListener("input", () => {
      this.#query = field.value.trim().toLowerCase();
      this.#render();
    });
    field.addEventListener("keydown", (event) => {
      const first = this.#nav.querySelector(".link");
      if (event.key === "ArrowDown" && first) {
        event.preventDefault();
        first.focus();
      } else if (event.key === "Enter" && this.#query && first) {
        event.preventDefault();
        first.click();
      } else if (event.key === "Escape" && field.value) {
        event.preventDefault();
        field.value = "";
        this.#query = "";
        this.#render();
      }
    });
    // Up from the first link goes back to the filter.
    this.#nav.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      const links = [...this.#nav.querySelectorAll(".link, .group-head")];
      const at = links.indexOf(this.shadowRoot.activeElement);
      if (at < 0) return;
      event.preventDefault();
      if (event.key === "ArrowUp" && at === 0 && this.hasAttribute("filter")) field.focus();
      else links[Math.min(links.length - 1, Math.max(0, at + (event.key === "ArrowDown" ? 1 : -1)))]?.focus();
    });
  }

  connectedCallback() {
    if (Object.prototype.hasOwnProperty.call(this, "items")) {
      const value = this.items;
      delete this.items;
      this.items = value;
    }
    this.#loadFolds();
    this.#observer.observe(this, { childList: true, subtree: true, attributes: true, characterData: true });
    this.#render();
  }

  disconnectedCallback() {
    this.#observer.disconnect();
  }

  attributeChangedCallback() {
    this.#render();
  }

  get items() {
    return this.#items ?? this.#itemsFromMarkup();
  }
  set items(value) {
    this.#items = Array.isArray(value) ? value : null;
    this.#render();
  }

  get selected() {
    return this.getAttribute("selected") ?? "";
  }
  set selected(value) {
    if (value) this.setAttribute("selected", String(value));
    else this.removeAttribute("selected");
  }

  #itemsFromMarkup() {
    const link = (a) => ({ id: a.dataset.id ?? a.getAttribute("href") ?? "", label: a.textContent.trim(), href: a.getAttribute("href") ?? "", icon: a.dataset.icon });
    return [...this.children].flatMap((child) => {
      if (child.localName === "a") return [link(child)];
      if (child.localName === "fx-nav-group") {
        const heading = child.getAttribute("heading") ?? "";
        return [{ heading, id: child.id || heading, collapsed: child.hasAttribute("collapsed"), items: [...child.querySelectorAll(":scope > a")].map(link) }];
      }
      return [];
    });
  }

  get #storeKey() {
    return `fx.nav.${this.getAttribute("label") ?? "main"}`;
  }

  #loadFolds() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.#storeKey) ?? "null");
      if (saved && typeof saved === "object") this.#folds = saved;
    } catch {}
  }

  #fold(id) {
    const head = this.shadowRoot.querySelector(`.group-head[data-group="${CSS.escape(id)}"]`);
    this.#folds[id] = head?.getAttribute("aria-expanded") === "true";
    try {
      localStorage.setItem(this.#storeKey, JSON.stringify(this.#folds));
    } catch {}
    this.#render();
    this.shadowRoot.querySelector(`.group-head[data-group="${CSS.escape(id)}"]`)?.focus();
  }

  #linkHtml(item) {
    const current = item.id === this.selected;
    const tone = item.badge ? toneOf(item.badge.tone, "info") : "";
    const badge = item.badge?.count ? `<span class="badge" style="--_tone: var(--fx-status-${tone}-fill); --_tone-on: var(--fx-status-${tone}-on)">${escapeHtml(item.badge.count)}</span>` : "";
    return `<li><a class="link" part="link${current ? " link-current" : ""}" href="${escapeHtml(item.href ?? "#")}" data-id="${escapeHtml(item.id)}"
      data-initial="${escapeHtml((item.label ?? "?").slice(0, 1))}" ${current ? 'aria-current="page"' : ""}
      ${this.hasAttribute("rail") ? `title="${escapeHtml(item.label)}" aria-label="${escapeHtml(item.label)}"` : ""}>
      ${item.icon ? `<span class="icon">${iconSvg(item.icon)}</span>` : ""}<span class="label">${this.#marked(item.label ?? "")}</span>${badge}</a></li>`;
  }

  /** A label with what the filter matched in it marked. */
  #marked(text) {
    const at = this.#query ? text.toLowerCase().indexOf(this.#query) : -1;
    if (at < 0) return escapeHtml(text);
    return `${escapeHtml(text.slice(0, at))}<mark>${escapeHtml(text.slice(at, at + this.#query.length))}</mark>${escapeHtml(text.slice(at + this.#query.length))}`;
  }

  /** What the filter leaves: matching links, and groups with any (all of a
   *  group whose heading matches). */
  #filtered(items) {
    const query = this.#query;
    if (!query || !this.hasAttribute("filter")) return items;
    const hits = (text) => String(text ?? "").toLowerCase().includes(query);
    return items
      .map((item) => {
        if (!item.items) return hits(item.label) ? item : null;
        if (hits(item.heading)) return item;
        const children = item.items.filter((child) => hits(child.label));
        return children.length ? { ...item, items: children } : null;
      })
      .filter(Boolean);
  }

  #render() {
    if (!this.#nav) return;
    const placeholder = this.getAttribute("filter");
    this.shadowRoot.querySelector(".filter fx-text-field").setAttribute("placeholder", placeholder || "Filter");
    const focused = this.shadowRoot.activeElement;
    const focusKey = focused?.dataset?.id ?? focused?.dataset?.group;
    this.#nav.setAttribute("aria-label", this.getAttribute("label") ?? "Main");
    const filtering = Boolean(this.#query) && this.hasAttribute("filter");
    const items = this.#filtered(this.items ?? []);
    let group = 0;
    this.#nav.innerHTML = `<ul>${items
      .map((item) => {
        if (!item.items) return this.#linkHtml(item);
        const id = item.id ?? `group-${++group}`;
        // While filtering every group is open, so a match is never hidden.
        const folded = !filtering && (this.#folds[id] ?? Boolean(item.collapsed));
        return `<li class="group"><button type="button" class="group-head" part="group-heading" data-group="${escapeHtml(id)}" aria-expanded="${!folded}">
          <span class="label">${this.#marked(item.heading ?? "")}</span>${iconSvg("chevron-down", { className: "chevron" })}</button>
          <ul>${item.items.map((child) => this.#linkHtml(child)).join("")}</ul></li>`;
      })
      .join("")}</ul>${filtering && !items.length ? `<p class="no-match" role="status">Nothing matches “${escapeHtml(this.#query)}”</p>` : ""}`;
    if (focusKey) this.#nav.querySelector(`[data-id="${CSS.escape(focusKey)}"], [data-group="${CSS.escape(focusKey)}"]`)?.focus();
  }
}

if (!customElements.get("fx-nav")) customElements.define("fx-nav", FxNav);
if (!customElements.get("fx-nav-group")) {
  customElements.define(
    "fx-nav-group",
    class extends HTMLElement {
      connectedCallback() {
        this.hidden = true;
      }
    },
  );
}
