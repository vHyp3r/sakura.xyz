document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initScrollReveal();
  initSmoothScroll();
  initAccountNavigation();
});

async function initAccountNavigation() {
  const links = document.querySelectorAll('[data-account-link]');
  if (!links.length) return;

  try {
    const response = await fetch('/api/account/me', { cache: 'no-store' });
    if (!response.ok) return;
    const result = await response.json();
    if (!result.authenticated) return;

    links.forEach((link) => {
      link.href = '/profile';
      link.textContent = link.classList.contains('nav-signin-link') ? '♙ Profile' : 'Profile';
    });
  } catch (error) {
    console.warn('Unable to determine account navigation state.', error);
  }
}

function initMobileNav() {
  const toggle = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('hidden');
    toggle.setAttribute('aria-expanded', String(!isOpen));
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initScrollReveal() {
  const elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-up');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach((el) => {
    el.style.opacity = '0';
    observer.observe(el);
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}
