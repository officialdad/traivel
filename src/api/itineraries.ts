import type {
  ItineraryRow,
  CreateItineraryInput,
  UpdateItineraryInput,
  CreateFullItineraryInput,
} from '../types';
import {
  jsonResponse,
  errorResponse,
  generateId,
  parseBody,
  getItineraryWithNested,
} from './helpers';

export async function listItineraries(db: D1Database): Promise<Response> {
  const { results } = await db
    .prepare('SELECT * FROM itineraries ORDER BY created_at DESC')
    .all<ItineraryRow>();
  return jsonResponse(results || []);
}

export async function createItinerary(
  request: Request,
  db: D1Database
): Promise<Response> {
  const body = await parseBody<CreateItineraryInput>(request);
  if (!body.title || !body.destination_country) {
    return errorResponse('title and destination_country are required', 400);
  }

  const id = generateId();
  await db
    .prepare(
      `INSERT INTO itineraries (id, title, destination_country, origin_country, origin_city,
        start_date, end_date, duration_days, pax, place_of_stay, currency, language,
        culture_notes, religion_notes, weather_notes, destination_city, origin_currency,
        origin_language, ai_status, justification)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      body.title,
      body.destination_country,
      body.origin_country ?? null,
      body.origin_city ?? null,
      body.start_date ?? null,
      body.end_date ?? null,
      body.duration_days ?? null,
      body.pax ?? 1,
      body.place_of_stay ?? null,
      body.currency ?? null,
      body.language ?? null,
      body.culture_notes ?? null,
      body.religion_notes ?? null,
      body.weather_notes ?? null,
      body.destination_city ?? null,
      body.origin_currency ?? null,
      body.origin_language ?? null,
      body.ai_status ?? 'ai_recommended',
      body.justification ?? null
    )
    .run();

  const created = await db
    .prepare('SELECT * FROM itineraries WHERE id = ?')
    .bind(id)
    .first<ItineraryRow>();
  return jsonResponse(created, 201);
}

export async function getItinerary(
  id: string,
  db: D1Database
): Promise<Response> {
  const itinerary = await getItineraryWithNested(db, id);
  if (!itinerary) return errorResponse('Itinerary not found', 404);
  return jsonResponse(itinerary);
}

export async function updateItinerary(
  id: string,
  request: Request,
  db: D1Database
): Promise<Response> {
  const existing = await db
    .prepare('SELECT * FROM itineraries WHERE id = ?')
    .bind(id)
    .first<ItineraryRow>();
  if (!existing) return errorResponse('Itinerary not found', 404);

  const body = await parseBody<UpdateItineraryInput>(request);

  await db
    .prepare(
      `UPDATE itineraries SET
        title = ?, destination_country = ?, origin_country = ?, origin_city = ?,
        start_date = ?, end_date = ?, duration_days = ?, pax = ?, place_of_stay = ?,
        currency = ?, language = ?, culture_notes = ?, religion_notes = ?, weather_notes = ?,
        destination_city = ?, origin_currency = ?, origin_language = ?,
        ai_status = ?, justification = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
    .bind(
      body.title ?? existing.title,
      body.destination_country ?? existing.destination_country,
      body.origin_country ?? existing.origin_country,
      body.origin_city ?? existing.origin_city,
      body.start_date ?? existing.start_date,
      body.end_date ?? existing.end_date,
      body.duration_days ?? existing.duration_days,
      body.pax ?? existing.pax,
      body.place_of_stay ?? existing.place_of_stay,
      body.currency ?? existing.currency,
      body.language ?? existing.language,
      body.culture_notes ?? existing.culture_notes,
      body.religion_notes ?? existing.religion_notes,
      body.weather_notes ?? existing.weather_notes,
      body.destination_city ?? existing.destination_city,
      body.origin_currency ?? existing.origin_currency,
      body.origin_language ?? existing.origin_language,
      body.ai_status ?? existing.ai_status,
      body.justification ?? existing.justification,
      id
    )
    .run();

  const updated = await db
    .prepare('SELECT * FROM itineraries WHERE id = ?')
    .bind(id)
    .first<ItineraryRow>();
  return jsonResponse(updated);
}

export async function deleteItinerary(
  id: string,
  db: D1Database
): Promise<Response> {
  const existing = await db
    .prepare('SELECT id FROM itineraries WHERE id = ?')
    .bind(id)
    .first();
  if (!existing) return errorResponse('Itinerary not found', 404);

  await db.prepare('DELETE FROM itineraries WHERE id = ?').bind(id).run();
  return jsonResponse({ deleted: true });
}

export async function createFullItinerary(
  request: Request,
  db: D1Database
): Promise<Response> {
  const body = await parseBody<CreateFullItineraryInput>(request);
  if (!body.title || !body.destination_country) {
    return errorResponse('title and destination_country are required', 400);
  }

  const itineraryId = generateId();
  const statements: D1PreparedStatement[] = [];

  statements.push(
    db
      .prepare(
        `INSERT INTO itineraries (id, title, destination_country, origin_country, origin_city,
          start_date, end_date, duration_days, pax, place_of_stay, currency, language,
          culture_notes, religion_notes, weather_notes, destination_city, origin_currency,
          origin_language, ai_status, justification)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        itineraryId,
        body.title,
        body.destination_country,
        body.origin_country ?? null,
        body.origin_city ?? null,
        body.start_date ?? null,
        body.end_date ?? null,
        body.duration_days ?? null,
        body.pax ?? 1,
        body.place_of_stay ?? null,
        body.currency ?? null,
        body.language ?? null,
        body.culture_notes ?? null,
        body.religion_notes ?? null,
        body.weather_notes ?? null,
        body.destination_city ?? null,
        body.origin_currency ?? null,
        body.origin_language ?? null,
        body.ai_status ?? 'ai_recommended',
        body.justification ?? null
      )
  );

  for (const day of body.days || []) {
    const dayId = generateId();
    statements.push(
      db
        .prepare(
          `INSERT INTO days (id, itinerary_id, day_number, date, theme, ai_status, justification)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          dayId,
          itineraryId,
          day.day_number,
          day.date ?? null,
          day.theme ?? null,
          day.ai_status ?? 'ai_recommended',
          day.justification ?? null
        )
    );

    for (const activity of day.activities || []) {
      const activityId = generateId();
      statements.push(
        db
          .prepare(
            `INSERT INTO activities (id, day_id, name, description, time_slot, estimated_cost,
              category, sort_order, notes, reference_links, ai_status, justification)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            activityId,
            dayId,
            activity.name,
            activity.description ?? null,
            activity.time_slot ?? null,
            activity.estimated_cost ?? null,
            activity.category ?? 'sightseeing',
            activity.sort_order ?? 0,
            activity.notes ?? null,
            JSON.stringify(activity.reference_links ?? []),
            activity.ai_status ?? 'ai_recommended',
            activity.justification ?? null
          )
      );
    }
  }

  await db.batch(statements);

  const result = await getItineraryWithNested(db, itineraryId);
  return jsonResponse(result, 201);
}
