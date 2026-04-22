import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── HELPERS ───────────────────────────────────────────────────

// Productos
export const dbProductos = {
  getAll: () => supabase.from('productos').select('*').eq('activo', true).order('nombre'),
  upsert: (p) => supabase.from('productos').upsert(toDbProducto(p)).select().single(),
  delete: (id) => supabase.from('productos').update({ activo: false }).eq('id', id),
};

// Cotizaciones
export const dbCotizaciones = {
  getAll: () => supabase.from('cotizaciones').select('*').order('created_at', { ascending: false }),
  upsert: (c) => supabase.from('cotizaciones').upsert(toDbCot(c)).select().single(),
  delete: (id) => supabase.from('cotizaciones').delete().eq('id', id),
};

// Movimientos
export const dbMovimientos = {
  getAll: () => supabase.from('movimientos').select('*').order('created_at', { ascending: false }),
  insert: (m) => supabase.from('movimientos').insert(toDbMov(m)).select().single(),
};

// Gastos
export const dbGastos = {
  getAll: () => supabase.from('gastos').select('*').order('fecha', { ascending: false }),
  upsert: (g) => supabase.from('gastos').upsert(g).select().single(),
  delete: (id) => supabase.from('gastos').delete().eq('id', id),
};

// Maestros
export const dbOrganismos = {
  getAll: () => supabase.from('organismos').select('*').order('nombre'),
  upsert: (o) => supabase.from('organismos').upsert(o).select().single(),
  delete: (id) => supabase.from('organismos').delete().eq('id', id),
};

export const dbProveedores = {
  getAll: () => supabase.from('proveedores').select('*').order('nombre'),
  upsert: (p) => supabase.from('proveedores').upsert(p).select().single(),
  delete: (id) => supabase.from('proveedores').delete().eq('id', id),
};

export const dbBodegas = {
  getAll: () => supabase.from('bodegas').select('*').order('nombre'),
  upsert: (b) => supabase.from('bodegas').upsert(b).select().single(),
  delete: (id) => supabase.from('bodegas').delete().eq('id', id),
};

// Oportunidades
export const dbOportunidades = {
  getAll: () => supabase.from('oportunidades').select('*').order('importada_en', { ascending: false }),
  upsert: (o) => supabase.from('oportunidades').upsert(toDbOp(o)),
  update: (id, data) => supabase.from('oportunidades').update(data).eq('id', id),
};

// Solicitudes
export const dbSolicitudes = {
  getAll: () => supabase.from('solicitudes').select('*').order('created_at', { ascending: false }),
  insert: (s) => supabase.from('solicitudes').insert(s).select().single(),
  update: (id, data) => supabase.from('solicitudes').update(data).eq('id', id),
};

// Config
export const dbConfig = {
  get: () => supabase.from('configuracion').select('*').eq('id', 1).single(),
  update: (data) => supabase.from('configuracion').update({ ...data, updated_at: new Date().toISOString() }).eq('id', 1),
};

// Perfiles
export const dbPerfiles = {
  getAll: () => supabase.from('perfiles').select('*').order('nombre'),
  upsert: (p) => supabase.from('perfiles').upsert(p).select().single(),
  update: (id, data) => supabase.from('perfiles').update(data).eq('id', id),
};

// ── CONVERSORES (camelCase app ↔ snake_case DB) ──────────────

export const toDbProducto = (p) => ({
  id:                 p.id,
  sku:                p.sku,
  nombre:             p.nombre,
  proveedor:          p.proveedor,
  costo:              p.costo,
  margen:             p.margen,
  foto_url:           p.foto_url,
  categoria:          p.categoria,
  stock:              p.stock,
  stock_por_bodega:   p.stockPorBodega || [],
  historial_costos:   p.historialCostos || [],
  activo:             p.activo !== false,
  updated_at:         new Date().toISOString(),
});

export const fromDbProducto = (p) => ({
  id:               p.id,
  sku:              p.sku,
  nombre:           p.nombre,
  proveedor:        p.proveedor,
  costo:            p.costo,
  margen:           p.margen,
  foto_url:         p.foto_url,
  categoria:        p.categoria,
  stock:            p.stock,
  stockPorBodega:   p.stock_por_bodega || [],
  historialCostos:  p.historial_costos || [],
  activo:           p.activo,
  updatedAt:        p.updated_at,
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
  fecha_vencimiento: c.fechaVencimiento,
  items:            c.items || [],
  notas:            c.notas,
  total:            c.total,
  costo_total:      c.costoTotal,
  margen_prom:      c.margenProm,
  origen_mp:        c.origenMP || false,
  log:              c.log || [],
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
  items:            c.items || [],
  notas:            c.notas,
  total:            c.total,
  costoTotal:       c.costo_total,
  margenProm:       c.margen_prom,
  origenMP:         c.origen_mp,
  log:              c.log || [],
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
  cantidad:       m.cantidad,
  stockAntes:     m.stock_antes,
  stockDespues:   m.stock_despues,
  referencia:     m.referencia,
  motivo:         m.motivo,
  bodegaOrigen:   m.bodega_origen,
  bodegaDestino:  m.bodega_destino,
  usuario:        m.usuario,
  fecha:          m.fecha,
  ts:             m.created_at,
});

export const toDbOp = (o) => ({
  id:                     o.id,
  nombre:                 o.nombre,
  institucion:            o.institucion,
  unidad_compra:          o.unidadCompra,
  fecha_publicacion:      o.fechaPublicacion,
  fecha_cierre:           o.fechaCierre,
  presupuesto:            o.presupuesto,
  estado_convocatoria:    o.estadoConvocatoria,
  cotizaciones_enviadas:  o.cotizacionesEnviadas,
  estado:                 o.estado,
  matches:                o.matches || [],
  analisis_ia:            o.analisisIA,
  cotizacion_id:          o.cotizacionId,
});

export const fromDbOp = (o) => ({
  id:                   o.id,
  nombre:               o.nombre,
  institucion:          o.institucion,
  unidadCompra:         o.unidad_compra,
  fechaPublicacion:     o.fecha_publicacion,
  fechaCierre:          o.fecha_cierre,
  presupuesto:          o.presupuesto,
  estadoConvocatoria:   o.estado_convocatoria,
  cotizacionesEnviadas: o.cotizaciones_enviadas,
  estado:               o.estado,
  matches:              o.matches || [],
  analisisIA:           o.analisis_ia,
  cotizacionId:         o.cotizacion_id,
  importadaEn:          o.importada_en,
});
