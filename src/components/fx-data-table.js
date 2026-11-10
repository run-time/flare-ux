// <fx-data-table>: a sortable table of rows -- a
// header row on the layer's alternate color, rows that highlight under the
// pointer, and a click (or Enter) on a row to open it.
//
//   const table = document.querySelector("fx-data-table");
//   table.columns = [
//     { key: "name", label: "Name", value: (row) => row.name, defaultSort: true },
//     { key: "status", label: "Status", value: (row) => row.status,
//       render: (row) => `<fx-status-chip tone="${row.tone}">${row.status}</fx-status-chip>` },
//     { key: "size", label: "Size", value: (row) => row.bytes, align: "end" },
//   ];
//   table.rows = [{ id: 1, name: "atlas", status: "Passed", tone: "pass", bytes: 2048 }, …];
//   table.addEventListener("fx:row-select", (event) => open(event.detail.row));
//
// Columns: key, label, and optional
//   value(row)     what the column sorts by; without one it does not sort
//   render(row)    the cell's HTML (escape what you put in it); else
//                  row[key] as text
//   then(row)      breaks value's ties, always A to Z
//   defaultSort    true (ascending) or "desc", until the reader picks a sort
//   align          "end" for numbers
//   width          a CSS width for the column
//
// Properties: columns, rows, emptyMessage, searchQuery (matches are
// highlighted in the cells). Attributes: size (xs | sm | md | lg: 24, 32,
// 40, 48px rows; md by default), zebra (striped rows), sticky-header,
// storage-key (remember the reader's sort in this browser under that key),
// static (rows do not open: no pointer cursor, no fx:row-select), label (the
// table's accessible name).
//
// Events: fx:row-select ({ id, row }); fx:cell-action ({ action, row,
// button }) when a [data-action] button inside a cell is clicked -- that
// click does not also open the row; fx:sort ({ key, dir }).
//
// A header click sorts ascending, then descending, then back to the order
// the rows came in.

import { escapeHtml } from "../lib/escape.js";

const SORT_STORAGE_KEY = "fx.table-sort";
let nextId = 0;

function readSorts() {
  try {
    const saved = JSON.parse(localStorage.getItem(SORT_STORAGE_KEY) ?? "null");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function saveSort(key, sort) {
  try {
    localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify({ ...readSorts(), [key]: sort }));
  } catch {
    // Not remembered, but the table still sorts.
  }
}

const STYLE = `
  :host {
    --_row: var(--fx-size-md);
    display: block;
    overflow: auto;
    border: 1px solid var(--fx-border);
    border-radius: var(--fx-radius);
    background: var(--fx-layer);
    font: var(--fx-type-body-compact-01);
    color: var(--fx-text);
  }
  :host([hidden]) { display: none; }
  :host([size="xs"]) { --_row: var(--fx-size-xs); }
  :host([size="sm"]) { --_row: var(--fx-size-sm); }
  :host([size="lg"]) { --_row: var(--fx-size-lg); }
  table { width: 100%; border-collapse: collapse; }
  th, td { height: var(--_row); padding: 0 var(--fx-spacing-05); text-align: left; }
  th.end, td.end { text-align: right; font-variant-numeric: tabular-nums; }
  thead th {
    background: var(--fx-layer-alt);
    border-bottom: 1px solid var(--fx-border-strong);
    color: var(--fx-text);
    font: var(--fx-type-heading-01);
    white-space: nowrap;
  }
  :host([sticky-header]) thead th { position: sticky; top: 0; z-index: 1; }
  thead button {
    all: unset;
    display: inline-flex;
    align-items: center;
    gap: var(--fx-spacing-02);
    min-height: var(--_row);
    cursor: pointer;
  }
  thead th.end button { flex-direction: row-reverse; }
  thead button:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: -2px; }
  .arrow { display: inline-block; width: 1rem; color: var(--fx-text-secondary); font-size: 0.7em; }
  thead button:hover .arrow:empty::after { content: "▲"; opacity: 0.35; }
  tbody td { border-bottom: 1px solid var(--fx-border); vertical-align: middle; }
  tbody tr:last-child td { border-bottom: 0; }
  :host([zebra]) tbody tr:nth-child(even) { background: var(--fx-layer-alt); }
  tbody tr[data-index] { cursor: pointer; }
  :host([static]) tbody tr[data-index] { cursor: default; }
  tbody tr:hover { background: var(--fx-layer-hover) !important; }
  tbody tr:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: -2px; }
  .empty { padding: var(--fx-spacing-07) var(--fx-spacing-05); color: var(--fx-text-secondary); text-align: center; }
  a { color: var(--fx-link); text-underline-offset: 0.15em; }
  code { font: var(--fx-type-code-01); font-size: 0.85em; padding: 0.05em 0.3em; border-radius: var(--fx-radius-sm); background: var(--fx-layer-alt); }
  td { padding-block: var(--fx-spacing-02); }
  a:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: 1px; }
  /* A value nobody has filled in reads as a gap, not as content. */
  .cell-unknown { color: var(--fx-text-secondary); font-style: italic; }
  button[data-action] {
    all: unset;
    display: inline-grid;
    place-items: center;
    width: var(--fx-size-sm);
    height: var(--fx-size-sm);
    border-radius: var(--fx-radius);
    color: var(--fx-text-secondary);
    cursor: pointer;
    vertical-align: middle;
  }
  button[data-action]:hover:not(:disabled) { background: var(--fx-layer-selected); color: var(--fx-text); }
  button[data-action]:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: -2px; }
  button[data-action]:disabled { cursor: default; opacity: 0.5; }
  button[data-action] svg { width: 1rem; height: 1rem; }
`;

export class FxDataTable extends HTMLElement {
  static observedAttributes = ["label"];

  #columns = [];
  #rows = [];
  #sortKey = null;
  #sortDir = "asc";
  #emptyMessage = "No results.";
  #searchQuery = "";
  #highlight = `fx-table-match-${++nextId}`;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    for (const name of ["columns", "rows", "emptyMessage", "searchQuery"]) {
      if (Object.prototype.hasOwnProperty.call(this, name)) {
        const value = this[name];
        delete this[name];
        this[name] = value;
      }
    }
    this.render();
  }

  disconnectedCallback() {
    globalThis.CSS?.highlights?.delete(this.#highlight);
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  get columns() {
    return this.#columns;
  }
  set columns(cols) {
    this.#columns = Array.isArray(cols) ? cols : [];
    const storageKey = this.getAttribute("storage-key");
    const saved = storageKey ? readSorts()[storageKey] : null;
    if (saved && (saved.key === null || this.#columns.some((c) => c.key === saved.key && c.value))) {
      this.#sortKey = saved.key;
      this.#sortDir = saved.dir === "desc" ? "desc" : "asc";
    } else if (!this.#sortKey) {
      const initial = this.#columns.find((c) => c.defaultSort);
      if (initial) {
        this.#sortKey = initial.key;
        this.#sortDir = initial.defaultSort === "desc" ? "desc" : "asc";
      }
    }
    this.render();
  }

  get rows() {
    return this.#rows;
  }
  set rows(rows) {
    this.#rows = Array.isArray(rows) ? rows : [];
    this.render();
  }

  get emptyMessage() {
    return this.#emptyMessage;
  }
  set emptyMessage(message) {
    this.#emptyMessage = String(message ?? "");
    this.render();
  }

  get searchQuery() {
    return this.#searchQuery;
  }
  set searchQuery(value) {
    this.#searchQuery = String(value ?? "");
    this.#highlightMatches();
  }

  /** The current sort: { key, dir }, key null when unsorted. */
  get sort() {
    return { key: this.#sortKey, dir: this.#sortDir };
  }

  #sortedRows() {
    if (!this.#sortKey) return this.#rows;
    const col = this.#columns.find((c) => c.key === this.#sortKey);
    if (!col?.value) return this.#rows;
    const dir = this.#sortDir === "asc" ? 1 : -1;
    const compare = (a, b) => (typeof a === "string" && typeof b === "string" ? a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }) : a < b ? -1 : a > b ? 1 : 0);
    return [...this.#rows].sort((a, b) => {
      const order = compare(col.value(a), col.value(b));
      if (order) return order * dir;
      if (!col.then) return 0;
      return String(col.then(a)).localeCompare(String(col.then(b)), undefined, { numeric: true, sensitivity: "base" });
    });
  }

  #onHeaderClick(key) {
    if (this.#sortKey !== key) {
      this.#sortKey = key;
      this.#sortDir = "asc";
    } else if (this.#sortDir === "asc") {
      this.#sortDir = "desc";
    } else {
      this.#sortKey = null;
      this.#sortDir = "asc";
    }
    const storageKey = this.getAttribute("storage-key");
    if (storageKey) saveSort(storageKey, { key: this.#sortKey, dir: this.#sortDir });
    this.render();
    this.dispatchEvent(new CustomEvent("fx:sort", { bubbles: true, composed: true, detail: this.sort }));
    // The header was redrawn under the click; keep the keyboard on it.
    this.shadowRoot.querySelector(`th[data-key="${CSS.escape(key)}"] button`)?.focus({ preventScroll: true });
  }

  #emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  render() {
    if (!this.isConnected) return;
    const rows = this.#sortedRows();
    const label = this.getAttribute("label");
    const opens = !this.hasAttribute("static");

    const head = this.#columns
      .map((col) => {
        const active = this.#sortKey === col.key;
        const arrow = active ? (this.#sortDir === "asc" ? "▲" : "▼") : "";
        const next = !active ? "ascending" : this.#sortDir === "asc" ? "descending" : "unsorted";
        const sort = active ? ` aria-sort="${this.#sortDir === "asc" ? "ascending" : "descending"}"` : "";
        const cls = col.align === "end" ? ' class="end"' : "";
        const width = col.width ? ` style="width:${escapeHtml(col.width)}"` : "";
        const text = escapeHtml(col.label);
        return `<th scope="col" data-key="${escapeHtml(col.key)}"${cls}${width}${sort}>${
          col.value
            ? `<button type="button" title="${next === "unsorted" ? "Clear the sort" : `Sort ${next}`}">${text}<span class="arrow" aria-hidden="true">${arrow}</span></button>`
            : text
        }</th>`;
      })
      .join("");

    const body = rows.length
      ? rows
          .map(
            (row, i) =>
              `<tr${opens ? ` tabindex="0"` : ""} data-index="${i}">${this.#columns
                .map((col) => `<td${col.align === "end" ? ' class="end"' : ""}>${col.render ? col.render(row) : escapeHtml(row[col.key] ?? "")}</td>`)
                .join("")}</tr>`,
          )
          .join("")
      : `<tr><td class="empty" colspan="${Math.max(1, this.#columns.length)}">${escapeHtml(this.#emptyMessage)}</td></tr>`;

    this.shadowRoot.innerHTML = `<style>${STYLE} ::highlight(${this.#highlight}) { background: var(--fx-status-warning); color: var(--fx-status-warning-on); }</style>
      <table${label ? ` aria-label="${escapeHtml(label)}"` : ""}><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;

    this.shadowRoot.querySelectorAll("thead button").forEach((button) => {
      button.addEventListener("click", () => this.#onHeaderClick(button.closest("th").dataset.key));
    });

    this.shadowRoot.querySelectorAll("tbody tr[data-index]").forEach((tr) => {
      const row = rows[Number(tr.dataset.index)];
      tr.querySelectorAll("button[data-action], fx-button[data-action]").forEach((button) => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          this.#emit("fx:cell-action", { action: button.dataset.action, row, button });
        });
      });
      if (!opens) return;
      tr.addEventListener("click", (event) => {
        if (event.target.closest("a")) return; // a link in a cell goes where it goes
        this.#emit("fx:row-select", { id: row.id, row });
      });
      tr.addEventListener("keydown", (event) => {
        if (event.target !== tr) return; // a focused link or button handles its own keys
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.#emit("fx:row-select", { id: row.id, row });
        }
      });
    });
    this.#highlightMatches();
  }

  // Marks every match of the search in the cells with the CSS Custom
  // Highlight API: nothing in the table is rewritten, so focus, selection
  // and listeners all stay put.
  #highlightMatches() {
    const highlights = globalThis.CSS?.highlights;
    if (!highlights || typeof Highlight === "undefined") return;
    highlights.delete(this.#highlight);
    const needle = this.#searchQuery.trim().toLowerCase();
    const tbody = this.shadowRoot.querySelector("tbody");
    if (!needle || !tbody) return;
    const ranges = [];
    const walker = document.createTreeWalker(tbody, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.data.toLowerCase();
      for (let at = text.indexOf(needle); at !== -1; at = text.indexOf(needle, at + needle.length)) {
        const range = new Range();
        range.setStart(node, at);
        range.setEnd(node, at + needle.length);
        ranges.push(range);
      }
    }
    if (ranges.length) highlights.set(this.#highlight, new Highlight(...ranges));
  }
}

if (!customElements.get("fx-data-table")) customElements.define("fx-data-table", FxDataTable);
