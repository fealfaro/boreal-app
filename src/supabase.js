import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ── Productos ────────────────────────────────────────────────
export async function getProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('activo', true)
    .order('nombre');
  if (error) throw error;
  return data;
}

export async function upsertProducto(producto) {
  const { data, error } = await supabase
    .from('productos')
    .upsert({ ...producto, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProducto(id) {
  const { error } = await supabase
    .from('productos')
    .update({ activo: false })
    .eq('id', id);
  if (error) throw error;
}

export async function uploadFoto(file, productoId) {
  const ext = file.name.split('.').pop();
  const path = `${productoId}.${ext}`;
  const { error } = await supabase.storage
    .from('productos-fotos')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('productos-fotos').getPublicUrl(path);
  return data.publicUrl;
}

// ── Cotizaciones ─────────────────────────────────────────────
export async function getCotizaciones() {
  const { data, error } = await supabase
    .from('cotizaciones')
    .select('*, cotizacion_items(*)')
    .order('fecha', { ascending: false });
  if (error) throw error;
  return data.map(c => ({
    ...c,
    items: (c.cotizacion_items || []).map(i => ({
      productoId: i.producto_id,
      nombre: i.nombre,
      sku: i.sku,
      costo: i.costo,
      precioVenta: i.precio_venta,
      cantidad: i.cantidad,
      unidad: i.unidad,
    }))
  }));
}

export async function upsertCotizacion(cot) {
  const subtotal = cot.items.reduce((a, i) => a + i.precioVenta * i.cantidad, 0);
  const costoTotal = cot.items.reduce((a, i) => a + i.costo * i.cantidad, 0);
  const margenProm = subtotal > 0 ? ((subtotal - costoTotal) / subtotal * 100) : 0;

  const cotData = {
    id: cot.id,
    numero: cot.numero,
    fecha: cot.fecha,
    organismo: cot.organismo,
    oportunidad_id: cot.oportunidadId,
    estado: cot.estado,
    subtotal,
    costo_total: costoTotal,
    margen_prom: margenProm,
    notas: cot.notas,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('cotizaciones')
    .upsert(cotData)
    .select()
    .single();
  if (error) throw error;

  // Reemplazar items
  await supabase.from('cotizacion_items').delete().eq('cotizacion_id', data.id);
  if (cot.items.length > 0) {
    const items = cot.items.map(i => ({
      cotizacion_id: data.id,
      producto_id: i.productoId || null,
      nombre: i.nombre,
      sku: i.sku,
      costo: i.costo,
      precio_venta: i.precioVenta,
      cantidad: i.cantidad,
      unidad: i.unidad,
    }));
    const { error: itemsError } = await supabase.from('cotizacion_items').insert(items);
    if (itemsError) throw itemsError;
  }

  return { ...data, subtotal, costoTotal, margenProm };
}

export async function updateEstadoCotizacion(id, estado) {
  const { error } = await supabase
    .from('cotizaciones')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
