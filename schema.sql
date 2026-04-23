-- ── BOREAL APP — Schema Supabase ─────────────────────────────
-- Ejecutar en Supabase → SQL Editor → New query

-- ── EXTENSIONES ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── USUARIOS / PERFILES ───────────────────────────────────────
create table if not exists perfiles (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  cargo       text,
  email       text,
  rol         text default 'ejecutivo', -- admin | ejecutivo
  activo      boolean default true,
  created_at  timestamptz default now()
);

-- ── MAESTROS ──────────────────────────────────────────────────
create table if not exists organismos (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  rut         text,
  direccion   text,
  email       text,
  telefono    text,
  created_at  timestamptz default now()
);

create table if not exists proveedores (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  rut         text,
  contacto    text,
  email       text,
  telefono    text,
  web         text,
  created_at  timestamptz default now()
);

create table if not exists bodegas (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  created_at  timestamptz default now()
);

-- ── PRODUCTOS ─────────────────────────────────────────────────
create table if not exists productos (
  id                uuid primary key default uuid_generate_v4(),
  sku               text unique,
  nombre            text not null,
  proveedor         text,
  costo             numeric default 0,
  margen            numeric default 30,
  foto_url          text,
  categoria         text,
  stock             numeric default 0,
  stock_por_bodega  jsonb default '[]',
  historial_costos  jsonb default '[]',
  activo            boolean default true,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ── COTIZACIONES ──────────────────────────────────────────────
create table if not exists cotizaciones (
  id                uuid primary key default uuid_generate_v4(),
  numero            text unique not null,
  organismo         text,
  rut_cliente       text,
  oportunidad_id    text,
  ejecutivo         text,
  estado            text default 'Borrador',
  estado_op         text,
  fecha             date,
  fecha_vencimiento date,
  items             jsonb default '[]',
  notas             text,
  notas_internas    text,
  total             numeric default 0,
  costo_total       numeric default 0,
  margen_prom       numeric default 0,
  origen_mp         boolean default false,
  log               jsonb default '[]',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ── MOVIMIENTOS DE INVENTARIO ─────────────────────────────────
create table if not exists movimientos (
  id               uuid primary key default uuid_generate_v4(),
  tipo             text not null, -- entrada | salida | ajuste | transferencia
  signo            text,          -- + | -
  producto_id      uuid references productos(id),
  nombre_producto  text,
  cantidad         numeric not null,
  stock_antes      numeric,
  stock_despues    numeric,
  referencia       text,
  motivo           text,
  bodega_origen    text,
  bodega_destino   text,
  usuario          text,
  fecha            date,
  created_at       timestamptz default now()
);

-- ── GASTOS ────────────────────────────────────────────────────
create table if not exists gastos (
  id          uuid primary key default uuid_generate_v4(),
  fecha       date not null,
  categoria   text,
  descripcion text,
  monto       numeric default 0,
  usuario     text,
  created_at  timestamptz default now()
);

-- ── OPORTUNIDADES (Mercado Público) ───────────────────────────
create table if not exists oportunidades (
  id                    text primary key, -- ID de Mercado Público
  nombre                text not null,
  institucion           text,
  unidad_compra         text,
  fecha_publicacion     text,
  fecha_cierre          text,
  presupuesto           numeric default 0,
  estado_convocatoria   text,
  cotizaciones_enviadas integer default 0,
  estado                text default 'nueva', -- nueva | analizada | cotizada | descartada
  matches               jsonb default '[]',
  analisis_ia           jsonb,
  cotizacion_id         uuid references cotizaciones(id),
  importada_en          timestamptz default now()
);

-- ── SOLICITUDES DE MODIFICACIÓN ───────────────────────────────
create table if not exists solicitudes (
  id          uuid primary key default uuid_generate_v4(),
  tipo        text default 'modificacion',
  cot_id      uuid references cotizaciones(id),
  cot_num     text,
  usuario     text,
  motivo      text,
  estado      text default 'pendiente', -- pendiente | aprobada | rechazada
  fecha       date,
  created_at  timestamptz default now()
);

-- ── CONFIGURACIÓN ─────────────────────────────────────────────
create table if not exists configuracion (
  id                      integer primary key default 1,
  stock_minimo            integer default 5,
  umbral_verde            numeric default 30,
  umbral_amarillo         numeric default 15,
  dias_alerta_vencimiento integer default 3,
  alerta_variacion_compra numeric default 10,
  palabras_clave          text default 'detergente
limpieza
guante
cloro
desinfectante
papel
jabon
aseo',
  updated_at              timestamptz default now(),
  constraint single_row check (id = 1)
);

-- Insert config por defecto
insert into configuracion (id) values (1) on conflict (id) do nothing;

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
-- Por ahora deshabilitado para desarrollo — habilitar antes de producción real
alter table perfiles         disable row level security;
alter table organismos       disable row level security;
alter table proveedores      disable row level security;
alter table bodegas          disable row level security;
alter table productos        disable row level security;
alter table cotizaciones     disable row level security;
alter table movimientos      disable row level security;
alter table gastos           disable row level security;
alter table oportunidades    disable row level security;
alter table solicitudes      disable row level security;
alter table configuracion    disable row level security;

-- ── ÍNDICES ÚTILES ─────────────────────────────────────────────
create index if not exists idx_cots_estado       on cotizaciones(estado);
create index if not exists idx_cots_fecha        on cotizaciones(fecha);
create index if not exists idx_movs_producto     on movimientos(producto_id);
create index if not exists idx_movs_fecha        on movimientos(fecha);
create index if not exists idx_opor_estado       on oportunidades(estado);
create index if not exists idx_gastos_fecha      on gastos(fecha);

