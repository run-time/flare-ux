// <fx-avatar>: a person -- their photo in a circle, or their initials when
// there is none (or it fails to load).
//
//   <fx-avatar name="Ada Lovelace" src="/ada.jpg"></fx-avatar>
//   <fx-avatar name="Grace Hopper" size="lg"></fx-avatar>        GH
//
// Attributes:
//   name    who it is: their initials (the first letter of up to two
//           words), and their name for assistive technology
//   src     a photo; the initials stand in until it loads, and stay if it
//           fails
//   size    xs (20px) | sm (24px) | md (32px, default) | lg (40px) |
//           xl (64px), or any CSS length
//   shape   circle (default) | square
//   color   a palette family for the initials' circle; without one each
//           name gets its own, the same every time
//   status  a dot at the corner: a status tone (pass, fail, …), or
//           "online" / "away" / "busy"
//   decorative  no name for assistive technology -- when a name is written
//           beside it already
//
// The initials come from the name's words that start with a letter, as
// factory-ui's people do: "Ada Lovelace" is AL, "ada" is A.

import { paletteColor } from "../lib/palette-color.js";
import { toneOf } from "../lib/tones.js";

const FAMILIES = ["red", "orange", "yellow", "green", "teal", "blue", "purple", "magenta"];
const SIZES = { xs: "1.25rem", sm: "1.5rem", md: "2rem", lg: "2.5rem", xl: "4rem" };
const PRESENCE = { online: "success", away: "warning", busy: "error" };

/** The initials for a name: the first letter of up to two of its words. */
export function initialsOf(name) {
  return String(name ?? "")
    .split(/\s+/)
    .filter((part) => /^\p{L}/u.test(part))
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

/** A palette family for a name -- the same name, the same color. */
function familyFor(name) {
  let hash = 0;
  for (const char of String(name)) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  return FAMILIES[hash % FAMILIES.length];
}

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --_size: 2rem;
      position: relative;
      display: inline-flex;
      flex: none;
      width: var(--_size);
      height: var(--_size);
      vertical-align: middle;
    }
    :host([hidden]) { display: none; }
    .face {
      display: grid;
      place-items: center;
      width: 100%;
      height: 100%;
      overflow: hidden;
      border-radius: 50%;
      background: var(--_bg);
      color: var(--_ink);
      font: 600 calc(var(--_size) * 0.4) / 1 var(--fx-font);
      letter-spacing: 0.02em;
      user-select: none;
    }
    :host([shape="square"]) .face { border-radius: var(--fx-radius); }
    img { grid-area: 1 / 1; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity var(--fx-duration-fast-02) var(--fx-easing-standard); }
    img.loaded { opacity: 1; }
    .initials { grid-area: 1 / 1; }
    .status {
      position: absolute;
      right: -1px;
      bottom: -1px;
      width: max(0.5rem, calc(var(--_size) * 0.28));
      height: max(0.5rem, calc(var(--_size) * 0.28));
      box-sizing: border-box;
      border: 2px solid var(--fx-layer);
      border-radius: 50%;
      background: var(--_status);
    }
    .status[hidden] { display: none; }
  </style>
  <span class="face" part="face"><span class="initials" part="initials"></span><img alt="" part="image" hidden></span>
  <span class="status" part="status" hidden></span>
`;

export class FxAvatar extends HTMLElement {
  static observedAttributes = ["name", "src", "size", "color", "status", "decorative"];

  #internals = this.attachInternals();

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.appendChild(template.content.cloneNode(true));
    const img = root.querySelector("img");
    img.addEventListener("load", () => img.classList.add("loaded"));
    img.addEventListener("error", () => (img.hidden = true));
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback(name) {
    this.#render(name);
  }

  #render(changed) {
    const root = this.shadowRoot;
    const name = this.getAttribute("name") ?? "";
    const size = this.getAttribute("size");
    this.style.setProperty("--_size", SIZES[size] ?? (size || SIZES.md));

    const color = paletteColor(this.getAttribute("color")) ?? paletteColor(familyFor(name));
    this.style.setProperty("--_bg", `var(--fx-color-${color.family}-20)`);
    this.style.setProperty("--_ink", `var(--fx-color-${color.family}-80)`);
    root.querySelector(".initials").textContent = initialsOf(name) || "?";

    const img = root.querySelector("img");
    const src = this.getAttribute("src");
    if (changed === "src" || changed === undefined) {
      img.classList.remove("loaded");
      img.hidden = !src;
      if (src) img.src = src;
      else img.removeAttribute("src");
    }

    const status = this.getAttribute("status");
    const dot = root.querySelector(".status");
    dot.hidden = !status;
    if (status) dot.style.setProperty("--_status", `var(--fx-status-${PRESENCE[status] ?? toneOf(status)})`);

    const internals = this.#internals;
    if (this.hasAttribute("decorative") || !name) {
      internals.role = null;
      internals.ariaLabel = null;
      this.setAttribute("aria-hidden", "true");
    } else {
      this.removeAttribute("aria-hidden");
      internals.role = "img";
      internals.ariaLabel = status ? `${name} (${status})` : name;
    }
  }
}

if (!customElements.get("fx-avatar")) customElements.define("fx-avatar", FxAvatar);
