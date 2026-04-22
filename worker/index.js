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
          .trim()
          .slice(0, 6000); // límite conservador

        // 3. Analizar con Claude
        const prompt = `Analiza esta licitación chilena de Mercado Público y responde en JSON.

LICITACIÓN ID: ${id}
CONTENIDO DE LA PÁGINA:
${textoLimpio}

CATÁLOGO DE LA EMPRESA:
${catalogo.slice(0, 2000)}

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin explicaciones. Solo el JSON.

Formato exacto requerido:
{"titulo":"nombre de la licitación","institucion":"nombre institución","descripcion":"qué productos o servicios piden en 2 oraciones","productosDetectados":[{"nombre":"producto","cantidad":10,"unidad":"unidades"}],"productosEnCatalogo":[{"sku":"ASE-001","nombre":"nombre","cantidadEstimada":10,"confianza":"alta"}],"productosNuevos":[{"nombre":"producto","descripcion":"descripción","cantidadEstimada":5}],"relevante":true,"recomendacion":"cotizar","resumen":"resumen ejecutivo"}`;

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
        const txt = claudeData.content?.[0]?.text || '';
        
        // Log para debug
        console.log('Claude raw response:', txt.slice(0, 500));
        
        let analisis = {};
        try {
          // Intentar extraer JSON del texto
          const jsonMatch = txt.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analisis = JSON.parse(jsonMatch[0]);
          }
        } catch(parseErr) {
          console.error('JSON parse error:', parseErr.message, 'Text:', txt.slice(0, 200));
          // Si no parsea, crear estructura básica con el texto raw
          analisis = {
            resumen: txt.slice(0, 300),
            relevante: true,
            recomendacion: 'revisar',
            productosDetectados: [],
            productosEnCatalogo: [],
            productosNuevos: [],
          };
        }

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
