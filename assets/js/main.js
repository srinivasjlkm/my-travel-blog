// ============================================================
// FIELD NOTES — shared interactivity
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  renderStamps();
  initAccordion();
  initRouteStrip();
  initLightbox();
  initScrollReveal();
  initCountryNavHighlight();
});

/* ---------- mobile nav ---------- */
function initNavToggle(){
  const btn = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(!btn || !links) return;
  btn.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
}

/* ---------- passport stamp (the signature element) ----------
   Circular ink-ring badge, optionally with a cropped photo inside.
   The country name sits in a tag overlapping the top of the ring
   (not curved text on the ring itself) so it stays readable over any photo.
   Usage: <div class="stamp" data-top="THAILAND"></div>
   Add data-photo="assets/img/yourphoto.webp" to crop a real photo inside the ring.
*/
function renderStamps(){
  document.querySelectorAll('.stamp').forEach(el => {
    const top = el.dataset.top || '';
    const photo = el.dataset.photo || '';
    el.innerHTML = `
      <span class="stamp-label">${top}</span>
      ${photo ? `<img class="stamp-photo" src="${photo}" alt="${top}">` : ''}
      <svg viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
        <circle class="stamp-ink stamp-outer" cx="75" cy="75" r="68" />
        <circle class="stamp-ink stamp-inner" cx="75" cy="75" r="58" />
        ${photo ? '' : '<path class="stamp-icon" transform="translate(67,60) scale(0.9)" d="M16 1 L18 7 L24 9 L18 11 L16 17 L14 11 L8 9 L14 7 Z" />'}
      </svg>
    `;
  });
}

/* ---------- itinerary accordion ---------- */
function initAccordion(){
  document.querySelectorAll('.stop-head').forEach(head => {
    head.addEventListener('click', () => {
      const stop = head.closest('.stop');
      const wasOpen = stop.classList.contains('open');
      stop.parentElement.querySelectorAll('.stop.open').forEach(s => s.classList.remove('open'));
      if(!wasOpen) stop.classList.add('open');
    });
  });
  const first = document.querySelector('.itinerary .stop');
  if(first) first.classList.add('open');
}

/* ---------- route-strip pills: jump to + open matching itinerary stop ---------- */
function initRouteStrip(){
  document.querySelectorAll('.route-dot[data-stop-target]').forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(dot.dataset.stopTarget);
      if(!target) return;
      target.parentElement.querySelectorAll('.stop.open').forEach(s => s.classList.remove('open'));
      target.classList.add('open');
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ---------- lightbox gallery ---------- */
function initLightbox(){
  const galleries = document.querySelectorAll('.gallery');
  if(!galleries.length) return;

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `
    <button class="lightbox-close" aria-label="Close">✕</button>
    <button class="lightbox-prev" aria-label="Previous">‹</button>
    <img src="" alt="" />
    <button class="lightbox-next" aria-label="Next">›</button>
  `;
  document.body.appendChild(lb);
  const img = lb.querySelector('img');
  let items = [];
  let idx = 0;

  function open(list, i){
    items = list; idx = i;
    img.src = items[idx].src;
    img.alt = items[idx].alt || '';
    lb.classList.add('open');
  }
  function close(){ lb.classList.remove('open'); }
  function step(d){ idx = (idx + d + items.length) % items.length; img.src = items[idx].src; img.alt = items[idx].alt || ''; }

  galleries.forEach(g => {
    const imgs = Array.from(g.querySelectorAll('img'));
    imgs.forEach((im, i) => {
      im.addEventListener('click', () => open(imgs, i));
    });
  });

  lb.querySelector('.lightbox-close').addEventListener('click', close);
  lb.querySelector('.lightbox-prev').addEventListener('click', () => step(-1));
  lb.querySelector('.lightbox-next').addEventListener('click', () => step(1));
  lb.addEventListener('click', (e) => { if(e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if(!lb.classList.contains('open')) return;
    if(e.key === 'Escape') close();
    if(e.key === 'ArrowLeft') step(-1);
    if(e.key === 'ArrowRight') step(1);
  });
}

/* ---------- scroll reveal ---------- */
function initScrollReveal(){
  const els = document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window) || !els.length){
    els.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => io.observe(el));
}

/* ---------- highlight active section in sticky country-nav ---------- */
function initCountryNavHighlight(){
  const nav = document.querySelector('.country-nav');
  if(!nav) return;
  const links = Array.from(nav.querySelectorAll('a'));
  const sections = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if(!sections.length) return;

  window.addEventListener('scroll', () => {
    let current = sections[0];
    sections.forEach(sec => {
      if(window.scrollY + 160 >= sec.offsetTop) current = sec;
    });
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current.id));
  }, { passive: true });
}
