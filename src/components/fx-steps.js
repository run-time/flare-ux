// <fx-steps>: the stages of a flow, as circles on a line -- a setup wizard,
// or a run moving through its stages. The states are factory-ui's flow
// timeline's:
//
//   complete  done: a check, green, and the line into the next one green
//   active    being worked on now: its number, blue, a ring that pulses
//   waiting   stopped on a person (a review, a question): amber
//   failed    stopped on something broken: a cross, red
//   skipped   passed over: dashed, the label struck through
//   pending   not reached yet: gray (the default)
//
//   steps.items = [
//     { label: "Plan", state: "complete", detail: "2m" },
//     { label: "Build", state: "active" },
//     { label: "Review" },
//   ];
//   <fx-steps items='[{"label":"Plan","state":"complete"},{"label":"Build","state":"active"}]'></fx-steps>
//
// Each item: { label, state?, detail? (a line under the label), icon? (in
// place of the number) }.
//
// Attributes:
//   items        the steps as JSON (or the items property)
//   orientation  unset: side by side, turning vertical when its box is
//                too narrow for them (about 8rem a step) | horizontal
//                (always side by side) | vertical
//   interactive  steps are buttons: a click fires fx:step-select ({ index,
//                item }) -- going back to a finished step in a wizard
//
// An ordered list; the active (or waiting / failed) step has
// aria-current="step", and each says its state in words.

import { escapeHtml } from "../lib/escape.js";
import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";

const STATES = ["complete", "active", "waiting", "failed", "skipped", "pending"];
const SPOKEN = { complete: "done", active: "in progress", waiting: "waiting", failed: "failed", skipped: "skipped", pending: "not started" };

/* Vertical: down the side, each label beside its circle. */
const VERTICAL = (host) => `
  ${host} ol { flex-direction: column; }
  ${host} li { flex: none; padding: 0 0 var(--fx-spacing-05); }
  ${host} li:last-child { padding-bottom: 0; }
  ${host} .step { display: grid; grid-template-columns: var(--_dot) 1fr; column-gap: var(--fx-spacing-04); row-gap: var(--fx-spacing-01); align-items: start; text-align: left; }
  ${host} .dot { grid-row: span 2; }
  ${host} .label { padding-top: 0.3rem; }
  ${host} li:not(:first-child)::before { top: calc(-1 * var(--fx-spacing-05) + 2px); bottom: calc(100% - 2px); left: calc(var(--_dot) / 2 - 1px); right: auto; width: 2px; height: auto; }
`;

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host { --_dot: 1.75rem; display: block; color: var(--fx-text); font: var(--fx-type-body-compact-01); }
    :host([hidden]) { display: none; }
    ol { display: flex; margin: 0; padding: 0; list-style: none; }
    li { position: relative; flex: 1 1 0; min-width: 0; padding: 0 var(--fx-spacing-02); }
    /* The line into each step, from the one before. */
    li:not(:first-child)::before {
      content: "";
      position: absolute;
      top: calc(var(--_dot) / 2 - 1px);
      right: calc(50% + var(--_dot) / 2 + var(--fx-spacing-02));
      left: calc(-50% + var(--_dot) / 2 + var(--fx-spacing-02));
      height: 2px;
      border-radius: 1px;
      background: var(--fx-border);
    }
    li[data-after="complete"]::before { background: var(--fx-status-success); }
    .step { all: unset; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: var(--fx-spacing-02); width: 100%; text-align: center; }
    button.step { cursor: pointer; }
    .dot {
      position: relative;
      display: grid;
      place-items: center;
      flex: none;
      width: var(--_dot);
      height: var(--_dot);
      box-sizing: border-box;
      border: 2px solid var(--fx-border-strong);
      border-radius: 50%;
      background: var(--fx-layer);
      color: var(--fx-text-secondary);
      font: 600 var(--fx-font-size-01) / 1 var(--fx-font);
    }
    .dot svg { width: 0.875rem; height: 0.875rem; }
    li[data-state="complete"] .dot { border-color: var(--fx-status-success); background: var(--fx-status-success-bg); color: var(--fx-status-success-text); }
    li[data-state="active"] .dot { border-color: var(--fx-interactive); background: var(--fx-interactive-subtle); color: var(--fx-interactive-text); animation: fx-steps-pulse 1.6s ease-in-out infinite; }
    li[data-state="waiting"] .dot { border-color: var(--fx-status-warning); background: var(--fx-status-warning-bg); color: var(--fx-status-warning-text); }
    li[data-state="failed"] .dot { border-color: var(--fx-status-error); background: var(--fx-status-error-bg); color: var(--fx-status-error-text); }
    li[data-state="skipped"] .dot { border-style: dashed; }
    /* A ring that swells and fades around the circle. */
    @keyframes fx-steps-pulse { 50% { box-shadow: 0 0 0 5px var(--fx-interactive-subtle); } }
    @media (prefers-reduced-motion: reduce) { li[data-state="active"] .dot { animation: none; } }
    .label { max-width: 100%; overflow-wrap: anywhere; font-weight: 600; }
    li[data-state="pending"] .label, li[data-state="skipped"] .label { color: var(--fx-text-secondary); font-weight: 400; }
    li[data-state="skipped"] .label { text-decoration: line-through; }
    li[data-state="active"] .label { color: var(--fx-interactive-text); }
    li[data-state="waiting"] .label { color: var(--fx-status-warning-text); }
    li[data-state="failed"] .label { color: var(--fx-status-error-text); }
    .detail { color: var(--fx-text-secondary); font: var(--fx-type-helper-01); }
    .detail:empty { display: none; }
    .spoken { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    button.step:focus-visible .dot { outline: 2px solid var(--fx-focus); outline-offset: 2px; }
    button.step:hover .label { text-decoration: underline; }
    ${VERTICAL(':host([orientation="vertical"])')}
    /* Too narrow to fit side by side (it measures itself and sets narrow):
       down the side, unless told not to. A container query would do, but
       one sizes the element as if narrow inside a flex column. */
    ${VERTICAL(':host([narrow]:not([orientation="horizontal"]))')}
  </style>
  <ol part="list"></ol>
`;

export class FxSteps extends HTMLElement {
  static observedAttributes = ["items", "interactive"];

  #items = [];
  #resize = new ResizeObserver(([entry]) => {
    // Each step wants about 8rem side by side.
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    this.toggleAttribute("narrow", entry.contentRect.width < Math.max(2, this.#items.length) * 8 * rem);
  });

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.appendChild(template.content.cloneNode(true));
    root.querySelector("ol").addEventListener("click", (event) => {
      const button = event.target.closest("button.step");
      if (!button) return;
      const index = Number(button.dataset.index);
      this.dispatchEvent(new CustomEvent("fx:step-select", { bubbles: true, detail: { index, item: this.#items[index] } }));
    });
  }

  connectedCallback() {
    this.#resize.observe(this);
    this.#render();
  }

  disconnectedCallback() {
    this.#resize.disconnect();
  }

  attributeChangedCallback(name) {
    if (name === "items") {
      try {
        this.#items = JSON.parse(this.getAttribute("items") || "[]");
      } catch {
        this.#items = [];
      }
    }
    this.#render();
  }

  get items() {
    return this.#items;
  }
  set items(items) {
    this.#items = Array.isArray(items) ? items : [];
    this.#render();
  }

  #render() {
    const interactive = this.hasAttribute("interactive");
    const items = this.#items.map((item) => ({ ...item, state: STATES.includes(item.state) ? item.state : "pending" }));
    const current = items.findIndex((item) => ["active", "waiting", "failed"].includes(item.state));
    this.shadowRoot.querySelector("ol").innerHTML = items
      .map((item, index) => {
        const mark =
          item.state === "complete" ? iconSvg("check") : item.state === "failed" ? iconSvg("close") : item.icon ? iconSvg(item.icon) : String(index + 1);
        const tag = interactive ? "button" : "span";
        const attrs = interactive ? ` type="button" data-index="${index}"` : "";
        return `<li data-state="${item.state}"${index > 0 ? ` data-after="${items[index - 1].state}"` : ""}${index === current ? ' aria-current="step"' : ""}>
          <${tag} class="step"${attrs}>
            <span class="dot" part="dot" aria-hidden="true">${mark}</span>
            <span class="label" part="label">${escapeHtml(item.label ?? "")}<span class="spoken">, ${SPOKEN[item.state]}</span></span>
            <span class="detail" part="detail">${escapeHtml(item.detail ?? "")}</span>
          </${tag}>
        </li>`;
      })
      .join("");
  }
}

if (!customElements.get("fx-steps")) customElements.define("fx-steps", FxSteps);
