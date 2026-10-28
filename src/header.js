/**
 * Header behaviour: mobile drawer, solidify-on-scroll, scrollspy.
 */
const DESKTOP_BP = 940;

export function initHeader() {
  const header = document.getElementById('site-header');
  const burger = document.getElementById('hamburger');
  const drawer = document.getElementById('mobile-drawer');
  const scrim = document.getElementById('drawer-scrim');

  /* --- drawer --- */
  const isOpen = () => burger.getAttribute('aria-expanded') === 'true';

  const setOpen = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    drawer.hidden = !open;
    scrim.hidden = !open;
    document.body.classList.toggle('drawer-open', open);
  };

  burger.addEventListener('click', () => setOpen(!isOpen()));
  scrim.addEventListener('click', () => setOpen(false));
  drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) setOpen(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= DESKTOP_BP && isOpen()) setOpen(false);
  });

  /* --- solidify on scroll --- */
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- scrollspy --- */
  const links = [...document.querySelectorAll('.site-nav a[data-spy]')];
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.remove('is-active'));
        byId.get(entry.target.id)?.classList.add('is-active');
      });
    },
    { rootMargin: '-30% 0px -60% 0px' }
  );

  byId.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) spy.observe(section);
  });
}
