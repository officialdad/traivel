// Markdown rendering with sanitization

function escFallback(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

export function renderMarkdown(text) {
  if (!text) return '';
  if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
    try {
      const raw = marked.parse(text);
      return DOMPurify.sanitize(raw);
    } catch {
      return escFallback(text);
    }
  }
  return escFallback(text);
}
