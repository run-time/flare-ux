// One page per component: what it is for, live examples with their source,
// and its API. Rows in attributes / events / methods / slots /
// cssProperties are [name, type, default, description].

import { confirmAction, askInputs, alertMessage } from "../../src/components/fx-popup-alert.js";
import { toast } from "../../src/components/fx-toast.js";

const C = "Components";

const FORM_ATTRS = [
  ["name", "string", "", "The name it posts under in a form."],
  ["disabled", "boolean", "false", "Can't be used; also set by a disabled &lt;fieldset&gt;."],
  ["required", "boolean", "false", "Must have a value for its form to submit."],
];
const FORM_EVENTS = [
  ["input", "Event", "", "While the user changes it (bubbles, composed)."],
  ["change", "Event", "", "When the user commits a change (bubbles)."],
];

const log = (root, text) => {
  const out = root.querySelector(".log");
  if (out) out.textContent = text;
};

export const COMPONENTS = [
  // ------------------------------------------------------------ actions
  {
    id: "button",
    title: "Button",
    tag: "fx-button",
    icon: "cursor",
    section: C,
    lead: "Starts an action. Five levels of emphasis, from <em>filled</em> for the one main action in a view down to <em>link</em>, plus <em>danger</em> for a destructive one.",
    examples: [
      {
        title: "Variants",
        html: `<fx-button variant="filled">Filled</fx-button>
<fx-button variant="tonal">Tonal</fx-button>
<fx-button>Outlined</fx-button>
<fx-button variant="text">Text</fx-button>
<fx-button variant="link">Link</fx-button>
<fx-button variant="danger">Delete</fx-button>`,
      },
      {
        title: "With icons",
        description: "An icon before the text, or an icon alone -- which then needs an <code>aria-label</code>.",
        html: `<fx-button variant="filled" icon="plus">New project</fx-button>
<fx-button icon="download">Export</fx-button>
<fx-button variant="text" icon="refresh" aria-label="Refresh"></fx-button>
<fx-button variant="text" icon="trash" fg-color="var(--fx-status-error-text)" aria-label="Delete"></fx-button>
<fx-button variant="tonal" icon="share" aria-label="Share"></fx-button>`,
      },
      {
        title: "Sizes",
        html: `<fx-button variant="filled" size="xs">Extra small</fx-button>
<fx-button variant="filled" size="sm">Small</fx-button>
<fx-button variant="filled">Medium</fx-button>
<fx-button variant="filled" size="lg">Large</fx-button>`,
      },
      {
        title: "Loading and disabled",
        html: `<fx-button variant="filled" loading>Saving</fx-button>
<fx-button loading>Saving</fx-button>
<fx-button variant="filled" disabled>Disabled</fx-button>
<fx-button disabled>Disabled</fx-button>`,
      },
    ],
    attributes: [
      ["variant", "filled | tonal | outlined | text | link | danger", "outlined", "Emphasis. Aliases: primary, secondary, tertiary, ghost."],
      ["size", "xs | sm | md | lg", "md", "24, 32, 40 or 48px tall."],
      ["icon", "string", "", "An icon name, drawn before the text. Or slot an &lt;svg slot=\"icon\"&gt;."],
      ["loading", "boolean", "false", "Shows a spinner and ignores clicks."],
      ["disabled", "boolean", "false", "Can't be clicked; also set by a disabled &lt;fieldset&gt;."],
      ["type", "button | submit | reset", "button", "What it does to its form."],
      ["fg-color", "CSS color", "", "The text and icon color."],
      ["bg-color", "CSS color", "", "The fill."],
      ["aria-expanded, aria-pressed, aria-haspopup", "", "", "Passed to the inner button for assistive technology."],
    ],
    events: [["click", "MouseEvent", "", "As a native button -- never while disabled or loading."]],
    slots: [["(default)", "", "", "The label."], ["icon", "", "", "An icon in place of the icon attribute."]],
  },
  {
    id: "split-button",
    title: "Split Button",
    tag: "fx-split-button",
    icon: "split-button",
    section: C,
    lead: "An action with a menu beside it -- either the choice the action runs with, or more actions (a combo button).",
    examples: [
      {
        title: "A choice",
        description: "The trailing part shows what the action will run with, and changes it.",
        html: `<fx-split-button value="fast" name="mode">
  Deploy
  <fx-option slot="menu" value="fast" note="default">Fast</fx-option>
  <fx-option slot="menu" value="safe" icon="lock">Safe</fx-option>
  <fx-option slot="menu" value="dry">Dry run</fx-option>
</fx-split-button>
<span class="log"></span>`,
        script: (root) => {
          const split = root.querySelector("fx-split-button");
          split.addEventListener("click", () => log(root, `Deploy (${split.value})`));
          split.addEventListener("change", () => log(root, `Mode: ${split.value}`));
        },
      },
      {
        title: "A model picker",
        description: "A filled action beside an outlined chooser (<code>trail-variant</code>). Each option's <code>color</code> draws its robot in a badge colored by price against Sonnet -- green under 1&times;, blue at 1&times;, yellow to 2.5&times;, red past it.",
        html: `<fx-split-button value="sonnet" name="model" trail-variant="outlined" menu-label="Model">
  Start
  <fx-option slot="menu" value="fable" icon="robot" color="red" note="5×">Fable</fx-option>
  <fx-option slot="menu" value="opus" icon="robot" color="yellow" note="2×">Opus</fx-option>
  <fx-option slot="menu" value="sonnet" icon="robot" color="blue" note="1×">Sonnet</fx-option>
  <fx-option slot="menu" value="haiku" icon="robot" color="green" note="0.5×">Haiku</fx-option>
</fx-split-button>
<span class="log"></span>`,
        script: (root) => {
          const split = root.querySelector("fx-split-button");
          split.addEventListener("click", () => log(root, `Start (${split.value})`));
          split.addEventListener("change", () => log(root, `Model: ${split.value}`));
        },
      },
      {
        title: "A suite to run",
        description: "The menu sets what the Run button does until another suite is picked: the trailing part shows only its chevron (<code>trail-label=\"\"</code>), and the page renames the action on <code>change</code>.",
        html: `<fx-split-button variant="tonal" value="a" name="suite" menu-label="Suite to run" trail-label="">
  <span data-run-label>Run Suite A</span>
  <fx-option slot="menu" value="a">Suite A</fx-option>
  <fx-option slot="menu" value="b">Suite B</fx-option>
  <fx-option slot="menu" value="c">Suite C</fx-option>
  <fx-option slot="menu" value="d">Suite D</fx-option>
  <fx-option slot="menu" value="e">Suite E</fx-option>
  <fx-option slot="menu" value="f">Suite F</fx-option>
</fx-split-button>
<span class="log"></span>`,
        script: (root) => {
          const split = root.querySelector("fx-split-button");
          const label = split.querySelector("[data-run-label]");
          split.addEventListener("click", () => log(root, `Ran ${label.textContent.replace(/^Run /, "")}`));
          split.addEventListener("change", () => {
            const chosen = split.options.find((option) => option.getAttribute("value") === split.value);
            label.textContent = `Run ${chosen.textContent.trim()}`;
          });
        },
      },
    ],
    attributes: [
      ["variant", "filled | tonal | outlined", "filled", "Emphasis."],
      ["trail-variant", "filled | tonal | outlined", "", "The trailing part's own variant, when it differs from the action's."],
      ["size", "sm | md | lg", "md", ""],
      ["menu", "choice | actions", "choice", "Whether the menu picks a value or fires actions."],
      ["value", "string", "first option", "The chosen option (choice menus). Posted with <code>name</code>."],
      ["menu-label", "string", "", "The menu's accessible name."],
      ["trail-label", "string", "", "Text for the trailing part in place of the choice."],
      ["own-menu", "boolean", "false", "Draw no menu; fire <code>fx:trail-click</code> for the page to open its own."],
      ["type", "button | submit", "button", "The leading part submits its form."],
      ["loading, disabled", "boolean", "false", "As on fx-button."],
    ],
    events: [
      ["click", "MouseEvent", "", "The leading part was clicked."],
      ["change", "Event", "", "A new choice was picked."],
      ["fx:menu-select", "CustomEvent", "", "<code>{ value }</code> -- an action was picked (menu=\"actions\")."],
      ["fx:trail-click", "CustomEvent", "", "<code>{ anchor }</code> -- with own-menu."],
    ],
    slots: [["(default)", "", "", "The action's label."], ["menu", "", "", "&lt;fx-option&gt; elements: value, icon, color (the icon in a badge: <code>teal</code> a pale oval, <code>red-80</code> or any CSS color a solid circle), note, disabled."]],
  },
  {
    id: "segmented-button",
    title: "Segmented Button",
    tag: "fx-segmented-button",
    icon: "segments",
    section: C,
    lead: "A small set of options joined into one control -- choose one, like radios, or several. For switching a view or a filter in place.",
    examples: [
      {
        title: "One choice",
        html: `<fx-segmented-button name="range" value="1w" label="Time range">
  <fx-option value="1d">Day</fx-option>
  <fx-option value="1w">Week</fx-option>
  <fx-option value="1m">Month</fx-option>
  <fx-option value="all">All</fx-option>
</fx-segmented-button>`,
      },
      {
        title: "Several, icons, sizes",
        html: `<fx-segmented-button multiple value="bold,italic" label="Text style" size="sm">
  <fx-option value="bold" icon="bold" title="Bold"></fx-option>
  <fx-option value="italic" icon="italic" title="Italic"></fx-option>
  <fx-option value="underline" icon="underline" title="Underline"></fx-option>
</fx-segmented-button>
<fx-segmented-button value="compact" icon-only label="Density">
  <fx-option value="compact" icon="view-compact" title="Compact"></fx-option>
  <fx-option value="detail" icon="view-detail" title="Detail"></fx-option>
</fx-segmented-button>`,
      },
    ],
    attributes: [
      ["value", "string", "", "The chosen value; comma-separated with <code>multiple</code>."],
      ["values", "string[]", "", "Property: the chosen values as a list."],
      ["multiple", "boolean", "false", "Choose several."],
      ["label", "string", "", "The group's accessible name."],
      ["size", "xs | sm | md", "sm", "<code>dense</code> is xs."],
      ["icon-only", "boolean", "false", "Square segments, no check mark."],
      ...FORM_ATTRS,
    ],
    events: FORM_EVENTS,
    slots: [["(default)", "", "", "&lt;fx-option&gt; elements: value, the label inside, icon, title, disabled."]],
  },
  {
    id: "dropdown-menu",
    title: "Dropdown Menu",
    tag: "fx-dropdown-menu",
    icon: "more-vertical",
    section: C,
    lead: "An icon button that opens a short menu of actions -- a row's overflow menu. Arrow keys move through it; Escape or a click outside closes it.",
    examples: [
      {
        html: `<fx-dropdown-menu label="Row actions">
  <button data-value="rename"><fx-icon name="edit"></fx-icon> Rename</button>
  <button data-value="copy"><fx-icon name="copy"></fx-icon> Duplicate</button>
  <hr>
  <button data-value="delete" data-tone="danger"><fx-icon name="trash"></fx-icon> Delete</button>
</fx-dropdown-menu>
<fx-dropdown-menu label="Add" align="start">
  <fx-icon slot="trigger" name="plus"></fx-icon>
  <button data-value="file"><fx-icon name="file-plus"></fx-icon> New file</button>
  <button data-value="folder"><fx-icon name="folder-plus"></fx-icon> New folder</button>
</fx-dropdown-menu>
<span class="log"></span>`,
        script: (root) => root.addEventListener("fx:menu-select", (e) => log(root, `Picked ${e.detail.value}`)),
      },
    ],
    attributes: [
      ["label", "string", "Menu", "The trigger's accessible name and tooltip."],
      ["align", "end | start", "end", "Which edge of the trigger the menu lines up with."],
      ["open", "boolean", "", "Reflected while the menu is showing."],
    ],
    events: [["fx:menu-select", "CustomEvent", "", "<code>{ value }</code> -- the chosen item's data-value."]],
    slots: [["trigger", "", "⋮", "The trigger's icon."], ["(default)", "", "", "&lt;button data-value&gt; items (data-tone=\"danger\" for a destructive one) and &lt;hr&gt; dividers."]],
    cssProperties: [["--fx-dropdown-menu-trigger-size", "length", "--fx-size-sm", ""], ["--fx-dropdown-menu-trigger-radius", "length", "--fx-radius", ""]],
  },

  {
    id: "accordion",
    title: "Accordion",
    tag: "fx-accordion",
    icon: "accordion",
    section: C,
    lead: "Sections that open and shut, with a chevron in front of each header. Stack them for a list of sections, or nest them for groups of cards.",
    examples: [
      {
        title: "Sections",
        description: "Accordions with the same <code>name</code> keep one open at a time.",
        layout: "stack",
        html: `<div>
  <fx-accordion name="faq" open>
    <span slot="header">What does the factory run?</span>
    Each repository's checks, in the order the plan lists them.
  </fx-accordion>
  <fx-accordion name="faq">
    <span slot="header">Where do the logs go?</span>
    Under <code>.factory-ui/</code> in the repository, one folder per run.
  </fx-accordion>
  <fx-accordion name="faq">
    <span slot="header">Can a run be paused?</span>
    Yes -- pausing stops it after the step it is on.
  </fx-accordion>
</div>`,
      },
      {
        title: "Headers with counts and actions",
        description: "The <code>header</code> slot takes the title and anything beside it; the <code>actions</code> slot takes buttons, which never open or shut it.",
        layout: "stack",
        html: `<div>
  <fx-accordion variant="card" open>
    <span slot="header">Failing <fx-count-badge tone="fail">2</fx-count-badge></span>
    <fx-button slot="actions" variant="text" size="sm" icon="refresh">Rerun all</fx-button>
    <p style="margin:0">Beacon -- 2 checks did not pass.</p>
  </fx-accordion>
  <fx-accordion variant="card" style="margin-top: var(--fx-spacing-03)">
    <span slot="header">Passing <fx-count-badge tone="pass">14</fx-count-badge></span>
    <p style="margin:0">Atlas, Comet, Delta and 11 more.</p>
  </fx-accordion>
</div>`,
      },
      {
        title: "Groups of cards",
        description: "<code>cycle</code> makes an accordion a group of the accordions inside it: a click opens it, again (with its cards folded) opens every card, again shuts it. Its chevron sits halfway while it is open with every card folded.",
        layout: "stack",
        html: `<fx-accordion cycle open variant="card">
  <span slot="header">In progress <fx-count-badge>5</fx-count-badge></span>
  <fx-accordion>
    <span slot="header">Ada Lovelace <fx-count-badge>3</fx-count-badge></span>
    Atlas, Comet and Delta.
  </fx-accordion>
  <fx-accordion>
    <span slot="header">Grace Hopper <fx-count-badge>2</fx-count-badge></span>
    Beacon and Echo.
  </fx-accordion>
</fx-accordion>`,
      },
    ],
    attributes: [
      ["open", "boolean", "false", "Showing its content."],
      ["name", "string", "", "One open at a time among accordions with the same name."],
      ["cycle", "boolean", "false", "A group of the accordions inside it, opened and shut in a three-step cycle."],
      ["storage-key", "string", "", "Remember open or shut in this browser (<code>fx.accordion.&lt;key&gt;</code>)."],
      ["variant", "plain | card", "plain", "Rules between sections, or a box."],
      ["disabled", "boolean", "false", ""],
    ],
    events: [["fx:toggle", "CustomEvent", "", "<code>{ open }</code> -- after it opens or shuts. Bubbles, so a group hears its cards."]],
    methods: [["show(), hide(), toggle()", "", "", ""]],
    slots: [
      ["header", "", "", "The title, and counts or chips beside it. Nothing clickable."],
      ["actions", "", "", "Buttons and links at the end of the header row."],
      ["(default)", "", "", "The content."],
    ],
  },
  {
    id: "breadcrumb",
    title: "Breadcrumb",
    tag: "fx-breadcrumb",
    icon: "breadcrumb",
    section: C,
    lead: "Where the page sits: each level up as a link, the page itself last.",
    examples: [
      {
        layout: "stack",
        html: `<fx-breadcrumb>
  <a href="#/components/breadcrumb">Factory</a>
  <a href="#/components/breadcrumb">Runs</a>
  <span>Run 42</span>
</fx-breadcrumb>`,
      },
      {
        title: "A long trail",
        description: "<code>max</code> folds the middle levels into \"…\", which opens them.",
        layout: "stack",
        html: `<fx-breadcrumb max="3">
  <a href="#/components/breadcrumb">Factory</a>
  <a href="#/components/breadcrumb">Repositories</a>
  <a href="#/components/breadcrumb">factory-ui</a>
  <a href="#/components/breadcrumb">Pull requests</a>
  <span>#128 Add the accordion</span>
</fx-breadcrumb>`,
      },
    ],
    attributes: [
      ["items", "[{ label, href }]", "", "The levels, set as a property -- or write them as children: an &lt;a&gt; is a level to go to, anything else the current page."],
      ["max", "number", "", "The most levels to show; the middle ones fold into \"…\"."],
      ["label", "string", "Breadcrumb", "What the trail is called, for assistive technology."],
    ],
  },
  {
    id: "pagination",
    title: "Pagination",
    tag: "fx-pagination",
    icon: "pagination",
    section: C,
    lead: "Moving through a long list a page at a time: which rows are showing, previous and next, the pages by number, and how many to a page.",
    examples: [
      {
        layout: "stack",
        html: `<fx-pagination total="340" page-size="25" page="3"></fx-pagination>
<fx-pagination total="340" page-size="25" compact page-sizes=""></fx-pagination>`,
      },
      {
        title: "Paging a table",
        description: "<code>fx:page</code> gives <code>start</code> and <code>end</code> for <code>rows.slice()</code>.",
        layout: "stack",
        html: `<fx-data-table label="Runs" static zebra></fx-data-table>
<fx-pagination total="57" page-size="10" page-sizes="5,10,25"></fx-pagination>`,
        script: (root) => {
          const table = root.querySelector("fx-data-table");
          const pager = root.querySelector("fx-pagination");
          const all = Array.from({ length: 57 }, (_, i) => ({ id: i + 1, run: `Run ${i + 1}`, repo: ["atlas", "beacon", "comet"][i % 3], took: `${2 + (i % 7)}m` }));
          table.columns = [
            { key: "run", label: "Run" },
            { key: "repo", label: "Repository" },
            { key: "took", label: "Took", align: "end" },
          ];
          const show = () => (table.rows = all.slice(pager.start, pager.end));
          pager.addEventListener("fx:page", show);
          show();
        },
      },
    ],
    attributes: [
      ["total", "number", "0", "How many items in all."],
      ["page", "number", "1", "The page showing, from 1."],
      ["page-size", "number", "25", "Items to a page."],
      ["page-sizes", "comma list", "10,25,50,100", "The choices for page size; empty hides the chooser."],
      ["compact", "boolean", "false", "Previous, next and \"Page 3 of 14\" -- no page numbers."],
      ["label", "string", "Pagination", "What it is called, for assistive technology."],
    ],
    events: [["fx:page", "CustomEvent", "", "<code>{ page, pageSize, start, end }</code> -- the page or page size changed. A new page size keeps the first row that was showing."]],
    notes: "<p>Read-only properties <code>pageCount</code>, <code>start</code> and <code>end</code> (0-based, for <code>slice()</code>).</p>",
  },
  {
    id: "progress",
    title: "Progress",
    tag: "fx-progress",
    icon: "progress",
    section: C,
    lead: "How far along something is. With no value it sweeps, for work whose end is not known yet -- a clone, a review being read.",
    examples: [
      {
        layout: "stack",
        html: `<fx-progress label="Uploading" value="40"></fx-progress>
<fx-progress label="Checks" value="7" max="10" show-value="count" helper-text="Lint, unit and integration"></fx-progress>
<fx-progress label="Cloning factory-ui" helper-text="Receiving objects"></fx-progress>`,
      },
      {
        title: "States",
        description: "<code>tone</code> colors the bar: a finished run, a stopped one.",
        layout: "stack",
        html: `<fx-progress label="Deploy" value="100" tone="pass" helper-text="Done in 3 minutes"></fx-progress>
<fx-progress label="Deploy" value="62" tone="fail" helper-text="Stopped: the health check failed"></fx-progress>
<fx-progress label="Small" value="30" size="sm" show-value="none"></fx-progress>`,
      },
      {
        title: "Live",
        layout: "stack",
        html: `<fx-progress label="Reviewing the diff" value="0" helper-text="Reading files"></fx-progress>
<div><fx-button data-run>Run</fx-button></div>`,
        script: (root) => {
          const bar = root.querySelector("fx-progress");
          root.querySelector("[data-run]").addEventListener("click", () => {
            bar.removeAttribute("tone");
            bar.value = 0;
            const tick = setInterval(() => {
              bar.value = Math.min(100, bar.value + 7);
              bar.setAttribute("helper-text", bar.value < 100 ? `Reading file ${Math.round(bar.value / 7)} of 15` : "Done");
              if (bar.value >= 100) {
                clearInterval(tick);
                bar.setAttribute("tone", "pass");
              }
            }, 250);
          });
        },
      },
    ],
    attributes: [
      ["value", "number", "", "How much is done, 0 to max. Without one it is indeterminate."],
      ["max", "number", "100", "The whole."],
      ["label", "string", "", "What it measures, above the bar."],
      ["helper-text", "string", "", "A line under it -- the step it is on."],
      ["show-value", "percent | count | none", "percent", "Beside the label: \"40%\" or \"7 of 10\"."],
      ["tone", "status tone", "", "Colors the bar; error shows its helper text in red."],
      ["size", "sm | md", "md", "A 4px or 8px bar."],
    ],
  },
  {
    id: "tag",
    title: "Tag",
    tag: "fx-tag",
    icon: "tag",
    section: C,
    lead: "A short label in a pill: a topic, a filter that is set, a choice to toggle. For pass and fail, use a status chip.",
    examples: [
      {
        title: "Labels",
        description: "<code>color</code> takes a palette family for a pale tag, or a family and step for a solid one.",
        html: `<fx-tag>frontend</fx-tag>
<fx-tag color="blue">backend</fx-tag>
<fx-tag color="purple" icon="robot">Opus</fx-tag>
<fx-tag color="teal">docs</fx-tag>
<fx-tag color="magenta-60">urgent</fx-tag>
<fx-tag size="sm" color="green">sm</fx-tag>`,
      },
      {
        title: "Filters that are set",
        description: "<code>label</code> reads \"Repo: factory-ui\"; <code>removable</code> adds an &times; that fires <code>fx:remove</code> and, unless canceled, removes the tag.",
        html: `<fx-tag label="Repo" removable>factory-ui</fx-tag>
<fx-tag label="Status" removable color="red">Failing</fx-tag>
<fx-tag label="Owner" removable>Ada</fx-tag>
<span class="log"></span>`,
        script: (root) => root.addEventListener("fx:remove", (e) => log(root, `Cleared ${e.target.getAttribute("label")}`)),
      },
      {
        title: "Filter chips",
        description: "<code>selectable</code> makes the tag a toggle button; a click flips <code>selected</code> and fires <code>change</code>.",
        html: `<fx-tag selectable selected>Open</fx-tag>
<fx-tag selectable>Draft</fx-tag>
<fx-tag selectable>Merged</fx-tag>
<fx-tag selectable disabled>Closed</fx-tag>
<span class="log"></span>`,
        script: (root) =>
          root.addEventListener("change", () =>
            log(root, `Showing: ${[...root.querySelectorAll("fx-tag[selected]")].map((tag) => tag.textContent).join(", ") || "nothing"}`),
          ),
      },
    ],
    attributes: [
      ["label", "string", "", "A name before the text: \"label: text\"."],
      ["color", "family | family-step", "", "A palette color: <code>teal</code> pale, <code>red-80</code> solid. Gray by default."],
      ["icon", "string", "", "An icon before the text."],
      ["removable", "boolean", "false", "An &times; that fires <code>fx:remove</code>."],
      ["selectable, selected", "boolean", "false", "A toggle button, and whether it is on."],
      ["disabled", "boolean", "false", ""],
      ["size", "sm | md", "md", ""],
    ],
    events: [
      ["fx:remove", "CustomEvent", "", "The &times; was clicked. Cancelable: <code>preventDefault()</code> keeps the tag."],
      ["change", "Event", "", "A selectable tag was flipped."],
    ],
    methods: [["dismiss()", "", "", "What the &times; does: fires fx:remove, then removes the tag."]],
  },
  {
    id: "avatar",
    title: "Avatar",
    tag: "fx-avatar",
    icon: "user",
    section: C,
    lead: "A person: their photo in a circle, or their initials when there is none. Each name gets its own color, the same every time.",
    examples: [
      {
        html: `<fx-avatar name="Ada Lovelace" size="xs"></fx-avatar>
<fx-avatar name="Grace Hopper" size="sm"></fx-avatar>
<fx-avatar name="Alan Turing"></fx-avatar>
<fx-avatar name="Katherine Johnson" size="lg"></fx-avatar>
<fx-avatar name="Margaret Hamilton" size="xl"></fx-avatar>`,
      },
      {
        title: "Photos, shapes and status",
        description: "A photo that fails to load leaves the initials. <code>status</code> adds a dot: a status tone, or online, away, busy.",
        html: `<fx-avatar name="Flare" src="docs/favicon.svg" size="lg" shape="square"></fx-avatar>
<fx-avatar name="Broken Link" src="/no-such-image.png" size="lg"></fx-avatar>
<fx-avatar name="Build Bot" shape="square" color="teal" size="lg"></fx-avatar>
<fx-avatar name="Ada Lovelace" status="online" size="lg"></fx-avatar>
<fx-avatar name="Grace Hopper" status="busy" size="lg"></fx-avatar>`,
      },
    ],
    attributes: [
      ["name", "string", "", "Who it is: their initials, and their name for assistive technology."],
      ["src", "URL", "", "A photo; the initials stay if it fails to load."],
      ["size", "xs | sm | md | lg | xl | CSS length", "md", "20, 24, 32, 40 or 64px."],
      ["shape", "circle | square", "circle", ""],
      ["color", "palette family", "", "The initials' circle; each name has its own by default."],
      ["status", "tone | online | away | busy", "", "A dot at the corner."],
      ["decorative", "boolean", "false", "No name for assistive technology, when the name is written beside it."],
    ],
    notes: "<p><code>initialsOf(name)</code> is exported too: the first letter of up to two words that start with a letter -- \"Ada Lovelace\" is AL.</p>",
  },
  {
    id: "card",
    title: "Card",
    tag: "fx-card",
    icon: "card",
    section: C,
    lead: "A box that groups one thing -- a repository, a run, a setting -- with an optional header, actions and footer.",
    examples: [
      {
        layout: "stack",
        html: `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(16rem,1fr));gap:var(--fx-spacing-05)">
  <fx-card heading="factory-ui" subheading="main · 3 open pull requests">
    <fx-button slot="actions" variant="text" size="sm" icon="external" aria-label="Open"></fx-button>
    The dashboard for running the software factory.
    <fx-button slot="footer" variant="text" size="sm">View runs</fx-button>
  </fx-card>
  <fx-card heading="Nightly checks" tone="fail" variant="elevated">
    2 of 14 checks failed on the last run.
  </fx-card>
  <fx-card href="#/components/card" heading="A card that is a link" variant="filled">
    The whole card goes to its href, and lifts on hover.
  </fx-card>
</div>`,
      },
    ],
    attributes: [
      ["heading, subheading", "string", "", "The header's two lines (or use the header slot)."],
      ["variant", "outlined | elevated | filled", "outlined", "A border, a shadow, or the alternate layer."],
      ["href", "URL", "", "The whole card is a link to it."],
      ["padding", "none | sm | md", "md", "Around the content."],
      ["tone", "status tone", "", "A bar down the left edge in that color."],
    ],
    slots: [
      ["header", "", "", "In place of heading and subheading."],
      ["actions", "", "", "At the end of the header."],
      ["(default)", "", "", "The content."],
      ["footer", "", "", "A row under a rule."],
    ],
  },
  {
    id: "combobox",
    title: "Combobox",
    tag: "fx-combobox",
    icon: "combobox",
    section: C,
    lead: "A field that suggests as you type: pick one of many, or several. The text field's label and messages, the select's list.",
    examples: [
      {
        title: "One of many",
        html: `<fx-combobox label="Repository" name="repo" placeholder="Search repositories…" icon="search">
  <option value="factory-ui">factory-ui</option>
  <option value="baby-monitor">baby-monitor</option>
  <option value="atlas">atlas</option>
  <option value="beacon">beacon</option>
  <option value="comet">comet</option>
  <option value="flare-ux">flare-ux</option>
</fx-combobox>
<span class="log"></span>`,
        script: (root) => root.addEventListener("change", (e) => log(root, `Repository: ${e.target.value || "none"}`)),
      },
      {
        title: "Several",
        description: "<code>multiple</code> shows each choice as a chip; <code>select-all</code> adds the filter menus' \"Select all\" row; <code>allow-custom</code> takes a value that is not in the list.",
        html: `<fx-combobox label="Labels" name="labels" multiple select-all allow-custom value="bug,docs" placeholder="Add labels…" block>
  <option value="bug">bug</option>
  <option value="docs">docs</option>
  <option value="enhancement">enhancement</option>
  <option value="frontend">frontend</option>
  <option value="backend">backend</option>
  <option value="security">security</option>
  <option value="good-first-issue">good first issue</option>
</fx-combobox>
<span class="log"></span>`,
        script: (root) => root.addEventListener("change", (e) => log(root, `Labels: ${e.target.values.join(", ") || "none"}`)),
      },
      {
        title: "Loaded as you type",
        description: "For a list too big to hold, <code>load</code> fetches matches once typing pauses, and cancels a fetch that newer typing makes stale. This one pretends to be a server: half a second per search, and typing <code>error</code> fails.",
        html: `<fx-combobox label="Reviewers" name="reviewers" multiple min-chars="2" placeholder="Search people…" icon="search" block></fx-combobox>
<span class="log"></span>`,
        script: (root) => {
          const combobox = root.querySelector("fx-combobox");
          const people = ["Ada Lovelace", "Alan Turing", "Barbara Liskov", "Claude Shannon", "Donald Knuth", "Edsger Dijkstra", "Frances Allen", "Grace Hopper", "John Backus", "Katherine Johnson", "Ken Thompson", "Linus Torvalds", "Margaret Hamilton", "Radia Perlman", "Tim Berners-Lee", "Vint Cerf"];
          let calls = 0;
          combobox.load = (query, { signal }) =>
            new Promise((resolve, reject) => {
              calls++;
              const timer = setTimeout(() => {
                if (query.toLowerCase() === "error") return reject(new Error("The directory did not answer"));
                resolve(people.filter((name) => name.toLowerCase().includes(query.toLowerCase())).map((name) => ({ value: name.toLowerCase().replace(/\W+/g, "."), label: name })));
              }, 500);
              signal.addEventListener("abort", () => clearTimeout(timer));
            });
          combobox.addEventListener("change", () => log(root, `${combobox.values.join(", ") || "none"} -- ${calls} search(es) so far`));
        },
      },
    ],
    attributes: [
      ["value", "string", "", "The chosen value; with multiple, comma-separated."],
      ["values", "string[]", "", "The chosen values (property)."],
      ["options", "[{ value, label, disabled }]", "", "The choices (property) -- or write &lt;option&gt; children."],
      ["multiple", "boolean", "false", "Several values, as chips."],
      ["select-all", "boolean", "false", "With multiple: a Select all row for what is showing."],
      ["allow-custom", "boolean", "false", "Take a value not in the list."],
      ["label, placeholder, icon", "string", "", "As on fx-text-field."],
      ["supporting-text, error-text, invalid-text, valid-text", "string", "", "As on fx-text-field; it works with <a href=\"#/components/form\">fx-form</a>."],
      ["empty-text", "string", "No matches", "What the list says when nothing matches."],
      ["load", "(query, { signal }) => options", "", "Fetch the options for what is typed (property). Its result is the list as given; the signal aborts when newer typing makes it stale."],
      ["min-chars", "number", "1", "With load: the characters to type before it loads; 0 loads when the list opens."],
      ["debounce", "number (ms)", "250", "With load: the pause in typing before it loads."],
      ["name, required, disabled, size, block", "", "", "As on every field."],
    ],
    events: [
      ["change", "Event", "", "The choice changed."],
      ["input", "InputEvent", "", "As you type."],
    ],
    notes: "<p>Keyboard: typing filters and opens the list; Down and Up move; Enter picks; Escape closes, and again clears the text; Backspace in an empty field removes the last chip. Focus stays in the field.</p>",
  },
  {
    id: "empty-state",
    title: "Empty State",
    tag: "fx-empty-state",
    icon: "empty-state",
    section: C,
    lead: "What a page, panel or table shows when there is nothing in it: an icon, a heading, why, and what to do next.",
    examples: [
      {
        layout: "stack",
        html: `<fx-empty-state icon="file" heading="No prompts yet">
  Add one with the + above the list.
  <fx-button slot="actions" variant="filled" icon="plus">New prompt</fx-button>
</fx-empty-state>`,
      },
      {
        title: "Small, and with a tone",
        layout: "stack",
        html: `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(16rem,1fr));gap:var(--fx-spacing-05)">
  <fx-card padding="none"><fx-empty-state size="sm" icon="search" heading="No matches">Try fewer filters.</fx-empty-state></fx-card>
  <fx-card padding="none"><fx-empty-state size="sm" icon="status-ok" tone="pass" heading="All caught up">Nothing waits on you.</fx-empty-state></fx-card>
  <fx-card padding="none"><fx-empty-state size="sm" icon="cloud" tone="fail" heading="Could not load runs">
    The server did not answer.
    <fx-button slot="actions" size="sm" icon="refresh">Try again</fx-button>
  </fx-empty-state></fx-card>
</div>`,
      },
    ],
    attributes: [
      ["heading", "string", "", "The first line."],
      ["icon", "string", "folder", "Drawn large in a soft circle; empty for none."],
      ["size", "sm | md", "md", "sm inside a card or table."],
      ["tone", "status tone", "", "Colors the icon's circle."],
    ],
    slots: [["(default)", "", "", "Why it is empty."], ["actions", "", "", "What to do next."]],
  },
  {
    id: "file-drop",
    title: "File Drop",
    tag: "fx-file-drop",
    icon: "upload",
    section: C,
    lead: "Files picked by dropping them on a zone or clicking it to browse, listed under it and posted with the form.",
    examples: [
      {
        layout: "stack",
        html: `<fx-file-drop label="Attachments" name="files" multiple accept=".png,.jpg,.pdf,.txt" max-size="5MB" max-files="4"
  supporting-text="Screenshots or logs that show the problem."></fx-file-drop>
<span class="log"></span>`,
        script: (root) => root.addEventListener("change", (e) => log(root, `${e.target.files.length} file(s): ${e.target.files.map((file) => file.name).join(", ")}`)),
      },
      {
        title: "One file",
        layout: "stack",
        html: `<fx-file-drop label="Repository notes" name="notes" accept=".md" required></fx-file-drop>`,
      },
    ],
    attributes: [
      ["accept", "string", "", "File types, as for &lt;input type=file&gt;: <code>.pdf</code>, <code>image/*</code>."],
      ["multiple", "boolean", "false", "More than one file."],
      ["max-size", "bytes | 500KB | 5MB", "", "The largest file."],
      ["max-files", "number", "", "The most files, with multiple."],
      ["files", "File[]", "", "The chosen files (property)."],
      ["label, supporting-text, name, required, disabled", "", "", "As on every field."],
    ],
    events: [["change", "Event", "", "The files changed."]],
    methods: [["clear()", "", "", "Forget every file."]],
    notes: "<p>A file of the wrong type, too large, or one too many is named in the error under the zone and not added. The form posts each file under the name -- use <code>enctype=\"multipart/form-data\"</code>.</p>",
  },
  {
    id: "skeleton",
    title: "Skeleton",
    tag: "fx-skeleton",
    icon: "skeleton",
    section: C,
    lead: "Gray shapes that stand in for content while it loads, so the page keeps its layout and does not jump when it arrives.",
    examples: [
      {
        layout: "stack",
        html: `<div aria-busy="true" style="display:grid;grid-template-columns:auto 1fr;gap:var(--fx-spacing-04);align-items:center;max-width:32rem">
  <fx-skeleton variant="circle" width="2.5rem"></fx-skeleton>
  <fx-skeleton width="12rem"></fx-skeleton>
  <fx-skeleton variant="rect" height="7rem" style="grid-column:1 / -1"></fx-skeleton>
  <fx-skeleton lines="3" style="grid-column:1 / -1"></fx-skeleton>
</div>`,
      },
    ],
    attributes: [
      ["variant", "text | rect | circle", "text", ""],
      ["lines", "number", "1", "For text: how many lines; the last is shorter."],
      ["width, height", "CSS length", "", "Full width and a line high by default; a circle 2rem, a rect 6rem high."],
    ],
    notes: "<p>Hidden from assistive technology: put <code>aria-busy=\"true\"</code> on what is loading, and replace the skeletons when it has. The shimmer stops under reduced motion.</p>",
  },
  {
    id: "slider",
    title: "Slider",
    tag: "fx-slider",
    icon: "slider",
    section: C,
    lead: "A value picked by dragging along a track. A native range input underneath, so keyboard, touch and screen readers work as everywhere.",
    examples: [
      {
        layout: "column",
        html: `<fx-slider label="Max parallel runs" name="parallel" min="1" max="8" value="3" ticks></fx-slider>
<fx-slider label="Review threshold" name="threshold" value="80" step="5" suffix="%" supporting-text="Findings below this confidence are hidden."></fx-slider>
<fx-slider label="Disabled" value="30" disabled></fx-slider>`,
      },
    ],
    attributes: [
      ["value, min, max, step", "number", "50, 0, 100, 1", ""],
      ["label", "string", "", ""],
      ["suffix", "string", "", "After the shown value: %, \" runs\"."],
      ["show-value", "boolean", "true", "\"false\" hides the value beside the label."],
      ["ticks", "boolean", "false", "A mark at every step (up to 20)."],
      ["supporting-text, name, disabled, block", "", "", "As on every field."],
    ],
    events: [["input", "Event", "", "While dragging."], ["change", "Event", "", "When let go."]],
  },
  {
    id: "steps",
    title: "Steps",
    tag: "fx-steps",
    icon: "flow",
    section: C,
    lead: "The stages of a flow as circles on a line -- a setup wizard, or a run moving through its stages. The states are factory-ui's flow timeline's.",
    examples: [
      {
        layout: "stack",
        html: `<fx-steps items='[
  {"label":"Plan","state":"complete","detail":"2m"},
  {"label":"Build","state":"complete","detail":"6m"},
  {"label":"Review","state":"active","detail":"Running"},
  {"label":"Deploy","state":"pending"}
]'></fx-steps>`,
      },
      {
        title: "Every state",
        description: "complete, active, waiting (on a person), failed, skipped, pending.",
        layout: "stack",
        html: `<fx-steps items='[
  {"label":"Plan","state":"complete"},
  {"label":"Approve","state":"waiting","detail":"Ada to review"},
  {"label":"Tests","state":"failed","detail":"2 failing"},
  {"label":"Docs","state":"skipped"},
  {"label":"Deploy","state":"pending","icon":"send"}
]'></fx-steps>`,
      },
      {
        title: "Vertical, and a wizard",
        description: "It turns vertical by itself when its box is too narrow. <code>interactive</code> makes steps buttons that fire <code>fx:step-select</code>.",
        html: `<fx-steps orientation="vertical" interactive style="width:16rem" items='[
  {"label":"Choose a repository","state":"complete","detail":"factory-ui"},
  {"label":"Pick a model","state":"active"},
  {"label":"Confirm"}
]'></fx-steps>
<span class="log"></span>`,
        script: (root) => root.addEventListener("fx:step-select", (e) => log(root, `Go to: ${e.detail.item.label}`)),
      },
    ],
    attributes: [
      ["items", "JSON | [{ label, state, detail, icon }]", "", "The steps; state is complete, active, waiting, failed, skipped or pending."],
      ["orientation", "horizontal | vertical", "", "Unset, it is side by side and turns vertical when narrow."],
      ["interactive", "boolean", "false", "Steps are buttons."],
    ],
    events: [["fx:step-select", "CustomEvent", "", "<code>{ index, item }</code> -- an interactive step was clicked."]],
  },
  {
    id: "chart",
    title: "Chart",
    tag: "fx-chart",
    icon: "chart",
    section: C,
    lead: "Column, bar, line and area charts in SVG: one axis, thin marks, a legend, a tooltip on hover or arrow keys, and the numbers as a table.",
    examples: [
      {
        title: "Columns",
        description: "One series needs no legend; <code>value-labels</code> puts each value at its bar's tip.",
        layout: "stack",
        html: `<fx-chart type="column" label="Runs per day" value-labels height="14rem"></fx-chart>`,
        script: (root) =>
          (root.querySelector("fx-chart").data = {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            series: [{ name: "Runs", values: [42, 57, 51, 63, 48, 12, 9] }],
          }),
      },
      {
        title: "Pie and columns in the chart colors",
        description: "<code>type=\"pie\"</code> makes a slice of each label. <code>colors</code> beside the labels colors each category on its own: here the two grays for the pie, the seven dark hues for the columns. <code>wide</code> lets bars fill their category, 4px apart.",
        layout: "stack",
        html: `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(18rem,1fr));gap:var(--fx-spacing-07)">
  <fx-chart type="pie" label="Two parts"></fx-chart>
  <fx-chart type="column" wide label="Dark chart colors"></fx-chart>
</div>`,
        script: (root) => {
          const names = ["Blue", "Green", "Olive", "Orange", "Brown", "Pink", "Purple", "Gray"];
          const values = [24, 31, 18, 27, 15, 22, 29, 12];
          const token = (n) => `var(--fx-color-chart-${String(n).padStart(2, "0")})`;
          // The pie: two parts, dark gray and light gray.
          root.querySelector('fx-chart[type="pie"]').data = {
            labels: ["Dark gray", "Light gray"],
            colors: [token(16), token(8)],
            series: [{ name: "Value", values: [78, 22] }],
          };
          // The columns: the seven dark hues, without the gray.
          root.querySelector('fx-chart[type="column"]').data = {
            labels: names.slice(0, 7),
            colors: names.slice(0, 7).map((_, i) => token(9 + i)),
            series: [{ name: "Value", values: values.slice(0, 7) }],
          };
        },
      },
      {
        title: "Stacked, in status colors",
        description: "A series that is a state takes a status tone as its <code>color</code>; hover a column for the total.",
        layout: "stack",
        html: `<fx-chart type="column" stacked label="Checks by result"></fx-chart>`,
        script: (root) =>
          (root.querySelector("fx-chart").data = {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            series: [
              { name: "Passed", values: [38, 49, 44, 57, 41], color: "pass" },
              { name: "Paused", values: [2, 3, 1, 2, 4], color: "pause" },
              { name: "Failed", values: [2, 5, 6, 4, 3], color: "fail" },
            ],
          }),
      },
      {
        title: "Lines",
        description: "Up to four lines are named at their ends. Click a legend entry to hide a series -- the others keep their colors.",
        layout: "stack",
        html: `<fx-chart type="line" label="Median build time" unit="m"></fx-chart>`,
        script: (root) =>
          (root.querySelector("fx-chart").data = {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
            series: [
              { name: "factory-ui", values: [6.2, 5.8, 6.4, 5.1, 4.8, 4.9, 4.2, 4.0] },
              { name: "atlas", values: [3.1, 3.4, 3.2, 3.9, 4.4, 4.1, 4.6, 4.8] },
              { name: "beacon", values: [8.4, 8.1, 7.2, 7.4, 6.9, 6.1, 6.3, 5.6] },
            ],
          }),
      },
      {
        title: "Bars, grouped",
        description: "<code>type=\"bar\"</code> lays bars across, for long category names.",
        layout: "stack",
        html: `<fx-chart type="bar" label="Pull requests by repository" height="18rem"></fx-chart>`,
        script: (root) =>
          (root.querySelector("fx-chart").data = {
            labels: ["factory-ui", "baby-monitor", "atlas", "beacon", "flare-ux"],
            series: [
              { name: "Opened", values: [34, 12, 21, 9, 27] },
              { name: "Merged", values: [29, 10, 18, 5, 25] },
            ],
          }),
      },
      {
        title: "Area, stacked",
        layout: "stack",
        html: `<fx-chart type="area" stacked label="Tokens used by model"></fx-chart>`,
        script: (root) =>
          (root.querySelector("fx-chart").data = {
            labels: ["W1", "W2", "W3", "W4", "W5", "W6"],
            series: [
              { name: "Sonnet", values: [120000, 135000, 128000, 160000, 171000, 158000] },
              { name: "Opus", values: [40000, 52000, 61000, 58000, 66000, 72000] },
              { name: "Haiku", values: [30000, 28000, 35000, 41000, 39000, 44000] },
            ],
          }),
      },
    ],
    attributes: [
      ["data", "{ labels, colors?, series: [{ name, values, color? }] }", "", "The numbers (property, or JSON in the attribute). <code>colors</code>, one per label, colors each category on its own -- a pie's slices, a single series' bars."],
      ["type", "column | bar | line | area | pie", "column", "A pie draws the first series, a slice per label."],
      ["label", "string", "", "What it shows: its accessible name and the table's caption."],
      ["stacked", "boolean", "false", "Series stack rather than sit side by side (column, bar, area)."],
      ["wide", "boolean", "false", "Bars fill their category, 4px apart, instead of thin bars (24px at most) with space around them."],
      ["value-labels", "boolean", "false", "Each bar's value at its tip, where it fits."],
      ["unit, prefix", "string", "", "Around every value: <code>unit=\"ms\"</code>, <code>prefix=\"$\"</code>."],
      ["decimals", "number", "", "Digits after the point."],
      ["height", "CSS length", "16rem", "The plot's height."],
      ["y-min, y-max", "number", "", "The value axis's ends."],
      ["no-table", "boolean", "false", "Hide the Show table button."],
    ],
    events: [["fx:series-toggle", "CustomEvent", "", "<code>{ name, hidden }</code> -- a legend entry was clicked."]],
    cssProperties: [["--fx-chart-surface", "color", "--fx-layer", "What the chart sits on: the ring around its markers."]],
    notes: `<p>A series' <code>color</code> is optional: without one, series take the <a href="#/foundations/colors">chart colors</a> in an order chosen so neighbors stay apart, also for color-blind readers -- 09, 05, 15, 11, 13, 12, 01, 14, … with the two grays last. A status tone (pass, fail, pause, unknown) or any CSS color works too; keep status colors for series that are states.</p>
<p>The plot takes focus: Left and Right (Up and Down for bars) step through the categories, showing and reading out each. Show table gives the same numbers as a table.</p>`,
  },
  {
    id: "trendicator",
    title: "Trendicator",
    tag: "fx-trendicator",
    icon: "trendicator",
    section: C,
    lead: "A value in a circle with an arrow that points where it is heading -- a glucose reading, a price forecast, any number with a trend. With history, a click shows a small graph of the recent values.",
    examples: [
      {
        title: "Glucose readings (CGM)",
        description: "The themes, arrows and alert fit a CGM reading: in range, low and falling fast, out of range, stale. With <code>hours-of-history</code> a click shows the recent readings (made up here) -- click the graph for 2, 4, 6 or 8 hours. <code>trendicatorHtml(reading)</code> builds the right one from a CGM reading.",
        html: `<fx-trendicator value="132" trend="+4" rotation="45" hours-of-history="2" benchmark-high="180" benchmark-low="70"></fx-trendicator>
<fx-trendicator value="57" trend="-11" theme="low" rotation="180" alert></fx-trendicator>
<fx-trendicator value="HIGH" trend="above 400" theme="maxhigh" rotation="off"></fx-trendicator>
<fx-trendicator value="172" trend="34m ago" theme="error" rotation="off"></fx-trendicator>`,
        script: (root) => {
          const now = Date.now();
          root.querySelector("fx-trendicator[hours-of-history]").history = Array.from({ length: 96 }, (_, i) => ({
            time: new Date(now - i * 5 * 60000).toISOString(),
            value: Math.round(130 + 70 * Math.sin(i / 14) + 18 * Math.sin(i / 3.5)),
          }));
        },
      },
      {
        title: "Market predictions",
        description: "The forecast change over the price: the arrow for the direction, the colors from <code>fg-color</code>, <code>bg-color</code> and <code>ind-color</code>.",
        html: `<fx-trendicator size="120" value="+1.8%" trend="$231" rotation="45"
  bg-color="var(--fx-color-green-20)" ind-color="var(--fx-color-green-50)"></fx-trendicator>
<fx-trendicator size="120" value="+0.2%" trend="$97" rotation="90"></fx-trendicator>
<fx-trendicator size="120" value="-3.2%" trend="$84" rotation="135"
  bg-color="var(--fx-color-red-20)" ind-color="var(--fx-color-red-50)"></fx-trendicator>
<fx-trendicator size="120" value="-9.5%" trend="$12" rotation="180" alert
  fg-color="var(--fx-color-white)" bg-color="var(--fx-color-red-60)" ind-color="var(--fx-color-red-60)"></fx-trendicator>`,
      },
      {
        title: "Any metric with a direction",
        description: "A dashboard at a glance, in rainbow order like the spinners: <code>bg-color</code> at each family's lightest step, 10, <code>ind-color</code> at its 60 (yellow at 30).",
        layout: "grid-3",
        html: `<fx-trendicator value="3" trend="incidents" rotation="45"
  bg-color="var(--fx-color-red-10)" ind-color="var(--fx-color-red-60)"></fx-trendicator>
<fx-trendicator value="86%" trend="CPU" rotation="45"
  bg-color="var(--fx-color-orange-10)" ind-color="var(--fx-color-orange-60)"></fx-trendicator>
<fx-trendicator value="3.4s" trend="page load" rotation="135"
  bg-color="var(--fx-color-yellow-10)" ind-color="var(--fx-color-yellow-30)"></fx-trendicator>
<fx-trendicator value="99.9%" trend="uptime" rotation="90"
  bg-color="var(--fx-color-green-10)" ind-color="var(--fx-color-green-60)"></fx-trendicator>
<fx-trendicator value="4.2m" trend="build time" rotation="135"
  bg-color="var(--fx-color-teal-10)" ind-color="var(--fx-color-teal-60)"></fx-trendicator>
<fx-trendicator value="37" trend="open PRs" rotation="45"
  bg-color="var(--fx-color-blue-10)" ind-color="var(--fx-color-blue-60)"></fx-trendicator>
<fx-trendicator value="1.2k" trend="users" rotation="45"
  bg-color="var(--fx-color-purple-10)" ind-color="var(--fx-color-purple-60)"></fx-trendicator>
<fx-trendicator value="2.1%" trend="errors" rotation="0" alert
  bg-color="var(--fx-color-magenta-10)" ind-color="var(--fx-color-magenta-60)"></fx-trendicator>
<fx-trendicator value="0" trend="outages" rotation="off"
  bg-color="var(--fx-color-gray-10)" ind-color="var(--fx-color-gray-60)"></fx-trendicator>`,
      },
    ],
    attributes: [
      ["value", "string", "", "The reading. LOW, HIGH and values over four characters are set smaller to fit."],
      ["trend", "string", "", "The line under it: a change, or a note."],
      ["theme", "default | high | maxhigh | low | maxlow | error", "default", "error draws a dashed ring and the trend in a pill."],
      ["rotation", "0 … 180 | off", "90", "Where the arrow points, in degrees from up."],
      ["alert", "boolean", "false", "The arrow hollow, for a fast change."],
      ["size", "number (px)", "140", "The circle's width; everything scales."],
      ["fg-color", "CSS color", "", "The text: the value in this color, the trend at 70% opacity."],
      ["value-color, trend-color", "CSS color", "", "The value's and the trend's own colors; they win over fg-color."],
      ["bg-color, ind-color", "CSS color", "", "Override the theme's fill, and its ring and arrow."],
      ["hours-of-history", "number", "", "Over 0: a click shows the graph, starting at this many hours."],
      ["history-src", "URL", "", "Returns <code>{ readings: [{ time, value }] }</code> for the graph; fetched once per URL."],
      ["history", "[{ time, value }]", "", "The graph's readings, as a property."],
      ["benchmark-high, benchmark-low", "number", "180, 70", "The graph's high and low lines."],
    ],
    cssProperties: [["--fx-trendicator-surface", "color", "white", "Inside a hollow (alert) arrow."]],
    notes: `<p><code>trendicatorHtml(reading, overrides?, benchmarks?)</code> turns a CGM reading -- <code>{ value, trend: { symbol }, value_difference, status, minutes_ago }</code> -- into the element's markup: missing (??), stale over 20 minutes (error), below 40 (LOW) and above 400 (HIGH) included, the arrow from the trend symbol, and alert for ⇈ and ⇊.</p>`,
  },
  // ------------------------------------------------------------- inputs
  {
    id: "form",
    title: "Form",
    tag: "fx-form",
    icon: "checklist",
    section: C,
    lead: "A form that checks itself: on submit every field shows whether it passed -- a green check, or a red outline and what is wrong -- and focus goes to the first problem. After that, each field updates as it is edited.",
    examples: [
      {
        title: "Validation",
        description: "Submit it empty to see every error, then fix the fields one by one. <code>invalid-text</code> says what is wrong; <code>valid-text</code> what is right.",
        html: `<fx-form>
  <form class="form-grid">
    <fx-text-field label="First name" name="first" value="Mark" required valid-text="Looks good!"></fx-text-field>
    <fx-text-field label="Last name" name="last" value="Otto" required valid-text="Looks good!"></fx-text-field>
    <fx-text-field label="Username" name="username" prefix-text="@" required minlength="3"
      invalid-text="Please choose a username of 3 or more characters."></fx-text-field>
    <fx-text-field label="City" name="city" required invalid-text="Please provide a valid city."></fx-text-field>
    <fx-select label="State" name="state" required invalid-text="Please select a valid state.">
      <option value="">Choose…</option>
      <option value="ca">California</option>
      <option value="ny">New York</option>
      <option value="ut">Utah</option>
    </fx-select>
    <fx-text-field label="Zip" name="zip" required pattern="[0-9]{5}" inputmode="numeric"
      invalid-text="Please provide a valid 5-digit zip."></fx-text-field>
    <div class="wide">
      <label><fx-checkbox name="terms" required invalid-text="You must agree before submitting."></fx-checkbox> Agree to terms and conditions</label>
    </div>
    <div class="wide"><fx-button variant="filled" type="submit">Submit form</fx-button> <fx-button type="reset" variant="text">Reset</fx-button></div>
  </form>
</fx-form>`,
        script: (root) =>
          root.querySelector("fx-form").addEventListener("fx:submit", (event) => {
            event.preventDefault();
            toast(`Submitted ${[...event.detail.data.keys()].length} fields`, { tone: "success" });
          }),
      },
      {
        title: "As the reader leaves each field",
        description: "<code>validate=\"blur\"</code> shows a field's state once the reader moves on from it, before any submit. <code>no-valid</code> marks only errors.",
        html: `<fx-form validate="blur" no-valid>
  <form class="form-grid">
    <fx-text-field label="Email" name="email" type="email" required invalid-text="Enter an email address, like you@example.com."></fx-text-field>
    <fx-text-field label="Website" name="site" type="url" placeholder="https://" invalid-text="Start it with https://"></fx-text-field>
  </form>
</fx-form>`,
      },
    ],
    attributes: [
      ["validate", "submit | blur", "submit", "When fields first show their state: after the first submit, or as the reader leaves each one. Either way they then update as they are edited."],
      ["no-valid", "boolean", "false", "Mark only errors -- no green for fields that pass."],
    ],
    events: [
      ["fx:submit", "CustomEvent", "", "Every field passed. <code>{ form, data }</code> (a FormData). Cancelable: <code>preventDefault()</code> to handle it yourself, and the form is not submitted."],
      ["fx:invalid", "CustomEvent", "", "A submit found problems. <code>{ controls }</code> -- the invalid fields."],
    ],
    methods: [
      ["validate()", "boolean", "", "Check every field and show the result."],
      ["reset()", "", "", "Reset the form and clear every shown state."],
    ],
    slots: [["(default)", "", "", "One &lt;form&gt;, with its fields. fx-form sets <code>novalidate</code> on it to show its own messages in place of the browser's."]],
    notes: `<p>Every field takes three messages: <code>supporting-text</code> (always, until a state is shown), <code>invalid-text</code> (when it fails; the browser's own message otherwise) and <code>valid-text</code> (when it passes). <code>error-text</code> forces an error whatever the value -- for one the server found.</p>
<p>Text fields and selects show the message under themselves with an icon in the box. A checkbox, toggle, radio group or native input gets the message after its <code>&lt;label&gt;</code>. Each field also has <code>showValidity()</code> and <code>clearValidity()</code>, and sets <code>invalid</code> or <code>valid</code> while one is shown.</p>`,
  },
  {
    id: "text-field",
    title: "Text Field",
    tag: "fx-text-field",
    icon: "text-field",
    section: C,
    lead: "A labeled text input, one line or many. Works in a form as an &lt;input&gt; does: it posts, validates, resets, and Enter submits.",
    examples: [
      {
        layout: "column",
        html: `<fx-text-field label="Project name" name="project" value="Atlas" supporting-text="Shown on every page"></fx-text-field>
<fx-text-field label="Email" type="email" required placeholder="you@example.com"></fx-text-field>
<fx-text-field label="Budget" type="number" prefix-text="$" suffix-text="USD" value="1200"></fx-text-field>
<fx-text-field type="search" icon="search" aria-label="Search" placeholder="Search…" size="sm"></fx-text-field>`,
      },
      {
        title: "Errors and states",
        layout: "column",
        html: `<fx-text-field label="Username" value="ad" error-text="At least 3 characters"></fx-text-field>
<fx-text-field label="Read only" value="v0.1.0" readonly></fx-text-field>
<fx-text-field label="Disabled" value="Locked" disabled></fx-text-field>`,
      },
      {
        title: "Multiline",
        layout: "stack",
        html: `<fx-text-field label="Notes" multiline rows="4" block placeholder="Anything else?"></fx-text-field>
<fx-text-field label="Config" multiline rows="3" mono block value='{ "retries": 3 }'></fx-text-field>`,
      },
    ],
    attributes: [
      ["label", "string", "", "The visible label. Without one, set aria-label."],
      ["value", "string", "", "The text."],
      ["type", "text | number | search | email | url | password | date | time | tel", "text", ""],
      ["placeholder", "string", "", ""],
      ["supporting-text", "string", "", "Help under the field."],
      ["error-text", "string", "", "Shown in place of the help, and marks the field invalid."],
      ["invalid-text, valid-text", "string", "", "Shown when its validity is shown (see <a href=\"#/components/form\">Form</a>): what is wrong, or that it passed."],
      ["icon", "string", "", "A leading icon."],
      ["prefix-text, suffix-text", "string", "", "Fixed text inside the box."],
      ["multiline, rows, resize", "", "", "A text area; resize none | vertical."],
      ["size", "sm | md | lg", "md", "<code>dense</code> is sm."],
      ["mono", "boolean", "false", "Monospace text."],
      ["block", "boolean", "false", "Full width."],
      ["readonly", "boolean", "false", ""],
      ["min, max, step, minlength, maxlength, pattern, autocomplete, inputmode, spellcheck", "", "", "As on &lt;input&gt;."],
      ...FORM_ATTRS,
    ],
    events: FORM_EVENTS,
    methods: [["focus(), select(), setSelectionRange(), checkValidity(), reportValidity(), setCustomValidity()", "", "", "As on &lt;input&gt;."]],
    slots: [["(default)", "", "", "&lt;option value&gt; children become suggestions as the field is typed in."]],
  },
  {
    id: "select",
    title: "Select",
    tag: "fx-select",
    icon: "list-dropdown",
    section: C,
    lead: "A labeled choice from a list -- the same box as the text field, with a list drawn like every other Flare UX menu. Keyboard and screen readers work as with a native &lt;select&gt;: arrows, Home/End, Enter, Escape and type-to-find.",
    examples: [
      {
        layout: "column",
        html: `<fx-select label="Region" name="region" value="west" supporting-text="Where new projects run">
  <option value="east">East</option>
  <option value="west">West</option>
  <optgroup label="Retired"><option value="north">North</option></optgroup>
</fx-select>
<fx-select label="Owner" required>
  <option value="">Choose…</option>
  <option>Ada</option>
  <option>Grace</option>
</fx-select>
<fx-select aria-label="Sort" size="sm" icon="sort-ascending">
  <option>Newest</option>
  <option>Oldest</option>
</fx-select>`,
      },
    ],
    attributes: [
      ["label", "string", "", "The visible label."],
      ["value", "string", "", "The chosen option's value."],
      ["placeholder", "string", "", "Shown when nothing is chosen. An option with value=\"\" reads as a placeholder too."],
      ["supporting-text, error-text", "string", "", "As on fx-text-field."],
      ["icon", "string", "", "A leading icon."],
      ["size", "sm | md | lg", "md", "<code>dense</code> is sm."],
      ["block", "boolean", "false", "Full width."],
      ...FORM_ATTRS,
    ],
    events: FORM_EVENTS,
    methods: [["selectedIndex, options, selectedOptions, add(), showPicker()", "", "", "As on &lt;select&gt;. <code>options</code> is an array of the &lt;option&gt; children."]],
    slots: [["(default)", "", "", "&lt;option&gt; and &lt;optgroup&gt; elements, disabled honored."]],
  },
  {
    id: "checkbox",
    title: "Checkbox",
    tag: "fx-checkbox",
    icon: "checkbox",
    section: C,
    lead: "On or off, for a choice that is saved with a form -- or several from a list. Put it in a &lt;label&gt; to name it.",
    examples: [
      {
        layout: "column",
        html: `<label><fx-checkbox name="terms" checked></fx-checkbox> I agree to the terms</label>
<label><fx-checkbox name="news"></fx-checkbox> Send me news</label>
<label><fx-checkbox indeterminate></fx-checkbox> Some selected</label>
<label><fx-checkbox checked disabled></fx-checkbox> Disabled</label>
<label><fx-checkbox checked color="var(--fx-status-success)"></fx-checkbox> In a status color</label>`,
      },
    ],
    attributes: [
      ["checked", "boolean", "false", ""],
      ["indeterminate", "boolean", "false", "Neither: part of a set is checked."],
      ["value", "string", "on", "What it posts when checked."],
      ["color", "CSS color", "--fx-interactive", "The checked color."],
      ...FORM_ATTRS,
    ],
    events: FORM_EVENTS,
    cssProperties: [["--fx-checkbox-color", "color", "--fx-interactive", ""], ["--fx-checkbox-border", "color", "--fx-control-border", ""]],
    notes: "<p>Custom elements never match <code>:checked</code> -- read the <code>.checked</code> property.</p>",
  },
  {
    id: "radio",
    title: "Radio",
    tag: "fx-radio",
    icon: "radio",
    section: C,
    lead: "One choice from a few. Radios with the same name form a group: one Tab stop, the arrow keys move and pick.",
    examples: [
      {
        layout: "column",
        html: `<label><fx-radio name="plan" value="free" checked></fx-radio> Free</label>
<label><fx-radio name="plan" value="team"></fx-radio> Team</label>
<label><fx-radio name="plan" value="enterprise"></fx-radio> Enterprise</label>
<label><fx-radio name="plan" value="legacy" disabled></fx-radio> Legacy</label>`,
      },
    ],
    attributes: [
      ["checked", "boolean", "false", ""],
      ["value", "string", "on", "What the group posts when this one is checked."],
      ["color", "CSS color", "--fx-interactive", "The checked color."],
      ...FORM_ATTRS,
    ],
    events: FORM_EVENTS,
  },
  {
    id: "toggle",
    title: "Toggle",
    tag: "fx-toggle",
    icon: "toggle",
    section: C,
    lead: "A switch for a setting that takes effect at once, with its state's word beside it.",
    examples: [
      {
        layout: "column",
        html: `<label>Email alerts <fx-toggle name="alerts" checked></fx-toggle></label>
<fx-toggle aria-label="Auto-deploy"></fx-toggle>
<fx-toggle aria-label="Theme" on-label="Dark" off-label="Light" color="var(--fx-interactive)"></fx-toggle>
<fx-toggle aria-label="Compact" size="sm" checked hide-state></fx-toggle>
<fx-toggle aria-label="Locked" checked disabled></fx-toggle>`,
      },
    ],
    attributes: [
      ["checked", "boolean", "false", ""],
      ["on-label, off-label", "string", "On, Off", "The state's word."],
      ["hide-state", "boolean", "false", "No word."],
      ["size", "sm | md", "md", ""],
      ["color", "CSS color", "--fx-status-success", "The on color."],
      ["value", "string", "on", "What it posts when on."],
      ...FORM_ATTRS,
    ],
    events: FORM_EVENTS,
  },

  // --------------------------------------------------------- navigation
  {
    id: "tabs",
    title: "Tabs",
    tag: "fx-tabs",
    icon: "tabs",
    section: C,
    lead: "Switches between the views of one place. Tabs can be real links; a count badge can carry a status.",
    examples: [
      {
        layout: "stack",
        html: `<fx-tabs selected="overview" label="Project">
  <fx-option value="overview">Overview</fx-option>
  <fx-option value="runs" data-badge="2" data-badge-tone="error">Runs</fx-option>
  <fx-option value="checks" data-badge="5">Checks</fx-option>
  <fx-option value="settings">Settings</fx-option>
  <fx-option value="archive" disabled>Archive</fx-option>
</fx-tabs>
<div class="log">overview</div>`,
        script: (root) => root.addEventListener("fx:tab-select", (e) => log(root, e.detail.id)),
      },
    ],
    attributes: [
      ["tabs", "{ id, label, href?, badges?, disabled? }[]", "", "Property: the tabs, in place of &lt;fx-option&gt; children."],
      ["selected", "string", "", "The selected tab's id."],
      ["label", "string", "", "The tab list's accessible name."],
    ],
    events: [["fx:tab-select", "CustomEvent", "", "<code>{ id }</code>, cancelable: preventDefault() lets a tab's link follow."]],
    slots: [["(default)", "", "", "&lt;fx-option value href disabled data-badge data-badge-tone&gt;."]],
  },
  {
    id: "nav",
    title: "Navigation",
    tag: "fx-nav",
    icon: "list",
    section: C,
    lead: "Side navigation: links in folding groups, with the current page marked. In fx-app-shell's rail it draws icons only. This site's own sidebar is one.",
    examples: [
      {
        layout: "stack",
        html: `<fx-nav label="Example" selected="runs" style="max-width: 16rem; border: 1px solid var(--fx-border)">
  <a href="#" data-id="home" data-icon="home">Home</a>
  <a href="#" data-id="runs" data-icon="flow">Runs</a>
  <fx-nav-group heading="Settings">
    <a href="#" data-id="general">General</a>
    <a href="#" data-id="people">People</a>
  </fx-nav-group>
</fx-nav>`,
        script: (root) => root.addEventListener("fx:nav-select", (e) => e.preventDefault()),
      },
    ],
    attributes: [
      ["items", "({ id, label, href, icon?, badge? } | { heading, id, items, collapsed? })[]", "", "Property: the links and groups, in place of markup."],
      ["selected", "string", "", "The current link's id."],
      ["rail", "boolean", "false", "Icons only."],
      ["filter", "string", "", "A search field above the links; its value is the placeholder. Typing hides what does not match and marks what does; Down goes into the links, Enter opens the first, Escape clears. This site's navigation uses it."],
      ["label", "string", "Main", "The navigation's accessible name; also where group folds are remembered."],
    ],
    events: [["fx:nav-select", "CustomEvent", "", "<code>{ id, href }</code>, cancelable: preventDefault() stops the link."]],
    slots: [["(default)", "", "", "&lt;a href data-id data-icon&gt; and &lt;fx-nav-group heading&gt; children."]],
  },
  {
    id: "app-shell",
    title: "App Shell",
    tag: "fx-app-shell",
    icon: "panel-left",
    section: C,
    lead: "An app's frame: a header, a navigation panel whose edge can be dragged to resize it (or folded to a rail), and the page beside it. This site is built on it -- drag the sidebar's edge.",
    body: () => `<h2>Usage</h2><fx-copy-block data-shell></fx-copy-block>
      <p>Drag the panel's edge, or Tab to it and use the arrow keys (Shift for bigger steps), Home to fold it to the rail and End to open it fully. Enter folds and unfolds; a double-click returns to the starting width. Pulled past its narrowest it folds to the rail. Under 672px the panel becomes an overlay opened by the header's menu button.</p>`,
    mount: (page) => {
      page.querySelector("[data-shell]").value = `<fx-app-shell storage-key="my-app">
  <a slot="brand" href="#/">My App</a>
  <fx-button slot="header-actions" variant="text" size="lg" icon="settings"
    fg-color="var(--fx-shell-header-text)" aria-label="Settings"></fx-button>
  <fx-nav slot="nav" label="Main"></fx-nav>
  <span slot="nav-footer">v1.0</span>
  <main>…the page…</main>
</fx-app-shell>`;
    },
    attributes: [
      ["nav-width", "number (px)", "256", "The panel's starting width; 192 to 480."],
      ["rail", "boolean", "false", "Folded to a 48px rail of icons."],
      ["storage-key", "string", "", "Remember the width and fold under fx.shell.&lt;key&gt;."],
      ["no-header", "boolean", "false", "No header row."],
      ["navWidth", "number", "", "Property: the panel's open width."],
    ],
    events: [["fx:nav-resize", "CustomEvent", "", "<code>{ width, rail }</code> after a resize or fold."]],
    methods: [["toggleNav()", "", "", "What the menu button does: fold to the rail, or open the overlay on a narrow screen."]],
    slots: [["brand", "", "", "The app's name or logo."], ["header-actions", "", "", "Buttons at the header's end."], ["nav", "", "", "The navigation -- usually an fx-nav."], ["nav-footer", "", "", "Pinned under the navigation."], ["(default)", "", "", "The page; give it a &lt;main&gt;."]],
    cssProperties: [["--fx-shell-header-bg", "color", "gray 100", ""], ["--fx-shell-header-text", "color", "gray 10", ""], ["--fx-shell-header-height", "length", "3rem", ""]],
  },

  // ----------------------------------------------------------- overlays
  {
    id: "dialog",
    title: "Dialog",
    tag: "fx-dialog",
    icon: "window",
    section: C,
    lead: "A modal dialog on the native &lt;dialog&gt;: a headline, content, and a row of actions. Focus stays inside; Escape closes it.",
    examples: [
      {
        html: `<fx-button variant="filled" data-open="rename">Rename project</fx-button>
<fx-button variant="danger" data-open="delete">Delete project</fx-button>

<fx-dialog id="rename" headline="Rename project" dismissible>
  <form method="dialog" id="rename-form">
    <fx-text-field label="Name" name="name" value="Atlas" block autofocus></fx-text-field>
  </form>
  <fx-button slot="actions" variant="text" data-close>Cancel</fx-button>
  <fx-button slot="actions" variant="filled" type="submit" form="rename-form">Save</fx-button>
</fx-dialog>

<fx-dialog id="delete" headline="Delete Atlas?" tone="error">
  This removes the project and its history. It can't be undone.
  <fx-button slot="actions" variant="text" data-close>Cancel</fx-button>
  <fx-button slot="actions" variant="danger" data-close>Delete</fx-button>
</fx-dialog>`,
        script: (root) => root.addEventListener("click", (e) => {
          const id = e.target.closest("[data-open]")?.dataset.open;
          if (id) root.querySelector(`#${id}`).showModal();
        }),
      },
    ],
    attributes: [
      ["headline", "string", "", "The title."],
      ["open", "boolean", "false", "Reflects; set it to open."],
      ["dismissible", "boolean", "false", "A click on the backdrop closes it."],
      ["tone", "accent | error | warning | success | …", "", "Fills the headline bar in that color."],
      ["wide", "boolean", "false", "44rem rather than 32rem."],
      ["label", "string", "", "Accessible name when there is no headline."],
    ],
    methods: [["showModal(), show(), close(returnValue)", "", "", "As on &lt;dialog&gt;. Anything with [data-close] inside closes it; a &lt;form method=\"dialog\"&gt; closes it with its submitter's value."]],
    events: [["close", "Event", "", "Once closed."], ["cancel", "Event", "", "Before Escape closes it; cancelable."]],
    slots: [["(default)", "", "", "The content."], ["actions", "", "", "Buttons along the bottom; data-start pushes one to the left."]],
  },
  {
    id: "popup-alert",
    title: "Popup Alert",
    tag: "fx-popup-alert",
    icon: "warning",
    section: C,
    lead: "Confirm, alert and prompt dialogs in place of the browser's, from three functions that return promises.",
    examples: [
      {
        html: `<fx-button data-do="confirm">Confirm</fx-button>
<fx-button data-do="prompt">Ask for input</fx-button>
<fx-button data-do="alert">Alert</fx-button>
<span class="log"></span>`,
        script: (root) => root.addEventListener("click", async (e) => {
          const what = e.target.closest("[data-do]")?.dataset.do;
          if (what === "confirm") {
            const yes = await confirmAction({ title: "Archive 3 projects?", message: "They leave the list but keep their history.", rows: [{ label: "Atlas", status: "ok" }, { label: "Beacon", status: "warn", hint: "has open runs" }, { label: "Comet", status: "fail", hint: "is deploying" }], confirmLabel: "Archive", tone: "warning" });
            log(root, `Confirmed: ${yes}`);
          } else if (what === "prompt") {
            const values = await askInputs({ title: "New folder", fields: [{ key: "name", label: "Name", required: true }, { key: "private", label: "Private", type: "checkbox" }], confirmLabel: "Create" });
            log(root, values ? JSON.stringify(values) : "Canceled");
          } else if (what === "alert") {
            await alertMessage("The file could not be saved.", { detail: "The disk is full." });
            log(root, "Dismissed");
          }
        }),
      },
    ],
    notes: `<p><code>import { confirmAction, askInputs, alertMessage } from "flare-ux"</code>.</p>
      <ul>
        <li><code>confirmAction(options)</code> resolves <code>true</code> on confirm, <code>false</code> otherwise, or <code>"alternate"</code> for the secondary action.</li>
        <li><code>askInputs(options)</code> with <code>fields</code> resolves <code>{ [key]: value }</code>, or <code>null</code> when canceled. A form closes only through its own buttons.</li>
        <li><code>alertMessage(message, { title, detail })</code> -- one button, nothing to decide.</li>
      </ul>
      <p>Options: <code>title, message, detail, rows, warning, confirmLabel, alternateLabel, cancelLabel, tone, fields, html, wide</code>. Rows are <code>{ label, value, hint, status: ok | warn | fail, badges, lines, meter }</code>.</p>`,
  },
  {
    id: "drawer",
    title: "Drawer",
    tag: "fx-drawer",
    icon: "panel-right",
    section: C,
    lead: "A panel that slides in over the page from its edge -- a row's details, a long form. Its inner edge drags to resize it.",
    examples: [
      {
        html: `<fx-button data-open="end">Open drawer</fx-button>
<fx-button data-open="start">Open modal drawer from the start</fx-button>

<fx-drawer id="drawer-end" headline="Build #482" storage-key="docs-demo">
  <p><fx-status-chip tone="pass">Passed</fx-status-chip></p>
  <p>Drag the left edge to resize. Escape closes it.</p>
  <fx-button slot="actions" variant="text" data-close-drawer>Close</fx-button>
  <fx-button slot="actions" variant="filled">Re-run</fx-button>
</fx-drawer>

<fx-drawer id="drawer-start" headline="Filters" placement="start" modal width="22rem">
  <fx-checkbox checked></fx-checkbox> Show archived
</fx-drawer>`,
        script: (root) => root.addEventListener("click", (e) => {
          const side = e.target.closest("[data-open]")?.dataset.open;
          if (side) root.querySelector(`#drawer-${side}`).show();
          if (e.target.closest("[data-close-drawer]")) e.target.closest("fx-drawer").close();
        }),
      },
    ],
    attributes: [
      ["open", "boolean", "false", "Reflects; set it to open."],
      ["headline", "string", "", "The title."],
      ["placement", "end | start", "end", "Which edge it slides from."],
      ["modal", "boolean", "false", "Dims the page and keeps focus inside."],
      ["width", "CSS length", "min(32rem, 90vw)", "Its starting width."],
      ["storage-key", "string", "", "Remember a dragged width under fx.drawer-width.&lt;key&gt;."],
      ["no-resize", "boolean", "false", "No drag handle."],
    ],
    methods: [["show(), close()", "", "", ""]],
    events: [["close", "Event", "", "Once closed."], ["cancel", "Event", "", "Before Escape or the dim closes it; cancelable."]],
    slots: [["(default)", "", "", "The content."], ["header-actions", "", "", "Beside the close button."], ["actions", "", "", "A footer row of buttons."]],
  },
  {
    id: "tooltip",
    title: "Tooltip",
    tag: "fx-tool-tip",
    icon: "info",
    section: C,
    lead: "A rich tooltip around what it wraps: a line, a heading with details, or a person. Shown on hover and focus, hidden by Escape.",
    examples: [
      {
        html: `<fx-tool-tip text="Copies the link to this page">
  <fx-button icon="copy" aria-label="Copy link"></fx-button>
</fx-tool-tip>
<fx-tool-tip heading="Last deploy" details='["Tuesday at 14:02", "Took 3 minutes"]'>
  <fx-button variant="text" icon="clock">History</fx-button>
</fx-tool-tip>
<fx-tool-tip name="Ada Lovelace" email="ada@example.com" placement="bottom">
  <a href="#" onclick="return false">Ada</a>
</fx-tool-tip>`,
      },
    ],
    attributes: [
      ["text", "string", "", "One line."],
      ["heading", "string", "", "A bold first line."],
      ["details", "JSON string[]", "", "More lines."],
      ["name, email, avatar", "string", "", "A person: photo, name, and an email that copies on click."],
      ["placement", "top | bottom", "top", "Flips when there is no room."],
      ["block", "boolean", "false", "Display block."],
    ],
  },

  // ----------------------------------------------------------- feedback
  {
    id: "notification",
    title: "Notification",
    tag: "fx-notification",
    icon: "bell",
    section: C,
    lead: "An inline message in one of the status tones, with an optional action and close button. Error notifications are announced at once.",
    examples: [
      {
        layout: "stack",
        html: `<fx-notification tone="error" headline="Deploy failed.">Two checks did not pass.</fx-notification>
<fx-notification tone="incomplete" headline="Results incomplete.">One runner has not reported back.</fx-notification>
<fx-notification tone="warning" headline="Sync paused." dismissible>
  It resumes at midnight.
  <fx-button slot="actions" size="sm">Resume now</fx-button>
</fx-notification>
<fx-notification tone="success" headline="Saved." dismissible low-contrast>Your changes are live.</fx-notification>
<fx-notification headline="Heads up.">Maintenance on Sunday.</fx-notification>`,
      },
    ],
    attributes: [
      ["tone", "error | incomplete | warning | success | info | neutral", "info", "Or fail, unknown, pause, pass."],
      ["headline", "string", "", "The bold first words."],
      ["dismissible", "boolean", "false", "A close button."],
      ["low-contrast", "boolean", "false", "The tone's tint as the background."],
    ],
    methods: [["dismiss()", "", "", "Close it, unless an fx:dismiss listener prevents it."]],
    events: [["fx:dismiss", "CustomEvent", "", "Before it closes; cancelable."]],
    slots: [["(default)", "", "", "The message."], ["actions", "", "", "Buttons under the message."]],
  },
  {
    id: "toast",
    title: "Toast",
    tag: "fx-toast",
    icon: "toast",
    section: C,
    lead: "A small message that pops up in the lower-right corner and leaves on its own -- or stays until its close button is clicked.",
    examples: [
      {
        title: "From script",
        description: "<code>toast(message, { tone, duration, persistent, html })</code> pops one up and returns it; it removes itself once closed.",
        html: `<fx-button data-toast="plain">Copy</fx-button>
<fx-button data-toast="success">Save</fx-button>
<fx-button data-toast="error">Fail, and stay</fx-button>`,
        script: (demo) =>
          demo.addEventListener("click", (event) => {
            const kind = event.target.closest("[data-toast]")?.dataset.toast;
            if (kind === "plain") toast("Copied <code>var(--fx-color-red-40)</code>", { html: true });
            if (kind === "success") toast("Saved", { tone: "success" });
            if (kind === "error") toast("Could not reach the server", { tone: "error", persistent: true });
          }),
      },
      {
        title: "In markup",
        description: "A toast in the page stays hidden until <code>show()</code> moves it to the corner.",
        html: `<fx-toast id="sync-toast" tone="pause" duration="6000">Sync paused for 10 minutes</fx-toast>
<fx-button onclick="document.getElementById('sync-toast').show()">Pause sync</fx-button>`,
      },
    ],
    attributes: [
      ["tone", "error | incomplete | warning | success | info | neutral (or fail, unknown, pause, pass)", "", "Without one it takes the tooltip's colors."],
      ["duration", "number (ms)", "4000", "Time on screen; waits while the pointer or focus is on it."],
      ["persistent", "boolean", "false", "Stays until its close button is clicked."],
      ["open", "boolean", "", "Set while it is showing (read-only)."],
    ],
    methods: [
      ["show()", "", "", "Pops it up in the corner and starts its timer."],
      ["close()", "", "", "Takes it away."],
      ["toast(message, options)", "", "", "Module function: makes, shows and returns a toast."],
    ],
    events: [["fx:close", "", "", "After it closes, for any reason."]],
    notes: "<p>Toasts stack in one region in the top layer, so they show above dialogs. Each is a <code>role=\"status\"</code> (an error is <code>role=\"alert\"</code>), so screen readers announce it. Use a toast for word that something happened; use a <a href=\"#/components/notification\">notification</a> for anything the reader must act on.</p>",
  },
  {
    id: "status-chip",
    title: "Status Chip",
    tag: "fx-status-chip",
    icon: "circle-dash",
    section: C,
    lead: "A status as a small pill: a dot in the state's exact color and its word, readable on any background.",
    examples: [
      {
        layout: "column",
        html: `<div class="row">
  <fx-status-chip tone="fail">Failed</fx-status-chip>
  <fx-status-chip tone="unknown">Unknown</fx-status-chip>
  <fx-status-chip tone="pause">Paused</fx-status-chip>
  <fx-status-chip tone="pass">Passed</fx-status-chip>
  <fx-status-chip tone="info">Queued</fx-status-chip>
  <fx-status-chip>Draft</fx-status-chip>
</div>
<div class="row">
  <fx-status-chip tone="error" variant="solid">Error</fx-status-chip>
  <fx-status-chip tone="warning" variant="outline">Warning</fx-status-chip>
  <fx-status-chip tone="success" icon="check">Approved</fx-status-chip>
  <fx-status-chip tone="incomplete" size="sm">Small</fx-status-chip>
</div>`,
      },
    ],
    attributes: [
      ["tone", "error | incomplete | warning | success | info | neutral", "neutral", "Or fail, unknown, pause, pass."],
      ["text", "string", "", "The word, when not given as content."],
      ["variant", "tint | solid | outline", "tint", ""],
      ["size", "sm | md", "md", ""],
      ["dot", "\"false\"", "", "No dot."],
      ["icon", "string", "", "An icon in place of the dot."],
      ["live", "boolean", "false", "Announce changes (role=\"status\")."],
    ],
  },
  {
    id: "count-badge",
    title: "Count Badge",
    tag: "fx-count-badge",
    icon: "bell-dot",
    section: C,
    lead: "A count beside a label or heading. Sized in em, so it scales with the text beside it.",
    examples: [
      {
        layout: "column",
        html: `<h3 style="margin:0">Open issues <fx-count-badge>12</fx-count-badge></h3>
<span>Failing <fx-count-badge tone="error">3</fx-count-badge></span>
<span>Paused <fx-count-badge tone="pause">1</fx-count-badge> Passed <fx-count-badge tone="pass">48</fx-count-badge></span>`,
      },
      {
        title: "Palette colors",
        description: "<code>color</code> takes a palette family, drawn at its 60 step, for counts that only need telling apart.",
        html: `<span>Red <fx-count-badge color="red">7</fx-count-badge></span>
<span>Orange <fx-count-badge color="orange">7</fx-count-badge></span>
<span>Yellow <fx-count-badge color="yellow">7</fx-count-badge></span>
<span>Green <fx-count-badge color="green">7</fx-count-badge></span>
<span>Teal <fx-count-badge color="teal">7</fx-count-badge></span>
<span>Blue <fx-count-badge color="blue">7</fx-count-badge></span>
<span>Purple <fx-count-badge color="purple">7</fx-count-badge></span>
<span>Magenta <fx-count-badge color="magenta">7</fx-count-badge></span>
<span>Gray <fx-count-badge color="gray">7</fx-count-badge></span>`,
      },
      {
        title: "Shades",
        description: "Or a family and step: <code>red-80</code> for maroon, <code>blue-90</code> for navy. Steps 10 to 50 take dark numbers.",
        html: `<span>Maroon <fx-count-badge color="red-80">12</fx-count-badge></span>
<span>Navy <fx-count-badge color="blue-90">12</fx-count-badge></span>
<span>Plum <fx-count-badge color="purple-80">12</fx-count-badge></span>
<span>Forest <fx-count-badge color="green-80">12</fx-count-badge></span>
<span>Mint <fx-count-badge color="teal-20">12</fx-count-badge></span>
<span>Pink <fx-count-badge color="magenta-30">12</fx-count-badge></span>
<span>Sky <fx-count-badge color="blue-30">12</fx-count-badge></span>
<span>Peach <fx-count-badge color="orange-20">12</fx-count-badge></span>`,
      },
    ],
    attributes: [
      ["tone", "status tone", "", "A count that carries a verdict; plain dark otherwise."],
      ["color", "family | family-step", "", "A palette color: <code>teal</code> (its 60 step) or <code>red-80</code>. Steps 10-50 take dark numbers, 60-100 white."],
    ],
    cssProperties: [["--fx-count-badge-bg", "color", "", ""], ["--fx-count-badge-color", "color", "", ""]],
  },
  {
    id: "spinner",
    title: "Spinner",
    tag: "fx-spinner",
    icon: "spinner",
    section: C,
    lead: "Something is loading. Says \"Loading\" to assistive technology unless given another label. Slows to a gentle turn under reduced motion.",
    examples: [
      {
        title: "Sizes",
        html: `<fx-spinner size="16"></fx-spinner>
<fx-spinner size="32"></fx-spinner>
<fx-spinner size="48"></fx-spinner>
<fx-spinner size="64" aria-label="Saving"></fx-spinner>`,
      },
      {
        title: "Colors",
        description: "<code>fg-color</code> takes any color -- here each palette family at its 60 step (yellow at 30).",
        html: `<fx-spinner size="40" fg-color="var(--fx-color-red-60)"></fx-spinner>
<fx-spinner size="40" fg-color="var(--fx-color-orange-60)"></fx-spinner>
<fx-spinner size="40" fg-color="var(--fx-color-yellow-30)"></fx-spinner>
<fx-spinner size="40" fg-color="var(--fx-color-green-60)"></fx-spinner>
<fx-spinner size="40" fg-color="var(--fx-color-teal-60)"></fx-spinner>
<fx-spinner size="40" fg-color="var(--fx-color-blue-60)"></fx-spinner>
<fx-spinner size="40" fg-color="var(--fx-color-purple-60)"></fx-spinner>
<fx-spinner size="40" fg-color="var(--fx-color-magenta-60)"></fx-spinner>
<fx-spinner size="40" fg-color="var(--fx-color-gray-60)"></fx-spinner>`,
      },
      {
        title: "Colors on a ring",
        description: "<code>bg-color</code> draws the ring behind the arc -- here the family's 20 step.",
        html: `<fx-spinner size="40" fg-color="var(--fx-color-red-60)" bg-color="var(--fx-color-red-20)"></fx-spinner>
<fx-spinner size="40" fg-color="var(--fx-color-orange-60)" bg-color="var(--fx-color-orange-20)"></fx-spinner>
<fx-spinner size="40" fg-color="var(--fx-color-yellow-30)" bg-color="var(--fx-color-yellow-20)"></fx-spinner>
<fx-spinner size="40" fg-color="var(--fx-color-green-60)" bg-color="var(--fx-color-green-20)"></fx-spinner>
<fx-spinner size="40" fg-color="var(--fx-color-teal-60)" bg-color="var(--fx-color-teal-20)"></fx-spinner>
<fx-spinner size="40" fg-color="var(--fx-color-blue-60)" bg-color="var(--fx-color-blue-20)"></fx-spinner>
<fx-spinner size="40" fg-color="var(--fx-color-purple-60)" bg-color="var(--fx-color-purple-20)"></fx-spinner>
<fx-spinner size="40" fg-color="var(--fx-color-magenta-60)" bg-color="var(--fx-color-magenta-20)"></fx-spinner>
<fx-spinner size="40" fg-color="var(--fx-color-gray-60)" bg-color="var(--fx-color-gray-20)"></fx-spinner>`,
      },
      {
        title: "In a button",
        description: "A button's <code>loading</code> attribute shows a spinner in the button's own text color and blocks clicks.",
        html: `<fx-button variant="filled" loading>Saving</fx-button>
<fx-button variant="tonal" loading>Saving</fx-button>
<fx-button loading>Saving</fx-button>
<fx-button variant="text" loading>Saving</fx-button>
<fx-button variant="danger" loading>Deleting</fx-button>
<fx-button variant="filled" icon="refresh" aria-label="Refreshing" loading></fx-button>`,
      },
    ],
    attributes: [
      ["size", "number (px)", "64", ""],
      ["fg-color", "CSS color", "--fx-interactive", "The arc and its tail."],
      ["bg-color", "CSS color", "transparent", "The ring behind."],
    ],
    notes: "<p><code>busySpinnerHtml(size, { fg, bg })</code> returns a small spinner's HTML, hidden from assistive technology, to put before a \"working on it\" message.</p>",
  },

  // --------------------------------------------------------------- data
  {
    id: "summary-card",
    title: "Summary Card",
    tag: "fx-summary-card",
    icon: "summary-card",
    section: C,
    lead: "One headline number and what it counts. A row of them makes a page's key figures; a tinted one carries a verdict.",
    examples: [
      {
        html: `<fx-summary-card count="128" text="Projects"></fx-summary-card>
<fx-summary-card count="3" text="Failing" color="fail" tinted icon="status-warn"></fx-summary-card>
<fx-summary-card count="7" text="Unknown" color="unknown"></fx-summary-card>
<fx-summary-card count="2" text="Paused" color="pause"></fx-summary-card>
<fx-summary-card count="96%" text="Passing" color="pass" href="#/components/summary-card"></fx-summary-card>
<fx-summary-card count="0" text="Hidden unless show-when-zero"></fx-summary-card>
<fx-summary-card count="0" text="Blocked" color="info" show-when-zero></fx-summary-card>`,
      },
    ],
    attributes: [
      ["count", "string", "0", "The number."],
      ["text", "string", "", "What it counts; a newline breaks the line."],
      ["color", "status tone | CSS color", "text color", "The bar and number."],
      ["tinted", "boolean", "false", "The tone's tint behind it."],
      ["icon", "string", "", "An icon before the text."],
      ["href", "string", "", "Makes it a link."],
      ["show-when-zero", "boolean", "false", "Zero counts are hidden otherwise."],
    ],
  },
  {
    id: "data-table",
    title: "Data Table",
    tag: "fx-data-table",
    icon: "table",
    section: C,
    lead: "Rows to scan, sort and open. Columns are data, cells can be any HTML, and a search highlights its matches without redrawing.",
    examples: [
      {
        layout: "stack",
        html: `<fx-text-field type="search" icon="search" aria-label="Search projects" placeholder="Search…" size="sm"></fx-text-field>
<fx-data-table label="Projects" zebra></fx-data-table>
<div class="log"></div>`,
        script: (root) => {
          const table = root.querySelector("fx-data-table");
          const tone = { Passed: "pass", Failed: "fail", Paused: "pause", Unknown: "unknown" };
          table.columns = [
            { key: "name", label: "Project", value: (r) => r.name, defaultSort: true, render: (r) => `<strong>${r.name}</strong>` },
            { key: "status", label: "Status", value: (r) => r.status, render: (r) => `<fx-status-chip tone="${tone[r.status]}">${r.status}</fx-status-chip>` },
            { key: "owner", label: "Owner", value: (r) => r.owner },
            { key: "runs", label: "Runs", value: (r) => r.runs, align: "end" },
            { key: "actions", label: "", width: "3rem", render: () => `<button data-action="refresh" aria-label="Re-run"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg></button>` },
          ];
          table.rows = [
            { id: 1, name: "Atlas", status: "Passed", owner: "Ada", runs: 482 },
            { id: 2, name: "Beacon", status: "Failed", owner: "Grace", runs: 97 },
            { id: 3, name: "Comet", status: "Paused", owner: "Alan", runs: 1204 },
            { id: 4, name: "Delta", status: "Unknown", owner: "Ada", runs: 3 },
            { id: 5, name: "Echo", status: "Passed", owner: "Katherine", runs: 56 },
          ];
          root.querySelector("fx-text-field").addEventListener("input", (e) => (table.searchQuery = e.target.value));
          table.addEventListener("fx:row-select", (e) => log(root, `Opened ${e.detail.row.name}`));
          table.addEventListener("fx:cell-action", (e) => log(root, `${e.detail.action} ${e.detail.row.name}`));
        },
      },
    ],
    attributes: [
      ["columns", "{ key, label, value?, render?, then?, defaultSort?, align?, width? }[]", "", "Property."],
      ["rows", "object[]", "", "Property. A row's <code>id</code> is passed back in events."],
      ["emptyMessage", "string", "No results.", "Property."],
      ["searchQuery", "string", "", "Property: highlights matches in the cells."],
      ["size", "xs | sm | md | lg", "md", "Row height: 24, 32, 40, 48px."],
      ["zebra", "boolean", "false", "Striped rows."],
      ["sticky-header", "boolean", "false", "The header stays as the table scrolls."],
      ["static", "boolean", "false", "Rows do not open."],
      ["storage-key", "string", "", "Remember the reader's sort."],
      ["label", "string", "", "The table's accessible name."],
    ],
    events: [
      ["fx:row-select", "CustomEvent", "", "<code>{ id, row }</code> -- a row was clicked or Entered."],
      ["fx:cell-action", "CustomEvent", "", "<code>{ action, row, button }</code> -- a [data-action] button in a cell."],
      ["fx:sort", "CustomEvent", "", "<code>{ key, dir }</code>."],
    ],
    notes: "<p><code>render(row)</code> returns HTML: escape anything that came from a user with <code>escapeHtml</code> from <code>flare-ux</code>.</p>",
  },
  {
    id: "copy-block",
    title: "Copy Block",
    tag: "fx-copy-block",
    icon: "code-block",
    section: C,
    lead: "A block of code with a button that copies it. Every example on this site uses one.",
    examples: [{ layout: "stack", html: `<fx-copy-block value="npm run dev"></fx-copy-block>` }],
    attributes: [["value", "string", "its text", "The code."]],
  },
  {
    id: "icon",
    title: "Icon",
    tag: "fx-icon",
    icon: "star",
    section: C,
    lead: "One icon by name, from the Flare UX set or one you register. It draws in currentColor and sizes to the text unless told otherwise.",
    examples: [
      {
        html: `<fx-icon name="settings"></fx-icon>
<fx-icon name="refresh" size="20"></fx-icon>
<fx-icon name="status-ok" size="24" style="color: var(--fx-status-success)"></fx-icon>
<fx-icon name="status-error" size="24" style="color: var(--fx-status-error)" label="Error"></fx-icon>
<fx-icon name="warning" size="32" style="color: var(--fx-status-incomplete)"></fx-icon>
<fx-icon name="edit" size="32"></fx-icon>`,
      },
    ],
    attributes: [
      ["name", "string", "", "An icon's name, or set:name."],
      ["size", "16 | 20 | 24 | 32 | CSS length", "1em", ""],
      ["label", "string", "", "What it means, when it stands alone; otherwise it is decoration."],
    ],
    notes: `<p>Register your own set: <code>registerIconSet("my-app", { viewBox: "0 0 24 24", style: "stroke", icons: { rocket: '&lt;path d="…"/&gt;' } })</code>. See <a href="#/foundations/icons">All Icons</a> for every name.</p>`,
  },
];
