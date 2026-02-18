import { api } from '../api.js';
import { showToast } from '../components/toast.js';

export async function renderItineraryForm(container, itineraryId) {
  let itinerary = null;
  const isEdit = itineraryId !== null;

  if (isEdit) {
    container.innerHTML = '<article aria-busy="true">Loading...</article>';
    try {
      itinerary = await api.getItinerary(itineraryId);
    } catch (err) {
      container.innerHTML = `<article><p><i class="fa-solid fa-circle-exclamation"></i> Error: ${esc(err.message)}</p></article>`;
      return;
    }
  }

  const v = (field) => (itinerary ? itinerary[field] ?? '' : '');

  container.innerHTML = `
    <hgroup>
      <h2><i class="fa-solid ${isEdit ? 'fa-pen-to-square' : 'fa-plus-circle'}"></i> ${isEdit ? 'Edit' : 'New'} Itinerary</h2>
      <p>${isEdit ? 'Update trip details' : 'Plan your next adventure'}</p>
    </hgroup>

    <form id="itinerary-form">
      <fieldset>
        <legend><i class="fa-solid fa-heading"></i> Basic Info</legend>
        <label>Title *
          <input name="title" required value="${escAttr(v('title'))}" placeholder="e.g. Tokyo Adventure 2026" />
        </label>
      </fieldset>

      <fieldset>
        <legend><i class="fa-solid fa-map-location-dot"></i> Location</legend>
        <div class="grid">
          <label>Destination Country *
            <input name="destination_country" required value="${escAttr(v('destination_country'))}" placeholder="e.g. Japan" />
          </label>
          <label>Origin Country
            <input name="origin_country" value="${escAttr(v('origin_country'))}" placeholder="e.g. Philippines" />
          </label>
          <label>Origin City
            <input name="origin_city" value="${escAttr(v('origin_city'))}" placeholder="e.g. Manila" />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend><i class="fa-solid fa-calendar-check"></i> Schedule &amp; Logistics</legend>
        <div class="grid">
          <label>Start Date
            <input type="date" name="start_date" value="${escAttr(v('start_date'))}" />
          </label>
          <label>End Date
            <input type="date" name="end_date" value="${escAttr(v('end_date'))}" />
          </label>
          <label>Duration (days)
            <input type="number" name="duration_days" min="1" value="${v('duration_days') || ''}" />
          </label>
        </div>
        <div class="grid">
          <label>Travelers (pax)
            <input type="number" name="pax" min="1" value="${v('pax') || 1}" />
          </label>
          <label>Place of Stay
            <input name="place_of_stay" value="${escAttr(v('place_of_stay'))}" placeholder="Hotel / Airbnb name" />
          </label>
        </div>
        <div class="grid">
          <label>Currency
            <select name="currency">
              <option value="">— Select —</option>
              ${['MYR','USD','JPY','EUR','GBP','SGD','THB','AUD','KRW','CNY','TWD','IDR','PHP','INR','AED','CHF','HKD','NZD','CAD','VND'].map(c => `<option value="${c}"${v('currency') === c ? ' selected' : ''}>${c}</option>`).join('')}
            </select>
          </label>
          <label>Language
            <input name="language" value="${escAttr(v('language'))}" placeholder="e.g. Japanese" />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend><i class="fa-solid fa-earth-americas"></i> Destination Context</legend>
        <label>Culture Notes
          <textarea name="culture_notes" rows="2" placeholder="Cultural considerations...">${esc(v('culture_notes'))}</textarea>
        </label>
        <label>Religion Notes
          <textarea name="religion_notes" rows="2" placeholder="Religious considerations...">${esc(v('religion_notes'))}</textarea>
        </label>
        <label>Weather Notes
          <textarea name="weather_notes" rows="2" placeholder="Weather comparison vs origin...">${esc(v('weather_notes'))}</textarea>
        </label>
      </fieldset>

      ${isEdit ? `
        <fieldset>
          <legend><i class="fa-solid fa-robot"></i> AI Status</legend>
          <div class="grid">
            <label>Status
              <select name="ai_status">
                <option value="ai_recommended" ${v('ai_status') === 'ai_recommended' ? 'selected' : ''}>AI Recommended</option>
                <option value="finalized" ${v('ai_status') === 'finalized' ? 'selected' : ''}>Finalized</option>
                <option value="modified" ${v('ai_status') === 'modified' ? 'selected' : ''}>Modified</option>
              </select>
            </label>
            <label>Justification
              <textarea name="justification" rows="2" placeholder="Why this change?">${esc(v('justification'))}</textarea>
            </label>
          </div>
        </fieldset>
      ` : ''}

      <div class="btn-group">
        <button type="submit"><i class="fa-solid fa-${isEdit ? 'floppy-disk' : 'plus'}"></i> ${isEdit ? 'Update' : 'Create'} Itinerary</button>
        <a href="${isEdit ? `#/itineraries/${itineraryId}` : '#/'}" role="button" class="outline secondary"><i class="fa-solid fa-xmark"></i> Cancel</a>
      </div>
    </form>
  `;

  const form = container.querySelector('#itinerary-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.setAttribute('aria-busy', 'true');

    const fd = new FormData(form);
    const data = {};
    for (const [k, val] of fd.entries()) {
      if (val !== '') {
        if (k === 'duration_days' || k === 'pax') {
          data[k] = parseInt(val);
        } else {
          data[k] = val;
        }
      }
    }

    try {
      if (isEdit) {
        await api.updateItinerary(itineraryId, data);
        showToast('Itinerary updated');
        window.location.hash = `#/itineraries/${itineraryId}`;
      } else {
        const created = await api.createItinerary(data);
        showToast('Itinerary created');
        window.location.hash = `#/itineraries/${created.id}`;
      }
    } catch (err) {
      btn.removeAttribute('aria-busy');
      showToast('Error: ' + err.message, 'error');
    }
  });
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function escAttr(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
