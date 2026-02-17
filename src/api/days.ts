import type { DayRow, CreateDayInput, UpdateDayInput } from '../types';
import {
  jsonResponse,
  errorResponse,
  generateId,
  parseBody,
  getDayWithActivities,
} from './helpers';

export async function listDays(
  itineraryId: string,
  db: D1Database
): Promise<Response> {
  const { results } = await db
    .prepare('SELECT * FROM days WHERE itinerary_id = ? ORDER BY day_number ASC')
    .bind(itineraryId)
    .all<DayRow>();
  return jsonResponse(results || []);
}

export async function createDay(
  itineraryId: string,
  request: Request,
  db: D1Database
): Promise<Response> {
  const itinerary = await db
    .prepare('SELECT id FROM itineraries WHERE id = ?')
    .bind(itineraryId)
    .first();
  if (!itinerary) return errorResponse('Itinerary not found', 404);

  const body = await parseBody<CreateDayInput>(request);
  if (body.day_number === undefined || body.day_number === null) {
    return errorResponse('day_number is required', 400);
  }

  const id = generateId();
  await db
    .prepare(
      `INSERT INTO days (id, itinerary_id, day_number, date, theme, ai_status, justification)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      itineraryId,
      body.day_number,
      body.date ?? null,
      body.theme ?? null,
      body.ai_status ?? 'ai_recommended',
      body.justification ?? null
    )
    .run();

  const created = await db
    .prepare('SELECT * FROM days WHERE id = ?')
    .bind(id)
    .first<DayRow>();
  return jsonResponse(created, 201);
}

export async function getDay(
  id: string,
  db: D1Database
): Promise<Response> {
  const day = await getDayWithActivities(db, id);
  if (!day) return errorResponse('Day not found', 404);
  return jsonResponse(day);
}

export async function updateDay(
  id: string,
  request: Request,
  db: D1Database
): Promise<Response> {
  const existing = await db
    .prepare('SELECT * FROM days WHERE id = ?')
    .bind(id)
    .first<DayRow>();
  if (!existing) return errorResponse('Day not found', 404);

  const body = await parseBody<UpdateDayInput>(request);

  await db
    .prepare(
      `UPDATE days SET
        day_number = ?, date = ?, theme = ?, ai_status = ?, justification = ?,
        updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(
      body.day_number ?? existing.day_number,
      body.date ?? existing.date,
      body.theme ?? existing.theme,
      body.ai_status ?? existing.ai_status,
      body.justification ?? existing.justification,
      id
    )
    .run();

  const updated = await db
    .prepare('SELECT * FROM days WHERE id = ?')
    .bind(id)
    .first<DayRow>();
  return jsonResponse(updated);
}

export async function deleteDay(
  id: string,
  db: D1Database
): Promise<Response> {
  const existing = await db
    .prepare('SELECT id FROM days WHERE id = ?')
    .bind(id)
    .first();
  if (!existing) return errorResponse('Day not found', 404);

  await db.prepare('DELETE FROM days WHERE id = ?').bind(id).run();
  return jsonResponse({ deleted: true });
}
