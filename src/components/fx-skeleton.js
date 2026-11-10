// <fx-skeleton>: a gray shape standing in for content that is loading, so
// the page holds its layout and does not jump when it arrives.
//
//   <fx-skeleton lines="3"></fx-skeleton>                  a paragraph
//   <fx-skeleton variant="circle" width="2rem"></fx-skeleton>   an avatar
//   <fx-skeleton variant="rect" height="8rem"></fx-skeleton>    an image, a card
//
// Attributes:
//   variant  text (default) | rect | circle
//   lines    for text: how many lines; the last is shorter (default 1)
//   width    any CSS length (default: the full width; a circle 2rem)
//   height   any CSS length (default: a line of text; a rect 6rem)
//
// Hidden from assistive technology: put aria-busy="true" on what is
// loading, and take the skeletons out when it has. The shimmer stops under
// reduced motion.

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host { display: block; width: var(--_width, 100%); }
    :host([hidden]) { display: none; }
    :host([variant="circle"]) { display: inline-block; width: var(--_width, 2rem); vertical-align: middle; }
    .shapes { display: grid; gap: 0.6em; }
    .shape {
      height: var(--_height, 0.9em);
      border-radius: var(--fx-radius-sm);
      background:
        linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--fx-layer) 60%, transparent) 50%, transparent 100%) 0 0 / 200% 100% no-repeat,
        color-mix(in srgb, var(--fx-text) 10%, transparent);
      animation: fx-skeleton-shimmer 1.5s ease-in-out infinite;
    }
    .shape.short { width: 62%; }
    :host([variant="rect"]) .shape { height: var(--_height, 6rem); border-radius: var(--fx-radius); }
    :host([variant="circle"]) .shape { height: auto; aspect-ratio: 1; border-radius: 50%; }
    @keyframes fx-skeleton-shimmer { from { background-position: 150% 0, 0 0; } to { background-position: -50% 0, 0 0; } }
    @media (prefers-reduced-motion: reduce) { .shape { animation: none; } }
  </style>
  <div class="shapes" part="shapes"></div>
`;

export class FxSkeleton extends HTMLElement {
  static observedAttributes = ["variant", "lines", "width", "height"];

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    this.setAttribute("aria-hidden", "true");
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  #render() {
    const variant = this.getAttribute("variant") ?? "text";
    const width = this.getAttribute("width");
    const height = this.getAttribute("height");
    if (width) this.style.setProperty("--_width", width);
    else this.style.removeProperty("--_width");
    if (height) this.style.setProperty("--_height", height);
    else this.style.removeProperty("--_height");
    const lines = variant === "text" ? Math.max(1, Math.floor(Number(this.getAttribute("lines")) || 1)) : 1;
    this.shadowRoot.querySelector(".shapes").innerHTML = Array.from(
      { length: lines },
      (_, index) => `<div class="shape${lines > 1 && index === lines - 1 ? " short" : ""}" part="shape"></div>`,
    ).join("");
  }
}

if (!customElements.get("fx-skeleton")) customElements.define("fx-skeleton", FxSkeleton);
