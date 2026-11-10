// The Flare UX docs site: a hash router over the pages in pages/*.js, drawn
// with Flare UX's own components -- the shell, the nav, the tables.

import "../src/index.js";
import { escapeHtml } from "../src/lib/escape.js";
import { FOUNDATIONS } from "./pages/foundations.js";
import { COMPONENTS } from "./pages/components.js";
import { OVERVIEW } from "./pages/overview.js";

const page = document.getElementById("page");
const nav = document.querySelector("fx-nav");

// The version in the nav footer, from package.json so a release updates it.
fetch(new URL("../package.json", import.meta.url))
  .then((response) => response.json())
  .then(({ version }) => {
    const footer = document.querySelector(".nav-footer");
    if (footer && version) footer.textContent = `v${version}`;
  })
  .catch(() => {});

// ------------------------------------------------------------- the pages

const routes = new Map();
routes.set("", OVERVIEW);
for (const doc of FOUNDATIONS) routes.set(`foundations/${doc.id}`, doc);
for (const doc of COMPONENTS) routes.set(`components/${doc.id}`, doc);

nav.items = [
  {
    heading: "Foundations",
    id: "foundations",
    items: [
      { id: "", label: "Overview", href: "#/", icon: "home" },
      ...FOUNDATIONS.map((doc) => ({ id: `foundations/${doc.id}`, label: doc.title, href: `#/foundations/${doc.id}`, icon: doc.icon })),
    ],
  },
  {
    heading: "Components",
    id: "components",
    items: [...COMPONENTS]
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((doc) => ({ id: `components/${doc.id}`, label: doc.title, href: `#/components/${doc.id}`, icon: doc.icon })),
  },
];

// ------------------------------------------------------------ rendering

/** One example: the live markup, then its source to copy. */
export function exampleHtml(example) {
  const source = example.html.trim().replace(/^\n+|\s+$/g, "");
  return `<section class="example">
    ${example.title ? `<h3>${escapeHtml(example.title)}</h3>` : ""}
    ${example.description ? `<p class="example-desc">${example.description}</p>` : ""}
    <div class="demo ${example.layout ?? ""}" data-example>${source}</div>
    <fx-copy-block></fx-copy-block>
  </section>`;
}

const API_COLUMNS = [
  { key: "name", label: "Name", render: (row) => `<code>${escapeHtml(row.name)}</code>` },
  { key: "type", label: "Type", render: (row) => (row.type ? `<code>${escapeHtml(row.type)}</code>` : "") },
  { key: "default", label: "Default", render: (row) => (row.default ? `<code>${escapeHtml(row.default)}</code>` : "") },
  { key: "description", label: "Description", render: (row) => row.description ?? "" },
];

function apiTables(doc) {
  const sections = [
    ["Attributes and properties", doc.attributes],
    ["Events", doc.events],
    ["Methods", doc.methods],
    ["Slots", doc.slots],
    ["CSS custom properties", doc.cssProperties],
  ].filter(([, rows]) => rows?.length);
  return sections
    .map(([heading, rows], index) => `<h3>${heading}</h3><fx-data-table class="api" static size="sm" label="${heading}" data-api="${index}"></fx-data-table>`)
    .join("");
}

function wireApiTables(doc) {
  const sections = [doc.attributes, doc.events, doc.methods, doc.slots, doc.cssProperties].filter((rows) => rows?.length);
  page.querySelectorAll("fx-data-table[data-api]").forEach((table, index) => {
    const rows = sections[index].map(([name, type, def, description]) => ({ name, type, default: def, description }));
    const hasType = rows.some((row) => row.type);
    const hasDefault = rows.some((row) => row.default);
    table.columns = API_COLUMNS.filter((col) => (col.key !== "type" || hasType) && (col.key !== "default" || hasDefault));
    table.rows = rows;
  });
}

function render(doc) {
  const examples = doc.examples ?? [];
  page.innerHTML = `
    <div class="eyebrow">${escapeHtml(doc.section ?? "")}</div>
    <h1>${escapeHtml(doc.title)}</h1>
    ${doc.lead ? `<p class="lead">${doc.lead}</p>` : ""}
    ${doc.body ? doc.body() : ""}
    ${examples.length ? `<h2>Examples</h2>${examples.map(exampleHtml).join("")}` : ""}
    ${doc.attributes || doc.events || doc.methods ? `<h2>API</h2>${doc.tag ? `<p><code>&lt;${doc.tag}&gt;</code> &mdash; import <code>@run.time/flare-ux/components/${doc.tag}.js</code>, or all of <code>@run.time/flare-ux</code>.</p>` : ""}${apiTables(doc)}` : ""}
    ${doc.notes ? `<h2>Notes</h2>${doc.notes}` : ""}
  `;
  // Each example's source, from the template, before any script changes the live copy.
  page.querySelectorAll(".example").forEach((section, index) => {
    section.querySelector("fx-copy-block").value = examples[index].html.trim();
    examples[index].script?.(section.querySelector("[data-example]"));
  });
  wireApiTables(doc);
  doc.mount?.(page);
}

function route() {
  const path = location.hash.replace(/^#\/?/, "").replace(/\/$/, "");
  const doc = routes.get(path) ?? OVERVIEW;
  nav.selected = routes.has(path) ? path : "";
  document.title = doc === OVERVIEW ? "Flare UX" : `${doc.title} · Flare UX`;
  render(doc);
  page.parentElement?.scrollTo?.(0, 0);
  page.closest("fx-app-shell")?.shadowRoot?.querySelector(".main")?.scrollTo(0, 0);
  // Focus the new page's heading region, so a keyboard or screen reader
  // starts reading from it -- not on first load.
  if (route.loaded) page.focus({ preventScroll: true });
  route.loaded = true;
}

window.addEventListener("hashchange", route);
route();

// ------------------------------------------------------------ the theme

const toggle = document.getElementById("theme-toggle");
const root = document.documentElement;
function currentTheme() {
  return root.dataset.fxTheme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}
function syncToggle() {
  const dark = currentTheme() === "dark";
  toggle.setAttribute("icon", dark ? "sun" : "moon");
  toggle.setAttribute("aria-label", dark ? "Light theme" : "Dark theme");
  toggle.title = dark ? "Light theme" : "Dark theme";
}
toggle.addEventListener("click", () => {
  root.dataset.fxTheme = currentTheme() === "dark" ? "light" : "dark";
  try {
    localStorage.setItem("fx.docs.theme", root.dataset.fxTheme);
  } catch {}
  syncToggle();
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", syncToggle);
syncToggle();
