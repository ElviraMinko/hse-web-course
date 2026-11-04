export function readUrlParams(keys) {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(keys.filter((key) => params.has(key)).map((key) => [key, params.get(key)]));
}

export function writeUrlParams(values, { push = false } = {}) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  if (url.href === window.location.href) return;
  if (push) window.history.pushState(null, '', url);
  else window.history.replaceState(null, '', url);
}
