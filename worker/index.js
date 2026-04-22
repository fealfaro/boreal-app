/**
 * Boreal API Proxy — Cloudflare Worker
 * 
 * Rutas:
 *   POST /anthropic  → proxy a api.anthropic.com (usa ANTHROPIC_API_KEY del secret)
 *   GET  /mp?id=XXX  → fetch Mercado Público + análisis IA
 *   OPTIONS *        → CORS preflight
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env) {
    // ── CORS preflight ──────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);

    // ── POST /anthropic — proxy a Claude API ────────────────
    if (request.method === 'POST' && url.pathname === '/anthropic') {
      try {
        const body = await request.json();
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(body),
        });
        const data = await resp.json();
        return new Response(JSON.stringify(data), {
          status: resp.status,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
    }

    // ── GET /mp?id=XXX — scrape Mercado Público + análisis ──
    if (request.method === 'GET' && url.pathname === '/mp') {
      const id = url.searchParams.get('id');
      const catalogo = url.searchParams.get('catalogo') || '';

      if (!id) {
        return new Response(JSON.stringify({ error: 'ID requerido' }), {
          status: 400,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      try {
        // 1. Fetch página de Mercado Público
        const mpUrl = `https://compra-agil.mercadopublico.cl/resumen-cotizacion/${id}`;
        const mpResp = await fetch(mpUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'es-CL,es;q=0.9',
          },
        });

        if (!mpResp.ok) {
          return new Response(JSON.stringify({
            error: `Mercado Público respondió ${mpResp.status}`,
            url: mpUrl,
          }), {
            status: 502,
            headers: { ...CORS, 'Content-Type': 'application/json' },
          });
        }

        const html = await mpResp.text();

        // 2. Extraer texto relevante (quitar scripts/styles)
        const textoLimpio = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .slice(0, 8000); // límite de contexto

        // 3. Analizar con Claude
        const prompt = `Eres un asistente de ventas para empresa de suministros de limpieza en Chile.

PÁGINA DE LICITACIÓN (ID: ${id}):
${textoLimpio}

CATÁLOGO DISPONIBLE:
${catalogo}

Analiza qué productos pide esta licitación y si el catálogo los tiene.
Responde SOLO en JSON:
{
  "titulo": "...",
  "institucion": "...",
  "descripcion": "resumen de qué piden en 2-3 oraciones",
  "productosDetectados": [
    {"nombre": "...", "cantidad": 10, "unidad": "unidades/cajas/etc", "especificacion": "..."}
  ],
  "productosEnCatalogo": [
    {"sku": "...", "nombre": "...", "cantidadEstimada": 10, "confianza": "alta/media/baja", "nota": "..."}
  ],
  "productosNuevos": [
    {"nombre": "...", "descripcion": "...", "cantidadEstimada": 5}
  ],
  "relevante": true,
  "recomendacion": "cotizar/revisar/descartar",
  "resumen": "..."
}`;

        const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        const claudeData = await claudeResp.json();
        const txt = claudeData.content?.[0]?.text || '{}';
        const analisis = JSON.parse(txt.replace(/```json|```/g, '').trim());

        return new Response(JSON.stringify({
          ok: true,
          url: mpUrl,
          analisis,
        }), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });

      } catch (e) {
        return new Response(JSON.stringify({
          error: e.message,
          ok: false,
        }), {
          status: 500,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Not found', { status: 404, headers: CORS });
  },
};
