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
        const ficha = fichaData?.payload || fichaData?.data || fichaData || {};
        const hist  = historial?.payload  || historial?.data  || historial  || {};

        // Extraer cotizaciones recibidas del historial
        const cotizacionesRecibidas = hist?.cantidadOfertas || hist?.ofertas?.length || hist?.numeroOfertas || 0;
        const tieneOfertas = cotizacionesRecibidas > 0;

        const textoLicitacion = `
ID: ${id}
Nombre: ${ficha.nombre || ficha.title || ''}
Institución: ${ficha.nombreOrganismo || ficha.institucion || ficha.organismo || ''}
Unidad de compra: ${ficha.unidadCompra || ficha.unidad || ''}
Descripción: ${ficha.descripcion || ficha.description || ficha.glosa || ''}
Presupuesto estimado: ${ficha.presupuesto || ficha.monto || ficha.montoEstimado || 'No especificado'} CLP
Fecha cierre: ${ficha.fechaCierre || ficha.fechaTermino || ficha.fechaCierreOferta || ''}
Estado: ${ficha.estado || ficha.estadoActual || ''}
Cotizaciones recibidas hasta ahora: ${cotizacionesRecibidas} (${tieneOfertas ? 'HAY COMPETENCIA' : 'sin competencia aún'})
Items/Productos solicitados (LISTA COMPLETA): ${JSON.stringify(ficha.items || ficha.productos || ficha.lineas || ficha.itemsLicitacion || [])}
Condiciones especiales: ${ficha.condiciones || ficha.observaciones || ficha.descripcionAdj || ''}
Datos completos ficha: ${JSON.stringify(ficha).slice(0, 3000)}
Historial completo: ${JSON.stringify(hist).slice(0, 1000)}
        `.trim();

        // 3. Analizar con Claude
        const prompt = `Eres asistente de ventas de empresa chilena de suministros de limpieza y aseo.

LICITACIÓN COMPRA ÁGIL:
${textoLicitacion}

CATÁLOGO DISPONIBLE (busca coincidencias por nombre, sinónimos y categoría):
${catalogo.slice(0, 5000)}

INSTRUCCIONES CRÍTICAS:
1. ITEMS SEPARADOS: Lista CADA ítem por separado en productosDetectados aunque tengan el mismo nombre genérico (ej: "Papel higiénico 24 unidades" y "Papel higiénico industrial rollo" son 2 entradas distintas). Usa el campo descripcionOriginal con el texto exacto de la licitación.
2. CATÁLOGO: Busca coincidencias en el catálogo por nombre, sinónimos y categoría. Sé generoso — si la licitación pide "papel higiénico" y el catálogo tiene "Papel Higiénico Doble Hoja", es una coincidencia. No dejes productosEnCatalogo vacío si hay productos similares.
3. ATRACTIVO: Calcula un score del 1 al 10 basado en: presupuesto disponible (mayor = más puntos), cantidad de cotizaciones recibidas (más competencia = menos puntos), relevancia del catálogo (más productos = más puntos), plazo de entrega (más tiempo = más puntos).
4. COMPETENCIA: Si hay cotizaciones recibidas, indícalo claramente en el resumen.
5. DOCUMENTOS: Detecta si exige ficha técnica, certificados, formularios o muestras (ignora fotos).

Responde ÚNICAMENTE con JSON válido sin markdown:
{"titulo":"...","institucion":"...","descripcion":"qué piden en 1-2 oraciones","productosDetectados":[{"nombre":"nombre específico","cantidad":10,"unidad":"unidades/cajas/etc","descripcionOriginal":"texto exacto de la licitación"}],"productosEnCatalogo":[{"sku":"SKU-EXACTO","nombre":"nombre en catálogo","cantidadEstimada":10,"confianza":"alta/media/baja","nota":"por qué coincide"}],"productosNuevos":[{"nombre":"...","descripcion":"...","cantidadEstimada":5}],"relevante":true,"recomendacion":"cotizar/revisar/descartar","resumen":"...","requerimientosEspeciales":["ficha técnica requerida"],"cotizacionesRecibidas":${cotizacionesRecibidas},"scoreAtractivo":7,"justificacionScore":"presupuesto alto, sin competencia, productos en catálogo"}`;


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
