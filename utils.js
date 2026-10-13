// shared fetch helper for json data files

export async function loadJson(url, label) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${label} (${response.status})`);
  }
  return response.json();
}
