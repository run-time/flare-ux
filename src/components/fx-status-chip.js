// <fx-status-chip>: a status, as a small pill -- a dot in the state's exact
// color, then its word, on the state's tint.
//
//   <fx-status-chip tone="error">Failed</fx-status-chip>
//   <fx-status-chip tone="pause" text="Paused"></fx-status-chip>
//   <fx-status-chip tone="pass" variant="solid">Passed</fx-status-chip>
//
// Attributes:
//   tone     error (fail) | incomplete (unknown) | warning (pause) |
//            success (pass) | info | neutral (the default)
//   text     the word, when not given as content
//   variant  tint (the default) | solid (filled in the state's color) |
//            outline (border and dot only)
//   size     sm | md (the default)
//   dot      "false" drops the dot
//   icon     an icon name in place of the dot
//
// It is role="status" only when `live` is set -- most chips are read once,
// with the page, not announced each time they change.

import { escapeHtml } from "../lib/escape.js";
import { toneCss } from "../lib/tones.js";
import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --_tone: var(--fx-status-neutral);
      --_tone-bg: var(--fx-status-neutral-bg);
      --_tone-text: var(--fx-status-neutral-text);
      --_tone-fill: var(--fx-status-neutral-fill);
      --_tone-on: var(--fx-status-neutral-on);
      display: inline-flex;
      vertical-align: middle;
      max-width: 100%;
    }
    :host([hidden]) { display: none; }
    ${toneCss(':host([tone="&"])')}
    .chip {
      display: inline-flex;
      align-items: center;
      gap: var(--fx-spacing-02);
      min-height: 1.5rem;
      max-width: 100%;
      box-sizing: border-box;
      padding: 0 var(--fx-spacing-03);
      border: 1px solid color-mix(in srgb, var(--_tone) 55%, transparent);
      border-radius: var(--fx-radius-pill);
      background: var(--_tone-bg);
      color: var(--_tone-text);
      font: 400 var(--fx-font-size-01) / 1 var(--fx-font);
      white-space: nowrap;
    }
    .text { overflow: hidden; text-overflow: ellipsis; }
    :host([size="sm"]) .chip { min-height: 1.125rem; padding: 0 var(--fx-spacing-02); font-size: 0.6875rem; }
    :host([variant="solid"]) .chip { border-color: var(--_tone-fill); background: var(--_tone-fill); color: var(--_tone-on); font-weight: 600; }
    :host([variant="outline"]) .chip { border-color: var(--_tone); background: transparent; color: var(--fx-text); }
    .dot { flex: none; width: 0.5rem; height: 0.5rem; border-radius: 50%; background: var(--_tone); box-shadow: 0 0 0 1px color-mix(in srgb, var(--fx-text) 12%, transparent); }
    /* On a solid chip the dot is a deep shade of the state's own color, so it
       reads as that color rather than as the text's. */
    :host([variant="solid"]) .dot { background: color-mix(in srgb, var(--_tone-fill) 42%, black); box-shadow: none; }
    :host([dot="false"]) .dot, :host([icon]) .dot { display: none; }
    .icon { display: none; flex: none; }
    :host([icon]) .icon { display: inline-flex; }
    .icon svg { width: 1em; height: 1em; }
  </style>
  <span class="chip" part="chip"><span class="dot" part="dot" aria-hidden="true"></span><span class="icon" part="icon"></span><span class="text" part="text"><slot></slot></span></span>
`;

export class FxStatusChip extends HTMLElement {
  static observedAttributes = ["text", "icon", "live"];

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

  #render() {
    const text = this.getAttribute("text");
    const slot = this.shadowRoot.querySelector("slot");
    // text="…" stands in for content; content wins when both are given.
    slot.innerHTML = text === null ? "" : escapeHtml(text);
    const icon = this.getAttribute("icon");
    this.shadowRoot.querySelector(".icon").innerHTML = icon ? iconSvg(icon) : "";
    if (this.hasAttribute("live")) this.setAttribute("role", "status");
    else if (this.getAttribute("role") === "status") this.removeAttribute("role");
  }
}

if (!customElements.get("fx-status-chip")) customElements.define("fx-status-chip", FxStatusChip);
