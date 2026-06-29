/* Minimal, dependency-free Markdown → HTML for article bodies.
   Supports: headings, bold/italic/code, links, ul/ol lists, blockquote,
   fenced code, hr, paragraphs. Input is HTML-escaped first (safe). */

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s: string): string {
  let out = esc(s);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2" rel="noopener">$1</a>');
  return out;
}

export function renderMarkdown(md: string): string {
  const lines = (md || '').replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let i = 0;
  let listType: 'ul' | 'ol' | null = null;
  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };
  while (i < lines.length) {
    const line = lines[i];
    // fenced code
    if (/^```/.test(line)) {
      closeList();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(esc(lines[i]));
        i++;
      }
      i++;
      html.push('<pre><code>' + buf.join('\n') + '</code></pre>');
      continue;
    }
    if (/^\s*$/.test(line)) {
      closeList();
      i++;
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      closeList();
      const lvl = m[1].length;
      html.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`);
      i++;
      continue;
    }
    if (/^(---|\*\*\*|___)\s*$/.test(line)) {
      closeList();
      html.push('<hr/>');
      i++;
      continue;
    }
    if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
      if (listType !== 'ul') {
        closeList();
        html.push('<ul>');
        listType = 'ul';
      }
      html.push('<li>' + inline(m[1]) + '</li>');
      i++;
      continue;
    }
    if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) {
      if (listType !== 'ol') {
        closeList();
        html.push('<ol>');
        listType = 'ol';
      }
      html.push('<li>' + inline(m[1]) + '</li>');
      i++;
      continue;
    }
    if ((m = line.match(/^>\s?(.*)$/))) {
      closeList();
      html.push('<blockquote>' + inline(m[1]) + '</blockquote>');
      i++;
      continue;
    }
    // paragraph (gather consecutive non-blank, non-block lines)
    closeList();
    const buf = [line];
    i++;
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,4}\s|```|>|\s*[-*]\s|\s*\d+\.\s|---|\*\*\*|___)/.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    html.push('<p>' + buf.map(inline).join('<br/>') + '</p>');
  }
  closeList();
  return html.join('\n');
}

export function plainText(md: string, max = 160): string {
  const t = (md || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*`_\-]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
}
