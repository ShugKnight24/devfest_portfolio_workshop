// A small markdown renderer for lesson text. Content is our own (src/learn/content), never user input.
// Supports: # headings, paragraphs, - / 1. lists (one level), > quotes, | tables |,
// ~~~ or ``` fenced code, `inline code`, **bold**, *italic*, [links](url).
// mdBlocks() splits text into html chunks and code blocks so code can render as a runnable component.

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function inline(s) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return "\u0000" + (codes.length - 1) + "\u0000";
  });
  s = esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\s][^*]*)\*(?!\w)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, '<a href="$2">$1</a>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => "<code>" + esc(codes[i]) + "</code>");
}

// strip common indentation so template literals can be indented in data files
function dedent(src) {
  const lines = String(src).replace(/\r/g, "").split("\n");
  const ind = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => l.slice(Number.isFinite(ind) ? ind : 0));
}

export function mdBlocks(src) {
  if (!src) return [];
  const L = dedent(src);
  const blocks = [];
  let html = "";
  const flush = () => { if (html) { blocks.push({ type: "html", html }); html = ""; } };
  let i = 0;
  while (i < L.length) {
    const line = L[i];
    const fence = line.match(/^(~~~|```)\s*(\w*)/);
    if (fence) {
      const buf = [];
      i++;
      while (i < L.length && !L[i].startsWith(fence[1])) buf.push(L[i++]);
      i++;
      flush();
      blocks.push({ type: "code", lang: fence[2], code: buf.join("\n") });
      continue;
    }
    if (!line.trim()) { i++; continue; }
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) { html += `<h${h[1].length + 1}>${inline(h[2])}</h${h[1].length + 1}>`; i++; continue; }
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < L.length && /^\|/.test(L[i])) rows.push(L[i++]);
      const cells = (r) => r.replace(/^\||\|\s*$/g, "").split("|").map((c) => c.trim());
      const body = rows.filter((r) => !/^\|[\s:|-]+\|?\s*$/.test(r));
      html += '<div class="learn-table"><table><thead><tr>' + cells(body[0]).map((c) => `<th>${inline(c)}</th>`).join("") + "</tr></thead><tbody>" +
        body.slice(1).map((r) => "<tr>" + cells(r).map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>").join("") + "</tbody></table></div>";
      continue;
    }
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < L.length && /^>\s?/.test(L[i])) buf.push(L[i++].replace(/^>\s?/, ""));
      html += `<blockquote>${md(buf.join("\n"))}</blockquote>`;
      continue;
    }
    const li = line.match(/^(\s*)([-*]|\d+\.)\s+/);
    if (li) {
      const ordered = /\d/.test(li[2]);
      const items = [];
      while (i < L.length && (/^\s*([-*]|\d+\.)\s+/.test(L[i]) || (/^\s{2,}\S/.test(L[i]) && items.length))) {
        const m = L[i].match(/^\s*([-*]|\d+\.)\s+(.*)/);
        if (m) items.push(m[2]); else items[items.length - 1] += " " + L[i].trim();
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      html += `<${tag}>` + items.map((t) => `<li>${inline(t)}</li>`).join("") + `</${tag}>`;
      continue;
    }
    const buf = [];
    while (i < L.length && L[i].trim() && !/^(#{1,4}\s|~~~|```|\||>|\s*([-*]|\d+\.)\s)/.test(L[i])) buf.push(L[i++]);
    html += `<p>${inline(buf.join(" "))}</p>`;
  }
  flush();
  return blocks;
}

// Everything as one HTML string (code blocks included, not runnable).
export function md(src) {
  return mdBlocks(src)
    .map((b) => (b.type === "html" ? b.html : `<pre class="learn-code" data-lang="${b.lang}"><code>${esc(b.code)}</code></pre>`))
    .join("");
}

// One short line of markdown without the wrapping <p>.
export const mdInline = (src) => md(src).replace(/^<p>|<\/p>$/g, "");
