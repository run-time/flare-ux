// npm run check: the library's own rules.
//   - every .js file parses
//   - every component module is exported from src/index.js
//   - nothing under src/ loads from the network (Flare UX is self-contained)
//   - every element name is fx-*, every element defined once

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const problems = [];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (name === "node_modules" || name.startsWith(".")) return [];
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const files = walk(root);
const js = files.filter((file) => /\.(m?js)$/.test(file));
for (const file of js) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (error) {
    problems.push(`${relative(root, file)} does not parse:\n${error.stderr}`);
  }
}

const index = readFileSync(join(root, "src/index.js"), "utf8");
for (const file of files.filter((f) => f.includes(`${join("src", "components")}`) && f.endsWith(".js"))) {
  const name = relative(join(root, "src"), file).replaceAll("\\", "/");
  if (!index.includes(`./${name}`)) problems.push(`src/index.js does not export ${name}`);
}

const defined = new Map();
for (const file of files.filter((f) => f.includes(`${join(root, "src")}`))) {
  const text = readFileSync(file, "utf8");
  if (/\.(js|css|html)$/.test(file) && /(?:import|@import|url\(|src=|href=)[^\n]*https?:\/\//.test(text)) {
    problems.push(`${relative(root, file)} loads something from the network`);
  }
  for (const [, tag] of text.matchAll(/customElements\.define\(\s*"([^"]+)"/g)) {
    if (!tag.startsWith("fx-")) problems.push(`${relative(root, file)} defines <${tag}>: element names start with fx-`);
    if (defined.has(tag)) problems.push(`<${tag}> is defined in both ${defined.get(tag)} and ${relative(root, file)}`);
    defined.set(tag, relative(root, file));
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`ok: ${js.length} scripts, ${defined.size} elements`);
