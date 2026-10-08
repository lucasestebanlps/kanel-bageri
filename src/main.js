/**
 * Boot: i18n → render → interactions.
 */
import './styles/style.css';
import { initI18n, t, getLang } from './i18n/index.js';
import { initHeader } from './header.js';
import { initGallery } from './gallery.js';
import { initCatalog } from './catalog.js';
import { initCart, addToCart } from './cart.js';
import { BUSINESS } from './config.js';

/* Footer year (interpolated by the i18n engine) */
document.querySelectorAll('[data-i18n="footer.rights"]').forEach((el) => {
  el.dataset.i18nVars = JSON.stringify({ year: new Date().getFullYear() });
});

initI18n();
initHeader();
initGallery();
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

/* Scroll reveal on static blocks (CSS keeps it off for reduced motion) */
const revealTargets = document.querySelectorAll(
  '.hero__inner > *, .section__head, .info-card, .about__inner > *, .contact__map'
);
revealTargets.forEach((el) => el.classList.add('reveal'));
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.15 }
);
revealTargets.forEach((el) => io.observe(el));
