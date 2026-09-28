export async function onRequest(context) {
  // 1. Gérer les requêtes preflight CORS (Navigateur)
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*"
      }
    });
  }

  const url = new URL(context.request.url);
  // On extrait le chemin exact (ex: /api/bible/character/Cyanora -> Cyanora)
  const targetPath = url.pathname.replace(/^\/api\/bible\/character\//, '');
  const targetUrl = `https://lostark.bible/character/${targetPath}`;

  // 2. Préparation du cache de 15 minutes (comme sur Nginx)
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), context.request);
  let response = await cache.match(cacheKey);

  // 3. Si pas en cache, on interroge lostark.bible
  if (!response) {
    const proxyRequest = new Request(targetUrl, {
      method: context.request.method,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*"
      }
    });

    try {
      response = await fetch(proxyRequest);
      
      // On recrée la réponse pour y injecter nos headers CORS
      response = new Response(response.body, response);
      response.headers.set("Access-Control-Allow-Origin", "*");
      // Cache-Control: s-maxage indique au CDN Cloudflare de garder en cache 900s (15 min)
      response.headers.set("Cache-Control", "public, s-maxage=900, max-age=900");

      if (response.status === 200) {
        context.waitUntil(cache.put(cacheKey, response.clone()));
      }
    } catch (e) {
      return new Response(JSON.stringify({ error: "Upstream timeout or error" }), {
        status: 502,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    }
  }

  return response;
}
