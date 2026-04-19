# 🌲 Boreal — Guía de publicación paso a paso

## PASO 1 — Crear base de datos en Supabase (10 min)

1. Ve a supabase.com → crea cuenta gratis con tu email
2. Clic en "New project":
   - Nombre: boreal
   - Región: South America (São Paulo)
3. Espera ~2 minutos mientras se crea

### Crear las tablas:
4. Menú izquierdo → SQL Editor → New query
5. Pega TODO el contenido del archivo schema.sql
6. Clic en Run → verás "Success. No rows returned"

### Copiar tus credenciales:
7. Menú izquierdo → Settings → API
8. Copia y guarda:
   - Project URL (algo como https://abcxyz.supabase.co)
   - anon public key (cadena larga que empieza con eyJ...)

---

## PASO 2 — Subir el código a GitHub (5 min)

1. Ve a github.com → crea cuenta gratis
2. Clic en + → New repository
   - Nombre: boreal-app
   - Visibilidad: Private
3. Descomprime el ZIP de Boreal en tu computador
4. Abre una terminal en esa carpeta y ejecuta:

git init
git add .
git commit -m "Boreal v2.0"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/boreal-app.git
git push -u origin main

(Reemplaza TU_USUARIO con tu nombre de GitHub)

---

## PASO 3 — Publicar en Vercel (5 min)

1. Ve a vercel.com → Sign up con tu cuenta de GitHub
2. Clic en "Add New Project"
3. Selecciona el repositorio boreal-app → Import
4. Agrega las variables de entorno:
   - REACT_APP_SUPABASE_URL = (tu Project URL del Paso 1)
   - REACT_APP_SUPABASE_ANON_KEY = (tu anon key del Paso 1)
5. Clic en Deploy
6. Espera ~3 minutos

Tu app estará en: https://boreal-app-xxxx.vercel.app

---

## PASO 4 — Usar la app

1. Entra desde cualquier dispositivo
2. Agrega tus productos en el módulo Productos
3. Crea cotizaciones desde el módulo Cotizaciones
4. Cambia estados: Adjudicada → Facturada (te pedirá el N° de factura)

---

## Actualizar en el futuro

git add .
git commit -m "Actualización"
git push

Vercel se actualiza automático en ~2 minutos.

---

## Costos

Supabase Free: $0/mes
Vercel Hobby: $0/mes
Total para empezar: $0
