// Onboarding modal: hero, about step, then one light guide panel. Pure helpers first, DOM below.
import { HERO, ABOUT, GUIDE } from './copy.js';

export const STORAGE_KEY = 'carbon-guide-dismissed';

// Hero is page 0, About page 1, the guide panel is the last page (the "?" button opens it directly).
export const PAGES = [{ kind: 'hero', ...HERO }, { kind: 'about', ...ABOUT }, { kind: 'guide', ...GUIDE }];
export const GUIDE_PAGE = PAGES.length - 1;

// "No colour, no zero. A village ..." -> ['No colour, no zero.', 'A village ...'] (lead shown in bold).
export function splitLead(text) {
  const i = text.indexOf('. ');
  return i < 0 ? ['', text] : [text.slice(0, i + 1), text.slice(i + 2)];
}

export const clampPage = (i, n = PAGES.length) => Math.max(0, Math.min(n - 1, i));

export function shouldAutoOpen(storage) {
  try {
    return storage.getItem(STORAGE_KEY) !== '1';
  } catch {
    return true;
  }
}

export function setDismissed(storage, on) {
  try {
    if (on) storage.setItem(STORAGE_KEY, '1');
    else storage.removeItem(STORAGE_KEY);
  } catch { /* storage unavailable: ignore */ }
}

const BACKGROUND = '.hdr, .rail, .drawer, .stage, #btn-help';
const setInert = (on) => document.querySelectorAll(BACKGROUND).forEach((n) => { n.inert = on; });

function node(tag, text, cls) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}

function renderHero(body, p) {
  const h1 = node('h1', p.name, 'hname');
  body.append(node('p', p.keywords, 'hkw'), h1, node('p', p.subtitle, 'hsub'));
  const btn = node('button', p.button, 'hbtn');
  btn.type = 'button';
  btn.dataset.next = '1';
  body.append(btn);
  return h1;
}

function renderAbout(body, p) {
  const wrap = node('div', undefined, 'about');
  if (p.photo) {
    const img = node('img', undefined, 'aphoto');
    img.src = p.photo;
    img.alt = p.photoAlt || '';
    img.addEventListener('error', () => img.remove());
    wrap.append(img);
  }
  const txt = node('div', undefined, 'atext');
  const h2 = node('h2', p.title);
  txt.append(node('p', p.label, 'alabel'), h2);
  p.paragraphs.forEach((t) => txt.append(node('p', t)));
  if (p.footer) txt.append(node('p', p.footer, 'afoot'));
  wrap.append(txt);
  if (p.highlights && p.highlights.length) {
    const hl = node('div', undefined, 'ahl');
    p.highlights.forEach((h) => { const c = node('div', undefined, 'astat'); c.append(node('b', h.value), node('span', h.label)); hl.append(c); });
    wrap.append(hl);
  }
  body.append(wrap);
  return h2;
}

const ICON = {
  check: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="9" fill="currentColor"/><path d="M6 10.2l2.6 2.6L14.2 7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  warn: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 2L1.5 17.5h17z" fill="currentColor"/><path d="M10 8v4.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="15" r="1.1" fill="#fff"/></svg>',
};

function icon(kind, cls) {
  const s = node('span', undefined, cls);
  s.innerHTML = ICON[kind]; // fixed, trusted markup
  return s;
}

function renderGuide(body, p) {
  const h2 = node('h2', p.title, 'gtitle');
  body.append(h2, node('p', p.intro, 'gintro'));

  body.append(node('h3', p.doTitle, 'gsub'));
  const ul = node('ul', undefined, 'gchecks');
  p.doItems.forEach((t) => { const li = node('li'); li.append(icon('check', 'gico'), node('span', t)); ul.append(li); });
  body.append(ul);

  const notes = node('div', undefined, 'gnotes');
  const nh = node('h3', undefined, 'gsub');
  nh.append(icon('warn', 'gico'), node('span', p.notesTitle));
  const nl = node('ul');
  p.notes.forEach((t) => nl.append(node('li', t)));
  notes.append(nh, nl);
  body.append(notes);

  const imp = node('div', undefined, 'gimportant');
  const ol = node('ol');
  p.important.forEach((t) => {
    const [lead, rest] = splitLead(t);
    const li = node('li');
    if (lead) li.append(node('strong', lead), document.createTextNode(' '));
    li.append(document.createTextNode(rest));
    ol.append(li);
  });
  imp.append(node('h3', p.importantTitle), ol);
  body.append(imp);
  return h2;
}

// Renders a page and returns its heading element (used as the dialog label).
function renderPage(body, p) {
  body.replaceChildren();
  if (p.kind === 'hero') return renderHero(body, p);
  if (p.kind === 'about') return renderAbout(body, p);
  return renderGuide(body, p);
}

const FOCUSABLE = 'button:not([hidden]), input, [href], [tabindex]:not([tabindex="-1"])';

// root: the #guide element (contains the .gcard markup built here). Returns { open, close }.
export function createGuide(root, storage = globalThis.localStorage, opener = null) {
  root.replaceChildren();
  const card = node('div', undefined, 'gcard');
  card.setAttribute('role', 'document');
  const body = node('div', undefined, 'gbody');
  body.id = 'guide-body';
  const dots = node('div', undefined, 'gdots');
  const skip = node('button', 'Skip', 'gbtn ghost');
  const back = node('button', 'Back', 'gbtn');
  const next = node('button', 'Next', 'gbtn primary');
  [skip, back, next].forEach((b) => { b.type = 'button'; });
  const label = node('label', undefined, 'gcheck');
  const cb = node('input');
  cb.type = 'checkbox';
  label.append(cb, node('span', "Don't show again"));
  const nav = node('div', undefined, 'gnav');
  nav.append(skip, back, next);
  const foot = node('div', undefined, 'gfoot');
  foot.append(label, nav);
  card.append(body, dots, foot);
  root.append(card);
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'guide-title');

  let page = 0;
  let lastFocus = null;

  function show(i) {
    page = clampPage(i);
    const p = PAGES[page];
    renderPage(body, p).id = 'guide-title';
    card.classList.toggle('hero', p.kind === 'hero');
    card.classList.toggle('light', p.kind === 'guide');
    card.classList.toggle('abt', p.kind === 'about');
    dots.replaceChildren(...PAGES.map((_, k) => {
      const d = node('span', undefined, k === page ? 'dot on' : 'dot');
      d.setAttribute('aria-hidden', 'true');
      return d;
    }));
    dots.setAttribute('aria-label', `Page ${page + 1} of ${PAGES.length}`);
    back.hidden = page === 0;
    next.textContent = page === PAGES.length - 1 ? 'Done' : 'Next';
    skip.hidden = page === PAGES.length - 1;
    body.scrollTop = 0;
  }

  function close() {
    if (root.hidden) return;
    setDismissed(storage, cb.checked);
    root.hidden = true;
    setInert(false);
    document.removeEventListener('keydown', onKey, true);
    const f = opener || lastFocus;
    if (f && f.focus) f.focus();
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {
      const items = [...root.querySelectorAll(FOCUSABLE)].filter((n) => !n.disabled);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!root.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  }

  next.addEventListener('click', () => { if (page === PAGES.length - 1) close(); else show(page + 1); });
  back.addEventListener('click', () => show(page - 1));
  body.addEventListener('click', (e) => { if (e.target.closest('[data-next]')) show(page + 1); });
  skip.addEventListener('click', close);
  root.addEventListener('click', (e) => { if (e.target === root) close(); });

  // start: page index to open at (0 = hero; GUIDE_PAGE for the "?" button).
  function open(start = 0) {
    lastFocus = document.activeElement;
    cb.checked = !shouldAutoOpen(storage);
    show(start);
    root.hidden = false;
    setInert(true);
    document.addEventListener('keydown', onKey, true);
    next.focus();
  }

  root.hidden = true;
  return { open, close, show };
}
