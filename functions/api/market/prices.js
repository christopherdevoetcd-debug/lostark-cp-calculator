// Prix du marché (EUC) via l'API de loa-buddy (marketdata-api.yrzhao1068589.workers.dev).
// L'API n'autorise pas les appels navigateur depuis notre domaine (pas d'Access-Control-Allow-Origin) :
// cette fonction fait l'appel côté serveur. Requête fixe (région + matériaux) : ce n'est pas un proxy ouvert.
const MARKET_API = 'https://marketdata-api.yrzhao1068589.workers.dev/v1/prices/latest';
const BODY = JSON.stringify({
  region_slug: 'euc',
  item_slugs: [
    'destiny-leapstone',
    'prime-oreha-fusion-material',
    'abidos-fusion-material',
    'destiny-destruction-stone',
    'destiny-guardian-stone',
    'lavas-breath',
    'glaciers-breath',
    // Livres de gravure reliques (gravures de dégâts)
    'grudge',
    'cursed-doll',
    'hit-master',
    'super-charge',
    'mass-increase',
    'barricade',
    'all-out-attack',
    'stabilized-status',
    'master-brawler',
    'ambush-master',
    'raid-captain',
    'keen-blunt-weapon',
    'precise-dagger',
    'adrenaline',
    'ether-predator',
    'contender'
  ]
});

export async function onRequestGet(context) {
  const cache = caches.default;
  const cacheKey = new Request(new URL(context.request.url).origin + '/api/market/prices', { method: 'GET' });
  let response = await cache.match(cacheKey);
  if (response) return response;

  try {
    const upstream = await fetch(MARKET_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: BODY
    });
    response = new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json',
        // 15 min de cache CDN : les prix bougent peu, et on ménage l'API
        'Cache-Control': 'public, s-maxage=900, max-age=900'
      }
    });
    if (upstream.ok) context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (e) {
    return new Response(JSON.stringify({ error: 'market_unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
