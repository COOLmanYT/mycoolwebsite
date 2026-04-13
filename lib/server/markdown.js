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

// Allow the alert div markup through rehype-sanitize by extending the default schema
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    // ensure div is in the list (it is by default, but be explicit)
  ],
  attributes: {
    ...defaultSchema.attributes,
    div: [
      ...(defaultSchema.attributes?.div ?? []),
      // Allow 'class' attribute so alert blocks preserve their class names
      'className',
    ],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      'className',
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      'className',
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
