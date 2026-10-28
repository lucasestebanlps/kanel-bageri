/**
 * Catalog: renders the category tabs and the product grid.
 *
 * Los productos salen del panel (Sanity, vía su CDN) cuando PANEL.projectId
 * está configurado; si no, o si el panel no responde, del JSON local, que
 * tiene la misma forma. Los cambios del panel se ven sin volver a publicar.
 */
import { t, getLang } from './i18n/index.js';
import { BUSINESS, PANEL } from './config.js';
import productsUrl from './data/products.json?url';

const SPIRAL_SVG =
  '<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false"><path d="M100 100A8 8 0 0 1 116 100A16 16 0 0 1 84 100A24 24 0 0 1 132 100A32 32 0 0 1 68 100A40 40 0 0 1 148 100A48 48 0 0 1 52 100" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round"/></svg>';

const PLUS_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';

const LANGS = ['es', 'en', 'da'];
const LOCALES = { es: 'es-AR', en: 'en-GB', da: 'da-DK' };

let products = [];
let categories = [];
let activeCategory = null;
let onAdd = () => {};

export const getProduct = (id) => products.find((p) => p.id === id);

export const escapeHtml = (s = '') =>
  String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const GROQ = `{
  "categories": *[_type == "categoria"] | order(orderRank) { "id": _id, "name": nombre },
  "products": *[_type == "producto" && defined(categoria) && count(paquetes) > 0] | order(orderRank) {
    "id": _id,
    "category": categoria._ref,
    "available": coalesce(disponible, true),
    "name": nombre,
    "desc": descripcion,
    "badge": etiqueta,
    "unit": unidad,
    "variants": paquetes[defined(cantidad) && defined(precio)] { "units": cantidad, "price": precio },
    "photo": foto { hotspot, crop, "url": asset->url, "size": asset->metadata.dimensions }
  }
}`;

async function loadFromPanel() {
  const { projectId, dataset, apiVersion } = PANEL;
  const url =
    `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}` +
    `?query=${encodeURIComponent(GROQ)}&perspective=published`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`panel ${res.status}`);
  return (await res.json()).result;
}

async function loadLocal() {
  const res = await fetch(productsUrl);
  return res.json();
}

/** Textos por idioma: los que el panel deja vacíos usan el primero que haya. */
function fillLangs(field) {
  if (!field) return null;
  const fallback = LANGS.map((l) => field[l]).find(Boolean);
  if (!fallback) return null;
  return Object.fromEntries(LANGS.map((l) => [l, field[l] || fallback]));
}

async function loadCatalog() {
  let data;
  if (PANEL.projectId) {
    try {
      data = await loadFromPanel();
    } catch (err) {
      console.warn('[catalog] panel no disponible, uso el menú local', err);
    }
  }
  data ||= await loadLocal();

  const items = data.products
    .map((p) => ({ ...p, name: fillLangs(p.name), desc: fillLangs(p.desc), badge: fillLangs(p.badge) }))
    .filter((p) => p.name && p.variants?.length);
  const cats = data.categories
    .map((c) => ({ ...c, name: fillLangs(c.name) }))
    .filter((c) => c.name && items.some((p) => p.category === c.id));
  return { items, cats };
}

/** "1 u.", "4 u.", "0,5 kg", "60 min" según cómo se vende el producto. */
export function unitsLabel(units, unit = 'unidad') {
  const n = units.toLocaleString(LOCALES[getLang()]);
  if (unit === 'kg') return t('menu.units.kg', { n });
  if (unit === 'min') return t('menu.units.min', { n });
  return units === 1 ? t('menu.units.one') : t('menu.units.many', { n });
}

/** Foto del panel recortada a 4:3 en el CDN, respetando recorte y punto focal. */
function panelSrc(photo, w) {
  const h = Math.round((w * 3) / 4);
  const params = new URLSearchParams({ w, h, fit: 'crop', auto: 'format', q: 75 });
  const { crop, hotspot, size } = photo;
  if (crop && size && (crop.top || crop.bottom || crop.left || crop.right)) {
    const left = Math.round(crop.left * size.width);
    const top = Math.round(crop.top * size.height);
    const width = Math.round((1 - crop.left - crop.right) * size.width);
    const height = Math.round((1 - crop.top - crop.bottom) * size.height);
    params.set('rect', `${left},${top},${width},${height}`);
  }
  if (hotspot) {
    // el punto focal viene relativo a la foto entera; se pasa relativo al recorte
    const cx = crop ? (hotspot.x - crop.left) / (1 - crop.left - crop.right) : hotspot.x;
    const cy = crop ? (hotspot.y - crop.top) / (1 - crop.top - crop.bottom) : hotspot.y;
    params.set('crop', 'focalpoint');
    params.set('fp-x', Math.min(1, Math.max(0, cx)).toFixed(3));
    params.set('fp-y', Math.min(1, Math.max(0, cy)).toFixed(3));
  }
  return `${photo.url}?${params}`;
}

function mediaHtml(p, lang) {
  const alt = escapeHtml(p.name[lang]);
  const badge = p.badge ? `<span class="card__badge">${escapeHtml(p.badge[lang])}</span>` : '';
  if (p.photo?.url) {
    return `
    <div class="card__media">
      <img src="${panelSrc(p.photo, 800)}"
        srcset="${[480, 800, 1200].map((w) => `${panelSrc(p.photo, w)} ${w}w`).join(', ')}"
        sizes="(min-width: 860px) 350px, (min-width: 600px) 45vw, 92vw"
        alt="${alt}" loading="lazy" decoding="async" />
      ${badge}
    </div>`;
  }
  if (!p.image) {
    return `
      <div class="card__media card__media--empty">
        ${SPIRAL_SVG}
        <span>${t('menu.noPhoto')}</span>
      </div>`;
  }
  return `
    <div class="card__media">
      <picture>
        <source type="image/webp" srcset="/img/${p.image}-480.webp 480w, /img/${p.image}-800.webp 800w" sizes="(min-width: 860px) 350px, (min-width: 600px) 45vw, 92vw" />
        <img src="/img/${p.image}-800.jpg" alt="${alt}" loading="lazy" decoding="async" />
      </picture>
      ${badge}
    </div>`;
}

function cardHtml(p) {
  const lang = getLang();
  const variants = p.variants
    .map(
      (v, i) => `
      <div class="variant">
        <span class="variant__units">${unitsLabel(v.units, p.unit)}</span>
        <span class="variant__dots" aria-hidden="true"></span>
        <span class="variant__price">${v.price} ${BUSINESS.currency}</span>
        <button type="button" class="variant__add" data-add="${p.id}:${i}"
          aria-label="${escapeHtml(t('menu.add', { name: p.name[lang], units: unitsLabel(v.units, p.unit) }))}"
          ${p.available ? '' : 'disabled'}>${PLUS_SVG}</button>
      </div>`
    )
    .join('');

  return `
    <article class="card${p.available ? '' : ' card--soldout'}">
      ${mediaHtml(p, lang)}
      <div class="card__body">
        ${p.available ? '' : `<span class="soldout-tag">${t('menu.soldOut')}</span>`}
        <h3>${escapeHtml(p.name[lang])}</h3>
        ${p.desc ? `<p class="card__desc">${escapeHtml(p.desc[lang])}</p>` : ''}
        <div class="card__variants">${variants}</div>
      </div>
    </article>`;
}

function renderGrid() {
  const grid = document.querySelector('[data-menu-grid]');
  grid.innerHTML =
    products
      .filter((p) => p.category === activeCategory)
      .map(cardHtml)
      .join('');

  grid.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [id, idx] = btn.dataset.add.split(':');
      onAdd(getProduct(id), Number(idx));
    });
  });
}

/** Una pestaña por categoría del panel, en su orden; reemplaza las del HTML. */
function renderTabs() {
  const lang = getLang();
  const list = document.querySelector('[data-menu-tabs]');
  const panel = document.querySelector('[data-menu-grid]');
  if (!categories.some((c) => c.id === activeCategory)) activeCategory = categories[0]?.id;

  list.innerHTML = categories
    .map(
      (c, i) => `
      <button type="button" role="tab" id="tab-${i}" aria-controls="panel-menu"
        aria-selected="${c.id === activeCategory}" data-category="${escapeHtml(c.id)}">${escapeHtml(c.name[lang])}</button>`
    )
    .join('');
  panel.setAttribute('aria-labelledby', list.querySelector('[aria-selected="true"]')?.id || '');

  const tabs = [...list.querySelectorAll('[role="tab"]')];
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset.category === activeCategory) return;
      activeCategory = tab.dataset.category;
      tabs.forEach((x) => x.setAttribute('aria-selected', String(x === tab)));
      panel.setAttribute('aria-labelledby', tab.id);
      renderGrid();
      panel.classList.remove('is-swapping');
      void panel.offsetWidth; // reinicia la animación si se cambia rápido
      panel.classList.add('is-swapping');
    });
  });
}

export async function initCatalog({ onAdd: handler }) {
  onAdd = handler;
  ({ items: products, cats: categories } = await loadCatalog());
  renderTabs();
  renderGrid();
  window.addEventListener('langchange', () => {
    renderTabs();
    renderGrid();
  });
}
