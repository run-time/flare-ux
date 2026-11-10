// Foundations: colors, status, type, spacing, icons and theming.

import { PALETTE } from "../../src/lib/palette.js";
import { iconNames, iconSvg } from "../../src/icons/registry.js";
import { escapeHtml } from "../../src/lib/escape.js";
import { toast } from "../../src/components/fx-toast.js";

// ---------------------------------------------------- copying tokens

/** Copy `text`, and toast what was copied -- in a badge of `color` if it is one. */
async function copyWithToast(text, color = "") {
  try {
    await navigator.clipboard.writeText(text);
    const shown = color
      ? `<code class="toast-swatch" style="background:${color};color:${inkFor(color)}">${escapeHtml(text)}</code>`
      : `<code>${escapeHtml(text)}</code>`;
    toast(`<span class="toast-copied">Copied ${shown}</span>`, { html: true });
  } catch {
    toast("Could not copy to the clipboard", { tone: "error" });
  }
}

/** Dark or light text for a background, by its luminance. */
function inkFor(color) {
  const probe = document.createElement("span");
  probe.style.color = color;
  document.body.append(probe);
  const [r, g, b] = getComputedStyle(probe)
    .color.match(/[\d.]+/g)
    .map(Number);
  probe.remove();
  const lin = (v) =>
    (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.3
    ? "#161616"
    : "#ffffff";
}

/** The color a token stands for, or "" when it is not a color. */
function tokenColor(token) {
  const probe = document.createElement("span");
  probe.style.backgroundColor = `var(${token})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).backgroundColor;
  probe.remove();
  // Not a color (the declaration was invalid) or fully transparent: no swatch.
  // Only an alpha of 0 is transparent -- rgb(235, 98, 0) ends in 0 too.
  const transparent =
    color === "transparent" ||
    /^rgba\([^)]*,\s*0\)$/.test(color) ||
    /\/\s*0\)$/.test(color);
  return /^(rgba?|color)\(/.test(color) && !transparent ? color : "";
}

const TOKEN = /^--fx-[a-z0-9-]+$/;
const listening = new WeakSet();
const HEX = /^#[0-9a-f]{3,8}$/i;

// Every token name or hex value written in a page's code -- not a pattern
// like --fx-status-<state> -- copies on click (or Enter): a token as
// var(--fx-…), a hex as itself.
function mountCopyTokens(page) {
  for (const code of page.querySelectorAll("code")) {
    if (code.closest("a, fx-copy-block, .swatch, fx-data-table")) continue;
    const text = code.textContent.trim();
    if (!TOKEN.test(text) && !HEX.test(text)) continue;
    const copy = TOKEN.test(text) ? `var(${text})` : text;
    code.classList.add("copyable");
    code.dataset.copyText = copy;
    code.tabIndex = 0;
    code.setAttribute("role", "button");
    code.title = `Copy ${copy}`;
  }
  // The page element outlives each page drawn in it: listen once.
  if (listening.has(page)) return;
  listening.add(page);
  const run = (code) =>
    copyWithToast(
      code.dataset.copyText,
      HEX.test(code.dataset.copyText)
        ? code.dataset.copyText
        : tokenColor(code.textContent.trim()),
    );
  page.addEventListener("click", (event) => {
    const code = event.target.closest("code.copyable");
    if (code) run(code);
  });
  page.addEventListener("keydown", (event) => {
    const code = event.target.closest?.("code.copyable");
    if (code && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      run(code);
    }
  });
}

// The Colors page: a swatch copies its variable, its hex value copies the hex,
// and a toast says which one is on the clipboard.
function mountColors(page) {
  page.querySelectorAll(".swatches").forEach((el) =>
    el.addEventListener("click", async (event) => {
      const target = event.target.closest("[data-copy]");
      if (!target) return;
      copyWithToast(
        target.dataset.copy,
        target.closest(".swatch").style.background,
      );
    }),
  );
}

const STATUSES = [
  {
    tone: "error",
    alias: "fail",
    family: "red",
    hex: "#da1e28",
    step: "red-60",
    use: "Something failed or is broken. Needs action now.",
  },
  {
    tone: "incomplete",
    alias: "unknown",
    family: "orange",
    hex: "#ff832b",
    step: "orange-40",
    use: "Not finished, or its state cannot be known yet.",
  },
  {
    tone: "warning",
    alias: "pause",
    family: "yellow",
    hex: "#fddc69",
    step: "yellow-20",
    use: "Paused, or close to a limit. Worth a look.",
  },
  {
    tone: "success",
    alias: "pass",
    family: "green",
    hex: "#24a148",
    step: "green-50",
    use: "Passed, done, healthy.",
  },
];

function colorsBody() {
  // Round the color wheel, then the grays; any family not listed follows.
  const ORDER = ["red", "orange", "yellow", "green", "teal", "blue", "purple", "magenta", "gray", "cool-gray", "warm-gray"];
  const rank = (name) =>
    ORDER.includes(name) ? ORDER.indexOf(name) : ORDER.length;
  const familyHtml = (list) => list
    .map(
      (family) =>
        `<div class="swatch-family"><h3>${escapeHtml(family.name.replace("-", " "))}</h3><div class="swatches">${family.steps
          .map(({ step, hex }) => {
            const name = `--fx-color-${family.name}-${step}`;
            const ink = Number(step) >= 60 ? "#fff" : "#161616";
            return `<button class="swatch" style="background:${hex};color:${ink}" data-copy="var(${name})" title="Copy var(${name})"><b>${step}</b><span class="hex" data-copy="${hex}" title="Copy ${hex}">${hex}</span></button>`;
          })
          .join("")}</div></div>`,
    )
    .join("");
  // The hues round the color wheel; the grays after black and white.
  const sorted = [...PALETTE.families].sort((a, b) => rank(a.name) - rank(b.name));
  const families = {
    hues: familyHtml(sorted.filter((family) => !family.name.endsWith("gray"))),
    grays: familyHtml(sorted.filter((family) => family.name.endsWith("gray"))),
  };
  // The chart colors: eight light, then the same hues dark.
  const chart = PALETTE.chart
    .map(({ step, hex }) => {
      const name = `--fx-color-chart-${step}`;
      // The light row (01-08) takes dark text; the dark row light text.
      const ink = Number(step) <= 8 ? "#161616" : "#fff";
      return `<button class="swatch" style="background:${hex};color:${ink}" data-copy="var(${name})" title="Copy var(${name})"><b>${step}</b><span class="hex" data-copy="${hex}" title="Copy ${hex}">${hex}</span></button>`;
    })
    .join("");
  const singles = PALETTE.singles
    .filter((single) => !single.name.endsWith("-hover"))
    .map(
      ({ name, hex }) =>
        `<button class="swatch" style="background:${hex};color:${name === "black" ? "#fff" : "#161616"};box-shadow: inset 0 0 0 1px var(--fx-border)" data-copy="var(--fx-color-${name})" title="Copy var(--fx-color-${name})"><b>${name}</b><span class="hex" data-copy="${hex}" title="Copy ${hex}">${hex}</span></button>`,
    )
    .join("");
  return `
    <p>Every color in the palette is a custom property, <code>--fx-color-&lt;family&gt;-&lt;step&gt;</code> -- <code>--fx-color-blue-60</code>, <code>--fx-color-cool-gray-10</code> -- with its hover shade as <code>…-hover</code>. Steps 10 to 50 take dark text; 60 to 100 take light text. Click a swatch to copy its variable, or its hex value to copy that.</p>
    <p>Components never use palette colors directly: they use the semantic tokens on the <a href="#/foundations/theming">Theming</a> page, which map onto this palette and change with the theme. The four alert colors are on the <a href="#/foundations/status">Status</a> page.</p>
    <p>The chart colors, <code>--fx-color-chart-01</code> to <code>-16</code>, are sixteen told apart at a glance for the series of a bar or line chart: eight light colors (01-08), then the same eight hues dark (09-16).</p>
    <h2>Palette</h2>
    <div class="swatch-family"><h3>Chart</h3><div class="swatches chart">${chart}</div></div>
    <hr class="palette-rule">
    ${families.hues}
    <hr class="palette-rule">
    ${families.grays}
    <div class="swatch-family"><h3>Black &amp; white</h3><div class="swatches pair">${singles}</div></div>
`;
}

// One state a row. The bar's title is its own family's darkest shade (100),
// so all four read alike; set large (20px semibold) so even dark red on
// red 60 passes WCAG AA for large text.
function statusGrid() {
  const cap = (word) => word[0].toUpperCase() + word.slice(1);
  return `<div class="status-grid">${STATUSES.map(
    (s) => `<div class="status-card">
      <div class="fill" style="background: var(--fx-status-${s.tone}-fill); color: var(--fx-status-${s.tone}-on)">${cap(s.tone)} / ${cap(s.alias)}</div>
      <div class="meta">
        <p>${s.use}</p>
        <div class="facts">
          <fx-status-chip tone="${s.tone}">${cap(s.alias)}</fx-status-chip>
          <code>--fx-status-${s.tone}</code>
          <span><code>--fx-color-${s.step}</code> &middot; <code>${s.hex}</code></span>
        </div>
      </div></div>`,
  ).join("")}</div>`;
}

function statusBody() {
  return `
    <p>Flare UX classifies every alert into one of four states. Each state has exactly one color, and a second name so code can say whichever reads better: <code>tone="error"</code> and <code>tone="fail"</code> are the same.</p>
    ${statusGrid()}
    <h2>Tokens</h2>
    <p>Each state comes as five tokens. Use the exact color for marks that carry the state on their own -- a dot, a bar, an icon -- the <code>-fill</code> and <code>-on</code> pair for solid surfaces, and the <code>-text</code> color for words, because yellow and orange are too light to read as text on white.</p>
    <table class="token-table">
      <thead><tr><th>Token</th><th>Use</th></tr></thead>
      <tbody>
        <tr><td><code>--fx-status-&lt;state&gt;</code></td><td>The state's exact color: dots, bars, solid fills, icons.</td></tr>
        <tr><td><code>--fx-status-&lt;state&gt;-bg</code></td><td>A tint to sit behind content in that state.</td></tr>
        <tr><td><code>--fx-status-&lt;state&gt;-text</code></td><td>Text in that state's color, AA on the page and on the tint.</td></tr>
        <tr><td><code>--fx-status-&lt;state&gt;-fill</code></td><td>Solid surfaces: chips, badges, dialog headers. The exact color, except error, a step lighter (<code>--fx-color-red-50</code>) so every fill takes dark text.</td></tr>
        <tr><td><code>--fx-status-&lt;state&gt;-on</code></td><td>Text on the fill.</td></tr>
      </tbody>
    </table>
    <p>Two more tones complete the set and work everywhere a status does: <code>info</code> (blue, something to know) and <code>neutral</code> (gray, nothing at all).</p>
    <h2>In components</h2>
    <div class="demo column" style="border-bottom: 1px solid var(--fx-border); border-radius: var(--fx-radius)">
      <div class="row">
        <fx-status-chip tone="fail">Failed</fx-status-chip>
        <fx-status-chip tone="unknown">Unknown</fx-status-chip>
        <fx-status-chip tone="pause">Paused</fx-status-chip>
        <fx-status-chip tone="pass">Passed</fx-status-chip>
        <fx-status-chip tone="info">Queued</fx-status-chip>
        <fx-status-chip>Draft</fx-status-chip>
      </div>
      <div class="row">
        <fx-status-chip tone="fail" variant="solid">Failed</fx-status-chip>
        <fx-status-chip tone="unknown" variant="solid">Unknown</fx-status-chip>
        <fx-status-chip tone="pause" variant="solid">Paused</fx-status-chip>
        <fx-status-chip tone="pass" variant="solid">Passed</fx-status-chip>
      </div>
      <fx-notification tone="error" headline="Deploy failed." style="width:100%">Two checks did not pass.</fx-notification>
      <fx-notification tone="incomplete" headline="Results incomplete." style="width:100%">One runner has not reported back.</fx-notification>
      <fx-notification tone="warning" headline="Sync paused." style="width:100%">It resumes at midnight.</fx-notification>
      <fx-notification tone="success" headline="All checks passed." style="width:100%">Ready to merge.</fx-notification>
    </div>`;
}

const TYPE_STYLES = [
  ["heading-07", "Light, for a page's hero"],
  ["heading-06", "Display"],
  ["heading-05", "Page title"],
  ["heading-04", "Section title"],
  ["heading-03", "Sub-section"],
  ["heading-02", "Card and panel titles"],
  ["heading-01", "Small headings, table headers"],
  ["body-02", "Long-form reading"],
  ["body-01", "Default body text"],
  ["body-compact-01", "Controls and dense UI"],
  ["label-01", "Field labels"],
  ["helper-01", "Helper and supporting text"],
  ["code-01", "Code"],
];

function typographyBody() {
  return `
    <p>Flare UX is set in the system's own UI font -- <code>--fx-font</code>, which is <code>system-ui</code>: San Francisco on Apple devices, Segoe UI on Windows, Roboto on Android and ChromeOS, falling back to Helvetica, Arial and finally the browser's <code>sans-serif</code>. Nothing is downloaded, text draws at once, and it reads as native on every platform. Code uses <code>--fx-font-mono</code>, the system's monospace.</p>
    <p>To set a different typeface, load it and set <code>--fx-font</code> on <code>:root</code>.</p>
    <p>Each style is a <code>font</code> shorthand token -- <code>font: var(--fx-type-body-01)</code> -- and a class, <code>.fx-type-body-01</code>.</p>
    <h2>Type styles</h2>
    ${TYPE_STYLES.map(
      ([name, use]) =>
        `<div class="type-row"><div class="meta"><code>--fx-type-${name}</code><br>${use}</div><div style="font: var(--fx-type-${name})">${name.startsWith("code") ? "const flare = ux();" : "Ship the thing that works"}</div></div>`,
    ).join("")}
    <h2>Weights</h2>
    ${[300, 400, 500, 600, 700].map((w) => `<div class="type-row"><div class="meta"><code>font-weight: ${w}</code></div><div style="font: ${w} var(--fx-font-size-06) var(--fx-font)">The quick brown fox jumps over the lazy dog</div></div>`).join("")}
    <h2>Scale</h2>
    <p>The raw sizes, <code>--fx-font-size-01</code> (12px) to <code>--fx-font-size-13</code> (60px): 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 54, 60.</p>`;
}

const SPACING = [
  ["01", 2],
  ["02", 4],
  ["03", 8],
  ["04", 12],
  ["05", 16],
  ["06", 24],
  ["07", 32],
  ["08", 40],
  ["09", 48],
  ["10", 64],
  ["11", 80],
  ["12", 96],
  ["13", 160],
];

function spacingBody() {
  return `
    <p>A spacing scale on a 2px/8px rhythm. Use these for padding, gaps and margins rather than raw numbers, so a page keeps the components' rhythm.</p>
    <h2>Spacing</h2>
    ${SPACING.map(([step, px]) => `<div class="spacing-row"><code>--fx-spacing-${step}</code><span>${px}px</span><div class="spacing-bar" style="width:${px}px"></div></div>`).join("")}
    <h2>Control sizes</h2>
    <p>Heights for buttons, fields and rows. Components take <code>size="xs | sm | md | lg"</code>; <code>md</code> is the default.</p>
    ${[
      ["xs", 24],
      ["sm", 32],
      ["md", 40],
      ["lg", 48],
      ["xl", 64],
    ]
      .map(
        ([size, px]) =>
          `<div class="spacing-row"><code>--fx-size-${size}</code><span>${px}px</span><div class="spacing-bar" style="width:${px}px;height:${px}px"></div></div>`,
      )
      .join("")}
    <h2>Layout</h2>
    <p>Breakpoints: <strong>sm</strong> 320px, <strong>md</strong> 672px, <strong>lg</strong> 1056px, <strong>xlg</strong> 1312px, <strong>max</strong> 1584px. Custom properties cannot be used in media queries, so write them as numbers: <code>@media (min-width: 672px)</code>. <code>fx-app-shell</code> folds its navigation into an overlay under 672px.</p>
    <p>Corners: <code>--fx-radius-sm</code> 2px, <code>--fx-radius</code> 4px, <code>--fx-radius-lg</code> 8px, <code>--fx-radius-xl</code> 12px, <code>--fx-radius-pill</code>. Elevation: <code>--fx-shadow-sm</code>, <code>--fx-shadow</code>, <code>--fx-shadow-lg</code>. Motion: <code>--fx-duration-fast-01</code> (75ms) to <code>--fx-duration-slow-01</code> (400ms), which drop to zero when the reader prefers reduced motion.</p>`;
}

function iconsBody() {
  return `
    <p>Click an icon to copy its name. The <a href="#/components/icon">Icon</a> page shows how to use them and add your own.</p>
    <div class="token-search">
      <fx-text-field type="search" icon="search" label="Find an icon" placeholder="arrow, user, file…" block data-icon-search></fx-text-field>
      <div class="icon-count" aria-live="polite" data-icon-count></div>
    </div>
    <div class="icon-grid" data-icon-grid></div>
    <p class="token-empty" data-icon-empty hidden>No icon matches.</p>`;
}

// An icon's name to the clipboard, and a toast showing the icon and its name.
async function copyIcon(name) {
  try {
    await navigator.clipboard.writeText(name);
    toast(
      `<span class="toast-copied">Copied ${iconSvg(name)}<code>${escapeHtml(name)}</code></span>`,
      { html: true },
    );
  } catch {
    toast("Could not copy to the clipboard", { tone: "error" });
  }
}

function mountIcons(page) {
  const grid = page.querySelector("[data-icon-grid]");
  const search = page.querySelector("[data-icon-search]");
  const count = page.querySelector("[data-icon-count]");
  const all = iconNames().sort((a, b) => a.use.localeCompare(b.use));
  const draw = () => {
    const needle = search.value.trim().toLowerCase();
    const shown = all.filter(
      (icon) => !needle || icon.name.toLowerCase().includes(needle),
    );
    count.textContent = `${shown.length} of ${all.length} icons`;
    page.querySelector("[data-icon-empty]").hidden = shown.length > 0;
    grid.hidden = shown.length === 0;
    // The name with what was typed marked, as on All Tokens.
    const named = (name) => {
      const at = needle ? name.toLowerCase().indexOf(needle) : -1;
      return at < 0 ? escapeHtml(name) : `${escapeHtml(name.slice(0, at))}<mark>${escapeHtml(name.slice(at, at + needle.length))}</mark>${escapeHtml(name.slice(at + needle.length))}`;
    };
    grid.innerHTML = shown
      .map(
        (icon) =>
          `<button class="icon-cell" data-name="${escapeHtml(icon.use)}" title="Copy ${escapeHtml(icon.use)}">${iconSvg(icon.use).replace("<svg", '<svg width="24" height="24"')}<span>${named(icon.use)}</span></button>`,
      )
      .join("");
  };
  search.addEventListener("input", draw);
  grid.addEventListener("click", (event) => {
    const cell = event.target.closest(".icon-cell");
    if (cell) copyIcon(cell.dataset.name);
  });
  draw();
}

const TOKENS = [
  [
    "Surfaces",
    [
      "--fx-background",
      "--fx-layer",
      "--fx-layer-alt",
      "--fx-layer-hover",
      "--fx-layer-selected",
      "--fx-border",
      "--fx-border-strong",
      "--fx-overlay",
      "--fx-inverse",
    ],
  ],
  [
    "Text",
    [
      "--fx-text",
      "--fx-text-secondary",
      "--fx-text-placeholder",
      "--fx-text-disabled",
      "--fx-text-on-color",
      "--fx-inverse-text",
    ],
  ],
  [
    "Interactive",
    [
      "--fx-interactive",
      "--fx-interactive-hover",
      "--fx-interactive-text",
      "--fx-interactive-subtle",
      "--fx-focus",
      "--fx-link",
      "--fx-link-hover",
      "--fx-control-border",
    ],
  ],
];

function themingBody() {
  return `
    <p>Components are drawn entirely with <code>--fx-*</code> custom properties, which reach into every shadow root. A page themes Flare UX by setting tokens -- on <code>:root</code> for the whole page, or on any element for the part of the page inside it.</p>
    <fx-copy-block data-theme-example></fx-copy-block>
    <h2>Light and dark</h2>
    <p>Light (a <code>--fx-color-gray-10</code> page with white layers) is the default. Dark (a <code>--fx-color-gray-100</code> page) follows the system setting unless the page chooses: <code>&lt;html data-fx-theme="dark"&gt;</code> or <code>"light"</code>. The toggle in this site's header does exactly that.</p>
    <h2>Semantic tokens</h2>
    ${TOKENS.map(
      ([group, names]) =>
        `<h3>${group}</h3><table class="token-table"><thead><tr><th style="width:3rem"></th><th>Token</th><th>Value</th></tr></thead><tbody>${names
          .map(
            (name) =>
              `<tr><td><span class="token-chip" style="background: var(${name})"></span></td><td><code>${name}</code></td><td data-token="${name}"></td></tr>`,
          )
          .join("")}</tbody></table>`,
    ).join("")}
    <p>Status tokens are on the <a href="#/foundations/status">Status</a> page; type, spacing, size, shape, elevation and motion tokens on their own pages. Every token is defined in <code>src/styles/tokens.css</code>.</p>`;
}

function mountTheming(page) {
  page.querySelector("[data-theme-example]").value =
    `/* A brand color for one app */
:root {
  --fx-interactive: var(--fx-color-purple-60);
  --fx-interactive-hover: var(--fx-color-purple-60-hover);
  --fx-interactive-text: var(--fx-color-purple-60);
  --fx-interactive-subtle: var(--fx-color-purple-10);
  --fx-focus: var(--fx-color-purple-60);
  --fx-radius: 0;          /* square corners */
}`;
  const style = getComputedStyle(document.documentElement);
  const fill = () =>
    page
      .querySelectorAll("[data-token]")
      .forEach(
        (cell) =>
          (cell.innerHTML = `<code>${escapeHtml(style.getPropertyValue(cell.dataset.token).trim())}</code>`),
      );
  fill();
  new MutationObserver(fill).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-fx-theme"],
  });
}

// ---------------------------------------------------------- token list

// Every --fx-* custom property the page's stylesheets define on :root, in
// the order they are written.
function allTokens() {
  const names = [];
  const seen = new Set();
  const walk = (rules) => {
    for (const rule of rules) {
      if (rule.styleSheet)
        walk(rule.styleSheet.cssRules); // @import
      else if (rule.cssRules && !rule.selectorText) walk(rule.cssRules); // @media, @supports, @layer
      if (!rule.selectorText?.includes(":root") || !rule.style) continue;
      for (const name of rule.style) {
        if (name.startsWith("--fx-") && !seen.has(name)) {
          seen.add(name);
          names.push(name);
        }
      }
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      walk(sheet.cssRules);
    } catch {} // a sheet from another origin cannot be read
  }
  return names;
}

// The area a token belongs to, by its name.
const TOKEN_AREAS = [
  ["Chart", /^--fx-color-chart-/],
  ["Palette", /^--fx-color-/],
  ["Status", /^--fx-status-/],
  ["Type", /^--fx-(type|font)/],
  ["Spacing", /^--fx-spacing-/],
  ["Sizes", /^--fx-size-/],
  ["Shape and elevation", /^--fx-(radius|shadow)/],
  ["Motion", /^--fx-(duration|easing)/],
  ["Layering", /^--fx-z-/],
  ["Surfaces", /^--fx-(background|layer|border|overlay|inverse(?!-text))/],
  ["Text", /^--fx-(text|inverse-text)/],
  ["Interactive", /^--fx-(interactive|focus|link|control)/],
];

// The set a token sits in within its area -- one per status, one per color
// family -- so each set gets its own block. The status aliases come first.
const STATUS_ALIASES = ["fail", "unknown", "pause", "pass"];
function tokenSet(name) {
  const status = /^--fx-status-([a-z]+)/.exec(name);
  if (status)
    return STATUS_ALIASES.includes(status[1]) &&
      name === `--fx-status-${status[1]}`
      ? "aliases"
      : status[1];
  const family = /^--fx-color-([a-z]+(?:-gray)?)-\d/.exec(name);
  if (family) return family[1];
  if (name.startsWith("--fx-color-")) return "singles";
  return "";
}

function tokenListBody() {
  const root = getComputedStyle(document.documentElement);
  const groups = new Map([
    ...TOKEN_AREAS.map(([area]) => [area, []]),
    ["Other", []],
  ]);
  for (const name of allTokens()) {
    const area =
      TOKEN_AREAS.find(([, test]) => test.test(name))?.[0] ?? "Other";
    groups.get(area).push({ name, value: root.getPropertyValue(name).trim() });
  }
  // Each area's tokens in sets, in the order the sets first appear -- the
  // status aliases first.
  for (const [area, rows] of groups) {
    const order = [];
    for (const row of rows) {
      row.set = tokenSet(row.name);
      if (!order.includes(row.set)) order.push(row.set);
    }
    if (order.includes("aliases"))
      (order.splice(order.indexOf("aliases"), 1), order.unshift("aliases"));
    groups.set(
      area,
      order.flatMap((set) => rows.filter((row) => row.set === set)),
    );
  }
  const total = [...groups.values()].reduce(
    (sum, rows) => sum + rows.length,
    0,
  );
  const sections = [...groups]
    .filter(([, rows]) => rows.length)
    .map(
      ([area, rows]) => `<section class="token-group" data-token-group>
        <h2>${escapeHtml(area)} <fx-count-badge data-group-count>${rows.length}</fx-count-badge></h2>
        <table class="token-table token-list"><colgroup><col class="name-col"><col></colgroup><thead><tr><th>Token</th><th>Value</th></tr></thead><tbody>${rows
          .map(({ name, value, set }, index) => {
            const color = tokenColor(name);
            const gap =
              index > 0 && set !== rows[index - 1].set
                ? `<tr class="set-gap" data-set-gap aria-hidden="true"><td colspan="2"></td></tr>`
                : "";
            return `${gap}<tr data-token-row data-set="${escapeHtml(set)}" data-name="${escapeHtml(name)}" data-value="${escapeHtml(value)}">
              <td><code data-mark>${escapeHtml(name)}</code></td>
              <td><span class="token-value-cell">${color ? `<span class="token-chip" style="background: var(${name})"></span>` : ""}<span class="token-value" data-mark>${escapeHtml(value)}</span></span></td>
            </tr>`;
          })
          .join("")}</tbody></table>
      </section>`,
    )
    .join("");
  return `
    <div class="token-search">
      <fx-text-field type="search" icon="search" label="Find a token" placeholder="status, radius, #da1e28…" block data-token-search></fx-text-field>
      <div class="icon-count" aria-live="polite" data-token-count>${total} of ${total} tokens</div>
    </div>
    ${sections}
    <p class="token-empty" data-token-empty hidden>No token matches.</p>`;
}

function mountTokenList(page) {
  const search = page.querySelector("[data-token-search]");
  const count = page.querySelector("[data-token-count]");
  const rows = [...page.querySelectorAll("[data-token-row]")];
  const groups = [...page.querySelectorAll("[data-token-group]")];
  const empty = page.querySelector("[data-token-empty]");
  const mark = (text, needle) => {
    if (!needle) return escapeHtml(text);
    const lower = text.toLowerCase();
    let out = "";
    let at = 0;
    for (
      let found = lower.indexOf(needle);
      found !== -1;
      found = lower.indexOf(needle, at)
    ) {
      out += `${escapeHtml(text.slice(at, found))}<mark>${escapeHtml(text.slice(found, found + needle.length))}</mark>`;
      at = found + needle.length;
    }
    return out + escapeHtml(text.slice(at));
  };
  const filter = () => {
    const needle = search.value.trim().toLowerCase();
    let shown = 0;
    for (const row of rows) {
      const match =
        !needle ||
        row.dataset.name.toLowerCase().includes(needle) ||
        row.dataset.value.toLowerCase().includes(needle);
      row.hidden = !match;
      if (match) shown++;
      const [name, value] = row.querySelectorAll("[data-mark]");
      name.innerHTML = mark(row.dataset.name, match ? needle : "");
      value.innerHTML = mark(row.dataset.value, match ? needle : "");
    }
    for (const group of groups) {
      const visibleRows = [
        ...group.querySelectorAll("[data-token-row]:not([hidden])"),
      ];
      // Stripe the rows still showing, each set from its first row, so a
      // value reads across to its token.
      let stripe = 0;
      visibleRows.forEach((row, index) => {
        if (
          index === 0 ||
          row.dataset.set !== visibleRows[index - 1].dataset.set
        )
          stripe = 0;
        row.classList.toggle("alt", stripe++ % 2 === 1);
      });
      // A gap only between two sets that both still show rows.
      for (const gap of group.querySelectorAll("[data-set-gap]")) {
        let before = gap.previousElementSibling;
        while (before && (before.hidden || before.hasAttribute("data-set-gap")))
          before = before.previousElementSibling;
        let after = gap.nextElementSibling;
        while (after && after.hidden && !after.hasAttribute("data-set-gap"))
          after = after.nextElementSibling;
        gap.hidden = !before || !after || after.hasAttribute("data-set-gap");
      }
      const visible = visibleRows.length;
      group.hidden = visible === 0;
      group.querySelector("[data-group-count]").textContent = String(visible);
    }
    count.textContent = `${shown} of ${rows.length} tokens`;
    empty.hidden = shown > 0;
  };
  search.addEventListener("input", filter);
  // A click anywhere on a row copies its token, as a click on the name does.
  for (const table of page.querySelectorAll(".token-list")) {
    table.addEventListener("click", (event) => {
      const row = event.target.closest("[data-token-row]");
      if (!row || event.target.closest("code.copyable")) return;
      row.querySelector("code.copyable")?.click();
    });
  }
  filter();
}

export const FOUNDATIONS = [
  {
    id: "colors",
    title: "Colors",
    icon: "palette",
    section: "Foundations",
    lead: "The Flare UX color palette, and the semantic tokens built on it.",
    body: colorsBody,
    mount: mountColors,
  },
  {
    id: "status",
    title: "Status",
    icon: "status-ok",
    section: "Foundations",
    lead: "Four alert states, one color each: error, incomplete, warning and success.",
    body: statusBody,
  },
  {
    id: "typography",
    title: "Typography",
    icon: "heading",
    section: "Foundations",
    lead: "The system font, on the Flare UX type scale.",
    body: typographyBody,
  },
  {
    id: "spacing",
    title: "Spacing & Layout",
    icon: "ruler",
    section: "Foundations",
    lead: "The spacing scale, control sizes, breakpoints, shape, elevation and motion.",
    body: spacingBody,
  },

  {
    id: "theming",
    title: "Theming",
    icon: "sliders",
    section: "Foundations",
    lead: "Light, dark and your own: every component is drawn with tokens.",
    body: themingBody,
    mount: mountTheming,
  },
  {
    id: "icons",
    title: "All Icons",
    icon: "grid",
    section: "Foundations",
    lead: "Every Flare UX icon. Search by name.",
    body: iconsBody,
    mount: mountIcons,
  },  {
    id: "tokens",
    title: "All Tokens",
    icon: "list",
    section: "Foundations",
    lead: "Every Flare UX token, by area. Search by name or value.",
    body: tokenListBody,
    mount: mountTokenList,
  },
];

// Tokens copy on click on every foundations page, beside each page's own mount.
for (const doc of FOUNDATIONS) {
  const own = doc.mount;
  doc.mount = (page) => {
    own?.(page);
    mountCopyTokens(page);
  };
}
