/**
 * Static per-language prerender (postbuild).
 * Takes dist/index.html (Spanish, the default language) and emits
 * dist/en/index.html and dist/da/index.html with:
 *  - translated visible texts ([data-i18n]) and attributes ([data-i18n-attr])
 *  - translated <title>, meta description, OG tags
 *  - correct <html lang> and per-language canonical
 * hreflang alternates are identical across languages and already live
 * in the source HTML. Asset URLs are root-absolute, so nested pages work.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { DICT } from '../src/i18n/dict.js';
import { BUSINESS } from '../src/config.js';

const SITE = BUSINESS.siteUrl.replace(/\/$/, '');
const YEAR = String(new Date().getFullYear());

const escapeHtml = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function translate(html, lang) {
  const d = DICT[lang];
  let out = html;

  out = out.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(d['meta.title'])}</title>`);
  out = out.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/s,
    `$1${escapeHtml(d['meta.description'])}$2`
  );
  out = out.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${SITE}/${lang}/$2`);
  out = out.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${SITE}/${lang}/$2`);
  out = out.replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${lang}$2`);
  out = out.replace(/(<meta property="og:title" content=")[^"]*(")/s, `$1${escapeHtml(d['meta.title'])}$2`);
  out = out.replace(
    /(<meta\s+property="og:description"\s+content=")[^"]*(")/s,
    `$1${escapeHtml(d['meta.description'])}$2`
  );

  // Visible texts: leaf elements tagged data-i18n
  for (const [key, val] of Object.entries(d)) {
    const re = new RegExp(`(data-i18n="${key}"[^>]*>)[^<]*(<)`, 'g');
    out = out.replace(re, `$1${escapeHtml(val)}$2`);
  }

  // Translated attributes: data-i18n-attr="attr:key, attr2:key2"
  out = out.replace(/<[^>]*data-i18n-attr="[^"]*"[^>]*>/g, (tag) => {
    const pairs = tag.match(/data-i18n-attr="([^"]*)"/)[1];
    let newTag = tag;
    for (const pair of pairs.split(',')) {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key && d[key]) {
        newTag = newTag.replace(new RegExp(`${attr}="[^"]*"`), `${attr}="${escapeHtml(d[key])}"`);
      }
    }
    return newTag;
  });

  out = out.replaceAll('{year}', YEAR);
  return out;
}

const src = readFileSync('dist/index.html', 'utf8');

for (const lang of ['en', 'da']) {
  mkdirSync(`dist/${lang}`, { recursive: true });
  writeFileSync(`dist/${lang}/index.html`, translate(src, lang));
  console.log(`[prerender] dist/${lang}/index.html`);
}

// Spanish page: only resolve the {year} placeholder
writeFileSync('dist/index.html', src.replaceAll('{year}', YEAR));
console.log('[prerender] done');
