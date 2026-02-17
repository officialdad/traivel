import type {
  Activity,
  ActivityRow,
  DayRow,
  DayWithActivities,
  ItineraryRow,
  ItineraryWithDays,
  ReferenceLink,
} from '../types';

export const API_PREFIX = '/api/v1';

export function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

export function generateId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function parseBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error('Invalid JSON body');
  }
}

export function parseActivity(row: ActivityRow): Activity {
  let links: ReferenceLink[] = [];
  try {
    links = JSON.parse(row.reference_links || '[]');
  } catch {
    links = [];
  }
  return { ...row, reference_links: links };
}

export async function getDayWithActivities(
  db: D1Database,
  dayId: string
): Promise<DayWithActivities | null> {
  const day = await db
    .prepare('SELECT * FROM days WHERE id = ?')
    .bind(dayId)
    .first<DayRow>();
  if (!day) return null;

  const { results: activityRows } = await db
    .prepare('SELECT * FROM activities WHERE day_id = ? ORDER BY sort_order ASC, created_at ASC')
    .bind(dayId)
    .all<ActivityRow>();

  return {
    ...day,
    activities: (activityRows || []).map(parseActivity),
  };
}

export async function getItineraryWithNested(
  db: D1Database,
  itineraryId: string
): Promise<ItineraryWithDays | null> {
  const itinerary = await db
    .prepare('SELECT * FROM itineraries WHERE id = ?')
    .bind(itineraryId)
    .first<ItineraryRow>();
  if (!itinerary) return null;

  const { results: dayRows } = await db
    .prepare('SELECT * FROM days WHERE itinerary_id = ? ORDER BY day_number ASC')
    .bind(itineraryId)
    .all<DayRow>();

  const days: DayWithActivities[] = [];
  for (const dayRow of dayRows || []) {
    const { results: activityRows } = await db
      .prepare('SELECT * FROM activities WHERE day_id = ? ORDER BY sort_order ASC, created_at ASC')
      .bind(dayRow.id)
      .all<ActivityRow>();

    days.push({
      ...dayRow,
      activities: (activityRows || []).map(parseActivity),
    });
  }

  return { ...itinerary, days };
}
