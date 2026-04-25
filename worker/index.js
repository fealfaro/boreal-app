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

        // 2. Extraer items directamente del API response (no confiar en IA para esto)
        const ficha = fichaData?.payload || fichaData?.data || fichaData || {};
        const hist  = historial?.payload  || historial?.data  || historial  || {};

        const cotizacionesRecibidas = hist?.cantidadOfertas || hist?.ofertas?.length || hist?.numeroOfertas || 0;
        const tieneOfertas = cotizacionesRecibidas > 0;

        // Extraer TODOS los items con sus descripciones específicas
        // Campo real de la API: productos_solicitados[].descripcion
        const rawItems = ficha.productos_solicitados || ficha.items || ficha.productos || ficha.lineas || ficha.itemsLicitacion || [];
        const itemsExtraidos = rawItems.map((item, i) => {
          const nombreGenerico = item.nombre || '';
          const descripcion = item.descripcion || item.glosa || '';
          const cantidad = item.cantidad || 1;
          const unidad = item.unidad_medida || item.unidad || item.unidadMedida || 'unidades';
          return {
            nombre: descripcion || nombreGenerico,  // descripcion específica primero
            nombreGenerico,
            descripcionOriginal: descripcion,
            cantidad: Number(cantidad) || 1,
            unidad,
            idx: i + 1,
          };
        });

        const textoItems = itemsExtraidos.length > 0
          ? itemsExtraidos.map(it => `${it.idx}. "${it.nombre}" — ${it.cantidad} ${it.unidad}`).join('\n')
          : 'No especificado en la API';

        const textoLicitacion = `
ID: ${id}
Nombre: ${ficha.nombre || ''}
Institución: ${ficha.nombreOrganismo || ficha.institucion || ficha.organismo || ''}
Descripción general: ${ficha.descripcion || ''}
Presupuesto estimado: ${ficha.presupuesto_estimado || ficha.presupuesto || ficha.monto || 'No especificado'} ${ficha.moneda || 'CLP'}
Fecha cierre: ${ficha.fecha_cierre || ficha.fechaCierre || ''}
Plazo entrega: ${ficha.plazo_entrega || ''} días
Cotizaciones recibidas: ${cotizacionesRecibidas}
PRODUCTOS SOLICITADOS (${itemsExtraidos.length} items — YA EXTRAÍDOS, NO MODIFICAR ESTA LISTA):
${textoItems}
        `.trim();

        // 3. Analizar con Claude
        const prompt = `Eres asistente de ventas de empresa chilena de suministros de limpieza y aseo.

LICITACIÓN:
${textoLicitacion}

CATÁLOGO DISPONIBLE (nombre y SKU):
${catalogo.slice(0, 5000)}

TAREA: Los productos solicitados YA están extraídos arriba (no los modifiques ni agrupes). Tu trabajo es:
1. Para cada producto de la lista, busca si existe algo similar en el catálogo (por nombre, sinónimo o categoría). Sé generoso.
2. Calcula score de atractivo 1-10: presupuesto alto=+3, sin cotizaciones=+3, productos en catálogo=+2, plazo largo=+2.
3. Detecta documentos requeridos (ficha técnica, certificados, formularios — ignora fotos).
4. Escribe un resumen breve.

Responde ÚNICAMENTE con JSON válido sin markdown:
{"titulo":"...","institucion":"...","descripcion":"...","productosEnCatalogo":[{"sku":"SKU-EXACTO","nombre":"nombre en catálogo","cantidadEstimada":2,"confianza":"alta/media/baja","nota":"por qué coincide con qué item"}],"productosNuevos":[{"nombre":"...","descripcion":"...","cantidadEstimada":1}],"relevante":true,"recomendacion":"cotizar/revisar/descartar","resumen":"...","requerimientosEspeciales":[],"cotizacionesRecibidas":${cotizacionesRecibidas},"scoreAtractivo":7,"justificacionScore":"..."}`;


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
            productosEnCatalogo: [],
            productosNuevos: [],
            _parseError: parseErr.message,
          };
        }

        // ALWAYS inject items from API directly — never trust IA to list them
        analisis.productosDetectados = itemsExtraidos;
        analisis.cotizacionesRecibidas = analisis.cotizacionesRecibidas ?? cotizacionesRecibidas;

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
