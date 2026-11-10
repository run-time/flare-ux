// The Flare UX icons: outline glyphs on a 24x24 grid, stroked in currentColor.
// They stay legible at 14-20px beside text and are what the components
// themselves draw (fx-button's icon="refresh", the select's chevron, the
// checkbox's tick). Every one is drawn for Flare UX; add more in the same
// style -- 2px round strokes, about 2px clear of the grid's edge.

import { registerIconSet } from "./registry.js";

// A heavier stroke for marks read at a glance down a column.
const BOLD = 'fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"';
const BOLDER = 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
const FILLED = 'fill="currentColor"';

export const CORE_ICONS = {
  // Actions
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  edit: '<path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 0l.5.5a2.1 2.1 0 0 1 0 3L8.5 19Z"/><path d="m13.5 7 3.5 3.5"/>',
  trash: '<path d="M4 6.5h16"/><path d="M9.5 6.5V4h5v2.5"/><path d="m6 6.5 1 13.5h10l1-13.5"/><path d="M10 10.5v6"/><path d="M14 10.5v6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  refresh: '<path d="M19.5 9A8 8 0 1 0 20 13"/><path d="M20 4v5h-5"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
  download: '<path d="M12 4v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  external: '<path d="M13 4h7v7"/><path d="m20 4-9 9"/><path d="M17 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5"/>',
  share: { attrs: 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="butt" stroke-linejoin="miter"', body: '<path d="M10 4H4v16h16v-6"/><path d="M14 4h6v6"/><path d="M19.5 4.5L11 13"/>' },
  play: { attrs: FILLED, body: '<path d="M8 5.6c0-.8.86-1.3 1.55-.9l9.2 5.4a1.05 1.05 0 0 1 0 1.8l-9.2 5.4A1.05 1.05 0 0 1 8 16.4V5.6Z"/>' },
  stop: '<rect x="6" y="6" width="12" height="12" rx="1"/>',
  reply: { attrs: BOLDER, body: '<path d="M10 5 4 11l6 6"/><path d="M4 11h9a7 7 0 0 1 7 7v1"/>' },
  "file-plus": '<path d="M6 3h8l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/><path d="M12 11.5v6"/><path d="M9 14.5h6"/>',
  "folder-plus": '<path d="M3 6a1 1 0 0 1 1-1h5l2 2.5h9a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M12 11v6"/><path d="M9 14h6"/>',

  // Direction
  "arrow-up": '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
  "arrow-down": '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  "chevron-right": '<path d="m9 6 6 6-6 6"/>',
  "chevron-left": '<path d="m15 6-6 6 6 6"/>',
  "chevron-up": '<path d="m6 15 6-6 6 6"/>',
  grip: { attrs: FILLED, body: '<circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/>' },
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',

  // Status marks
  "status-pass": { attrs: BOLD, body: '<path d="M5 12.5l4 4L19 7.5"/>' },
  "status-fail": { attrs: BOLD, body: '<path d="M6 6l12 12M18 6L6 18"/>' },
  "status-pending": { attrs: BOLD, body: '<path d="M8.6 8.6a3.5 3.5 0 1 1 4.4 4.2c-.8.3-1 .8-1 1.6v.6"/><path d="M12 18.6v.01"/>' },
  "status-ok": { attrs: BOLDER, body: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.75 2.75L16 9.5"/>' },
  "status-warn": { attrs: BOLDER, body: '<path d="M12 3.5 2.5 20h19Z"/><path d="M12 10v4"/><path d="M12 17.25h.01"/>' },
  "status-error": { attrs: BOLDER, body: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6"/><path d="m15 9-6 6"/>' },
  "status-info": { attrs: BOLDER, body: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.75h.01"/>' },
  question: { attrs: BOLDER, body: '<path d="M8.5 9a3.5 3.5 0 1 1 5 3.2c-.9.4-1.5 1.1-1.5 2.1v.7"/><path d="M12 18.5h.01"/>' },
  clock: { attrs: BOLD, body: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>' },
  dash: { attrs: BOLD, body: '<path d="M7 12h10"/>' },

  // Things
  settings: '<path d="M10.38 4.98 10.68 2.59H13.32L13.62 4.98 15.82 5.89 17.72 4.41 19.59 6.28 18.11 8.18 19.02 10.38 21.41 10.68V13.32L19.02 13.62 18.11 15.82 19.59 17.72 17.72 19.59 15.82 18.11 13.62 19.02 13.32 21.41H10.68L10.38 19.02 8.18 18.11 6.28 19.59 4.41 17.72 5.89 15.82 4.98 13.62 2.59 13.32V10.68L4.98 10.38 5.89 8.18 4.41 6.28 6.28 4.41 8.18 5.89Z"/><circle cx="12" cy="12" r="3"/>',
  sliders: '<path d="M4 6h9"/><path d="M17 6h3"/><circle cx="15" cy="6" r="2"/><path d="M4 12h3"/><path d="M11 12h9"/><circle cx="9" cy="12" r="2"/><path d="M4 18h11"/><path d="M19 18h1"/><circle cx="17" cy="18" r="2"/>',
  chat: '<path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m4 7 8 6 8-6"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 10h17"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M8 14h.01M12 14h.01M16 14h.01"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="1.5"/><path d="M8 10.5v-3a4 4 0 0 1 8 0v3"/><path d="M12 14.5v2"/>',
  eye: '<path d="M2.5 12C5 7.5 8.2 5.5 12 5.5s7 2 9.5 6.5c-2.5 4.5-5.7 6.5-9.5 6.5S5 16.5 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
  code: '<path d="m8.5 7-5 5 5 5"/><path d="m15.5 7 5 5-5 5"/><path d="m13.5 5-3 14"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="m7 9.5 2.5 2.5L7 14.5"/><path d="M12 15h5"/>',
  merge: { attrs: 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"', body: '<circle cx="7" cy="5.5" r="2.5"/><circle cx="7" cy="18.5" r="2.5"/><circle cx="17" cy="12" r="2.5"/><path d="M7 8v8"/><path d="M7 8c0 3 2.5 4 7.5 4"/>' },
  diff: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 7v6"/><path d="M9 10h6"/><path d="M9 16.5h6"/>',
  flow: '<circle cx="6.5" cy="6.5" r="3"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M6.5 9.5v5a3 3 0 0 0 3 3H14"/>',
  checklist: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h8"/><path d="M6.8 7.8h.01"/><path d="M6.8 11.8h.01"/><path d="M6.8 15.8h.01"/>',
  robot: '<rect x="4" y="7.5" width="16" height="12" rx="2.5"/><path d="M12 7.5v-3"/><circle cx="12" cy="3.5" r="1"/><circle cx="9" cy="13" r="1.25" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1.25" fill="currentColor" stroke="none"/><path d="M9.5 16.5h5"/><path d="M2 12v3"/><path d="M22 12v3"/>',
  bug: '<ellipse cx="12" cy="14" rx="5" ry="6.5"/><path d="M9 8.5a3 3 0 0 1 6 0"/><path d="M12 9v11"/><path d="M7 13H3.5"/><path d="M20.5 13H17"/><path d="m4.5 7.5 3 2"/><path d="m19.5 7.5-3 2"/><path d="m4.5 19.5 3-2"/><path d="m19.5 19.5-3-2"/>',
  factory: '<path d="M3 20.5V11l5 3.5V11l5 3.5V11l4 2.8V3.5h3.5v17Z"/><path d="M6.5 17.5h2"/><path d="M11.5 17.5h2"/>',
  github: { attrs: 'fill="currentColor"', body: '<path transform="scale(1.5)" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>' },

  // Views
  "view-compact": { attrs: 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"', body: '<path d="M5 8h14"/><path d="M5 16h14"/>' },
  "view-detail": { attrs: 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"', body: '<path d="M4 5h16"/><path d="M4 9.5h11"/><path d="M4 14.5h16"/><path d="M4 19h11"/>' },
  "panel-left": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  sun: '<circle cx="12" cy="12" r="3.75"/><path d="M18.3 12h2.5"/><path d="m16.45 16.45 1.77 1.77"/><path d="M12 18.3v2.5"/><path d="m7.55 16.45-1.77 1.77"/><path d="M5.7 12H3.2"/><path d="M7.55 7.55 5.78 5.78"/><path d="M12 5.7V3.2"/><path d="m16.45 7.55 1.77-1.77"/>',
  moon: '<path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a6.5 6.5 0 0 0 11 11Z"/>',

  // More actions
  minus: '<path d="M5 12h14"/>',
  upload: '<path d="M12 15V4"/><path d="M7.5 8.5 12 4l4.5 4.5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  save: '<path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M7 3v5h8V3"/><path d="M7 21v-7h10v7"/>',
  undo: '<path d="M8 5 4 9l4 4"/><path d="M4 9h11a5 5 0 0 1 0 10h-4"/>',
  redo: '<path d="m16 5 4 4-4 4"/><path d="M20 9H9a5 5 0 0 0 0 10h4"/>',
  send: '<path d="M21 3 3 10.5l7.5 3 3 7.5Z"/><path d="M21 3 10.5 13.5"/>',
  link: '<path d="m9.5 14.5 5-5"/><path d="m11 6.5 1.8-1.8a4.2 4.2 0 0 1 6 6L17 12.5"/><path d="m13 17.5-1.8 1.8a4.2 4.2 0 0 1-6-6L7 11.5"/>',
  filter: '<path d="M3 5h18l-7 8.5V19l-4 2v-7.5Z"/>',
  "sort-ascending": '<path d="M7 20V4"/><path d="m3 8 4-4 4 4"/><path d="M14 6h3"/><path d="M14 12h5"/><path d="M14 18h7"/>',
  "sort-descending": '<path d="M7 4v16"/><path d="m3 16 4 4 4-4"/><path d="M14 6h7"/><path d="M14 12h5"/><path d="M14 18h3"/>',
  "zoom-in": '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/><path d="M11 8v6"/><path d="M8 11h6"/>',
  "zoom-out": '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/><path d="M8 11h6"/>',
  print: '<path d="M7 9V3h10v6"/><path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v7H7Z"/>',
  pause: { attrs: FILLED, body: '<rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/>' },
  "more-vertical": { attrs: FILLED, body: '<circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/>' },
  "more-horizontal": { attrs: FILLED, body: '<circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>' },
  login: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M3 12h11"/><path d="m10 8 4 4-4 4"/>',
  logout: '<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M9 12h11"/><path d="m16 8 4 4-4 4"/>',

  // More direction
  "arrow-left": '<path d="M19 12H5"/><path d="m12 5-7 7 7 7"/>',
  "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  maximize: '<path d="M4 9V4h5"/><path d="M15 4h5v5"/><path d="M20 15v5h-5"/><path d="M9 20H4v-5"/>',
  minimize: '<path d="M9 4v5H4"/><path d="M15 4v5h5"/><path d="M15 20v-5h5"/><path d="M9 20v-5H4"/>',

  // Notices
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><path d="M12 7.5h.01"/>',
  "alert-circle": '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/><path d="M12 16.5h.01"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.7-.9 1.3v.5"/><path d="M12 17h.01"/>',
  warning: '<path d="M12 3.5 2.5 20h19Z"/><path d="M12 10v4.5"/><path d="M12 17.5h.01"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4Z"/><path d="M10 21h4"/>',
  "bell-dot": '<path d="M13.5 5.2A6 6 0 0 0 6 11v5l-2 2h16l-2-2v-3"/><path d="M10 21h4"/><circle cx="18.5" cy="6" r="3" fill="currentColor" stroke="none"/>',
  spinner: '<path d="M12 3a9 9 0 1 1-9 9"/>',
  "circle-dash": '<circle cx="12" cy="12" r="8.5" stroke-dasharray="3.34 3.34"/>',

  // People and places
  home: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h4.5v-5.5h4V20h4.5V9.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M15.5 4.7a3.5 3.5 0 0 1 0 6.6"/><path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
  location: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z"/>',

  // More things
  file: '<path d="M6 3h8l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/>',
  folder: '<path d="M3 6a1 1 0 0 1 1-1h5l2 2.5h9a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 15-5-5-9 10"/>',
  tag: '<path d="M3 4v7.6a1 1 0 0 0 .3.7l8.4 8.4a1 1 0 0 0 1.4 0l7.6-7.6a1 1 0 0 0 0-1.4L12.3 3.3a1 1 0 0 0-.7-.3H4a1 1 0 0 0-1 1Z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  bookmark: '<path d="M6 3h12v18l-6-4.5L6 21Z"/>',
  star: '<path d="M12 3.1 14.41 9.28 21.04 9.66 15.9 13.87 17.58 20.29 12 16.7 6.42 20.29 8.1 13.87 2.96 9.66 9.59 9.28Z"/>',
  heart: '<path d="M12 20s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.2-8 11-8 11Z"/>',
  unlock: '<rect x="4.5" y="10.5" width="15" height="10" rx="1.5"/><path d="M8 10.5v-3a4 4 0 0 1 7.6-1.75"/><path d="M12 14.5v2"/>',
  "eye-off": '<path d="M6.5 6.9C3.6 8.7 2 12 2 12s3.6 6.5 10 6.5c1.9 0 3.5-.6 4.9-1.4"/><path d="M10 5.7c.6-.1 1.3-.2 2-.2 6.4 0 10 6.5 10 6.5s-.8 1.5-2.3 3.1"/><path d="M3 3l18 18"/>',
  history: '<path d="M4.5 9A8 8 0 1 1 4 13"/><path d="M4 4v5h5"/><path d="M12 8v4l3 2"/>',
  cloud: '<path d="M7 19a4.5 4.5 0 0 1-.7-8.95A6 6 0 0 1 17.8 9 5 5 0 0 1 17 19Z"/>',
  database: '<ellipse cx="12" cy="5.5" rx="8" ry="2.5"/><path d="M4 5.5v13c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-13"/><path d="M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5"/>',
  palette: '<circle cx="12" cy="8.5" r="5"/><circle cx="8.5" cy="15" r="5"/><circle cx="15.5" cy="15" r="5"/>',
  ruler: '<rect x="2.5" y="8" width="19" height="8" rx="1"/><path d="M6.5 8v3"/><path d="M10.5 8v4"/><path d="M14.5 8v3"/><path d="M18.5 8v4"/>',

  // Text
  heading: '<path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 12h12"/>',
  bold: { attrs: BOLD, body: '<path d="M7 4h6a4 4 0 0 1 0 8H7Z"/><path d="M7 12h7a4 4 0 0 1 0 8H7Z"/>' },
  italic: '<path d="M10 4h8"/><path d="M6 20h8"/><path d="M14 4 10 20"/>',
  underline: '<path d="M7 4v6a5 5 0 0 0 10 0V4"/><path d="M5 20h14"/>',
  list: '<path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><path d="M4.5 6h.01"/><path d="M4.5 12h.01"/><path d="M4.5 18h.01"/>',

  // Interface pieces -- one per kind of control
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M3 15h18"/><path d="M10 10v10"/>',
  cursor: '<path d="M5.5 3.5v15l4-3.7 2.7 5.9 2.5-1.1-2.7-5.8h5.5Z"/>',
  "split-button": '<rect x="2.5" y="7" width="19" height="10" rx="2"/><path d="M15 7v10"/><path d="m17 11 1.25 1.5L19.5 11"/>',
  segments: '<rect x="2.5" y="7" width="19" height="10" rx="2"/><path d="M9 7v10"/><path d="M15 7v10"/>',
  "text-field": '<rect x="2.5" y="7" width="19" height="10" rx="2"/><path d="M7 10v4"/>',
  "list-dropdown": '<rect x="2.5" y="3.5" width="19" height="7" rx="2"/><path d="m15.5 6.25 1.5 1.5 1.5-1.5"/><path d="M5 15h12"/><path d="M5 19.5h8"/>',
  checkbox: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12.5 3 3 5-6"/>',
  radio: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none"/>',
  toggle: '<rect x="2" y="7" width="20" height="10" rx="5"/><circle cx="17" cy="12" r="2.5" fill="currentColor" stroke="none"/>',
  tabs: '<path d="M3 20V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v4h9a1 1 0 0 1 1 1v10Z"/><path d="M11 9V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4"/>',
  "summary-card": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9v6"/><path d="M11 10h6"/><path d="M11 14h3.5"/>',
  toast: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M11 15.5h6"/>',
  accordion: '<rect x="3" y="3.5" width="18" height="7" rx="1.5"/><path d="m15.5 6 1.5 1.5L18.5 6"/><path d="M3 15h18"/><path d="M3 20h18"/>',
  progress: '<rect x="2.5" y="9" width="19" height="6" rx="3"/><path d="M5.5 12h7.5" stroke-width="2.6"/>',
  breadcrumb: '<path d="m3.5 8 4 4-4 4"/><path d="m10.5 8 4 4-4 4"/><path d="M17.5 12h3"/>',
  pagination: '<path d="m7 8-4 4 4 4"/><path d="m17 8 4 4-4 4"/><path d="M9 12h.01"/><path d="M12 12h.01"/><path d="M15 12h.01"/>',
  chart: '<path d="M4 4v16h16"/><path d="M8 16v-5"/><path d="M12 16V8"/><path d="M16 16v-3"/>',
  trendicator: '<circle cx="11" cy="13" r="7"/><path d="M15.5 8.5 20 4"/><path d="M15 4h5v5"/>',
  card: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h7"/><path d="M7 13h10"/><path d="M3 16.5h18"/>',
  combobox: '<rect x="2.5" y="3.5" width="19" height="7" rx="2"/><path d="M6 7h5"/><path d="M5 15h14"/><path d="M5 19.5h9"/><circle cx="17.25" cy="7" r="0.6" fill="currentColor"/>',
  "empty-state": '<path d="M3 13.5 5.5 6a2 2 0 0 1 1.9-1.4h9.2A2 2 0 0 1 18.5 6l2.5 7.5V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 13.5h5l1.5 2.5h5l1.5-2.5h5"/>',
  skeleton: '<rect x="3" y="4" width="5" height="5" rx="2.5"/><path d="M11 5.5h10"/><path d="M11 8h6"/><path d="M3 14h18"/><path d="M3 18h12"/>',
  slider: '<path d="M3 12h18"/><circle cx="9" cy="12" r="3" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="3"/>',
  window: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 8.5h18"/>',
  "panel-right": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
  "code-block": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m9.5 9.5-2.5 2.5 2.5 2.5"/><path d="m14.5 9.5 2.5 2.5-2.5 2.5"/>',
};

registerIconSet("core", { viewBox: "0 0 24 24", style: "stroke", icons: CORE_ICONS });
