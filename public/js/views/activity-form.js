import { api } from '../api.js';
import { renderLinkEditor } from '../components/link-editor.js';
import { showToast } from '../components/toast.js';

const CATEGORIES = [
  'transport', 'accommodation', 'food', 'sightseeing',
  'adventure', 'shopping', 'culture', 'relaxation', 'nightlife', 'other'
];

const CAT_ICONS = {
  transport: 'fa-bus', accommodation: 'fa-bed', food: 'fa-utensils',
  sightseeing: 'fa-binoculars', adventure: 'fa-person-hiking',
  shopping: 'fa-bag-shopping', culture: 'fa-masks-theater',
  relaxation: 'fa-spa', nightlife: 'fa-champagne-glasses', other: 'fa-ellipsis',
};

export async function renderActivityForm(container, dayId, activityId) {
  let activity = null;
  let parentDayId = dayId;
  let itineraryId = null;
  const isEdit = activityId !== null;

  container.innerHTML = '<article aria-busy="true">Loading...</article>';

  if (isEdit) {
    try {
      activity = await api.getActivity(activityId);
      parentDayId = activity.day_id;
    } catch (err) {
      container.innerHTML = `<article><p><i class="fa-solid fa-circle-exclamation"></i> Error: ${esc(err.message)}</p></article>`;
      return;
    }
  }

  // Get parent day for context (activities list, day info, itinerary_id)
  let dayData = null;
  try {
    dayData = await api.getDay(parentDayId);
    itineraryId = dayData.itinerary_id;
  } catch {
    // fallback
  }

  const existingActivities = dayData ? (dayData.activities || []) : [];
  const v = (field) => (activity ? activity[field] ?? '' : '');

  // Parse existing time_slot into start/end times
  let startTime = '';
  let endTime = '';
  const timeSlot = v('time_slot');
  if (timeSlot) {
    const match = timeSlot.match(/^(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/);
    if (match) {
      startTime = match[1].length === 4 ? '0' + match[1] : match[1];
      endTime = match[2].length === 4 ? '0' + match[2] : match[2];
    }
  }

  // Smart defaults for new activities
  let suggestedSortOrder = 0;
  let suggestedStartTime = '';

  if (!isEdit) {
    const maxSort = existingActivities.reduce((max, a) => Math.max(max, a.sort_order || 0), 0);
    suggestedSortOrder = maxSort + 1;

    // Suggest start time based on last activity's end time
    const sorted = [...existingActivities].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const lastAct = sorted[sorted.length - 1];
    if (lastAct && lastAct.time_slot) {
      const m = lastAct.time_slot.match(/[-–]\s*(\d{1,2}:\d{2})$/);
      if (m) {
        suggestedStartTime = m[1].length === 4 ? '0' + m[1] : m[1];
      }
    }
  }

  const displayStartTime = startTime || suggestedStartTime;

  const catOptions = CATEGORIES.map(
    (c) => `<option value="${c}" ${v('category') === c ? 'selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`
  ).join('');

  // Build existing activities summary for context
  let actSummaryHTML = '';
  if (existingActivities.length > 0 && !isEdit) {
    const actItems = existingActivities
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((a) => {
        const t = a.time_slot ? `${esc(a.time_slot)} ` : '';
        return `<li>${t}<strong>${esc(a.name)}</strong> <small>(${esc(a.category)})</small></li>`;
      })
      .join('');
    actSummaryHTML = `
      <details class="existing-days-summary">
        <summary><i class="fa-solid fa-list-check"></i> ${existingActivities.length} existing activit${existingActivities.length !== 1 ? 'ies' : 'y'}</summary>
        <ul>${actItems}</ul>
      </details>
    `;
  }

  const dayLabel = dayData
    ? `Day ${dayData.day_number}${dayData.theme ? ' — ' + esc(dayData.theme) : ''}${dayData.date ? ' (' + formatDate(dayData.date) + ')' : ''}`
    : 'Day';

  container.innerHTML = `
    <hgroup>
      <h2><i class="fa-solid fa-${isEdit ? 'pen-to-square' : 'plus-circle'}"></i> ${isEdit ? 'Edit' : 'Add'} Activity</h2>
      <p><i class="fa-solid fa-calendar-day"></i> ${dayLabel}</p>
    </hgroup>

    ${actSummaryHTML}

    <form id="activity-form">
      <fieldset>
        <legend><i class="fa-solid fa-list-check"></i> Activity Details</legend>
        <label>Activity Name *
          <input name="name" required value="${escAttr(v('name'))}" placeholder="e.g. Visit Senso-ji Temple" />
        </label>

        <label>Description
          <textarea name="description" rows="3" placeholder="What you'll do...">${esc(v('description'))}</textarea>
          <small>Supports **bold**, *italic*, - lists, and [links](url)</small>
        </label>

        <div class="grid">
          <label><i class="fa-regular fa-clock"></i> Start Time
            <input type="time" name="start_time" value="${escAttr(displayStartTime)}" />
          </label>
          <label><i class="fa-regular fa-clock"></i> End Time
            <input type="time" name="end_time" value="${escAttr(endTime)}" />
          </label>
          <label><i class="fa-solid fa-coins"></i> Estimated Cost
            <input type="number" step="0.01" name="estimated_cost" value="${v('estimated_cost') ?? ''}" placeholder="In local currency" />
          </label>
        </div>

        <label><i class="fa-solid fa-tags"></i> Category
          <select name="category">${catOptions}</select>
        </label>

        <label>Notes
          <textarea name="notes" rows="2" placeholder="Tips, warnings, booking info...">${esc(v('notes'))}</textarea>
          <small>Supports **bold**, *italic*, - lists, and [links](url)</small>
        </label>
      </fieldset>

      <fieldset>
        <legend><i class="fa-solid fa-link"></i> References</legend>
        <div id="link-editor-slot"></div>
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
        <button type="submit"><i class="fa-solid fa-${isEdit ? 'floppy-disk' : 'plus'}"></i> ${isEdit ? 'Update' : 'Add'} Activity</button>
        ${!isEdit ? '<button type="submit" name="add_another" value="1" class="outline"><i class="fa-solid fa-plus"></i> Add & Continue</button>' : ''}
        <a href="${itineraryId ? `#/itineraries/${itineraryId}` : '#/'}" role="button" class="outline secondary"><i class="fa-solid fa-xmark"></i> Cancel</a>
      </div>
    </form>
  `;

  // Mount link editor
  const linkEditor = renderLinkEditor(activity ? activity.reference_links || [] : []);
  container.querySelector('#link-editor-slot').appendChild(linkEditor.element);

  // Auto-suggest end time: start + 1 hour
  const startTimeInput = container.querySelector('input[name="start_time"]');
  const endTimeInput = container.querySelector('input[name="end_time"]');

  startTimeInput.addEventListener('change', () => {
    if (startTimeInput.value && !endTimeInput.value) {
      endTimeInput.value = addHours(startTimeInput.value, 1);
    }
  });

  const form = container.querySelector('#activity-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitter = e.submitter;
    const addAnother = submitter && submitter.name === 'add_another';
    const btn = submitter || form.querySelector('button[type="submit"]');
    btn.setAttribute('aria-busy', 'true');
    btn.disabled = true;

    const fd = new FormData(form);
    const data = {};
    const start = fd.get('start_time');
    const end = fd.get('end_time');

    for (const [k, val] of fd.entries()) {
      if (val !== '' && k !== 'start_time' && k !== 'end_time' && k !== 'add_another') {
        if (k === 'estimated_cost') {
          data[k] = parseFloat(val);
        } else if (k === 'sort_order') {
          data[k] = parseInt(val);
        } else {
          data[k] = val;
        }
      }
    }

    // Combine start/end times into time_slot
    if (start && end) {
      data.time_slot = `${start}–${end}`;
    } else if (start) {
      data.time_slot = start;
    }

    data.reference_links = linkEditor.getValue();
    if (!isEdit) {
      data.sort_order = suggestedSortOrder;
    } else if (activity && activity.sort_order != null) {
      data.sort_order = activity.sort_order;
    }

    try {
      if (isEdit) {
        await api.updateActivity(activityId, data);
        showToast('Activity updated');
        window.location.hash = itineraryId ? `#/itineraries/${itineraryId}` : '#/';
      } else {
        await api.createActivity(parentDayId, data);
        showToast(`${data.name} added`);

        if (addAnother) {
          renderActivityForm(container, parentDayId, null);
        } else {
          window.location.hash = itineraryId ? `#/itineraries/${itineraryId}` : '#/';
        }
      }
    } catch (err) {
      btn.removeAttribute('aria-busy');
      btn.disabled = false;
      showToast('Error: ' + err.message, 'error');
    }
  });
}

function addHours(timeStr, hours) {
  const [h, m] = timeStr.split(':').map(Number);
  const newH = Math.min(h + hours, 23);
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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
