(() => {
  const editor = document.getElementById('code-editor');
  const gutter = document.querySelector('.line-gutter');
  const numbers = document.getElementById('line-numbers');
  const runButton = document.getElementById('run-program');
  const stopButton = document.getElementById('stop-program');
  const output = document.getElementById('terminal-output');
  const fileInput = document.getElementById('open-program');
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

  function addMessage(message, error = false) {
    const row = document.createElement('div');
    row.className = `result-row result-row--${error ? 'error' : 'success'}`;
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('class', `result-row__icon ${error ? 'error-icon' : 'terminal-icon'}`);
    icon.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', error ? '#icon-error' : '#icon-terminal');
    icon.append(use);
    const divider = document.createElement('span');
    divider.className = 'result-row__divider';
    divider.setAttribute('aria-hidden', 'true');
    const text = document.createElement('p');
    text.textContent = message;
    row.append(icon, divider, text);
    output.append(row);
  }

  function showMessage(message, error = false) {
    if (output.textContent === message) return;
    output.replaceChildren();
    addMessage(message, error);
  }

  function highlightPosition() {
    const activeLine = editor.value.slice(0, editor.selectionStart).split('\n').length;
    numbers.querySelector('.is-active')?.classList.remove('is-active');
    numbers.children[activeLine - 1]?.classList.add('is-active');
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
    setBusy(false);
    errorLines.clear();
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
    const line = document.createElement('p');
    line.className = 'console-line';
    line.textContent = text;
    output.append(line);
  }

  function requestConsoleInput(input, signal) {
    return new Promise((resolve) => {
      if (signal.aborted) { resolve(null); return; }
      inputLabel.textContent = `Leer ${input.name} (${input.type})`;
      inputField.value = '';
      inputForm.hidden = false;
      function finish(value) {
        inputForm.removeEventListener('submit', submit);
        inputField.removeEventListener('keydown', keydown);
        signal.removeEventListener('abort', cancel);
        inputForm.hidden = true;
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
    errorLines.clear();
    editor.removeAttribute('aria-invalid');
    editor.removeAttribute('aria-errormessage');
    output.replaceChildren();
    for (const diagnostic of data.diagnostics) {
      const location = diagnostic.line === null ? ''
        : `, línea ${diagnostic.line}${diagnostic.column === null ? '' : `, columna ${diagnostic.column}`}`;
      addMessage(`${stages[diagnostic.stage]}${location}: ${diagnostic.message}`, diagnostic.severity === 'error');
      if (diagnostic.severity === 'error' && ['lexer', 'parser', 'semantic', 'runtime'].includes(diagnostic.stage)) {
        editor.setAttribute('aria-invalid', 'true');
        editor.setAttribute('aria-errormessage', 'terminal-output');
        if (diagnostic.line !== null) errorLines.add(diagnostic.line);
      }
    }
    for (let index = 0; index <= data.results.length; index += 1) {
      for (const entry of entries) {
        if (entry.after === index) consoleLine(`> ${entry.value}`);
      }
      if (index < data.results.length) consoleLine(data.results[index]);
    }
    if (data.status === 'completed') addMessage('Ejecución finalizada.');
    if (!output.children.length && data.status !== 'waiting_input') {
      showMessage(data.executed ? 'Ejecución finalizada sin salidas.' : 'El programa no se ha ejecutado.');
    }
    updateNumbers();
  }

  async function sendCode() {
    if (pending) return;
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

  editor.addEventListener('input', codeChanged);
  editor.addEventListener('scroll', () => { gutter.scrollTop = editor.scrollTop; });
  editor.addEventListener('click', highlightPosition);
  editor.addEventListener('keyup', highlightPosition);
  editor.addEventListener('select', highlightPosition);
  runButton.addEventListener('click', sendCode);
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
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') {
      event.preventDefault();
      fileInput.click();
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
      if (editor.value && !window.confirm('¿Reemplazar el código actual por el archivo? Los cambios actuales se perderán; Guardar todavía no está habilitado.')) return;
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
