"""
Script para importar productos a Supabase
Uso: python importar_productos.py
Requiere: pip install supabase
"""
import json
from supabase import create_client

# ── Configura aquí ────────────────────────────────────────────
SUPABASE_URL = "https://nyeheudvjwfgbdlaxrzu.supabase.co"
SUPABASE_KEY = "sb_publishable_Q4jOeCUqC-BtOuMuwng8GA_YX7GYqNn"  # anon key
# ─────────────────────────────────────────────────────────────

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

with open("productos_boreal.json", encoding="utf-8") as f:
    productos = json.load(f)

print(f"Importando {len(productos)} productos...")

BATCH = 10  # pequeño por las imágenes grandes
ok = 0
errors = 0

for i in range(0, len(productos), BATCH):
    batch = productos[i:i+BATCH]
    rows = []
    for p in batch:
        rows.append({
            "id":               p["id"],
            "sku":              p.get("sku"),
            "nombre":           p["nombre"],
            "proveedor":        None,
            "costo":            p["costo"],
            "margen":           p["margen"],
            "foto_url":         p.get("foto_url"),
            "categoria":        p.get("categoria"),
            "stock":            0,
            "stock_por_bodega": [],
            "historial_costos": [],
            "activo":           True,
        })
    try:
        res = supabase.table("productos").upsert(rows).execute()
        ok += len(batch)
        print(f"  ✓ {ok}/{len(productos)}")
    except Exception as e:
        errors += len(batch)
        print(f"  ✗ Error batch {i}: {e}")

print(f"\nListo: {ok} importados, {errors} errores")
