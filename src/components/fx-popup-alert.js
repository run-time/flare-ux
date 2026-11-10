import { escapeHtml } from "../lib/escape.js";
import { toneOf } from "../lib/tones.js";
import "./fx-button.js";
import "./fx-checkbox.js";
import "./fx-text-field.js";

/**
 * <fx-popup-alert>: confirm, alert and prompt dialogs in place of the
 * browser's -- which carry the page's origin rather than the app's name,
 * hold only plain text, and read as a browser warning rather than as part
 * of the page. Used through three functions:
 *
 *   if (await confirmAction({ title: "Delete project?", message: "…", tone: "error", confirmLabel: "Delete" })) …
 *   const values = await askInputs({ title: "Rename", fields: [{ key: "name", label: "Name", value: "Atlas", required: true }] });
 *   await alertMessage("The file could not be saved.", { detail: "The disk is full." });
 *
 * One instance is mounted on demand and reused: a modal <dialog> in the light
 * DOM sits above every room and shadow root, and brings Esc, the backdrop and
 * focus handling with it.
 */

// The headline bar's fill and text, and the confirm button's variant. A
// status tone by any of its names; accent (the default) for plain questions.
const shadeOf = (tone) => {
  if (tone === "high") tone = "error";
  if (tone === "medium") tone = "warning";
  const status = tone && tone !== "accent" ? toneOf(tone, "") : "";
  if (!status) return { bar: "var(--fx-interactive)", on: "var(--fx-text-on-color)", variant: "filled" };
  return { bar: `var(--fx-status-${status}-fill)`, on: `var(--fx-status-${status}-on)`, variant: status === "error" ? "danger" : "filled" };
};

// A small rounded count after a row's hint: `{ text, tone, title }`, tone
// "info" (blue, the default) or any status tone.
function badgeHtml(badge) {
  if (!badge?.text) return "";
  return `<span class="badge" style="--_tone-bg: var(--fx-status-${toneOf(badge.tone, "info")}-bg); --_tone-text: var(--fx-status-${toneOf(badge.tone, "info")}-text)"${badge.title ? ` title="${escapeHtml(badge.title)}"` : ""}>${escapeHtml(badge.text)}</span>`;
}

// One further line of a row: plain text, or `{ text, flag, tone }` where the
// flag follows the text in its tone's color (warn, fail) -- the part of the
// line that says what is wrong.
function lineHtml(line) {
  if (typeof line === "string") return `<small class="line">${escapeHtml(line)}</small>`;
  const flag = line.flag
    ? `<span class="flag tone-${line.tone ?? "warn"}">${escapeHtml(line.flag)}</span>`
    : "";
  return `<small class="line">${escapeHtml(line.text ?? "")}${line.text && flag ? " · " : ""}${flag}</small>`;
}

// A row's bar: `{ max, segments: [{ value, tone, label }] }`, drawn left to
// right as shares of `max` -- e.g. what is already spent, then what this
// would spend. Tones: muted, ok, warn, fail.
function meterHtml(meter) {
  if (!meter?.max) return "";
  let left = 100;
  const segments = (meter.segments ?? [])
    .map((segment) => {
      const width = Math.min(left, Math.max(0, (segment.value / meter.max) * 100));
      left -= width;
      return width
        ? `<span class="meter-seg tone-${segment.tone ?? "muted"}" style="width:${width.toFixed(2)}%"${segment.label ? ` title="${escapeHtml(segment.label)}"` : ""}></span>`
        : "";
    })
    .join("");
  return `<span class="meter" role="img" aria-label="${escapeHtml(meter.label ?? "")}">${segments}</span>`;
}

// A row's leading status: will do fine, close to a limit, will not finish.
const STATUS_ICONS = {
  ok: `<svg class="status status-ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Will finish"><circle cx="12" cy="12" r="10"></circle><path d="m7.5 12.5 3 3 6-6.5"></path></svg>`,
  warn: `<svg class="status status-warn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Close to a limit"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>`,
  fail: `<svg class="status status-fail" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Will not finish"><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>`,
};

export class FxPopupAlert extends HTMLElement {
  #resolve = null;

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
  }

  /**
   * Open the dialog and resolve once it closes: true when confirmed, false
   * when canceled/dismissed, or "alternate" when the secondary action is
   * chosen.
   */
  /**
   * `rows` is an optional list of `{ label, value, hint, badges, lines,
   * meter, footer, status, indent }` -- all but label optional. `hintHtml`
   * stands in for `hint` when the caller has built (and escaped) markup.
   * `badges` follow the hint (see badgeHtml), `lines` are further lines under
   * it, `meter` a bar under those (see meterHtml) and `footer` lines under
   * the bar. `indent` lines a row without a status up with those that have
   * one. Shown as a
   * small list under the message -- figures to weigh before confirming. A
   * `status` of "ok", "warn" or "fail" leads the row with a green check, a
   * yellow warning or a red cross. `warning` is
   * an optional line in a yellow box above the buttons.
   *
   * `fields` turns it into a small form: a list of `{ key, label, value,
   * placeholder, help, required }`, one text box each. Then it resolves to
   * `{ [key]: value }` when confirmed (Enter in a box confirms too) and to
   * null when canceled.
   *
   * `alternateLabel` adds a secondary action between Cancel and Confirm.
   * It resolves to "alternate" when selected.
   */
  ask({
    title = "Confirm",
    message = "",
    detail = "",
    rows = [],
    warning = "",
    confirmLabel = "Confirm",
    alternateLabel = "",
    cancelLabel = "Cancel",
    tone = "accent",
    fields = [],
    // Markup the caller built and escaped itself, shown under the message. Never pass text from elsewhere here.
    html = "",
    wide = false,
  } = {}) {
    const isForm = fields.length > 0;
    const shade = shadeOf(tone);
    this.shadowRoot.innerHTML = `
      <style>
        dialog {
          width: min(30rem, calc(100vw - 2rem));
          padding: 0;
          overflow: hidden;
          border: 0;
          border-radius: var(--fx-radius-lg);
          background: var(--fx-layer);
          color: var(--fx-text);
          box-shadow: var(--fx-shadow-lg);
        }
        dialog::backdrop { background: var(--fx-overlay); }
        .head {
          padding: var(--fx-spacing-04) var(--fx-spacing-05);
          background: ${shade.bar};
          color: ${shade.on};
          font: var(--fx-type-heading-02);
        }
        .body { padding: var(--fx-spacing-05); }
        p { margin: 0; font: var(--fx-type-body-01); }
        p + p { margin-top: var(--fx-spacing-03); color: var(--fx-text-secondary); font: var(--fx-type-helper-01); }
        code { font: var(--fx-type-code-01); overflow-wrap: anywhere; }
        /* One line a row -- what, how much, and the detail -- set apart by
           weight and color rather than columns, so a short label does not
           leave a third of the dialog empty. Wraps only when it must. */
        .rows { list-style: none; margin: var(--fx-spacing-04) 0 0; padding: 0; font: var(--fx-type-body-compact-01); }
        .rows li { padding: 0.4rem 0; border-top: 1px solid var(--fx-border); }
        .rows .row-label { margin-right: 0.4rem; color: var(--fx-text); font-weight: 700; }
        .rows strong { margin-right: 0.4rem; color: var(--fx-interactive-text); font-weight: 600; font-variant-numeric: tabular-nums; }
        .rows small { color: var(--fx-text-secondary); font: var(--fx-type-helper-01); }
        /* A leading status icon; the row's text wraps under its own start,
           not under the icon. */
        .rows li.has-status { position: relative; padding-left: 1.45rem; }
        .rows .status { position: absolute; left: 0; top: 0.47rem; width: 1rem; height: 1rem; }
        .rows .status-ok { color: var(--fx-status-success-text); }
        .rows .status-warn { color: var(--fx-status-warning-text); }
        .rows .status-fail { color: var(--fx-status-error-text); }
        /* Further lines of a row, each on its own line under the first. */
        .rows small.line { display: block; }
        .rows .badge { display: inline-block; margin-left: 0.4rem; padding: 0 0.4rem; border-radius: var(--fx-radius-pill); background: var(--_tone-bg); color: var(--_tone-text); font: 600 var(--fx-font-size-01)/1.5 var(--fx-font); font-variant-numeric: tabular-nums; vertical-align: 1px; }
        .rows .flag.tone-warn { color: var(--fx-status-warning-text); }
        .rows .flag.tone-fail { color: var(--fx-status-error-text); }
        .rows .meter { display: flex; height: 6px; margin-top: 0.35rem; background: var(--fx-layer-alt); }
        .rows .meter-seg { height: 100%; }
        .rows .meter-seg.tone-muted { background: var(--fx-border-strong); }
        .rows .meter-seg.tone-ok { background: var(--fx-status-success); }
        .rows .meter-seg.tone-warn { background: var(--fx-status-warning); }
        .rows .meter-seg.tone-fail { background: var(--fx-status-error); }
        form.fields { display: flex; flex-direction: column; gap: var(--fx-spacing-05); margin-top: var(--fx-spacing-04); }
        form.fields:first-child { margin-top: 0; }
        .field-check { display: flex; align-items: center; gap: var(--fx-spacing-04); color: var(--fx-text); font: var(--fx-type-body-compact-01); cursor: pointer; }
        .custom { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.75rem; }
        /* A prompt wants more room than a one-line input. */
        dialog.wide { width: min(38rem, calc(100vw - 2rem)); }
        .warning { margin-top: var(--fx-spacing-04); padding: var(--fx-spacing-03) var(--fx-spacing-04); white-space: pre-line; border-left: 3px solid var(--fx-status-warning); border-radius: var(--fx-radius); background: var(--fx-status-warning-bg); color: var(--fx-status-warning-text); font: var(--fx-type-body-compact-01); }
        .actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--fx-spacing-03);
          padding: var(--fx-spacing-04) var(--fx-spacing-05);
          border-top: 1px solid var(--fx-border);
          background: var(--fx-layer-alt);
        }
        /* An alert has nothing to decide, so its one button is the way out. */
        .actions.single { justify-content: flex-end; }
      </style>
      <dialog aria-labelledby="popup-title"${wide || (isForm && fields.some((field) => field.multiline)) ? ' class="wide"' : ""}>
        <div class="head" id="popup-title">${escapeHtml(title)}</div>
        <div class="body">
          ${message ? `<p>${escapeHtml(message)}</p>` : ""}
          ${detail ? `<p>${escapeHtml(detail)}</p>` : ""}
          ${html ? `<div class="custom">${html}</div>` : ""}
          ${
            isForm
              ? `<form class="fields" novalidate>${fields
                  .map(
                    (field, index) => field.type === "checkbox"
                      ? `<label class="field field-check">
                          <fx-checkbox id="popup-field-${index}" data-field="${escapeHtml(field.key)}" ${field.value ? "checked" : ""} color="var(--fx-interactive)"></fx-checkbox>
                          <span>${escapeHtml(field.label ?? field.key)}</span>
                        </label>`
                      : // A multiline field takes a paragraph -- a prompt --
                        // so Enter is a newline there, not a submit; Enter in
                        // a one-line field submits the form (confirms).
                        `<fx-text-field id="popup-field-${index}" data-field="${escapeHtml(field.key)}" block
                          label="${escapeHtml(field.label ?? field.key)}" value="${escapeHtml(field.value ?? "")}"
                          placeholder="${escapeHtml(field.placeholder ?? "")}"
                          ${field.help ? `supporting-text="${escapeHtml(field.help)}"` : ""}
                          ${field.multiline ? 'multiline rows="6" mono' : ""} ${field.required ? "required" : ""}></fx-text-field>`,
                  )
                  .join("")}</form>`
              : ""
          }
          ${
            rows.length
              ? `<ul class="rows">${rows
                  .map(
                    (row) =>
                      `<li${row.status || row.indent ? ` class="has-status"` : ""}>${row.status ? STATUS_ICONS[row.status] ?? "" : ""}<span class="row-label">${escapeHtml(row.label)}</span>${row.value ? `<strong>${escapeHtml(row.value)}</strong>` : ""}${row.hintHtml ? `<small>${row.hintHtml}</small>` : row.hint ? `<small>${escapeHtml(row.hint)}</small>` : ""}${(row.badges ?? []).map(badgeHtml).join("")}${(row.lines ?? []).filter(Boolean).map(lineHtml).join("")}${meterHtml(row.meter)}${(row.footer ?? []).filter(Boolean).map(lineHtml).join("")}</li>`,
                  )
                  .join("")}</ul>`
              : ""
          }
          ${warning ? `<div class="warning">${escapeHtml(warning)}</div>` : ""}
        </div>
        <div class="actions${cancelLabel ? "" : " single"}">
          ${cancelLabel ? `<fx-button variant="outlined" data-close="cancel">${escapeHtml(cancelLabel)}</fx-button>` : ""}
          ${alternateLabel ? `<fx-button variant="tonal" data-close="alternate">${escapeHtml(alternateLabel)}</fx-button>` : ""}
          <fx-button variant="${shade.variant}" data-close="confirm">${escapeHtml(confirmLabel)}</fx-button>
        </div>
      </dialog>`;

    const dialog = this.shadowRoot.querySelector("dialog");
    const form = dialog.querySelector("form.fields");
    // A form answers with what was typed; a plain dialog with true or false.
    const confirm = () => {
      if (form) {
        const missing = [...form.querySelectorAll("fx-text-field[required]")].find((input) => !input.value.trim());
        if (missing) {
          missing.focus();
          return;
        }
        this.#settle(
          Object.fromEntries(
            [...form.querySelectorAll("[data-field]")].map((input) => [
              input.dataset.field,
              input.localName === "fx-checkbox" ? input.checked : input.value,
            ]),
          ),
        );
      } else {
        this.#settle(true);
      }
      dialog.close();
    };
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      confirm();
    });
    dialog.querySelectorAll("[data-close]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.close === "alternate") {
          this.#settle("alternate");
          dialog.close();
          return;
        }
        if (button.dataset.close === "confirm") {
          confirm();
          return;
        }
        this.#settle(isForm ? null : false);
        dialog.close();
      });
    });
    // A form holds what somebody typed, so only its own buttons close it --
    // not the backdrop, and not Escape. A drag that ends outside the field
    // (resizing it, selecting its text) is reported as a click on the
    // backdrop, and used to throw the whole prompt away.
    if (isForm) {
      dialog.addEventListener("cancel", (event) => event.preventDefault());
    } else {
      // Clicking the backdrop lands on the dialog element itself. Only a
      // click that also started there, so a drag out of the dialog does not
      // count as one.
      let pressedBackdrop = false;
      dialog.addEventListener("pointerdown", (event) => {
        pressedBackdrop = event.target === dialog;
      });
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog && pressedBackdrop) dialog.close();
      });
    }
    dialog.addEventListener("close", () => this.#settle(isForm ? null : false));

    return new Promise((resolve) => {
      this.#resolve = resolve;
      dialog.showModal();
      const first = dialog.querySelector("[data-field]");
      if (first) {
        first.focus();
        first.select?.(); // an fx-text-field; not an <fx-checkbox>
      } else {
        dialog.querySelector('[data-close="confirm"]').focus();
      }
    });
  }

  #settle(answer) {
    const resolve = this.#resolve;
    this.#resolve = null;
    resolve?.(answer);
  }
}

if (!customElements.get("fx-popup-alert")) customElements.define("fx-popup-alert", FxPopupAlert);

function popup() {
  let element = document.querySelector("fx-popup-alert");
  if (!element) {
    element = document.createElement("fx-popup-alert");
    document.body.append(element);
  }
  return element;
}

/** Ask before doing something. Resolves true only on an explicit confirm. */
export function confirmAction(options) {
  return popup().ask(options);
}

/**
 * Ask for a few values before going ahead -- a job's inputs before it runs.
 * Resolves to `{ [key]: value }`, or null when canceled.
 */
export function askInputs(options) {
  return popup().ask(options);
}

/** Say what went wrong. One button, and nothing to decide. */
export function alertMessage(
  message,
  { title = "Something went wrong", detail = "" } = {},
) {
  return popup().ask({
    title,
    message,
    detail,
    tone: "error",
    confirmLabel: "OK",
    cancelLabel: "",
  });
}
