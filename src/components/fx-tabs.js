// <fx-tabs>: Material 3 primary tabs -- a row of labels with an underline
// under the selected one -- for switching between the views of one place.
//
//   const tabs = document.createElement("fx-tabs");
//   tabs.tabs = [
//     { id: "overview", label: "Overview", href: "#overview" },
//     { id: "runs", label: "Runs", href: "#runs", badges: [{ count: 2, tone: "error", title: "2 failed" }] },
//   ];
//   tabs.selected = "overview";
//   tabs.addEventListener("fx:tab-select", (event) => show(event.detail.id));
//
// Properties / attributes:
//   tabs       [{ id, label, href?, badges?: [{ count, tone, title }], disabled? }]
//   selected   the selected tab's id (attribute too)
//   label      what the row is called, for assistive technology (aria-label)
//
// Or in markup, as fx-segmented-button takes its options -- <fx-option>
// children with value, href, the label inside, and data-badge /
// data-badge-tone for a count:
//   <fx-tabs selected="steps"><fx-option value="details">Details</fx-option>
//     <fx-option value="steps" data-badge="5">Steps</fx-option></fx-tabs>
// A `tabs` property set from code wins over the children.
//
// A tab with an href is a real link, so it can be middle-clicked or opened
// in a new window; a plain click is the page's to handle: it fires
// `fx:tab-select` ({ id }) and is canceled, unless a listener calls
// event.preventDefault() on fx:tab-select to let the link follow.
// Keyboard: Left/Right move between tabs, Home/End to the ends, Enter or
// Space selects. Badge tones: any status tone -- error, incomplete, warning,
// success, info (the default), neutral -- or its other name (fail, pause…).

import { escapeHtml } from "../lib/escape.js";
import { toneCss, toneOf } from "../lib/tones.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --fx-tabs-color: var(--fx-interactive-text);
      display: block;
      box-sizing: border-box !important;
    }
    :host([hidden]) { display: none; }
    .list {
      display: flex;
      gap: 0.25rem;
      overflow-x: auto;
      scrollbar-width: none;
      border-bottom: 1px solid var(--fx-border);
    }
    .list::-webkit-scrollbar { display: none; }
    .tab {
      position: relative;
      display: inline-flex;
      flex: none;
      align-items: center;
      gap: 0.4rem;
      min-height: var(--fx-size-md);
      padding: 0 var(--fx-spacing-05);
      border-radius: 6px 6px 0 0;
      color: var(--fx-text-secondary);
      font: 400 var(--fx-font-size-02) var(--fx-font);
      text-decoration: none;
      white-space: nowrap;
      cursor: pointer;
      outline: none;
      transition: color var(--fx-duration-fast-02) var(--fx-easing-standard), background-color var(--fx-duration-fast-02) var(--fx-easing-standard);
    }
    .tab:hover { color: var(--fx-text); background: color-mix(in srgb, var(--fx-tabs-color) 7%, transparent); }
    .tab:focus-visible { box-shadow: inset 0 0 0 2px var(--fx-focus); }
    .tab[aria-selected="true"] { color: var(--fx-tabs-color); }
    /* The selected tab's indicator: a bar on the row's line, rounded on top. */
    .tab[aria-selected="true"]::after {
      content: "";
      position: absolute;
      left: 0.5rem;
      right: 0.5rem;
      bottom: -1px;
      height: 3px;
      border-radius: 3px 3px 0 0;
      background: var(--fx-tabs-color);
    }
    .tab[aria-disabled="true"] { opacity: 0.5; cursor: default; pointer-events: none; }
    .badge {
      display: inline-grid;
      place-items: center;
      min-width: 1.1rem;
      height: 1.1rem;
      padding: 0 var(--fx-spacing-02);
      box-sizing: border-box;
      border-radius: 999px;
      font: 600 var(--fx-font-size-01)/1 var(--fx-font);
      font-variant-numeric: tabular-nums;
      color: var(--fx-status-info-on);
      background: var(--fx-status-info);
    }
    ${toneCss(".badge.tone-&")}
    .badge { background: var(--_tone-fill, var(--_tone, var(--fx-status-info-fill))); color: var(--_tone-on, var(--fx-status-info-on)); }
  </style>
  <nav class="list" role="tablist" part="list"></nav>
`;

export class FxTabs extends HTMLElement {
  static observedAttributes = ["selected", "label"];

  #tabs = [];
  #list;

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    this.#list = this.shadowRoot.querySelector(".list");
    this.#list.addEventListener("click", (event) => {
      const tab = event.target.closest(".tab");
      if (!tab || tab.getAttribute("aria-disabled") === "true") return;
      // A new window or tab: the link's own job.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (this.#select(tab.dataset.id)) event.preventDefault();
    });
    this.#list.addEventListener("keydown", (event) => this.#keys(event));
  }

  #observer = new MutationObserver(() => this.#render());

  disconnectedCallback() {
    this.#observer.disconnect();
  }

  connectedCallback() {
    this.#observer.observe(this, { childList: true, subtree: true, characterData: true, attributes: true });
    // A property set before the element was upgraded sits on the instance
    // and hides the setter: take it off and set it through the setter.
    for (const name of ["tabs", "selected"]) {
      if (Object.prototype.hasOwnProperty.call(this, name)) {
        const value = this[name];
        delete this[name];
        this[name] = value;
      }
    }
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  get tabs() {
    if (this.#tabs.length || !this.querySelector(":scope > fx-option")) return this.#tabs;
    return [...this.querySelectorAll(":scope > fx-option")].map((option) => ({
      id: option.getAttribute("value") ?? "",
      label: option.textContent.trim(),
      href: option.getAttribute("href") ?? undefined,
      disabled: option.hasAttribute("disabled"),
      badges: option.dataset.badge ? [{ count: Number(option.dataset.badge), tone: option.dataset.badgeTone ?? "info" }] : [],
    }));
  }
  set tabs(value) {
    this.#tabs = Array.isArray(value) ? value : [];
    this.#render();
  }

  get selected() {
    return this.getAttribute("selected") ?? "";
  }
  set selected(value) {
    if (value === null || value === undefined || value === "") this.removeAttribute("selected");
    else this.setAttribute("selected", String(value));
  }

  /** Fire fx:tab-select; true when the page took it (the link should not follow). */
  #select(id) {
    const event = new CustomEvent("fx:tab-select", { bubbles: true, composed: true, cancelable: true, detail: { id } });
    const handled = this.dispatchEvent(event);
    if (handled) this.selected = id;
    return handled;
  }

  #keys(event) {
    const tabs = [...this.#list.querySelectorAll('.tab:not([aria-disabled="true"])')];
    const index = tabs.indexOf(this.shadowRoot.activeElement);
    if (index < 0) return;
    const to = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }[event.key];
    if (to !== undefined) {
      event.preventDefault();
      const next = tabs[(to + tabs.length) % tabs.length];
      next.focus();
      this.#reveal(next);
    } else if (event.key === " " || (event.key === "Enter" && !tabs[index].hasAttribute("href"))) {
      event.preventDefault();
      this.#select(tabs[index].dataset.id);
    }
    // Enter on a link: the browser clicks it, and the click handler selects.
  }

  #reveal(tab) {
    if (!tab) return;
    const list = this.#list;
    if (tab.offsetLeft < list.scrollLeft) list.scrollLeft = tab.offsetLeft;
    else if (tab.offsetLeft + tab.offsetWidth > list.scrollLeft + list.clientWidth) list.scrollLeft = tab.offsetLeft + tab.offsetWidth - list.clientWidth;
  }

  #render() {
    if (!this.#list) return;
    const focusedId = this.shadowRoot.activeElement?.dataset?.id;
    const selected = this.selected;
    const label = this.getAttribute("label");
    if (label) this.#list.setAttribute("aria-label", label);
    else this.#list.removeAttribute("aria-label");
    this.#list.innerHTML = this.tabs
      .map((tab) => {
        const on = tab.id === selected;
        const badges = (tab.badges ?? [])
          .filter((badge) => badge?.count > 0)
          .map((badge) => `<span class="badge tone-${toneOf(badge.tone, "info")}"${badge.title ? ` title="${escapeHtml(badge.title)}"` : ""}>${escapeHtml(String(badge.count))}</span>`)
          .join("");
        const said = (tab.badges ?? []).filter((badge) => badge?.count > 0 && badge.title).map((badge) => badge.title).join(", ");
        const tag = tab.href ? "a" : "span";
        return `<${tag} class="tab" part="tab${on ? " tab-selected" : ""}" role="tab" data-id="${escapeHtml(tab.id)}"
          ${tab.href ? `href="${escapeHtml(tab.href)}"` : ""}
          aria-selected="${on}" tabindex="${on ? 0 : -1}"
          ${tab.disabled ? 'aria-disabled="true"' : ""}
          ${said ? `aria-label="${escapeHtml(`${tab.label}, ${said}`)}"` : ""}>${escapeHtml(tab.label)}${badges}</${tag}>`;
      })
      .join("");
    // No tab selected: the first takes the Tab stop.
    if (!this.tabs.some((tab) => tab.id === selected)) this.#list.querySelector(".tab")?.setAttribute("tabindex", "0");
    if (focusedId) this.#list.querySelector(`.tab[data-id="${CSS.escape(focusedId)}"]`)?.focus();
    // Keep the selected tab in view on a narrow screen -- sideways only, so
    // a redraw never scrolls the page.
    this.#reveal(this.#list.querySelector('.tab[aria-selected="true"]'));
  }
}

if (!customElements.get("fx-tabs")) {
  customElements.define("fx-tabs", FxTabs);
}
