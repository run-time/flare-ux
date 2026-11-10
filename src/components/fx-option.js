// <fx-option>: one choice inside fx-segmented-button, fx-tabs or
// fx-split-button. It draws nothing itself -- its parent reads its value,
// label and attributes and draws the choice -- so it is hidden wherever it
// is put.
//
//   <fx-option value="week" icon="calendar" title="This week">Week</fx-option>

export class FxOption extends HTMLElement {
  connectedCallback() {
    this.hidden = true;
  }

  get value() {
    return this.getAttribute("value") ?? this.textContent.trim();
  }
  set value(value) {
    this.setAttribute("value", String(value ?? ""));
  }
}

if (!customElements.get("fx-option")) customElements.define("fx-option", FxOption);
