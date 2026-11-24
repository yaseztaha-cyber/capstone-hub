import MiniSearch from 'minisearch';

export interface RagChunk {
  id: string;
  fileId: string;
  fileName: string;
  text: string;
}

export interface RagHit {
  fileName: string;
  text: string;
}

const CHUNK_CHARS = 900;
const OVERLAP_CHARS = 120;

// Split text into overlapping chunks at paragraph/line boundaries.
export function chunkText(fileId: string, fileName: string, text: string): RagChunk[] {
  const clean = text.replace(/\r/g, '').trim();
  if (!clean) return [];
  const chunks: RagChunk[] = [];
  let start = 0;
  let n = 0;
  while (start < clean.length) {
    let end = Math.min(start + CHUNK_CHARS, clean.length);
    if (end < clean.length) {
      const breakAt = Math.max(
        clean.lastIndexOf('\n\n', end),
        clean.lastIndexOf('\n', end),
        clean.lastIndexOf('. ', end)
      );
      if (breakAt > start + 200) end = breakAt + 1;
    }
    const piece = clean.slice(start, end).trim();
    if (piece) {
      chunks.push({ id: `${fileId}#${n++}`, fileId, fileName, text: piece });
    }
    if (end >= clean.length) break;
    start = Math.max(end - OVERLAP_CHARS, start + 1);
  }
  return chunks;
}

function normalizeTerm(term: string): string {
  return term
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u0652\u0640]/g, '');
}

export function buildRagIndex(chunks: RagChunk[]) {
  const ms = new MiniSearch<RagChunk>({
    fields: ['text', 'fileName'],
    storeFields: ['fileName', 'text'],
    processTerm: (term) => {
      const n = normalizeTerm(term);
      return n.length > 1 ? n : null;
    },
    searchOptions: { prefix: true, fuzzy: 0.2, boost: { fileName: 2 } },
  });
  ms.addAll(chunks);
  return ms;
}

// Retrieve top-k chunks; empty array means "not in the project" → refuse.
export function retrieve(
  index: ReturnType<typeof buildRagIndex>,
  question: string,
  k = 3
): RagHit[] {
  const q = question.trim();
  if (q.length < 2) return [];
  try {
    return index.search(q).slice(0, k).map((r) => ({
      fileName: String(r.fileName),
      text: String(r.text).slice(0, 1200),
    }));
  } catch {
    return [];
  }
}

function keyFor(projectId: string) {
  return `sch_rag_${projectId}`;
}

export function loadRagChunks(projectId: string): RagChunk[] {
  if (typeof window === 'undefined' || !projectId) return [];
  try {
    const raw = localStorage.getItem(keyFor(projectId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRagChunks(projectId: string, chunks: RagChunk[]) {
  if (typeof window === 'undefined' || !projectId) return;
  try {
    // Cap the local index so one giant upload can't blow the storage quota
    localStorage.setItem(keyFor(projectId), JSON.stringify(chunks.slice(0, 400)));
  } catch {}
}

export function clearRagIndex(projectId: string) {
  if (typeof window === 'undefined' || !projectId) return;
  try {
    localStorage.removeItem(keyFor(projectId));
  } catch {}
}
