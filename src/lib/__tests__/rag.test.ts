import { describe, it, expect } from 'vitest';
import { chunkText, buildRagIndex, retrieve } from '@/lib/rag';

describe('rag chunking', () => {
  it('returns no chunks for empty text', () => {
    expect(chunkText('f1', 'a.txt', '   ')).toEqual([]);
  });

  it('splits long text into overlapping chunks', () => {
    const text = Array.from({ length: 60 }, (_, i) => `Sentence number ${i} about solar calibration testing.`).join(' ');
    const chunks = chunkText('f1', 'notes.txt', text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].fileName).toBe('notes.txt');
    expect(chunks.every((c) => c.text.length <= 950)).toBe(true);
  });
});

describe('rag retrieval', () => {
  const chunks = [
    ...chunkText('f1', 'calibration.pdf', 'The soil moisture sensor was calibrated at 22 degrees. Offset error was 3 percent.'),
    ...chunkText('f2', 'budget.xlsx', 'Total prototype cost is 1670 EGP including acrylic sheets.'),
  ];

  it('finds the chunk containing the answer', () => {
    const index = buildRagIndex(chunks);
    const hits = retrieve(index, 'What was the sensor offset error?');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].fileName).toBe('calibration.pdf');
  });

  it('returns nothing when the project has no match (refusal path)', () => {
    const index = buildRagIndex(chunks);
    expect(retrieve(index, 'quantum entanglement photosynthesis')).toEqual([]);
  });

  it('returns nothing for tiny queries', () => {
    const index = buildRagIndex(chunks);
    expect(retrieve(index, 'a')).toEqual([]);
  });
});
