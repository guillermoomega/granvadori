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
