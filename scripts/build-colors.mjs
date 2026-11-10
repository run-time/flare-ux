// Builds src/styles/colors.css and src/lib/palette.js: the Flare UX palette,
// computed here rather than copied from anywhere.
//
//   node scripts/build-colors.mjs        (npm run build:colors)
//
// Each family is one key color. Its ten steps (10, lightest, to 100,
// darkest) share the key's hue and walk down one lightness ladder in OKLCH --
// a color space where equal steps of lightness look equal -- with the most
// color in the middle steps and less at the pale and dark ends. A key pinned
// to a step lands there exactly: the four status colors are keys, so red 60
// is #da1e28, orange 40 #ff832b, yellow 20 #fddc69 and green 50 #24a148.
// Every step has a hover shade a little nearer the middle (darker when light,
// lighter when dark).
//
// Every color becomes --fx-color-<family>-<step> and
// --fx-color-<family>-<step>-hover; black and white are singles. The chart
// colors are a set of their own, --fx-color-chart-01 … -16: sixteen colors
// told apart at a glance -- eight light ones (01-08), then the same eight
// hues dark (09-16) -- for the series of a bar or line chart.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// ------------------------------------------------------- the families

// key: the family's color; at: the step it is pinned to (else its hue and
// chroma guide the family, and no step is forced to it).
const FAMILIES = [
  { name: "red", key: "#da1e28", at: 60 },
  { name: "orange", key: "#ff832b", at: 40 },
  { name: "yellow", key: "#fddc69", at: 20, shape: "light", hueDrift: -14 },
  { name: "green", key: "#24a148", at: 50 },
  { name: "teal", key: { l: 0.56, c: 0.1, h: 188 } },
  { name: "blue", key: { l: 0.53, c: 0.155, h: 248 } },
  { name: "purple", key: { l: 0.53, c: 0.2, h: 296 } },
  { name: "magenta", key: { l: 0.56, c: 0.19, h: 352 } },
  { name: "cool-gray", key: { l: 0.56, c: 0.022, h: 255 }, shape: "flat" },
  { name: "gray", key: { l: 0.56, c: 0, h: 0 }, shape: "flat" },
  { name: "warm-gray", key: { l: 0.56, c: 0.019, h: 60 }, shape: "flat" },
];

const STEPS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
// The lightness of each step, before a pinned key pulls its neighbors.
const LADDER = [0.972, 0.905, 0.83, 0.745, 0.66, 0.565, 0.47, 0.385, 0.3, 0.215];
// How much of the family's color each step carries.
const SHAPES = {
  middle: [0.12, 0.3, 0.55, 0.8, 0.95, 1, 0.9, 0.75, 0.55, 0.35],
  light: [0.32, 0.78, 1, 0.97, 0.9, 0.8, 0.7, 0.58, 0.46, 0.34], // yellow: richest when pale
  flat: [0.6, 0.75, 0.85, 0.95, 1, 1, 1, 0.95, 0.9, 0.85],
};

// ------------------------------------------------------ color math

const toLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const toGamma = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

function hexToOklch(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => toLinear(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363420296 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
}

/** OKLCH to linear sRGB, unclamped -- a channel outside 0..1 is out of gamut. */
function oklchToLinear({ l, c, h }) {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

const inGamut = (rgb) => rgb.every((v) => v >= -0.0001 && v <= 1.0001);

/** The color as hex, its chroma lowered until sRGB can show it. */
function toHex(color) {
  let { c } = color;
  if (!inGamut(oklchToLinear(color))) {
    let low = 0;
    let high = c;
    for (let i = 0; i < 30; i++) {
      const mid = (low + high) / 2;
      if (inGamut(oklchToLinear({ ...color, c: mid }))) low = mid;
      else high = mid;
    }
    c = low;
  }
  return `#${oklchToLinear({ ...color, c })
    .map((v) => Math.round(toGamma(Math.min(1, Math.max(0, v))) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

// ------------------------------------------------------ the palette

function family({ name, key, at, shape = "middle", hueDrift = 0 }) {
  const keyColor = typeof key === "string" ? hexToOklch(key) : key;
  const profile = SHAPES[shape];
  const pin = at ? STEPS.indexOf(at) : 5;
  // The ladder bends so the pinned step lands on the key's lightness; the
  // pull fades over five steps either side.
  const delta = keyColor.l - LADDER[pin];
  const maxChroma = keyColor.c / profile[pin];
  const steps = STEPS.map((step, i) => {
    const l = LADDER[i] + delta * Math.max(0, 1 - Math.abs(i - pin) / 5);
    const h = keyColor.h + hueDrift * (i / (STEPS.length - 1));
    const color = { l, c: maxChroma * profile[i], h };
    const hex = at && i === pin ? key.toLowerCase() : toHex(color);
    const hover = toHex({ ...color, l: l > 0.5 ? l - 0.035 : l + 0.04 });
    return { step, hex, hover };
  });
  return { name, steps };
}

const families = FAMILIES.map(family);
const CHART = [
  // light: 01-08
  "#82a3db", "#94ca6b", "#dcd280", "#f1a75c", "#b68570", "#e36e90", "#b087c7", "#909595",
  // dark, in the same hue order: 09-16
  "#396ab1", "#3e9651", "#948b3d", "#da7c30", "#922428", "#cc2529", "#6b4c9a", "#535154",
].map((hex, index) => ({ step: String(index + 1).padStart(2, "0"), hex }));

const singles = [
  { name: "black", hex: "#000000", hover: "#212121" },
  { name: "white", hex: "#ffffff", hover: "#e8e8e8" },
];

// ---------------------------------------------------------- writing

const root = new URL("../", import.meta.url);
const lines = [
  "/* The Flare UX palette: every step of every color family as a custom",
  "   property, --fx-color-<family>-<step>, and its hover shade as …-hover.",
  "   Generated by scripts/build-colors.mjs -- regenerate rather than edit. */",
  ":root {",
];
for (const single of singles) lines.push(`  --fx-color-${single.name}: ${single.hex};`, `  --fx-color-${single.name}-hover: ${single.hover};`);
lines.push("");
for (const { step, hex } of CHART) lines.push(`  --fx-color-chart-${step}: ${hex};`);
for (const { name, steps } of families) {
  lines.push("");
  for (const { step, hex } of steps) lines.push(`  --fx-color-${name}-${step}: ${hex};`);
  for (const { step, hover } of steps) lines.push(`  --fx-color-${name}-${step}-hover: ${hover};`);
}
lines.push("}", "");
writeFileSync(new URL("src/styles/colors.css", root), lines.join("\n"));

const palette = {
  singles: singles.flatMap(({ name, hex, hover }) => [{ name, hex }, { name: `${name}-hover`, hex: hover }]),
  families: families.map(({ name, steps }) => ({ name, steps: steps.map(({ step, hex }) => ({ step: String(step), hex })) })),
  chart: CHART,
};
writeFileSync(
  new URL("src/lib/palette.js", root),
  `// The Flare UX palette as data, for pages that list it (the docs' Colors page).\n// Generated by scripts/build-colors.mjs -- regenerate rather than edit.\nexport const PALETTE = ${JSON.stringify(palette, null, 2)};\n`,
);
console.log(`${families.length} families, ${singles.length} singles -> ${fileURLToPath(new URL("src/styles/colors.css", root))}`);
