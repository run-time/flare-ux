// <fx-text-field>: Material 3's outlined text field -- a label above, the
// box, and supporting or error text under it. One line by default;
// `multiline` makes it a text area.
//
//   <fx-text-field label="Project name" name="project" value="Atlas" supporting-text="Shown on every page"></fx-text-field>
//   <fx-text-field label="Notes" multiline rows="6" block></fx-text-field>
//   <fx-text-field type="search" icon="search" placeholder="Find…" dense></fx-text-field>
//
// Attributes: label, type (text|number|search|email|url|password|date|time|
// tel), value, placeholder, supporting-text, error-text (shown, and the field
// marked invalid, when set), invalid-text and valid-text (shown when its
// validity is shown -- see fx-form), icon (leading, an icon name),
// prefix-text, suffix-text, multiline, rows, resize (none|vertical), min,
// max, step, minlength, maxlength, pattern, autocomplete, spellcheck,
// inputmode, autofocus, mono (monospace), size (sm | md | lg; dense = sm), block
// (full width), plus FxFormControl's name, disabled, required, readonly.
//
// Suggestions: <option value="…"> children are offered as the field is
// typed in (a <datalist> inside, kept in step as they change).
//
// Like <input>: value, defaultValue, select(), setSelectionRange(),
// selectionStart/selectionEnd, valueAsNumber, focus(); `input` while typing,
// `change` when committed. Enter in a one-line field inside a form submits
// the form, as an <input> does.

import { FIELD_CSS, FxFormControl } from "./fx-form-control.js";
import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";
import { escapeHtml } from "../lib/escape.js";

const PASSED = ["type", "placeholder", "min", "max", "step", "minlength", "maxlength", "pattern", "autocomplete", "spellcheck", "inputmode", "rows", "readonly", "required", "disabled", "name"];

const template = document.createElement("template");
template.innerHTML = `
  <style>
    ${FIELD_CSS}
    input, textarea {
      flex: 1;
      min-width: 0;
      width: 100%;
      margin: 0;
      padding: 0;
      min-height: calc(var(--_height) - 2px);
      border: 0;
      outline: none;
      background: transparent;
      color: inherit;
      font: inherit;
    }
    input::placeholder, textarea::placeholder { color: var(--fx-text-placeholder); }
    textarea { padding: var(--fx-spacing-03) 0; resize: vertical; line-height: 1.45; }
    :host([resize="none"]) textarea { resize: none; }
    :host([multiline]) .box { align-items: stretch; }
    :host([mono]) input, :host([mono]) textarea { font: var(--fx-type-code-01); }
    input[type="search"]::-webkit-search-cancel-button { cursor: pointer; }
  </style>
  <label class="label" part="label"></label>
  <div class="box" part="box">
    <span class="affix lead" part="leading"></span>
    <span class="affix prefix" part="prefix"></span>
    <span class="slot-control"></span>
    <span class="affix suffix" part="suffix"></span>
    <span class="state" part="state" aria-hidden="true"></span>
  </div>
  <div class="support" part="supporting-text"></div>
`;

let uid = 0;

export class FxTextField extends FxFormControl {
  static observedAttributes = [
    "label", "value", "supporting-text", "error-text", "invalid-text", "valid-text", "invalid", "valid", "icon", "prefix-text", "suffix-text", "multiline", "aria-label", "mono",
    ...PASSED,
  ];

  #control = null;
  #isMulti = null;
  #value = "";
  #dirty = false; // the value was set by the user or a property, not the attribute
  #id = `fx-tf-${++uid}`;
  #observer = new MutationObserver(() => this.#syncSuggestions());

  constructor() {
    super();
    this.attachShadow({ mode: "open", delegatesFocus: true }).appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.upgradeProperties(["value"]);
    this.#render();
    this.#syncSuggestions();
    this.#observer.observe(this, { childList: true, subtree: true, attributes: true });
  }

  disconnectedCallback() {
    this.#observer.disconnect();
  }

  // The element's own <option> children, as a <datalist> the input lists.
  #syncSuggestions() {
    if (!this.#control || this.#isMulti) return;
    const options = [...this.querySelectorAll(":scope > option")];
    let list = this.shadowRoot.querySelector("datalist");
    if (!options.length) {
      list?.remove();
      this.#control.removeAttribute("list");
      return;
    }
    if (!list) {
      list = document.createElement("datalist");
      list.id = `${this.#id}-list`;
      this.shadowRoot.append(list);
    }
    list.replaceChildren(...options.map((option) => option.cloneNode(true)));
    this.#control.setAttribute("list", list.id);
  }

  attributeChangedCallback(name) {
    if (name === "value" && !this.#dirty) this.#value = this.getAttribute("value") ?? "";
    this.#render();
  }

  onDisabledChange() {
    this.#render();
  }

  formResetCallback() {
    this.#dirty = false;
    this.value = this.defaultValue;
    this.#dirty = false;
  }

  formStateRestoreCallback(state) {
    this.value = state ?? "";
  }

  // ------------------------------------------------------------ value

  get value() {
    return this.#control ? this.#control.value : this.#value;
  }
  set value(value) {
    this.#value = value === null || value === undefined ? "" : String(value);
    this.#dirty = true;
    if (this.#control && this.#control.value !== this.#value) this.#control.value = this.#value;
    this.updateValidity();
  }

  get defaultValue() {
    return this.getAttribute("value") ?? "";
  }
  set defaultValue(value) {
    this.setAttribute("value", value);
  }

  get placeholder() {
    return this.getAttribute("placeholder") ?? "";
  }
  set placeholder(value) {
    this.setAttribute("placeholder", value ?? "");
  }

  get valueAsNumber() {
    return this.#control?.valueAsNumber ?? Number(this.value);
  }
  get type() {
    return this.hasAttribute("multiline") ? "textarea" : this.getAttribute("type") || "text";
  }

  // --------------------------------------------------- input's methods

  select() {
    this.#control?.select();
  }
  setSelectionRange(start, end, direction) {
    this.#control?.setSelectionRange(start, end, direction);
  }
  setRangeText(...args) {
    this.#control?.setRangeText(...args);
  }
  get selectionStart() {
    return this.#control?.selectionStart ?? null;
  }
  set selectionStart(value) {
    if (this.#control) this.#control.selectionStart = value;
  }
  get selectionEnd() {
    return this.#control?.selectionEnd ?? null;
  }
  set selectionEnd(value) {
    if (this.#control) this.#control.selectionEnd = value;
  }
  get focusTarget() {
    return this.#control;
  }
  /** The native input or textarea inside, for anything needing it directly. */
  get control() {
    return this.#control;
  }

  // ---------------------------------------------------------- validity

  updateValidity() {
    if (!this.#control) return;
    const own = this.#control.validity;
    const flags = {};
    for (const key of ["valueMissing", "typeMismatch", "patternMismatch", "tooLong", "tooShort", "rangeUnderflow", "rangeOverflow", "stepMismatch", "badInput"]) {
      if (own[key]) flags[key] = true;
    }
    this.syncValidity(flags, this.#control.validationMessage, this.#control);
    this.syncForm(this.value);
  }

  // As a browser decides an Enter: a form whose every submit control is
  // disabled (or loading) is not submitted; one with none is.
  #canSubmit() {
    const form = this.form;
    if (!form) return false;
    const submits = [...form.elements].filter(
      (element) =>
        (element.localName === "button" && (element.type === "submit")) ||
        (element.localName === "input" && (element.type === "submit" || element.type === "image")) ||
        ((element.localName === "fx-button" || element.localName === "fx-split-button") && element.getAttribute("type") === "submit"),
    );
    return !submits.length || submits.some((element) => !element.disabled && !element.loading);
  }

  // ------------------------------------------------------------ render

  #build() {
    const multi = this.hasAttribute("multiline");
    if (this.#control && this.#isMulti === multi) return;
    const keep = this.#control ? this.#control.value : this.#value;
    this.#isMulti = multi;
    const control = document.createElement(multi ? "textarea" : "input");
    control.id = this.#id;
    control.setAttribute("part", "input");
    control.setAttribute("data-focus", "");
    control.value = keep;
    control.addEventListener("input", (event) => {
      // The native event crosses the shadow boundary itself (composed).
      this.#value = control.value;
      this.#dirty = true;
      this.updateValidity();
      // Shown validity follows the value as it is typed: an error clears
      // once it is fixed, and a field shown valid turns invalid if broken.
      if (this.hasAttribute("invalid") && this.validity.valid) this.removeAttribute("invalid");
      if (this.hasAttribute("valid") && !this.validity.valid) this.showValidity();
      void event;
    });
    control.addEventListener("change", () => {
      this.updateValidity();
      this.fireChange();
    });
    control.addEventListener("keydown", (event) => {
      // Enter submits the form, as in a one-line <input> -- once the event
      // has been through the page's own handlers, so one that handles Enter
      // itself (and calls preventDefault) is not submitted twice.
      if (multi || event.key !== "Enter" || event.isComposing || !this.form) return;
      setTimeout(() => {
        if (!event.defaultPrevented && this.isConnected && this.#canSubmit()) this.form?.requestSubmit();
      });
    });
    const host = this.shadowRoot.querySelector(".slot-control");
    host.replaceChildren(control);
    host.style.display = "contents";
    this.#control = control;
    this.#syncSuggestions();
  }

  #render() {
    if (!this.shadowRoot) return;
    this.#build();
    const control = this.#control;
    for (const name of PASSED) {
      if (name === "type" && this.#isMulti) continue;
      if (name === "rows" && !this.#isMulti) continue;
      if (name === "disabled") continue;
      const value = this.getAttribute(name);
      if (value === null) control.removeAttribute(name);
      else control.setAttribute(name, value);
    }
    control.disabled = this.disabled;
    if (!this.#dirty && control.value !== this.#value) control.value = this.#value;

    const label = this.getAttribute("label") ?? "";
    const labelEl = this.shadowRoot.querySelector(".label");
    labelEl.innerHTML = label ? `${escapeHtml(label)}${this.required ? '<span class="req" aria-hidden="true">*</span>' : ""}` : "";
    labelEl.htmlFor = this.#id;
    // No visible label: the host's aria-label names the control.
    const aria = this.getAttribute("aria-label");
    if (!label && aria) control.setAttribute("aria-label", aria);
    else control.removeAttribute("aria-label");

    const icon = this.getAttribute("icon");
    this.shadowRoot.querySelector(".lead").innerHTML = icon ? iconSvg(icon) : "";
    this.shadowRoot.querySelector(".prefix").textContent = this.getAttribute("prefix-text") ?? "";
    this.shadowRoot.querySelector(".suffix").textContent = this.getAttribute("suffix-text") ?? "";

    this.updateValidity();
    const error = this.getAttribute("error-text") ?? "";
    this.toggleAttribute("invalid", Boolean(error) || (this.hasAttribute("invalid") && !this.validity.valid));
    if (this.hasAttribute("invalid")) this.removeAttribute("valid");
    const feedback = this.feedback();
    const support = this.shadowRoot.querySelector(".support");
    support.textContent = feedback.text;
    support.classList.toggle("error", feedback.state === "invalid");
    support.classList.toggle("valid", feedback.state === "valid");
    this.shadowRoot.querySelector(".state").innerHTML = feedback.state ? iconSvg(feedback.state === "invalid" ? "alert-circle" : "check") : "";
    if (support.textContent) {
      support.id = `${this.#id}-support`;
      control.setAttribute("aria-describedby", support.id);
    } else control.removeAttribute("aria-describedby");
    control.setAttribute("aria-invalid", String(this.hasAttribute("invalid")));
  }
}

if (!customElements.get("fx-text-field")) customElements.define("fx-text-field", FxTextField);
