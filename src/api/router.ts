import type { Env } from '../types';
import { API_PREFIX, errorResponse } from './helpers';
import {
  listItineraries,
  createItinerary,
  getItinerary,
  updateItinerary,
  deleteItinerary,
  createFullItinerary,
} from './itineraries';
import { listDays, createDay, getDay, updateDay, deleteDay } from './days';
import {
  listActivities,
  createActivity,
  getActivity,
  updateActivity,
  deleteActivity,
} from './activities';

interface RouteMatch {
  params: Record<string, string>;
}

function matchRoute(pattern: string, pathname: string): RouteMatch | null {
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return { params };
}

export async function handleApiRequest(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const db = env.DB;
  let match: RouteMatch | null;

  try {
    // POST /api/v1/itineraries/full (before :id to prevent "full" as id)
    match = matchRoute(`${API_PREFIX}/itineraries/full`, path);
    if (match && method === 'POST') return await createFullItinerary(request, db);

    // GET/POST /api/v1/itineraries
    match = matchRoute(`${API_PREFIX}/itineraries`, path);
    if (match) {
      if (method === 'GET') return await listItineraries(db);
      if (method === 'POST') return await createItinerary(request, db);
    }

    // GET/PUT/DELETE /api/v1/itineraries/:id
    match = matchRoute(`${API_PREFIX}/itineraries/:id`, path);
    if (match) {
      const { id } = match.params;
      if (method === 'GET') return await getItinerary(id, db);
      if (method === 'PUT') return await updateItinerary(id, request, db);
      if (method === 'DELETE') return await deleteItinerary(id, db);
    }

    // GET/POST /api/v1/itineraries/:iid/days
    match = matchRoute(`${API_PREFIX}/itineraries/:iid/days`, path);
    if (match) {
      const { iid } = match.params;
      if (method === 'GET') return await listDays(iid, db);
      if (method === 'POST') return await createDay(iid, request, db);
    }

    // GET/PUT/DELETE /api/v1/days/:id
    match = matchRoute(`${API_PREFIX}/days/:id`, path);
    if (match) {
      const { id } = match.params;
      if (method === 'GET') return await getDay(id, db);
      if (method === 'PUT') return await updateDay(id, request, db);
      if (method === 'DELETE') return await deleteDay(id, db);
    }

    // GET/POST /api/v1/days/:did/activities
    match = matchRoute(`${API_PREFIX}/days/:did/activities`, path);
    if (match) {
      const { did } = match.params;
      if (method === 'GET') return await listActivities(did, db);
      if (method === 'POST') return await createActivity(did, request, db);
    }

    // GET/PUT/DELETE /api/v1/activities/:id
    match = matchRoute(`${API_PREFIX}/activities/:id`, path);
    if (match) {
      const { id } = match.params;
      if (method === 'GET') return await getActivity(id, db);
      if (method === 'PUT') return await updateActivity(id, request, db);
      if (method === 'DELETE') return await deleteActivity(id, db);
    }

    return errorResponse('Not found', 404);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Invalid JSON body') {
      return errorResponse(message, 400);
    }
    return errorResponse(message, 500);
  }
}
