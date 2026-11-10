// <fx-notification>: an inline notification -- a
// bar in the state's color down the left, its icon, a title, a line of
// detail, and optionally actions and a close button.
//
//   <fx-notification tone="error" headline="Build failed">3 tests did not pass.</fx-notification>
//   <fx-notification tone="pause" headline="Sync paused" dismissible>
//     Resumes at midnight.
//     <fx-button slot="actions" variant="text" size="sm">Resume now</fx-button>
//   </fx-notification>
//
// Attributes:
//   tone         error (fail) | incomplete (unknown) | warning (pause) |
//                success (pass) | info (the default) | neutral
//   headline     the bold first words
//   dismissible  a close button; closing hides it and fires `fx:dismiss`
//                (cancelable -- preventDefault keeps it open)
//   low-contrast the state's tint as the background rather than the layer
//
// role="alert" for error, "status" for everything else, so a notification
// added to the page is announced at the urgency it deserves.

import { escapeHtml } from "../lib/escape.js";
import { toneCss, toneOf } from "../lib/tones.js";
import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";

const ICON = {
  error: "status-error",
  incomplete: "status-pending",
  warning: "status-warn",
  success: "status-ok",
  info: "status-info",
  neutral: "status-info",
};

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --_tone: var(--fx-status-info);
      --_tone-bg: var(--fx-status-info-bg);
      --_tone-text: var(--fx-status-info-text);
      display: block;
      font: var(--fx-type-body-compact-01);
      color: var(--fx-text);
    }
    :host([hidden]) { display: none; }
    ${toneCss(':host([tone="&"])')}
    .box {
      display: flex;
      align-items: flex-start;
      gap: var(--fx-spacing-04);
      padding: var(--fx-spacing-04) var(--fx-spacing-03) var(--fx-spacing-04) var(--fx-spacing-05);
      border: 1px solid var(--fx-border);
      border-left: 4px solid var(--_tone);
      border-radius: var(--fx-radius);
      background: var(--fx-layer);
      box-shadow: var(--fx-shadow-sm);
    }
    :host([low-contrast]) .box { background: var(--_tone-bg); border-color: color-mix(in srgb, var(--_tone) 45%, transparent); border-left-color: var(--_tone); box-shadow: none; }
    .icon { flex: none; display: inline-flex; margin-top: 0.05rem; color: var(--_tone-text); }
    .icon svg { width: 1.25rem; height: 1.25rem; }
    :host([tone="warning"]) .icon, :host([tone="pause"]) .icon, :host([tone="warn"]) .icon { color: var(--fx-status-warning-text); }
    .content { flex: 1; min-width: 0; padding-top: 0.1rem; }
    .title { font-weight: 600; margin-right: var(--fx-spacing-02); }
    .title:empty { display: none; }
    .body { color: var(--fx-text); }
    .actions { display: flex; flex-wrap: wrap; gap: var(--fx-spacing-03); margin-top: var(--fx-spacing-03); }
    .actions:not(.has) { display: none; }
    .close {
      all: unset;
      flex: none;
      display: none;
      place-items: center;
      width: var(--fx-size-sm);
      height: var(--fx-size-sm);
      margin: calc(-1 * var(--fx-spacing-02)) 0;
      border-radius: var(--fx-radius);
      color: var(--fx-text-secondary);
      cursor: pointer;
    }
    :host([dismissible]) .close { display: grid; }
    .close:hover { background: var(--fx-layer-hover); color: var(--fx-text); }
    .close:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: -2px; }
    .close svg { width: 1rem; height: 1rem; }
  </style>
  <div class="box" part="box">
    <span class="icon" part="icon"></span>
    <div class="content">
      <span class="title" part="title"></span><span class="body" part="body"><slot></slot></span>
      <div class="actions" part="actions"><slot name="actions"></slot></div>
    </div>
    <button type="button" class="close" part="close" aria-label="Dismiss">${iconSvg("close")}</button>
  </div>
`;

export class FxNotification extends HTMLElement {
  static observedAttributes = ["tone", "headline"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    this.shadowRoot.querySelector(".close").addEventListener("click", () => this.dismiss());
    const actions = this.shadowRoot.querySelector('slot[name="actions"]');
    actions.addEventListener("slotchange", () => {
      actions.parentElement.classList.toggle("has", actions.assignedElements().length > 0);
    });
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  /** Close it, unless an fx:dismiss listener says not to. */
  dismiss() {
    const event = new CustomEvent("fx:dismiss", { bubbles: true, composed: true, cancelable: true });
    if (this.dispatchEvent(event)) this.hidden = true;
  }

  #render() {
    const tone = toneOf(this.getAttribute("tone"), "info");
    this.shadowRoot.querySelector(".icon").innerHTML = iconSvg(ICON[tone]);
    const title = this.getAttribute("headline") ?? "";
    this.shadowRoot.querySelector(".title").innerHTML = escapeHtml(title);
    this.setAttribute("role", tone === "error" ? "alert" : "status");
  }
}

if (!customElements.get("fx-notification")) customElements.define("fx-notification", FxNotification);
