-- ============================================================
-- BOREAL — Schema Supabase
-- Ejecuta esto en: supabase.com → tu proyecto → SQL Editor
-- ============================================================

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL,
  nombre TEXT NOT NULL,
  proveedor TEXT,
  costo NUMERIC(12,2) NOT NULL DEFAULT 0,
  margen NUMERIC(5,2) NOT NULL DEFAULT 25,
  unidad TEXT DEFAULT 'UN',
  foto_url TEXT,
  emoji TEXT DEFAULT '📦',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de cotizaciones
CREATE TABLE IF NOT EXISTS cotizaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  organismo TEXT NOT NULL,
  oportunidad_id TEXT,
  estado TEXT DEFAULT 'Borrador' CHECK (estado IN ('Borrador','Enviada','Adjudicada','Rechazada','Facturada')),
  subtotal NUMERIC(14,2) DEFAULT 0,
  costo_total NUMERIC(14,2) DEFAULT 0,
  margen_prom NUMERIC(5,2) DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de items de cotización
CREATE TABLE IF NOT EXISTS cotizacion_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  nombre TEXT NOT NULL,
  sku TEXT,
  costo NUMERIC(12,2) NOT NULL DEFAULT 0,
  precio_venta NUMERIC(12,2) NOT NULL DEFAULT 0,
  cantidad NUMERIC(10,2) NOT NULL DEFAULT 1,
  unidad TEXT DEFAULT 'UN'
);

-- Storage bucket para fotos de productos
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos-fotos', 'productos-fotos', true)
ON CONFLICT DO NOTHING;

-- Política de storage: permitir subida y lectura pública
CREATE POLICY "Fotos públicas" ON storage.objects
  FOR SELECT USING (bucket_id = 'productos-fotos');

CREATE POLICY "Subir fotos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'productos-fotos');

CREATE POLICY "Actualizar fotos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'productos-fotos');

CREATE POLICY "Eliminar fotos" ON storage.objects
  FOR DELETE USING (bucket_id = 'productos-fotos');

-- RLS: habilitar pero permitir todo (sin login por ahora)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizacion_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total productos" ON productos FOR ALL USING (true);
CREATE POLICY "Acceso total cotizaciones" ON cotizaciones FOR ALL USING (true);
CREATE POLICY "Acceso total items" ON cotizacion_items FOR ALL USING (true);
