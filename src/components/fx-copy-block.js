// <fx-copy-block>: a block of code with a button that copies it.
//
//   <fx-copy-block value="npm run dev"></fx-copy-block>
//   <fx-copy-block>git clone …</fx-copy-block>   (its text, when no value)
//   block.value = source;
//
// The block scrolls past 32rem; the copy button keeps clear of its scrollbar.
// Says "Copied to clipboard" to assistive technology when it has.

import "./fx-button.js";

export class FxCopyBlock extends HTMLElement {
  static get observedAttributes() {
    return ["value"];
  }

  #value = "";
  #resetTimer = null;
  #resizeObserver = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get value() {
    return this.#value;
  }

  set value(value) {
    this.#value = String(value ?? "");
    if (this.getAttribute("value") !== this.#value) {
      this.setAttribute("value", this.#value);
    } else {
      this.#renderValue();
    }
  }

  attributeChangedCallback(_name, _oldValue, newValue) {
    this.#value = newValue ?? "";
    this.#renderValue();
  }

  connectedCallback() {
    if (!this.hasAttribute("value") && !this.#value) {
      this.#value = this.textContent ?? "";
    }
    this.#render();
  }

  disconnectedCallback() {
    clearTimeout(this.#resetTimer);
    this.#resizeObserver?.disconnect();
  }

  #render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          overflow: hidden;
          border: 1px solid var(--fx-color-gray-80);
          border-radius: var(--fx-radius);
          background: var(--fx-color-gray-100);
          color: var(--fx-color-gray-10);
        }
        pre {
          box-sizing: border-box;
          min-height: 3.25rem;
          max-height: 32rem;
          margin: 0;
          overflow: auto;
          padding: 0.9rem 4.5rem 0.9rem 1rem;
          font: var(--fx-type-code-01);
          white-space: pre;
          tab-size: 2;
        }
        .copy {
          position: absolute;
          top: 0.55rem;
          right: calc(0.55rem + var(--scrollbar-offset, 0px));
          opacity: 0.7;
          transition: opacity 120ms ease;
        }
        pre:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: -2px; }
        .copy:hover,
        .copy:focus-within { opacity: 1; }
        .status {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
        }
      </style>
      <pre tabindex="0"><code></code></pre>
      <fx-button class="copy" variant="text" icon="copy" fg-color="var(--fx-color-gray-10)" size="sm" aria-label="Copy code to clipboard" title="Copy code"></fx-button>
      <span class="status" role="status" aria-live="polite"></span>
    `;
    this.shadowRoot
      .querySelector(".copy")
      .addEventListener("click", () => this.#copy());
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = new ResizeObserver(() => this.#updateButtonOffset());
    this.#resizeObserver.observe(this.shadowRoot.querySelector("pre"));
    this.#renderValue();
  }

  #renderValue() {
    const code = this.shadowRoot.querySelector("code");
    if (code) code.textContent = this.#value;
    requestAnimationFrame(() => this.#updateButtonOffset());
  }

  #updateButtonOffset() {
    const pre = this.shadowRoot.querySelector("pre");
    if (!pre) return;
    const hasVerticalScrollbar = pre.scrollHeight > pre.clientHeight + 1;
    const scrollbarWidth = pre.offsetWidth - pre.clientWidth;
    const offset = hasVerticalScrollbar ? Math.max(scrollbarWidth, 12) : 0;
    this.style.setProperty("--scrollbar-offset", `${offset}px`);
  }

  async #copy() {
    const button = this.shadowRoot.querySelector(".copy");
    const status = this.shadowRoot.querySelector(".status");
    try {
      await navigator.clipboard.writeText(this.#value);
      button.setAttribute("aria-label", "Copied to clipboard");
      button.setAttribute("icon", "check");
      button.title = "Copied";
      status.textContent = "Copied to clipboard";
    } catch (error) {
      button.setAttribute("aria-label", "Unable to copy code");
      button.title = "Copy failed";
      status.textContent = "Unable to copy code";
      console.error("Unable to copy code:", error);
    }
    clearTimeout(this.#resetTimer);
    this.#resetTimer = setTimeout(() => {
      if (!button.isConnected) return;
      button.setAttribute("aria-label", "Copy code to clipboard");
      button.setAttribute("icon", "copy");
      button.title = "Copy code";
      status.textContent = "";
    }, 1200);
  }
}

if (!customElements.get("fx-copy-block")) customElements.define("fx-copy-block", FxCopyBlock);
