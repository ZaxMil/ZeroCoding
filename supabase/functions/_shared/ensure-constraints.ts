import { createClient } from 'jsr:@supabase/supabase-js@2';

let constraintsEnsured = false;

export async function ensureUniqueIndex(client: ReturnType<typeof createClient>, tableName: string, columnName: string) {
  if (constraintsEnsured) return; // Singleton guard
  
  try {
    // Create table if not exists
    await client.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS ${tableName} (
        event_id text PRIMARY KEY,
        received_at timestamptz default now()
      )`
    });
  } catch (error) {
    // Ignore "already exists" errors
    if (!error.message?.includes('already exists')) {
      console.warn(`Failed to create table ${tableName}:`, error);
    }
  }

  try {
    // Create unique index if not exists
    await client.rpc('exec_sql', {
      sql: `CREATE UNIQUE INDEX IF NOT EXISTS ${tableName}_${columnName}_idx ON ${tableName}(${columnName})`
    });
  } catch (error) {
    // Ignore "already exists" errors
    if (!error.message?.includes('already exists')) {
      console.warn(`Failed to create index on ${tableName}.${columnName}:`, error);
    }
  }

  constraintsEnsured = true;
}

export async function insertEventIdempotent(client: ReturnType<typeof createClient>, eventId: string): Promise<boolean> {
  try {
    const { error } = await client
      .from('webhook_events')
      .insert({ event_id: eventId });
    
    if (error) {
      if (error.code === '23505') { // unique_violation
        console.log('Duplicate event ignored:', eventId);
        return false; // Duplicate
      }
      throw error;
    }
    
    return true; // New event
  } catch (error) {
    console.error('Error inserting webhook event:', error);
    throw error;
  }
}