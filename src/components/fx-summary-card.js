// <fx-summary-card>: one number and what it counts, with a bar in a color
// down its left edge -- a row of them makes a page's headline figures.
//
//   <fx-summary-card count="12" text="Open" color="info"></fx-summary-card>
//   <fx-summary-card count="3" text="Failing" color="error" tinted icon="warning"></fx-summary-card>
//
// Attributes:
//   count           the number (or any short value)
//   text            what it counts; a newline in it breaks the line there
//   color           a status tone (error, incomplete, warning, success, info,
//                   neutral, or fail / unknown / pause / pass) or any CSS
//                   color; the default is the text color
//   tinted          the tone's tint as the background, for a figure that
//                   carries a verdict rather than a total
//   icon            an icon name before the text
//   href            makes the card a link
//   show-when-zero  a zero count is hidden unless this is set
//
// Lay several out with display: flex; flex-wrap: wrap -- each card is only
// as wide as its label needs.

import { escapeHtml } from "../lib/escape.js";
import { TONES, toneCss, toneOf } from "../lib/tones.js";
import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --_tone: var(--fx-text);
      --_tone-text: var(--fx-text);
      --_tone-bg: var(--fx-layer);
      display: block;
      max-width: fit-content;
      min-width: 8rem;
    }
    :host([hidden]) { display: none; }
    ${toneCss(':host([data-tone="&"])')}
    .card {
      display: block;
      height: 100%;
      box-sizing: border-box;
      padding: var(--fx-spacing-05);
      border: 1px solid var(--fx-border);
      border-left: 4px solid var(--_tone);
      border-radius: var(--fx-radius);
      background: var(--fx-layer);
      color: inherit;
      text-decoration: none;
    }
    a.card:hover { background: var(--fx-layer-hover); }
    a.card:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: 2px; }
    :host([tinted]) .card { background: var(--_tone-bg); }
    .count { color: var(--_tone-text); font: 400 var(--fx-font-size-07) / 1.1 var(--fx-font); font-variant-numeric: tabular-nums; }
    .text {
      display: flex;
      align-items: flex-start;
      gap: var(--fx-spacing-02);
      margin-top: var(--fx-spacing-02);
      color: var(--fx-text-secondary);
      font: var(--fx-type-body-compact-01);
      white-space: pre-line;
    }
    .icon { display: inline-flex; align-items: center; height: 1lh; color: var(--_tone-text); flex: none; }
    .icon:empty { display: none; }
    .icon svg { width: 1rem; height: 1rem; }
  </style>
  <div class="card" part="card"><div class="count" part="count"></div><div class="text" part="text"><span class="icon"></span><span class="label"></span></div></div>
`;

export class FxSummaryCard extends HTMLElement {
  static observedAttributes = ["color", "count", "text", "icon", "href", "show-when-zero"];

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
    const count = this.getAttribute("count") ?? "0";
    const showZero = this.hasAttribute("show-when-zero") && !["false", "0", "no", "off"].includes((this.getAttribute("show-when-zero") || "").toLowerCase());
    this.hidden = Number(count) === 0 && count.trim() !== "" && !showZero;

    // A tone by any of its names; else a CSS color as it is.
    const color = this.getAttribute("color") ?? "";
    const tone = toneOf(color, "");
    if (tone && TONES.includes(tone)) {
      this.dataset.tone = tone;
      this.style.removeProperty("--_tone");
      this.style.removeProperty("--_tone-text");
    } else {
      delete this.dataset.tone;
      if (color) {
        this.style.setProperty("--_tone", color);
        this.style.setProperty("--_tone-text", color);
      } else {
        this.style.removeProperty("--_tone");
        this.style.removeProperty("--_tone-text");
      }
    }

    // A link when it has somewhere to go.
    const href = this.getAttribute("href");
    let card = this.shadowRoot.querySelector(".card");
    const wantTag = href ? "a" : "div";
    if (card.localName !== wantTag) {
      const next = document.createElement(wantTag);
      next.className = "card";
      next.setAttribute("part", "card");
      next.append(...card.childNodes);
      card.replaceWith(next);
      card = next;
    }
    if (href) card.setAttribute("href", href);

    this.shadowRoot.querySelector(".count").textContent = count;
    this.shadowRoot.querySelector(".label").innerHTML = escapeHtml(this.getAttribute("text") ?? "");
    const icon = this.getAttribute("icon");
    this.shadowRoot.querySelector(".icon").innerHTML = icon ? iconSvg(icon) : "";
  }
}

if (!customElements.get("fx-summary-card")) customElements.define("fx-summary-card", FxSummaryCard);
