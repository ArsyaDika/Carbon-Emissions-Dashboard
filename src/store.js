export const DEFAULT_STATE = {
  t: 23,
  mode: 'month',
  selection: null,
  tab: 'dash',
  scenario: 'actual',
};

export function createStore(initial = DEFAULT_STATE) {
  let state = { ...initial };
  const subs = new Set();
  return {
    get: () => state,
    set(patch) {
      const changed = Object.keys(patch).some((k) => !Object.is(state[k], patch[k]));
      if (!changed) return;
      state = { ...state, ...patch };
      [...subs].forEach((fn) => fn(state));
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}
