// Static top header: title, owner line and contact links. Strings come from copy.js.
import { HEADER_TITLE, HEADER_NAME, HEADER_ROLES, HEADER_EMAIL, HEADER_LOCATION, HEADER_LINKEDIN } from './copy.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svg(cls, viewBox, paths) {
  const s = document.createElementNS(SVG_NS, 'svg');
  s.setAttribute('viewBox', viewBox);
  s.setAttribute('class', cls);
  s.setAttribute('aria-hidden', 'true');
  s.setAttribute('focusable', 'false');
  for (const [d, attrs] of paths) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    for (const [k, v] of Object.entries(attrs)) p.setAttribute(k, v);
    s.append(p);
  }
  return s;
}

const leaf = () => svg('hleaf', '0 0 24 24', [
  ['M20 3C10 3 4 8 4 15c0 2 .6 3.8 1.6 5.2C7 14 11 10 16 8c-4 3-7.4 7-9.2 12.6C8 21.5 9.8 22 12 22c6 0 9-6 8-19z', { fill: 'currentColor' }],
]);
const pin = () => svg('hpin', '0 0 24 24', [
  ['M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z', { fill: 'currentColor' }],
]);

function node(tag, text, cls) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}

const sep = () => {
  const s = node('span', '|', 'hsep');
  s.setAttribute('aria-hidden', 'true');
  return s;
};

// el: the <header> element. Keeps --hdr-h in sync with its rendered height so the layout below can offset.
export function renderHeader(el) {
  const bar = node('div', undefined, 'hbar');
  const icon = node('span', undefined, 'hicon');
  icon.append(leaf());
  const text = node('div', undefined, 'htext');
  const title = node('p', HEADER_TITLE, 'htitle');
  const line = node('p', undefined, 'hline');
  const mail = node('a', HEADER_EMAIL, 'hmail');
  mail.href = `mailto:${HEADER_EMAIL}`;
  const loc = node('span', undefined, 'hloc');
  loc.append(pin(), document.createTextNode(HEADER_LOCATION));
  const li = node('a', HEADER_LINKEDIN.text, 'hli');
  li.href = HEADER_LINKEDIN.href;
  li.target = '_blank';
  li.rel = 'noopener noreferrer';
  const roles = node('span', HEADER_ROLES, 'hroles');
  const rolesSep = sep();
  rolesSep.classList.add('hroles-sep');
  line.append(node('span', HEADER_NAME, 'hname-s'), rolesSep, roles, sep(), mail, sep(), loc, sep(), li);
  text.append(title, line);
  bar.append(icon, text);
  el.replaceChildren(bar);

  const sync = () => document.documentElement.style.setProperty('--hdr-h', `${Math.ceil(el.getBoundingClientRect().height)}px`);
  sync();
  if (typeof ResizeObserver === 'function') new ResizeObserver(sync).observe(el);
  else window.addEventListener('resize', sync);
}
