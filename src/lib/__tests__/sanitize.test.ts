import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '@/lib/sanitize';

describe('sanitizeHtml', () => {
  it('strips scripts, event handlers, and iframes', () => {
    const out = sanitizeHtml(
      '<p onclick="steal()">Hi</p><script>alert(1)</script><iframe src="evil"></iframe><a href="javascript:alert(1)">x</a>'
    );
    expect(out).not.toContain('<script');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('<iframe');
    expect(out).not.toContain('javascript:');
    expect(out).toContain('Hi');
  });

  it('keeps everyday formatting', () => {
    const out = sanitizeHtml('<h2>Title</h2><p><strong>Bold</strong> and <a href="https://example.com">link</a></p><ul><li>one</li></ul>');
    expect(out).toContain('<strong>Bold</strong>');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('<li>one</li>');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });
});
