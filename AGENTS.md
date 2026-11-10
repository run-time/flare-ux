# Flare UX -- for AI agents

Flare UX is a library of native web components (`fx-*` custom elements). This
file has two parts: for an agent writing UI in an app that uses Flare UX --
what to reach for, and the rules that keep generated code consistent with the
rest of the app -- and, at the end, for an agent working on Flare UX itself. The
docs site (`npm run dev` in this package, then http://127.0.0.1:9999) has every
component's examples and full API.

## Setup

```sh
npm install @run.time/flare-ux
```

```js
import "@run.time/flare-ux/flare.css";   // tokens, colors, base styles
import "@run.time/flare-ux";             // every component and icon
```

Or import one component: `import "@run.time/flare-ux/components/fx-button.js";`.
Without a bundler, load `src/styles/flare.css` and `src/index.js` from
`https://cdn.jsdelivr.net/npm/@run.time/flare-ux@0.1/`.
No build step, no framework: components are plain HTML elements and work in any
framework's templates.

## Rules

- **Use the `fx-*` component, never the native control or a hand-built one.**
  A button is `<fx-button>`, a dropdown `<fx-select>`, a checkbox
  `<fx-checkbox>`, a modal `<fx-dialog>`. Do not style `<button>`, `<select>`
  or `<input>` yourself.
- **Colors come from tokens, never hex values.** Use the semantic tokens
  (`--fx-text`, `--fx-text-secondary`, `--fx-layer`, `--fx-border`,
  `--fx-interactive`, …) for UI, and palette tokens
  (`--fx-color-<family>-<step>`, e.g. `--fx-color-teal-60`) only for
  decoration; `--fx-color-chart-01` … `-16`, in order, for chart series.
  Spacing is `--fx-spacing-01` … `-13`, type is
  `font: var(--fx-type-body-01)` and friends, radius `--fx-radius*`. The full
  list is the docs' All Tokens page, or `src/styles/tokens.css`.
- **Status has four states, each with two names:** error (fail), incomplete
  (unknown), warning (pause), success (pass) -- plus info and neutral. Any
  `tone` attribute takes either name: `<fx-status-chip tone="pass">`. Use these
  for state; never invent a red or green.
- **Icons are named:** `<fx-icon name="refresh">`, or the `icon` attribute of
  buttons, fields and nav items. Names are in `src/icons/core.js` (and the
  docs' All Icons page). Do not paste in SVG.
- **Inputs are form controls.** They post with their `<form>`, reset with it,
  validate (`required`, `pattern`, `min`, …) and fire `input` / `change`. Read
  `.value` (`.checked` for checkbox and toggle -- custom elements never match
  `:checked`). Wrap a form in `<fx-form>` for validation messages.
- **Events are `fx:*`** for anything beyond input / change / click:
  `fx:nav-select`, `fx:toggle`, `fx:page`, `fx:remove`, `fx:submit`, …
- **Theme by setting tokens**, on `:root` or any element, never by reaching
  into a component's shadow root. Dark mode follows the system, or
  `<html data-fx-theme="dark">`.

## Components

| Need | Use |
|---|---|
| An action | `<fx-button variant="filled \| tonal \| outlined \| text \| danger" icon="plus">Save</fx-button>`; `loading` shows a spinner |
| An action with a choice beside it | `<fx-split-button value="…">Run <fx-option slot="menu" value="…">…</fx-option></fx-split-button>` |
| One of a few options, side by side | `<fx-segmented-button value="a"><fx-option value="a">A</fx-option>…</fx-segmented-button>` |
| A menu of actions | `<fx-dropdown-menu>` with a `slot="trigger"` and `<button data-value>` items; `fx:menu-select` |
| Text input | `<fx-text-field label="Name" name="name" required>`; `multiline`, `type="email \| number \| search …"`, `icon`, `prefix-text` |
| Pick one (short list) | `<fx-select label="Region" name="region"><option value="…">…</option></fx-select>` |
| Pick from a long list, or several | `<fx-combobox label="Repo" name="repo">` with `<option>`s; `multiple`, `select-all`, `allow-custom`; `.load = async (query, { signal }) => options` to fetch as the user types |
| Yes / no | `<fx-checkbox name="x">` or `<fx-toggle name="x">`, each inside a `<label>` with its text |
| One of several, listed | `<fx-radio name="size" value="s">` in `<label>`s |
| A number on a range | `<fx-slider label="Limit" min="1" max="10" value="3">` |
| Files | `<fx-file-drop name="files" multiple accept=".pdf" max-size="5MB">` |
| A form with validation | `<fx-form><form>…fields… <fx-button type="submit">…</fx-button></form></fx-form>`; fields take `invalid-text` / `valid-text`; listen for `fx:submit` |
| Page layout | `<fx-app-shell>` with `<fx-nav slot="nav">` (set `.items`); `filter` adds a search field |
| Tabs | `<fx-tabs>` (`.tabs = [{ id, label }]`) |
| Where the page is | `<fx-breadcrumb>` with `<a>` children, the current page last as a `<span>` |
| Paging a list | `<fx-pagination total="340" page-size="25">`; `fx:page` gives `start` / `end` for `slice()` |
| Sections that open and shut | `<fx-accordion>` with `<span slot="header">` and content; `name` for one at a time, `cycle` for groups of cards |
| Steps of a flow | `<fx-steps>` (`.items = [{ label, state: "complete \| active \| waiting \| failed \| skipped \| pending" }]`) |
| A modal | `<fx-dialog headline="…">`; `confirmAction()`, `askInputs()`, `alertMessage()` from `fx-popup-alert.js` for the common cases |
| A side panel | `<fx-drawer headline="…">` |
| A hint on hover | `<fx-tool-tip text="…">…</fx-tool-tip>` |
| A message in the page | `<fx-notification tone="error" headline="…">` |
| A brief message that goes away | `import { toast } from "@run.time/flare-ux/components/fx-toast.js"; toast("Saved", { tone: "success" })` |
| A state on an item | `<fx-status-chip tone="fail">Failed</fx-status-chip>` |
| A count | `<fx-count-badge tone="error">3</fx-count-badge>` (or `color="teal"`) |
| A label or filter chip | `<fx-tag>`; `label="Repo" removable` for a set filter, `selectable` for a toggle |
| A person | `<fx-avatar name="Ada Lovelace" src="…">` |
| Loading | `<fx-spinner>` (unknown length), `<fx-progress value="40" label="…">` (known), `<fx-skeleton lines="3">` (placeholders) |
| Nothing to show | `<fx-empty-state heading="No runs yet" icon="…">` with a `slot="actions"` button |
| A box of content | `<fx-card heading="…">`; `href` makes it a link |
| A headline number | `<fx-summary-card count="12" text="Open">` |
| A chart | `<fx-chart type="column \| bar \| line \| area" label="…">` with `.data = { labels, series: [{ name, values }] }`; `stacked`, `value-labels`; series colors come from the chart palette unless given |
| Rows of data | `<fx-data-table>` (`.columns`, `.rows`); sorts, opens rows, highlights a search |
| A reading and where it is heading (a glucose reading) | `<fx-trendicator value="92" trend="+2" rotation="45" theme="default \| high \| low \| error …">`; `trendicatorHtml(reading)` from a CGM reading |
| Code to copy | `<fx-copy-block value="…">` |

Each component's file in `src/components/` starts with a comment listing its
attributes, properties, events and slots -- read it before using one in a way
this table does not show.

## Working on Flare UX itself

- Start with README.md. `npm run dev` serves the docs at
  http://127.0.0.1:9999. `npm run check` must pass before any change is done.
- No build step and no runtime dependencies. Everything under `src/` is plain
  ES modules and CSS; nothing may load from the network (the check enforces
  it).
- Names: elements `fx-*`, events `fx:*`, localStorage keys `fx.*`, CSS custom
  properties `--fx-*` (component-private ones `--_*`).
- Components draw only with tokens from `src/styles/tokens.css`; never
  hard-code a color. Status colors go through `src/lib/tones.js` (`toneCss`,
  `toneOf`, `toneSelectors`) so every tone name and alias works everywhere; a
  `color` attribute that takes a palette name goes through
  `src/lib/palette-color.js`.
- Inputs extend `FxFormControl` (`src/components/fx-form-control.js`) and are
  form-associated; fields that show their own messages use `feedback()` and
  `FIELD_CSS`, so they work with `fx-form`. Icons come from the registry
  (`src/icons/registry.js`), never inline in a component unless private to it.
- When a design question comes up (layout, spacing, sizing), follow IBM
  Carbon.
- A new component: add `src/components/fx-<name>.js` (opening with a comment
  of its attributes, properties, events and slots), export it from
  `src/index.js`, add its page (examples + API) to `docs/pages/components.js`,
  and list it in README.md and in the Components table above.
- Generated files -- `src/styles/colors.css` and `src/lib/palette.js` -- are
  rebuilt by `scripts/build-colors.mjs`, not edited.
- Icons are drawn for Flare UX in `src/icons/core.js` (24px grid, 2px round
  strokes). Never copy icon artwork from another library.
- Pitfalls met before: `Number(this.getAttribute(x))` is 0 when the attribute
  is absent, not the default -- check for null first. A container query on an
  element inside a flex column sizes it as if narrow; measure with a
  ResizeObserver instead. Test a change in the docs in a browser, not only
  with the check.
