// <fx-file-drop>: files picked by dropping them on a zone, or by clicking
// it to browse -- with the chosen files listed under it, each removable.
//
//   <fx-file-drop label="Attachments" name="files" multiple accept=".png,.jpg,.pdf" max-size="5MB"></fx-file-drop>
//
// Attributes:
//   label, name, supporting-text, required, disabled
//   accept     file types, as an <input type=file> takes them (".pdf",
//              "image/*"); others are turned away with a message
//   multiple   more than one file
//   max-size   the largest file: bytes, or "500KB" / "5MB" / "1GB"
//   max-files  the most files (with multiple)
//
// Form-associated: posts each file under its name (multipart forms),
// resets to none, and is invalid while required and empty. `files` is the
// chosen File list (an array); `change` fires when it changes. A file turned
// away (wrong type, too big, one too many) is named in the error under the
// zone, and not added.

import { FxFormControl } from "./fx-form-control.js";
import { escapeHtml } from "../lib/escape.js";
import { iconSvg } from "../icons/registry.js";
import "../icons/core.js";

let uid = 0;

const UNITS = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };

/** "5MB" -> bytes; a plain number is bytes. */
function parseSize(text) {
  const match = /^\s*([\d.]+)\s*(B|KB|MB|GB)?\s*$/i.exec(String(text ?? ""));
  return match ? Number(match[1]) * UNITS[(match[2] ?? "B").toUpperCase()] : Infinity;
}

/** Bytes as a short size: 812 KB, 4.2 MB. */
export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value < 10 ? Number(value.toFixed(1)) : Math.round(value)} ${units[unit]}`;
}

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host { display: flex; flex-direction: column; gap: var(--fx-spacing-03); min-width: 0; font: var(--fx-type-body-compact-01); color: var(--fx-text); }
    :host([hidden]) { display: none; }
    .label { color: var(--fx-text-secondary); font: var(--fx-type-label-01); letter-spacing: 0.02em; }
    .label:empty { display: none; }
    .req { margin-left: var(--fx-spacing-01); color: var(--fx-status-error); }
    .zone {
      all: unset;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--fx-spacing-02);
      padding: var(--fx-spacing-06) var(--fx-spacing-05);
      border: 1px dashed var(--fx-border-strong);
      border-radius: var(--fx-radius-lg);
      background: var(--fx-layer);
      color: var(--fx-text-secondary);
      text-align: center;
      cursor: pointer;
      transition: background-color var(--fx-duration-fast-02) var(--fx-easing-standard), border-color var(--fx-duration-fast-02) var(--fx-easing-standard);
    }
    .zone:hover { border-color: var(--fx-interactive); background: color-mix(in srgb, var(--fx-interactive) 4%, var(--fx-layer)); }
    .zone:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: 2px; }
    :host([dragging]) .zone { border-style: solid; border-color: var(--fx-interactive); background: var(--fx-interactive-subtle); color: var(--fx-interactive-text); }
    :host([invalid]) .zone { border-color: var(--fx-status-error); }
    :host(:disabled) .zone { cursor: not-allowed; border-color: var(--fx-border); background: var(--fx-layer-alt); color: var(--fx-text-disabled); }
    .zone svg { width: 1.5rem; height: 1.5rem; }
    .zone strong { color: var(--fx-link); font-weight: 600; }
    :host(:disabled) .zone strong { color: inherit; }
    .hint { font: var(--fx-type-helper-01); }
    .hint:empty { display: none; }
    input { display: none; }
    ul { display: flex; flex-direction: column; gap: var(--fx-spacing-02); margin: 0; padding: 0; list-style: none; }
    ul:empty { display: none; }
    li { display: flex; align-items: center; gap: var(--fx-spacing-03); min-height: var(--fx-size-sm); padding: 0 var(--fx-spacing-02) 0 var(--fx-spacing-04); border: 1px solid var(--fx-border); border-radius: var(--fx-radius); background: var(--fx-layer); }
    li svg { width: 1rem; height: 1rem; flex: none; color: var(--fx-text-secondary); }
    .name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .size { color: var(--fx-text-secondary); font: var(--fx-type-helper-01); font-variant-numeric: tabular-nums; }
    .remove { all: unset; display: inline-grid; place-items: center; width: 1.5rem; height: 1.5rem; border-radius: var(--fx-radius-sm); color: var(--fx-text-secondary); cursor: pointer; }
    .remove:hover { background: var(--fx-layer-hover); color: var(--fx-text); }
    .remove:focus-visible { outline: 2px solid var(--fx-focus); outline-offset: 1px; }
    .support { color: var(--fx-text-secondary); font: var(--fx-type-helper-01); }
    .support:empty { display: none; }
    .support.error { color: var(--fx-status-error-text); }
  </style>
  <span class="label" part="label"></span>
  <button type="button" class="zone" part="zone" data-focus>
    <span aria-hidden="true" class="zone-icon"></span>
    <span class="prompt"><strong></strong><span class="rest"></span></span>
    <span class="hint" part="hint"></span>
  </button>
  <input type="file" tabindex="-1" aria-hidden="true">
  <ul part="list" aria-live="polite"></ul>
  <div class="support" part="supporting-text" aria-live="polite"></div>
`;

export class FxFileDrop extends FxFormControl {
  static observedAttributes = ["label", "accept", "multiple", "max-size", "max-files", "supporting-text", "error-text", "invalid-text", "valid-text", "invalid", "valid", "required", "disabled", "name"];

  #id = `fx-file-drop-${++uid}`;
  #files = [];
  #rejected = "";
  #zone;
  #input;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open", delegatesFocus: true });
    root.appendChild(template.content.cloneNode(true));
    this.#zone = root.querySelector(".zone");
    this.#input = root.querySelector("input");
    root.querySelector(".zone-icon").innerHTML = iconSvg("upload");
    this.#zone.addEventListener("click", () => {
      if (!this.disabled) this.#input.click();
    });
    this.#input.addEventListener("change", () => {
      this.#add([...this.#input.files]);
      this.#input.value = "";
    });
    // Dragging over the zone (or the whole element) lights it up.
    let depth = 0;
    this.addEventListener("dragenter", (event) => {
      if (this.disabled || !event.dataTransfer?.types.includes("Files")) return;
      event.preventDefault();
      depth++;
      this.toggleAttribute("dragging", true);
    });
    this.addEventListener("dragover", (event) => {
      if (this.disabled || !event.dataTransfer?.types.includes("Files")) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    });
    this.addEventListener("dragleave", () => {
      depth = Math.max(0, depth - 1);
      if (!depth) this.removeAttribute("dragging");
    });
    this.addEventListener("drop", (event) => {
      event.preventDefault();
      depth = 0;
      this.removeAttribute("dragging");
      if (!this.disabled) this.#add([...(event.dataTransfer?.files ?? [])]);
    });
    root.querySelector("ul").addEventListener("click", (event) => {
      const button = event.target.closest(".remove");
      if (!button) return;
      const index = Number(button.dataset.index);
      this.#files.splice(index, 1);
      this.#rejected = "";
      this.#changed();
      // Focus the next file's remove button, or the zone.
      (root.querySelectorAll(".remove")[Math.min(index, this.#files.length - 1)] ?? this.#zone).focus();
    });
  }

  connectedCallback() {
    this.#render();
  }

  attributeChangedCallback() {
    this.#render();
  }

  onDisabledChange() {
    this.#render();
  }

  formResetCallback() {
    this.#files = [];
    this.#rejected = "";
    this.#render();
  }

  /** The chosen files, in the order they were added. */
  get files() {
    return [...this.#files];
  }

  /** Forget every file. */
  clear() {
    this.#files = [];
    this.#rejected = "";
    this.#changed();
  }

  get focusTarget() {
    return this.#zone;
  }

  // ------------------------------------------------------------- adding

  #accepts(file) {
    const accept = (this.getAttribute("accept") ?? "").split(",").map((part) => part.trim().toLowerCase()).filter(Boolean);
    if (!accept.length) return true;
    const name = file.name.toLowerCase();
    const type = (file.type || "").toLowerCase();
    return accept.some((rule) =>
      rule.startsWith(".") ? name.endsWith(rule) : rule.endsWith("/*") ? type.startsWith(rule.slice(0, -1)) : type === rule,
    );
  }

  #add(files) {
    if (!files.length) return;
    const multiple = this.hasAttribute("multiple");
    const maxSize = parseSize(this.getAttribute("max-size"));
    const maxFiles = multiple ? Number(this.getAttribute("max-files")) || Infinity : 1;
    const turnedAway = [];
    let list = multiple ? [...this.#files] : [];
    for (const file of multiple ? files : files.slice(0, 1)) {
      if (!this.#accepts(file)) turnedAway.push(`${file.name} is not a file type this takes`);
      else if (file.size > maxSize) turnedAway.push(`${file.name} is larger than ${formatSize(maxSize)}`);
      else if (list.length >= maxFiles) turnedAway.push(`${file.name}: at most ${maxFiles} files`);
      else list.push(file);
    }
    if (!multiple && files.length > 1) turnedAway.push("Only one file");
    this.#files = list;
    this.#rejected = turnedAway.join(". ");
    this.#changed();
  }

  #changed() {
    this.#render();
    this.fireInput();
    this.fireChange();
  }

  // ------------------------------------------------------------- render

  #render() {
    const root = this.shadowRoot;
    const label = this.getAttribute("label") ?? "";
    root.querySelector(".label").innerHTML = label ? `${escapeHtml(label)}${this.required ? '<span class="req" aria-hidden="true">*</span>' : ""}` : "";
    const multiple = this.hasAttribute("multiple");
    this.#input.multiple = multiple;
    this.#input.accept = this.getAttribute("accept") ?? "";
    this.#zone.disabled = this.disabled;
    this.#zone.querySelector("strong").textContent = multiple ? "Choose files" : "Choose a file";
    this.#zone.querySelector(".rest").textContent = multiple ? " or drop them here" : " or drop it here";

    // What it takes: the types and the size, in a line under the prompt.
    const accept = (this.getAttribute("accept") ?? "").split(",").map((part) => part.trim()).filter(Boolean);
    const hint = [accept.length ? accept.join(", ") : "", this.hasAttribute("max-size") ? `up to ${formatSize(parseSize(this.getAttribute("max-size")))}` : ""]
      .filter(Boolean)
      .join(", ");
    root.querySelector(".hint").textContent = hint;
    this.#zone.setAttribute("aria-label", `${label ? `${label}: ` : ""}${multiple ? "choose files or drop them here" : "choose a file or drop it here"}${hint ? ` (${hint})` : ""}`);

    root.querySelector("ul").innerHTML = this.#files
      .map(
        (file, index) => `<li>${iconSvg("file")}<span class="name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span><span class="size">${formatSize(file.size)}</span>
          <button type="button" class="remove" data-index="${index}" aria-label="Remove ${escapeHtml(file.name)}"${this.disabled ? " disabled" : ""}>${iconSvg("close")}</button></li>`,
      )
      .join("");

    // What the form posts: each file under the name.
    const name = this.getAttribute("name");
    if (name && this.#files.length && !this.disabled) {
      const data = new FormData();
      for (const file of this.#files) data.append(name, file);
      this.syncForm(data);
    } else this.syncForm(null);
    this.syncValidity(this.required && !this.#files.length ? { valueMissing: true } : {}, multiple ? "Please choose at least one file." : "Please choose a file.", this.#zone);

    this.toggleAttribute("invalid", Boolean(this.#rejected) || Boolean(this.getAttribute("error-text")) || (this.hasAttribute("invalid") && !this.validity.valid));
    if (this.hasAttribute("invalid")) this.removeAttribute("valid");
    const feedback = this.#rejected ? { state: "invalid", text: this.#rejected } : this.feedback();
    const support = root.querySelector(".support");
    support.textContent = feedback.text;
    support.classList.toggle("error", feedback.state === "invalid");
    support.id = `${this.#id}-support`;
    if (support.textContent) this.#zone.setAttribute("aria-describedby", support.id);
    else this.#zone.removeAttribute("aria-describedby");
  }

  updateValidity() {
    this.#render();
  }
}

if (!customElements.get("fx-file-drop")) customElements.define("fx-file-drop", FxFileDrop);
