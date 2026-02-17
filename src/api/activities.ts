import type { ActivityRow, CreateActivityInput, UpdateActivityInput } from '../types';
import {
  jsonResponse,
  errorResponse,
  generateId,
  parseBody,
  parseActivity,
} from './helpers';

export async function listActivities(
  dayId: string,
  db: D1Database
): Promise<Response> {
  const { results } = await db
    .prepare('SELECT * FROM activities WHERE day_id = ? ORDER BY sort_order ASC, created_at ASC')
    .bind(dayId)
    .all<ActivityRow>();
  return jsonResponse((results || []).map(parseActivity));
}

export async function createActivity(
  dayId: string,
  request: Request,
  db: D1Database
): Promise<Response> {
  const day = await db
    .prepare('SELECT id FROM days WHERE id = ?')
    .bind(dayId)
    .first();
  if (!day) return errorResponse('Day not found', 404);

  const body = await parseBody<CreateActivityInput>(request);
  if (!body.name) {
    return errorResponse('name is required', 400);
  }

  const id = generateId();
  await db
    .prepare(
      `INSERT INTO activities (id, day_id, name, description, time_slot, estimated_cost,
        category, sort_order, notes, reference_links, ai_status, justification)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      dayId,
      body.name,
      body.description ?? null,
      body.time_slot ?? null,
      body.estimated_cost ?? null,
      body.category ?? 'sightseeing',
      body.sort_order ?? 0,
      body.notes ?? null,
      JSON.stringify(body.reference_links ?? []),
      body.ai_status ?? 'ai_recommended',
      body.justification ?? null
    )
    .run();

  const created = await db
    .prepare('SELECT * FROM activities WHERE id = ?')
    .bind(id)
    .first<ActivityRow>();
  return jsonResponse(created ? parseActivity(created) : null, 201);
}

export async function getActivity(
  id: string,
  db: D1Database
): Promise<Response> {
  const row = await db
    .prepare('SELECT * FROM activities WHERE id = ?')
    .bind(id)
    .first<ActivityRow>();
  if (!row) return errorResponse('Activity not found', 404);
  return jsonResponse(parseActivity(row));
}

export async function updateActivity(
  id: string,
  request: Request,
  db: D1Database
): Promise<Response> {
  const existing = await db
    .prepare('SELECT * FROM activities WHERE id = ?')
    .bind(id)
    .first<ActivityRow>();
  if (!existing) return errorResponse('Activity not found', 404);

  const body = await parseBody<UpdateActivityInput>(request);

  const referenceLinks =
    body.reference_links !== undefined
      ? JSON.stringify(body.reference_links)
      : existing.reference_links;

  await db
    .prepare(
      `UPDATE activities SET
        name = ?, description = ?, time_slot = ?, estimated_cost = ?,
        category = ?, sort_order = ?, notes = ?, reference_links = ?,
        ai_status = ?, justification = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(
      body.name ?? existing.name,
      body.description ?? existing.description,
      body.time_slot ?? existing.time_slot,
      body.estimated_cost ?? existing.estimated_cost,
      body.category ?? existing.category,
      body.sort_order ?? existing.sort_order,
      body.notes ?? existing.notes,
      referenceLinks,
      body.ai_status ?? existing.ai_status,
      body.justification ?? existing.justification,
      id
    )
    .run();

  const updated = await db
    .prepare('SELECT * FROM activities WHERE id = ?')
    .bind(id)
    .first<ActivityRow>();
  return jsonResponse(updated ? parseActivity(updated) : null);
}

export async function deleteActivity(
  id: string,
  db: D1Database
): Promise<Response> {
  const existing = await db
    .prepare('SELECT id FROM activities WHERE id = ?')
    .bind(id)
    .first();
  if (!existing) return errorResponse('Activity not found', 404);

  await db.prepare('DELETE FROM activities WHERE id = ?').bind(id).run();
  return jsonResponse({ deleted: true });
}
