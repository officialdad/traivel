const LABELS = {
  ai_recommended: 'AI',
  finalized: 'Final',
  modified: 'Modified',
};

const ICONS = {
  ai_recommended: '<i class="fa-solid fa-robot"></i>',
  finalized: '<i class="fa-solid fa-circle-check"></i>',
  modified: '<i class="fa-solid fa-pen"></i>',
};

export function renderStatusBadge(status) {
  const span = document.createElement('span');
  span.className = 'badge';
  span.setAttribute('data-status', status);
  span.innerHTML = `${ICONS[status] || ''} ${LABELS[status] || status}`;
  return span;
}

export function statusBadgeHTML(status) {
  const safe = (status || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const icon = ICONS[status] || '';
  return `<span class="badge" data-status="${safe}">${icon} ${LABELS[status] || safe}</span>`;
}
