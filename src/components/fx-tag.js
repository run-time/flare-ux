// <fx-tag>: a short label in a pill -- a topic, a filter that is set, a
// choice that can be toggled. Not a status: for pass / fail use
// fx-status-chip.
//
//   <fx-tag>frontend</fx-tag>
//   <fx-tag color="purple" icon="robot">Opus</fx-tag>
//   <fx-tag label="Repo" removable>factory-ui</fx-tag>         Repo: factory-ui ×
//   <fx-tag selectable selected>Open</fx-tag>                   a filter chip
//
// Attributes:
//   label       a name shown before the text, as "label: text" -- what a
//               filter is set to
//   color       a palette family (teal, purple…) for a pale tag of it, or a
//               family and step (red-80) for a solid one; gray by default
//   icon        an icon before the text
//   removable   an × that fires `fx:remove` (cancelable); unless canceled
//               the tag then removes itself. dismiss() does the same.
//   selectable  the tag is a toggle button (aria-pressed); a click flips
//               `selected` and fires `change`
//   selected    on (with selectable)
//   disabled
//   size        sm | md (default)
//
// The × says "Remove <label: text>" to assistive technology.

import { escapeHtml } from "../lib/escape.js";
import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";
import { paletteColor } from "../lib/palette-color.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --_bg: var(--fx-layer-alt);
      --_fg: var(--fx-text);
      --_border: var(--fx-border);
      display: inline-flex;
      vertical-align: middle;
      max-width: 100%;
    }
    :host([hidden]) { display: none; }
    .tag {
      display: inline-flex;
      align-items: center;
      gap: var(--fx-spacing-02);
      min-width: 0;
      max-width: 100%;
      min-height: 1.5rem;
      box-sizing: border-box;
      padding: 0 var(--fx-spacing-03);
      border: 1px solid var(--_border);
      border-radius: var(--fx-radius-pill);
      background: var(--_bg);
      color: var(--_fg);
      font: 400 var(--fx-font-size-01) / 1.2 var(--fx-font);
      white-space: nowrap;
    }
    :host([removable]) .tag { padding-inline-end: var(--fx-spacing-01); }
    :host([size="sm"]) .tag { min-height: 1.25rem; padding: 0 var(--fx-spacing-02); font-size: 0.6875rem; }
    .text { overflow: hidden; text-overflow: ellipsis; }
    .label { color: color-mix(in srgb, var(--_fg) 72%, transparent); }
    .label:empty { display: none; }
    .icon { display: none; flex: none; }
    .icon:not(:empty) { display: inline-flex; }
    .icon svg { width: 0.875rem; height: 0.875rem; }

    /* A toggle: the whole tag is the button. */
    button.tag { all: unset; display: inline-flex; align-items: center; gap: var(--fx-spacing-02); min-height: 1.5rem; max-width: 100%; box-sizing: border-box; padding: 0 var(--fx-spacing-03); border: 1px solid var(--_border); border-radius: var(--fx-radius-pill); background: var(--_bg); color: var(--_fg); font: 400 var(--fx-font-size-01) / 1.2 var(--fx-font); white-space: nowrap; cursor: pointer; }
    button.tag:hover { background: color-mix(in srgb, var(--_fg) 8%, var(--_bg)); }
    button.tag:focus-visible, .remove:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: 1px; }
    :host([selected]) {
      --_bg: var(--fx-interactive-subtle);
      --_fg: var(--fx-interactive-text);
      --_border: var(--fx-interactive);
    }
    .check { display: none; }
    :host([selectable][selected]) .check { display: inline-flex; }
    .check svg { width: 0.875rem; height: 0.875rem; }

    .remove {
      all: unset;
      display: inline-grid;
      place-items: center;
      flex: none;
      width: 1.125rem;
      height: 1.125rem;
      border-radius: 50%;
      color: inherit;
      cursor: pointer;
      opacity: 0.75;
    }
    .remove:hover { opacity: 1; background: color-mix(in srgb, currentColor 14%, transparent); }
    .remove svg { width: 0.75rem; height: 0.75rem; }
    :host([disabled]) .tag { opacity: 0.5; cursor: not-allowed; }
    :host([disabled]) .remove { pointer-events: none; }
  </style>
  <span class="host-slot"></span>
`;

export class FxTag extends HTMLElement {
  static observedAttributes = ["label", "color", "icon", "removable", "selectable", "selected", "disabled"];

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

  get selected() {
    return this.hasAttribute("selected");
  }
  set selected(value) {
    this.toggleAttribute("selected", Boolean(value));
  }

  get disabled() {
    return this.hasAttribute("disabled");
  }
  set disabled(value) {
    this.toggleAttribute("disabled", Boolean(value));
  }

  /** What the tag says, "label: text" -- for its own and its ×'s names. */
  get #spoken() {
    const label = this.getAttribute("label");
    const text = this.textContent.trim();
    return label ? `${label}: ${text}` : text;
  }

  /** What the × does: fire fx:remove, and go unless a listener says no.
   *  (remove() itself is the DOM's, and removes at once.) */
  dismiss() {
    if (!this.isConnected) return;
    const proceed = this.dispatchEvent(new CustomEvent("fx:remove", { bubbles: true, composed: true, cancelable: true }));
    if (proceed) this.remove();
  }

  #render() {
    const root = this.shadowRoot;
    const color = paletteColor(this.getAttribute("color"));
    for (const name of ["--_bg", "--_fg", "--_border"]) this.style.removeProperty(name);
    if (color && !this.selected) {
      const solid = color.explicitStep;
      this.style.setProperty("--_bg", solid ? color.fill : color.tint);
      this.style.setProperty("--_fg", solid ? color.on : color.ink);
      this.style.setProperty("--_border", solid ? color.fill : `color-mix(in srgb, var(--fx-color-${color.family}-50) 40%, transparent)`);
    }

    const selectable = this.hasAttribute("selectable");
    const label = this.getAttribute("label") ?? "";
    const icon = this.getAttribute("icon");
    const inner = `
      <span class="check" aria-hidden="true">${iconSvg("check")}</span>
      <span class="icon" aria-hidden="true">${icon ? iconSvg(icon) : ""}</span>
      <span class="text"><span class="label">${label ? `${escapeHtml(label)}: ` : ""}</span><slot></slot></span>`;
    const remove = this.hasAttribute("removable")
      ? `<button type="button" class="remove" part="remove" aria-label="Remove ${escapeHtml(this.#spoken)}"${this.disabled ? " disabled" : ""}>${iconSvg("close")}</button>`
      : "";
    const holder = root.querySelector(".host-slot");
    const signature = `${selectable}|${Boolean(remove)}|${label}|${icon}|${this.disabled}|${this.#spoken}`;
    if (holder.dataset.signature !== signature) {
      holder.dataset.signature = signature;
      holder.innerHTML = selectable
        ? `<button type="button" class="tag" part="tag" aria-pressed="${this.selected}"${this.disabled ? " disabled" : ""}>${inner}</button>${remove}`
        : `<span class="tag" part="tag">${inner}${remove}</span>`;
      holder.style.display = "contents";
      holder.querySelector("button.tag")?.addEventListener("click", () => {
        if (this.disabled) return;
        this.selected = !this.selected;
        this.dispatchEvent(new Event("change", { bubbles: true }));
      });
      holder.querySelector(".remove")?.addEventListener("click", (event) => {
        event.stopPropagation();
        this.dismiss();
      });
    }
    holder.querySelector("button.tag")?.setAttribute("aria-pressed", String(this.selected));
  }
}

if (!customElements.get("fx-tag")) customElements.define("fx-tag", FxTag);
