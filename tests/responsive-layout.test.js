import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8');

test('workspace disables smooth scroll that can cause unexpected page movement', () => {
  assert.match(css, /scroll-behavior:auto\s*!important/);
  assert.match(css, /scrollbar-gutter:stable/);
});

test('interactive controls and dashboard tiles do not translate on hover or click', () => {
  assert.match(css, /button,\s*button:hover,\s*button:focus-visible,\s*button:active\s*\{\s*transform:none\s*!important/s);
  assert.match(css, /\.dashboard-metric-link,\s*\.dashboard-foot-card,\s*\.dashboard-action-primary,\s*\.dashboard-position-chip\s*\{\s*transform:none\s*!important/s);
});

test('dashboard cards and position groups have mobile-first responsive layouts', () => {
  assert.match(css, /\.dashboard-overview-two\s*\{[^}]*grid-template-columns:repeat\(auto-fit,minmax\(min\(100%,220px\),1fr\)\)/s);
  assert.match(css, /\.dashboard-foot-grid\s*\{\s*grid-template-columns:1fr/s);
  assert.match(css, /\.dashboard-position-groups\s*\{\s*grid-template-columns:1fr/s);
});

test('mobile layouts respect narrow screens and safe-area insets', () => {
  assert.match(css, /@media\s*\(max-width:520px\)/);
  assert.match(css, /env\(safe-area-inset-left\)/);
  assert.match(css, /@media\s*\(max-width:380px\)/);
});

test('main workspace header remains available while scrolling', () => {
  assert.match(css, /\.shell main>header\s*\{\s*position:sticky/);
});
