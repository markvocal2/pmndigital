/* Tiny HTML templating for the public site (rendered by route handlers as plain HTML,
   not React, so the GSAP motion engine owns the DOM without fighting hydration).
   Every interpolated value is escaped unless it is a Raw (already-safe markup). */

export class Raw {
  constructor(readonly value: string) {}
  toString() {
    return this.value;
  }
}

/** Mark markup as trusted (our own templates, sanitized article HTML, SVG constants). */
export const raw = (s: string) => new Raw(s);

export function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type Value = Raw | string | number | boolean | null | undefined | Value[];

function part(v: Value): string {
  if (v === null || v === undefined || v === false) return '';
  if (v instanceof Raw) return v.value;
  if (Array.isArray(v)) return v.map(part).join('');
  return esc(v);
}

/** html`<p>${text}</p>` — escapes values, joins arrays, drops null/undefined/false. */
export function html(strings: TemplateStringsArray, ...values: Value[]): Raw {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += part(values[i]) + strings[i + 1];
  return new Raw(out);
}

/**
 * CMS strings that may carry a deliberate line break written as <br/> (e.g. "ทีมยุคใหม่<br/>ที่เข้าใจธุรกิจ"):
 * escape everything, then restore only the <br>.
 */
export function withBreaks(s: string | null | undefined): Raw {
  return raw(esc(s).replace(/&lt;br\s*\/?&gt;/gi, '<br>'));
}

/** Strip <br> markers for places that need one line (titles, meta). */
export const noBreaks = (s: string | null | undefined) => String(s ?? '').replace(/<br\s*\/?>/gi, ' ');
