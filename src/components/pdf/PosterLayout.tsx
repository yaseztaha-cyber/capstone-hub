'use client';

import { useAppStore } from '@/lib/store';
import { buildPosterData, type PosterBlockId } from '@/lib/poster';

interface PosterLayoutProps {
  blocks: PosterBlockId[];
  acknowledgements: string;
}

export default function PosterLayout({ blocks, acknowledgements }: PosterLayoutProps) {
  const { project, team, members, budgetItems, experiments, sources, issues } = useAppStore();

  if (!project) return null;

  const data = buildPosterData({ project, team, members, budgetItems, experiments, sources, issues });
  const visible = data.blocks.filter((b) => blocks.includes(b.id) && (b.hasContent || b.paragraphs.length > 0));
  const h = data.header;
  const meta = [h.school, h.grade, h.semester, h.year, h.teamName && `Team ${h.teamName}`, h.teamCode && `Group: ${h.teamCode}`].filter(Boolean).join(' | ');

  return (
    <div className="print-only poster-sheet">
      {/* Banner */}
      <div className="poster-banner">
        <h1 className="poster-title">{h.title}</h1>
        {meta && <p className="poster-meta">{meta}</p>}
        {h.members.length > 0 && (
          <p className="poster-members">{h.members.map((m) => m.name).join(' - ')}</p>
        )}
        {h.keywords.length > 0 && (
          <p className="poster-keywords">Keywords: {h.keywords.join(' - ')}</p>
        )}
      </div>

      {/* Body */}
      <div className="poster-body">
        {visible.map((b) => (
          <section key={b.id} className="poster-block">
            <h2 className="poster-heading">{b.title}</h2>
            {b.paragraphs.map((p, i) => (
              <p key={i} className="poster-text">{p}</p>
            ))}
            {b.table && (
              <table className="poster-table">
                <thead>
                  <tr>{b.table.head.map((c) => <th key={c}>{c}</th>)}</tr>
                </thead>
                <tbody>
                  {b.table.rows.map((row, i) => (
                    <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ))}

        {acknowledgements.trim() && (
          <section className="poster-block">
            <h2 className="poster-heading">Acknowledgement</h2>
            <p className="poster-text">{acknowledgements.trim()}</p>
          </section>
        )}

        {h.members.length > 0 && (
          <section className="poster-block">
            <h2 className="poster-heading">For Further Information</h2>
            {h.members.map((m) => (
              <p key={m.email || m.name} className="poster-text">
                • {m.name}{m.email ? ` — ${m.email}` : ''}
              </p>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
