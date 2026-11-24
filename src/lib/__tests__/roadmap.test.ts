import { describe, it, expect } from 'vitest';
import { parseBuildStages } from '@/lib/roadmap';

describe('parseBuildStages', () => {
  it('parses numbered stages with objectives', () => {
    const out = parseBuildStages('1. Sensor validation - confirm readings\n2. Controller integration - wire ESP32');
    expect(out).toHaveLength(2);
    expect(out[0].title).toBe('Sensor validation');
    expect(out[0].objective).toBe('confirm readings');
  });

  it('parses Stage N and bullet formats', () => {
    const out = parseBuildStages('Stage 1: Housing\n- Testing: run trials');
    expect(out).toHaveLength(2);
    expect(out[0].title).toBe('Housing');
    expect(out[1].title).toBe('Testing');
  });

  it('ignores blank lines and caps at 10', () => {
    const many = Array.from({ length: 15 }, (_, i) => `${i + 1}. Step ${i + 1}`).join('\n');
    expect(parseBuildStages(many)).toHaveLength(10);
    expect(parseBuildStages('   \n\n')).toEqual([]);
  });
});
