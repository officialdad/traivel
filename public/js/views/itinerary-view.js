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
        <details open class="day-section">
          <summary>
            <i class="fa-solid fa-calendar-day"></i>
            <strong>Day ${day.day_number}${dayDate}</strong>
            ${day.theme ? `<span class="day-theme">&mdash; ${esc(day.theme)}</span>` : ''}
            ${statusBadgeHTML(day.ai_status)}
            <span class="inline-actions">
              <a href="#/days/${day.id}/activities/new" role="button" class="outline"><i class="fa-solid fa-plus"></i> Activity</a>
              <a href="#/days/${day.id}/edit" role="button" class="outline secondary"><i class="fa-solid fa-pen-to-square"></i> Edit</a>
              <button class="outline btn-delete" data-delete-day="${day.id}"><i class="fa-solid fa-trash-can"></i> Delete</button>
            </span>
          </summary>

          ${day.justification ? `<small class="day-justification"><em>${esc(day.justification)}</em></small>` : ''}
      `;

      if (day.activities.length === 0) {
        html += `<p><small>No activities for this day.</small></p>`;
      } else {
        html += `<div class="tl-controls"><button class="tl-toggle-all outline secondary" data-day="${day.id}"><i class="fa-solid fa-angles-down"></i> Expand all</button></div>`;
        html += `<div class="timeline">`;

        const sorted = [...day.activities].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        for (const act of sorted) {
          const cost = act.estimated_cost ? `${it.currency || '$'}${act.estimated_cost.toFixed(2)}` : '';
          const links = (act.reference_links || [])
            .map((l) => `<a href="${escAttr(l.url)}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${esc(l.title || l.url)}</a>`)
            .join('');
          const catIcon = CAT_ICONS[act.category] || CAT_ICONS.other;
          const hasDetails = act.description || act.notes || act.justification || links;
          const timeStart = extractStartTime(act.time_slot);

          html += `
            <div class="tl-item${hasDetails ? ' tl-expandable' : ''}" data-activity-id="${act.id}">
              <div class="tl-time">${timeStart ? esc(timeStart) : '<i class="fa-regular fa-clock"></i>'}</div>
              <div class="tl-dot" data-cat="${escAttr(act.category)}"><i class="fa-solid ${catIcon}"></i></div>
              <div class="tl-content">
                <div class="tl-preview">
                  <div class="tl-title-row">
                    <span class="tl-name">${esc(act.name)}</span>
                    ${cost ? `<span class="tl-cost">${cost}</span>` : ''}
                  </div>
                  <div class="tl-meta">
                    ${act.time_slot ? `<span class="tl-slot">${esc(act.time_slot)}</span>` : ''}
                    ${statusBadgeHTML(act.ai_status)}
                    ${hasDetails ? '<i class="fa-solid fa-chevron-down tl-expand-icon"></i>' : ''}
                  </div>
                </div>
                <div class="tl-details">
                  ${act.description ? `<p class="tl-desc">${esc(act.description)}</p>` : ''}
                  ${act.notes ? `<p class="tl-notes"><i class="fa-solid fa-sticky-note"></i> ${esc(act.notes)}</p>` : ''}
                  ${act.justification ? `<p class="tl-notes"><i class="fa-solid fa-robot"></i> ${esc(act.justification)}</p>` : ''}
                  ${links ? `<div class="ref-links">${links}</div>` : ''}
                  <span class="inline-actions">
                    <a href="#/activities/${act.id}/edit" role="button" class="outline secondary"><i class="fa-solid fa-pen-to-square"></i> Edit</a>
                    <button class="outline btn-delete" data-delete-activity="${act.id}"><i class="fa-solid fa-trash-can"></i> Delete</button>
                  </span>
                </div>
              </div>
            </div>
          `;
        }

        html += `</div>`; // .timeline
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

    // Expand/collapse click handlers
    container.querySelectorAll('.tl-expandable').forEach((item) => {
      const preview = item.querySelector('.tl-preview');
      preview.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) return;
        item.classList.toggle('tl-open');
      });
    });

    // Expand/collapse all per day
    container.querySelectorAll('.tl-toggle-all').forEach((btn) => {
      btn.addEventListener('click', () => {
        const details = btn.closest('details');
        const items = details.querySelectorAll('.tl-expandable');
        const allOpen = [...items].every((i) => i.classList.contains('tl-open'));
        items.forEach((i) => i.classList.toggle('tl-open', !allOpen));
        btn.innerHTML = allOpen
          ? '<i class="fa-solid fa-angles-down"></i> Expand all'
          : '<i class="fa-solid fa-angles-up"></i> Collapse all';
      });
    });

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

function extractStartTime(timeSlot) {
  if (!timeSlot) return '';
  const m = timeSlot.match(/^(\d{1,2}:\d{2})/);
  return m ? m[1] : '';
}
