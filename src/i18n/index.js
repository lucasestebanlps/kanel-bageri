/**
 * Tiny dependency-free i18n engine.
 * - [data-i18n="key"] → textContent
 * - [data-i18n-attr="attr:key, attr2:key2"] → attributes (aria-label, alt, title…)
 * - [data-i18n-vars='{"n":"3"}'] → interpolation vars for the element's key
 * - Language detection: URL path (/en/, /da/) > ?lang > localStorage > ES
 * - Language switch syncs the URL with the prerendered paths via pushState.
 */
import { DICT, LANGS, DEFAULT_LANG } from './dict.js';

const STORAGE_KEY = 'kanel-lang';
let current = DEFAULT_LANG;

export function detectLang() {
  const path = window.location.pathname;
  const fromPath = LANGS.find((l) => l !== DEFAULT_LANG && new RegExp(`^/${l}(/|$)`).test(path));
  const fromQuery = new URLSearchParams(window.location.search).get('lang');
  let stored = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* storage unavailable (private mode) — fall through */
  }
  const candidate = fromPath || fromQuery || stored || DEFAULT_LANG;
  return LANGS.includes(candidate) ? candidate : DEFAULT_LANG;
}

export const getLang = () => current;

export function t(key, vars = {}) {
  let str = DICT[current][key] ?? DICT[DEFAULT_LANG][key] ?? key;
  for (const [k, v] of Object.entries(vars)) str = str.replaceAll(`{${k}}`, String(v));
  return str;
}

export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const vars = el.dataset.i18nVars ? JSON.parse(el.dataset.i18nVars) : undefined;
    el.textContent = t(el.dataset.i18n, vars);
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });
}

function syncLangButtons() {
  document.querySelectorAll('[data-lang]').forEach((btn) => {
    const active = btn.dataset.lang === current;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}

function syncMeta() {
  document.documentElement.lang = current;
  document.title = t('meta.title');
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', t('meta.description'));
}

export function setLang(lang) {
  if (!LANGS.includes(lang) || lang === current) return;
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* non-blocking */
  }
  // Keep the URL aligned with the prerendered per-language pages
  if (window.history?.pushState) {
    const clean = window.location.pathname.replace(/^\/(en|da)(?=\/|$)/, '') || '/';
    const target = lang === DEFAULT_LANG ? clean : `/${lang}${clean}`;
    window.history.pushState({}, '', target + window.location.hash);
  }
  syncMeta();
  applyI18n();
  syncLangButtons();
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

export function initI18n() {
  current = detectLang();
  syncMeta();
  applyI18n();
  syncLangButtons();
  // Language buttons exist twice (header + mobile drawer): wire them all
  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
}
