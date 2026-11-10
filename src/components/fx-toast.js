// <fx-toast>: a small message that pops up in the lower-right corner of the
// page and goes away on its own -- "Copied", "Saved". A persistent one stays
// until its close button is clicked.
//
//   import { toast } from "@run-time/flare-ux/components/fx-toast.js";
//   toast("Copied #ff8389");                                    // gone after 4s
//   toast("Saved", { tone: "success" });
//   toast("Lost the connection", { tone: "error", persistent: true });
//
//   <fx-toast id="saved" tone="pass">Saved</fx-toast>           // hidden until…
//   document.getElementById("saved").show();
//
// Attributes:
//   tone        error (fail) | incomplete (unknown) | warning (pause) |
//               success (pass) | info | neutral; without one it takes the
//               tooltip's colors
//   duration    milliseconds on screen (default 4000)
//   persistent  stays until closed
//
// Toasts stack in one region in the top layer, newest at the bottom, so they
// show above dialogs. The timer waits while the pointer or focus is on a
// toast. Closing fires `fx:close`. role="status" (role="alert" for error), so
// a screen reader announces each one.

import { escapeHtml } from "../lib/escape.js";
import { toneCss, toneOf } from "../lib/tones.js";
import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";

const DEFAULT_DURATION = 4000;

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      --_bg: var(--fx-inverse);
      --_fg: var(--fx-inverse-text);
      --_edge: transparent;
      display: none;
      pointer-events: auto;
    }
    :host([open]) { display: block; }
    ${toneCss(':host([tone="&"])')}
    :host([tone]) { --_bg: var(--_tone-bg); --_fg: var(--fx-text); --_edge: var(--_tone); }
    .toast {
      display: flex;
      align-items: center;
      gap: var(--fx-spacing-03);
      min-height: var(--fx-size-md);
      max-width: 24rem;
      box-sizing: border-box;
      padding: var(--fx-spacing-02) var(--fx-spacing-02) var(--fx-spacing-02) var(--fx-spacing-04);
      border-radius: var(--fx-radius);
      border-inline-start: 3px solid var(--_edge);
      background: var(--_bg);
      color: var(--_fg);
      box-shadow: var(--fx-shadow);
      font: var(--fx-type-body-compact-01);
      overflow-wrap: anywhere;
      animation: fx-toast-in var(--fx-duration-moderate-01, 150ms) var(--fx-easing-entrance, ease-out);
    }
    :host([leaving]) .toast { animation: fx-toast-out var(--fx-duration-fast-02, 100ms) var(--fx-easing-exit, ease-in) forwards; }
    .message { flex: 1; min-width: 0; padding-block: var(--fx-spacing-02); }
    /* Code in the message reads in the toast's colors, not the page's code
       style -- unless it brings its own (a style attribute). */
    ::slotted(code:not([style])) {
      padding: 0 !important;
      border: 0 !important;
      background: none !important;
      color: inherit !important;
      font: 600 0.9em var(--fx-font-mono) !important;
    }
    .close {
      all: unset;
      flex: none;
      display: inline-grid;
      place-items: center;
      width: var(--fx-size-sm);
      height: var(--fx-size-sm);
      border-radius: var(--fx-radius-sm);
      cursor: pointer;
      color: inherit;
      opacity: 0.8;
    }
    .close:hover { opacity: 1; background: color-mix(in srgb, currentColor 12%, transparent); }
    .close:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: -2px; }
    .close svg { width: 1rem; height: 1rem; }
    @keyframes fx-toast-in { from { opacity: 0; transform: translateY(0.5rem); } }
    @keyframes fx-toast-out { to { opacity: 0; transform: translateY(0.5rem); } }
    @media (prefers-reduced-motion: reduce) { .toast, :host([leaving]) .toast { animation: none; } }
  </style>
  <div class="toast" part="toast">
    <div class="message" part="message"><slot></slot></div>
    <button type="button" class="close" part="close" aria-label="Close">${iconSvg("close")}</button>
  </div>
`;

// --------------------------------------------------------------- the region

let region = null;

/** The corner every toast stacks in -- a manual popover, so it sits in the top layer. */
function toastRegion() {
  if (region?.isConnected) return region;
  region = document.createElement("div");
  region.className = "fx-toast-region";
  region.setAttribute("popover", "manual");
  region.style.cssText = [
    "position: fixed",
    "inset: auto var(--fx-spacing-05, 1rem) var(--fx-spacing-05, 1rem) auto",
    "margin: 0",
    "padding: 0",
    "border: 0",
    "background: transparent",
    "overflow: visible",
    "display: flex",
    "flex-direction: column",
    "align-items: flex-end",
    "gap: var(--fx-spacing-03, 0.5rem)",
    "max-width: calc(100vw - 2 * var(--fx-spacing-05, 1rem))",
    "pointer-events: none",
  ].join(";");
  document.body.append(region);
  return region;
}

/** Bring the region to the top of the top layer -- above a dialog opened since. */
function raiseRegion() {
  const r = toastRegion();
  try {
    if (r.matches(":popover-open")) r.hidePopover();
    r.showPopover();
  } catch {}
}

function maybeHideRegion() {
  if (region && !region.querySelector("fx-toast[open]")) {
    try {
      region.hidePopover();
    } catch {}
  }
}

// ---------------------------------------------------------------- the toast

export class FxToast extends HTMLElement {
  static observedAttributes = ["tone"];

  #timer = 0;
  #leaving = 0;
  #remaining = 0;
  #started = 0;
  #held = 0;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.appendChild(template.content.cloneNode(true));
    root.querySelector(".close").addEventListener("click", () => this.close());
    const hold = () => {
      this.#held++;
      this.#pause();
    };
    const release = () => {
      this.#held = Math.max(0, this.#held - 1);
      if (!this.#held) this.#resume();
    };
    this.addEventListener("pointerenter", hold);
    this.addEventListener("pointerleave", release);
    this.addEventListener("focusin", hold);
    this.addEventListener("focusout", release);
  }

  connectedCallback() {
    this.#syncRole();
  }

  attributeChangedCallback() {
    this.#syncRole();
  }

  get tone() {
    return this.getAttribute("tone") ?? "";
  }
  set tone(value) {
    if (value) this.setAttribute("tone", value);
    else this.removeAttribute("tone");
  }

  get duration() {
    const value = Number(this.getAttribute("duration"));
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_DURATION;
  }
  set duration(value) {
    this.setAttribute("duration", String(value));
  }

  get persistent() {
    return this.hasAttribute("persistent");
  }
  set persistent(value) {
    this.toggleAttribute("persistent", Boolean(value));
  }

  get open() {
    return this.hasAttribute("open");
  }

  /** Pop it up in the corner; it leaves on its own unless persistent. */
  show() {
    const r = toastRegion();
    if (this.parentElement !== r) r.append(this);
    clearTimeout(this.#leaving);
    this.removeAttribute("leaving");
    this.setAttribute("open", "");
    raiseRegion();
    clearTimeout(this.#timer);
    this.#remaining = this.persistent ? 0 : this.duration;
    if (!this.#held) this.#resume();
    return this;
  }

  /** Take it away and fire `fx:close`. */
  close() {
    if (!this.open || this.hasAttribute("leaving")) return;
    clearTimeout(this.#timer);
    this.#timer = 0;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.setAttribute("leaving", "");
    const done = () => {
      this.removeAttribute("open");
      this.removeAttribute("leaving");
      // Fire while still in the page, so the event bubbles to the document.
      this.dispatchEvent(new CustomEvent("fx:close", { bubbles: true, composed: true }));
      if (this.dataset.fxTransient !== undefined) this.remove();
      maybeHideRegion();
    };
    if (reduce) done();
    else this.#leaving = setTimeout(done, 100);
  }

  #pause() {
    if (!this.#remaining || !this.#timer) return;
    clearTimeout(this.#timer);
    this.#timer = 0;
    this.#remaining = Math.max(500, this.#remaining - (Date.now() - this.#started));
  }

  #resume() {
    if (!this.open || !this.#remaining) return;
    this.#started = Date.now();
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.close(), this.#remaining);
  }

  #syncRole() {
    this.setAttribute("role", toneOf(this.tone, "") === "error" ? "alert" : "status");
  }
}

/**
 * Pop up a toast with `message` (text, or HTML when `html: true`).
 * Returns the toast, which removes itself once closed.
 */
export function toast(message, { tone = "", duration, persistent = false, html = false } = {}) {
  const el = document.createElement("fx-toast");
  el.dataset.fxTransient = "";
  if (tone) el.tone = tone;
  if (duration) el.duration = duration;
  if (persistent) el.persistent = true;
  el.innerHTML = html ? String(message) : escapeHtml(String(message));
  return el.show();
}

if (!customElements.get("fx-toast")) customElements.define("fx-toast", FxToast);
