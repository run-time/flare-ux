// <fx-spinner>: a ring spinner -- an arc that breathes as it turns, with a
// fading tail. Three properties:
//
//   size      number   width and height in px            default 64
//   fgColor   string   the moving arc and its fading tail default --fx-interactive
//                       (attribute fg-color)
//   bgColor   string   the gutter ring behind it          default transparent
//                       (attribute bg-color)
//
//   <fx-spinner></fx-spinner>
//   <fx-spinner size="32" fg-color="var(--fx-color-teal-50)" bg-color="var(--fx-color-teal-20)"></fx-spinner>
//   spinner.size = 80; spinner.fgColor = "var(--fx-color-purple-60)";
//
// The drawing: three circles of radius 45 in a 100 x 100 box, stroked 10
// wide with round caps.
//   background  the full ring, in bgColor
//   foreground  an arc (dash 270) turned half way round, its dash offset
//               breathing 270 -> 160 -> 270 over 6s, ease-in-out
//   tail        the ring's lower half (clipped), stroked with a gradient
//               from fgColor to transparent at 90% -- the fading trail
// and the whole SVG turning once every 1.6s, linear.
//
// In the shadow DOM, so the clip path and gradient ids are this spinner's
// own. Under reduced motion it turns slowly instead of spinning.
// It says "Loading" to assistive technology (role="status"); give it an
// aria-label to say something else.

const DEFAULT_SIZE = 64;
const DEFAULT_FG = "var(--fx-interactive)";
const DEFAULT_BG = "transparent";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: inline-block;
      vertical-align: middle;
      line-height: 0;
    }
    :host([hidden]) { display: none; }
    svg {
      /* Block, so the host is exactly size x size -- inline, the SVG would
         sit on the text baseline and leave a gap under it. */
      display: block;
      animation: 1.6s linear infinite fx-spinner-rotate;
      width: var(--size);
      height: var(--size);
    }
    .foreground {
      animation: 6s ease-in-out infinite both fx-spinner-modulate;
      display: block;
      fill: transparent;
      stroke: var(--fg);
      stroke-linecap: round;
      stroke-dasharray: 270;
      stroke-dashoffset: 270;
      stroke-width: 10;
      transform-origin: 50% 50%;
      transform: rotate(180deg);
    }
    .background {
      display: block;
      fill: transparent;
      stroke: var(--bg);
      stroke-linecap: round;
      stroke-width: 10;
      transform-origin: 50% 50%;
    }
    .stop { stop-color: var(--fg); }
    .tail {
      display: block;
      fill: transparent;
      stroke-linecap: round;
      stroke-width: 10;
      transform-origin: 50% 50%;
    }
    @media (prefers-reduced-motion: reduce) {
      svg { animation-duration: 6s; }
      .foreground { animation: none; stroke-dashoffset: 200; }
    }
    @keyframes fx-spinner-rotate {
      0% { transform: rotateZ(0deg); }
      100% { transform: rotateZ(360deg); }
    }
    @keyframes fx-spinner-modulate {
      0% { stroke-dashoffset: 270; }
      30% { stroke-dashoffset: 160; }
      100% { stroke-dashoffset: 270; }
    }
  </style>
  <svg height="100" viewBox="0 0 100 100" width="100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <defs>
      <clipPath id="cut-off">
        <rect height="100" width="100" x="0" y="50"></rect>
      </clipPath>
      <linearGradient id="spin-gradient">
        <stop class="stop" offset="0"></stop>
        <stop class="stop" offset="90%" stop-opacity="0"></stop>
      </linearGradient>
    </defs>
    <circle class="background" cx="50" cy="50" r="45"></circle>
    <circle class="foreground" cx="50" cy="50" r="45"></circle>
    <circle class="tail" clip-path="url(#cut-off)" cx="50" cy="50" r="45" stroke="url(#spin-gradient)"></circle>
  </svg>
`;

export class FxSpinner extends HTMLElement {
  static get observedAttributes() {
    return ["size", "fg-color", "bg-color"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    if (!this.hasAttribute("role")) this.setAttribute("role", "status");
    if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Loading");
    // A property set before the element was upgraded sits on the instance
    // and hides the setter: take it off and set it through the setter.
    for (const name of ["size", "fgColor", "bgColor"]) {
      if (Object.prototype.hasOwnProperty.call(this, name)) {
        const value = this[name];
        delete this[name];
        this[name] = value;
      }
    }
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  /** Width and height in px. Anything that is not a positive number is the default, 64. */
  get size() {
    const value = Number(this.getAttribute("size"));
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_SIZE;
  }
  set size(value) {
    if (value === null || value === undefined || value === "") this.removeAttribute("size");
    else this.setAttribute("size", String(value));
  }

  /** The arc and tail color: any CSS color. Empty is the default, --fx-interactive. */
  get fgColor() {
    return this.getAttribute("fg-color") || DEFAULT_FG;
  }
  set fgColor(value) {
    if (value) this.setAttribute("fg-color", String(value));
    else this.removeAttribute("fg-color");
  }

  /** The gutter ring's color: any CSS color. Empty is the default, transparent. */
  get bgColor() {
    return this.getAttribute("bg-color") || DEFAULT_BG;
  }
  set bgColor(value) {
    if (value) this.setAttribute("bg-color", String(value));
    else this.removeAttribute("bg-color");
  }

  #render() {
    const svg = this.shadowRoot.querySelector("svg");
    svg.style.setProperty("--size", `${this.size}px`);
    svg.style.setProperty("--fg", this.fgColor);
    svg.style.setProperty("--bg", this.bgColor);
  }
}

/**
 * A small spinner to put in front of a "working on it" message, as HTML. Hidden from assistive technology: the message beside it
 * says what is happening. Its container takes class "fx-busy" for spacing.
 * `fg` and `bg` recolor it, for one on a colored button.
 */
export function busySpinnerHtml(size = 16, { fg = "var(--fx-interactive)", bg = "var(--fx-interactive-subtle)" } = {}) {
  const attr = (value) => String(value).replace(/[&"<>]/g, (c) => `&#${c.charCodeAt(0)};`);
  return `<fx-spinner size="${Number(size) || 16}" fg-color="${attr(fg)}" bg-color="${attr(bg)}" aria-hidden="true"></fx-spinner>`;
}

if (!customElements.get("fx-spinner")) customElements.define("fx-spinner", FxSpinner);
