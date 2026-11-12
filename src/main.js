import { createStore, DEFAULT_STATE } from './store.js';
import { periodLabel, N_MONTHS } from './config.js';
import { loadAll } from './dataload.js';
import { createMap } from './map.js';
import { parseHash } from './mapdata.js';
import { scopeKpis } from './metrics.js';
import { renderKpis } from './kpi.js';
import { renderDock, scopeOf } from './charts.js';
import { renderFactors } from './factors.js';
import { renderDataTab } from './datatab.js';
import { createGuide, shouldAutoOpen, GUIDE_PAGE } from './guide.js';
import { renderHeader } from './header.js';
import { cumulativeExample } from './cumulative.js';
import { REDUCTION_TOOLTIP, TOTAL_AREA_TOOLTIP, BASELINE_TOOLTIP, ACTUAL_TOOLTIP } from './copy.js';

const $ = (id) => document.getElementById(id);
const store = createStore();
renderHeader($('hdr'));

// Hash is read (validated against whitelists; unknown values ignored), never written back.
store.set(parseHash(location.hash));
window.addEventListener('hashchange', () => store.set(parseHash(location.hash)));

function showBanner(text) {
  const box = $('error');
  box.textContent = text;
  box.hidden = false;
}

function setTab(tab) {
  document.querySelectorAll('#rail [data-tab]').forEach((b) => {
    const on = b.dataset.tab === tab;
    b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  document.querySelectorAll('#drawer [data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== tab; });
  document.body.classList.toggle('drawer-open', tab !== 'dash');
  document.body.dataset.tab = tab;
}

// Every .seg[data-key] is bound to that store key; the same key may appear in several places.
function wireSegs() {
  const segs = [...document.querySelectorAll('.seg[data-key]')];
  segs.forEach((seg) => seg.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-value]');
    if (!btn) return;
    store.set({ [seg.dataset.key]: btn.dataset.value });
  }));
  return (s) => segs.forEach((seg) => seg.querySelectorAll('button').forEach((b) => {
    const on = b.dataset.value === s[seg.dataset.key];
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  }));
}

const slider = $('month');
slider.max = String(N_MONTHS - 1);
slider.value = String(DEFAULT_STATE.t);
slider.addEventListener('input', () => store.set({ t: Number(slider.value) }));
document.querySelectorAll('#rail [data-tab]').forEach((b) => b.addEventListener('click', () => store.set({ tab: b.dataset.tab })));

const renders = [
  wireSegs(),
  (s) => {
    slider.value = s.t;
    const p = periodLabel(s.mode, s.t);
    $('period-prefix').textContent = p.prefix;
    $('month-label').textContent = p.value;
    slider.setAttribute('aria-valuetext', p.text);
  },
  (s) => setTab(s.tab),
];
store.subscribe((s) => renders.forEach((r) => r(s)));
renders.forEach((r) => r(store.get()));

// KPI card tip: keyboard (focus + aria-label), hover, and tap via the small info button; Esc or outside tap closes.
// alignLeft: open the popup towards the right (cards in the left column on phones).
function setupTip(card, text, btnLabel, alignLeft = false) {
  card.classList.add('hastip');
  if (alignLeft) card.classList.add('tipl');
  card.tabIndex = 0;
  card.setAttribute('aria-label', `${card.querySelector('small').textContent}. ${text}`);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tipbtn';
  btn.textContent = 'ⓘ';
  btn.setAttribute('aria-label', btnLabel);
  btn.setAttribute('aria-expanded', 'false');
  const pop = document.createElement('span');
  pop.className = 'tippop';
  pop.setAttribute('role', 'tooltip');
  pop.textContent = text;
  card.querySelector('small').append(btn);
  card.append(pop);
  const setOpen = (on) => { card.classList.toggle('tip', on); btn.setAttribute('aria-expanded', String(on)); };
  btn.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!card.classList.contains('tip')); });
  document.addEventListener('click', (e) => { if (!card.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

function safeStorage() {
  try { return window.localStorage; } catch { return { getItem: () => null, setItem() {}, removeItem() {} }; }
}
const storage = safeStorage();
const guide = createGuide($('guide'), storage, $('btn-help'));
$('btn-help').addEventListener('click', () => guide.open(GUIDE_PAGE));
setupTip($('kpi-reduction').parentElement, REDUCTION_TOOLTIP, 'What is the baseline?');
setupTip($('kpi-baseline').parentElement, BASELINE_TOOLTIP, 'What is the baseline emission?');
setupTip($('kpi-emission').parentElement, ACTUAL_TOOLTIP, 'How is actual emission per hectare estimated?');
setupTip($('kpi-area').parentElement, TOTAL_AREA_TOOLTIP, 'How is total land area calculated?', true);
if (shouldAutoOpen(storage)) guide.open();

window.__carbon = { store, data: null, guide };
loadAll()
  .then((data) => {
    window.__carbon.data = data;
    $('loading').hidden = true;
    try {
      window.__carbon.map = createMap($('map'), store, data);
    } catch (err) {
      console.warn('map setup failed:', err && err.message);
      showBanner('Map unavailable. Figures and charts below still work.');
    }
    const paintKpis = (s) => renderKpis($('kpis'), scopeKpis(scopeOf(s, data).series, s.mode, s.t));
    store.subscribe(paintKpis);
    paintKpis(store.get());
    window.__carbon.dock = renderDock(store, data);
    const paintFactors = (s) => {
      const sc = scopeOf(s, data);
      renderFactors($('factors-root'), sc.sel, data.factors, sc.sel ? sc.name : '', s.scenario);
    };
    store.subscribe(paintFactors);
    paintFactors(store.get());
    const hasApprox = data.villages.features.some((f) => f.properties.approx === true);
    renderDataTab($('data-root'), data.meta, {
      hasApprox,
      getExample: () => { const s = store.get(); return cumulativeExample(data, scopeOf(s, data), s.t); },
      subscribe: (fn) => store.subscribe(fn),
    });
  })
  .catch((err) => {
    $('loading').hidden = true;
    showBanner(err.message);
  });
