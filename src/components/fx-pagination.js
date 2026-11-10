// <fx-pagination>: moving through a long list a page at a time -- which
// rows are showing, previous / next, the pages by number, and how many to a
// page.
//
//   <fx-pagination total="340" page-size="25"></fx-pagination>
//   pagination.addEventListener("fx:page", (e) => show(e.detail.page, e.detail.pageSize));
//
// Attributes:
//   total       how many items in all
//   page        the page showing, from 1 (default 1)
//   page-size   items to a page (default 25)
//   page-sizes  the choices for page-size, comma-separated ("10,25,50,100");
//               empty hides the chooser
//   label       what the list is called (default "Pagination")
//   compact     previous / next and "Page 3 of 14" only, no page numbers
//
// Events: fx:page ({ page, pageSize, start, end }) whenever the page or the
// page size changes -- start and end are 0-based indexes for slice(). A new
// page size goes back to the page holding the first row that was showing.
//
// Properties: page, pageSize, total, pageCount, start, end.

import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";
import "./fx-select.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--fx-spacing-03) var(--fx-spacing-06);
      font: var(--fx-type-body-compact-01);
      color: var(--fx-text);
    }
    :host([hidden]) { display: none; }
    .range { color: var(--fx-text-secondary); font-variant-numeric: tabular-nums; }
    .size { display: inline-flex; align-items: center; gap: var(--fx-spacing-03); color: var(--fx-text-secondary); }
    .size[hidden] { display: none; }
    .left { display: flex; flex-wrap: wrap; align-items: center; gap: var(--fx-spacing-03) var(--fx-spacing-06); }
    nav ol { display: flex; align-items: center; gap: var(--fx-spacing-01); margin: 0; padding: 0; list-style: none; }
    button {
      all: unset;
      box-sizing: border-box;
      display: inline-grid;
      place-items: center;
      min-width: var(--fx-size-sm);
      height: var(--fx-size-sm);
      padding: 0 var(--fx-spacing-03);
      border-radius: var(--fx-radius);
      color: var(--fx-text);
      font-variant-numeric: tabular-nums;
      cursor: pointer;
    }
    button:hover:not(:disabled) { background: var(--fx-layer-hover); }
    button:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: 1px; }
    button:disabled { color: var(--fx-text-disabled); cursor: default; }
    button[aria-current] { background: var(--fx-interactive); color: var(--fx-text-on-color); font-weight: 600; }
    button svg { width: 1rem; height: 1rem; }
    .gap { display: inline-grid; place-items: center; min-width: var(--fx-size-sm); color: var(--fx-text-secondary); }
    .of { padding: 0 var(--fx-spacing-03); color: var(--fx-text-secondary); white-space: nowrap; }
  </style>
  <div class="left">
    <span class="range" part="range" aria-live="polite"></span>
    <label class="size" part="page-size">Per page <fx-select size="sm" aria-label="Items per page"></fx-select></label>
  </div>
  <nav part="nav"><ol></ol></nav>
`;

export class FxPagination extends HTMLElement {
  static observedAttributes = ["total", "page", "page-size", "page-sizes", "label", "compact"];

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.appendChild(template.content.cloneNode(true));
    root.querySelector("ol").addEventListener("click", (event) => {
      const button = event.target.closest("button[data-page]");
      if (button && !button.disabled) this.#go(Number(button.dataset.page), true);
    });
    root.querySelector("fx-select").addEventListener("change", (event) => {
      // Keep the first row showing on the page it lands on.
      const first = this.start;
      const size = Number(event.target.value);
      this.setAttribute("page-size", String(size));
      this.#go(Math.floor(first / size) + 1, false, true);
    });
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  // ------------------------------------------------------------- numbers

  #number(name, fallback, min = 0) {
    const value = Number(this.getAttribute(name));
    return Number.isFinite(value) && value >= min ? Math.floor(value) : fallback;
  }
  get total() {
    return this.#number("total", 0);
  }
  set total(value) {
    this.setAttribute("total", String(value));
  }
  get pageSize() {
    return this.#number("page-size", 25, 1);
  }
  set pageSize(value) {
    this.setAttribute("page-size", String(value));
  }
  get pageCount() {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }
  get page() {
    return Math.min(this.pageCount, this.#number("page", 1, 1));
  }
  set page(value) {
    this.setAttribute("page", String(value));
  }
  /** The first row on the page, 0-based; slice(start, end) gives the page. */
  get start() {
    return Math.min(this.total, (this.page - 1) * this.pageSize);
  }
  get end() {
    return Math.min(this.total, this.page * this.pageSize);
  }

  #go(page, focus, always = false) {
    const next = Math.min(this.pageCount, Math.max(1, page));
    if (next === this.page && !always) return;
    this.setAttribute("page", String(next));
    this.dispatchEvent(new CustomEvent("fx:page", { bubbles: true, detail: { page: next, pageSize: this.pageSize, start: this.start, end: this.end } }));
    if (focus) this.shadowRoot.querySelector('button[aria-current]')?.focus();
  }

  /** The page numbers to show: the ends, and two either side of this one. */
  #pages() {
    const count = this.pageCount;
    const page = this.page;
    const want = new Set([1, count, page - 1, page, page + 1]);
    if (page <= 4) [2, 3, 4, 5].forEach((n) => want.add(n));
    if (page >= count - 3) [count - 1, count - 2, count - 3, count - 4].forEach((n) => want.add(n));
    const pages = [...want].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
    const out = [];
    pages.forEach((n, index) => {
      if (index && n - pages[index - 1] === 2) out.push(n - 1);
      else if (index && n - pages[index - 1] > 2) out.push(null);
      out.push(n);
    });
    return out;
  }

  // ------------------------------------------------------------- render

  #render() {
    const root = this.shadowRoot;
    const { total, page, pageCount, start, end } = this;
    root.querySelector("nav").setAttribute("aria-label", this.getAttribute("label") || "Pagination");
    root.querySelector(".range").textContent = total ? `${(start + 1).toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()}` : "No items";

    // The page-size chooser.
    const sizes = (this.getAttribute("page-sizes") ?? "10,25,50,100")
      .split(",")
      .map((size) => Number(size.trim()))
      .filter((size) => size > 0);
    if (sizes.length && !sizes.includes(this.pageSize)) sizes.push(this.pageSize), sizes.sort((a, b) => a - b);
    const sizeBox = root.querySelector(".size");
    sizeBox.hidden = sizes.length === 0;
    const select = root.querySelector("fx-select");
    const options = sizes.map((size) => `<option value="${size}">${size}</option>`).join("");
    if (select.dataset.options !== options) {
      select.dataset.options = options;
      select.innerHTML = options;
    }
    select.value = String(this.pageSize);

    const arrow = (name, target, label, disabled) =>
      `<li><button type="button" data-page="${target}" aria-label="${label}"${disabled ? " disabled" : ""}>${iconSvg(name)}</button></li>`;
    const numbers = this.hasAttribute("compact")
      ? `<li><span class="of">Page ${page} of ${pageCount}</span></li>`
      : this.#pages()
          .map((n) =>
            n === null
              ? `<li><span class="gap" aria-hidden="true">…</span></li>`
              : `<li><button type="button" data-page="${n}" aria-label="Page ${n}"${n === page ? ' aria-current="page"' : ""}>${n}</button></li>`,
          )
          .join("");
    root.querySelector("ol").innerHTML =
      arrow("chevron-left", page - 1, "Previous page", page <= 1) + numbers + arrow("chevron-right", page + 1, "Next page", page >= pageCount);
  }
}

if (!customElements.get("fx-pagination")) customElements.define("fx-pagination", FxPagination);
