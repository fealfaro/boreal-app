import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if(!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase env vars missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Cloudflare Pages.');
}

export const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const ok = () => !!supabase;
const noDb = () => ({data:null, error:"No DB connection"});

// ── PRODUCTOS ─────────────────────────────────────────────────
export const dbProductos = {
  getAll: () => ok() ? supabase.from('productos').select('*').eq('activo',true).order('nombre') : noDb(),
  upsert: (p) => ok() ? supabase.from('productos').upsert(toDbProducto(p)).select().single() : noDb(),
  delete: (id) => ok() ? supabase.from('productos').update({activo:false}).eq('id',id) : noDb(),
};

// ── COTIZACIONES ──────────────────────────────────────────────
export const dbCotizaciones = {
  getAll: () => ok() ? supabase.from('cotizaciones').select('*').order('created_at',{ascending:false}) : noDb(),
  upsert: (c) => ok() ? supabase.from('cotizaciones').upsert(toDbCot(c)).select().single() : noDb(),
  delete: (id) => ok() ? supabase.from('cotizaciones').delete().eq('id',id) : noDb(),
};

// ── MOVIMIENTOS ───────────────────────────────────────────────
export const dbMovimientos = {
  getAll: () => ok() ? supabase.from('movimientos').select('*').order('created_at',{ascending:false}) : noDb(),
  insert: (m) => ok() ? supabase.from('movimientos').insert(toDbMov(m)).select().single() : noDb(),
};

// ── GASTOS ────────────────────────────────────────────────────
export const dbGastos = {
  getAll: () => ok() ? supabase.from('gastos').select('*').order('fecha',{ascending:false}) : noDb(),
  upsert: (g) => ok() ? supabase.from('gastos').upsert(g).select().single() : noDb(),
  delete: (id) => ok() ? supabase.from('gastos').delete().eq('id',id) : noDb(),
};

// ── MAESTROS ──────────────────────────────────────────────────
export const dbOrganismos = {
  getAll: () => ok() ? supabase.from('organismos').select('*').order('nombre') : noDb(),
  upsert: (o) => ok() ? supabase.from('organismos').upsert(o).select().single() : noDb(),
  delete: (id) => ok() ? supabase.from('organismos').delete().eq('id',id) : noDb(),
};

export const dbProveedores = {
  getAll: () => ok() ? supabase.from('proveedores').select('*').order('nombre') : noDb(),
  upsert: (p) => ok() ? supabase.from('proveedores').upsert(p).select().single() : noDb(),
  delete: (id) => ok() ? supabase.from('proveedores').delete().eq('id',id) : noDb(),
};

export const dbBodegas = {
  getAll: () => ok() ? supabase.from('bodegas').select('*').order('nombre') : noDb(),
  upsert: (b) => ok() ? supabase.from('bodegas').upsert(b).select().single() : noDb(),
  delete: (id) => ok() ? supabase.from('bodegas').delete().eq('id',id) : noDb(),
};

// ── OPORTUNIDADES ─────────────────────────────────────────────
export const dbOportunidades = {
  getAll: () => ok() ? supabase.from('oportunidades').select('*').order('importada_en',{ascending:false}) : noDb(),
  upsert: (o) => ok() ? supabase.from('oportunidades').upsert(toDbOp(o)) : noDb(),
  update: (id,data) => ok() ? supabase.from('oportunidades').update(data).eq('id',id) : noDb(),
};

// ── SOLICITUDES ───────────────────────────────────────────────
export const dbSolicitudes = {
  getAll: () => ok() ? supabase.from('solicitudes').select('*').order('created_at',{ascending:false}) : noDb(),
  insert: (s) => ok() ? supabase.from('solicitudes').insert(s).select().single() : noDb(),
  update: (id,data) => ok() ? supabase.from('solicitudes').update(data).eq('id',id) : noDb(),
};

// ── CONFIG ────────────────────────────────────────────────────
export const dbConfig = {
  get: () => ok() ? supabase.from('configuracion').select('*').eq('id',1).single() : noDb(),
  update: (data) => ok() ? supabase.from('configuracion').update({...data,updated_at:new Date().toISOString()}).eq('id',1) : noDb(),
};

// ── PERFILES ──────────────────────────────────────────────────
export const dbPerfiles = {
  getAll: () => ok() ? supabase.from('perfiles').select('*').order('nombre') : noDb(),
  upsert: (p) => ok() ? supabase.from('perfiles').upsert(p).select().single() : noDb(),
  update: (id,data) => ok() ? supabase.from('perfiles').update(data).eq('id',id) : noDb(),
};

// ── CONVERSORES camelCase ↔ snake_case ─────────────────────────

export const toDbProducto = (p) => ({
  id:               p.id,
  sku:              p.sku?.trim()||null,  // null if empty - avoids unique constraint
  nombre:           p.nombre,
  proveedor:        p.proveedor||null,
  costo:            Number(p.costo)||0,
  margen:           Number(p.margen)||0,
  foto_url:         p.foto_url||null,
  categoria:        p.categoria||null,
  stock:            Number(p.stock)||0,
  stock_por_bodega: p.stockPorBodega||[],
  historial_costos: p.historialCostos||[],
  activo:           p.activo===false?false:true,
  archivada:        p.archivada||false,
  updated_at:       new Date().toISOString(),
});

export const fromDbProducto = (p) => ({
  id:             p.id,
  sku:            p.sku,
  nombre:         p.nombre,
  proveedor:      p.proveedor,
  costo:          Number(p.costo)||0,
  margen:         Number(p.margen)||0,
  foto_url:       p.foto_url,
  categoria:      p.categoria,
  stock:          Number(p.stock)||0,
  stockPorBodega: p.stock_por_bodega||[],
  historialCostos:p.historial_costos||[],
  activo:         p.activo,
  updatedAt:      p.updated_at,
});

export const toDbCot = (c) => ({
  id:               c.id,
  numero:           c.numero,
  organismo:        c.organismo,
  rut_cliente:      c.rut_cliente,
  oportunidad_id:   c.oportunidad_id,
  ejecutivo:        c.ejecutivo,
  estado:           c.estado,
  estado_op:        c.estadoOp,
  fecha:            c.fecha,
  fecha_vencimiento:c.fechaVencimiento,
  items:            c.items||[],
  notas:            c.notas,
  notas_internas:   c.notasInternas||null,
  total:            c.total,
  costo_total:      c.costoTotal,
  margen_prom:      c.margenProm,
  origen_mp:        c.origenMP||false,
  log:              c.log||[],
  archivada:        p.archivada||false,
  updated_at:       new Date().toISOString(),
});

export const fromDbCot = (c) => ({
  id:               c.id,
  numero:           c.numero,
  organismo:        c.organismo,
  rut_cliente:      c.rut_cliente,
  oportunidad_id:   c.oportunidad_id,
  ejecutivo:        c.ejecutivo,
  estado:           c.estado,
  estadoOp:         c.estado_op,
  fecha:            c.fecha,
  fechaVencimiento: c.fecha_vencimiento,
  items:            c.items||[],
  notas:            c.notas,
  notas_internas:   c.notasInternas||null,
  total:            Number(c.total)||0,
  costoTotal:       Number(c.costo_total)||0,
  margenProm:       Number(c.margen_prom)||0,
  origenMP:         c.origen_mp,
  log:              c.log||[],
  creadaEn:         c.created_at,
});

export const toDbMov = (m) => ({
  id:              m.id,
  tipo:            m.tipo,
  signo:           m.signo,
  producto_id:     m.productoId,
  nombre_producto: m.nombreProducto,
  cantidad:        m.cantidad,
  stock_antes:     m.stockAntes,
  stock_despues:   m.stockDespues,
  referencia:      m.referencia,
  motivo:          m.motivo,
  bodega_origen:   m.bodegaOrigen,
  bodega_destino:  m.bodegaDestino,
  usuario:         m.usuario,
  fecha:           m.fecha,
});

export const fromDbMov = (m) => ({
  id:             m.id,
  tipo:           m.tipo,
  signo:          m.signo,
  productoId:     m.producto_id,
  nombreProducto: m.nombre_producto,
  cantidad:       Number(m.cantidad)||0,
  stockAntes:     Number(m.stock_antes)||0,
  stockDespues:   Number(m.stock_despues)||0,
  referencia:     m.referencia,
  motivo:         m.motivo,
  bodegaOrigen:   m.bodega_origen,
  bodegaDestino:  m.bodega_destino,
  usuario:        m.usuario,
  fecha:          m.fecha,
  ts:             m.created_at,
});

export const toDbOp = (o) => ({
  id:                   o.id,
  nombre:               o.nombre,
  institucion:          o.institucion,
  unidad_compra:        o.unidadCompra,
  fecha_publicacion:    o.fechaPublicacion,
  fecha_cierre:         o.fechaCierre,
  presupuesto:          o.presupuesto,
  estado_convocatoria:  o.estadoConvocatoria,
  cotizaciones_enviadas:o.cotizacionesEnviadas,
  estado:               o.estado,
  matches:              o.matches||[],
  analisis_ia:          o.analisisIA,
  analisis_ts:          o.analisisTs||null,
  cotizacion_id:        o.cotizacionId,
});

export const fromDbOp = (o) => ({
  id:                   o.id,
  nombre:               o.nombre,
  institucion:          o.institucion,
  unidadCompra:         o.unidad_compra,
  fechaPublicacion:     o.fecha_publicacion,
  fechaCierre:          o.fecha_cierre,
  presupuesto:          Number(o.presupuesto)||0,
  estadoConvocatoria:   o.estado_convocatoria,
  cotizacionesEnviadas: o.cotizaciones_enviadas,
  estado:               o.estado,
  matches:              o.matches||[],
  analisisIA:           o.analisis_ia,
  analisisTs:           o.analisis_ts,
  cotizacionId:         o.cotizacion_id,
  importadaEn:          o.importada_en,
});

// ── AUTH ──────────────────────────────────────────────────────
export const auth = {
  signInWithOtp: (email) => supabase?.auth.signInWithOtp({
    email, options: { emailRedirectTo: window.location.origin }
  }),
  signOut: () => supabase?.auth.signOut(),
  getSession: () => supabase?.auth.getSession(),
  onAuthStateChange: (cb) => supabase?.auth.onAuthStateChange(cb),
};

export const dbPerfiles = {
  getAll: () => ok() ? supabase.from('perfiles').select('*') : noDb(),
  getByEmail: (email) => ok() ? supabase.from('perfiles').select('*').eq('email',email).single() : noDb(),
  upsert: (p) => ok() ? supabase.from('perfiles').upsert(p,{onConflict:'email'}) : noDb(),
  updateAuthId: (email, authId) => ok() ? supabase.from('perfiles').update({auth_id:authId}).eq('email',email) : noDb(),
};
