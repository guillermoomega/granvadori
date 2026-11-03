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

// Agenda / próximo evento — fetch a n8n, con fallback a los datos hardcodeados del HTML
async function fetchEventosGV() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch('https://n8ngv-n8n.snjbsa.easypanel.host/webhook/eventos-gv', { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function pintarAgendaEvento(root, ev, opciones) {
  opciones = opciones || {};
  const fecha = root.querySelector('.agenda-fecha');
  if (fecha) fecha.textContent = ev.hora ? `${ev.dia_fecha_texto} · ${ev.hora} hs` : ev.dia_fecha_texto;
  const h3 = root.querySelector('h3');
  if (h3) h3.textContent = ev.titulo;
  const sub = root.querySelector('.agenda-sub');
  if (sub) { if (ev.subtitulo) sub.textContent = ev.subtitulo; else sub.remove(); }
  const desc = root.querySelector('.agenda-descripcion');
  if (desc) desc.textContent = ev.descripcion || '';
  const precio = root.querySelector('.agenda-precio');
  if (precio) {
    if (ev.precio) precio.querySelector('strong').textContent = `$${Number(ev.precio).toLocaleString('es-AR')} por persona`;
    else precio.remove();
  }
  const img = root.querySelector('.agenda-flyer img');
  const link = root.querySelector('.agenda-flyer a');
  if (img && ev.imagen) { img.src = ev.imagen; img.alt = ev.titulo; }
  if (link) { if (ev.imagen) link.href = ev.imagen; else link.remove(); }
  if (opciones.conAcciones === false) {
    const acciones = root.querySelector('.agenda-acciones');
    if (acciones) acciones.remove();
    const aviso = root.querySelector('.agenda-aviso');
    if (aviso) aviso.remove();
  } else {
    const btnWa = root.querySelector('.agenda-acciones a.btn-primario');
    if (btnWa) btnWa.href = ev.whatsapp_link;
  }
}

function clonarPlantillaEvento() {
  const tpl = document.getElementById('tpl-agenda-evento');
  return tpl ? tpl.content.firstElementChild.cloneNode(true) : null;
}

function inyectarJsonLd(eventos) {
  const script = document.querySelector('script[type="application/ld+json"]');
  if (!script || !eventos.length) return;
  const toEvent = ev => ({
    "@context": "https://schema.org",
    "@type": "Event",
    "name": ev.titulo,
    "description": ev.descripcion,
    "startDate": `${ev.fecha}T${ev.hora || '21:00'}:00-03:00`,
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": {
      "@type": "Place", "name": "Gran Vadori",
      "address": { "@type": "PostalAddress", "streetAddress": "Ruta E96, Km 24", "addressLocality": "Falda del Carmen", "addressRegion": "Córdoba", "addressCountry": "AR" }
    },
    "image": ev.imagen,
    "offers": { "@type": "Offer", "price": String(ev.precio || 0), "priceCurrency": "ARS", "availability": "https://schema.org/InStock", "url": "https://granvadori.com.ar/agenda.html" },
    "organizer": { "@type": "Organization", "name": "Gran Vadori", "url": "https://granvadori.com.ar/" }
  });
  script.textContent = JSON.stringify(eventos.length === 1 ? toEvent(eventos[0]) : { "@context": "https://schema.org", "@graph": eventos.map(toEvent) });
}

(async () => {
  const data = await fetchEventosGV();
  if (!data) return; // fallback: queda el contenido hardcodeado del HTML

  const home = document.querySelector('#proximo-evento');
  if (home) {
    const seccionAgenda = home.closest('#agenda') || home;
    if (data.proximo) { pintarAgendaEvento(home, data.proximo); seccionAgenda.hidden = false; }
    else seccionAgenda.hidden = true;
  }

  const listaProximas = document.querySelector('[data-agenda="proximas"]');
  if (listaProximas) {
    if (data.proximos && data.proximos.length) {
      listaProximas.innerHTML = '';
      data.proximos.forEach(ev => {
        const art = clonarPlantillaEvento();
        if (!art) return;
        pintarAgendaEvento(art, ev);
        listaProximas.appendChild(art);
      });
      inyectarJsonLd(data.proximos);
    } else {
      listaProximas.innerHTML = '<p class="agenda-vacio">Por ahora no hay fechas confirmadas. Seguinos para no perderte la próxima.</p>';
    }
  }

  const listaAnteriores = document.querySelector('[data-agenda="anteriores"]');
  if (listaAnteriores) {
    if (data.anteriores && data.anteriores.length) {
      listaAnteriores.innerHTML = '';
      data.anteriores.slice(0, 6).forEach(ev => {
        const art = clonarPlantillaEvento();
        if (!art) return;
        pintarAgendaEvento(art, ev, { conAcciones: false });
        listaAnteriores.appendChild(art);
      });
    } else {
      listaAnteriores.innerHTML = '<p class="agenda-vacio">Cuando termine cada noche, la vas a encontrar acá.</p>';
    }
  }
})();
