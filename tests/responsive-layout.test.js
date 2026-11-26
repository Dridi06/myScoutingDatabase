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

const messinhoCss = await readFile(new URL('../src/asi/messinho.css', import.meta.url), 'utf8');

test('MESSINHO chat uses a fixed frame with an independently scrolling message list', () => {
  assert.match(messinhoCss, /\.messinho-chat-card\s*\{[^}]*height:clamp\(480px,68vh,680px\)/s);
  assert.match(messinhoCss, /\.messinho-chat-card \.messinho-messages\s*\{[^}]*height:0;[^}]*overflow-y:auto/s);
  assert.match(messinhoCss, /overflow-anchor:none/);
});

test('MESSINHO mobile composer uses at least 16px text to prevent iOS input auto-zoom', () => {
  assert.match(messinhoCss, /@media\(max-width:760px\)[\s\S]*?\.messinho-chat-card \.messinho-composer input\s*\{[^}]*font-size:16px !important/s);
});

test('MESSINHO chat preserves multiline assistant reply formatting', () => {
  assert.match(messinhoCss, /\.messinho-bubble p\s*\{[^}]*white-space:pre-line/s);
});
