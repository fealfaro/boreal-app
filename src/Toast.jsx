import { useState, useEffect, useCallback } from "react";

let _addToast = null;

export function toast(msg, tipo="success", duracion=2800) {
  if (_addToast) _addToast({ msg, tipo, duracion, id: Date.now() });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _addToast = (t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), t.duracion);
    };
    return () => { _addToast = null; };
  }, []);

  const colors = {
    success: { bg: "#15803d", icon: "✓" },
    error:   { bg: "#b91c1c", icon: "✕" },
    info:    { bg: "#1d4ed8", icon: "ℹ" },
    warning: { bg: "#92400e", icon: "⚠" },
  };

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => {
        const c = colors[t.tipo] || colors.success;
        return (
          <div key={t.id} style={{
            background: c.bg, color: "#fff", borderRadius: 10, padding: "10px 16px",
            fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,.2)", minWidth: 200, maxWidth: 320,
            animation: "slideIn 0.2s ease",
          }}>
            <span style={{ fontSize: 14 }}>{c.icon}</span>
            <span>{t.msg}</span>
          </div>
        );
      })}
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
    </div>
  );
}
