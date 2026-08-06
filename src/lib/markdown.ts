/* Markdown rendering for the /updates endpoint.
 *
 * `marked` parses the markdown and `dompurify` sanitizes the resulting HTML,
 * so editor-provided markdown (links, bold, lists, headings) can never inject
 * raw scripts. Rendered into `.md-content` which is styled in base.css. */

import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({
  breaks: true,
  gfm: true,
});

export function renderMarkdown(src: string | undefined | null): string {
  if (!src) return '';
  const raw = marked.parse(String(src)) as string;
  if (typeof DOMPurify.sanitize === 'function') {
    return DOMPurify.sanitize(raw);
  }
  return raw;
}
