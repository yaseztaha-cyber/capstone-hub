import DOMPurify from 'isomorphic-dompurify';

// Sanitize rich-text HTML (TipTap output) before rendering.
// Allows everyday formatting; strips scripts, event handlers, forms,
// iframes, objects, and javascript: URLs.
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  try {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
        'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote',
        'code', 'pre', 'a', 'span', 'mark', 'hr', 'table',
        'thead', 'tbody', 'tr', 'th', 'td', 'img',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'colspan', 'rowspan', 'class'],
      ALLOW_DATA_ATTR: false,
    });
  } catch {
    return '';
  }
}
