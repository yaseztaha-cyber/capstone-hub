import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_CHARS = 24000;
const PARSEABLE = new Set(['txt', 'md', 'markdown', 'pdf']);

// Extracts machine-readable text from a project file for the knowledge index.
// Auth + team scoping enforced here (mirrors the storage RLS path convention
// "<project_id>/..."): a user can only extract files from their own teams.
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, storagePath, fileName } = body as {
      projectId?: string; storagePath?: string; fileName?: string;
    };
    if (!projectId || !storagePath || !fileName) {
      return NextResponse.json({ error: 'projectId, storagePath and fileName are required.' }, { status: 400 });
    }

    // Must be a member's project (RLS would deny otherwise; explicit 403 here)
    const { data: project, error: projErr } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();
    if (projErr || !project) {
      return NextResponse.json({ error: 'Project not found or not yours.' }, { status: 403 });
    }
    if (!storagePath.startsWith(`${projectId}/`)) {
      return NextResponse.json({ error: 'File is outside this project.' }, { status: 403 });
    }

    const ext = (fileName.split('.').pop() || '').toLowerCase();
    if (!PARSEABLE.has(ext)) {
      return NextResponse.json({ error: `“.${ext}” files have no extractable text yet.` }, { status: 400 });
    }

    const { data: blob, error: dlErr } = await supabase.storage
      .from('project-files')
      .download(storagePath);
    if (dlErr || !blob) {
      return NextResponse.json({ error: 'Could not download file.' }, { status: 404 });
    }
    if (blob.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large to index (max 15 MB).' }, { status: 400 });
    }

    let text = '';
    if (ext === 'pdf') {
      try {
        const mod = await import('pdf-parse');
        const parse = (mod as any).default || mod;
        const buf = Buffer.from(await blob.arrayBuffer());
        const parsed = await parse(buf);
        text = String(parsed?.text || '');
      } catch {
        return NextResponse.json({ error: 'Could not parse this PDF.' }, { status: 422 });
      }
    } else {
      text = await blob.text();
    }

    text = text.replace(/\r/g, '').trim();
    if (!text) {
      return NextResponse.json({ error: 'No extractable text (scanned-image PDFs have none).' }, { status: 422 });
    }
    const truncated = text.length > MAX_CHARS;
    return NextResponse.json({ text: text.slice(0, MAX_CHARS), chars: text.length, truncated });
  } catch {
    return NextResponse.json({ error: 'Extraction failed.' }, { status: 500 });
  }
}
