export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
export const today = () => new Date().toISOString().slice(0,10);
export const addDays = (date, days) => { const d=new Date(date); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); };
export const diffDays = (a, b=today()) => Math.ceil((new Date(a)-new Date(b))/(1000*60*60*24));

export const fmt = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n||0);
export const fmtN = n => new Intl.NumberFormat("es-CL",{maximumFractionDigits:0}).format(n||0);
export const fmtPct = n => `${(n||0).toFixed(1)}%`;

export const calcPrecioVenta = (costo, margen) => Math.round(Number(costo)*(1+Number(margen)/100)*1.19);
export const calcMargenDesde  = (costo, precioConIva) => { const n=precioConIva/1.19; return costo>0?((n-Number(costo))/Number(costo)*100):0; };

export const calcTotalesCot = items => {
  const subtotalNeto = items.reduce((a,i)=>a+(i.precioVenta/1.19)*i.cantidad,0);
  const iva  = subtotalNeto*0.19;
  const total = subtotalNeto+iva;
  const costoTotal = items.reduce((a,i)=>a+i.costo*i.cantidad,0);
  const margenProm = total>0?((total-costoTotal)/total*100):0;
  return {subtotalNeto:Math.round(subtotalNeto),iva:Math.round(iva),total:Math.round(total),costoTotal:Math.round(costoTotal),margenProm};
};

export const formatRut = raw => {
  const clean = raw.replace(/[^0-9kK]/g,"").toUpperCase();
  if (clean.length<2) return clean;
  const dv = clean.slice(-1);
  const body = clean.slice(0,-1).replace(/\B(?=(\d{3})+(?!\d))/g,".");
  return `${body}-${dv}`;
};
