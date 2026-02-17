import { api } from '../api.js';
import { statusBadgeHTML } from '../components/status-badge.js';
import { showToast } from '../components/toast.js';

const CAT_ICONS = {
  food: 'fa-utensils',
  sightseeing: 'fa-binoculars',
  transport: 'fa-bus',
  accommodation: 'fa-bed',
  adventure: 'fa-person-hiking',
  shopping: 'fa-bag-shopping',
  culture: 'fa-masks-theater',
  relaxation: 'fa-spa',
  nightlife: 'fa-champagne-glasses',
  other: 'fa-ellipsis',
};

export async function renderItineraryView(container, itineraryId) {
  container.innerHTML = '<article aria-busy="true">Loading itinerary...</article>';

  try {
    const it = await api.getItinerary(itineraryId);

    const dates = it.start_date && it.end_date
      ? `${formatDate(it.start_date)} – ${formatDate(it.end_date)}`
      : it.start_date ? formatDate(it.start_date) : 'Dates TBD';

    let html = `
      <hgroup>
        <h2>${esc(it.title)} ${statusBadgeHTML(it.ai_status)}</h2>
        <p><i class="fa-solid fa-location-dot"></i> ${esc(it.destination_country)} &middot; ${dates} &middot; ${it.pax || 1} traveler${(it.pax || 1) !== 1 ? 's' : ''}</p>
      </hgroup>

      <div class="btn-group">
        <a href="#/itineraries/${it.id}/edit" role="button" class="outline"><i class="fa-solid fa-pen-to-square"></i> Edit</a>
        <button class="outline btn-delete" data-delete-itinerary="${it.id}"><i class="fa-solid fa-trash-can"></i> Delete</button>
        <a href="#/" role="button" class="secondary outline"><i class="fa-solid fa-arrow-left"></i> Back</a>
      </div>

      <article>
        <header><strong><i class="fa-solid fa-circle-info"></i> Trip Details</strong></header>
        <dl class="meta-grid">
          ${metaItem('fa-plane-departure', 'Origin', [it.origin_city, it.origin_country].filter(Boolean).join(', '))}
          ${metaItem('fa-location-dot', 'Destination', it.destination_country)}
          ${metaItem('fa-clock', 'Duration', it.duration_days ? `${it.duration_days} days` : null)}
          ${metaItem('fa-users', 'Travelers', it.pax)}
          ${metaItem('fa-hotel', 'Stay', it.place_of_stay)}
          ${metaItem('fa-money-bill', 'Currency', it.currency)}
          ${metaItem('fa-language', 'Language', it.language)}
        </dl>
      </article>
    `;

    if (it.culture_notes || it.religion_notes || it.weather_notes) {
      html += `
        <article>
          <header><strong><i class="fa-solid fa-earth-americas"></i> Destination Context</strong></header>
          <dl class="meta-grid">
            ${metaItem('fa-landmark', 'Culture', it.culture_notes)}
            ${metaItem('fa-place-of-worship', 'Religion', it.religion_notes)}
            ${metaItem('fa-cloud-sun', 'Weather', it.weather_notes)}
          </dl>
        </article>
      `;
    }

    if (it.justification) {
      html += `<article><header><strong><i class="fa-solid fa-robot"></i> AI Justification</strong></header><p>${esc(it.justification)}</p></article>`;
    }

    // Days
    html += `<h3><i class="fa-solid fa-calendar-days"></i> Days</h3>`;

    if (it.days.length === 0) {
      html += `<p class="empty-state"><span class="empty-icon" aria-hidden="true"><i class="fa-regular fa-calendar-plus"></i></span>No days added yet.</p>`;
    }

    for (const day of it.days) {
      const dayDate = day.date ? ` (${formatDate(day.date)})` : '';
      const dayCost = day.activities.reduce((sum, a) => sum + (a.estimated_cost || 0), 0);

      html += `
        <details open>
          <summary>
            <i class="fa-solid fa-calendar-day"></i>
            <strong>Day ${day.day_number}${dayDate}</strong>
            ${day.theme ? `&mdash; ${esc(day.theme)}` : ''}
            ${statusBadgeHTML(day.ai_status)}
            <span class="inline-actions">
              <a href="#/days/${day.id}/activities/new" role="button" class="outline"><i class="fa-solid fa-plus"></i> Activity</a>
              <a href="#/days/${day.id}/edit" role="button" class="outline secondary"><i class="fa-solid fa-pen-to-square"></i> Edit</a>
              <button class="outline btn-delete" data-delete-day="${day.id}"><i class="fa-solid fa-trash-can"></i> Delete</button>
            </span>
          </summary>

          ${day.justification ? `<small><em>${esc(day.justification)}</em></small>` : ''}
      `;

      if (day.activities.length === 0) {
        html += `<p><small>No activities for this day.</small></p>`;
      }

      for (const act of day.activities) {
        const cost = act.estimated_cost != null ? `${it.currency || '$'}${act.estimated_cost.toFixed(2)}` : '';
        const links = (act.reference_links || [])
          .map((l) => `<a href="${escAttr(l.url)}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${esc(l.title || l.url)}</a>`)
          .join(' ');
        const catIcon = CAT_ICONS[act.category] || CAT_ICONS.other;

        html += `
          <div class="activity-card">
            <div class="activity-header">
              ${act.time_slot ? `<span class="act-time"><i class="fa-regular fa-clock"></i> ${esc(act.time_slot)}</span>` : ''}
              <span class="act-name">${esc(act.name)}</span>
              <span class="activity-badges">
                ${statusBadgeHTML(act.ai_status)}
                <span class="badge" data-cat="${escAttr(act.category)}"><i class="fa-solid ${catIcon}"></i> ${esc(act.category)}</span>
              </span>
              ${cost ? `<span class="act-cost"><i class="fa-solid fa-coins"></i> ${cost}</span>` : ''}
            </div>
            ${act.description ? `<p>${esc(act.description)}</p>` : ''}
            ${act.notes ? `<p><small><em><i class="fa-solid fa-sticky-note"></i> ${esc(act.notes)}</em></small></p>` : ''}
            ${act.justification ? `<p><small><i class="fa-solid fa-comment"></i> ${esc(act.justification)}</small></p>` : ''}
            ${links ? `<div class="ref-links">${links}</div>` : ''}
            <span class="inline-actions">
              <a href="#/activities/${act.id}/edit" role="button" class="outline secondary"><i class="fa-solid fa-pen-to-square"></i> Edit</a>
              <button class="outline btn-delete" data-delete-activity="${act.id}"><i class="fa-solid fa-trash-can"></i> Delete</button>
            </span>
          </div>
        `;
      }

      if (dayCost > 0) {
        html += `<div class="cost-total"><i class="fa-solid fa-calculator"></i> Day total: ${it.currency || '$'}${dayCost.toFixed(2)}</div>`;
      }

      html += `</details>`;
    }

    html += `<a href="#/itineraries/${it.id}/days/new" role="button" class="outline" style="margin-top:1rem"><i class="fa-solid fa-plus"></i> Add Day</a>`;

    // Total cost
    const totalCost = it.days.reduce(
      (sum, d) => sum + d.activities.reduce((s, a) => s + (a.estimated_cost || 0), 0),
      0
    );
    if (totalCost > 0) {
      html += `<p class="cost-total" style="margin-top:1rem;font-size:1.1em"><i class="fa-solid fa-wallet"></i> Trip total: ${it.currency || '$'}${totalCost.toFixed(2)}</p>`;
    }

    container.innerHTML = html;

    // Delete handlers
    container.querySelectorAll('[data-delete-itinerary]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this entire itinerary? This cannot be undone.')) return;
        btn.setAttribute('aria-busy', 'true');
        try {
          await api.deleteItinerary(btn.dataset.deleteItinerary);
          showToast('Itinerary deleted');
          window.location.hash = '#/';
        } catch (err) {
          showToast('Failed to delete: ' + err.message, 'error');
          btn.removeAttribute('aria-busy');
        }
      });
    });

    container.querySelectorAll('[data-delete-day]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this day and all its activities?')) return;
        btn.setAttribute('aria-busy', 'true');
        try {
          await api.deleteDay(btn.dataset.deleteDay);
          showToast('Day deleted');
          renderItineraryView(container, itineraryId);
        } catch (err) {
          showToast('Failed to delete: ' + err.message, 'error');
          btn.removeAttribute('aria-busy');
        }
      });
    });

    container.querySelectorAll('[data-delete-activity]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this activity?')) return;
        btn.setAttribute('aria-busy', 'true');
        try {
          await api.deleteActivity(btn.dataset.deleteActivity);
          showToast('Activity deleted');
          renderItineraryView(container, itineraryId);
        } catch (err) {
          showToast('Failed to delete: ' + err.message, 'error');
          btn.removeAttribute('aria-busy');
        }
      });
    });
  } catch (err) {
    container.innerHTML = `<article><p><i class="fa-solid fa-circle-exclamation"></i> Error: ${esc(err.message)}</p><a href="#/" role="button"><i class="fa-solid fa-arrow-left"></i> Back</a></article>`;
  }
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function escAttr(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function metaItem(icon, label, value) {
  if (!value && value !== 0) return '';
  return `<dt><i class="fa-solid ${icon}"></i> ${label}</dt><dd>${esc(String(value))}</dd>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
