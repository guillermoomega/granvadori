// Menú móvil
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');

if (toggle && links) {
  toggle.addEventListener('click', () => {
    const abierto = links.classList.toggle('abierto');
    toggle.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  });
  links.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      links.classList.remove('abierto');
      toggle.setAttribute('aria-expanded', 'false');
    })
  );
}

// Carruseles
document.querySelectorAll('.carrusel').forEach(carrusel => {
  const pista = carrusel.querySelector('.carrusel-pista');
  const imgs = carrusel.querySelectorAll('.carrusel-img');
  const dotsWrap = carrusel.querySelector('.carrusel-dots');
  const ant = carrusel.querySelector('.carrusel-ant');
  const sig = carrusel.querySelector('.carrusel-sig');
  if (!imgs.length) return;

  imgs.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carrusel-dot' + (i === 0 ? ' activo' : '');
    dot.setAttribute('aria-label', 'Foto ' + (i + 1));
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const dots = dotsWrap.querySelectorAll('.carrusel-dot');

  function goTo(i) {
    pista.scrollTo({ left: pista.offsetWidth * i, behavior: 'smooth' });
  }

  function syncDots() {
    const i = Math.round(pista.scrollLeft / pista.offsetWidth);
    dots.forEach((d, j) => d.classList.toggle('activo', j === i));
  }

  ant.addEventListener('click', () => {
    const i = Math.round(pista.scrollLeft / pista.offsetWidth);
    goTo(Math.max(0, i - 1));
  });
  sig.addEventListener('click', () => {
    const i = Math.round(pista.scrollLeft / pista.offsetWidth);
    goTo(Math.min(imgs.length - 1, i + 1));
  });

  pista.addEventListener('scroll', syncDots, { passive: true });
});

// Reveal on scroll (respeta prefers-reduced-motion vía CSS)
const observer = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  }),
  { threshold: 0.12 }
);
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Tracking WhatsApp — GA4
document.querySelectorAll('a[href*="wa.me"]').forEach(function(link) {
  link.addEventListener('click', function() {
    if (typeof gtag === 'function') {
      gtag('event', 'contacto_whatsapp', {
        event_category: 'engagement',
        event_label: link.href
      });
    }
  });
});
