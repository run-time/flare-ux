// <fx-tool-tip>: a rich tooltip around whatever it wraps -- a heading and
// lines of detail, or a person (photo, name, email) -- for what a native
// `title` cannot hold. Shown on hover (after a short delay) and on keyboard
// focus; Escape hides it.
//
//   <fx-tool-tip heading="Last deploy" details='["Tuesday 14:02", "by the release bot"]'>
//     <fx-button variant="text" icon="clock" aria-label="Deploy history"></fx-button>
//   </fx-tool-tip>
//   <fx-tool-tip text="Copies the link"><fx-button icon="copy" aria-label="Copy link"></fx-button></fx-tool-tip>
//   <fx-tool-tip name="Ada Lovelace" email="ada@example.com" avatar="ada.png">Ada</fx-tool-tip>
//
// Attributes:
//   text      one plain line
//   heading   a bold first line
//   details   more lines: a JSON array of strings
//   name, email, avatar   a person: their photo, name, and email (a button
//             that copies it)
//   placement top (the default; flips below when there is no room) | bottom
//   block     display: block rather than inline
//
// The popup is a popover in the top layer, so a scrolling or overflow-hidden
// ancestor never clips it, and it follows the trigger while the page scrolls. Its content is linked to the trigger with
// aria-describedby where it can be: on the slotted element itself.

import { escapeHtml } from "../lib/escape.js";
import { follow } from "../lib/follow.js";
import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";

const SHOW_DELAY_MS = 150;
// Long enough to move the pointer from the trigger onto the popup (it can
// hold a copy button), and not vanish the instant the cursor drifts off.
const HIDE_DELAY_MS = 300;
let nextId = 0;

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host { display: inline; }
    :host([block]) { display: block; }
    .tip[popover] {
      position: fixed;
      inset: auto;
      margin: 0;
      max-width: min(20rem, calc(100vw - 1rem));
      padding: var(--fx-spacing-03) var(--fx-spacing-04);
      border: 0;
      border-radius: var(--fx-radius);
      background: var(--fx-inverse);
      color: var(--fx-inverse-text);
      box-shadow: var(--fx-shadow);
      font: var(--fx-type-body-compact-01);
      overflow-wrap: anywhere;
    }
    .row { display: flex; align-items: center; gap: var(--fx-spacing-04); }
    .avatar { flex: none; width: 2.5rem; height: 2.5rem; border-radius: 50%; object-fit: cover; background: var(--fx-color-gray-70); }
    .lines { display: flex; flex-direction: column; gap: var(--fx-spacing-01); min-width: 0; }
    .heading { font-weight: 600; }
    .detail { opacity: 0.85; }
    .copy {
      all: unset;
      display: inline-flex;
      align-items: center;
      gap: var(--fx-spacing-02);
      border-radius: var(--fx-radius-sm);
      cursor: pointer;
      opacity: 0.9;
    }
    .copy:hover { opacity: 1; text-decoration: underline; }
    .copy:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
    .copy svg { width: 0.9rem; height: 0.9rem; flex: none; }
  </style>
  <slot></slot>
  <div class="tip" popover="manual" role="tooltip" part="tip"></div>
`;

export class FxToolTip extends HTMLElement {
  #tip;
  #showTimer = 0;
  #hideTimer = 0;
  #unfollow = () => {};
  #id = `fx-tool-tip-${++nextId}`;

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    this.#tip = this.shadowRoot.querySelector(".tip");
    this.#tip.id = this.#id;
    this.#tip.addEventListener("mouseenter", () => clearTimeout(this.#hideTimer));
    this.#tip.addEventListener("mouseleave", this.#scheduleHide);
    this.#tip.addEventListener("click", (event) => this.#copy(event));
  }

  connectedCallback() {
    this.addEventListener("mouseenter", this.#scheduleShow);
    this.addEventListener("mouseleave", this.#scheduleHide);
    this.addEventListener("focusin", this.#show);
    this.addEventListener("focusout", this.#onFocusOut);
    document.addEventListener("keydown", this.#onKey);
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this.#onKey);
    this.#hide();
  }

  #scheduleShow = () => {
    clearTimeout(this.#hideTimer);
    clearTimeout(this.#showTimer);
    this.#showTimer = setTimeout(this.#show, SHOW_DELAY_MS);
  };

  #scheduleHide = () => {
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
    this.#hideTimer = setTimeout(this.#hide, HIDE_DELAY_MS);
  };

  #onFocusOut = (event) => {
    if (!this.#tip.contains(event.relatedTarget)) this.#scheduleHide();
  };

  #onKey = (event) => {
    if (event.key === "Escape" && this.#tip.matches(":popover-open")) this.#hide();
  };

  #content() {
    const text = this.getAttribute("text") ?? "";
    const heading = this.getAttribute("heading") ?? "";
    const name = this.getAttribute("name") ?? "";
    const email = this.getAttribute("email") ?? "";
    const avatar = this.getAttribute("avatar") ?? "";
    let details = [];
    try {
      const parsed = JSON.parse(this.getAttribute("details") ?? "[]");
      if (Array.isArray(parsed)) details = parsed.map(String).filter(Boolean);
    } catch {
      details = [this.getAttribute("details")].filter(Boolean);
    }
    if (!text && !heading && !name && !email && !details.length) return "";
    const lines = [
      heading && `<span class="heading">${escapeHtml(heading)}</span>`,
      name && `<span class="heading">${escapeHtml(name)}</span>`,
      text && `<span>${escapeHtml(text)}</span>`,
      ...details.map((detail) => `<span class="detail">${escapeHtml(detail)}</span>`),
      email && `<button type="button" class="copy" data-copy="${escapeHtml(email)}" aria-label="Copy ${escapeHtml(email)}">${iconSvg("mail")}<span>${escapeHtml(email)}</span></button>`,
    ].filter(Boolean);
    return `<div class="row">${avatar ? `<img class="avatar" src="${escapeHtml(avatar)}" alt="">` : ""}<div class="lines">${lines.join("")}</div></div>`;
  }

  #show = () => {
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
    if (this.#tip.matches(":popover-open")) return;
    const html = this.#content();
    if (!html) return;
    this.#tip.innerHTML = html;
    this.#tip.showPopover();
    this.#place();
    this.#unfollow = follow(this, () => this.#place(), { popup: this.#tip, close: this.#hide });
    // The trigger is described by the tooltip when it is this element's own
    // child -- an id reference cannot cross into the shadow root, so the
    // text is copied as a description instead.
    const trigger = this.firstElementChild;
    if (trigger) trigger.setAttribute("aria-description", this.#tip.textContent.trim());
  };

  #hide = () => {
    clearTimeout(this.#showTimer);
    clearTimeout(this.#hideTimer);
    if (this.#tip.matches(":popover-open")) this.#tip.hidePopover();
    this.#unfollow();
  };

  #place() {
    const at = this.getBoundingClientRect();
    const tip = this.#tip.getBoundingClientRect();
    const gap = 8;
    const below = this.getAttribute("placement") === "bottom";
    let top = below ? at.bottom + gap : at.top - tip.height - gap;
    if (!below && top < gap) top = at.bottom + gap;
    if (below && top + tip.height > window.innerHeight - gap) top = at.top - tip.height - gap;
    let left = at.left + at.width / 2 - tip.width / 2;
    left = Math.min(Math.max(gap, left), window.innerWidth - tip.width - gap);
    this.#tip.style.top = `${Math.round(top)}px`;
    this.#tip.style.left = `${Math.round(left)}px`;
  }

  async #copy(event) {
    const button = event.target.closest("[data-copy]");
    if (!button || button.disabled) return;
    button.disabled = true;
    const label = button.querySelector("span");
    const was = label.textContent;
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      label.textContent = "Copied";
    } catch {
      label.textContent = "Could not copy";
    }
    setTimeout(() => {
      label.textContent = was;
      button.disabled = false;
    }, 1200);
  }
}

if (!customElements.get("fx-tool-tip")) customElements.define("fx-tool-tip", FxToolTip);
