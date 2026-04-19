import { useState, useRef, useEffect } from "react";

export default function ProductoSearch({ productos, onSelect, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef();
  const inputRef = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = productos.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku||"").toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

  const select = (p) => {
    onSelect(p);
    setSearch("");
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        ref={inputRef}
        value={search}
        onChange={e => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder || "Buscar producto por nombre o SKU..."}
        style={{ width: "100%", padding: "9px 14px", borderRadius: 8, border: "1.5px solid #0ea5e9", fontSize: 13, boxSizing: "border-box", outline: "none", background: "#f0f9ff" }}
      />
      {open && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 999, marginTop: 4 }}>
          {filtered.map(p => {
            const pv = Math.round(p.costo * (1 + p.margen/100) * 1.19);
            return (
              <div key={p.id} onClick={() => select(p)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #f8fafc" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                <div style={{ width: 40, height: 40, borderRadius: 6, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                  {p.foto_url
                    ? <img src={p.foto_url} alt={p.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                    : <span style={{ fontSize: 20 }}>📦</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nombre}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.sku} · {p.proveedor}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0ea5e9", whiteSpace: "nowrap" }}>
                  {new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(pv)}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {open && filtered.length === 0 && search && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 999, marginTop: 4, padding: "12px 16px", fontSize: 13, color: "#94a3b8" }}>
          No se encontraron productos con "{search}"
        </div>
      )}
    </div>
  );
}
