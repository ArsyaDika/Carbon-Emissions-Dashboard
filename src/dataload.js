const FILES = {
  villages: 'villages.geojson',
  factors: 'factors.json',
  meta: 'meta.json',
};

async function loadOne(file, url, fetchFn) {
  let res;
  try {
    res = await fetchFn(url);
  } catch (e) {
    throw new Error(`Could not load ${file}: ${e && e.message ? e.message : 'network error'}`);
  }
  if (!res || !res.ok) throw new Error(`Could not load ${file}: HTTP ${res ? res.status : 'no response'}`);
  try {
    return await res.json();
  } catch {
    throw new Error(`Could not load ${file}: invalid JSON`);
  }
}

export async function loadAll(base = 'data/', fetchFn = (...a) => globalThis.fetch(...a)) {
  const keys = Object.keys(FILES);
  const out = await Promise.all(keys.map((k) => loadOne(FILES[k], base + FILES[k], fetchFn)));
  return Object.fromEntries(keys.map((k, i) => [k, out[i]]));
}
