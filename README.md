# Flare UX

A pattern library of native web components (`fx-*` custom elements) for building
apps -- form controls, navigation, overlays, feedback and data -- drawn with one
set of `--fx-*` color, type, spacing and icon tokens, in the system's own UI
font.

No framework, no build step, no runtime dependencies: the icons and palette are
files in this package, the font is the one every system already has, and
nothing loads from the network.

## Run the docs

```sh
npm run dev        # http://127.0.0.1:9999
```

The docs site (`index.html`, `docs/`) is built with the library itself: an
`fx-app-shell` with a resizable navigation panel, and a page per foundation and
component with live examples and API tables.

## Use it

```sh
npm install @run-time/flare-ux      # npm update @run-time/flare-ux to upgrade
```

With a bundler (Vite, esbuild, …):

```js
import "@run-time/flare-ux/flare.css";                  // tokens, colors, base styles
import "@run-time/flare-ux";                            // every component and icon
import "@run-time/flare-ux/components/fx-button.js";    // or only what a page uses
import { toast } from "@run-time/flare-ux/components/fx-toast.js";
```

```html
<fx-button variant="filled" icon="plus">New project</fx-button>
<fx-status-chip tone="pass">Passed</fx-status-chip>
```

The package exports `@run-time/flare-ux`, `/components/*`, `/icons/*`,
`/lib/*`, `/styles/*` and `/flare.css` (and `/src/*` for the full paths).

Without installing anything, load it from a CDN (pin a version):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@run-time/flare-ux@0.1/src/styles/flare.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@run-time/flare-ux@0.1/src/index.js"></script>
```

## Release

```sh
npm version patch      # or minor / major: bumps package.json, commits, tags
npm publish            # runs npm run check first
git push --follow-tags
```

## What is in it

| | |
|---|---|
| **Actions** | `fx-button`, `fx-split-button`, `fx-segmented-button`, `fx-dropdown-menu` |
| **Inputs** | `fx-form` (validation and messages), `fx-text-field`, `fx-select`, `fx-combobox`, `fx-slider`, `fx-file-drop`, `fx-checkbox`, `fx-radio`, `fx-toggle` (all form-associated, on `FxFormControl`) |
| **Navigation** | `fx-app-shell`, `fx-nav`, `fx-tabs`, `fx-breadcrumb`, `fx-pagination`, `fx-accordion`, `fx-steps` |
| **Overlays** | `fx-dialog`, `fx-drawer`, `fx-popup-alert` (`confirmAction`, `askInputs`, `alertMessage`), `fx-tool-tip` |
| **Feedback** | `fx-notification`, `fx-toast` (`toast()`), `fx-status-chip`, `fx-count-badge`, `fx-spinner`, `fx-progress`, `fx-skeleton`, `fx-empty-state` |
| **Data** | `fx-data-table`, `fx-chart`, `fx-card`, `fx-summary-card`, `fx-avatar`, `fx-tag`, `fx-trendicator`, `fx-copy-block`, `fx-icon` |

## Foundations

- **Color** -- the palette as `--fx-color-<family>-<step>`
  (`src/styles/colors.css`): red, orange, yellow, green, teal, blue, purple,
  magenta and three grays, steps 10 to 100 -- and 16 chart colors,
  `--fx-color-chart-01` … `-16`, for the series of a chart. Semantic tokens sit on top
  (`src/styles/tokens.css`): `--fx-background`,
  `--fx-layer`, `--fx-text`, `--fx-interactive`, … Light by default; dark
  follows the system or `<html data-fx-theme="dark">`.
- **Status** -- four alert states, one color each, with a second name:

  | State | Also | Color |
  |---|---|---|
  | error | fail | `#da1e28` (red 60) |
  | incomplete | unknown | `#ff832b` (orange 40) |
  | warning | pause | `#fddc69` (yellow 20) |
  | success | pass | `#24a148` (green 50) |

  Each as `--fx-status-<state>`, `-bg`, `-text` (AA-legible) and `-on`. Every
  component's `tone` attribute takes either name, plus `info` and `neutral`.
- **Type** -- the system UI font (`system-ui`: San Francisco, Segoe UI, Roboto…)
  on a 12-60px type scale, as
  `--fx-type-*` font shorthands and `.fx-type-*` classes.
- **Spacing and size** -- `--fx-spacing-01` … `-13` (2-160px) and control heights
  `--fx-size-xs` … `-xl` (24-64px).
- **Icons** -- Flare UX's own outline icons (`src/icons/core.js`, 24px grid,
  2px round strokes), in a registry of named sets (`src/icons/registry.js`);
  `registerIconSet()` adds your own.

## For AI agents

[AGENTS.md](AGENTS.md) tells an AI coding agent working in an app that uses
Flare UX which component to reach for and the rules to follow, and ends with
the rules for working on Flare UX itself. It ships with the package.
CLAUDE.md only points Claude Code at it.

## Conventions

- Elements are `fx-*`, custom events `fx:*`, localStorage keys `fx.*`, CSS
  custom properties `--fx-*` (private ones `--_*`).
- Components read tokens only; they never hard-code colors. Theme by setting
  tokens, never by reaching into a shadow root (use `::part()` where exposed).
- Custom elements never match `:checked` -- read `.checked`.

## Scripts

| | |
|---|---|
| `npm run dev` | Serve the docs (no install needed) |
| `npm run check` | Every script parses, every component is exported, nothing loads from the network, element names are `fx-*` |
| `npm run build:colors` | Regenerate `colors.css` and `palette.js` -- the palette is computed from one key color per family (`scripts/build-colors.mjs`) |

## Licenses

Flare UX ships no third-party material: the components, icons and palette are
its own, and the font is the system's.
