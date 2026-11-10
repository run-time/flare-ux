// <fx-dialog>: Material 3's dialog -- a headline, the content, and the
// actions in a row at the bottom -- on a native modal <dialog>, so focus is
// held inside, Escape closes it and it sits above everything.
//
//   <fx-dialog headline="Rename project" dismissible>
//     <form method="dialog" id="f">…fields…</form>
//     <fx-button slot="actions" variant="text" data-close>Cancel</fx-button>
//     <fx-button slot="actions" variant="filled" type="submit" form="f">Save</fx-button>
//   </fx-dialog>
//
// Attributes: headline, open (reflects), dismissible (a click on the
// backdrop closes it), wide, tone (accent, or a status tone -- error,
// warning, success… -- for the headline bar's color; plain when unset), label (aria-label when there is no headline).
// Methods as <dialog>: showModal(), show(), close(returnValue),
// returnValue, open. Events: `close` and `cancel`, as <dialog> fires them.
// Anything inside with [data-close] closes it when clicked. A
// <form method="dialog"> inside closes it on submit, with its submitter's
// value as returnValue.

import { escapeHtml } from "../lib/escape.js";
import { toneCss } from "../lib/tones.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host { display: contents; }
    dialog {
      width: min(32rem, calc(100vw - 2rem));
      max-height: calc(100vh - 2rem);
      padding: 0;
      overflow: hidden;
      border: 0;
      border-radius: var(--fx-radius-lg);
      background: var(--fx-layer);
      color: var(--fx-text);
      box-shadow: var(--fx-shadow-lg);
    }
    :host([wide]) dialog { width: min(44rem, calc(100vw - 2rem)); }
    dialog[open] { display: flex; flex-direction: column; }
    dialog::backdrop { background: var(--fx-overlay); }
    .head { flex: none; padding: var(--fx-spacing-05) var(--fx-spacing-05) var(--fx-spacing-03); font: var(--fx-type-heading-03); }
    .head:empty { display: none; }
    :host([tone]) .head { padding: var(--fx-spacing-04) var(--fx-spacing-05); color: var(--_tone-on); background: var(--_tone); font: var(--fx-type-heading-02); }
    :host([tone="accent"]) { --_tone: var(--fx-interactive); --_tone-on: var(--fx-text-on-color); }
    ${toneCss(':host([tone="&"])')}
    :host([tone="high"]) { --_tone: var(--fx-status-error-fill); --_tone-on: var(--fx-status-error-on); }
    :host([tone="medium"]) { --_tone: var(--fx-status-warning-fill); --_tone-on: var(--fx-status-warning-on); }
    .body { flex: 1; min-height: 0; overflow: auto; padding: var(--fx-spacing-03) var(--fx-spacing-05) var(--fx-spacing-06); font: var(--fx-type-body-01); }
    .actions { flex: none; display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: var(--fx-spacing-03); padding: var(--fx-spacing-04) var(--fx-spacing-05) var(--fx-spacing-05); border-top: 1px solid var(--fx-border); background: var(--fx-layer-alt); }
    .actions[hidden] { display: none; }
    ::slotted([slot="actions"][data-start]) { margin-right: auto; }
  </style>
  <dialog part="dialog">
    <div class="head" part="headline"></div>
    <div class="body" part="body"><slot></slot></div>
    <div class="actions" part="actions"><slot name="actions"></slot></div>
  </dialog>
`;

export class FxDialog extends HTMLElement {
  static observedAttributes = ["headline", "label", "open"];

  #dialog;

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    this.#dialog = this.shadowRoot.querySelector("dialog");
    // No actions given: no empty row at the bottom.
    const actions = this.shadowRoot.querySelector('slot[name="actions"]');
    actions.addEventListener("slotchange", () => {
      actions.parentElement.hidden = actions.assignedElements().length === 0;
    });
    actions.parentElement.hidden = true;
    // The native dialog's close and cancel, as this element's own.
    this.#dialog.addEventListener("close", () => {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    });
    this.#dialog.addEventListener("cancel", (event) => {
      const cancel = new Event("cancel", { cancelable: true });
      if (!this.dispatchEvent(cancel)) event.preventDefault();
    });
    // A click on the backdrop lands on the dialog itself.
    this.#dialog.addEventListener("click", (event) => {
      if (event.target === this.#dialog && this.hasAttribute("dismissible")) this.close();
    });
    this.addEventListener("click", (event) => {
      if (event.target.closest?.("[data-close]") && this.contains(event.target)) this.close();
    });
    this.addEventListener("submit", (event) => {
      const form = event.target;
      if (form.getAttribute?.("method") === "dialog" && !event.defaultPrevented) {
        event.preventDefault();
        this.close(event.submitter?.value ?? "");
      }
    });
  }

  attributeChangedCallback(name) {
    if (name === "open") {
      if (this.hasAttribute("open") && !this.#dialog.open) this.#dialog.showModal();
      else if (!this.hasAttribute("open") && this.#dialog.open) this.#dialog.close();
      return;
    }
    const headline = this.getAttribute("headline") ?? "";
    const head = this.shadowRoot.querySelector(".head");
    head.innerHTML = escapeHtml(headline);
    head.id = "headline";
    if (headline) this.#dialog.setAttribute("aria-labelledby", "headline");
    else this.#dialog.removeAttribute("aria-labelledby");
    const label = this.getAttribute("label");
    if (label) this.#dialog.setAttribute("aria-label", label);
    else this.#dialog.removeAttribute("aria-label");
  }

  get open() {
    return this.#dialog.open;
  }
  set open(value) {
    this.toggleAttribute("open", Boolean(value));
  }

  get returnValue() {
    return this.#dialog.returnValue;
  }
  set returnValue(value) {
    this.#dialog.returnValue = value;
  }

  showModal() {
    if (!this.#dialog.open) this.#dialog.showModal();
    this.toggleAttribute("open", true);
    // The first [autofocus] inside, else the first field.
    const first = this.querySelector("[autofocus]") ?? this.querySelector("fx-text-field, fx-select, input, textarea, select");
    first?.focus?.();
  }

  show() {
    this.showModal();
  }

  close(returnValue) {
    if (!this.#dialog.open) return;
    this.#dialog.close(returnValue === undefined ? undefined : String(returnValue));
  }
}

if (!customElements.get("fx-dialog")) customElements.define("fx-dialog", FxDialog);
