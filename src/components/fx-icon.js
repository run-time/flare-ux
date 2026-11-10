// <fx-icon>: one icon from the registry (icons/registry.js) -- the Flare UX
// set (icons/core.js), or any set an app registers.
//
//   <fx-icon name="refresh"></fx-icon>
//   <fx-icon name="warning" size="20" style="color: var(--fx-status-error)"></fx-icon>
//   <fx-icon name="close" label="Close"></fx-icon>
//
// Attributes:
//   name   the icon's name; `set:name` picks a set (core, or one
//          registered with registerIconSet)
//   size   16 | 20 | 24 | 32 (px), or any CSS length; default 1em, so an
//          icon in text is the text's size
//   label  what the icon means, when it means something on its own: it is
//          then an image with that name. Without one it is decoration,
//          hidden from assistive technology -- the text beside it speaks.
//
// It draws in currentColor: set `color` to recolor it.

import { iconSvg, onIconSetRegistered } from "../icons/registry.js";
import "../icons/core.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: var(--_size, 1em);
      height: var(--_size, 1em);
      vertical-align: -0.125em;
      line-height: 0;
      color: inherit;
    }
    :host([hidden]) { display: none; }
    svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .glyph { display: contents; }
  </style>
  <span class="glyph" part="svg"></span>
`;

const drawn = new Set();
onIconSetRegistered(() => {
  for (const icon of drawn) icon.render();
});

export class FxIcon extends HTMLElement {
  static observedAttributes = ["name", "size", "label"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    drawn.add(this);
    this.render();
  }

  disconnectedCallback() {
    drawn.delete(this);
  }

  attributeChangedCallback() {
    this.render();
  }

  get name() {
    return this.getAttribute("name") ?? "";
  }
  set name(value) {
    this.setAttribute("name", String(value ?? ""));
  }

  render() {
    const size = this.getAttribute("size");
    if (size) this.style.setProperty("--_size", /^\d+(\.\d+)?$/.test(size) ? `${size}px` : size);
    else this.style.removeProperty("--_size");

    const label = this.getAttribute("label");
    if (label) {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", label);
      this.removeAttribute("aria-hidden");
    } else {
      this.removeAttribute("role");
      this.removeAttribute("aria-label");
      this.setAttribute("aria-hidden", "true");
    }

    this.shadowRoot.querySelector(".glyph").innerHTML = iconSvg(this.name);
  }
}

if (!customElements.get("fx-icon")) customElements.define("fx-icon", FxIcon);
