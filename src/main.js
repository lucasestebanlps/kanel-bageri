/**
 * Boot: i18n → render → interactions.
 */
import './styles/style.css';
import { initI18n, t, getLang } from './i18n/index.js';
import { initHeader } from './header.js';
import { initCatalog } from './catalog.js';
import { initCart, addToCart, nextPickupLabel } from './cart.js';
import { BUSINESS } from './config.js';

/* Footer year (interpolated by the i18n engine) */
document.querySelectorAll('[data-i18n="footer.rights"]').forEach((el) => {
  el.dataset.i18nVars = JSON.stringify({ year: new Date().getFullYear() });
});

initI18n();
initHeader();
// Cart restores saved lines by resolving them against the catalog,
// so it must initialize after products are loaded.
initCatalog({ onAdd: addToCart }).then(initCart);

/* Links que dependen del idioma: WhatsApp con el mensaje ya escrito, la
   etiqueta de ejemplo y el crédito, que apuntan a la web de Lucas. */
function updateWaLinks() {
  document.querySelectorAll('[data-wa-direct]').forEach((a) => {
    a.href = `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(t('wa.direct'))}`;
  });
  const site = BUSINESS.makerUrls[getLang()] || BUSINESS.makerUrls.es;
  document.querySelectorAll('[data-maker-link]').forEach((a) => (a.href = site));
  document.querySelectorAll('[data-demotag-link]').forEach((a) => (a.href = `${site}#precios`));
}

document.querySelectorAll('[data-plan-price]').forEach((el) => {
  el.textContent = `${new Intl.NumberFormat('da-DK').format(BUSINESS.plan.price)} DKK`;
});
updateWaLinks();
window.addEventListener('langchange', updateWaLinks);

/* Tarjetita del hero: el próximo horario de retiro, calculado del horario real */
function updateNextPickup() {
  const label = nextPickupLabel();
  document.querySelectorAll('[data-next-pickup]').forEach((el) => {
    el.textContent = label;
    el.closest('.hero__ticket')?.toggleAttribute('hidden', !label);
  });
}
updateNextPickup();
window.addEventListener('langchange', updateNextPickup);
setInterval(updateNextPickup, 60000);

/* Scroll reveal: el hero se ve de entrada; el resto aparece un poco antes de
   entrar en pantalla, así nunca se ve un hueco vacío al scrollear rápido. */
const revealTargets = document.querySelectorAll(
  '.section__head, .about__photo, .about__text, .mosaic, .contact__info, .contact__map'
);
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  },
  { rootMargin: '0px 0px 15% 0px', threshold: 0 }
);
revealTargets.forEach((el) => {
  el.classList.add('reveal');
  if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-in');
  else io.observe(el);
});
