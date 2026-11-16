/* borBeHR — global interactions: header progress, mobile menu, alerts, reveal. */

const doc = document;
const root = doc.documentElement;

/* Header progress ------------------------------------------------------ */
const header = doc.querySelector('[data-site-header]');
const progress = doc.querySelector('[data-scroll-progress]');

let scrollTicking = false;

function updateScrollState() {
  const scrollTop = window.scrollY || root.scrollTop;
  const max = Math.max(1, doc.body.scrollHeight - window.innerHeight);
  const ratio = Math.min(1, Math.max(0, scrollTop / max));

  if (header) {
    header.classList.toggle('is-scrolled', scrollTop > 8);
    if (progress) progress.style.setProperty('--progress', ratio.toFixed(4));
  }

  scrollTicking = false;
}

function requestScrollUpdate() {
  if (scrollTicking) return;
  scrollTicking = true;
  window.requestAnimationFrame(updateScrollState);
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate, { passive: true });
updateScrollState();

/* Mobile menu ---------------------------------------------------------- */
const menu = doc.querySelector('[data-mobile-menu]');
const menuToggle = doc.querySelector('[data-menu-toggle]');
const menuPanel = menu?.querySelector('.mobile-menu__panel');
const menuClosers = menu ? [...menu.querySelectorAll('[data-menu-close]')] : [];
const menuLinks = menu ? [...menu.querySelectorAll('[data-menu-link]')] : [];

let lastFocused = null;

function focusableIn(container) {
  if (!container) return [];
  return [
    ...container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ),
  ].filter((element) => element.offsetParent !== null);
}

function openMenu() {
  if (!menu || !menuToggle) return;
  lastFocused = doc.activeElement;
  menu.classList.add('is-open');
  menu.removeAttribute('inert');
  menu.setAttribute('aria-hidden', 'false');
  menuToggle.setAttribute('aria-expanded', 'true');
  menuToggle.querySelector('.sr-only')?.replaceChildren('Закрыть меню');
  doc.body.classList.add('menu-open');

  const focusable = focusableIn(menuPanel);
  (focusable[0] || menuPanel)?.focus({ preventScroll: true });
}

function closeMenu({ restoreFocus = true } = {}) {
  if (!menu || !menuToggle) return;
  menu.classList.remove('is-open');
  menu.setAttribute('inert', '');
  menu.setAttribute('aria-hidden', 'true');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.querySelector('.sr-only')?.replaceChildren('Открыть меню');
  doc.body.classList.remove('menu-open');

  if (restoreFocus && lastFocused instanceof HTMLElement) {
    lastFocused.focus({ preventScroll: true });
  }
}

if (menu && menuToggle) {
  menuToggle.addEventListener('click', () => {
    if (menu.classList.contains('is-open')) closeMenu();
    else openMenu();
  });

  menuClosers.forEach((element) => {
    element.addEventListener('click', () => closeMenu());
  });

  menuLinks.forEach((link) => {
    link.addEventListener('click', () => closeMenu({ restoreFocus: false }));
  });

  doc.addEventListener('keydown', (event) => {
    if (!menu.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = focusableIn(menuPanel);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && doc.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && doc.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024 && menu.classList.contains('is-open')) {
      closeMenu({ restoreFocus: false });
    }
  });
}

/* Alerts --------------------------------------------------------------- */
const ALERTS_KEY = 'borbehr_dismissed_alerts';
const alertRail = doc.querySelector('[data-alert-rail]');

function readDismissed() {
  try {
    const value = JSON.parse(window.localStorage.getItem(ALERTS_KEY) || '[]');
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

function writeDismissed(ids) {
  try {
    window.localStorage.setItem(ALERTS_KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    /* Storage can be unavailable in private mode — dismissal still works for this visit. */
  }
}

if (alertRail) {
  const dismissed = readDismissed();

  alertRail.querySelectorAll('[data-alert-id]').forEach((item) => {
    if (dismissed.includes(String(item.dataset.alertId))) {
      item.classList.add('is-hidden');
    }
  });

  if (!alertRail.querySelector('[data-alert-id]:not(.is-hidden)')) {
    alertRail.hidden = true;
  }

  alertRail.querySelectorAll('[data-alert-close]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('[data-alert-id]');
      if (!item) return;

      item.classList.add('is-hidden');
      writeDismissed([...readDismissed(), String(item.dataset.alertId)]);

      const remaining = alertRail.querySelectorAll('[data-alert-id]:not(.is-hidden)');
      if (!remaining.length) alertRail.hidden = true;
    });
  });
}

/* Reveal on scroll ----------------------------------------------------- */
const revealItems = [...doc.querySelectorAll('[data-reveal]')];

if (revealItems.length) {
  if (!('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    revealItems.forEach((item) => observer.observe(item));
  }
}
