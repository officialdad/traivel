import { api } from '../api.js';
import { statusBadgeHTML } from '../components/status-badge.js';
import { showToast } from '../components/toast.js';
import { getCurrencySymbol, normalizeCurrencyCode, getExchangeRate, convertToMYR, formatMYR, formatNumber } from '../currency.js';
import { renderMarkdown } from '../markdown.js';

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

    const currCode = normalizeCurrencyCode(it.currency);
    const currSymbol = getCurrencySymbol(currCode);
    const isMYR = currCode === 'MYR';

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
          ${metaItem('fa-plane-departure', 'Origin', buildLocationString(it.origin_city, it.origin_country, it.origin_currency, it.origin_language))}
          ${metaItem('fa-location-dot', 'Destination', buildLocationString(it.destination_city, it.destination_country, currCode, it.language))}
          ${metaItem('fa-clock', 'Duration', it.duration_days ? `${it.duration_days} days` : null)}
          ${metaItem('fa-users', 'Travelers', it.pax)}
          ${metaItem('fa-hotel', 'Stay', it.place_of_stay)}
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
      const dayDate = day.date ? ` (${formatDateShort(day.date)})` : '';
      const dayCost = day.activities.reduce((sum, a) => sum + (a.estimated_cost || 0), 0);

      html += `
        <details open class="day-section">
          <summary>
            <i class="fa-solid fa-calendar-day"></i>
            <strong>Day ${day.day_number}${dayDate}</strong>
            ${day.theme ? `<span class="day-theme">&mdash; ${esc(day.theme)}</span>` : ''}
            ${statusBadgeHTML(day.ai_status)}
            <span class="inline-actions">
              <a href="#/days/${day.id}/activities/new" role="button" class="outline btn-add"><i class="fa-solid fa-plus"></i> Activity</a>
              <a href="#/days/${day.id}/edit" role="button" class="outline"><i class="fa-solid fa-pen-to-square"></i> Edit</a>
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
          const cost = act.estimated_cost ? `${currSymbol}${formatNumber(act.estimated_cost)}` : '';
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
                  ${act.description ? `<div class="tl-desc md-content">${renderMarkdown(act.description)}</div>` : ''}
                  ${act.notes ? `<p class="tl-notes"><i class="fa-solid fa-sticky-note"></i> <span class="md-content">${renderMarkdown(act.notes)}</span></p>` : ''}
                  ${act.justification ? `<p class="tl-notes"><i class="fa-solid fa-robot"></i> ${esc(act.justification)}</p>` : ''}
                  ${links ? `<div class="ref-links">${links}</div>` : ''}
                  <span class="inline-actions">
                    <a href="#/activities/${act.id}/edit" role="button" class="outline"><i class="fa-solid fa-pen-to-square"></i> Edit</a>
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
        const showDayMYR = !isMYR && currCode;
        html += `<div class="cost-total"><i class="fa-solid fa-calculator"></i> Day total: ${currSymbol}${formatNumber(dayCost)}${showDayMYR ? `<span class="myr-day-inline" data-amount="${dayCost}"></span>` : ''}</div>`;
      }

      html += `</details>`;
    }

    html += `<a href="#/itineraries/${it.id}/days/new" role="button" class="outline btn-add" style="margin-top:1rem"><i class="fa-solid fa-plus"></i> Add Day</a>`;

    // Budget summary
    const totalCost = it.days.reduce(
      (sum, d) => sum + d.activities.reduce((s, a) => s + (a.estimated_cost || 0), 0),
      0
    );
    if (totalCost > 0) {
      const showMYR = !isMYR && currCode;
      html += `
        <article class="budget-summary">
          <header><strong><i class="fa-solid fa-wallet"></i> Budget Summary</strong></header>
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Theme</th>
                <th class="text-right">${currCode || 'Cost'}</th>
                ${showMYR ? '<th class="text-right">MYR</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${it.days.map(d => {
                const dc = d.activities.reduce((s, a) => s + (a.estimated_cost || 0), 0);
                if (dc <= 0) return '';
                return `<tr>
                  <td>Day ${d.day_number}</td>
                  <td>${esc(d.theme || '')}</td>
                  <td class="text-right">${currSymbol}${formatNumber(dc)}</td>
                  ${showMYR ? `<td class="text-right myr-day" data-amount="${dc}"><span class="myr-loading" aria-busy="true"></span></td>` : ''}
                </tr>`;
              }).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2"><strong>Total</strong></td>
                <td class="text-right"><strong>${currSymbol}${formatNumber(totalCost)}</strong></td>
                ${showMYR ? `<td class="text-right myr-total" data-amount="${totalCost}"><span class="myr-loading" aria-busy="true"></span></td>` : ''}
              </tr>
            </tfoot>
          </table>
        </article>`;
    }

    container.innerHTML = html;

    // Async MYR conversion
    if (!isMYR && currCode) {
      getExchangeRate(currCode).then(rate => {
        if (!rate) {
          container.querySelectorAll('.myr-day, .myr-total').forEach(el => { el.textContent = '—'; });
          container.querySelectorAll('.myr-day-inline').forEach(el => { el.textContent = ''; });
          return;
        }
        container.querySelectorAll('.myr-day').forEach(el => {
          const amt = parseFloat(el.dataset.amount);
          el.textContent = formatMYR(convertToMYR(amt, rate));
        });
        container.querySelectorAll('.myr-total').forEach(el => {
          const amt = parseFloat(el.dataset.amount);
          el.innerHTML = `<strong>${formatMYR(convertToMYR(amt, rate))}</strong>`;
        });
        container.querySelectorAll('.myr-day-inline').forEach(el => {
          const amt = parseFloat(el.dataset.amount);
          el.textContent = `(~${formatMYR(convertToMYR(amt, rate))})`;
        });
      });
    }

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
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function buildLocationString(city, country, currency, language) {
  const place = [city, country].filter(Boolean).join(', ');
  if (!place) return null;
  const details = [currency, language].filter(Boolean);
  if (details.length > 0) {
    return `${place} (${details.join(', ')})`;
  }
  return place;
}

function extractStartTime(timeSlot) {
  if (!timeSlot) return '';
  const m = timeSlot.match(/^(\d{1,2}:\d{2})/);
  return m ? m[1] : '';
}
