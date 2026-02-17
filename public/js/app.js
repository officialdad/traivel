import { renderItineraryList } from './views/itinerary-list.js';
import { renderItineraryView } from './views/itinerary-view.js';
import { renderItineraryForm } from './views/itinerary-form.js';
import { renderDayForm } from './views/day-form.js';
import { renderActivityForm } from './views/activity-form.js';
import { renderNav } from './components/nav.js';

const appEl = document.getElementById('app');

function router() {
  const hash = window.location.hash || '#/';
  const parts = hash.slice(2).split('/').filter(Boolean);

  appEl.innerHTML = '';
  appEl.appendChild(renderNav());

  const content = document.createElement('main');
  content.className = 'container';
  appEl.appendChild(content);

  if (parts.length === 0) {
    renderItineraryList(content);
  } else if (parts[0] === 'itineraries' && parts[1] === 'new') {
    renderItineraryForm(content, null);
  } else if (parts[0] === 'itineraries' && parts.length === 2) {
    renderItineraryView(content, parts[1]);
  } else if (parts[0] === 'itineraries' && parts.length === 3 && parts[2] === 'edit') {
    renderItineraryForm(content, parts[1]);
  } else if (parts[0] === 'itineraries' && parts.length === 4 && parts[2] === 'days' && parts[3] === 'new') {
    renderDayForm(content, parts[1], null);
  } else if (parts[0] === 'days' && parts.length === 3 && parts[2] === 'edit') {
    renderDayForm(content, null, parts[1]);
  } else if (parts[0] === 'days' && parts.length === 4 && parts[2] === 'activities' && parts[3] === 'new') {
    renderActivityForm(content, parts[1], null);
  } else if (parts[0] === 'activities' && parts.length === 3 && parts[2] === 'edit') {
    renderActivityForm(content, null, parts[1]);
  } else {
    content.innerHTML = '<article><p>Page not found.</p><a href="#/">Go home</a></article>';
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
