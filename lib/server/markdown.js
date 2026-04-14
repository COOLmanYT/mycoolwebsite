import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

/**
 * Processes custom COOLmanYT markdown extensions before remark parses the content.
 *
 * Supported extensions:
 *
 *   CTA button:
 *     ![CTA-BUTTON]{Button Text}[https://example.com]
 *     → <a class="md-cta-button" href="…">Button Text</a>
 *
 *   Image with alt caption:
 *     ![IMAGE-alt text][https://url]
 *     → <figure class="md-image"><img …><figcaption>alt text</figcaption></figure>
 *
 *   Image carousel:
 *     !![IMAGE-CAR]{alt1}{alt2}[url1][url2]{link1}{link2}
 *     → <div class="md-carousel"> … </div>
 *     The click-link group is optional. Alts/links may be empty strings.
 */
function preprocessCustomExtensions(markdown) {
  let out = String(markdown ?? '');

  // --- CTA Button: ![CTA-BUTTON]{Text}[url] ---
  out = out.replace(/!\[CTA-BUTTON\]\{([^}]*)\}\[([^\]]+)\]/g, (_, text, url) => {
    const safeUrl = url.replace(/"/g, '&quot;');
    const safeText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<a class="md-cta-button" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeText}</a>`;
  });

  // --- Image carousel: !![IMAGE-CAR]{alt1}{alt2}[url1][url2]{link1}{link2} ---
  out = out.replace(
    /!!\[IMAGE-CAR\]((?:\{[^}]*\})+)((?:\[[^\]]+\])+)((?:\{[^}]*\})*)/g,
    (_, altsRaw, urlsRaw, linksRaw) => {
      const alts = [...altsRaw.matchAll(/\{([^}]*)\}/g)].map((m) => m[1]);
      const urls = [...urlsRaw.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1]);
      const links = linksRaw ? [...linksRaw.matchAll(/\{([^}]*)\}/g)].map((m) => m[1]) : [];
      const slides = urls.map((url, i) => {
        const alt = (alts[i] ?? '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        const safeUrl = url.replace(/"/g, '&quot;');
        const link = links[i] ? links[i].replace(/"/g, '&quot;') : '';
        const img = `<img src="${safeUrl}" alt="${alt}" loading="lazy" class="md-carousel__img">`;
        const caption = alt ? `<figcaption class="md-carousel__caption">${alt.replace(/&quot;/g, '"').replace(/&lt;/g, '<')}</figcaption>` : '';
        const inner = link
          ? `<a href="${link}" target="_blank" rel="noopener noreferrer" class="md-carousel__link">${img}</a>${caption}`
          : `${img}${caption}`;
        return `<figure class="md-carousel__slide">${inner}</figure>`;
      });
      return `<div class="md-carousel" role="region" aria-label="Image carousel">${slides.join('')}</div>`;
    },
  );

  // --- Image with caption: ![IMAGE-alt text][url] ---
  // Must run after carousel to avoid conflicts with !! prefix
  out = out.replace(/!\[IMAGE-([^\]]*)\]\[([^\]]+)\]/g, (_, alt, url) => {
    const safeAlt = alt.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeUrl = url.replace(/"/g, '&quot;');
    const caption = alt ? `<figcaption class="md-image__caption">${safeAlt}</figcaption>` : '';
    return `<figure class="md-image"><img src="${safeUrl}" alt="${safeAlt}" loading="lazy">${caption}</figure>`;
  });

  return out;
}

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

// Allow the alert div markup and custom extension elements through rehype-sanitize
// by extending the default schema.
// Note: in hast, className is an array of individual tokens (e.g. class="alert info"
// becomes className: ['alert', 'info']), so we list individual tokens here.
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'figure',
    'figcaption',
  ],
  attributes: {
    ...defaultSchema.attributes,
    div: [
      ...(defaultSchema.attributes?.div ?? []),
      ['className', 'alert', 'info', 'warning', 'error', 'note', 'tip', 'important', 'caution', 'md-carousel'],
      'role',
      'ariaLabel',
    ],
    figure: [
      ['className', 'md-image', 'md-carousel__slide'],
    ],
    figcaption: [
      ['className', 'md-image__caption', 'md-carousel__caption'],
    ],
    img: [
      ...(defaultSchema.attributes?.img ?? []).filter((a) => !(Array.isArray(a) && a[0] === 'className')),
      ['className', 'md-carousel__img'],
      'loading',
    ],
    a: [
      ...(defaultSchema.attributes?.a ?? []).filter((a) => !(Array.isArray(a) && a[0] === 'className')),
      ['className', 'data-footnote-backref', 'md-cta-button', 'md-carousel__link'],
      'target',
      'rel',
    ],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
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
  const preprocessed = preprocessCustomExtensions(preprocessAlerts(String(markdown ?? '')));

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
