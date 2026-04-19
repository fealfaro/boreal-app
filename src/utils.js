export const uid = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
export const today = () => new Date().toISOString().slice(0,10);
export const fmt = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n||0);
export const fmtPct = n => `${(n||0).toFixed(1)}%`;
export const addDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); };
export const calcPrecioVenta = (costo, margen) => Math.round(Number(costo) * (1 + Number(margen)/100) * 1.19);
export const calcMargenDesde = (costo, precioConIva) => {
  const precioNeto = precioConIva / 1.19;
  return costo > 0 ? ((precioNeto - costo) / costo * 100) : 0;
};
export const calcTotalesCot = (items) => {
  const subtotalNeto = items.reduce((a,i) => a + (i.precioVenta/1.19)*i.cantidad, 0);
  const iva = subtotalNeto * 0.19;
  const total = subtotalNeto + iva;
  const costoTotal = items.reduce((a,i) => a + i.costo*i.cantidad, 0);
  const margenProm = total > 0 ? ((total - costoTotal) / total * 100) : 0;
  return { subtotalNeto: Math.round(subtotalNeto), iva: Math.round(iva), total: Math.round(total), costoTotal: Math.round(costoTotal), margenProm };
};
