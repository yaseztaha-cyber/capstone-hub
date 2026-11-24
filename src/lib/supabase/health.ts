import { createClient } from '@/lib/supabase/client';

export interface TableStatus {
  table: string;
  ok: boolean;
  hint: string;
}

export interface SyncStatus {
  checkedAt: string;
  signedIn: boolean;
  email: string | null;
  tables: TableStatus[];
  allOk: boolean;
}

const PROBE_TABLES = [
  'teams',
  'projects',
  'tasks',
  'budget_items',
  'meetings',
  'chat_messages',
  'share_links',
  'version_history',
  'advisor_feedback',
  'feedback',
  'audit_logs',
];

function hintFor(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('does not exist') || m.includes('relation') || m.includes('schema cache')) {
    return 'Table missing — run supabase/step3-extended.sql (after schema.sql).';
  }
  if (m.includes('row-level security') || m.includes('policy') || m.includes('permission')) {
    return 'Blocked by RLS — run the SQL migrations and sign in.';
  }
  if (m.includes('failed to fetch') || m.includes('network') || m.includes('load failed')) {
    return 'Network unreachable — check connection.';
  }
  if (m.includes('not configured') || m.includes('supabase_url') || m.includes('api key')) {
    return 'Supabase env keys missing — check .env.local.';
  }
  return message.slice(0, 120) || 'Probe failed.';
}

export async function checkCloudSync(): Promise<SyncStatus> {
  const tables: TableStatus[] = [];
  let signedIn = false;
  let email: string | null = null;
  try {
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      signedIn = !!user;
      email = user?.email ?? null;
    } catch {}
    for (const table of PROBE_TABLES) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error) {
          tables.push({ table, ok: false, hint: hintFor(error.message) });
        } else {
          tables.push({ table, ok: true, hint: 'OK' });
        }
      } catch (err: unknown) {
        tables.push({ table, ok: false, hint: hintFor(err instanceof Error ? err.message : 'Probe failed.') });
      }
    }
  } catch (err: unknown) {
    const hint = hintFor(err instanceof Error ? err.message : 'Supabase client failed.');
    for (const table of PROBE_TABLES) tables.push({ table, ok: false, hint });
  }
  return {
    checkedAt: new Date().toISOString(),
    signedIn,
    email,
    tables,
    allOk: tables.every((t) => t.ok),
  };
}
