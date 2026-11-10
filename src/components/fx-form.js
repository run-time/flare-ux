// <fx-form>: a <form> that checks itself the Flare UX way -- on submit it
// checks every field, marks each one valid or invalid where the reader can
// see it (a green check and valid-text, or a red outline, a circled "!" and
// the error), moves focus to the first problem, and submits only when all
// is well. After that first try each field updates as it is edited.
//
//   <fx-form>
//     <form action="/signup" method="post">
//       <fx-text-field label="Email" name="email" type="email" required
//         invalid-text="Enter an email address" valid-text="Looks good!"></fx-text-field>
//       <fx-select label="State" name="state" required invalid-text="Please select a valid state.">…</fx-select>
//       <label><fx-checkbox name="terms" required invalid-text="You must agree before submitting."></fx-checkbox> I agree</label>
//       <fx-button variant="filled" type="submit">Sign up</fx-button>
//     </form>
//   </fx-form>
//
// It wraps a real <form> (a custom element cannot be one in every browser),
// so the form still posts, resets and lists its elements natively; fx-form
// sets `novalidate` on it to replace the browser's bubbles with its own.
//
// Attributes:
//   validate     submit (default): fields show their state after the first
//                submit, then live as they change; blur: each field shows
//                its state once the reader leaves it
//   no-valid     mark only errors -- no green for fields that pass
//
// Events:
//   fx:submit    (cancelable) every field passed; detail { form, data }
//                (data is the FormData). preventDefault() to handle it
//                yourself -- the form then is not submitted.
//   fx:invalid   a submit found problems; detail { controls } (the invalid ones)
//
// Methods: validate() checks and shows every field (true when all pass);
// reset() resets the form and clears every shown state.
//
// Text fields and selects show their message themselves. For any other
// control -- a checkbox, toggle, radio group or a native input -- fx-form
// puts the message after the control's <label> (or the control), from its
// invalid-text attribute or the browser's message.

const OWN_FEEDBACK = new Set(["fx-text-field", "fx-select", "fx-combobox", "fx-file-drop"]);

export class FxForm extends HTMLElement {
  #form = null;
  #tried = false;
  #observer = new MutationObserver(() => this.#adopt());

  connectedCallback() {
    this.#adopt();
    this.#observer.observe(this, { childList: true });
    this.addEventListener("submit", this.#onSubmit, true);
    this.addEventListener("reset", this.#onReset, true);
    this.addEventListener("input", this.#onEdit);
    this.addEventListener("change", this.#onEdit);
    this.addEventListener("focusout", this.#onLeave);
  }

  disconnectedCallback() {
    this.#observer.disconnect();
    this.removeEventListener("submit", this.#onSubmit, true);
    this.removeEventListener("reset", this.#onReset, true);
    this.removeEventListener("input", this.#onEdit);
    this.removeEventListener("change", this.#onEdit);
    this.removeEventListener("focusout", this.#onLeave);
  }

  /** The <form> inside. */
  get form() {
    return this.#form;
  }

  /** Check every field and show the result. True when every one passes. */
  validate() {
    this.#tried = true;
    this.toggleAttribute("validated", true);
    const invalid = this.#controls().filter((control) => !this.#show(control));
    invalid[0]?.focus();
    return invalid.length === 0;
  }

  /** Reset the form and stop showing any state. */
  reset() {
    this.#form?.reset();
  }

  // -------------------------------------------------------------- setup

  #adopt() {
    const form = this.querySelector("form");
    if (form === this.#form) return;
    this.#form = form;
    form?.setAttribute("novalidate", "");
  }

  /** The form's fields that take part in validation, one per radio group. */
  #controls() {
    if (!this.#form) return [];
    const seen = new Set();
    return [...this.#form.elements].filter((element) => {
      if (!element.willValidate) return false;
      if (element.type === "radio" || element.localName === "fx-radio") {
        if (seen.has(element.name)) return false;
        seen.add(element.name);
      }
      return true;
    });
  }

  // ------------------------------------------------------------- events

  #onSubmit = (event) => {
    if (event.target !== this.#form) return;
    if (!this.validate()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const controls = this.#controls().filter((control) => !control.validity.valid);
      this.dispatchEvent(new CustomEvent("fx:invalid", { bubbles: true, detail: { controls } }));
      return;
    }
    const proceed = this.dispatchEvent(
      new CustomEvent("fx:submit", { bubbles: true, cancelable: true, detail: { form: this.#form, data: new FormData(this.#form, event.submitter ?? undefined) } }),
    );
    if (!proceed) event.preventDefault();
  };

  #onReset = (event) => {
    if (event.target !== this.#form) return;
    this.#tried = false;
    this.removeAttribute("validated");
    // After the form has put its values back.
    queueMicrotask(() => {
      for (const control of this.#form.elements) this.#clear(control);
    });
  };

  #onEdit = (event) => {
    const control = this.#fieldOf(event.target);
    if (control && (this.#tried || control.dataset.fxShown !== undefined)) this.#show(control);
  };

  #onLeave = (event) => {
    if (this.getAttribute("validate") !== "blur") return;
    const control = this.#fieldOf(event.target);
    // Only once the reader has really left it (not moved inside it).
    if (control && !control.contains(event.relatedTarget)) this.#show(control);
  };

  #fieldOf(node) {
    const element = node?.closest?.("input, select, textarea, fx-text-field, fx-select, fx-combobox, fx-slider, fx-file-drop, fx-checkbox, fx-toggle, fx-radio, fx-segmented-button");
    return element && this.#form?.contains(element) && element.willValidate ? element : null;
  }

  // ---------------------------------------------------- showing a field

  /** Show one field's validity; true when it passes. */
  #show(control) {
    control.dataset.fxShown = "";
    const group = this.#group(control);
    const valid = group.every((member) => member.validity.valid);
    const showValid = valid && !this.hasAttribute("no-valid");
    for (const member of group) {
      if (typeof member.showValidity === "function") {
        member.showValidity();
        if (!showValid) member.removeAttribute("valid");
      } else {
        member.toggleAttribute("data-fx-invalid", !valid);
        member.setAttribute("aria-invalid", String(!valid));
      }
    }
    if (!OWN_FEEDBACK.has(control.localName)) this.#message(group, valid);
    return valid;
  }

  #clear(control) {
    delete control.dataset.fxShown;
    control.clearValidity?.();
    control.removeAttribute("data-fx-invalid");
    if (control.localName === "input" || control.localName === "select" || control.localName === "textarea") control.removeAttribute("aria-invalid");
    this.#feedbackFor(control, false)?.remove();
  }

  /** A radio's whole group; any other control alone. */
  #group(control) {
    if ((control.type === "radio" || control.localName === "fx-radio") && control.name) {
      return [...this.#form.elements].filter((element) => element.name === control.name && (element.type === "radio" || element.localName === "fx-radio"));
    }
    return [control];
  }

  /** The message under a control that does not draw its own. */
  #message(group, valid) {
    const last = group[group.length - 1];
    const node = this.#feedbackFor(last, !valid);
    if (!node) return;
    if (valid) {
      node.remove();
      for (const member of group) member.removeAttribute("aria-describedby");
      return;
    }
    const text = group.map((member) => member.getAttribute("invalid-text")).find(Boolean) || last.validationMessage;
    node.textContent = text;
    for (const member of group) member.setAttribute("aria-describedby", node.id);
  }

  #feedbackFor(control, create) {
    const anchor = control.closest("label") ?? control;
    const next = anchor.nextElementSibling;
    if (next?.classList.contains("fx-form-feedback")) return next;
    if (!create) return null;
    const node = document.createElement("div");
    node.className = "fx-form-feedback";
    node.id = `fx-form-feedback-${++feedbackId}`;
    node.style.cssText = "color: var(--fx-status-error-text); font: var(--fx-type-helper-01); margin-top: var(--fx-spacing-02);";
    anchor.after(node);
    return node;
  }
}

let feedbackId = 0;

if (!customElements.get("fx-form")) customElements.define("fx-form", FxForm);
