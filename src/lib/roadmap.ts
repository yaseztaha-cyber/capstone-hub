// Best-effort parse of AI build-roadmap replies into stages.
// Accepts "1. Title - objective", "Stage 2: Title", "- Title: objective".
export interface ParsedStage {
  title: string;
  objective: string;
}

export function parseBuildStages(raw: string): ParsedStage[] {
  const out: ParsedStage[] = [];
  for (const line of raw.split('\n')) {
    const t = line.trim().replace(/^#{1,3}\s*/, '');
    if (!t) continue;
    const m = t.match(/^(?:stage\s*\d+|step\s*\d+|\d+|[•\-\*])\s*[:\-–.)]?\s*(.+)$/i);
    if (!m) continue;
    const body = m[1].trim();
    if (!body) continue;
    const sep = body.search(/\s+[-–:]\s+/);
    if (sep > 0) {
      out.push({
        title: body.slice(0, sep).trim().slice(0, 120),
        objective: body.slice(sep).trim().replace(/^[-–:]\s*/, '').trim().slice(0, 500),
      });
    } else {
      const colon = body.match(/^([^:]{1,80}):\s*(.+)$/);
      if (colon) {
        out.push({ title: colon[1].trim().slice(0, 120), objective: colon[2].trim().slice(0, 500) });
      } else {
        out.push({ title: body.slice(0, 120), objective: '' });
      }
    }
    if (out.length >= 10) break;
  }
  return out.filter((s) => s.title.length > 0);
}
