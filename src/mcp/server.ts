import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ItineraryRow, DayRow, ActivityRow } from '../types';
import {
  generateId,
  getItineraryWithNested,
  getDayWithActivities,
  parseActivity,
} from '../api/helpers';

export function createMcpServer(db: D1Database): McpServer {
  const server = new McpServer({
    name: 'traivel',
    version: '1.0.0',
  });

  // Tool 1: list_itineraries
  server.tool(
    'list_itineraries',
    'List all travel itineraries',
    {},
    async () => {
      const { results } = await db
        .prepare('SELECT * FROM itineraries ORDER BY created_at DESC')
        .all<ItineraryRow>();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(results || [], null, 2) }],
      };
    }
  );

  // Tool 2: get_itinerary
  server.tool(
    'get_itinerary',
    'Get a single itinerary with all nested days and activities',
    { id: z.string().describe('Itinerary ID') },
    async ({ id }) => {
      const itinerary = await getItineraryWithNested(db, id);
      if (!itinerary) {
        return { content: [{ type: 'text' as const, text: 'Itinerary not found' }], isError: true };
      }
      return { content: [{ type: 'text' as const, text: JSON.stringify(itinerary, null, 2) }] };
    }
  );

  // Tool 3: create_full_itinerary
  server.tool(
    'create_full_itinerary',
    'Create a complete itinerary with days and activities in one call',
    {
      title: z.string().describe('Itinerary title'),
      destination_country: z.string().describe('Destination country'),
      origin_country: z.string().optional().describe('Origin country'),
      origin_city: z.string().optional().describe('Origin city'),
      start_date: z.string().optional().describe('Start date (YYYY-MM-DD)'),
      end_date: z.string().optional().describe('End date (YYYY-MM-DD)'),
      duration_days: z.number().optional().describe('Number of days'),
      pax: z.number().optional().describe('Number of travelers'),
      place_of_stay: z.string().optional().describe('Hotel/accommodation'),
      currency: z.string().optional().describe('Local currency code'),
      language: z.string().optional().describe('Primary language'),
      culture_notes: z.string().optional().describe('Cultural considerations'),
      religion_notes: z.string().optional().describe('Religious considerations'),
      weather_notes: z.string().optional().describe('Weather/climate notes'),
      ai_status: z.enum(['ai_recommended', 'finalized', 'modified']).optional(),
      justification: z.string().optional(),
      days: z.array(z.object({
        day_number: z.number().describe('Day number (1-indexed)'),
        date: z.string().optional().describe('Date (YYYY-MM-DD)'),
        theme: z.string().optional().describe('Theme for the day'),
        ai_status: z.enum(['ai_recommended', 'finalized', 'modified']).optional(),
        justification: z.string().optional(),
        activities: z.array(z.object({
          name: z.string().describe('Activity name'),
          description: z.string().optional(),
          time_slot: z.string().optional().describe('Time slot (e.g., "09:00-11:00")'),
          estimated_cost: z.number().optional().describe('Cost in local currency'),
          category: z.enum([
            'transport', 'accommodation', 'food', 'sightseeing',
            'adventure', 'shopping', 'culture', 'relaxation', 'nightlife', 'other'
          ]).optional(),
          sort_order: z.number().optional(),
          notes: z.string().optional(),
          reference_links: z.array(z.object({
            url: z.string().describe('URL'),
            title: z.string().describe('Link title'),
          })).optional(),
          ai_status: z.enum(['ai_recommended', 'finalized', 'modified']).optional(),
          justification: z.string().optional(),
        })).optional(),
      })),
    },
    async (input) => {
      const itineraryId = generateId();
      const statements: D1PreparedStatement[] = [];

      statements.push(
        db.prepare(
          `INSERT INTO itineraries (id, title, destination_country, origin_country, origin_city,
            start_date, end_date, duration_days, pax, place_of_stay, currency, language,
            culture_notes, religion_notes, weather_notes, ai_status, justification)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          itineraryId, input.title, input.destination_country,
          input.origin_country ?? null, input.origin_city ?? null,
          input.start_date ?? null, input.end_date ?? null,
          input.duration_days ?? null, input.pax ?? 1,
          input.place_of_stay ?? null, input.currency ?? null,
          input.language ?? null, input.culture_notes ?? null,
          input.religion_notes ?? null, input.weather_notes ?? null,
          input.ai_status ?? 'ai_recommended', input.justification ?? null
        )
      );

      for (const day of input.days) {
        const dayId = generateId();
        statements.push(
          db.prepare(
            `INSERT INTO days (id, itinerary_id, day_number, date, theme, ai_status, justification)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            dayId, itineraryId, day.day_number,
            day.date ?? null, day.theme ?? null,
            day.ai_status ?? 'ai_recommended', day.justification ?? null
          )
        );

        for (const activity of day.activities || []) {
          const activityId = generateId();
          statements.push(
            db.prepare(
              `INSERT INTO activities (id, day_id, name, description, time_slot, estimated_cost,
                category, sort_order, notes, reference_links, ai_status, justification)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              activityId, dayId, activity.name,
              activity.description ?? null, activity.time_slot ?? null,
              activity.estimated_cost ?? null, activity.category ?? 'sightseeing',
              activity.sort_order ?? 0, activity.notes ?? null,
              JSON.stringify(activity.reference_links ?? []),
              activity.ai_status ?? 'ai_recommended', activity.justification ?? null
            )
          );
        }
      }

      await db.batch(statements);
      const result = await getItineraryWithNested(db, itineraryId);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool 4: update_itinerary
  server.tool(
    'update_itinerary',
    'Update itinerary metadata',
    {
      id: z.string().describe('Itinerary ID'),
      title: z.string().optional(),
      destination_country: z.string().optional(),
      origin_country: z.string().optional(),
      origin_city: z.string().optional(),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
      duration_days: z.number().optional(),
      pax: z.number().optional(),
      place_of_stay: z.string().optional(),
      currency: z.string().optional(),
      language: z.string().optional(),
      culture_notes: z.string().optional(),
      religion_notes: z.string().optional(),
      weather_notes: z.string().optional(),
      ai_status: z.enum(['ai_recommended', 'finalized', 'modified']).optional(),
      justification: z.string().optional(),
    },
    async ({ id, ...updates }) => {
      const existing = await db.prepare('SELECT * FROM itineraries WHERE id = ?').bind(id).first<ItineraryRow>();
      if (!existing) return { content: [{ type: 'text' as const, text: 'Itinerary not found' }], isError: true };

      await db.prepare(
        `UPDATE itineraries SET title=?, destination_country=?, origin_country=?, origin_city=?,
         start_date=?, end_date=?, duration_days=?, pax=?, place_of_stay=?, currency=?, language=?,
         culture_notes=?, religion_notes=?, weather_notes=?, ai_status=?, justification=?,
         updated_at=datetime('now') WHERE id=?`
      ).bind(
        updates.title ?? existing.title, updates.destination_country ?? existing.destination_country,
        updates.origin_country ?? existing.origin_country, updates.origin_city ?? existing.origin_city,
        updates.start_date ?? existing.start_date, updates.end_date ?? existing.end_date,
        updates.duration_days ?? existing.duration_days, updates.pax ?? existing.pax,
        updates.place_of_stay ?? existing.place_of_stay, updates.currency ?? existing.currency,
        updates.language ?? existing.language, updates.culture_notes ?? existing.culture_notes,
        updates.religion_notes ?? existing.religion_notes, updates.weather_notes ?? existing.weather_notes,
        updates.ai_status ?? existing.ai_status, updates.justification ?? existing.justification, id
      ).run();

      const updated = await db.prepare('SELECT * FROM itineraries WHERE id = ?').bind(id).first<ItineraryRow>();
      return { content: [{ type: 'text' as const, text: JSON.stringify(updated, null, 2) }] };
    }
  );

  // Tool 5: delete_itinerary
  server.tool(
    'delete_itinerary',
    'Delete an itinerary and all its days and activities',
    { id: z.string().describe('Itinerary ID') },
    async ({ id }) => {
      const existing = await db.prepare('SELECT id FROM itineraries WHERE id = ?').bind(id).first();
      if (!existing) return { content: [{ type: 'text' as const, text: 'Itinerary not found' }], isError: true };
      await db.prepare('DELETE FROM itineraries WHERE id = ?').bind(id).run();
      return { content: [{ type: 'text' as const, text: `Deleted itinerary ${id}` }] };
    }
  );

  // Tool 6: add_day
  server.tool(
    'add_day',
    'Add a day to an itinerary',
    {
      itinerary_id: z.string().describe('Itinerary ID'),
      day_number: z.number().describe('Day number'),
      date: z.string().optional(),
      theme: z.string().optional(),
      ai_status: z.enum(['ai_recommended', 'finalized', 'modified']).optional(),
      justification: z.string().optional(),
    },
    async ({ itinerary_id, ...day }) => {
      const itin = await db.prepare('SELECT id FROM itineraries WHERE id = ?').bind(itinerary_id).first();
      if (!itin) return { content: [{ type: 'text' as const, text: 'Itinerary not found' }], isError: true };

      const id = generateId();
      await db.prepare(
        `INSERT INTO days (id, itinerary_id, day_number, date, theme, ai_status, justification)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id, itinerary_id, day.day_number, day.date ?? null, day.theme ?? null,
        day.ai_status ?? 'ai_recommended', day.justification ?? null
      ).run();

      const created = await db.prepare('SELECT * FROM days WHERE id = ?').bind(id).first<DayRow>();
      return { content: [{ type: 'text' as const, text: JSON.stringify(created, null, 2) }] };
    }
  );

  // Tool 7: update_day
  server.tool(
    'update_day',
    'Update a day',
    {
      id: z.string().describe('Day ID'),
      day_number: z.number().optional(),
      date: z.string().optional(),
      theme: z.string().optional(),
      ai_status: z.enum(['ai_recommended', 'finalized', 'modified']).optional(),
      justification: z.string().optional(),
    },
    async ({ id, ...updates }) => {
      const existing = await db.prepare('SELECT * FROM days WHERE id = ?').bind(id).first<DayRow>();
      if (!existing) return { content: [{ type: 'text' as const, text: 'Day not found' }], isError: true };

      await db.prepare(
        `UPDATE days SET day_number=?, date=?, theme=?, ai_status=?, justification=?,
         updated_at=datetime('now') WHERE id=?`
      ).bind(
        updates.day_number ?? existing.day_number, updates.date ?? existing.date,
        updates.theme ?? existing.theme, updates.ai_status ?? existing.ai_status,
        updates.justification ?? existing.justification, id
      ).run();

      const updated = await db.prepare('SELECT * FROM days WHERE id = ?').bind(id).first<DayRow>();
      return { content: [{ type: 'text' as const, text: JSON.stringify(updated, null, 2) }] };
    }
  );

  // Tool 8: delete_day
  server.tool(
    'delete_day',
    'Delete a day and all its activities',
    { id: z.string().describe('Day ID') },
    async ({ id }) => {
      const existing = await db.prepare('SELECT id FROM days WHERE id = ?').bind(id).first();
      if (!existing) return { content: [{ type: 'text' as const, text: 'Day not found' }], isError: true };
      await db.prepare('DELETE FROM days WHERE id = ?').bind(id).run();
      return { content: [{ type: 'text' as const, text: `Deleted day ${id}` }] };
    }
  );

  // Tool 9: add_activity
  server.tool(
    'add_activity',
    'Add an activity to a day',
    {
      day_id: z.string().describe('Day ID'),
      name: z.string().describe('Activity name'),
      description: z.string().optional(),
      time_slot: z.string().optional(),
      estimated_cost: z.number().optional(),
      category: z.enum([
        'transport', 'accommodation', 'food', 'sightseeing',
        'adventure', 'shopping', 'culture', 'relaxation', 'nightlife', 'other'
      ]).optional(),
      sort_order: z.number().optional(),
      notes: z.string().optional(),
      reference_links: z.array(z.object({
        url: z.string(), title: z.string(),
      })).optional(),
      ai_status: z.enum(['ai_recommended', 'finalized', 'modified']).optional(),
      justification: z.string().optional(),
    },
    async ({ day_id, ...activity }) => {
      const day = await db.prepare('SELECT id FROM days WHERE id = ?').bind(day_id).first();
      if (!day) return { content: [{ type: 'text' as const, text: 'Day not found' }], isError: true };

      const id = generateId();
      await db.prepare(
        `INSERT INTO activities (id, day_id, name, description, time_slot, estimated_cost,
          category, sort_order, notes, reference_links, ai_status, justification)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id, day_id, activity.name, activity.description ?? null,
        activity.time_slot ?? null, activity.estimated_cost ?? null,
        activity.category ?? 'sightseeing', activity.sort_order ?? 0,
        activity.notes ?? null, JSON.stringify(activity.reference_links ?? []),
        activity.ai_status ?? 'ai_recommended', activity.justification ?? null
      ).run();

      const created = await db.prepare('SELECT * FROM activities WHERE id = ?').bind(id).first<ActivityRow>();
      return { content: [{ type: 'text' as const, text: JSON.stringify(created ? parseActivity(created) : null, null, 2) }] };
    }
  );

  // Tool 10: update_activity
  server.tool(
    'update_activity',
    'Update an activity',
    {
      id: z.string().describe('Activity ID'),
      name: z.string().optional(),
      description: z.string().optional(),
      time_slot: z.string().optional(),
      estimated_cost: z.number().optional(),
      category: z.enum([
        'transport', 'accommodation', 'food', 'sightseeing',
        'adventure', 'shopping', 'culture', 'relaxation', 'nightlife', 'other'
      ]).optional(),
      sort_order: z.number().optional(),
      notes: z.string().optional(),
      reference_links: z.array(z.object({
        url: z.string(), title: z.string(),
      })).optional(),
      ai_status: z.enum(['ai_recommended', 'finalized', 'modified']).optional(),
      justification: z.string().optional(),
    },
    async ({ id, ...updates }) => {
      const existing = await db.prepare('SELECT * FROM activities WHERE id = ?').bind(id).first<ActivityRow>();
      if (!existing) return { content: [{ type: 'text' as const, text: 'Activity not found' }], isError: true };

      const referenceLinks = updates.reference_links !== undefined
        ? JSON.stringify(updates.reference_links)
        : existing.reference_links;

      await db.prepare(
        `UPDATE activities SET name=?, description=?, time_slot=?, estimated_cost=?,
         category=?, sort_order=?, notes=?, reference_links=?, ai_status=?, justification=?,
         updated_at=datetime('now') WHERE id=?`
      ).bind(
        updates.name ?? existing.name, updates.description ?? existing.description,
        updates.time_slot ?? existing.time_slot, updates.estimated_cost ?? existing.estimated_cost,
        updates.category ?? existing.category, updates.sort_order ?? existing.sort_order,
        updates.notes ?? existing.notes, referenceLinks,
        updates.ai_status ?? existing.ai_status, updates.justification ?? existing.justification, id
      ).run();

      const updated = await db.prepare('SELECT * FROM activities WHERE id = ?').bind(id).first<ActivityRow>();
      return { content: [{ type: 'text' as const, text: JSON.stringify(updated ? parseActivity(updated) : null, null, 2) }] };
    }
  );

  // Tool 11: delete_activity
  server.tool(
    'delete_activity',
    'Delete an activity',
    { id: z.string().describe('Activity ID') },
    async ({ id }) => {
      const existing = await db.prepare('SELECT id FROM activities WHERE id = ?').bind(id).first();
      if (!existing) return { content: [{ type: 'text' as const, text: 'Activity not found' }], isError: true };
      await db.prepare('DELETE FROM activities WHERE id = ?').bind(id).run();
      return { content: [{ type: 'text' as const, text: `Deleted activity ${id}` }] };
    }
  );

  // Tool 12: finalize_all
  server.tool(
    'finalize_all',
    'Mark all items in an itinerary as finalized',
    { itinerary_id: z.string().describe('Itinerary ID') },
    async ({ itinerary_id }) => {
      const existing = await db.prepare('SELECT id FROM itineraries WHERE id = ?').bind(itinerary_id).first();
      if (!existing) return { content: [{ type: 'text' as const, text: 'Itinerary not found' }], isError: true };

      await db.batch([
        db.prepare("UPDATE itineraries SET ai_status = 'finalized', updated_at = datetime('now') WHERE id = ?").bind(itinerary_id),
        db.prepare("UPDATE days SET ai_status = 'finalized', updated_at = datetime('now') WHERE itinerary_id = ?").bind(itinerary_id),
        db.prepare(
          "UPDATE activities SET ai_status = 'finalized', updated_at = datetime('now') WHERE day_id IN (SELECT id FROM days WHERE itinerary_id = ?)"
        ).bind(itinerary_id),
      ]);

      const result = await getItineraryWithNested(db, itinerary_id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  return server;
}
