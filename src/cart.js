/**
 * Cart + pickup + WhatsApp checkout.
 * The order leaves as a CLOSED wa.me message: items, quantities, total,
 * pickup day and time — localized to the visitor's language.
 * Pickup slots are generated from the real opening scheme in config.js
 * (closed Mondays, two daily windows).
 */
import { t, getLang } from './i18n/index.js';
import { BUSINESS, HOURS } from './config.js';
import { getProduct } from './catalog.js';

const STORAGE_KEY = 'kanel-cart';
const LOCALES = { es: 'es-AR', en: 'en-GB', da: 'da-DK' };

let items = []; // [{ id, variantIdx, qty }]
let pickup = { dayKey: null, windowId: null, time: null };
let lastFocused = null;

/* ---------- state helpers ---------- */

const save = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* non-blocking */
  }
};

const load = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    // keep only lines that still resolve against the catalog
    items = raw.filter((l) => getProduct(l.id)?.variants[l.variantIdx]);
  } catch {
    items = [];
  }
};

const lineData = (line) => {
  const product = getProduct(line.id);
  const variant = product.variants[line.variantIdx];
  return { product, variant, total: variant.price * line.qty };
};

const cartCount = () => items.reduce((n, l) => n + l.qty, 0);
const cartTotal = () => items.reduce((n, l) => n + lineData(l).total, 0);

/* ---------- pickup slots ---------- */

const dayKeyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const parseHM = (hm) => hm.split(':').map(Number);

/** Slot times ("HH:MM") for a given date + window, honoring lead time today. */
function slotsFor(date, win) {
  const [sh, sm] = parseHM(win.start);
  const [eh, em] = parseHM(win.end);
  const slots = [];
  const cursor = new Date(date);
  cursor.setHours(sh, sm, 0, 0);
  const end = new Date(date);
  end.setHours(eh, em, 0, 0);
  const minTime = new Date(Date.now() + HOURS.minLeadMinutes * 60000);

  while (cursor <= end) {
    if (cursor >= minTime) {
      slots.push(`${String(cursor.getHours()).padStart(2, '0')}:${String(cursor.getMinutes()).padStart(2, '0')}`);
    }
    cursor.setMinutes(cursor.getMinutes() + HOURS.slotMinutes);
  }
  return slots;
}

/** Next open days (skips closed weekdays and days with no remaining slots). */
function openDays() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < HOURS.daysAhead + 2 && days.length < HOURS.daysAhead; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (HOURS.closedWeekdays.includes(d.getDay())) continue;
    if (!HOURS.windows.some((w) => slotsFor(d, w).length)) continue;
    days.push(d);
  }
  return days;
}

function dayLabel(d) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (dayKeyOf(d) === dayKeyOf(today)) return t('cart.today');
  if (dayKeyOf(d) === dayKeyOf(tomorrow)) return t('cart.tomorrow');
  return new Intl.DateTimeFormat(LOCALES[getLang()], { weekday: 'short', day: 'numeric' }).format(d);
}

function dayLabelLong(d) {
  return new Intl.DateTimeFormat(LOCALES[getLang()], { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
}

/* ---------- DOM ---------- */

const $ = (sel) => document.querySelector(sel);

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  el.classList.add('is-visible');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('is-visible'), 1800);
}

function renderBar() {
  const bar = $('#cart-bar');
  const n = cartCount();
  bar.hidden = n === 0;
  if (n === 0) return;
  const key = n === 1 ? 'cart.bar.one' : 'cart.bar';
  $('[data-cart-summary]').textContent = t(key, { n, total: cartTotal() });
}

function chip(label, pressed, onClick, disabled = false) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.textContent = label;
  b.setAttribute('aria-pressed', String(pressed));
  b.disabled = disabled;
  b.addEventListener('click', onClick);
  return b;
}

function renderSheet() {
  const list = $('[data-cart-items]');
  const empty = $('[data-cart-empty]');
  const pickupBox = $('[data-cart-pickup]');
  const confirm = $('[data-cart-confirm]');
  const lang = getLang();

  /* items */
  list.innerHTML = '';
  items.forEach((line, i) => {
    const { product, variant, total } = lineData(line);
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <div class="cart-item__info">
        <span class="cart-item__name">${product.name[lang]}</span>
        <span class="cart-item__meta">${variant.units === 1 ? t('menu.units.one') : t('menu.units.many', { n: variant.units })} · ${variant.price} ${BUSINESS.currency}</span>
      </div>
      <span class="cart-item__qty">
        <button type="button" data-minus aria-label="${t('cart.less')}">−</button>
        <output>${line.qty}</output>
        <button type="button" data-plus aria-label="${t('cart.more')}">+</button>
      </span>
      <span class="cart-item__price">${total} ${BUSINESS.currency}</span>`;
    li.querySelector('[data-plus]').addEventListener('click', () => {
      line.qty++;
      save();
      renderBar();
      renderSheet();
    });
    li.querySelector('[data-minus]').addEventListener('click', () => {
      line.qty--;
      if (line.qty <= 0) items.splice(i, 1);
      save();
      renderBar();
      renderSheet();
    });
    list.appendChild(li);
  });

  const hasItems = items.length > 0;
  empty.hidden = hasItems;
  pickupBox.hidden = !hasItems;

  /* pickup */
  if (hasItems) {
    const days = openDays();
    if (!days.some((d) => dayKeyOf(d) === pickup.dayKey)) {
      pickup = { dayKey: days.length ? dayKeyOf(days[0]) : null, windowId: null, time: null };
    }
    const selectedDay = days.find((d) => dayKeyOf(d) === pickup.dayKey);

    const daysBox = $('[data-cart-days]');
    daysBox.innerHTML = '';
    days.forEach((d) => {
      daysBox.appendChild(
        chip(dayLabel(d), dayKeyOf(d) === pickup.dayKey, () => {
          pickup = { dayKey: dayKeyOf(d), windowId: null, time: null };
          renderSheet();
        })
      );
    });

    const winBox = $('[data-cart-windows]');
    winBox.innerHTML = '';
    HOURS.windows.forEach((w) => {
      const available = selectedDay ? slotsFor(selectedDay, w).length > 0 : false;
      winBox.appendChild(
        chip(
          t(`cart.window.${w.id}`),
          pickup.windowId === w.id,
          () => {
            pickup.windowId = w.id;
            pickup.time = null;
            renderSheet();
          },
          !available
        )
      );
    });

    const timesBox = $('[data-cart-times]');
    timesBox.innerHTML = '';
    if (selectedDay && pickup.windowId) {
      const win = HOURS.windows.find((w) => w.id === pickup.windowId);
      slotsFor(selectedDay, win).forEach((time) => {
        timesBox.appendChild(
          chip(time, pickup.time === time, () => {
            pickup.time = time;
            renderSheet();
          })
        );
      });
    }
  }

  $('[data-cart-total]').textContent = `${cartTotal()} ${BUSINESS.currency}`;
  confirm.disabled = !(hasItems && pickup.dayKey && pickup.time);
}

/* ---------- sheet open/close + focus trap ---------- */

function trapFocus(e) {
  if (e.key !== 'Tab') return;
  const sheet = $('#cart-sheet');
  const focusables = sheet.querySelectorAll('button:not([disabled]), a[href], output, [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    last.focus();
    e.preventDefault();
  } else if (!e.shiftKey && document.activeElement === last) {
    first.focus();
    e.preventDefault();
  }
}

function onSheetKeydown(e) {
  if (e.key === 'Escape') closeSheet();
  trapFocus(e);
}

export function openSheet() {
  lastFocused = document.activeElement;
  renderSheet();
  $('#cart-sheet').hidden = false;
  $('#sheet-scrim').hidden = false;
  document.body.classList.add('sheet-open');
  document.addEventListener('keydown', onSheetKeydown);
  $('#cart-sheet .cart-sheet__close').focus();
}

export function closeSheet() {
  $('#cart-sheet').hidden = true;
  $('#sheet-scrim').hidden = true;
  document.body.classList.remove('sheet-open');
  document.removeEventListener('keydown', onSheetKeydown);
  lastFocused?.focus?.();
}

/* ---------- WhatsApp checkout ---------- */

function buildMessage() {
  const lang = getLang();
  const lines = items.map((line) => {
    const { product, variant, total } = lineData(line);
    const units = variant.units === 1 ? t('menu.units.one') : t('menu.units.many', { n: variant.units });
    return `• ${line.qty} × ${product.name[lang]} (${units}): ${total} ${BUSINESS.currency}`;
  });
  const day = openDays().find((d) => dayKeyOf(d) === pickup.dayKey);
  // En la demo el pedido le llega a Lucas: arranca diciendo de dónde viene.
  return [
    t('wa.intro'),
    '',
    t('wa.hello'),
    ...lines,
    t('wa.total', { total: cartTotal() }),
    t('wa.pickup', { day: day ? dayLabelLong(day) : pickup.dayKey, time: pickup.time }),
    t('wa.thanks'),
  ].join('\n');
}

function confirmOrder() {
  const url = `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(buildMessage())}`;
  window.open(url, '_blank', 'noopener');
}

/* ---------- public API ---------- */

export function addToCart(product, variantIdx) {
  if (!product?.available) return;
  const existing = items.find((l) => l.id === product.id && l.variantIdx === variantIdx);
  if (existing) existing.qty++;
  else items.push({ id: product.id, variantIdx, qty: 1 });
  save();
  renderBar();
  toast(t('menu.added'));
}

export function initCart() {
  load();
  renderBar();

  $('[data-cart-open]').addEventListener('click', openSheet);
  $('[data-cart-close]').addEventListener('click', closeSheet);
  $('#sheet-scrim').addEventListener('click', closeSheet);
  $('[data-cart-confirm]').addEventListener('click', confirmOrder);

  window.addEventListener('langchange', () => {
    renderBar();
    if (!$('#cart-sheet').hidden) renderSheet();
  });
}
