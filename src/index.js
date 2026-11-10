// Flare UX: every component, defined on import.
//
//   import "@run-time/flare-ux"; // all components and icons
//
// Or import only what a page uses: "@run-time/flare-ux/components/fx-button.js".
// Every module defines its element once, so importing one twice is safe.

export { FxFormControl } from "./components/fx-form-control.js";
export { FxIcon } from "./components/fx-icon.js";
export { FxButton } from "./components/fx-button.js";
export { FxSplitButton } from "./components/fx-split-button.js";
export { FxTextField } from "./components/fx-text-field.js";
export { FxSelect } from "./components/fx-select.js";
export { FxCheckbox } from "./components/fx-checkbox.js";
export { FxRadio } from "./components/fx-radio.js";
export { FxToggle } from "./components/fx-toggle.js";
export { FxSegmentedButton } from "./components/fx-segmented-button.js";
export { FxOption } from "./components/fx-option.js";
export { FxTabs } from "./components/fx-tabs.js";
export { FxDropdownMenu } from "./components/fx-dropdown-menu.js";
export { FxDialog } from "./components/fx-dialog.js";
export { FxPopupAlert, confirmAction, askInputs, alertMessage } from "./components/fx-popup-alert.js";
export { FxDrawer } from "./components/fx-drawer.js";
export { FxNotification } from "./components/fx-notification.js";
export { FxToast, toast } from "./components/fx-toast.js";
export { FxForm } from "./components/fx-form.js";
export { FxAccordion } from "./components/fx-accordion.js";
export { FxBreadcrumb } from "./components/fx-breadcrumb.js";
export { FxPagination } from "./components/fx-pagination.js";
export { FxProgress } from "./components/fx-progress.js";
export { FxTag } from "./components/fx-tag.js";
export { FxTrendicator, trendicatorHtml } from "./components/fx-trendicator.js";
export { FxAvatar, initialsOf } from "./components/fx-avatar.js";
export { FxCard } from "./components/fx-card.js";
export { FxChart } from "./components/fx-chart.js";
export { FxCombobox } from "./components/fx-combobox.js";
export { FxEmptyState } from "./components/fx-empty-state.js";
export { FxFileDrop, formatSize } from "./components/fx-file-drop.js";
export { FxSkeleton } from "./components/fx-skeleton.js";
export { FxSlider } from "./components/fx-slider.js";
export { FxSteps } from "./components/fx-steps.js";
export { FxStatusChip } from "./components/fx-status-chip.js";
export { FxCountBadge } from "./components/fx-count-badge.js";
export { FxSpinner, busySpinnerHtml } from "./components/fx-spinner.js";
export { FxToolTip } from "./components/fx-tool-tip.js";
export { FxSummaryCard } from "./components/fx-summary-card.js";
export { FxDataTable } from "./components/fx-data-table.js";
export { FxCopyBlock } from "./components/fx-copy-block.js";
export { FxNav } from "./components/fx-nav.js";
export { FxAppShell } from "./components/fx-app-shell.js";

export { registerIconSet, iconSvg, iconNames, iconSets, findIcon } from "./icons/registry.js";
export { CORE_ICONS } from "./icons/core.js";
export { TONES, toneOf } from "./lib/tones.js";
export { escapeHtml } from "./lib/escape.js";
