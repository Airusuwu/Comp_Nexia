(() => {
  const increaseButton = document.getElementById('increase-text');
  const resetButton = document.getElementById('reset-text');
  const saveButton = document.getElementById('save-program');
  const status = document.getElementById('action-status');
  let readingPercent = 100;

  function updateTextSize() {
    document.documentElement.style.setProperty('--reading-scale', readingPercent / 100);
    increaseButton.setAttribute('aria-disabled', String(readingPercent === 200));
    resetButton.setAttribute('aria-disabled', String(readingPercent === 100));
    increaseButton.title = readingPercent === 200
      ? 'Tamaño máximo alcanzado: 200 %'
      : 'Aumentar código y resultados en 25 %';
    status.textContent = `Código y resultados al ${readingPercent} %.`;
  }

  increaseButton.addEventListener('click', () => {
    if (readingPercent === 200) return;
    readingPercent += 25;
    updateTextSize();
  });

  resetButton.addEventListener('click', () => {
    if (readingPercent === 100) return;
    readingPercent = 100;
    updateTextSize();
  });

  saveButton.addEventListener('click', () => {
    if (saveButton.getAttribute('aria-disabled') === 'true') return;
    const code = Array.from(document.querySelectorAll('.code-lines code'), (line) => {
      const indentation = line.classList.contains('indent-1') ? '  ' : '';
      return indentation + line.textContent;
    }).join('\n');

    if (!code.trim()) {
      status.textContent = 'No hay código para guardar.';
      return;
    }

    let downloadUrl;
    const link = document.createElement('a');

    try {
      const file = new Blob([code], { type: 'text/plain;charset=utf-8' });
      downloadUrl = URL.createObjectURL(file);
      link.href = downloadUrl;
      link.download = 'programa-nexia.txt';
      link.hidden = true;
      document.body.append(link);
      link.click();
      status.textContent = 'Descarga solicitada: programa-nexia.txt. Contiene el ejemplo visible; aún no se puede editar ni abrir archivos en Nexia.';
    } catch {
      status.textContent = 'No se pudo preparar la descarga. El código se conserva en pantalla.';
    } finally {
      link.remove();
      if (downloadUrl) setTimeout(() => URL.revokeObjectURL(downloadUrl), 30000);
    }
  });

  increaseButton.setAttribute('aria-disabled', 'false');
  increaseButton.title = 'Aumentar código y resultados en 25 %';
  if (typeof Blob === 'function' && typeof URL.createObjectURL === 'function') {
    saveButton.setAttribute('aria-disabled', 'false');
    saveButton.title = 'Descargar código visible como archivo .txt';
  }
})();
