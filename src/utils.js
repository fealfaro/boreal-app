export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
export const today = () => new Date().toISOString().slice(0,10);
export const nowISO = () => new Date().toISOString();
export const fmtDateTime = iso => {
  if(!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CL") + " " + d.toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"});
};
export const addDays = (date,days) => { const d=new Date(date||new Date()); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); };
export const diffDays = (a,b=today()) => Math.ceil((new Date(a)-new Date(b))/(1000*60*60*24));
export const startOfMonth = (o=0) => { const d=new Date(); d.setMonth(d.getMonth()+o,1); return d.toISOString().slice(0,10); };
export const endOfMonth   = (o=0) => { const d=new Date(); d.setMonth(d.getMonth()+o+1,0); return d.toISOString().slice(0,10); };

export const fmt    = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n||0);
export const fmtN   = n => new Intl.NumberFormat("es-CL",{maximumFractionDigits:0}).format(n||0);
export const fmtPct = n => `${(n||0).toFixed(1)}%`;
export const fmtMiles = n => { if(!n&&n!==0)return""; return new Intl.NumberFormat("es-CL",{maximumFractionDigits:0}).format(Math.round(n)); };
export const parseMiles = s => parseInt(String(s||"").replace(/\./g,"").replace(/[^0-9-]/g,""))||0;

export const calcPrecioVenta = (costo,margen) => Math.round((Number(costo)||0)*(1+(Number(margen)||0)/100)*1.19);
export const calcMargenDesde = (costo,pvConIva) => {
  const c=Number(costo)||0, p=Number(pvConIva)||0;
  if(!c||!p) return 0;
  return ((p/1.19-c)/c*100);
};
export const calcTotalesCot = items => {
  const sn=items.reduce((a,i)=>a+(i.precioVenta/1.19)*i.cantidad,0);
  const iva=sn*0.19, total=sn+iva;
  const ct=items.reduce((a,i)=>a+i.costo*i.cantidad,0);
  return {subtotalNeto:Math.round(sn),iva:Math.round(iva),total:Math.round(total),costoTotal:Math.round(ct),margenProm:total>0?((total-ct)/total*100):0};
};

// CPP: Costo Promedio Ponderado (estándar ERP)
export const calcCPP = (stockActual, costoActual, cantNueva, precioNuevo) => {
  const sa=Number(stockActual)||0, ca=Number(costoActual)||0;
  const cn=Number(cantNueva)||0, pn=Number(precioNuevo)||0;
  if(sa+cn===0) return pn;
  return Math.round((sa*ca+cn*pn)/(sa+cn));
};

export const formatRut = raw => {
  const clean=raw.replace(/[^0-9kK]/g,"").toUpperCase();
  if(clean.length<2) return clean;
  const dv=clean.slice(-1), body=clean.slice(0,-1).replace(/\B(?=(\d{3})+(?!\d))/g,".");
  return `${body}-${dv}`;
};

export const PERIODOS = [
  {id:"hoy",  label:"Hoy"},
  {id:"7d",   label:"7 días"},
  {id:"30d",  label:"30 días"},
  {id:"60d",  label:"60 días"},
  {id:"90d",  label:"90 días"},
  {id:"mes",  label:"Este mes"},
  {id:"mes-1",label:"Mes pasado"},
  {id:"todo", label:"Todo"},
];

export const filtrarPorPeriodo = (arr,periodo,campo="fecha") => {
  if(!periodo||periodo==="todo") return arr;
  const t=today();
  const get=item=>item[campo]?item[campo].slice(0,10):"";
  if(periodo==="hoy")   return arr.filter(i=>get(i)===t);
  if(periodo==="7d")    return arr.filter(i=>get(i)>=addDays(t,-7));
  if(periodo==="30d")   return arr.filter(i=>get(i)>=addDays(t,-30));
  if(periodo==="60d")   return arr.filter(i=>get(i)>=addDays(t,-60));
  if(periodo==="90d")   return arr.filter(i=>get(i)>=addDays(t,-90));
  if(periodo==="mes")   return arr.filter(i=>get(i)>=startOfMonth(0)&&get(i)<=endOfMonth(0));
  if(periodo==="mes-1") return arr.filter(i=>get(i)>=startOfMonth(-1)&&get(i)<=endOfMonth(-1));
  return arr;
};

export const ESTADOS_CRITICOS = ["Adjudicada","Facturada"];
export const ORDEN_ESTADOS = ["Borrador","Para revisar","Enviada","Adjudicada","Facturada","Rechazada"];
export const esRetroceso = (de,a) => {
  const i=ORDEN_ESTADOS.indexOf(de), j=ORDEN_ESTADOS.indexOf(a);
  return j<i&&i>=0&&j>=0;
};

export const exportarProductosCSV = prods => {
  const hdrs=["SKU","Nombre","Proveedor","Costo CPP","Margen %","Precio venta","Stock","Bodega","Foto URL"];
  const rows=prods.map(p=>[p.sku||"",p.nombre||"",p.proveedor||"",p.costo||0,p.margen||0,calcPrecioVenta(p.costo,p.margen),p.stock||0,p.ubicacion||"",p.foto_url||""]);
  const csv=[hdrs,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download="boreal-productos.csv";a.click();
  URL.revokeObjectURL(url);
};

export const importarProductosCSV = (text) => {
  const lines=text.trim().split("\n");
  if(lines.length<2) return [];
  const parseVal=v=>v.replace(/^"|"$/g,"").replace(/""/g,'"').trim();
  return lines.slice(1).map(line=>{
    const cols=line.match(/(".*?"|[^,]+)(?=,|$)/g)||[];
    const [sku,nombre,proveedor,costo,margen,_pv,stock,ubicacion,foto_url]=cols.map(parseVal);
    if(!nombre) return null;
    return {id:uid(),sku:sku||"",nombre,proveedor:proveedor||"",costo:Number(costo)||0,margen:Number(margen)||30,stock:Number(stock)||0,ubicacion:ubicacion||"",foto_url:foto_url||"",historialCostos:[]};
  }).filter(Boolean);
};

export const copiarAlPortapapeles = async texto => {
  try { await navigator.clipboard.writeText(texto); return true; }
  catch { return false; }
};

export const BUILD_VERSION = "v1.18.1";
export const USUARIO_DEFAULT = {nombre:"Felipe Alfaro",cargo:"Ejecutivo Comercial",telefono:"+56 9 3200 0969",email:"fealfaro@gmail.com",foto:""};

// Format ISO date to dd/mm/yyyy
export const fmtFecha = s => {
  if(!s) return "—";
  const d = s.slice(0,10);
  if(!d.includes("-")) return d;
  const [y,m,dd] = d.split("-");
  return `${dd}/${m}/${y}`;
};

// Margin color based on configurable thresholds
export const colorMargen = (pct, umbrales={verde:30,amarillo:15}) => {
  if(pct >= umbrales.verde)   return {bg:"#dcfce7",text:"#15803d"};
  if(pct >= umbrales.amarillo)return {bg:"#fef9c3",text:"#854d0e"};
  if(pct >= 0)                return {bg:"#fed7aa",text:"#9a3412"};
  return                              {bg:"#fee2e2",text:"#b91c1c"};
};

// Margin in $ from total and costoTotal
export const calcUtilidad = (total, costoTotal) => Math.round((total||0) - (costoTotal||0));
