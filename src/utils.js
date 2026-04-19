export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
export const today = () => new Date().toISOString().slice(0,10);
export const addDays = (date, days) => { const d=new Date(date||new Date()); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); };
export const diffDays = (a, b=today()) => Math.ceil((new Date(a)-new Date(b))/(1000*60*60*24));
export const startOfMonth = (offset=0) => { const d=new Date(); d.setMonth(d.getMonth()+offset,1); return d.toISOString().slice(0,10); };
export const endOfMonth   = (offset=0) => { const d=new Date(); d.setMonth(d.getMonth()+offset+1,0); return d.toISOString().slice(0,10); };

export const fmt    = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n||0);
export const fmtN   = n => new Intl.NumberFormat("es-CL",{maximumFractionDigits:0}).format(n||0);
export const fmtPct = n => `${(n||0).toFixed(1)}%`;

// Format number with thousand separators for display (no currency symbol)
export const fmtMiles = n => {
  if(!n && n!==0) return "";
  return new Intl.NumberFormat("es-CL",{maximumFractionDigits:0}).format(Math.round(n));
};

// Parse a formatted number back to integer
export const parseMiles = str => {
  if(str===null||str===undefined||str==="") return 0;
  return parseInt(String(str).replace(/\./g,"").replace(/[^0-9-]/g,""))||0;
};

export const calcPrecioVenta = (costo, margen) => {
  const c=Number(costo)||0, m=Number(margen)||0;
  return Math.round(c*(1+m/100)*1.19);
};

export const calcMargenDesde = (costo, precioConIva) => {
  const c=Number(costo)||0, p=Number(precioConIva)||0;
  if(c<=0||p<=0) return 0;
  const neto=p/1.19;
  return ((neto-c)/c*100);
};

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
  if(clean.length<2) return clean;
  const dv=clean.slice(-1), body=clean.slice(0,-1).replace(/\B(?=(\d{3})+(?!\d))/g,".");
  return `${body}-${dv}`;
};

export const PERIODOS = [
  {id:"7d",   label:"7 días"},
  {id:"30d",  label:"30 días"},
  {id:"60d",  label:"60 días"},
  {id:"90d",  label:"90 días"},
  {id:"mes",  label:"Este mes"},
  {id:"mes-1",label:"Mes pasado"},
  {id:"todo", label:"Todo"},
];

export const filtrarPorPeriodo = (arr, periodo) => {
  if(!periodo||periodo==="todo") return arr;
  const t=today();
  if(periodo==="7d")    return arr.filter(c=>c.fecha&&c.fecha>=addDays(t,-7));
  if(periodo==="30d")   return arr.filter(c=>c.fecha&&c.fecha>=addDays(t,-30));
  if(periodo==="60d")   return arr.filter(c=>c.fecha&&c.fecha>=addDays(t,-60));
  if(periodo==="90d")   return arr.filter(c=>c.fecha&&c.fecha>=addDays(t,-90));
  if(periodo==="mes")   return arr.filter(c=>c.fecha&&c.fecha>=startOfMonth(0)&&c.fecha<=endOfMonth(0));
  if(periodo==="mes-1") return arr.filter(c=>c.fecha&&c.fecha>=startOfMonth(-1)&&c.fecha<=endOfMonth(-1));
  return arr;
};

export const ESTADOS_CRITICOS = ["Adjudicada","Facturada"];
export const ORDEN_ESTADOS = ["Borrador","Para revisar","Modificada","Enviada","Adjudicada","Facturada","Rechazada"];
export const esRetroceso = (de, a) => {
  const i=ORDEN_ESTADOS.indexOf(de), j=ORDEN_ESTADOS.indexOf(a);
  return j<i && i>=0 && j>=0;
};

// Export products to CSV
export const exportarProductosCSV = (productos) => {
  const headers = ["SKU","Nombre","Proveedor","Costo neto","Margen %","Precio venta","Stock","Ubicacion","Foto URL"];
  const rows = productos.map(p => [
    p.sku||"", p.nombre||"", p.proveedor||"",
    p.costo||0, p.margen||0, calcPrecioVenta(p.costo,p.margen),
    p.stock||0, p.ubicacion||"", p.foto_url||""
  ]);
  const csv = [headers, ...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download="boreal-productos.csv"; a.click();
  URL.revokeObjectURL(url);
};

export const BUILD_VERSION = "v7.0";
