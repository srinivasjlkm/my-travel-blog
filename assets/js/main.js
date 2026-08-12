// ============================================================
// FIELD NOTES — shared interactivity
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  renderStamps();
  initAccordion();
  initRouteStrip();
  initCarousels();
  loadCountryGallery();
  initGeneralAmbientPhotos();
  initScrollReveal();
  initCountryNavHighlight();
});

/* ---------- live photo galleries, pulled from GitHub ----------
   One repo-wide fetch per pageview (efficient, avoids rate limits),
   then distributed into: the country-wide overview gallery, and
   individual per-place / per-sub-place mini-galleries.
   Drop a photo into assets/img/{country}/{place}/{sub-place}/ in the
   repo and it appears in exactly that spot — nothing else to edit.
*/
const GITHUB_USER = 'srinivasjlkm';
const GITHUB_REPO = 'my-travel-blog';
const GITHUB_BRANCH = 'main';
const IMAGE_EXT = /\.(webp|jpg|jpeg|png)$/i;

function rawGithubUrl(path){
  return `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${path}`;
}

/* Derives a readable location label from a photo's folder path, e.g.
   "assets/img/philippines/bohol/anda/photo.webp" -> "Bohol › Anda" */
function locationLabelFromPath(path){
  const parts = path.split('/').slice(3, -1); // drop "assets/img/<country>" and the filename
  if(!parts.length) return '';
  const pretty = parts.map(p => p.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
  return pretty.join(' › ');
}

async function fetchRepoImagePaths(){
  try{
    const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/git/trees/${GITHUB_BRANCH}?recursive=1`);
    if(!res.ok) return [];
    const data = await res.json();
    return (data.tree || [])
      .filter(item => item.type === 'blob' && item.path.startsWith('assets/img/') && IMAGE_EXT.test(item.path))
      .map(item => item.path)
      .sort();
  } catch(err){
    return [];
  }
}

function renderImagesInto(container, paths){
  container.innerHTML = '';
  paths.forEach((path) => {
    const fig = document.createElement('figure');
    const img = document.createElement('img');
    const location = locationLabelFromPath(path);
    if(location) img.dataset.location = location;
    img.src = rawGithubUrl(path);
    img.alt = 'travel photo';
    img.loading = 'lazy';
    fig.appendChild(img);
    container.appendChild(fig);
  });
}

function renderPlaceholdersInto(container, seed, count){
  container.innerHTML = '';
  for(let i = 0; i < count; i++){
    const fig = document.createElement('figure');
    const img = document.createElement('img');
    img.src = `https://picsum.photos/seed/${seed}-${i}/700/700`;
    img.alt = 'placeholder photo';
    img.loading = 'lazy';
    fig.appendChild(img);
    container.appendChild(fig);
  }
}

async function loadCountryGallery(){
  const overview = document.querySelector('.gallery[data-country]');
  const placeContainers = document.querySelectorAll('.place-gallery[data-folder]');
  if(!overview && !placeContainers.length) return;

  const allPaths = await fetchRepoImagePaths();

  if(overview){
    const country = overview.dataset.country;
    const prefix = `assets/img/${country}/`;
    const matches = allPaths.filter(p => p.startsWith(prefix));
    if(matches.length){
      renderImagesInto(overview, matches);
    } else {
      renderPlaceholdersInto(overview, country, parseInt(overview.dataset.fallbackCount || '6', 10));
    }
    initAmbientPhotos(country, matches);

    const heroFallback = document.getElementById('country-hero-photo');
    if(heroFallback && matches.length){
      heroFallback.src = rawGithubUrl(matches[Math.floor(Math.random() * matches.length)]);
    }
  }

  placeContainers.forEach(container => {
    const folder = container.dataset.folder;
    // only files directly inside this folder — deeper sub-place folders get their own container
    const matches = allPaths.filter(p => p.startsWith(folder) && !p.slice(folder.length).includes('/'));
    if(matches.length){
      renderImagesInto(container, matches);
    } else {
      const wrap = container.closest('.carousel-wrap');
      (wrap || container).remove();
    }
  });

  initLightbox();
}

/* ---------- ambient floating background photos (fills empty side margins) ---------- */
function initAmbientPhotos(countrySlug, countryPaths){
  const layer = document.getElementById('bg-photo-layer');
  if(!layer || !countryPaths.length || layer.dataset.filled) return;
  layer.dataset.filled = 'true';
  const path = countryPaths[Math.floor(Math.random() * countryPaths.length)];
  if(!path) return;
  const img = new Image();
  img.onload = () => {
    layer.style.backgroundImage = `url(${rawGithubUrl(path)})`;
    layer.classList.add('loaded');
  };
  img.src = rawGithubUrl(path);
}

/* ---------- page background photo on non-country pages (home, about, plan, more) ----------
   Pulls one image from anywhere in the repo, since these pages have no single
   "country" of their own. */
async function initGeneralAmbientPhotos(){
  const layer = document.getElementById('bg-photo-layer');
  const heroPhoto = document.getElementById('hero-photo');
  if((!layer || document.querySelector('.gallery[data-country]')) && !heroPhoto) return; // country pages handle their own
  const allPaths = await fetchRepoImagePaths();
  if(!allPaths.length) return;
  if(layer && !document.querySelector('.gallery[data-country]')){
    initAmbientPhotos('all', allPaths);
  }
  if(heroPhoto){
    const pick = allPaths[Math.floor(Math.random() * allPaths.length)];
    if(pick) heroPhoto.src = rawGithubUrl(pick);
  }
}

/* ---------- carousels: arrow buttons + mouse-wheel horizontal scroll ----------
   Uses event delegation on the whole document, so it reliably works no matter
   which image in the row the cursor is over, and covers carousels added later. */
function initCarousels(){
  if(window._carouselsDelegated) return;
  window._carouselsDelegated = true;

  document.addEventListener('wheel', (e) => {
    const track = e.target.closest('.gallery');
    if(!track) return;
    if(track.scrollWidth <= track.clientWidth + 2) return; // nothing to scroll
    if(Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // let native horizontal gestures through
    e.preventDefault();
    const WHEEL_SPEED = 5; // multiplier — raise/lower to tune scroll speed per wheel tick
    track.scrollLeft += e.deltaY * WHEEL_SPEED;
  }, { passive: false });

  document.addEventListener('click', (e) => {
    const prevBtn = e.target.closest('.car-prev');
    const nextBtn = e.target.closest('.car-next');
    const btn = prevBtn || nextBtn;
    if(!btn) return;
    const wrap = btn.closest('.carousel-wrap');
    const track = wrap && wrap.querySelector('.gallery');
    if(!track) return;
    const amount = track.clientWidth * 0.8;
    track.scrollBy({ left: prevBtn ? -amount : amount, behavior: 'smooth' });
  });
}

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

/* ---------- itinerary timeline (expand/collapse) ---------- */
function initAccordion(){
  document.querySelectorAll('.tl-head').forEach(head => {
    head.addEventListener('click', () => {
      const stop = head.closest('.tl-stop');
      const wasOpen = stop.classList.contains('open');
      stop.parentElement.querySelectorAll('.tl-stop.open').forEach(s => s.classList.remove('open'));
      if(!wasOpen) stop.classList.add('open');
    });
  });
  const first = document.querySelector('.timeline .tl-stop');
  if(first) first.classList.add('open');
}

/* ---------- route-strip pills: jump to + open matching itinerary stop ---------- */
function initRouteStrip(){
  document.querySelectorAll('.route-dot[data-stop-target]').forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(dot.dataset.stopTarget);
      if(!target) return;
      target.parentElement.querySelectorAll('.tl-stop.open').forEach(s => s.classList.remove('open'));
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
    <div class="lightbox-media">
      <div class="lightbox-caption"></div>
      <img src="" alt="" />
    </div>
    <button class="lightbox-next" aria-label="Next">›</button>
  `;
  document.body.appendChild(lb);
  const img = lb.querySelector('img');
  const caption = lb.querySelector('.lightbox-caption');
  let items = [];
  let idx = 0;

  function render(){
    img.src = items[idx].src;
    img.alt = items[idx].alt || '';
    const loc = items[idx].dataset ? items[idx].dataset.location : '';
    caption.textContent = loc || '';
    caption.style.display = loc ? '' : 'none';
  }
  function open(list, i){
    items = list; idx = i;
    render();
    lb.classList.add('open');
  }
  function close(){ lb.classList.remove('open'); }
  function step(d){ idx = (idx + d + items.length) % items.length; render(); }

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
