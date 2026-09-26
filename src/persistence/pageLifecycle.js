export function saveOnPageExit(window, document, autosave) {
  window.addEventListener('pagehide', () => autosave.saveNow());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') autosave.saveNow();
  });
}
