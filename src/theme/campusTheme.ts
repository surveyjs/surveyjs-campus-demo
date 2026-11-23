import { Model, SvgRegistry } from 'survey-core';
import type { SurveyCreator } from 'survey-creator-react';
import { FEATHER_ICONS } from '../ui/featherIcons';

// Form Library colors come from the shadcn adapter stylesheet. This module only
// switches the host tokens and paints Survey Creator with the same variables.

SvgRegistry.registerIcon(
  'campus-feather-settings',
  `<svg viewBox="0 0 24 24"><g fill="none" stroke="var(--sd-action-icon-color, currentColor)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${FEATHER_ICONS.settings}</g></svg>`,
);

const DEMO_DISPLAY_KEY = 'campus-display-v1';
export const demoDisplay: { mode: 'light' | 'dark'; outlines: boolean } = { mode: 'light', outlines: true };
try {
  const saved = JSON.parse(localStorage.getItem(DEMO_DISPLAY_KEY) ?? 'null');
  if (saved) demoDisplay.mode = saved.mode === 'dark' ? 'dark' : 'light';
} catch {
  // Storage may be unavailable; keep the defaults.
}

export function saveDemoDisplay(): void {
  try {
    localStorage.setItem(DEMO_DISPLAY_KEY, JSON.stringify({ mode: demoDisplay.mode }));
  } catch {
    // Storage may be unavailable; the choice lasts for this page view.
  }
}

export function applyClinicDisplay(): void {
  const root = document.documentElement;
  root.dataset.theme = demoDisplay.mode;
  root.classList.toggle('dark', demoDisplay.mode === 'dark');
  root.dataset.surveyOutlines = String(demoDisplay.outlines);
}

let activeCreator: SurveyCreator | null = null;

function getClinicCreatorTheme() {
  return {
    themeName: 'default',
    colorPalette: demoDisplay.mode,
    cssVariables: {
      '--sjs2-color-project-brand-600': 'var(--primary)',
      '--sjs2-color-bg-brand-primary-dim': 'var(--campus-primary-hover)',
      '--sjs2-color-bg-brand-secondary': 'var(--accent)',
      '--sjs2-color-fg-brand-on-primary': 'var(--primary-foreground)',
      '--sjs2-color-fg-basic-primary': 'var(--foreground)',
      '--sjs2-color-fg-basic-secondary': 'var(--muted-foreground)',
      '--sjs2-color-border-basic-secondary': 'var(--border)',
      '--sjs2-color-bg-basic-primary': 'var(--card)',
      '--sjs2-color-bg-basic-secondary': 'var(--background)',
      '--sjs2-color-bg-basic-primary-dim': 'var(--accent)',
      '--sjs2-color-bg-basic-secondary-dim': 'var(--campus-card-subtle)',
      '--sjs2-color-component-panel-default-bg': 'var(--card)',
      '--sjs2-color-utility-body': 'var(--background)',
      '--sjs2-color-utility-sheet': 'var(--card)',
      '--sjs2-color-utility-toolbox': 'var(--card)',
      '--sjs2-color-utility-property-grid': 'var(--card)',
      '--sjs2-color-utility-tabs': 'var(--card)',
      '--sjs2-color-utility-surface-survey': 'var(--card)',
      '--sjs2-color-utility-surface-designer': 'var(--background)',
      '--sjs2-color-utility-surface-json-editor': 'var(--card)',
      '--sjs2-color-utility-surface-logic': 'var(--background)',
      '--sjs2-color-utility-surface-translations': 'var(--background)',
      '--sjs2-color-utility-surface-presets-manager': 'var(--background)',
    },
  };
}

export function applyClinicCreatorTheme(editor: SurveyCreator | null): void {
  if (!editor) return;
  const preview = (editor.getPlugin('preview') as { model?: { survey?: Model } } | undefined)?.model?.survey;
  const previewState = preview ? { data: structuredClone(preview.data), page: preview.currentPageNo } : null;
  editor.preferredColorPalette = demoDisplay.mode;
  editor.applyCreatorTheme(getClinicCreatorTheme() as never);
  const updatedPreview = (editor.getPlugin('preview') as { model?: { survey?: Model } } | undefined)?.model?.survey;
  if (previewState && updatedPreview) {
    updatedPreview.data = previewState.data;
    updatedPreview.currentPageNo = previewState.page;
  }
}

export function setActiveCreator(editor: SurveyCreator | null): void {
  activeCreator = editor;
}

/** Re-themes the open Creator after a display mode change. Forms follow the CSS tokens. */
export function reapplyClinicThemes(): void {
  applyClinicCreatorTheme(activeCreator);
}

applyClinicDisplay();
