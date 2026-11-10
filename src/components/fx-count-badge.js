// <fx-count-badge>: a count beside a label or heading -- <h2>Open <fx-count-badge>4</fx-count-badge></h2>.
// Sized in em, so it scales with the text it sits beside rather than
// imposing one fixed size.
//
//   tone   any status tone (error, warning, success…) for a count that
//          carries a verdict; plain dark otherwise
//   color  a palette color for a count that only needs telling apart:
//          a family (teal, purple…), drawn at its 60 step with white
//          numbers, or a family and step (red-80) -- steps 10-50 take dark
//          numbers, 60-100 white
//
// Or set --fx-count-badge-bg / --fx-count-badge-color.

import { toneCss, toneSelectors } from "../lib/tones.js";
import { paletteColor } from "../lib/palette-color.js";


export class FxCountBadge extends HTMLElement {
  static observedAttributes = ["color"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          min-width: 1.5em;
          min-height: 1.5em;
          padding: 0.15em 0.42em;
          border-radius: 999px;
          background: var(--fx-count-badge-bg, var(--_color-bg, var(--_tone-fill, var(--_tone, var(--fx-text)))));
          color: var(--fx-count-badge-color, var(--_color-on, var(--_tone-on, var(--fx-background))));
          font-family: inherit;
          margin-left: 0.4em;
          font-size: 0.7em;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0;
          text-transform: none;
          font-variant-numeric: tabular-nums;
          vertical-align: 0.1em;
        }
        ${toneCss(':host([tone="&"])')}
        /* Red and green counts: the exact color with white numbers, which read
           better than dark ones at this small, bold size. */
        ${toneSelectors(':host([tone="&"])', "error")},
        ${toneSelectors(':host([tone="&"])', "success")} { --_tone-fill: var(--_tone); --_tone-on: var(--fx-color-white); }
      </style>
      <slot></slot>`;
  }

  attributeChangedCallback() {
    // The palette color as two private properties on the host -- unknown
    // names fall back to the tone or plain dark.
    const color = paletteColor(this.getAttribute("color"));
    if (!color) {
      this.style.removeProperty("--_color-bg");
      this.style.removeProperty("--_color-on");
      return;
    }
    this.style.setProperty("--_color-bg", color.fill);
    this.style.setProperty("--_color-on", color.on);
  }
}

if (!customElements.get("fx-count-badge")) customElements.define("fx-count-badge", FxCountBadge);
