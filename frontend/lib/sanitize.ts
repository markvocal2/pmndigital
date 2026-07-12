import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize article body HTML produced by the WYSIWYG (TipTap) editor before it
 * is injected via dangerouslySetInnerHTML on the public page. Runs server-side
 * (the blog page is a Server Component). Whitelist-only + text-align styles;
 * blocks scripts, event handlers, javascript:/data: URLs, iframes, etc.
 */
const CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'b', 'em', 'i', 'u', 's', 'del', 'mark', 'sub', 'sup',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
    'a', 'img', 'figure', 'figcaption',
    'span', 'div',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel', 'style'],
    img: ['src', 'alt', 'title', 'width', 'height', 'style'],
    '*': ['style'],
  },
  // Only text-align is allowed through inline styles (used by the align buttons).
  allowedStyles: {
    '*': { 'text-align': [/^(left|right|center|justify)$/] },
  },
  allowedSchemes: ['http', 'https'],
  allowedSchemesByTag: { img: ['http', 'https'], a: ['http', 'https', 'mailto', 'tel'] },
  // root-relative URLs (e.g. /uploads/...) have no scheme → allowed; block //host.
  allowProtocolRelative: false,
  transformTags: {
    // Harden all links regardless of what the editor emitted.
    a: (tagName, attribs) => ({
      tagName: 'a',
      attribs: { ...attribs, rel: 'noopener noreferrer' },
    }),
  },
};

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html || '', CONFIG);
}
