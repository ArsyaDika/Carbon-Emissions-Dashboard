// Chart dock: four Chart.js charts that follow the store (scope, mode, month).
import { labelFor, THEME } from './config.js';
import { trendSeries, topVillages, intensitySeries, reductionRunning, axisDecimals } from './chartdata.js';
import { fmt } from './fmt.js';
import { displayName } from './names.js';

const TICK = '#a3bfa9';
const GRID = 'rgba(39,64,47,.7)';
const DIM = THEME.ramp[0];
const MONTH_LABELS = Array.from({ length: 24 }, (_, i) => labelFor(i));

// The series object the charts read: overview, or the selected village's properties.
export function scopeOf(state, data) {
  const sel = state.selection;
  if (sel) {
    const f = data.villages.features.find((x) => x.properties.id === sel.id);
    if (f) return { series: f.properties, name: displayName(f.properties.name), sel };
  }
  return { series: data.meta.overall, name: 'All areas', sel: null };
}

// Villages feeding top-10: always all villages; a selected village is highlighted, not filtered.
export function villagesInScope(state, data) {
  return data.villages.features;
}

const MOBILE = '(max-width:700px)';
const isMobile = () => typeof window !== 'undefined' && window.matchMedia(MOBILE).matches;
// Chart text is 8px in the slim desktop dock; on phones the dock is taller and text must stay >= 10px.
const fontPx = () => (isMobile() ? 10 : 8);
const GREEN2 = '#34d399'; // matches --ac2
const ORANGE = '#fb923c'; // baseline (matches --warn / ramp top)

// Highlights the selected month on a category line chart: a vertical line (Month) or a shaded Apr 2024..month band (Cumulative).
const selectionPlugin = (getSel) => ({
  id: 'selection',
  beforeDatasetsDraw(chart) {
    const { t, mode } = getSel();
    const x = chart.scales.x, { top, bottom } = chart.chartArea, ctx = chart.ctx;
    const half = (x.getPixelForValue(1) - x.getPixelForValue(0)) / 2;
    ctx.save();
    if (mode === 'cumulative') {
      ctx.fillStyle = 'rgba(163,230,53,.12)';
      const l = x.getPixelForValue(0) - half;
      ctx.fillRect(l, top, x.getPixelForValue(t) + half - l, bottom - top);
    } else {
      ctx.strokeStyle = 'rgba(163,230,53,.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x.getPixelForValue(t), top);
      ctx.lineTo(x.getPixelForValue(t), bottom);
      ctx.stroke();
    }
    ctx.restore();
  },
});

// Legend only where there are two series, and only on phones where the dock is tall enough to carry it.
const legendOpts = () => ({ display: isMobile(), position: 'bottom', labels: { color: TICK, boxWidth: 10, boxHeight: 10, padding: 6, font: { size: fontPx() } } });

function baseOptions(extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    layout: { padding: 0 },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: THEME.surface, borderColor: THEME.line, borderWidth: 1, titleColor: '#e8f3ea', bodyColor: TICK, padding: 6 },
    },
    ...extra,
  };
}
const scaleStyle = ({ ticks = {}, ...rest } = {}) => ({ grid: { color: GRID }, border: { color: THEME.line }, ...rest, ticks: { color: TICK, font: { size: fontPx() }, maxRotation: 0, ...ticks } });
const axisTitle = (text) => ({ display: true, text, color: TICK, font: { size: fontPx() }, padding: 0 });
// Tick labels with as many decimals as the tick step needs (small scopes no longer read "0 0 0").
const valueTick = (v, i, ticks) => {
  if (!Number.isFinite(v)) return '';
  const d = axisDecimals(ticks);
  return Number(v.toFixed(d)).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
};

export function renderDock(store, data) {
  const charts = new Map();
  const body = (n) => document.querySelector(`#dock-${n} .cbody`);

  function mount(n, build) {
    charts.get(n)?.destroy();
    charts.delete(n);
    const el = body(n);
    if (!el) return;
    el.textContent = '';
    const cfg = build();
    if (!cfg) {
      const msg = document.createElement('div');
      msg.className = 'nodata';
      msg.textContent = 'No data for this selection';
      el.append(msg);
      return;
    }
    if (typeof Chart === 'undefined') {
      const msg = document.createElement('div');
      msg.className = 'nodata';
      msg.textContent = 'Charts unavailable';
      el.append(msg);
      return;
    }
    const canvas = document.createElement('canvas');
    el.append(canvas);
    charts.set(n, new Chart(canvas, cfg));
  }

  // Monthly bars; months inside the selected range (one month, or Apr 2024..t) are bright, the rest dim.
  function monthlyBars(s, colorOn, unit, name) {
    if (s.values.every((v) => v === null)) return null;
    return {
      type: 'bar',
      data: { labels: MONTH_LABELS, datasets: [{ data: s.values, backgroundColor: s.inRange.map((on) => (on ? colorOn : DIM)), borderWidth: 0, barPercentage: 0.9, categoryPercentage: 0.95 }] },
      options: baseOptions({
        scales: {
          x: scaleStyle({ ticks: { callback: (v, i) => (i % 6 === 0 ? MONTH_LABELS[i] : ''), autoSkip: false } }),
          y: scaleStyle({ beginAtZero: true, title: axisTitle(unit), ticks: { maxTicksLimit: 4, callback: valueTick } }),
        },
        plugins: { ...baseOptions().plugins, tooltip: { ...baseOptions().plugins.tooltip, callbacks: { label: (c) => `${name}: ${fmt(c.parsed.y)} ${unit}` } } },
      }),
    };
  }

  let last = null;
  function render(state) {
    const key = [state.t, state.mode, state.selection?.id].join('|');
    if (key === last) return;
    last = key;
    const { series } = scopeOf(state, data);
    const villages = villagesInScope(state, data);

    mount(1, () => monthlyBars(trendSeries(series, state.mode, state.t), THEME.accent, 'tCO2e', 'Emissions'));

    mount(2, () => {
      const rows = topVillages(villages, state.mode, state.t, 10);
      const hl = state.selection ? state.selection.id : null;
      if (!rows.length) return null;
      return {
        type: 'bar',
        data: { labels: rows.map((r) => r.name), datasets: [{ data: rows.map((r) => r.value), backgroundColor: rows.map((r) => (hl && r.id === hl ? THEME.accent : THEME.ramp[2])), borderWidth: 0 }] },
        options: baseOptions({
          indexAxis: 'y',
          onClick: (e, els) => {
            if (!els.length) return;
            const id = rows[els[0].index].id;
            // Defer: store.set re-renders and destroys this chart while Chart.js is still dispatching the event.
            setTimeout(() => store.set({ selection: { id } }), 0);
          },
          onHover: (e, els) => { if (e.native?.target) e.native.target.style.cursor = els.length ? 'pointer' : 'default'; },
          scales: {
            x: scaleStyle({ beginAtZero: true, title: axisTitle('tCO2e/ha'), ticks: { maxTicksLimit: 4, callback: valueTick } }),
            y: scaleStyle({ grid: { display: false }, ticks: { autoSkip: false, font: { size: fontPx() }, padding: 2 } }),
          },
          plugins: { ...baseOptions().plugins, tooltip: { ...baseOptions().plugins.tooltip, callbacks: { title: (items) => { const r = rows[items[0].dataIndex]; return r.sub ? `${r.name} (${r.sub})` : r.name; }, label: (c) => `${fmt(c.parsed.x)} tCO2e/ha` } } },
        }),
      };
    });

    mount(3, () => {
      const d = intensitySeries(series, state.mode, state.t);
      if (d.actual.every((v) => v === null) && d.baseline.every((v) => v === null)) return null;
      const line = (label, data, color) => ({
        label, data, borderColor: color, backgroundColor: color, borderWidth: 1.5, tension: 0, spanGaps: false,
        pointRadius: data.map((v, i) => (v === null ? 0 : (state.mode === 'month' && i === state.t ? 4 : 1.5))),
        pointHoverRadius: 4,
      });
      return {
        type: 'line',
        data: { labels: MONTH_LABELS, datasets: [line('Actual', d.actual, THEME.accent), line('Baseline', d.baseline, ORANGE)] },
        plugins: [selectionPlugin(() => ({ t: state.t, mode: state.mode }))],
        options: baseOptions({
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: scaleStyle({ ticks: { callback: (v, i) => (i % 6 === 0 ? MONTH_LABELS[i] : ''), autoSkip: false } }),
            y: scaleStyle({ beginAtZero: true, title: axisTitle('kg CO2e / kg grain'), ticks: { maxTicksLimit: 4, callback: valueTick } }),
          },
          plugins: {
            ...baseOptions().plugins,
            legend: legendOpts(),
            tooltip: {
              ...baseOptions().plugins.tooltip,
              callbacks: {
                label: (c) => `${c.dataset.label}: ${fmt(c.parsed.y)} kg CO2e/kg`,
                afterBody: (items) => {
                  const i = items[0].dataIndex;
                  return d.diff[i] === null ? '' : `Difference (actual − baseline): ${fmt(d.diff[i])} kg CO2e/kg`;
                },
              },
            },
          },
        }),
      };
    });

    mount(4, () => {
      const r = reductionRunning(series, state.mode, state.t);
      if (r.bars.every((v) => v === null)) return null;
      return {
        data: {
          labels: MONTH_LABELS,
          datasets: [
            { type: 'bar', label: 'Monthly reduction', yAxisID: 'y', data: r.bars, backgroundColor: r.inRange.map((on) => (on ? GREEN2 : DIM)), borderWidth: 0, barPercentage: 0.9, categoryPercentage: 0.95, order: 2 },
            {
              type: 'line', label: 'Cumulative reduction', yAxisID: 'y1', data: r.cumulative, borderColor: THEME.accent, backgroundColor: THEME.accent, borderWidth: 1.5, tension: 0, spanGaps: false, order: 1,
              pointRadius: r.cumulative.map((v, i) => (v !== null && i === state.t ? 4 : 0)), pointHoverRadius: 4,
            },
          ],
        },
        options: baseOptions({
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: scaleStyle({ ticks: { callback: (v, i) => (i % 6 === 0 ? MONTH_LABELS[i] : ''), autoSkip: false } }),
            y: scaleStyle({ beginAtZero: true, title: axisTitle('tCO2e per month'), ticks: { maxTicksLimit: 4, callback: valueTick } }),
            y1: scaleStyle({ position: 'right', beginAtZero: true, grid: { display: false }, title: axisTitle('Cumulative tCO2e'), ticks: { maxTicksLimit: 4, callback: valueTick } }),
          },
          plugins: {
            ...baseOptions().plugins,
            legend: legendOpts(),
            tooltip: { ...baseOptions().plugins.tooltip, callbacks: { label: (c) => (c.parsed.y === null ? null : `${c.dataset.label}: ${fmt(c.parsed.y)} tCO2e`) } },
          },
        }),
      };
    });
  }

  // Re-render when the phone breakpoint is crossed so fonts and the legend follow.
  const mq = window.matchMedia(MOBILE);
  const onMq = () => { last = null; render(store.get()); };
  mq.addEventListener?.('change', onMq);
  const unsub = store.subscribe(render);
  render(store.get());
  return { destroy: () => { unsub(); mq.removeEventListener?.('change', onMq); charts.forEach((c) => c.destroy()); charts.clear(); } };
}
