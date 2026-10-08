/**
 * Photo carousel: native CSS scroll-snap + arrows + dots.
 */
import { t } from './i18n/index.js';

export function initGallery() {
  const root = document.querySelector('[data-carousel]');
  if (!root) return;

  const track = root.querySelector('[data-carousel-track]');
  const slides = [...root.querySelectorAll('.carousel__slide')];
  const dotsBox = root.querySelector('[data-carousel-dots]');

  // Hide broken provisional images instead of showing the broken-img glyph
  root.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', () => {
      img.closest('.carousel__slide')?.remove();
    });
  });

  const dots = slides.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', t('gallery.goto', { n: i + 1 }));
    b.addEventListener('click', () => goTo(i));
    dotsBox.appendChild(b);
    return b;
  });

  const slideW = () => slides[0].getBoundingClientRect().width + 16; // + gap

  const index = () => Math.round(track.scrollLeft / slideW());

  const goTo = (i) => {
    const clamped = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({ left: clamped * slideW(), behavior: 'smooth' });
  };

  // Arrows wrap around (last -> first, first -> last); swipe keeps native bounds
  const count = () => slides.length;
  root.querySelector('[data-carousel-prev]').addEventListener('click', () => goTo((index() - 1 + count()) % count()));
  root.querySelector('[data-carousel-next]').addEventListener('click', () => goTo((index() + 1) % count()));

  let raf = 0;
  const paint = () => {
    const i = index();
    dots.forEach((d, j) => d.classList.toggle('is-active', i === j));
  };
  track.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(paint);
    },
    { passive: true }
  );
  paint();

  window.addEventListener('langchange', () => {
    dots.forEach((d, i) => d.setAttribute('aria-label', t('gallery.goto', { n: i + 1 })));
  });
}
