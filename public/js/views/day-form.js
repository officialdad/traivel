import { api } from '../api.js';
import { showToast } from '../components/toast.js';

export async function renderDayForm(container, itineraryId, dayId) {
  let day = null;
  const isEdit = dayId !== null;

  container.innerHTML = '<article aria-busy="true">Loading...</article>';

  if (isEdit) {
    try {
      day = await api.getDay(dayId);
      itineraryId = day.itinerary_id;
    } catch (err) {
      container.innerHTML = `<article><p><i class="fa-solid fa-circle-exclamation"></i> Error: ${esc(err.message)}</p></article>`;
      return;
    }
  }

  // Fetch itinerary to get start_date and existing days for smart defaults
  let itinerary = null;
  try {
    itinerary = await api.getItinerary(itineraryId);
  } catch {
    // fallback — form still works without suggestions
  }

  const existingDays = itinerary ? (itinerary.days || []) : [];
  const v = (field) => (day ? day[field] ?? '' : '');

  // Smart defaults for new days
  let suggestedDayNumber = '';
  let suggestedDate = '';

  if (!isEdit) {
    // Next day number = max existing + 1
    const maxDay = existingDays.reduce((max, d) => Math.max(max, d.day_number || 0), 0);
    suggestedDayNumber = maxDay + 1;

    // Suggest date based on last day's date, or itinerary start_date + offset
    const sortedDays = [...existingDays].sort((a, b) => (a.day_number || 0) - (b.day_number || 0));
    const lastDay = sortedDays[sortedDays.length - 1];

    if (lastDay && lastDay.date) {
      suggestedDate = addDays(lastDay.date, 1);
    } else if (itinerary && itinerary.start_date) {
      suggestedDate = addDays(itinerary.start_date, maxDay);
    }
  }

  const dayNum = v('day_number') || suggestedDayNumber || '';
  const dayDate = v('date') || suggestedDate || '';

  // Build existing days summary for context
  let daySummaryHTML = '';
  if (existingDays.length > 0 && !isEdit) {
    const dayItems = existingDays
      .sort((a, b) => (a.day_number || 0) - (b.day_number || 0))
      .map((d) => {
        const dt = d.date ? formatDate(d.date) : 'no date';
        const theme = d.theme ? ` — ${esc(d.theme)}` : '';
        return `<li>Day ${d.day_number} (${dt})${theme}</li>`;
      })
      .join('');
    daySummaryHTML = `
      <details class="existing-days-summary">
        <summary><i class="fa-solid fa-list-ol"></i> ${existingDays.length} existing day${existingDays.length !== 1 ? 's' : ''}</summary>
        <ul>${dayItems}</ul>
      </details>
    `;
  }

  const tripTitle = itinerary ? esc(itinerary.title) : 'Trip';

  const startDate = itinerary ? itinerary.start_date : null;
  const endDate = itinerary ? itinerary.end_date : null;

  container.innerHTML = `
    <hgroup>
      <h2><i class="fa-solid fa-calendar-day"></i> ${isEdit ? 'Edit' : 'Add'} Day</h2>
      <p><i class="fa-solid fa-suitcase-rolling"></i> ${tripTitle}</p>
    </hgroup>

    ${daySummaryHTML}

    <form id="day-form">
      <fieldset>
        <legend><i class="fa-solid fa-calendar-day"></i> Day Info</legend>
        <div class="grid">
          <label>Date *
            <input type="date" name="date" required value="${escAttr(dayDate)}"
              ${startDate ? `min="${escAttr(startDate)}"` : ''}
              ${endDate ? `max="${escAttr(endDate)}"` : ''} />
          </label>
          <label>Day Number
            <input type="number" name="day_number" min="1" value="${dayNum}" readonly tabindex="-1" aria-label="Auto-calculated from date" />
            <small>${startDate ? 'Auto-calculated from date' : 'Enter manually (no trip start date)'}</small>
          </label>
        </div>
        <label>Theme
          <input name="theme" value="${escAttr(v('theme'))}" placeholder="e.g. Temple day, Beach & relax" />
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
              <textarea name="justification" rows="2">${esc(v('justification'))}</textarea>
            </label>
          </div>
        </fieldset>
      ` : ''}

      <div class="btn-group">
        <button type="submit"><i class="fa-solid fa-${isEdit ? 'floppy-disk' : 'plus'}"></i> ${isEdit ? 'Update' : 'Add'} Day</button>
        ${!isEdit ? '<button type="submit" name="add_another" value="1" class="outline"><i class="fa-solid fa-plus"></i> Add & Continue</button>' : ''}
        <a href="#/itineraries/${itineraryId}" role="button" class="outline secondary"><i class="fa-solid fa-xmark"></i> Cancel</a>
      </div>
    </form>
  `;

  // Wire up date → auto-calculate day_number
  const dayNumberInput = container.querySelector('input[name="day_number"]');
  const dateInput = container.querySelector('input[name="date"]');

  function calcDayNumber() {
    if (!startDate || !dateInput.value) return;
    const start = new Date(startDate + 'T00:00:00');
    const picked = new Date(dateInput.value + 'T00:00:00');
    const diff = Math.round((picked - start) / 86400000) + 1;
    if (diff >= 1) {
      dayNumberInput.value = diff;
    }
  }

  if (startDate) {
    dateInput.addEventListener('input', calcDayNumber);
    // Calculate on load if date is pre-filled
    if (dateInput.value) calcDayNumber();
  } else {
    // No start_date — let user enter both manually
    dayNumberInput.removeAttribute('readonly');
    dayNumberInput.removeAttribute('tabindex');
  }

  const form = container.querySelector('#day-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitter = e.submitter;
    const addAnother = submitter && submitter.name === 'add_another';
    const btn = submitter || form.querySelector('button[type="submit"]');
    btn.setAttribute('aria-busy', 'true');

    const fd = new FormData(form);
    const data = {};
    for (const [k, val] of fd.entries()) {
      if (val !== '' && k !== 'add_another') {
        if (k === 'day_number') {
          data[k] = parseInt(val);
        } else {
          data[k] = val;
        }
      }
    }

    try {
      if (isEdit) {
        await api.updateDay(dayId, data);
        showToast('Day updated');
        window.location.hash = `#/itineraries/${itineraryId}`;
      } else {
        await api.createDay(itineraryId, data);
        showToast(`Day ${data.day_number} added`);

        if (addAnother) {
          // Re-render the form with updated context for next day
          renderDayForm(container, itineraryId, null);
        } else {
          window.location.hash = `#/itineraries/${itineraryId}`;
        }
      }
    } catch (err) {
      btn.removeAttribute('aria-busy');
      showToast('Error: ' + err.message, 'error');
    }
  });
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function escAttr(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
