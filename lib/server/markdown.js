import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

/**
 * Converts a GitHub-style alert block notation:
 *
 *   > [!INFO]
 *   > Some text here
 *
 * into:
 *
 *   <div class="alert info">Some text here</div>
 *
 * The preprocessing runs on the raw markdown string before remark parses it,
 * converting blockquote-style alerts into fenced HTML divs.
 */
function preprocessAlerts(markdown) {
  const ALERT_TYPES = ['INFO', 'WARNING', 'ERROR', 'NOTE', 'TIP', 'IMPORTANT', 'CAUTION'];
  const pattern = new RegExp(
    `^> \\[!(${ALERT_TYPES.join('|')})\\]\\n((?:^>[ \\t]?.*(?:\\n|$))*)`,
    'gim',
  );

  return markdown.replace(pattern, (_, type, body) => {
    const className = type.toLowerCase();
    const lines = body
      .split('\n')
      .map((line) => line.replace(/^>[ \t]?/, ''))
      .join('\n')
      .trim();
    // Use raw HTML that will pass through rehype-sanitize
    return `<div class="alert ${className}">\n\n${lines}\n\n</div>\n\n`;
  });
}

// Allow the alert div markup through rehype-sanitize by extending the default schema.
// Note: in hast, className is an array of individual tokens (e.g. class="alert info"
// becomes className: ['alert', 'info']), so we list individual tokens here.
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [
      ...(defaultSchema.attributes?.div ?? []),
      // Allow specific individual class tokens for alert blocks
      ['className', 'alert', 'info', 'warning', 'error', 'note', 'tip', 'important', 'caution'],
    ],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      // Allow language-* and hljs-* class tokens for syntax highlighting
      ['className', /^language-/, /^hljs-/],
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      ['className', /^hljs-/],
    ],
    pre: [
      ...(defaultSchema.attributes?.pre ?? []),
    ],
  },
};

/**
 * Renders a markdown string to safe HTML with full GitHub-Flavored Markdown
 * support (code blocks, tables, task lists, strikethrough, links, headings,
 * lists) plus GitHub-style alert blocks.
 *
 * @param {string} markdown  — raw markdown content
 * @returns {Promise<string>} — safe HTML string
 */
export async function renderMarkdown(markdown) {
  const preprocessed = preprocessAlerts(String(markdown ?? ''));

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify)
    .process(preprocessed);

  return String(file);
}
