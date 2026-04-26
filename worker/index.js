/**
 * Boreal API Proxy — Cloudflare Worker v1.21.1
 * El worker carga el catálogo directo desde Supabase — no depende del frontend
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const SUPABASE_URL = 'https://nyeheudvjwfgbdlaxrzu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Q4jOeCUqC-BtOuMuwng8GA_YX7GYqNn';

// Cargar catálogo desde Supabase
async function getCatalogo() {
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/productos?select=id,sku,nombre,categoria,costo,margen&activo=eq.true&limit=1000`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  if (!resp.ok) return [];
  return await resp.json();
}

// ── Matching ───────────────────────────────────────────────────────────────
const STOPWORDS = new Set([
  'de','del','la','el','los','las','un','una','en','con','por','para','que',
  'se','su','sus','al','y','o','a','x','no','sin','color','rollo',
  'caja','pack','paquete','litro','litros','ml','kg','gr','cc','metros',
  'metro','unidades','unidad','ea','und','pza','pieza','set','tipo','marca',
  'bidon','bidón','grande','chico','pequeño','industrial','comercial',
]);

function stem(w) {
  return w
    .replace(/iones$/, 'ion').replace(/ados$|idos$/, '')
    .replace(/ando$|iendo$/, '').replace(/mente$/, '')
    .replace(/istas?$/, 'ist').replace(/adores?$/, 'ador')
    .replace(/es$/, '').replace(/s$/, '') || w;
}

function normalizar(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOPWORDS.has(w))
    .map(stem);
}

function scoreMatch(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  const setB = new Set(tokensB);
  let hits = 0;
  for (const t of tokensA) {
    if (setB.has(t)) hits += 1;
    else if ([...setB].some(b => b.includes(t) || t.includes(b))) hits += 0.5;
  }
  const precision = hits / tokensA.length;
  const recall    = hits / tokensB.length;
  if (precision + recall === 0) return 0;
  return 2 * precision * recall / (precision + recall);
}

function matchCatalogo(items, catalogo) {
  console.log(`[Worker] matchCatalogo: ${items.length} items vs ${catalogo.length} prods`);
  if (!catalogo.length) return {
    enCatalogo: [],
    nuevos: items.map(i => ({ nombre: i.nombre, descripcion: i.descripcionOriginal, cantidadEstimada: i.cantidad, unidad: i.unidad }))
  };

  const enCatalogo = [];
  const nuevos = [];

  for (const item of items) {
    const tokensItem = normalizar(item.nombre + ' ' + item.nombreGenerico);
    let mejorScore = 0;
    let mejorProd = null;

    for (const prod of catalogo) {
      const tokensProd = normalizar(prod.nombre + ' ' + (prod.sku || '') + ' ' + (prod.categoria || ''));
      const s = scoreMatch(tokensItem, tokensProd);
      if (s > mejorScore) { mejorScore = s; mejorProd = prod; }
    }

    if (mejorProd && mejorScore >= 0.08) {
      console.log(`[Worker] MATCH: "${item.nombre.slice(0,25)}" → "${mejorProd.nombre.slice(0,25)}" ${mejorScore.toFixed(2)}`);
      const confianza = mejorScore >= 0.30 ? 'alta' : mejorScore >= 0.15 ? 'media' : 'baja';
      enCatalogo.push({
        sku: mejorProd.sku || mejorProd.id, productoId: mejorProd.id,
        nombre: mejorProd.nombre, foto_url: null,
        costo: mejorProd.costo || 0, margen: mejorProd.margen || 30,
        cantidadEstimada: item.cantidad, confianza,
        score: Math.round(mejorScore * 100), itemOrigen: item.nombre,
        nota: `Match ${Math.round(mejorScore*100)}% con "${item.nombre}"`,
      });
    } else {
      nuevos.push({
        nombre: item.nombre, descripcion: item.descripcionOriginal || item.nombre,
        cantidadEstimada: item.cantidad, unidad: item.unidad,
      });
    }
  }
  return { enCatalogo, nuevos };
}

function calcScore(presupuesto, cotizaciones, enCatalogo, plazo) {
  let s = 5;
  if (presupuesto >= 5000000) s += 3;
  else if (presupuesto >= 1000000) s += 2;
  else if (presupuesto >= 300000) s += 1;
  if (cotizaciones === 0) s += 2;
  else if (cotizaciones <= 2) s += 1;
  else s -= 1;
  if (enCatalogo.filter(p => p.confianza === 'alta').length >= 3) s += 1;
  if (plazo >= 5) s += 1;
  return Math.max(1, Math.min(10, s));
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(request.url);

    // ── POST /anthropic ──────────────────────────────────────
    if (request.method === 'POST' && url.pathname === '/anthropic') {
      try {
        const body = await request.json();
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify(body),
        });
        return new Response(JSON.stringify(await resp.json()), { status: resp.status, headers: { ...CORS, 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
      }
    }

    // ── GET o POST /mp ───────────────────────────────────────
    if (url.pathname === '/mp') {
      try {
        const id = request.method === 'POST'
          ? (await request.json()).id
          : url.searchParams.get('id');

        if (!id) return new Response(JSON.stringify({ error: 'ID requerido' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });

        const MP_KEY = env.MP_API_KEY || 'e93089e4-437c-4723-b343-4fa20045e3bc';
        const BASE = 'https://api.buscador.mercadopublico.cl/compra-agil';

        // Fetch MP + catálogo en paralelo
        const [fichaResp, histResp, catalogo] = await Promise.all([
          fetch(`${BASE}?action=ficha&code=${id}`,     { headers: { 'x-api-key': MP_KEY } }),
          fetch(`${BASE}?action=historial&code=${id}`, { headers: { 'x-api-key': MP_KEY } }),
          getCatalogo(),
        ]);

        console.log(`[Worker] id=${id} catalogo=${catalogo.length} prods`);

        const ficha = ((fichaResp.ok ? await fichaResp.json() : {})?.payload || {});
        const hist  = ((histResp.ok  ? await histResp.json()  : {})?.payload || {});

        const rawItems = ficha.productos_solicitados || ficha.items || ficha.productos || [];
        console.log(`[Worker] rawItems: ${rawItems.length}`);

        const itemsExtraidos = rawItems.map((item, i) => ({
          idx: i + 1,
          nombre: item.descripcion || item.nombre || '',
          nombreGenerico: item.nombre || '',
          descripcionOriginal: item.descripcion || '',
          cantidad: Number(item.cantidad) || 1,
          unidad: item.unidad_medida || item.unidad || 'unidades',
        }));

        const cotizacionesRecibidas = Number(hist?.cantidadOfertas || hist?.cantidad_ofertas || hist?.ofertas?.length || 0);
        const presupuesto  = Number(ficha.presupuesto_estimado || 0);
        const plazoEntrega = Number(ficha.plazo_entrega || 0);

        const { enCatalogo, nuevos } = matchCatalogo(itemsExtraidos, catalogo);
        const scoreAtractivo = calcScore(presupuesto, cotizacionesRecibidas, enCatalogo, plazoEntrega);

        const promptIA = `Licitación Mercado Público Chile.
Nombre: ${ficha.nombre || ''} | Institución: ${ficha.nombreOrganismo || ''}
Presupuesto: $${presupuesto.toLocaleString('es-CL')} CLP | Plazo: ${plazoEntrega}d | Cotizaciones: ${cotizacionesRecibidas}
Descripción: ${(ficha.descripcion || '').slice(0, 300)}
Items (${itemsExtraidos.length}): ${itemsExtraidos.slice(0,8).map(i=>`${i.nombre} x${i.cantidad}`).join(', ')}
Coincidencias catálogo: ${enCatalogo.length}/${itemsExtraidos.length}
Responde SOLO JSON sin markdown:
{"titulo":"...","institucion":"...","descripcion":"1 oración","relevante":true,"recomendacion":"cotizar/revisar/descartar","resumen":"análisis breve","requerimientosEspeciales":[],"justificacionScore":"${scoreAtractivo}/10 porque..."}`;

        const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 600, messages: [{ role: 'user', content: promptIA }] }),
        });

        let iaExtra = {};
        try {
          const txt = (await claudeResp.json()).content?.[0]?.text || '';
          const m = txt.match(/\{[\s\S]*\}/);
          if (m) iaExtra = JSON.parse(m[0]);
        } catch {}

        return new Response(JSON.stringify({
          ok: true,
          url: `https://buscador.mercadopublico.cl/ficha?code=${id}`,
          analisis: {
            titulo:    iaExtra.titulo    || ficha.nombre || id,
            institucion: iaExtra.institucion || ficha.nombreOrganismo || '',
            descripcion: iaExtra.descripcion || (ficha.descripcion||'').slice(0,150),
            relevante: iaExtra.relevante ?? (enCatalogo.length > 0),
            recomendacion: iaExtra.recomendacion || (enCatalogo.length > 0 ? 'cotizar' : 'revisar'),
            resumen:   iaExtra.resumen   || '',
            requerimientosEspeciales: iaExtra.requerimientosEspeciales || [],
            justificacionScore: iaExtra.justificacionScore || '',
            productosDetectados:  itemsExtraidos,
            productosEnCatalogo:  enCatalogo,
            productosNuevos:      nuevos,
            cotizacionesRecibidas, scoreAtractivo, presupuesto,
            _source: 'web',
          },
        }), { headers: { ...CORS, 'Content-Type': 'application/json' } });

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message, ok: false }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
      }
    }

    return new Response('Not found', { status: 404, headers: CORS });
  },
};
