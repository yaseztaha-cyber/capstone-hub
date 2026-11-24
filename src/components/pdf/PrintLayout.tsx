'use client';

import { useAppStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import type { Locale } from '@/lib/types';

interface PrintLayoutProps {
  sections: string[];
  locale: Locale;
}

export default function PrintLayout({ sections, locale }: PrintLayoutProps) {
  const { project, team, members, sources, decisions, issues, files, logbook, milestones, tasks } = useAppStore();

  if (!project) return null;

  const isRTL = locale === 'ar';

  const sectionLabels: Record<string, { en: string; ar: string }> = {
    overview: { en: 'Overview', ar: 'نظرة عامة' },
    problem: { en: 'Problem Statement', ar: 'بيان المشكلة' },
    research: { en: 'Research & Literature', ar: 'البحث والأدبيات' },
    scientific: { en: 'Scientific Principles', ar: 'المبادئ العلمية' },
    design: { en: 'Design Requirements', ar: 'متطلبات التصميم' },
    prototype: { en: 'Prototype', ar: 'النموذج الأولي' },
    testing: { en: 'Testing & Experimentation', ar: 'الاختبار والتجربة' },
    results: { en: 'Results & Analysis', ar: 'النتائج والتحليل' },
    conclusion: { en: 'Conclusion', ar: 'الخاتمة' },
    grandchallenge: { en: 'Grand Challenge', ar: 'التحدي الكبير' },
  };

  const sectionFields: Record<string, { label: string; value: string }[]> = {
    overview: [
      { label: 'Project Title', value: project.title },
      { label: 'Problem Statement', value: project.problemStatement },
      { label: 'Engineering Objective', value: project.engineeringObjective },
      { label: 'Expected Solution', value: project.expectedSolution },
      { label: 'Constraints', value: project.constraints },
      { label: 'Important Materials', value: project.importantMaterials },
      { label: 'Current Stage', value: project.currentStage },
      { label: 'Project Health', value: project.health.replace('_', ' ') },
    ],
    problem: [
      { label: 'Problem Statement', value: project.problemStatement },
      { label: 'Constraints', value: project.constraints },
    ],
    research: [],
    scientific: [
      { label: 'Scientific Principles', value: project.scientificPrinciples },
    ],
    design: [
      { label: 'Engineering Objective', value: project.engineeringObjective },
      { label: 'Important Materials', value: project.importantMaterials },
    ],
    prototype: [
      { label: 'Expected Solution', value: project.expectedSolution },
    ],
    testing: [
      { label: 'Testing Plan', value: project.testingPlan },
      { label: 'Testing Results', value: project.testingResults },
    ],
    results: [
      { label: 'Results & Analysis', value: project.resultsAnalysis },
    ],
    conclusion: [
      { label: 'Conclusion', value: project.conclusion },
    ],
    grandchallenge: [
      { label: 'Selected Grand Challenge', value: project.grandChallenge },
      { label: 'Connection to Project', value: project.grandChallengeConnection },
    ],
  };

  const teamName = team?.name || 'STEM Capstone Team';
  const school = project.school || members[0]?.user.school || '';
  const today = new Date().toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const sectionFiles = (sectionId: string) =>
    files.filter(f => f.linkedProjectSection === sectionId);

  const completedMilestones = milestones.filter(m => m.isCompleted);

  return (
    <div className="print-only" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Cover Page */}
      <div className="print-cover">
        <div className="print-cover-content">
          <div className="print-school-badge">STEM Capstone Hub</div>
          <h1 className="print-project-title">{project.title}</h1>
          <div className="print-meta-line">
            <span>{teamName}</span>
            {school && <span> — {school}</span>}
          </div>
          <div className="print-meta-line print-date">{today}</div>
          {project.semester && (
            <div className="print-meta-line">{project.semester}</div>
          )}
          {project.grade && (
            <div className="print-meta-line">Grade: {project.grade}</div>
          )}
        </div>
      </div>

      {/* Table of Contents */}
      {sections.length > 1 && (
        <div className="print-toc">
          <h2 className="print-section-heading">Table of Contents</h2>
          <ul className="print-toc-list">
            {sections.map((s, i) => (
              <li key={s} className="print-toc-item">
                <span>{i + 1}. {sectionLabels[s]?.[locale] || sectionLabels[s]?.en || s}</span>
              </li>
            ))}
            {completedMilestones.length > 0 && (
              <li className="print-toc-item">
                <span>{sections.length + 1}. Milestones</span>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Project Sections */}
      {sections.map((sectionId, idx) => {
        const label = sectionLabels[sectionId]?.[locale] || sectionLabels[sectionId]?.en || sectionId;
        const fields = sectionFields[sectionId] || [];
        const filesForSection = sectionFiles(sectionId);

        if (sectionId === 'research') {
          return (
            <div key={sectionId} className="print-section">
              <h2 className="print-section-heading">{idx + 1}. {label}</h2>
              {sources.length === 0 ? (
                <p className="print-empty">No research sources added.</p>
              ) : (
                <div className="print-sources">
                  {sources.map((source, si) => (
                    <div key={source.id} className="print-source-item">
                      <div className="print-source-number">[{si + 1}]</div>
                      <div className="print-source-details">
                        <div className="print-source-title">{source.title}</div>
                        <div className="print-source-authors">{source.authors} ({source.year})</div>
                        {source.apaCitation && (
                          <div className="print-source-citation">{source.apaCitation}</div>
                        )}
                        {source.notes && (
                          <div className="print-source-notes">{source.notes}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {filesForSection.length > 0 && (
                <div className="print-files-section">
                  <h3 className="print-sub-heading">Attached Files</h3>
                  {filesForSection.map(f => (
                    <div key={f.id} className="print-file-item">
                      {f.name} ({(f.size / 1024).toFixed(0)} KB)
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        if (sectionId === 'overview') {
          return (
            <div key={sectionId} className="print-section">
              <h2 className="print-section-heading">{idx + 1}. {label}</h2>
              <div className="print-overview-grid">
                {fields.map(field => (
                  field.value ? (
                    <div key={field.label} className="print-field">
                      <div className="print-field-label">{field.label}</div>
                      <div className="print-field-value">{field.value}</div>
                    </div>
                  ) : null
                ))}
              </div>
              {milestones.length > 0 && (
                <div className="print-milestones">
                  <h3 className="print-sub-heading">Milestones</h3>
                  {milestones.map(ms => (
                    <div key={ms.id} className="print-milestone-item">
                      <span className={ms.isCompleted ? 'print-check' : 'print-uncheck'}>
                        {ms.isCompleted ? '[x]' : '[ ]'}
                      </span>
                      <span className="print-milestone-name">{ms.name}</span>
                      <span className="print-milestone-date">
                        {formatDate(ms.officialDeadline)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {filesForSection.length > 0 && (
                <div className="print-files-section">
                  <h3 className="print-sub-heading">Attached Files</h3>
                  {filesForSection.map(f => (
                    <div key={f.id} className="print-file-item">
                      {f.name} ({(f.size / 1024).toFixed(0)} KB)
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        if (sectionId === 'design') {
          return (
            <div key={sectionId} className="print-section">
              <h2 className="print-section-heading">{idx + 1}. {label}</h2>
              {fields.map(field => (
                field.value ? (
                  <div key={field.label} className="print-field">
                    <div className="print-field-label">{field.label}</div>
                    <div className="print-field-value">{field.value}</div>
                  </div>
                ) : null
              ))}
              {decisions.length > 0 && (
                <div className="print-decisions">
                  <h3 className="print-sub-heading">Design Decisions</h3>
                  {decisions.map(dec => (
                    <div key={dec.id} className="print-decision-item">
                      <div className="print-decision-title">{dec.decision}</div>
                      {dec.reason && <div className="print-decision-reason">{dec.reason}</div>}
                      {dec.alternativesConsidered.length > 0 && (
                        <div className="print-decision-alternatives">
                          Alternatives: {dec.alternativesConsidered.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {filesForSection.length > 0 && (
                <div className="print-files-section">
                  <h3 className="print-sub-heading">Attached Files</h3>
                  {filesForSection.map(f => (
                    <div key={f.id} className="print-file-item">
                      {f.name} ({(f.size / 1024).toFixed(0)} KB)
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        if (sectionId === 'testing') {
          const testingTasks = tasks.filter(t => t.stage === 'testing');
          return (
            <div key={sectionId} className="print-section">
              <h2 className="print-section-heading">{idx + 1}. {label}</h2>
              {fields.map(field => (
                field.value ? (
                  <div key={field.label} className="print-field">
                    <div className="print-field-label">{field.label}</div>
                    <div className="print-field-value">{field.value}</div>
                  </div>
                ) : null
              ))}
              {testingTasks.length > 0 && (
                <div className="print-tasks">
                  <h3 className="print-sub-heading">Testing Tasks</h3>
                  {testingTasks.map(task => (
                    <div key={task.id} className="print-task-item">
                      <span className={task.status === 'completed' ? 'print-check' : 'print-uncheck'}>
                        {task.status === 'completed' ? '[x]' : '[ ]'}
                      </span>
                      <span className="print-task-title">{task.title}</span>
                    </div>
                  ))}
                </div>
              )}
              {filesForSection.length > 0 && (
                <div className="print-files-section">
                  <h3 className="print-sub-heading">Attached Files</h3>
                  {filesForSection.map(f => (
                    <div key={f.id} className="print-file-item">
                      {f.name} ({(f.size / 1024).toFixed(0)} KB)
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return (
          <div key={sectionId} className="print-section">
            <h2 className="print-section-heading">{idx + 1}. {label}</h2>
            {fields.map(field => (
              field.value ? (
                <div key={field.label} className="print-field">
                  <div className="print-field-label">{field.label}</div>
                  <div className="print-field-value">{field.value}</div>
                </div>
              ) : null
            ))}
            {filesForSection.length > 0 && (
              <div className="print-files-section">
                <h3 className="print-sub-heading">Attached Files</h3>
                {filesForSection.map(f => (
                  <div key={f.id} className="print-file-item">
                    {f.name} ({(f.size / 1024).toFixed(0)} KB)
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Milestones appendix if not in overview */}
      {!sections.includes('overview') && completedMilestones.length > 0 && (
        <div className="print-section">
          <h2 className="print-section-heading">Milestones</h2>
          {completedMilestones.map(ms => (
            <div key={ms.id} className="print-milestone-item">
              <span className="print-check">[x]</span>
              <span className="print-milestone-name">{ms.name}</span>
              <span className="print-milestone-date">{formatDate(ms.officialDeadline)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Appendix: All Files */}
      {files.length > 0 && (
        <div className="print-section">
          <h2 className="print-section-heading">Appendix: File Inventory</h2>
          <table className="print-file-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Category</th>
                <th>Size</th>
                <th>Upload Date</th>
              </tr>
            </thead>
            <tbody>
              {files.map(f => (
                <tr key={f.id}>
                  <td>{f.name}</td>
                  <td>{f.category}</td>
                  <td>{(f.size / 1024).toFixed(0)} KB</td>
                  <td>{formatDate(f.uploadDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="print-footer">
        <div>Generated by STEM Capstone Hub</div>
        <div>{today}</div>
      </div>
    </div>
  );
}
