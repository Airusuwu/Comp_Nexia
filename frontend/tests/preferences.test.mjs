import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const preferenceKey = 'nexia.preferences.v1';
const editorSource = readFileSync(new URL('../assets/js/editor.js', import.meta.url), 'utf8');

class FakeClassList {
  values = new Set();
  toggle(name, force) {
    const enabled = force ?? !this.values.has(name);
    if (enabled) this.values.add(name);
    else this.values.delete(name);
    return enabled;
  }
  add(name) { this.values.add(name); }
  remove(name) { this.values.delete(name); }
  contains(name) { return this.values.has(name); }
}

class FakeElement {
  attributes = new Map();
  children = [];
  listeners = new Map();
  classList = new FakeClassList();
  style = {
    setProperty: (name, value) => this.styles.set(name, String(value)),
    getProperty: (name) => this.styles.get(name) ?? null
  };
  styles = new Map();
  hidden = false;
  value = '';
  textContent = '';
  scrollTop = 0;
  scrollLeft = 0;
  selectionStart = 0;
  files = [];
  clickCount = 0;
  append(...items) { this.children.push(...items); }
  appendChild(item) { this.append(item); return item; }
  removeChild(item) { this.children = this.children.filter((child) => child !== item); }
  replaceChildren(...items) {
    this.children = items.flatMap((item) => item.isFragment ? item.children : [item]);
  }
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  querySelector() { return null; }
  focus() { this.focused = true; }
  click() { this.clickCount += 1; }
  setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; }
  scrollIntoView() {}
  getBoundingClientRect() { return { width: 500 }; }
}

function createStorage(initialValue = null) {
  const values = new Map();
  if (initialValue !== null) values.set(preferenceKey, initialValue);
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
    getValue(key) { return values.get(key); }
  };
}

function bootEditor(storage, { storageUnavailable = false } = {}) {
  const ids = new Map([
    'code-editor', 'line-numbers', 'run-program', 'stop-program', 'terminal-output',
    'terminal-panel', 'minimize-terminal', 'open-program', 'open-program-button', 'save-program',
    'decrease-text', 'increase-text', 'zoom-notice', 'contrast-toggle', 'error-counter', 'terminal-input',
    'terminal-value', 'terminal-input-label'
  ].map((id) => [id, new FakeElement()]));
  const selectors = new Map([
    ['.line-gutter', new FakeElement()],
    ['.main-stage', new FakeElement()],
    ['.workspace', new FakeElement()],
    ['.block-cursor', new FakeElement()],
    ['.line-highlight', new FakeElement()]
  ]);
  const editor = ids.get('code-editor');
  editor.value = 'Inicio\nFin';
  ids.get('terminal-input').hidden = true;
  ids.get('zoom-notice').hidden = true;
  const root = new FakeElement();
  const body = new FakeElement();
  const document = {
    documentElement: root,
    body,
    getElementById(id) { return ids.get(id) ?? null; },
    querySelector(selector) { return selectors.get(selector) ?? null; },
    createElement() { return new FakeElement(); },
    createElementNS() { return new FakeElement(); },
    createDocumentFragment() {
      const fragment = new FakeElement();
      fragment.isFragment = true;
      return fragment;
    }
  };
  const window = {
    addEventListener() {},
    get localStorage() {
      if (storageUnavailable) throw new Error('Storage disabled');
      return storage;
    },
    confirm() { return true; },
    setTimeout() { return 1; },
    clearTimeout() {}
  };
  const context = {
    document,
    window,
    TextDecoder,
    getComputedStyle() {
      return { font: '16px monospace', lineHeight: '24px', paddingTop: '8px', paddingLeft: '12px' };
    },
    cancelAnimationFrame() {}
  };

  runInNewContext(editorSource, context, { filename: 'frontend/assets/js/editor.js' });
  return {
    ids,
    root,
    selectors,
    click: async (id) => {
      const element = ids.get(id);
      const listener = element.listeners.get('click')?.[0];
      assert.ok(listener, `expected a click handler for ${id}`);
      await listener({ preventDefault() {} });
    },
    change: async (id) => {
      const element = ids.get(id);
      const listener = element.listeners.get('change')?.[0];
      assert.ok(listener, `expected a change handler for ${id}`);
      await listener({});
    }
  };
}

function assertRestored(view, { highContrast, readingScale, terminalVisible }) {
  assert.equal(view.root.getAttribute('data-contrast'), highContrast ? 'high' : null);
  assert.equal(view.ids.get('contrast-toggle').getAttribute('aria-pressed'), String(highContrast));
  assert.equal(view.root.style.getProperty('--reading-scale'), String(readingScale));
  assert.equal(view.ids.get('terminal-panel').hidden, !terminalVisible);
  assert.equal(view.ids.get('minimize-terminal').getAttribute('aria-expanded'), String(terminalVisible));
  assert.equal(view.selectors.get('.main-stage').classList.contains('main-stage--terminal-hidden'), !terminalVisible);
  assert.equal(view.selectors.get('.workspace').classList.contains('workspace--terminal-hidden'), !terminalVisible);
}

test('starts with the default theme, text size, and minimized terminal', () => {
  const view = bootEditor(createStorage());
  assertRestored(view, { highContrast: false, readingScale: 1, terminalVisible: false });
});

test('restores the same visible editor state after twelve reloads', async () => {
  const storage = createStorage();
  const first = bootEditor(storage);
  await first.click('increase-text');
  await first.click('increase-text');
  await first.click('increase-text');
  await first.click('contrast-toggle');
  first.ids.get('code-editor').value = '';
  await first.click('run-program');

  const expected = { highContrast: true, readingScale: 1.75, terminalVisible: true };
  const savedValue = storage.getValue(preferenceKey);
  assertRestored(first, expected);

  for (let reload = 0; reload < 12; reload += 1) {
    const view = bootEditor(storage);
    assertRestored(view, expected);
    assert.equal(storage.getValue(preferenceKey), savedValue, 'a reload must not mutate saved preferences');
  }
});

test('does not resurrect the terminal after twelve reloads while minimized', async () => {
  const storage = createStorage();
  const first = bootEditor(storage);
  first.ids.get('code-editor').value = '';
  await first.click('run-program');
  await first.click('minimize-terminal');

  const expected = { highContrast: false, readingScale: 1, terminalVisible: false };
  for (let reload = 0; reload < 12; reload += 1) {
    assertRestored(bootEditor(storage), expected);
  }
});

test('ignores malformed or out-of-range saved preferences', () => {
  const storage = createStorage('{"highContrast":"yes","readingPercent":135,"terminalMinimized":null}');
  assertRestored(bootEditor(storage), { highContrast: false, readingScale: 1, terminalVisible: false });
  assertRestored(bootEditor(createStorage('{not-json')), { highContrast: false, readingScale: 1, terminalVisible: false });
});

test('still initializes and toggles the interface when storage is unavailable', async () => {
  const view = bootEditor(null, { storageUnavailable: true });
  assertRestored(view, { highContrast: false, readingScale: 1, terminalVisible: false });
  await view.click('contrast-toggle');
  assertRestored(view, { highContrast: true, readingScale: 1, terminalVisible: false });
});

test('opens the file picker from the visible open button and loads a saved text file', async () => {
  const view = bootEditor(createStorage());
  const openButton = view.ids.get('open-program-button');
  assert.equal(openButton.getAttribute('aria-disabled'), 'false');

  await view.click('open-program-button');
  assert.equal(view.ids.get('open-program').clickCount, 1);

  const contents = 'Inicio\nEscribir "Hola"\nFin';
  const bytes = new TextEncoder().encode(contents);
  view.ids.get('open-program').files = [{
    name: 'saludo.txt',
    size: bytes.length,
    arrayBuffer: async () => bytes.buffer
  }];
  await view.change('open-program');

  assert.equal(view.ids.get('code-editor').value, contents);
  assert.equal(view.ids.get('open-program').value, '');
  assert.equal(view.ids.get('terminal-output').children.at(-1).children[0].textContent,
    'Archivo abierto: saludo.txt. No se ha analizado ni ejecutado. Control + Enter envía el código.');
});

test('does not open the file picker from a keyboard shortcut', () => {
  const view = bootEditor(createStorage());
  let prevented = false;
  const keydown = view.ids.get('code-editor').listeners.get('keydown')[0];

  keydown({
    isComposing: false,
    ctrlKey: true,
    metaKey: false,
    key: 'o',
    preventDefault() { prevented = true; }
  });

  assert.equal(prevented, false);
  assert.equal(view.ids.get('open-program').clickCount, 0);
});

test('keeps the current code when the selected file is not a supported text file', async () => {
  const view = bootEditor(createStorage());
  const original = view.ids.get('code-editor').value;
  view.ids.get('open-program').files = [{ name: 'programa.js', size: 8 }];

  await view.change('open-program');

  assert.equal(view.ids.get('code-editor').value, original);
  assert.equal(view.ids.get('terminal-output').children.at(-1).children[1].textContent,
    'Selecciona un archivo .txt en UTF-8 de hasta 64 KiB. No se modificó el editor.');
});
