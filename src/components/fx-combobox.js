// <fx-combobox>: a field that suggests as you type -- pick one of many (a
// repository, a person), or several (labels, owners), from a list too long
// to scroll. The same label, box and messages as fx-text-field; the list
// is drawn like fx-select's.
//
//   <fx-combobox label="Repository" name="repo" placeholder="Search…">
//     <option value="factory-ui">factory-ui</option>
//     <option value="baby-monitor">baby-monitor</option>
//   </fx-combobox>
//
//   <fx-combobox label="Labels" name="labels" multiple select-all value="bug,docs">…</fx-combobox>
//
// The options are the element's own <option> children (read live), or the
// `options` property: [{ value, label, disabled? }] -- or, for a list too
// big to hold (every user, every issue), the `load` hook fetches them as
// you type:
//
//   combobox.load = async (query, { signal }) => {
//     const response = await fetch(`/api/users?q=${encodeURIComponent(query)}`, { signal });
//     return (await response.json()).map((user) => ({ value: user.login, label: user.name }));
//   };
//
// It is called once typing pauses (`debounce`, 250ms), with an AbortSignal
// that fires when newer typing makes the answer stale; what it returns is
// the list, as given (the server did the matching). While it works the
// list says "Loading…", and "Could not load" if it throws. Below
// `min-chars` (default 1) the list asks for more typing instead; with
// min-chars="0" it loads as soon as the list opens. A chosen value keeps
// its label after the results move on.
//
// Attributes:
//   multiple      hold several values: each chosen one shows as a chip in
//                 the box (× or Backspace removes it), and the list stays
//                 open while you pick
//   select-all    with multiple: a "Select all" row first, for every option
//                 the typing has left showing -- factory-ui's filter menus
//   allow-custom  a value not in the list is taken as typed (Enter adds it)
//   value         the chosen value; with multiple, comma-separated
//   label, placeholder, icon, supporting-text, error-text, invalid-text,
//   valid-text, size (sm | md | lg), block, empty-text ("No matches"),
//   min-chars and debounce (with load),
//   plus FxFormControl's name, disabled, required
//
// Keyboard, as the WAI-ARIA combobox with list autocomplete: typing filters
// and opens the list; Down / Up move through it (Alt+Down opens it as it
// is); Enter picks; Escape closes it, and again clears the text. Focus
// stays in the field throughout (aria-activedescendant).
//
// Form-associated: posts name=value (with multiple, the name once per
// value); `change` fires when the choice changes, `input` as you type.
// Properties: value, values (an array), options, selectedOptions, load.
// The `loading` attribute is set while a load is out.

import { FIELD_CSS, FxFormControl } from "./fx-form-control.js";
import { escapeHtml } from "../lib/escape.js";
import { follow } from "../lib/follow.js";
import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";
import "./fx-tag.js";
import "./fx-spinner.js";

let uid = 0;

const template = document.createElement("template");
template.innerHTML = `
  <style>
    ${FIELD_CSS}
    :host { width: 18rem; max-width: 100%; }
    :host([block]) { width: 100%; }
    .box { flex-wrap: wrap; padding: var(--fx-spacing-01) var(--fx-spacing-03) var(--fx-spacing-01) var(--fx-spacing-05); row-gap: var(--fx-spacing-02); cursor: text; }
    .chips { display: contents; }
    .chips fx-tag { max-width: 100%; }
    input {
      flex: 1 1 4rem;
      min-width: 4rem;
      min-height: calc(var(--_height) - 2px - 2 * var(--fx-spacing-01));
      margin: 0;
      padding: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: inherit;
      font: inherit;
    }
    input::placeholder { color: var(--fx-text-placeholder); }
    .icon-button {
      all: unset;
      display: inline-grid;
      place-items: center;
      flex: none;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: var(--fx-radius-sm);
      color: var(--fx-text-secondary);
      cursor: pointer;
    }
    .icon-button:hover { background: var(--fx-layer-hover); color: var(--fx-text); }
    .icon-button:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: 1px; }
    .icon-button svg { width: 1rem; height: 1rem; }
    .icon-button[hidden] { display: none; }
    .chevron svg { transition: transform var(--fx-duration-moderate-01) var(--fx-easing-standard); }
    :host([open]) .chevron svg { transform: rotate(180deg); }

    .menu[popover] {
      position: fixed;
      inset: auto;
      margin: 0;
      padding: var(--fx-spacing-02);
      min-width: 12rem;
      max-height: min(20rem, calc(100vh - 1rem));
      overflow-y: auto;
      overscroll-behavior: contain;
      box-sizing: border-box;
      border: 1px solid var(--fx-border);
      border-radius: var(--fx-radius-lg);
      background: var(--fx-layer);
      color: var(--fx-text);
      box-shadow: var(--fx-shadow);
    }
    .opt {
      display: flex;
      align-items: center;
      gap: var(--fx-spacing-03);
      min-height: var(--fx-size-sm);
      padding: 0 var(--fx-spacing-04) 0 var(--fx-spacing-03);
      border-radius: var(--fx-radius);
      font: var(--fx-type-body-compact-01);
      cursor: pointer;
      user-select: none;
    }
    .opt:hover:not([aria-disabled="true"]) { background: var(--fx-layer-hover); }
    .opt.active { background: var(--fx-layer-hover); box-shadow: inset 0 0 0 2px var(--fx-focus); }
    .opt[aria-disabled="true"] { color: var(--fx-text-disabled); cursor: not-allowed; }
    .opt .text { flex: 1; min-width: 0; overflow-wrap: anywhere; }
    .opt .tick { display: inline-flex; width: 1rem; flex: none; color: var(--fx-interactive-text); }
    .opt .tick svg { width: 1rem; height: 1rem; }
    .opt:not([aria-selected="true"]) .tick svg { visibility: hidden; }
    /* With multiple, a box to tick, as the filter menus draw it. */
    .opt .box-tick { display: inline-grid; place-items: center; flex: none; width: 1rem; height: 1rem; box-sizing: border-box; border: 2px solid var(--fx-control-border); border-radius: 2px; color: var(--fx-text-on-color); }
    .opt[aria-selected="true"] .box-tick, .opt.all[data-all="true"] .box-tick { border-color: var(--fx-interactive); background: var(--fx-interactive); }
    .opt.all[data-all="some"] .box-tick { border-color: var(--fx-interactive); background: linear-gradient(var(--fx-text-on-color), var(--fx-text-on-color)) center / 0.5rem 2px no-repeat, var(--fx-interactive); }
    .opt .box-tick svg { width: 0.75rem; height: 0.75rem; stroke-width: 3; }
    .opt:not([aria-selected="true"]):not([data-all="true"]) .box-tick svg { visibility: hidden; }
    .opt.all { font-weight: 600; }
    .divider { height: 1px; margin: var(--fx-spacing-02) 0; background: var(--fx-border); }
    .opt mark { border-radius: 2px; background: var(--fx-color-teal-20); color: var(--fx-color-teal-100); }
    .opt.custom .text { color: var(--fx-text-secondary); }
    .empty { padding: var(--fx-spacing-03) var(--fx-spacing-04); color: var(--fx-text-secondary); font: var(--fx-type-helper-01); }
    .empty.loading { display: flex; align-items: center; gap: var(--fx-spacing-03); }
    .empty.error { color: var(--fx-status-error-text); }
  </style>
  <label class="label" part="label"></label>
  <div class="box" part="box">
    <span class="affix lead" part="leading"></span>
    <span class="chips"></span>
    <input part="input" role="combobox" aria-autocomplete="list" aria-expanded="false" autocomplete="off" spellcheck="false" data-focus>
    <span class="state" part="state" aria-hidden="true"></span>
    <button type="button" class="icon-button clear" tabindex="-1" aria-label="Clear" hidden></button>
    <button type="button" class="icon-button chevron" tabindex="-1" aria-label="Show options"></button>
  </div>
  <div class="support" part="supporting-text"></div>
  <div class="menu" popover="manual" role="listbox" part="listbox"></div>
`;

export class FxCombobox extends FxFormControl {
  static observedAttributes = [
    "label", "value", "placeholder", "icon", "multiple", "select-all", "allow-custom", "supporting-text", "error-text",
    "invalid-text", "valid-text", "invalid", "valid", "disabled", "required", "name", "aria-label", "empty-text", "min-chars",
  ];

  #id = `fx-combobox-${++uid}`;
  #input;
  #menu;
  #box;
  #options = null; // set by the property; else the <option> children
  #load = null; // the hook that fetches options for what is typed
  #loaded = []; // what it last returned
  #loadState = "idle"; // idle | short (too few characters) | loading | error | done
  #loadTimer = 0;
  #loadAbort = null;
  #known = new Map(); // every label seen, by value -- chips keep theirs
  #values = null; // the chosen values, once anything has set them
  #query = null; // what is typed, while it is being typed
  #active = -1; // the highlighted row in the open list
  #rows = []; // the open list's rows: { kind: "all" | "option" | "custom", option? }
  #observer = new MutationObserver(() => this.#render());

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open", delegatesFocus: true });
    root.appendChild(template.content.cloneNode(true));
    this.#input = root.querySelector("input");
    this.#menu = root.querySelector(".menu");
    this.#box = root.querySelector(".box");
    this.#input.id = `${this.#id}-input`;
    this.#menu.id = `${this.#id}-list`;
    this.#input.setAttribute("aria-controls", this.#menu.id);
    root.querySelector(".label").htmlFor = this.#input.id;
    root.querySelector(".clear").innerHTML = iconSvg("close");
    root.querySelector(".chevron").innerHTML = iconSvg("chevron-down");

    this.#input.addEventListener("input", () => {
      this.#query = this.#input.value;
      if (this.#load) this.#scheduleLoad();
      this.#open(true);
    });
    this.#input.addEventListener("keydown", (event) => this.#keys(event));
    this.#input.addEventListener("blur", () => this.#commit());
    this.#box.addEventListener("pointerdown", (event) => {
      if (event.target.closest("fx-tag, .icon-button") || this.disabled) return;
      if (event.target !== this.#input) event.preventDefault();
      this.#input.focus();
      if (!this.open) this.#open(false);
    });
    root.querySelector(".chevron").addEventListener("pointerdown", (event) => event.preventDefault());
    root.querySelector(".chevron").addEventListener("click", () => {
      if (this.disabled) return;
      this.#input.focus();
      if (this.open) this.#close();
      else this.#open(false);
    });
    root.querySelector(".clear").addEventListener("pointerdown", (event) => event.preventDefault());
    root.querySelector(".clear").addEventListener("click", () => {
      this.#query = null;
      this.#setValues([]);
      this.#input.value = "";
      this.#input.focus();
    });
    root.querySelector(".chips").addEventListener("fx:remove", (event) => {
      event.preventDefault();
      this.#setValues(this.values.filter((value) => value !== event.target.dataset.value));
      this.#input.focus();
    });
    // The list keeps focus in the field: a press does not move it.
    this.#menu.addEventListener("pointerdown", (event) => event.preventDefault());
    this.#menu.addEventListener("click", (event) => {
      const row = event.target.closest(".opt");
      if (row && row.getAttribute("aria-disabled") !== "true") this.#pick(Number(row.dataset.row));
    });
    this.#menu.addEventListener("toggle", (event) => this.toggleAttribute("open", event.newState === "open"));
  }

  connectedCallback() {
    this.upgradeProperties(["value", "values", "options", "load"]);
    this.#observer.observe(this, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["value", "label", "disabled"] });
    // The list stays on the field while the page scrolls (#place skips it when
    // closed), and closes once the field or the list scrolls out of view.
    this.#unfollow = follow(this, () => this.#place(), { popup: this.#menu, close: () => this.#close() });
    this.#render();
  }

  disconnectedCallback() {
    clearTimeout(this.#loadTimer);
    this.#loadAbort?.abort();
    this.#observer.disconnect();
    this.#unfollow();
  }

  attributeChangedCallback(name) {
    if (name === "value") this.#values = null;
    this.#render();
  }

  onDisabledChange() {
    this.#render();
  }

  formResetCallback() {
    this.#values = null;
    this.#query = null;
    this.#render();
  }

  // -------------------------------------------------------------- values

  get multiple() {
    return this.hasAttribute("multiple");
  }

  /** Every option: [{ value, label, disabled }]. */
  get options() {
    const normalize = (list) => list.map((option) => ({ value: String(option.value ?? option.label), label: String(option.label ?? option.value), disabled: Boolean(option.disabled) }));
    if (this.#load) return normalize(this.#loaded);
    if (this.#options) return normalize(this.#options);
    return [...this.querySelectorAll("option")].map((option) => ({
      value: option.value,
      label: option.label || option.textContent.trim(),
      disabled: option.disabled || Boolean(option.closest("optgroup[disabled]")),
    }));
  }
  set options(options) {
    this.#options = Array.isArray(options) ? options : null;
    this.#render();
  }

  /** The hook that fetches options for what is typed: (query, { signal }) => options. */
  get load() {
    return this.#load;
  }
  set load(load) {
    this.#load = typeof load === "function" ? load : null;
    this.#loaded = [];
    this.#loadState = "idle";
    this.#render();
  }

  #minChars() {
    const given = this.getAttribute("min-chars");
    const value = given === null || given.trim() === "" ? NaN : Number(given);
    return Number.isFinite(value) && value >= 0 ? value : 1;
  }

  /** Fetch for the text once typing pauses; drop any answer it makes stale. */
  #scheduleLoad() {
    clearTimeout(this.#loadTimer);
    this.#loadAbort?.abort();
    const query = (this.#query ?? "").trim();
    if (query.length < this.#minChars()) {
      this.#loaded = [];
      this.#loadState = "short";
      this.removeAttribute("loading");
      return;
    }
    this.#loadState = "loading";
    this.toggleAttribute("loading", true);
    // An absent debounce is the default, not 0 (Number(null) is 0).
    const given = this.getAttribute("debounce");
    const wait = given === null || given.trim() === "" ? NaN : Number(given);
    this.#loadTimer = setTimeout(() => this.#runLoad(query), Number.isFinite(wait) && wait >= 0 ? wait : 250);
  }

  async #runLoad(query) {
    const abort = new AbortController();
    this.#loadAbort = abort;
    try {
      const result = await this.#load(query, { signal: abort.signal });
      if (abort.signal.aborted) return;
      this.#loaded = Array.isArray(result) ? result : [];
      this.#loadState = "done";
    } catch (error) {
      if (abort.signal.aborted || error?.name === "AbortError") return;
      this.#loaded = [];
      this.#loadState = "error";
    }
    this.removeAttribute("loading");
    for (const option of this.options) this.#known.set(option.value, option.label);
    if (this.open) {
      this.#drawList();
      this.#highlight(this.#rows.findIndex((row) => row.kind !== "all" && !row.option?.disabled));
      this.#place();
    }
  }

  /** The chosen values, as an array. */
  get values() {
    if (this.#values) return [...this.#values];
    const attr = this.getAttribute("value") ?? "";
    if (!attr) return [];
    return this.multiple ? attr.split(",").map((part) => part.trim()).filter(Boolean) : [attr];
  }
  set values(values) {
    this.#values = (Array.isArray(values) ? values : [values]).map(String).filter((value) => value !== "");
    if (!this.multiple) this.#values = this.#values.slice(0, 1);
    this.#query = null;
    this.#render();
  }

  get value() {
    return this.multiple ? this.values.join(",") : (this.values[0] ?? "");
  }
  set value(value) {
    this.values = this.multiple ? String(value ?? "").split(",").map((part) => part.trim()) : [value ?? ""];
  }

  get selectedOptions() {
    const values = this.values;
    return this.options.filter((option) => values.includes(option.value));
  }

  get open() {
    return this.#menu.matches(":popover-open");
  }

  get focusTarget() {
    return this.#input;
  }

  /** What a value reads as: its option's label, or itself (a custom one). */
  #labelOf(value) {
    const label = this.options.find((option) => option.value === value)?.label;
    if (label !== undefined) this.#known.set(value, label);
    return label ?? this.#known.get(value) ?? value;
  }

  #setValues(values) {
    const before = this.value;
    this.#values = values;
    this.#render();
    if (this.value !== before) {
      this.fireChange();
      if (this.hasAttribute("invalid") && this.validity.valid) this.removeAttribute("invalid");
    }
  }

  // ---------------------------------------------------------- the list

  /** The rows the list shows for what is typed. */
  #buildRows() {
    const query = (this.#query ?? "").trim().toLowerCase();
    // Loaded results are matched already; a held list is filtered here.
    const matches = this.#load ? this.options : this.options.filter((option) => !query || option.label.toLowerCase().includes(query));
    const rows = [];
    if (this.multiple && this.hasAttribute("select-all") && matches.some((option) => !option.disabled)) rows.push({ kind: "all", options: matches.filter((option) => !option.disabled) });
    for (const option of matches) rows.push({ kind: "option", option });
    const typed = (this.#query ?? "").trim();
    if (this.hasAttribute("allow-custom") && typed && !this.options.some((option) => option.label.toLowerCase() === typed.toLowerCase())) rows.push({ kind: "custom", value: typed });
    return rows;
  }

  #mark(text) {
    const query = (this.#query ?? "").trim();
    const at = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
    if (at < 0) return escapeHtml(text);
    return `${escapeHtml(text.slice(0, at))}<mark>${escapeHtml(text.slice(at, at + query.length))}</mark>${escapeHtml(text.slice(at + query.length))}`;
  }

  #drawList() {
    const values = this.values;
    const multiple = this.multiple;
    this.#rows = this.#buildRows();
    this.#menu.setAttribute("aria-multiselectable", String(multiple));
    const html = this.#rows.map((row, index) => {
      const id = `${this.#id}-row-${index}`;
      if (row.kind === "all") {
        const chosen = row.options.filter((option) => values.includes(option.value)).length;
        const state = chosen === 0 ? "false" : chosen === row.options.length ? "true" : "some";
        return `<div class="opt all" role="option" id="${id}" data-row="${index}" data-all="${state}" aria-selected="${state === "true"}"><span class="box-tick">${iconSvg("check")}</span><span class="text">Select all</span></div><div class="divider" role="presentation"></div>`;
      }
      if (row.kind === "custom") {
        return `<div class="opt custom" role="option" id="${id}" data-row="${index}" aria-selected="false"><span class="tick">${iconSvg("plus")}</span><span class="text">Use “${escapeHtml(row.value)}”</span></div>`;
      }
      const { option } = row;
      const selected = values.includes(option.value);
      const tick = multiple ? `<span class="box-tick">${iconSvg("check")}</span>` : `<span class="tick">${iconSvg("check")}</span>`;
      return `<div class="opt" role="option" id="${id}" data-row="${index}" aria-selected="${selected}"${option.disabled ? ' aria-disabled="true"' : ""}>${tick}<span class="text">${this.#mark(option.label)}</span></div>`;
    });
    // With a load hook, what it is doing comes first.
    let status = "";
    if (this.#load) {
      const more = this.#minChars() - (this.#query ?? "").trim().length;
      if (this.#loadState === "loading") status = `<div class="empty loading" role="status"><fx-spinner size="14" aria-hidden="true"></fx-spinner>Loading…</div>`;
      else if (this.#loadState === "error") status = `<div class="empty error" role="status">Could not load results</div>`;
      else if (this.#loadState === "short" || (this.#loadState === "idle" && more > 0)) status = `<div class="empty" role="status">Type ${more} more character${more === 1 ? "" : "s"}</div>`;
    }
    const empty = status || (this.#load && this.#loadState !== "done") ? "" : `<div class="empty">${escapeHtml(this.getAttribute("empty-text") || "No matches")}</div>`;
    this.#menu.innerHTML = status + (html.join("") || empty);
  }

  #open(typing) {
    if (this.disabled) return;
    if (!typing && this.#load && this.#loadState === "idle" && this.#minChars() === 0) this.#scheduleLoad();
    this.#drawList();
    if (!this.open) {
      this.#menu.showPopover();
      this.#input.setAttribute("aria-expanded", "true");
    }
    this.#place();
    // Typing highlights the first match; opening shows where the choice is.
    const firstOption = this.#rows.findIndex((row) => row.kind !== "all" && !row.option?.disabled);
    const chosen = this.#rows.findIndex((row) => row.kind === "option" && row.option.value === this.values[0]);
    this.#highlight(typing ? firstOption : this.multiple ? -1 : chosen);
  }

  #close() {
    if (this.open) this.#menu.hidePopover();
    this.#input.setAttribute("aria-expanded", "false");
    this.#input.removeAttribute("aria-activedescendant");
    this.#active = -1;
  }

  #highlight(index) {
    this.#active = index;
    const rows = [...this.#menu.querySelectorAll(".opt")];
    rows.forEach((row) => row.classList.toggle("active", Number(row.dataset.row) === index));
    const row = rows.find((element) => Number(element.dataset.row) === index);
    if (!row) {
      this.#input.removeAttribute("aria-activedescendant");
      return;
    }
    this.#input.setAttribute("aria-activedescendant", row.id);
    // Scroll inside the list only, never the page.
    const menu = this.#menu;
    if (row.offsetTop < menu.scrollTop) menu.scrollTop = row.offsetTop - 4;
    else if (row.offsetTop + row.offsetHeight > menu.scrollTop + menu.clientHeight) menu.scrollTop = row.offsetTop + row.offsetHeight - menu.clientHeight + 4;
  }

  #move(step) {
    const usable = this.#rows.map((row, index) => (row.kind === "option" && row.option.disabled ? -1 : index)).filter((index) => index >= 0);
    if (!usable.length) return;
    const at = usable.indexOf(this.#active);
    const next = at < 0 ? (step > 0 ? usable[0] : usable[usable.length - 1]) : usable[Math.min(usable.length - 1, Math.max(0, at + step))];
    this.#highlight(next);
  }

  #pick(index) {
    const row = this.#rows[index];
    if (!row) return;
    const values = this.values;
    if (row.kind === "all") {
      const every = row.options.every((option) => values.includes(option.value));
      const next = every ? values.filter((value) => !row.options.some((option) => option.value === value)) : [...new Set([...values, ...row.options.map((option) => option.value)])];
      this.#setValues(next);
      this.#drawList();
      this.#highlight(index);
      return;
    }
    const value = row.kind === "custom" ? row.value : row.option.value;
    if (this.multiple) {
      this.#setValues(values.includes(value) ? values.filter((one) => one !== value) : [...values, value]);
      this.#query = null;
      this.#input.value = "";
      this.#drawList();
      this.#highlight(this.#rows.findIndex((one) => (one.kind === "option" ? one.option.value : one.value) === value));
      this.#place();
    } else {
      this.#query = null;
      this.#setValues([value]);
      this.#close();
    }
  }

  /** Leaving the field: an unpicked text is taken (allow-custom) or let go. */
  #commit() {
    this.#close();
    if (this.#query === null) return;
    const typed = this.#query.trim();
    this.#query = null;
    if (!this.multiple) {
      const match = this.options.find((option) => option.label.toLowerCase() === typed.toLowerCase());
      if (!typed) this.#setValues([]);
      else if (match) this.#setValues([match.value]);
      else if (this.hasAttribute("allow-custom")) this.#setValues([typed]);
    }
    this.#render();
  }

  #keys(event) {
    const open = this.open;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) this.#open(false);
        if (!event.altKey) this.#move(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) this.#open(false);
        else this.#move(-1);
        break;
      case "Enter":
        if (open && this.#active >= 0) {
          event.preventDefault();
          this.#pick(this.#active);
        } else if (open) {
          event.preventDefault();
          this.#close();
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          this.#close();
        } else if (this.#input.value) {
          event.preventDefault();
          this.#query = "";
          this.#input.value = "";
        }
        break;
      case "Home":
      case "End":
        if (open && !this.#input.value) {
          event.preventDefault();
          const usable = this.#rows.map((row, index) => (row.kind === "option" && row.option.disabled ? -1 : index)).filter((index) => index >= 0);
          if (usable.length) this.#highlight(event.key === "Home" ? usable[0] : usable[usable.length - 1]);
        }
        break;
      case "Backspace":
        if (this.multiple && !this.#input.value && this.values.length) {
          this.#setValues(this.values.slice(0, -1));
          if (open) this.#drawList();
        }
        break;
      case "Tab":
        this.#close();
        break;
    }
  }

  #place() {
    if (!this.open) return;
    const at = this.#box.getBoundingClientRect();
    this.#menu.style.minWidth = `${Math.round(at.width)}px`;
    this.#menu.style.maxWidth = `${Math.round(Math.max(at.width, 320))}px`;
    const height = this.#menu.offsetHeight;
    const width = this.#menu.offsetWidth;
    const gap = 4;
    const room = window.innerHeight - at.bottom - gap - 8;
    const top = height > room && at.top - gap - height >= 8 ? at.top - gap - height : at.bottom + gap;
    this.#menu.style.top = `${Math.round(Math.max(8, top))}px`;
    this.#menu.style.left = `${Math.round(Math.min(Math.max(8, at.left), window.innerWidth - width - 8))}px`;
  }

  #unfollow = () => {};

  // ------------------------------------------------------------- render

  #render() {
    if (!this.shadowRoot) return;
    const root = this.shadowRoot;
    const multiple = this.multiple;
    const values = this.values;
    const input = this.#input;

    const label = this.getAttribute("label") ?? "";
    root.querySelector(".label").innerHTML = label ? `${escapeHtml(label)}${this.required ? '<span class="req" aria-hidden="true">*</span>' : ""}` : "";
    if (!label && this.getAttribute("aria-label")) input.setAttribute("aria-label", this.getAttribute("aria-label"));
    const icon = this.getAttribute("icon");
    root.querySelector(".lead").innerHTML = icon ? iconSvg(icon) : "";
    input.disabled = this.disabled;
    input.placeholder = multiple && values.length ? "" : (this.getAttribute("placeholder") ?? "");

    // The chosen ones as chips (multiple), or the choice as the text (one).
    const chips = root.querySelector(".chips");
    const chipsHtml = multiple
      ? values.map((value) => `<fx-tag size="sm" removable data-value="${escapeHtml(value)}"${this.disabled ? " disabled" : ""}>${escapeHtml(this.#labelOf(value))}</fx-tag>`).join("")
      : "";
    if (chips.dataset.html !== chipsHtml) {
      chips.dataset.html = chipsHtml;
      chips.innerHTML = chipsHtml;
    }
    if (this.#query === null) input.value = multiple ? "" : values.length ? this.#labelOf(values[0]) : "";
    root.querySelector(".clear").hidden = this.disabled || (!values.length && !input.value);

    // What the form posts, and whether it is valid.
    const name = this.getAttribute("name");
    if (multiple) {
      if (name && values.length && !this.disabled) {
        const data = new FormData();
        for (const value of values) data.append(name, value);
        this.syncForm(data);
      } else this.syncForm(null);
    } else this.syncForm(values.length && !this.disabled ? values[0] : null);
    this.syncValidity(this.required && !values.length ? { valueMissing: true } : {}, multiple ? "Please pick at least one." : "Please pick one.", input);

    const error = this.getAttribute("error-text") ?? "";
    this.toggleAttribute("invalid", Boolean(error) || (this.hasAttribute("invalid") && !this.validity.valid));
    if (this.hasAttribute("invalid")) this.removeAttribute("valid");
    const feedback = this.feedback();
    const support = root.querySelector(".support");
    support.textContent = feedback.text;
    support.classList.toggle("error", feedback.state === "invalid");
    support.classList.toggle("valid", feedback.state === "valid");
    root.querySelector(".state").innerHTML = feedback.state ? iconSvg(feedback.state === "invalid" ? "alert-circle" : "check") : "";
    support.id = `${this.#id}-support`;
    if (support.textContent) input.setAttribute("aria-describedby", support.id);
    else input.removeAttribute("aria-describedby");
    input.setAttribute("aria-invalid", String(this.hasAttribute("invalid")));

    if (this.open) {
      const active = this.#active;
      this.#drawList();
      this.#highlight(active);
    }
  }

  updateValidity() {
    this.#render();
  }
}

if (!customElements.get("fx-combobox")) customElements.define("fx-combobox", FxCombobox);
