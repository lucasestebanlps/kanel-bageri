/**
 * Catalog: renders the product grid per category tab.
 *
 * Los productos salen de un JSON local con la misma forma que la respuesta
 * del panel (Sanity). En un sitio real se reemplaza loadProducts() por, p. ej.:
 *   fetch(`https://<projectId>.apicdn.sanity.io/v2024-01-01/data/query/production?query=${groq}`)
 * and image URLs with `${sanityCdnUrl}?w=800&auto=format&q=75`.
 */
import { t, getLang } from './i18n/index.js';
import { BUSINESS } from './config.js';
import productsUrl from './data/products.json?url';

const SPIRAL_SVG =
  '<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false"><path d="M100 100A8 8 0 0 1 116 100A16 16 0 0 1 84 100A24 24 0 0 1 132 100A32 32 0 0 1 68 100A40 40 0 0 1 148 100A48 48 0 0 1 52 100" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round"/></svg>';

const PLUS_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';

let products = [];
let activeCategory = 'wiener';
let onAdd = () => {};

export const getProduct = (id) => products.find((p) => p.id === id);

async function loadProducts() {
  const res = await fetch(productsUrl);
  const data = await res.json();
  return data.products;
}

function unitsLabel(units) {
  return units === 1 ? t('menu.units.one') : t('menu.units.many', { n: units });
}

function mediaHtml(p, lang) {
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
        <img src="/img/${p.image}-800.jpg" alt="${p.name[lang]}" loading="lazy" decoding="async" />
      </picture>
      ${p.badge ? `<span class="card__badge">${p.badge[lang]}</span>` : ''}
    </div>`;
}

function cardHtml(p) {
  const lang = getLang();
  const variants = p.variants
    .map(
      (v, i) => `
      <div class="variant">
        <span class="variant__units">${unitsLabel(v.units)}</span>
        <span class="variant__dots" aria-hidden="true"></span>
        <span class="variant__price">${v.price} ${BUSINESS.currency}</span>
        <button type="button" class="variant__add" data-add="${p.id}:${i}"
          aria-label="${t('menu.add', { name: p.name[lang], units: v.units })}"
          ${p.available ? '' : 'disabled'}>${PLUS_SVG}</button>
      </div>`
    )
    .join('');

  return `
    <article class="card${p.available ? '' : ' card--soldout'}">
      ${mediaHtml(p, lang)}
      <div class="card__body">
        ${p.available ? '' : `<span class="soldout-tag">${t('menu.soldOut')}</span>`}
        <h3>${p.name[lang]}</h3>
        <p class="card__desc">${p.desc[lang]}</p>
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

function initTabs() {
  const tabs = [...document.querySelectorAll('[data-menu-tabs] [role="tab"]')];
  const panel = document.querySelector('[data-menu-grid]');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset.category === activeCategory) return;
      activeCategory = tab.dataset.category;
      tabs.forEach((x) => x.setAttribute('aria-selected', String(x === tab)));
      panel.setAttribute('aria-labelledby', tab.id);
      renderGrid();
    });
  });
}

export async function initCatalog({ onAdd: handler }) {
  onAdd = handler;
  products = await loadProducts();
  initTabs();
  renderGrid();
  window.addEventListener('langchange', renderGrid);
}
