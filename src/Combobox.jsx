import { useState, useRef, useEffect } from "react";

export default function Combobox({ value, onChange, options, placeholder, onCreate }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value || "");
  const ref = useRef();

  useEffect(() => { setSearch(value || ""); }, [value]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  const canCreate = search.trim() && !options.find(o => o.toLowerCase() === search.toLowerCase());

  const select = (val) => { onChange(val); setSearch(val); setOpen(false); };
  const create = () => { if (onCreate) onCreate(search.trim()); select(search.trim()); };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        value={search}
        onChange={e => { setSearch(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder || "Buscar o crear..."}
        style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box", outline: "none" }}
      />
      {open && (filtered.length > 0 || canCreate) && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,.1)", zIndex: 999, maxHeight: 200, overflowY: "auto", marginTop: 2 }}>
          {filtered.map(o => (
            <div key={o} onClick={() => select(o)} style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
              {o}
            </div>
          ))}
          {canCreate && (
            <div onClick={create} style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", color: "#0ea5e9", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}
              onMouseEnter={e => e.currentTarget.style.background = "#f0f9ff"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
              <span style={{ fontSize: 16 }}>+</span> Crear "{search.trim()}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
