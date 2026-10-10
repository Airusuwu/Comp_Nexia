(() => {
  const editor = document.getElementById('code-editor');
  const gutter = document.querySelector('.line-gutter');
  const numbers = document.getElementById('line-numbers');
  const runButton = document.getElementById('run-program');
  const stopButton = document.getElementById('stop-program');
  const output = document.getElementById('terminal-output');
  const listenResultButton = document.getElementById('listen-result');
  const listenResultLabel = document.getElementById('listen-result-label');
  const speechSynthesis = window.speechSynthesis;
  const SpeechUtterance = window.SpeechSynthesisUtterance;
  const speechSupported = typeof speechSynthesis?.speak === 'function'
    && typeof SpeechUtterance === 'function';
  let latestResultText = '';
  let activeUtterance = null;
  const terminal = document.getElementById('terminal-panel');
  const terminalToggle = document.getElementById('minimize-terminal');
  const mainStage = document.querySelector('.main-stage');
  const workspace = document.querySelector('.workspace');
  const fileInput = document.getElementById('open-program');
  const openButton = document.getElementById('open-program-button');
  const saveButton = document.getElementById('save-program');
  const decreaseButton = document.getElementById('decrease-text');
  const increaseButton = document.getElementById('increase-text');
  const zoomNotice = document.getElementById('zoom-notice');
  let zoomNoticeTimer = null;
  const contrastToggle = document.getElementById('contrast-toggle');
  const preferenceKey = 'nexia.preferences.v1';
  const validReadingPercents = [100, 125, 150, 175, 200];
  let preferenceStorage = null;
  try {
    preferenceStorage = window.localStorage;
  } catch {
    // La aplicación puede iniciar con valores predeterminados si el almacenamiento no está disponible.
  }
  function loadPreferences(storage) {
    try {
      const value = JSON.parse(storage?.getItem(preferenceKey) ?? '{}');
      const stored = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
      return {
        highContrast: stored.highContrast === true,
        readingPercent: validReadingPercents.includes(stored.readingPercent) ? stored.readingPercent : 100,
        terminalMinimized: typeof stored.terminalMinimized === 'boolean' ? stored.terminalMinimized : true
      };
    } catch {
      return { highContrast: false, readingPercent: 100, terminalMinimized: true };
    }
  }
  function savePreferences(storage, current, update) {
    const next = { ...current, ...update };
    try {
      storage?.setItem(preferenceKey, JSON.stringify(next));
    } catch {
      // Las preferencias siguen vigentes en memoria aunque no puedan persistirse.
    }
    return next;
  }
  let preferences = loadPreferences(preferenceStorage);
  let readingPercent = preferences.readingPercent;
  const blockCursor = document.querySelector('.block-cursor');
  const lineHighlight = document.querySelector('.line-highlight');
  let charWidth = 0;
  let overlayMetricsFrame = 0;
  const errorCounter = document.getElementById('error-counter');
  const inputForm = document.getElementById('terminal-input');
  const inputField = document.getElementById('terminal-value');
  const inputLabel = document.getElementById('terminal-input-label');
  const maxCodeBytes = 64 * 1024;
  const stages = {
    request: 'Solicitud', service: 'Servicio', lexer: 'Léxico',
    parser: 'Sintáctico', semantic: 'Semántico', runtime: 'Ejecución'
  };
  let revision = 0;
  let pending = null;
  const errorLines = new Set();

  function updateListenResultButton(active) {
    const label = active ? 'Detener lectura' : 'Escuchar resultado';
    listenResultLabel.textContent = label;
    listenResultButton.setAttribute('aria-label', active ? 'Detener lectura del resultado' : label);
    listenResultButton.title = active ? 'Detener lectura del resultado' : 'Escuchar resultado';
  }

  function stopResultSpeech() {
    if (!activeUtterance) return;
    activeUtterance = null;
    try {
      speechSynthesis.cancel();
    } finally {
      updateListenResultButton(false);
    }
  }

  listenResultButton.setAttribute('aria-disabled', String(!speechSupported));
  listenResultButton.disabled = !speechSupported;
  listenResultButton.title = speechSupported
    ? 'Escuchar resultado'
    : 'La lectura por voz no está disponible en este navegador';
  listenResultButton.addEventListener('click', () => {
    if (!speechSupported) return;
    if (activeUtterance) {
      stopResultSpeech();
      return;
    }

    const utterance = new SpeechUtterance(latestResultText || 'Aún no hay resultados para escuchar.');
    utterance.lang = document.documentElement.lang || 'es-MX';
    utterance.rate = 0.9;
    let spanishVoice;
    try {
      spanishVoice = speechSynthesis.getVoices?.().find((voice) => /^es(?:-|_)/i.test(voice.lang));
    } catch {
      // Si no se puede consultar la lista, el navegador usará su voz predeterminada.
    }
    if (spanishVoice) utterance.voice = spanishVoice;
    const finish = () => {
      if (activeUtterance !== utterance) return;
      activeUtterance = null;
      updateListenResultButton(false);
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    activeUtterance = utterance;
    updateListenResultButton(true);
    try {
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    } catch {
      activeUtterance = null;
      updateListenResultButton(false);
      listenResultButton.title = 'No se pudo iniciar la lectura por voz';
    }
  });

  const preferenceElements = {
    root: document.documentElement,
    contrastToggle,
    terminal,
    mainStage,
    workspace,
    terminalToggle
  };

  function persistPreferences(update) {
    preferences = savePreferences(preferenceStorage, preferences, update);
  }

  function applyContrast(root, toggle, enabled) {
    if (enabled) root.setAttribute('data-contrast', 'high');
    else root.removeAttribute('data-contrast');
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.textContent = `Alto contraste: ${enabled ? 'activado' : 'desactivado'}`;
  }

  function setTerminalVisibility(elements, visible) {
    elements.terminal.hidden = !visible;
    elements.mainStage.classList.toggle('main-stage--terminal-hidden', !visible);
    elements.workspace.classList.toggle('workspace--terminal-hidden', !visible);
    elements.terminalToggle.setAttribute('aria-expanded', String(visible));
  }

  function updateZoomControls() {
    const atMinimum = readingPercent === validReadingPercents[0];
    const atMaximum = readingPercent === validReadingPercents[validReadingPercents.length - 1];
    decreaseButton.setAttribute('aria-disabled', String(atMinimum));
    increaseButton.setAttribute('aria-disabled', String(atMaximum));
    decreaseButton.title = atMinimum ? 'Tamaño mínimo: 100 %' : 'Reducir el texto en 25 %';
    increaseButton.title = atMaximum ? 'Tamaño máximo: 200 %' : 'Aumentar el texto en 25 %';
  }

  function showZoomNotice(message) {
    zoomNotice.textContent = message;
    zoomNotice.hidden = false;
    if (zoomNoticeTimer !== null) window.clearTimeout(zoomNoticeTimer);
    zoomNotice.classList.remove('zoom-notice--leaving');
    zoomNoticeTimer = window.setTimeout(() => {
      zoomNotice.classList.add('zoom-notice--leaving');
      zoomNoticeTimer = window.setTimeout(() => {
        zoomNotice.hidden = true;
        zoomNotice.classList.remove('zoom-notice--leaving');
        zoomNotice.textContent = '';
        zoomNoticeTimer = null;
      }, 300);
    }, 2700);
  }

  function applyPreferences(saved, elements) {
    applyContrast(elements.root, elements.contrastToggle, saved.highContrast);
    elements.root.style.setProperty('--reading-scale', saved.readingPercent / 100);
    updateZoomControls();
    setTerminalVisibility(elements, !saved.terminalMinimized);
  }

  applyPreferences(preferences, preferenceElements);

  function revealTerminal() {
    if (terminal.hidden) {
      setTerminalVisibility(preferenceElements, true);
      persistPreferences({ terminalMinimized: false });
    }
  }

  terminalToggle.addEventListener('click', () => {
    if (!inputForm.hidden) return;
    setTerminalVisibility(preferenceElements, false);
    persistPreferences({ terminalMinimized: true });
    runButton.focus();
  });

  contrastToggle.addEventListener('click', () => {
    const enabled = contrastToggle.getAttribute('aria-pressed') !== 'true';
    applyContrast(document.documentElement, contrastToggle, enabled);
    persistPreferences({ highContrast: enabled });
  });

  function addMessage(message, error = false) {
  if (error) {
    const row = document.createElement('div');
    row.className = 'result-row result-row--error';
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', 'result-row__icon error-icon');
    icon.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#icon-error');
    icon.append(use);
    const text = document.createElement('p');
    text.textContent = message;
    row.append(icon, text);
    output.append(row);
    return;
  }
  let block = output.querySelector('.result-row--success');
  if (!block) {
    block = document.createElement('div');
    block.className = 'result-row result-row--success';
    output.append(block);
  }
  const text = document.createElement('p');
    text.textContent = message;
    block.append(text);
  }

  function showMessage(message, error = false) {
    if (output.textContent === message) return;
    output.replaceChildren();
    addMessage(message, error);
  }
  function updateErrorCounter(count) {
    if (count > 0) {
      errorCounter.textContent = count === 1 ? '1 error' : `${count} errores`;
      errorCounter.hidden = false;
    } else {
      errorCounter.textContent = '';
      errorCounter.hidden = true;
    }
  }

  function measureCharWidth() {
  const test = document.createElement('span');
  test.style.font = getComputedStyle(editor).font;
  test.style.position = 'absolute';
  test.style.visibility = 'hidden';
  test.style.whiteSpace = 'pre';
  test.textContent = 'X'.repeat(50);
  document.body.appendChild(test);
  const width = test.getBoundingClientRect().width / 50;
  document.body.removeChild(test);
  return width;
  }

  function updateOverlays() {
  if (!charWidth) charWidth = measureCharWidth();

  const textBefore = editor.value.slice(0, editor.selectionStart);
  const lines = textBefore.split('\n');
  const lineIndex = lines.length - 1;
  const column = lines[lineIndex].length;

  const style = getComputedStyle(editor);
  const lineHeight = parseFloat(style.lineHeight);
  const paddingTop = parseFloat(style.paddingTop);
  const paddingLeft = parseFloat(style.paddingLeft);

  const x = paddingLeft + column * charWidth - editor.scrollLeft;
  const y = paddingTop + lineIndex * lineHeight - editor.scrollTop;

  blockCursor.style.transform = `translate(${x}px, ${y}px)`;
  blockCursor.style.width = `${charWidth}px`;
  blockCursor.style.height = `${lineHeight}px`;

  lineHighlight.style.transform = `translateY(${y}px)`;
  lineHighlight.style.height = `${lineHeight}px`;
  }

  function refreshOverlayMetrics() {
    if (overlayMetricsFrame) cancelAnimationFrame(overlayMetricsFrame);
    overlayMetricsFrame = requestAnimationFrame(() => {
      overlayMetricsFrame = 0;
      charWidth = 0;
      updateOverlays();
    });
  }

  window.addEventListener('resize', refreshOverlayMetrics, { passive: true });
  if (document.fonts) {
    document.fonts.ready.then(refreshOverlayMetrics);
    document.fonts.addEventListener?.('loadingdone', refreshOverlayMetrics);
  }

  function highlightPosition() {
  const activeLine = editor.value.slice(0, editor.selectionStart).split('\n').length;
  numbers.querySelector('.is-active')?.classList.remove('is-active');
  numbers.children[activeLine - 1]?.classList.add('is-active');
  updateOverlays();
  }

  function updateNumbers() {
    const count = editor.value.split('\n').length;
    if (numbers.children.length !== count) {
      const fragment = document.createDocumentFragment();
      for (let lineNumber = 1; lineNumber <= count; lineNumber += 1) {
        const item = document.createElement('li');
        item.textContent = lineNumber;
        fragment.append(item);
      }
      numbers.replaceChildren(fragment);
    }
    Array.from(numbers.children).forEach((item, index) => {
      item.classList.toggle('is-error', errorLines.has(index + 1));
    });
    gutter.scrollTop = editor.scrollTop;
    highlightPosition();
  }

  function setBusy(busy) {
    runButton.setAttribute('aria-disabled', String(busy));
    runButton.title = busy ? 'Ejecutando código' : 'Analizar y ejecutar código';
    stopButton.setAttribute('aria-disabled', String(!busy));
    stopButton.title = busy ? 'Detener ejecución' : 'No hay ejecución activa';
  }

  function codeChanged() {
    revision += 1;
    pending?.abort();
    pending = null;
    latestResultText = '';
    stopResultSpeech();
    setBusy(false);
    errorLines.clear();
    updateErrorCounter(0);
    editor.removeAttribute('aria-invalid');
    editor.removeAttribute('aria-errormessage');
    updateNumbers();
    showMessage('Código modificado. Ejecutar o Control + Enter analiza y ejecuta el programa.');
  }

  function validResponse(data) {
    const positionsValid = (value) => value === null || (Number.isInteger(value) && value > 0);
    return data && ['unavailable', 'invalid_request', 'error', 'analyzed', 'completed', 'partial', 'lexical_error', 'syntactic_error', 'semantic_error', 'runtime_error', 'waiting_input', 'stopped'].includes(data.status)
      && typeof data.executed === 'boolean'
      && Array.isArray(data.results) && data.results.every((result) => typeof result === 'string')
      && (data.executed || data.results.length === 0)
      && Array.isArray(data.diagnostics) && data.diagnostics.every((diagnostic) => diagnostic
        && typeof diagnostic.message === 'string' && typeof diagnostic.code === 'string'
        && Object.hasOwn(stages, diagnostic.stage)
        && ['info', 'error'].includes(diagnostic.severity)
        && positionsValid(diagnostic.line) && positionsValid(diagnostic.column));
  }

  function consoleLine(text) {
    let block = output.querySelector('.result-row--success');
    if (!block) {
      block = document.createElement('div');
      block.className = 'result-row result-row--success';
      output.append(block);
    }
    const line = document.createElement('p');
    line.textContent = text;
    block.append(line);
  }

  function requestConsoleInput(input, signal) {
    return new Promise((resolve) => {
      if (signal.aborted) { resolve(null); return; }
      inputLabel.textContent = `Leer ${input.name} (${input.type})`;
      inputField.value = '';
      inputForm.hidden = false;
      terminalToggle.disabled = true;
      terminalToggle.title = 'Completa o cancela la entrada antes de minimizar la terminal';
      function finish(value) {
        inputForm.removeEventListener('submit', submit);
        inputField.removeEventListener('keydown', keydown);
        signal.removeEventListener('abort', cancel);
        inputForm.hidden = true;
        terminalToggle.disabled = false;
        terminalToggle.title = 'Minimizar terminal';
        inputField.value = '';
        resolve(value);
      }
      function submit(event) {
        event.preventDefault();
        if (inputField.value.length > maxCodeBytes) return;
        finish(inputField.value);
        editor.focus({ preventScroll: true });
      }
      function cancel() { finish(null); }
      function keydown(event) {
        if (event.isComposing) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          stopButton.click();
          stopButton.focus();
        }
        if (event.key === 'Enter' && event.repeat) event.preventDefault();
      }
      inputForm.addEventListener('submit', submit);
      inputField.addEventListener('keydown', keydown);
      signal.addEventListener('abort', cancel, { once: true });
      inputField.focus();
      inputForm.scrollIntoView({ block: 'nearest' });
    });
  }

  function displayResponse(data, entries) {
    stopResultSpeech();
    const spokenParts = [];
    errorLines.clear();
    editor.removeAttribute('aria-invalid');
    editor.removeAttribute('aria-errormessage');
    output.replaceChildren();
      let errorCount = 0;
    for (const diagnostic of data.diagnostics) {
      const location = diagnostic.line === null ? ''
        : `, línea ${diagnostic.line}${diagnostic.column === null ? '' : `, columna ${diagnostic.column}`}`;
      const diagnosticText = `${stages[diagnostic.stage]}${location}: ${diagnostic.message}`;
      addMessage(diagnosticText, diagnostic.severity === 'error');
      spokenParts.push(diagnosticText);
      if (diagnostic.severity === 'error' && ['lexer', 'parser', 'semantic', 'runtime'].includes(diagnostic.stage)) {
        editor.setAttribute('aria-invalid', 'true');
        editor.setAttribute('aria-errormessage', 'terminal-output');
        if (diagnostic.line !== null) errorLines.add(diagnostic.line);
        errorCount += 1;
      }
    }
    updateErrorCounter(errorCount);
    for (let index = 0; index <= data.results.length; index += 1) {
      for (const entry of entries) {
        if (entry.after === index) {
          consoleLine(`> ${entry.value}`);
          spokenParts.push(`Dato ingresado: ${entry.value}`);
        }
      }
      if (index < data.results.length) {
        consoleLine(data.results[index]);
        spokenParts.push(data.results[index]);
      }
    }
    if (data.status === 'completed') {
      addMessage('Ejecución finalizada.');
      spokenParts.push('Ejecución finalizada.');
    }
    if (!output.children.length && data.status !== 'waiting_input') {
      const summary = data.executed ? 'Ejecución finalizada sin salidas.' : 'El programa no se ha ejecutado.';
      showMessage(summary);
      spokenParts.push(summary);
    }
    latestResultText = spokenParts.join('. ');
    updateNumbers();
  }

  async function sendCode() {
    if (pending) return;
    latestResultText = '';
    stopResultSpeech();
    revealTerminal();
    const code = editor.value;
    if (!code.trim()) {
      showMessage('El editor está vacío. Escribe código antes de enviarlo.', true);
      editor.focus();
      return;
    }
    if (new TextEncoder().encode(code).length > maxCodeBytes) {
      showMessage('El código supera el límite de 64 KiB en UTF-8. Reduce su tamaño para enviarlo; no se ha borrado nada.', true);
      return;
    }
    if (!['http:', 'https:'].includes(location.protocol)) {
      showMessage('Abre http://127.0.0.1:3000 después de iniciar el backend para enviar código. Tu contenido permanece en el editor.', true);
      return;
    }
    const controller = new AbortController();
    pending = controller;
    const submittedRevision = revision;
    let timedOut = false;
    let timeout;
    const inputs = [];
    const entries = [];
    setBusy(true);
    showMessage('Analizando y ejecutando el programa…');

    try {
      while (true) {
        timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 8000);
        const response = await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, inputs }),
          signal: controller.signal
        });
        const data = await response.json();
        clearTimeout(timeout);
        if (revision !== submittedRevision || pending !== controller) return;
        if (!validResponse(data) || (!response.ok && !data.diagnostics.length)) {
          throw new Error('Invalid response');
        }
        displayResponse(data, entries);
        if (data.status !== 'waiting_input') break;
        if (!data.input || data.input.index !== inputs.length || typeof data.input.name !== 'string'
          || !['ENTERO', 'REAL', 'TEXTO', 'CARACTER', 'BOOLEANO'].includes(data.input.type)) throw new Error('Invalid input request');
        const value = await requestConsoleInput(data.input, controller.signal);
        if (revision !== submittedRevision || pending !== controller || value === null) return;
        if (value.length > 65536) {
          addMessage('Entrada demasiado larga. Ejecución detenida; el código se conserva.', true);
          break;
        }
        inputs.push(value);
        entries.push({ after: data.results.length, value });
        consoleLine(`> ${value}`);
      }
    } catch {
      if (revision !== submittedRevision || pending !== controller) return;
      addMessage(timedOut
        ? 'El servidor no respondió en 8 segundos. Puedes volver a enviar; el código se conserva.'
        : 'No se pudo obtener una respuesta válida del backend. Comprueba el servidor local y vuelve a enviar; el código se conserva.', true);
    } finally {
      clearTimeout(timeout);
      if (pending === controller) {
        pending = null;
        setBusy(false);
      }
    }
  }

  saveButton.addEventListener('click', () => {
    let downloadUrl;
    const link = document.createElement('a');
    try {
      downloadUrl = URL.createObjectURL(new Blob([editor.value], { type: 'text/plain;charset=utf-8' }));
      link.href = downloadUrl;
      link.download = 'programa-nexia.txt';
      link.hidden = true;
      document.body.append(link);
      link.click();
    } catch {
      addMessage('No se pudo preparar la descarga. El código se conserva.', true);
    } finally {
      link.remove();
      if (downloadUrl) setTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);
    }
  });
  function setReadingPercent(nextPercent) {
    if (!validReadingPercents.includes(nextPercent)) {
      showZoomNotice(readingPercent === validReadingPercents[0]
        ? 'Tamaño mínimo: 100 %.'
        : 'Tamaño máximo: 200 %.');
      return;
    }
    readingPercent = nextPercent;
    document.documentElement.style.setProperty('--reading-scale', readingPercent / 100);
    updateZoomControls();
    persistPreferences({ readingPercent });
    charWidth = 0;
    updateNumbers();
    const limit = readingPercent === validReadingPercents[0]
      ? ' Tamaño mínimo.'
      : readingPercent === validReadingPercents[validReadingPercents.length - 1]
        ? ' Tamaño máximo.'
        : '';
    showZoomNotice(`Tamaño del texto: ${readingPercent} %.${limit}`);
  }
  decreaseButton.addEventListener('click', () => setReadingPercent(readingPercent - 25));
  increaseButton.addEventListener('click', () => setReadingPercent(readingPercent + 25));
  saveButton.setAttribute('aria-disabled', 'false');
  openButton.setAttribute('aria-disabled', 'false');

  editor.addEventListener('input', codeChanged);
  editor.addEventListener('scroll', () => {
  gutter.scrollTop = editor.scrollTop;
  updateOverlays();
  });  
  editor.addEventListener('click', highlightPosition);
  editor.addEventListener('keyup', highlightPosition);
  editor.addEventListener('select', highlightPosition);
  runButton.addEventListener('click', sendCode);
  openButton.addEventListener('click', () => fileInput.click());
  stopButton.addEventListener('click', () => {
    if (!pending) return;
    pending.abort();
    pending = null;
    setBusy(false);
    addMessage('Ejecución detenida. El código se conserva.');
  });
  editor.addEventListener('keydown', (event) => {
    if (event.isComposing) return;
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      sendCode();
    }
  });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    const originalRevision = revision;
    try {
      if (!file.name.toLowerCase().endsWith('.txt') || file.size > maxCodeBytes) {
        showMessage('Selecciona un archivo .txt en UTF-8 de hasta 64 KiB. No se modificó el editor.', true);
        return;
      }
      const contents = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      if (revision !== originalRevision) {
        showMessage('El código cambió mientras se leía el archivo. Vuelve a abrirlo si deseas reemplazarlo.', true);
        return;
      }
      if (editor.value && !window.confirm('¿Reemplazar el código actual por el archivo? Guarda primero los cambios que quieras conservar.')) return;
      editor.value = contents;
      codeChanged();
      editor.setSelectionRange(0, 0);
      editor.scrollTop = 0;
      editor.scrollLeft = 0;
      updateNumbers();
      showMessage(`Archivo abierto: ${file.name}. No se ha analizado ni ejecutado. Control + Enter envía el código.`);
    } catch {
      showMessage('No se pudo abrir el archivo como texto UTF-8. El código anterior se conserva.', true);
    } finally {
      editor.focus();
    }
  });

  updateNumbers();
  setBusy(false);
})();
