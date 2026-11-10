// FxFormControl: what every Flare UX input shares, so they all behave alike --
// fx-text-field, fx-select, fx-checkbox, fx-toggle, fx-radio,
// fx-segmented-button.
//
// Properties (each reflects its attribute):
//   name, value, disabled, required, readOnly (readonly)
//   form, labels, validity, validationMessage, willValidate  (read-only)
// Methods:
//   focus(), blur(), checkValidity(), reportValidity(), setCustomValidity(msg)
// Events, as native inputs fire them:
//   input   (bubbles, composed) while the user changes it
//   change  (bubbles)           when a change is committed
//
// A control is form-associated: it posts `name=value` with its form, sits in
// form.elements by name, is disabled by a disabled <fieldset>, is reset by
// form.reset(), and a <label> around it (or for= its id) names it.
//
// Showing validity: `invalid` and `valid` attributes mark what the reader
// sees -- set by fx-form when it checks the form, by showValidity(), or
// (invalid) by the browser checking the form natively. Text fields and
// selects show it in their box and under it: `invalid-text` (or the
// browser's message) when invalid, `valid-text` when valid; error-text
// forces an error whatever the value.
//
// A subclass draws itself in its shadow root and calls:
//   this.syncForm(value, state?)   -- what the form posts (null = nothing)
//   this.syncValidity(flags, message, anchor) -- its validity
//   this.fireInput() / this.fireChange()
// and may override:
//   onDisabledChange(), formResetCallback(), get focusTarget()

export class FxFormControl extends HTMLElement {
  static formAssociated = true;

  internals = this.attachInternals();
  #formDisabled = false;

  constructor() {
    super();
    // The browser checking the form (a submit, reportValidity()) marks it.
    this.addEventListener("invalid", () => {
      this.removeAttribute("valid");
      this.toggleAttribute("invalid", true);
    });
  }

  // ------------------------------------------------- showing validity

  /** Check it and show the result: `invalid` or `valid`. Returns validity. */
  showValidity() {
    if (!this.willValidate) {
      this.clearValidity();
      return true;
    }
    const valid = this.internals.validity.valid;
    this.toggleAttribute("invalid", !valid);
    this.toggleAttribute("valid", valid);
    return valid;
  }

  /** Stop showing validity either way. */
  clearValidity() {
    this.removeAttribute("invalid");
    this.removeAttribute("valid");
  }

  /** What a field shows under itself: { state: "invalid" | "valid" | "", text }. */
  feedback() {
    const forced = this.getAttribute("error-text");
    if (forced) return { state: "invalid", text: forced };
    if (this.hasAttribute("invalid")) return { state: "invalid", text: this.getAttribute("invalid-text") || this.validationMessage };
    const support = this.getAttribute("supporting-text") ?? "";
    if (this.hasAttribute("valid")) return { state: "valid", text: this.getAttribute("valid-text") || support };
    return { state: "", text: support };
  }

  // ---------------------------------------------------------- attributes

  get name() {
    return this.getAttribute("name") ?? "";
  }
  set name(value) {
    this.setAttribute("name", String(value ?? ""));
  }

  get disabled() {
    return this.#formDisabled || this.hasAttribute("disabled");
  }
  set disabled(value) {
    this.toggleAttribute("disabled", Boolean(value));
  }

  get required() {
    return this.hasAttribute("required");
  }
  set required(value) {
    this.toggleAttribute("required", Boolean(value));
  }

  get readOnly() {
    return this.hasAttribute("readonly");
  }
  set readOnly(value) {
    this.toggleAttribute("readonly", Boolean(value));
  }

  // ---------------------------------------------------- the form's view

  get form() {
    return this.internals.form;
  }
  get labels() {
    return this.internals.labels;
  }
  get validity() {
    return this.internals.validity;
  }
  get validationMessage() {
    return this.internals.validationMessage;
  }
  get willValidate() {
    return this.internals.willValidate;
  }
  checkValidity() {
    return this.internals.checkValidity();
  }
  reportValidity() {
    return this.internals.reportValidity();
  }

  #customError = "";
  setCustomValidity(message) {
    this.#customError = String(message ?? "");
    this.updateValidity?.();
  }
  /** The message set with setCustomValidity, for a subclass's validity. */
  get customError() {
    return this.#customError;
  }

  /** What the form posts for this control (null posts nothing). */
  syncForm(value, state = value) {
    this.internals.setFormValue(value, state);
  }

  /** Set the validity: `flags` as ValidityState's, `anchor` to point at. */
  syncValidity(flags = {}, message = "", anchor) {
    if (this.#customError) {
      this.internals.setValidity({ ...flags, customError: true }, this.#customError, anchor);
    } else if (Object.values(flags).some(Boolean)) {
      this.internals.setValidity(flags, message || "Please fill this in.", anchor);
    } else {
      this.internals.setValidity({});
    }
  }

  // -------------------------------------------------------------- focus

  /** The element inside that takes focus; the host by default. */
  get focusTarget() {
    return this.shadowRoot?.querySelector("[data-focus]") ?? null;
  }
  focus(options) {
    const target = this.focusTarget;
    if (target) target.focus(options);
    else super.focus(options);
  }
  blur() {
    const target = this.focusTarget;
    if (target) target.blur();
    else super.blur();
  }

  // ------------------------------------------------------------- events

  fireInput() {
    this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  }
  fireChange() {
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // ----------------------------------------------------- form callbacks

  formDisabledCallback(disabled) {
    this.#formDisabled = disabled;
    this.onDisabledChange?.();
  }

  // ---------------------------------------- checked controls' defaults

  #defaultChecked;
  /** How a checked control started (its `checked` attribute when first
   *  connected), what form.reset() goes back to. */
  get defaultChecked() {
    return this.#defaultChecked ?? this.hasAttribute("checked");
  }
  set defaultChecked(value) {
    this.#defaultChecked = Boolean(value);
  }
  rememberDefaultChecked() {
    if (this.#defaultChecked === undefined) this.#defaultChecked = this.hasAttribute("checked");
  }

  /**
   * A property set before the element was upgraded sits on the instance
   * and hides the class's setter: take it off and set it through the
   * setter. A subclass calls this first in connectedCallback.
   */
  upgradeProperties(names) {
    for (const name of names) {
      if (Object.prototype.hasOwnProperty.call(this, name)) {
        const value = this[name];
        delete this[name];
        this[name] = value;
      }
    }
  }
}

/** Shared CSS for the outlined field look (fx-text-field, fx-select). */
export const FIELD_CSS = `
  :host {
    --fx-field-color: var(--fx-interactive);
    --fx-field-error: var(--fx-status-error);
    --fx-field-valid: var(--fx-status-success);
    --_height: var(--fx-size-md);
    display: inline-flex;
    flex-direction: column;
    gap: var(--fx-spacing-02);
    min-width: 0;
    box-sizing: border-box !important;
    vertical-align: top;
    font: var(--fx-type-body-compact-01);
    color: var(--fx-text);
  }
  :host([hidden]) { display: none; }
  :host([block]) { display: flex; width: 100%; }
  :host([size="sm"]), :host([dense]) { --_height: var(--fx-size-sm); }
  :host([size="lg"]) { --_height: var(--fx-size-lg); }
  .label {
    color: var(--fx-text-secondary);
    font: var(--fx-type-label-01);
    letter-spacing: 0.02em;
  }
  .label .req { margin-left: var(--fx-spacing-01); color: var(--fx-field-error); }
  .box {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--fx-spacing-03);
    min-height: var(--_height);
    padding: 0 var(--fx-spacing-05);
    box-sizing: border-box;
    border: 1px solid var(--fx-border-strong);
    border-radius: var(--fx-radius);
    background: var(--fx-layer);
    transition: border-color var(--fx-duration-fast-02) var(--fx-easing-standard), box-shadow var(--fx-duration-fast-02) var(--fx-easing-standard);
  }
  .box:hover { border-color: var(--fx-text-secondary); }
  .box:focus-within { border-color: var(--fx-field-color); box-shadow: inset 0 0 0 1px var(--fx-field-color); }
  :host([invalid]) .box { border-color: var(--fx-field-error); }
  :host([invalid]) .box:focus-within { box-shadow: inset 0 0 0 1px var(--fx-field-error); }
  :host([valid]) .box { border-color: var(--fx-field-valid); }
  :host([valid]) .box:focus-within { box-shadow: inset 0 0 0 1px var(--fx-field-valid); }
  /* The state's icon at the end of the box: a check, or a circled "!". */
  .state { display: none; flex: none; }
  .state svg { display: block; width: 1.125rem; height: 1.125rem; }
  :host([invalid]) .state { display: inline-flex; color: var(--fx-status-error-text); }
  :host([valid]) .state { display: inline-flex; color: var(--fx-status-success-text); }
  :host([valid]) .support.valid { color: var(--fx-status-success-text); }
  :host(:disabled) .box { border-color: var(--fx-border); background: var(--fx-layer-alt); color: var(--fx-text-disabled); }
  :host([size="sm"]) .box, :host([dense]) .box { padding: 0 var(--fx-spacing-04); }
  .affix { flex: none; color: var(--fx-text-secondary); white-space: nowrap; }
  .affix svg { display: block; width: 1rem; height: 1rem; }
  .affix:empty { display: none; }
  .support { color: var(--fx-text-secondary); font: var(--fx-type-helper-01); }
  .support:empty { display: none; }
  :host([invalid]) .support.error { color: var(--fx-status-error-text); }
  .label:empty { display: none; }
`;
