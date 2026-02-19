import { api } from '../api.js';
import { statusBadgeHTML } from '../components/status-badge.js';

export async function renderItineraryList(container) {
  container.innerHTML = '<article aria-busy="true">Loading itineraries...</article>';

  try {
    const itineraries = await api.listItineraries();

    if (itineraries.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon" aria-hidden="true"><i class="fa-solid fa-plane-departure"></i></span>
          <h2>No trips yet</h2>
          <p>Plan your next adventure — create your first itinerary.</p>
          <a href="#/itineraries/new" role="button"><i class="fa-solid fa-plus"></i> New Trip</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="list-header">
        <hgroup>
          <h2><i class="fa-solid fa-suitcase-rolling"></i> Your Trips</h2>
          <p>${itineraries.length} itinerar${itineraries.length !== 1 ? 'ies' : 'y'}</p>
        </hgroup>
        <a href="#/itineraries/new" role="button"><i class="fa-solid fa-plus"></i> New Trip</a>
      </div>
      <div class="itinerary-grid"></div>
    `;

    const grid = container.querySelector('.itinerary-grid');

    for (const it of itineraries) {
      const card = document.createElement('article');
      const dates = it.start_date && it.end_date
        ? `${formatDate(it.start_date)} – ${formatDate(it.end_date)}`
        : it.start_date ? formatDate(it.start_date) : 'Dates TBD';

      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'link');
      card.innerHTML = `
        <header>
          <strong>${escapeHTML(it.title)}</strong>
          ${statusBadgeHTML(it.ai_status)}
        </header>
        <p><i class="fa-solid fa-location-dot"></i> ${escapeHTML([it.destination_city, it.destination_country].filter(Boolean).join(', '))}</p>
        <div class="card-meta">
          <span><i class="fa-regular fa-calendar"></i>${dates}</span>
          <span><i class="fa-solid fa-users"></i>${it.pax || 1} traveler${(it.pax || 1) !== 1 ? 's' : ''}</span>
          <span><i class="fa-regular fa-clock"></i>${it.duration_days || '?'} days</span>
        </div>
      `;

      card.addEventListener('click', () => {
        window.location.hash = `#/itineraries/${it.id}`;
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') window.location.hash = `#/itineraries/${it.id}`;
      });

      grid.appendChild(card);
    }
  } catch (err) {
    container.innerHTML = `<article><p><i class="fa-solid fa-circle-exclamation"></i> Error loading itineraries: ${escapeHTML(err.message)}</p></article>`;
  }
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
