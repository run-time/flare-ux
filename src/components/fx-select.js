// <fx-select>: Material 3's outlined select -- the same label, box and
// supporting text as fx-text-field -- whose list is drawn by Flare UX rather
// than the platform, so it looks like every other menu here (the split
// button's, the dropdown menu's) in every browser and theme.
//
//   <fx-select label="Region" name="region" value="west">
//     <option value="east">East</option>
//     <option value="west">West</option>
//     <optgroup label="Retired"><option value="north">North</option></optgroup>
//   </fx-select>
//
// The options are the element's own <option>/<optgroup> children, read live
// as they change; an option's `disabled` and an optgroup's are honored, and
// an option with value="" reads as a placeholder. Attributes: label, value,
// placeholder (shown when nothing is chosen), supporting-text, error-text,
// invalid-text and valid-text (shown when its validity is shown -- see fx-form),
// icon, size (sm | md | lg; dense = sm), block, plus FxFormControl's name,
// disabled, required. Like <select>: value, selectedIndex, options,
// selectedOptions, add(); `input` and `change` when a choice is made.
//
// Keyboard, as the WAI-ARIA select-only combobox: focus stays on the field.
// Down, Up, Enter, Space or Alt+Down open the list; Up / Down / Home / End
// move through it; Enter, Space or Tab choose; Escape closes it without
// choosing. Typing a letter jumps to the next option starting with it --
// choosing it at once while the list is closed, as a native select does.

import { FIELD_CSS, FxFormControl } from "./fx-form-control.js";
import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";
import { escapeHtml } from "../lib/escape.js";
import { follow } from "../lib/follow.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    ${FIELD_CSS}
    .box { padding: 0; cursor: pointer; }
    :host(:disabled) .box { cursor: not-allowed; }
    .lead { padding-left: var(--fx-spacing-05); }
    :host([size="sm"]) .lead, :host([dense]) .lead { padding-left: var(--fx-spacing-04); }
    .trigger {
      all: unset;
      box-sizing: border-box;
      flex: 1;
      display: flex;
      align-items: center;
      gap: var(--fx-spacing-03);
      min-width: 0;
      min-height: calc(var(--_height) - 2px);
      padding: 0 var(--fx-spacing-04) 0 var(--fx-spacing-05);
      font: inherit;
      color: inherit;
      cursor: inherit;
    }
    .lead:not(:empty) + .trigger { padding-left: 0; }
    :host([size="sm"]) .trigger, :host([dense]) .trigger { padding: 0 var(--fx-spacing-03) 0 var(--fx-spacing-04); }
    /* As wide as the widest option, as a native select is: every option's
       text sits invisibly in the same grid cell as the value, so the field
       keeps one width whichever is chosen. */
    .sizer { flex: 1; min-width: 0; display: grid; }
    .sizer > * { grid-area: 1 / 1; min-width: 0; padding-inline-end: 0.125em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }
    .sizer > [aria-hidden] { visibility: hidden; }
    .value.placeholder { color: var(--fx-text-placeholder); }
    .chevron { flex: none; width: 1rem; height: 1rem; color: var(--fx-text); transition: transform var(--fx-duration-moderate-01) var(--fx-easing-standard); }
    :host([open]) .chevron { transform: rotate(180deg); }
    :host([open]) .box { border-color: var(--fx-field-color); box-shadow: inset 0 0 0 1px var(--fx-field-color); }

    /* The list: the split button's menu, line for line. */
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
    .opt .label { flex: 1; min-width: 0; overflow-wrap: anywhere; }
    .opt .tick { display: inline-flex; width: 1rem; flex: none; color: var(--fx-interactive-text); }
    .opt .tick svg { width: 1rem; height: 1rem; }
    .opt:not([aria-selected="true"]) .tick svg { visibility: hidden; }
    .group-label {
      padding: var(--fx-spacing-03) var(--fx-spacing-04) var(--fx-spacing-02) var(--fx-spacing-03);
      color: var(--fx-text-secondary);
      font: var(--fx-type-label-01);
      letter-spacing: 0.02em;
    }
    [role="group"] + [role="group"], .opt + [role="group"] { margin-top: var(--fx-spacing-02); border-top: 1px solid var(--fx-border); }
    .empty { padding: var(--fx-spacing-03) var(--fx-spacing-04); color: var(--fx-text-secondary); font: var(--fx-type-helper-01); }
  </style>
  <span class="label" part="label"></span>
  <div class="box" part="box">
    <span class="affix lead" part="leading"></span>
    <button type="button" class="trigger" part="select" role="combobox" aria-haspopup="listbox" aria-expanded="false" data-focus>
      <span class="sizer"><span class="value"></span></span>
      <span class="state" part="state" aria-hidden="true"></span>
    </button>
  </div>
  <div class="support" part="supporting-text"></div>
  <div class="menu" popover="auto" role="listbox" part="listbox" tabindex="-1"></div>
`;

let uid = 0;

export class FxSelect extends FxFormControl {
  static observedAttributes = ["label", "value", "placeholder", "supporting-text", "error-text", "invalid-text", "valid-text", "invalid", "valid", "icon", "disabled", "required", "name", "aria-label"];

  #id = `fx-sel-${++uid}`;
  #trigger;
  #menu;
  #box;
  // The chosen value, once anything has chosen one; null until then, which
  // means the first enabled option -- as a native select starts.
  #value = null;
  #active = -1; // the highlighted option while the list is open
  #wasOpen = false;
  #typed = "";
  #typedAt = 0;
  #observer = new MutationObserver(() => this.#render());

  constructor() {
    super();
    this.attachShadow({ mode: "open", delegatesFocus: true }).appendChild(template.content.cloneNode(true));
    const root = this.shadowRoot;
    this.#trigger = root.querySelector(".trigger");
    this.#menu = root.querySelector(".menu");
    this.#box = root.querySelector(".box");
    this.#menu.id = `${this.#id}-list`;
    this.#trigger.setAttribute("aria-controls", this.#menu.id);
    root.querySelector(".label").id = `${this.#id}-label`;
    root.querySelector(".value").id = `${this.#id}-value`;

    // An open popover closes itself on pointerdown outside it -- this field
    // included -- so remember whether it was open, or the click reopens it.
    this.#box.addEventListener("pointerdown", () => {
      this.#wasOpen = this.#menu.matches(":popover-open");
    });
    this.#box.addEventListener("click", (event) => {
      // A click the keyboard made (Enter or Space on the field) is the key
      // handler's; only a pointer's opens the list here.
      if (this.disabled || event.detail === 0) return;
      if (this.#wasOpen) this.#wasOpen = false;
      else this.#open();
      this.#trigger.focus();
    });
    // The label focuses the field, as a native label does, without opening it.
    root.querySelector(".label").addEventListener("click", () => this.#trigger.focus());
    this.#trigger.addEventListener("keydown", (event) => this.#keys(event));
    this.#trigger.addEventListener("blur", () => this.#close());

    // Options keep focus on the field: a press does not move it.
    this.#menu.addEventListener("pointerdown", (event) => event.preventDefault());
    this.#menu.addEventListener("click", (event) => {
      const row = event.target.closest(".opt");
      if (!row || row.getAttribute("aria-disabled") === "true") return;
      this.#choose(Number(row.dataset.index));
      this.#close();
    });
    this.#menu.addEventListener("pointermove", (event) => {
      const row = event.target.closest(".opt");
      if (row && row.getAttribute("aria-disabled") !== "true") this.#highlight(Number(row.dataset.index), false);
    });
    this.#menu.addEventListener("toggle", (event) => {
      const open = event.newState === "open";
      this.toggleAttribute("open", open);
      this.#trigger.setAttribute("aria-expanded", String(open));
      if (!open) {
        this.#trigger.removeAttribute("aria-activedescendant");
        this.#unfollow();
      }
    });
  }

  connectedCallback() {
    this.upgradeProperties(["value", "selectedIndex"]);
    this.#observer.observe(this, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["value", "label", "disabled", "selected"] });
    this.#render();
  }

  disconnectedCallback() {
    this.#observer.disconnect();
    this.#close();
  }

  attributeChangedCallback(name) {
    if (name === "value") this.#value = this.getAttribute("value");
    this.#render();
  }

  onDisabledChange() {
    this.#render();
  }

  formResetCallback() {
    this.#value = this.getAttribute("value");
    this.#render();
  }

  // ------------------------------------------------------------ value

  /** Every <option>, in order, groups included. */
  get options() {
    return [...this.querySelectorAll(":scope > option, :scope > optgroup > option")];
  }

  #isDisabled(option) {
    return option.disabled || option.parentElement?.localName === "optgroup" && option.parentElement.disabled;
  }

  get #selected() {
    const options = this.options;
    // No value given: an option marked `selected`, else the first enabled one.
    if (this.#value === null) return options.find((option) => option.defaultSelected) ?? options.find((option) => !this.#isDisabled(option)) ?? null;
    return options.find((option) => option.value === this.#value) ?? null;
  }

  get value() {
    return this.#selected?.value ?? "";
  }
  set value(value) {
    this.#value = value === null || value === undefined ? "" : String(value);
    this.#render();
  }

  get selectedIndex() {
    const selected = this.#selected;
    return selected ? this.options.indexOf(selected) : -1;
  }
  set selectedIndex(index) {
    const option = this.options[Number(index)];
    this.#value = option ? option.value : "";
    this.#render();
  }
  get selectedOptions() {
    const selected = this.#selected;
    return selected ? [selected] : [];
  }
  get type() {
    return "select-one";
  }
  get focusTarget() {
    return this.#trigger;
  }
  /** The focusable field inside (a button with role="combobox"). */
  get control() {
    return this.#trigger;
  }
  /** Whether the list is showing. */
  get open() {
    return this.hasAttribute("open");
  }

  /** Add an option, as HTMLSelectElement.add(). */
  add(option, before) {
    this.insertBefore(option, typeof before === "number" ? this.querySelectorAll(":scope > option")[before] ?? null : before ?? null);
  }

  /** Open the list, as a click on the field does. */
  showPicker() {
    this.#open();
  }

  // ------------------------------------------------------------ the list

  #open() {
    if (this.disabled || this.#menu.matches(":popover-open")) return;
    this.#drawList();
    this.#menu.showPopover();
    this.#place();
    this.#highlight(this.selectedIndex >= 0 ? this.selectedIndex : this.#step(-1, 1));
    // Kept on the field while the page scrolls or resizes; closed once it or
    // the menu scrolls out of view.
    this.#unfollow = follow(this.#box, () => this.#place(), { popup: this.#menu, close: this.#close });
  }

  #close = () => {
    if (this.#menu.matches(":popover-open")) this.#menu.hidePopover();
  };

  #unfollow = () => {};

  #place() {
    const at = this.#box.getBoundingClientRect();
    this.#menu.style.minWidth = `${Math.round(at.width)}px`;
    const height = this.#menu.offsetHeight;
    const width = this.#menu.offsetWidth;
    const gap = 4;
    const room = window.innerHeight - at.bottom - gap - 8;
    const top = height > room && at.top - gap - height >= 8 ? at.top - gap - height : at.bottom + gap;
    this.#menu.style.top = `${Math.round(Math.max(8, top))}px`;
    this.#menu.style.left = `${Math.round(Math.min(Math.max(8, at.left), window.innerWidth - width - 8))}px`;
  }

  #drawList() {
    const selected = this.#selected;
    const options = this.options;
    const row = (option) => {
      const index = options.indexOf(option);
      const disabled = this.#isDisabled(option);
      return `<div class="opt" role="option" id="${this.#id}-opt-${index}" data-index="${index}" aria-selected="${option === selected}"${disabled ? ' aria-disabled="true"' : ""}>
        <span class="tick">${iconSvg("check")}</span><span class="label">${escapeHtml(option.label || option.textContent.trim())}</span></div>`;
    };
    let group = 0;
    const html = [...this.children]
      .map((child) => {
        if (child.localName === "option") return row(child);
        if (child.localName !== "optgroup") return "";
        const id = `${this.#id}-group-${++group}`;
        return `<div role="group" aria-labelledby="${id}"><div class="group-label" id="${id}">${escapeHtml(child.label)}</div>${[...child.querySelectorAll(":scope > option")].map(row).join("")}</div>`;
      })
      .join("");
    this.#menu.innerHTML = html || '<div class="empty">No options</div>';
    const label = this.getAttribute("label") || this.getAttribute("aria-label");
    if (label) this.#menu.setAttribute("aria-label", label);
  }

  #highlight(index, scroll = true) {
    this.#active = index;
    for (const row of this.#menu.querySelectorAll(".opt")) row.classList.toggle("active", Number(row.dataset.index) === index);
    const row = this.#menu.querySelector(`.opt[data-index="${index}"]`);
    if (row) {
      this.#trigger.setAttribute("aria-activedescendant", row.id);
      // Within the list only: scrollIntoView would scroll the page too.
      if (scroll) {
        const menu = this.#menu;
        if (row.offsetTop < menu.scrollTop) menu.scrollTop = row.offsetTop - 4;
        else if (row.offsetTop + row.offsetHeight > menu.scrollTop + menu.clientHeight) menu.scrollTop = row.offsetTop + row.offsetHeight - menu.clientHeight + 4;
      }
    } else this.#trigger.removeAttribute("aria-activedescendant");
  }

  /** The next enabled option from `from`, `dir` steps at a time; `from` itself when there is none. */
  #step(from, dir) {
    const options = this.options;
    for (let i = from + dir; i >= 0 && i < options.length; i += dir) {
      if (!this.#isDisabled(options[i])) return i;
    }
    return from;
  }

  #choose(index) {
    const option = this.options[index];
    if (!option || this.#isDisabled(option)) return;
    const before = this.value;
    this.#value = option.value;
    this.#render();
    if (option.value !== before || this.selectedIndex !== index) {
      this.fireInput();
      this.fireChange();
    }
  }

  #typeahead(key) {
    const now = Date.now();
    this.#typed = now - this.#typedAt > 700 ? key : this.#typed + key;
    this.#typedAt = now;
    const options = this.options;
    const from = this.open ? this.#active : this.selectedIndex;
    // One letter pressed again cycles through the options starting with it.
    const same = this.#typed.split("").every((c) => c === this.#typed[0]);
    const needle = (same ? this.#typed[0] : this.#typed).toLowerCase();
    const start = same || this.#typed.length === 1 ? from + 1 : Math.max(from, 0);
    for (let n = 0; n < options.length; n++) {
      const i = (start + n) % options.length;
      const text = (options[i].label || options[i].textContent).trim().toLowerCase();
      if (!this.#isDisabled(options[i]) && text.startsWith(needle)) return i;
    }
    return -1;
  }

  #keys(event) {
    if (this.disabled) return;
    const open = this.open;
    const last = this.#step(this.options.length, -1);
    const first = this.#step(-1, 1);
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        this.#open();
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        this.#choose(event.key === "Home" ? first : last);
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const found = this.#typeahead(event.key);
        if (found >= 0) this.#choose(found);
      }
      return;
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        this.#highlight(this.#step(this.#active, 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        if (event.altKey) {
          this.#choose(this.#active);
          this.#close();
        } else this.#highlight(this.#step(this.#active, -1));
        break;
      case "Home":
      case "PageUp":
        event.preventDefault();
        this.#highlight(first);
        break;
      case "End":
      case "PageDown":
        event.preventDefault();
        this.#highlight(last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        this.#choose(this.#active);
        this.#close();
        break;
      case "Tab":
        this.#choose(this.#active);
        this.#close();
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation(); // a dialog around it stays open
        this.#close();
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const found = this.#typeahead(event.key);
          if (found >= 0) this.#highlight(found);
        }
    }
  }

  // ------------------------------------------------------------ render

  #render() {
    if (!this.#trigger) return;
    const root = this.shadowRoot;
    this.#trigger.disabled = this.disabled;
    if (this.disabled) this.#close();

    const label = this.getAttribute("label") ?? "";
    root.querySelector(".label").innerHTML = label ? `${escapeHtml(label)}${this.required ? '<span class="req" aria-hidden="true">*</span>' : ""}` : "";
    const aria = this.getAttribute("aria-label");
    if (label) {
      this.#trigger.setAttribute("aria-labelledby", `${this.#id}-label`);
      this.#trigger.removeAttribute("aria-label");
    } else {
      this.#trigger.removeAttribute("aria-labelledby");
      if (aria) this.#trigger.setAttribute("aria-label", aria);
      else this.#trigger.removeAttribute("aria-label");
    }
    this.#trigger.setAttribute("aria-required", String(this.required));

    const selected = this.#selected;
    const text = selected ? (selected.label || selected.textContent.trim()) : "";
    const valueEl = root.querySelector(".value");
    // A chosen value="" option reads as a placeholder; so does no choice.
    const placeholder = !selected || selected.value === "";
    valueEl.textContent = text || this.getAttribute("placeholder") || "";
    valueEl.classList.toggle("placeholder", placeholder);
    const widths = [...this.options.map((option) => option.label || option.textContent.trim()), this.getAttribute("placeholder") ?? ""];
    const sizer = root.querySelector(".sizer");
    const sized = widths.join("\u0000");
    if (sizer.dataset.sized !== sized) {
      sizer.dataset.sized = sized;
      sizer.querySelectorAll("[aria-hidden]").forEach((node) => node.remove());
      for (const text of widths) {
        const ghost = document.createElement("span");
        ghost.setAttribute("aria-hidden", "true");
        ghost.textContent = text;
        sizer.append(ghost);
      }
    }
    if (!this.#trigger.querySelector(".chevron")) this.#trigger.insertAdjacentHTML("beforeend", iconSvg("chevron-down", { className: "chevron" }));

    const icon = this.getAttribute("icon");
    root.querySelector(".lead").innerHTML = icon ? iconSvg(icon) : "";

    const value = this.value;
    this.syncValidity(this.required && !value ? { valueMissing: true } : {}, "Please pick one.", this.#trigger);
    const error = this.getAttribute("error-text") ?? "";
    // Shown validity follows the choice: an error clears once one is made.
    this.toggleAttribute("invalid", Boolean(error) || (this.hasAttribute("invalid") && !this.validity.valid));
    if (this.hasAttribute("invalid")) this.removeAttribute("valid");
    const feedback = this.feedback();
    const support = root.querySelector(".support");
    support.textContent = feedback.text;
    support.classList.toggle("error", feedback.state === "invalid");
    support.classList.toggle("valid", feedback.state === "valid");
    root.querySelector(".state").innerHTML = feedback.state ? iconSvg(feedback.state === "invalid" ? "alert-circle" : "check") : "";
    support.id = `${this.#id}-support`;
    if (support.textContent) this.#trigger.setAttribute("aria-describedby", support.id);
    else this.#trigger.removeAttribute("aria-describedby");
    this.#trigger.setAttribute("aria-invalid", String(this.hasAttribute("invalid")));

    if (this.open) {
      this.#drawList();
      this.#highlight(this.#active, false);
    }

    this.syncForm(selected ? value : null);
  }
}

if (!customElements.get("fx-select")) customElements.define("fx-select", FxSelect);
