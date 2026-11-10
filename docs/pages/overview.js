// The landing page: what Flare UX is and how to start.

const START = `<!-- npm install @run.time/flare-ux, then import "@run.time/flare-ux" and its flare.css; or straight from a CDN: -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@run.time/flare-ux@0.1/src/styles/flare.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@run.time/flare-ux@0.1/src/index.js"></script>

<fx-button variant="filled" icon="plus">New project</fx-button>`;

export const OVERVIEW = {
  title: "Flare UX",
  section: "Pattern library",
  lead: "<p><strong>No framework, no build step, no dependencies.</strong></p> <p>Native web components for building apps. Form controls, navigation, feedback and data all drawn with <a href=\"#/foundations/icons\">one set of icons</a> and <a href=\"#/foundations/tokens\">one set of tokens</a>.</p>",
  body: () => `
    <p class="start-line">Simply link the stylesheet, import the components, and use them as HTML…</p>
    <fx-copy-block data-start></fx-copy-block>

    <h2>Principles</h2>
    <ul>
      <li><strong>Native first.</strong> Every input is form-associated: it posts with its form, follows a disabled fieldset, resets with the form and is named by a &lt;label&gt;. Dialogs and menus use &lt;dialog&gt; and the Popover API, so focus, Escape and the top layer come from the browser.</li>
      <li><strong>Themed by tokens.</strong> Components read <code>--fx-*</code> custom properties and never hard-code a color. Light and dark ship built in; a page re-themes by setting tokens, not by reaching into shadow roots.</li>
      <li><strong>One status language.</strong> Four alert states -- error, incomplete, warning, success -- each with one exact color, used the same way by chips, notifications, badges, cards and tables.</li>
      <li><strong>Accessible by default.</strong> Keyboard support, roles, names and live regions are part of each component, and every text color pairing meets WCAG AA.</li>
      <li><strong>Self-contained.</strong> The icons and the palette are files in the package, and the font is the system's own. Nothing loads from the network.</li>
      <li><strong>AI ready.</strong> <code>AGENTS.md</code> tells any AI coding agent which component to reach for, how to use it, and the rules -- tokens not colors, the four status names, icons by name -- so code it writes looks like the rest of the app.</li>
    </ul>

    <h2>Explore</h2>
    <div class="cards">
      <a class="card-link" href="#/foundations/colors"><fx-icon name="palette" size="24"></fx-icon><strong>Colors</strong><span>The full palette and the four status colors.</span></a>
      <a class="card-link" href="#/foundations/typography"><fx-icon name="heading" size="24"></fx-icon><strong>Typography</strong><span>The system font, and the type scale.</span></a>
      <a class="card-link" href="#/foundations/icons"><fx-icon name="grid" size="24"></fx-icon><strong>All Icons</strong><span>Every icon, by name.</span></a>
      <a class="card-link" href="#/components/button"><fx-icon name="cursor" size="24"></fx-icon><strong>Components</strong><span>Buttons, fields, menus, dialogs, tables and more.</span></a>
    </div>
  `,
  mount: (page) => {
    page.querySelector("[data-start]").value = START;
  },
};
