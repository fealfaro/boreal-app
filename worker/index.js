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
        // 1. Llamar a la API interna del buscador de Compra Ágil
        const MP_API = 'https://api.buscador.mercadopublico.cl/compra-agil';
        // MP_API_KEY se configura como secret en Cloudflare Workers
        // Si no está configurado, usa el valor por defecto conocido
        const MP_KEY = env.MP_API_KEY || 'e93089e4-437c-4723-b343-4fa20045e3bc';

        const [fichaResp, historialResp] = await Promise.all([
          fetch(`${MP_API}?action=ficha&code=${id}`, {
            headers: { 'x-api-key': MP_KEY, 'Content-Type': 'application/json' },
          }),
          fetch(`${MP_API}?action=historial&code=${id}`, {
            headers: { 'x-api-key': MP_KEY, 'Content-Type': 'application/json' },
          }),
        ]);

        const fichaData  = fichaResp.ok  ? await fichaResp.json()  : {};
        const historial  = historialResp.ok ? await historialResp.json() : {};

        // Log para debug
        const mpDebug = {
          fichaStatus: fichaResp.status,
          historialStatus: historialResp.status,
          fichaKeys: Object.keys(fichaData?.data || fichaData || {}),
        };

        // 2. Construir texto estructurado para Claude
        // La API devuelve datos en payload, no en data
        const ficha = fichaData?.payload || fichaData?.data || fichaData || {};
        const hist  = historial?.payload || historial?.data || historial || {};

        const textoLicitacion = `
ID: ${id}
Nombre: ${ficha.nombre || ficha.title || ''}
Institución: ${ficha.nombreOrganismo || ficha.institucion || ficha.organismo || ''}
Unidad de compra: ${ficha.unidadCompra || ficha.unidad || ''}
Descripción: ${ficha.descripcion || ficha.description || ficha.glosa || ''}
Presupuesto: ${ficha.presupuesto || ficha.monto || ficha.montoEstimado || ''}
Fecha cierre: ${ficha.fechaCierre || ficha.fechaTermino || ficha.fechaCierreOferta || ''}
Estado: ${ficha.estado || ficha.estadoActual || ''}
Items/Productos solicitados: ${JSON.stringify(ficha.items || ficha.productos || ficha.lineas || ficha.itemsLicitacion || [])}
Condiciones: ${ficha.condiciones || ficha.observaciones || ficha.descripcionAdj || ''}
Datos completos: ${JSON.stringify(ficha).slice(0, 2000)}
        `.trim();

        // 3. Analizar con Claude
        const prompt = `Eres asistente de ventas de empresa de suministros de limpieza en Chile.

LICITACIÓN COMPRA ÁGIL:
${textoLicitacion}

CATÁLOGO DISPONIBLE (nombre exacto y SKU):
${catalogo.slice(0, 4000)}

Analiza si esta licitación es relevante para el catálogo. 
IMPORTANTE: Lista CADA ítem de la licitación por separado en productosDetectados, aunque sean del mismo tipo (ej: 2 tipos de papel higiénico = 2 entradas distintas).
Usa los SKU exactos del catálogo cuando haya coincidencia.
Responde ÚNICAMENTE con JSON válido, sin markdown ni texto adicional:
{"titulo":"...","institucion":"...","descripcion":"qué piden exactamente en 1-2 oraciones","productosDetectados":[{"nombre":"nombre específico del item","cantidad":10,"unidad":"cajas/unidades/etc","descripcionOriginal":"texto exacto del item en la licitacion"}],"productosEnCatalogo":[{"sku":"SKU-EXACTO-DEL-CATALOGO","nombre":"...","cantidadEstimada":10,"confianza":"alta/media/baja","nota":"..."}],"productosNuevos":[{"nombre":"...","descripcion":"...","cantidadEstimada":5}],"relevante":true,"recomendacion":"cotizar/revisar/descartar","resumen":"..."}`;

        const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        const claudeData = await claudeResp.json();
        const txt = claudeData.content?.[0]?.text || '';
        
        // Debug info included in response
        const debugInfo = {
          claudeStatus: claudeResp.status,
          hasContent: !!claudeData.content,
          contentLength: txt.length,
          txtPreview: txt.slice(0, 200),
          claudeError: claudeData.error || null,
        };
        
        let analisis = {};
        try {
          const jsonMatch = txt.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analisis = JSON.parse(jsonMatch[0]);
          }
        } catch(parseErr) {
          analisis = {
            resumen: txt.slice(0, 300) || 'Error al parsear respuesta',
            relevante: true,
            recomendacion: 'revisar',
            productosDetectados: [],
            productosEnCatalogo: [],
            productosNuevos: [],
            _parseError: parseErr.message,
          };
        }

        return new Response(JSON.stringify({
          ok: true,
          url: `https://buscador.mercadopublico.cl/ficha?code=${id}`,
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
