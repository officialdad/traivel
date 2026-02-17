const BASE = '/api/v1';

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  listItineraries: () => request('GET', '/itineraries'),
  getItinerary: (id) => request('GET', `/itineraries/${id}`),
  createItinerary: (data) => request('POST', '/itineraries', data),
  createFullItinerary: (data) => request('POST', '/itineraries/full', data),
  updateItinerary: (id, data) => request('PUT', `/itineraries/${id}`, data),
  deleteItinerary: (id) => request('DELETE', `/itineraries/${id}`),

  listDays: (iid) => request('GET', `/itineraries/${iid}/days`),
  createDay: (iid, data) => request('POST', `/itineraries/${iid}/days`, data),
  getDay: (id) => request('GET', `/days/${id}`),
  updateDay: (id, data) => request('PUT', `/days/${id}`, data),
  deleteDay: (id) => request('DELETE', `/days/${id}`),

  listActivities: (did) => request('GET', `/days/${did}/activities`),
  createActivity: (did, data) => request('POST', `/days/${did}/activities`, data),
  getActivity: (id) => request('GET', `/activities/${id}`),
  updateActivity: (id, data) => request('PUT', `/activities/${id}`, data),
  deleteActivity: (id) => request('DELETE', `/activities/${id}`),
};
