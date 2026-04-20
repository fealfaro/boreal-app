import { useState, useEffect, useRef, useCallback } from "react";
import Combobox from "./Combobox.jsx";
import ProductoSearch from "./ProductoSearch.jsx";
import MilesInput from "./MilesInput.jsx";
import { ToastContainer, toast } from "./Toast.jsx";
import { generarPDFCotizacion } from "./pdfCotizacion.js";
import { ESTADOS_COT, ESTADOS_OP, ESTADO_COLORS, MESES_FULL, MESES, EMPRESA_INFO, CATEGORIAS_GASTO } from "./constants.js";
import {
  uid, today, nowISO, fmtDateTime, fmt, fmtN, fmtPct, fmtMiles,
  calcPrecioVenta, calcMargenDesde, calcTotalesCot, calcCPP,
  formatRut, addDays, diffDays, PERIODOS, filtrarPorPeriodo,
  ESTADOS_CRITICOS, esRetroceso, exportarProductosCSV, importarProductosCSV,
  copiarAlPortapapeles, BUILD_VERSION, USUARIO_DEFAULT,
  fmtFecha, colorMargen, calcUtilidad
} from "./utils.js";

const LOGO_B64_WHITE = "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";
const LOGO_B64_COLOR = "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";
const LOGO_B64 = LOGO_B64_WHITE; // sidebar (white on dark)

// ── Icons ─────────────────────────────────────────────────────
const Ic = {
  grid:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  box:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  file:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>,
  clock:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
  cart:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>,
  chart:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  check:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>,
  settings:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  bell:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  user:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  wallet:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  menu:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  download:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  upload:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  copy:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  sort:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  search:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  undo:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,14 4,9 9,4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>,
  x:       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  print:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  warehouse:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  warn:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

const NAV = [
  {id:"dashboard",   label:"Dashboard",    icon:Ic.grid},
  {id:"productos",   label:"Productos",    icon:Ic.box},
  {id:"cotizaciones",label:"Cotizaciones", icon:Ic.file},
  {id:"revision",    label:"Revisión",     icon:Ic.check},
  {id:"operacional", label:"Operacional",  icon:Ic.clock},
  {id:"compras",     label:"Compras",      icon:Ic.cart},
  {id:"inventario",  label:"Inventario",   icon:Ic.warehouse},
  {id:"gastos",      label:"Gastos",       icon:Ic.wallet},
  {id:"rentabilidad",label:"Rentabilidad", icon:Ic.chart},
  {id:"maestros",    label:"Maestros",      icon:Ic.box},
  {id:"config",      label:"Configuración",icon:Ic.settings},
  {id:"perfil",      label:"Mi perfil",    icon:Ic.user},
];

// Helper: total stock across all bodegas
const getStockTotal = (p) => {
  if(p.stockPorBodega&&p.stockPorBodega.length>0)
    return p.stockPorBodega.reduce((a,b)=>a+(b.cantidad||0),0);
  return p.stock||0;
};

// Helper: migrate legacy stock/ubicacion to stockPorBodega
const migrarStock = (p) => {
  if(p.stockPorBodega) return p;
  return {...p,stockPorBodega:[{bodega:p.ubicacion||"Bodega A-1",cantidad:p.stock||0}]};
};

const SEED_PRODS = [
  {id:"p1",sku:"ASE-001",nombre:"Cloro líquido 5L",proveedor:"Brenntag",costo:2800,margen:30,foto_url:"",stockPorBodega:[{bodega:"Bodega A-1",cantidad:20}],historialCostos:[{fecha:today(),costo:2800,cantidad:20,usuario:"Felipe Alfaro"}]},
  {id:"p2",sku:"ASE-002",nombre:"Detergente industrial 10kg",proveedor:"Unilever",costo:8500,margen:28,foto_url:"",stockPorBodega:[{bodega:"Bodega A-2",cantidad:8}],historialCostos:[]},
  {id:"p3",sku:"ASE-003",nombre:"Jabón líquido 5L",proveedor:"Diversey",costo:4100,margen:29,foto_url:"",stockPorBodega:[{bodega:"Bodega B-1",cantidad:15}],historialCostos:[]},
  {id:"p4",sku:"ASE-004",nombre:"Papel higiénico Elite x48",proveedor:"CMPC",costo:12000,margen:22,foto_url:"",stockPorBodega:[{bodega:"Bodega B-2",cantidad:5}],historialCostos:[]},
  {id:"p5",sku:"ASE-005",nombre:"Guantes nitrilo caja x100",proveedor:"Ansell",costo:6400,margen:32,foto_url:"",stockPorBodega:[{bodega:"Bodega C-1",cantidad:12}],historialCostos:[]},
];

// ── Shared UI ─────────────────────────────────────────────────
function Modal({onClose,children,maxWidth=480}) {
  const [hov,setHov]=useState(false);
  useEffect(()=>{
    const h=e=>{if(e.key==="Escape")onClose();};
    document.addEventListener("keydown",h);
    return()=>document.removeEventListener("keydown",h);
  },[onClose]);
  return (
    <div style={{position:"fixed",inset:0,background:hov?"rgba(0,0,0,.58)":"rgba(0,0,0,.46)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16,transition:"background .15s",cursor:hov?"pointer":"default"}}
      onClick={onClose} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div style={{background:"#fff",borderRadius:16,padding:"22px",width:"100%",maxWidth,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 25px 60px rgba(0,0,0,.28)",cursor:"default"}}
        onClick={e=>e.stopPropagation()} onMouseEnter={()=>setHov(false)}>{children}</div>
    </div>
  );
}

function CloseBtn({onClose}) {
  const [h,setH]=useState(false);
  return <button onClick={onClose} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
    style={{background:h?"#fee2e2":"#f1f5f9",border:"none",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:h?"#b91c1c":"#64748b",transition:"all .15s",flexShrink:0}}>{Ic.x}</button>;
}

function Btn({onClick,children,variant="primary",size="md",disabled=false,style:s={}}) {
  const [h,setH]=useState(false);
  const vs={
    primary:{bg:"#1d4ed8",hbg:"#0284c7",color:"#fff"},
    dark:   {bg:"#0f172a",hbg:"#1e293b",color:"#fff"},
    ghost:  {bg:"#f1f5f9",hbg:"#e2e8f0",color:"#64748b"},
    danger: {bg:"#fee2e2",hbg:"#fecaca",color:"#b91c1c"},
    green:  {bg:"#dcfce7",hbg:"#bbf7d0",color:"#15803d"},
    yellow: {bg:"#fef3c7",hbg:"#fde68a",color:"#92400e"},
  };
  const ss={md:{padding:"8px 16px",fontSize:13},sm:{padding:"5px 11px",fontSize:12},xs:{padding:"3px 8px",fontSize:11}};
  const v=vs[variant]||vs.primary;
  return <button onClick={onClick} disabled={disabled} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
    style={{background:disabled?"#e2e8f0":h?v.hbg:v.bg,color:disabled?"#94a3b8":v.color,border:"none",borderRadius:8,fontWeight:600,cursor:disabled?"not-allowed":"pointer",transition:"all .12s",...ss[size],...s}}>
    {children}
  </button>;
}

function EstadoBadge({estado}) {
  const col=ESTADO_COLORS[estado]||{bg:"#f1f5f9",text:"#475569"};
  return <span style={{background:col.bg,color:col.text,padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:500,whiteSpace:"nowrap"}}>{estado}</span>;
}

function MargenBadge({pct,monto,umbrales={},size="sm"}) {
  const u=colorMargen(pct,{verde:umbrales.verde||30,amarillo:umbrales.amarillo||15});
  const pad=size==="md"?"3px 9px":"2px 8px";
  const fs=size==="md"?12:10;
  const fw=size==="md"?700:600;
  return (
    <span style={{background:u.bg,color:u.text,padding:pad,borderRadius:20,fontSize:fs,fontWeight:fw,whiteSpace:"nowrap"}}>
      {fmtPct(pct)}{monto!==undefined&&pct>0?` · ${fmt(monto)}`:""}
    </span>
  );
}

function PeriodoChips({periodo,setPeriodo}) {
  return (
    <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
      <span style={{fontSize:11,color:"#94a3b8",fontWeight:500,whiteSpace:"nowrap",flexShrink:0}}>Período:</span>
      {PERIODOS.map(p=>(
        <button key={p.id} onClick={()=>setPeriodo(p.id)}
          style={{padding:"4px 10px",borderRadius:20,border:"none",fontSize:11,cursor:"pointer",fontWeight:periodo===p.id?600:400,background:periodo===p.id?"#0f172a":"#f1f5f9",color:periodo===p.id?"#fff":"#475569",transition:"all .12s"}}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

function buildNotifs(cots, prods, stockMin=5) {
  const n=[], t=today();
  cots.forEach(c=>{
    if(c.fechaVencimiento&&["Borrador","Enviada"].includes(c.estado)){
      const d=diffDays(c.fechaVencimiento,t);
      if(d<=3&&d>=0) n.push({id:c.id+"_v",tipo:"warning",msg:`${c.numero} vence en ${d===0?"hoy":d+"d"}`,tab:"cotizaciones"});
      if(d<0) n.push({id:c.id+"_ve",tipo:"danger",msg:`${c.numero} venció hace ${Math.abs(d)}d`,tab:"cotizaciones"});
    }
  });
  const comp=cots.filter(c=>c.estadoOp==="En compra");
  if(comp.length) n.push({id:"comp",tipo:"info",msg:`${comp.length} cot. en proceso de compra`,tab:"compras"});
  prods.forEach(p=>{if(getStockTotal(p)<stockMin) n.push({id:"s"+p.id,tipo:"warning",msg:`Stock bajo: ${p.nombre} (${fmtN(getStockTotal(p))} uds)`,tab:"inventario"});});
  return n;
}

// ── APP ───────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]             = useState("dashboard");
  const [sideOpen,setSideOpen]   = useState(false);
  const [productos,setProductos] = useState(SEED_PRODS);
  const [cots,setCots]           = useState([]);
  const [gastos,setGastos]       = useState([]);
  const [movimientos,setMovimientos] = useState([]);
  const [proveedores,setProv]    = useState(["Brenntag","Unilever","Diversey","CMPC","Ansell","3M Chile"]);
  const [empresas,setEmpresas]   = useState(["MINSAL","MINEDUC","MOP","SERVIU RM","Hospital Sótero del Río","Gendarmería","JUNAEB","SENAME"]);
  const [bodegas,setBodegas]     = useState(["Bodega A-1","Bodega A-2","Bodega B-1","Bodega B-2","Bodega C-1"]);
  const [perfil,setPerfil]       = useState(USUARIO_DEFAULT);
  const [usuarios,setUsuarios]   = useState([
    {id:"u1",nombre:"Felipe Alfaro",cargo:"Ejecutivo Comercial",email:"fealfaro@gmail.com",rol:"admin"},
    {id:"u2",nombre:"Jorge Díaz",cargo:"Ejecutivo Comercial",email:"jorge@borealgroup.cl",rol:"ejecutivo"},
  ]);
  const isAdmin = usuarios.find(u=>u.nombre===perfil.nombre)?.rol==="admin" || perfil.rol==="admin";
  const [config,setConfig]       = useState({mostrarMargenLinea:false,diasAlertaVenc:3,mostrarCotizacionCompra:true,alertaVariacionCompra:30,umbralVerde:30,umbralAmarillo:15,stockMinimo:5});
  const [modalProd,setModalProd] = useState(null);
  const [modalCot,setModalCot]   = useState(null);
  const [detalleCot,setDetalleCot]= useState(null);
  const [showNotifs,setShowNotifs]= useState(false);
  const [busqueda,setBusqueda]   = useState("");
  const [filtroEst,setFiltroEst] = useState("Todos");
  const [periodo,setPeriodo]     = useState("todo");
  const [sortCot,setSortCot]     = useState("fecha_desc");
  const [periDash,setPeriDash]   = useState("mes");
  const [mesRent,setMesRent]     = useState(null);

  const notifList = buildNotifs(cots, productos, config.stockMinimo||5);
  const adjFact   = cots.filter(c=>["Adjudicada","Facturada"].includes(c.estado));

  // Dashboard aggregates
  const dashCots = filtrarPorPeriodo(adjFact, periDash);
  const totalV   = dashCots.reduce((a,c)=>a+(c.total||0),0);
  const totalC   = dashCots.reduce((a,c)=>a+(c.costoTotal||0),0);
  const mgBruto  = totalV-totalC;
  const mgPct    = totalV>0?(mgBruto/totalV*100):0;
  const tasa     = cots.length>0?(adjFact.length/cots.length*100):0;
  const vMes     = Array(12).fill(0).map((_,i)=>adjFact.filter(c=>parseInt((c.fecha||"").slice(5,7))===i+1).reduce((a,c)=>a+(c.total||0),0));
  const maxV     = Math.max(...vMes,1);
  const dashGastos = filtrarPorPeriodo(gastos, periDash).reduce((a,g)=>a+(g.monto||0),0);

  // Filtered + sorted cotizaciones
  const filtCots = (() => {
    let arr = filtrarPorPeriodo(
      cots.filter(c=>{
        const mb=!busqueda||[c.organismo,c.numero,c.oportunidad_id].some(x=>(x||"").toLowerCase().includes(busqueda.toLowerCase()));
        return mb && (filtroEst==="Todos"||c.estado===filtroEst);
      }), periodo);
    const [key,dir]=sortCot.split("_");
    const mul=dir==="asc"?1:-1;
    arr=[...arr].sort((a,b)=>{
      if(key==="fecha")    return mul*(a.fecha||"").localeCompare(b.fecha||"");
      if(key==="modificado")return mul*((a.updatedAt||a.fecha||"")).localeCompare(b.updatedAt||b.fecha||"");
      if(key==="estado")   return mul*(a.estado||"").localeCompare(b.estado||"");
      if(key==="valor")    return mul*((a.total||0)-(b.total||0));
      if(key==="margen")   return mul*((a.margenProm||0)-(b.margenProm||0));
      return 0;
    });
    return arr;
  })();

  const setConfigKey=(k,v)=>{setConfig(p=>({...p,[k]:v}));toast("Configuración guardada");};

  const guardarProd=p=>{
    try {
      if(p.proveedor&&!proveedores.includes(p.proveedor)) setProv(prev=>[...prev,p.proveedor]);
      const spb=(p.stockPorBodega||[]).filter(b=>b.bodega&&b.cantidad>=0);
      const limpio={...p,costo:Number(p.costo)||0,margen:Number(p.margen)||0,stockPorBodega:spb,stock:spb.reduce((a,b)=>a+(b.cantidad||0),0),updatedAt:nowISO()};
      if(productos.find(x=>x.id===p.id)) setProductos(prev=>prev.map(x=>x.id===p.id?limpio:x));
      else setProductos(prev=>[...prev,{...limpio,id:uid()}]);
      setModalProd(null);
      toast("Producto guardado");
    } catch(e){console.error(e);toast("Error al guardar","error");}
  };
  const elimProd=id=>{
    if(cots.some(c=>(c.items||[]).some(i=>i.productoId===id))){toast("Producto en cotizaciones — no se puede eliminar","warning");return;}
    setProductos(prev=>prev.filter(x=>x.id!==id));setModalProd(null);toast("Producto eliminado");
  };
  const clonarProd=p=>setModalProd({...p,id:uid(),sku:p.sku+"-2",nombre:p.nombre+" (copia)"});

  const guardarCot=c=>{
    if(c.organismo&&!empresas.includes(c.organismo)) setEmpresas(prev=>[...prev,c.organismo]);
    const isNew=!cots.find(x=>x.id===c.id);
    const old=cots.find(x=>x.id===c.id);
    // If editing an Enviada/Adjudicada cot → back to Borrador
    let estadoFinal=c.estado;
    if(!isNew&&old&&["Enviada","Adjudicada"].includes(old.estado)&&old.estado===c.estado){
      estadoFinal="Borrador";
      toast("Cotización editada → vuelve a Borrador","warning",4000);
    }
    const logEntry={ts:nowISO(),fecha:today(),estado:estadoFinal,nota:isNew?"Creada":"Modificada",usuario:perfil.nombre};
    const log=isNew?[logEntry]:[...(old?.log||[]),logEntry];
    const entry={...c,estado:estadoFinal,log,updatedAt:nowISO()};
    if(isNew) setCots(prev=>[entry,...prev]);
    else setCots(prev=>prev.map(x=>x.id===entry.id?entry:x));
    // Sync if detalle open
    setDetalleCot(prev=>prev?.id===entry.id?entry:prev);
    setModalCot(null);
    toast(isNew?"Cotización creada":"Cotización actualizada");
  };

  const cambiarEstado=(id,estado,extra={})=>{
    const logEntry={ts:nowISO(),fecha:today(),estado,nota:extra.nota||"",usuario:perfil.nombre};
    setCots(prev=>prev.map(c=>{
      if(c.id!==id) return c;
      const updated={...c,estado,...extra,log:[...(c.log||[]),logEntry],updatedAt:nowISO()};
      // Sync detalle in real-time
      setDetalleCot(prev2=>prev2?.id===id?updated:prev2);
      return updated;
    }));
  };

  const nuevaCot=()=>setModalCot({
    id:uid(),numero:`BOT-${new Date().getFullYear()}-${String(cots.length+1).padStart(3,"0")}`,
    fecha:today(),fechaVencimiento:addDays(today(),10),organismo:"",oportunidad_id:"",
    rut_cliente:"",items:[],estado:"Borrador",notas:"",ejecutivo:perfil.nombre,
    facturaNum:"",facturaUrl:"",estadoOp:"",log:[]
  });

  const goTab=t=>{setTab(t);setSideOpen(false);};
  const isMob=()=>window.innerWidth<768;

  return (
    <div style={{fontFamily:"'DM Sans',sans-serif",background:"#f7f8fc",minHeight:"100vh",color:"#1a1a2e"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <style>{`@media print{.no-print{display:none!important}}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield}button:hover{opacity:0.92}`}</style>
      <ToastContainer/>

      {sideOpen&&<div onClick={()=>setSideOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:199}}/>}

      {/* SIDEBAR */}
      <div className="no-print" style={{position:"fixed",left:0,top:0,bottom:0,width:214,background:"#0f172a",display:"flex",flexDirection:"column",zIndex:200,transform:isMob()?(sideOpen?"translateX(0)":"translateX(-100%)"):"translateX(0)",transition:"transform .22s ease"}}>
        <div style={{padding:"16px",borderBottom:"1px solid #1e293b",display:"flex",justifyContent:"center",alignItems:"center",minHeight:78}}>
          <img src={`data:image/png;base64,${LOGO_B64}`} alt="Boreal" style={{height:54,maxWidth:160,objectFit:"contain"}} onError={e=>{e.target.style.display="none";}}/>
        </div>
        <nav style={{flex:1,padding:"10px 8px",display:"flex",flexDirection:"column",gap:1,overflowY:"auto"}}>
          {NAV.map(item=>{
            const isAct=tab===item.id;
            const badge = (() => {
              if(item.id==="revision")    return cots.filter(c=>c.estado==="Para revisar").length;
              if(item.id==="compras")     return cots.filter(c=>c.estadoOp==="En compra").length;
              if(item.id==="operacional") return cots.filter(c=>c.estadoOp&&["En compra","En despacho"].includes(c.estadoOp)).length;
              if(item.id==="cotizaciones")return cots.filter(c=>
                c.estado==="Modificada"||
                (c.fechaVencimiento&&["Borrador","Enviada"].includes(c.estado)&&diffDays(c.fechaVencimiento)<=3&&diffDays(c.fechaVencimiento)>=0)
              ).length;
              if(item.id==="productos")  return productos.filter(p=>getStockTotal(p)<(config.stockMinimo||5)).length;
              if(item.id==="inventario") return productos.filter(p=>getStockTotal(p)<(config.stockMinimo||5)).length;
              return 0;
            })();
            return (
              <button key={item.id} onClick={()=>goTab(item.id)} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 11px",borderRadius:8,background:isAct?"#1e40af":"transparent",color:isAct?"#fff":"#94a3b8",border:"none",cursor:"pointer",textAlign:"left",fontSize:13,fontWeight:isAct?500:400,transition:"all .12s",width:"100%"}}>
                <span style={{flexShrink:0,opacity:isAct?1:.75}}>{item.icon}</span>
                <span>{item.label}</span>
                {badge>0&&<span style={{marginLeft:"auto",background:"#ef4444",color:"#fff",borderRadius:20,fontSize:9,fontWeight:700,padding:"1px 5px"}}>{badge}</span>}
              </button>
            );
          })}
        </nav>
        <div style={{padding:"10px 12px",borderTop:"1px solid #1e293b"}}>
          <button onClick={()=>setShowNotifs(v=>!v)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#1e293b",border:"none",borderRadius:8,padding:"8px 12px",cursor:"pointer",color:"#94a3b8"}}>
            <span style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}>{Ic.bell} Alertas</span>
            {notifList.length>0&&<span style={{background:"#ef4444",color:"#fff",borderRadius:20,fontSize:9,fontWeight:700,padding:"1px 5px"}}>{notifList.length}</span>}
          </button>
          {showNotifs&&notifList.slice(0,4).map(n=>(
            <div key={n.id} onClick={()=>goTab(n.tab)} style={{marginTop:3,background:n.tipo==="danger"?"#fee2e2":n.tipo==="warning"?"#fef3c7":"#dbeafe",borderRadius:6,padding:"5px 8px",fontSize:10,cursor:"pointer",color:n.tipo==="danger"?"#b91c1c":n.tipo==="warning"?"#92400e":"#1d4ed8",lineHeight:1.4}}>{n.msg}</div>
          ))}
          <div style={{textAlign:"center",marginTop:8,fontSize:9,color:"#334155"}}>{BUILD_VERSION}</div>
        </div>
      </div>

      {/* Mobile topbar */}
      <div className="no-print" style={{position:"sticky",top:0,background:"#0f172a",padding:"10px 16px",display:"flex",alignItems:"center",gap:12,zIndex:100,...(isMob()?{}:{display:"none"})}}>
        <button onClick={()=>setSideOpen(true)} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",padding:4}}>{Ic.menu}</button>
        <img src={`data:image/png;base64,${LOGO_B64}`} alt="Boreal" style={{height:28,objectFit:"contain"}}/>
      </div>

      {/* MAIN */}
      <div style={{marginLeft:isMob()?0:214,padding:"22px 20px",minHeight:"100vh"}}>
        {tab==="dashboard"    && <Dashboard cots={cots} adjFact={adjFact} totalV={totalV} mgBruto={mgBruto} mgPct={mgPct} tasa={tasa} vMes={vMes} maxV={maxV} periDash={periDash} setPeriDash={setPeriDash} gastos={gastos} dashGastos={dashGastos} goTab={goTab}/>}
        {tab==="productos"    && <ModuloProductos productos={productos} setProductos={setProductos} onEdit={setModalProd} onNew={()=>setModalProd({sku:"",nombre:"",proveedor:"",costo:0,margen:30,foto_url:"",stockPorBodega:[{bodega:bodegas[0]||"",cantidad:0}],historialCostos:[]})} onClonar={clonarProd} bodegas={bodegas} perfil={perfil} stockMinimo={config.stockMinimo||5}/>}
        {tab==="cotizaciones" && <ModuloCotizaciones cots={filtCots} total={cots.length} busqueda={busqueda} setBusqueda={setBusqueda} filtroEst={filtroEst} setFiltroEst={setFiltroEst} periodo={periodo} setPeriodo={setPeriodo} sortCot={sortCot} setSortCot={setSortCot} onNew={nuevaCot} onDetalle={setDetalleCot} onEditar={setModalCot} umbrales={{verde:config.umbralVerde,amarillo:config.umbralAmarillo}}/>}
        {tab==="revision"     && <ModuloRevision cots={cots} cambiarEstado={cambiarEstado} onDetalle={setDetalleCot}/>}
        {tab==="operacional"  && <ModuloOperacional cots={cots} productos={productos} onCambiarEstado={cambiarEstado} onDetalle={setDetalleCot} setMovimientos={setMovimientos} setProductos={setProductos} perfil={perfil}/>}
        {tab==="compras"      && <ModuloCompras cots={cots} productos={productos} setProductos={setProductos} perfil={perfil} config={config} setMovimientos={setMovimientos} bodegas={bodegas}/>}
        {tab==="inventario"   && <ModuloInventario productos={productos} setProductos={setProductos} movimientos={movimientos} setMovimientos={setMovimientos} perfil={perfil} bodegas={bodegas} stockMinimo={config.stockMinimo||5}/>}
        {tab==="gastos"       && <ModuloGastos gastos={gastos} setGastos={setGastos} adjFact={adjFact} perfil={perfil} isAdmin={isAdmin} umbrales={{verde:config.umbralVerde,amarillo:config.umbralAmarillo}}/>}
        {tab==="rentabilidad" && <ModuloRentabilidad adjFact={adjFact} mesRent={mesRent} setMesRent={setMesRent} gastos={gastos} umbrales={{verde:config.umbralVerde,amarillo:config.umbralAmarillo}}/>}
        {tab==="maestros"     && <ModuloMaestros proveedores={proveedores} setProv={setProv} empresas={empresas} setEmpresas={setEmpresas} bodegas={bodegas} setBodegas={setBodegas} cots={cots}/>}
        {tab==="config"       && <ModuloConfig proveedores={proveedores} setProv={setProv} empresas={empresas} setEmpresas={setEmpresas} bodegas={bodegas} setBodegas={setBodegas} config={config} setConfigKey={setConfigKey} cots={cots} usuarios={usuarios} setUsuarios={setUsuarios} isAdmin={isAdmin}/>}
        {tab==="perfil"       && <ModuloPerfil perfil={perfil} setPerfil={setPerfil}/>}
      </div>

      {modalProd   && <ModalProducto producto={modalProd} proveedores={proveedores} bodegas={bodegas} onSave={guardarProd} onDelete={elimProd} onClose={()=>setModalProd(null)} perfil={perfil}/>}
      {modalCot    && <ModalCotizacion cotizacion={modalCot} productos={productos} empresas={empresas} config={config} onSave={guardarCot} onClose={()=>setModalCot(null)} logoB64={LOGO_B64_COLOR} perfil={perfil}/>}
      {detalleCot  && <DetalleCotizacion cotizacion={detalleCot} productos={productos} onCambiarEstado={cambiarEstado} onEditar={()=>{setModalCot(detalleCot);setDetalleCot(null);}} onClose={()=>setDetalleCot(null)} logoB64={LOGO_B64_COLOR} perfil={perfil} isAdmin={isAdmin}/>}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────
function Dashboard({cots,adjFact,totalV,mgBruto,mgPct,tasa,vMes,maxV,periDash,setPeriDash,gastos,dashGastos,goTab}) {
  const [tooltip,setTooltip]=useState(null);
  const mgNeto=mgBruto-dashGastos;
  const enCurso=cots.filter(c=>["Enviada","Adjudicada"].includes(c.estado)).length;
  const paraRev=cots.filter(c=>c.estado==="Para revisar").length;
  const pendComp=cots.filter(c=>c.estadoOp==="En compra").length;
  const porVencer=cots.filter(c=>c.fechaVencimiento&&["Borrador","Enviada"].includes(c.estado)&&diffDays(c.fechaVencimiento)<=3&&diffDays(c.fechaVencimiento)>=0).length;

  const KPI=({label,value,sub,color,tab})=>{
    const [h,setH]=useState(false);
    return (
      <div onClick={tab?()=>goTab(tab):undefined} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
        style={{background:"#fff",borderRadius:12,padding:"13px 15px",boxShadow:h&&tab?"0 4px 16px rgba(0,0,0,.1)":"0 1px 3px rgba(0,0,0,.06)",borderTop:`3px solid ${color}`,cursor:tab?"pointer":"default",transition:"all .15s",transform:h&&tab?"translateY(-2px)":"none"}}>
        <div style={{color:"#64748b",fontSize:11,marginBottom:3}}>{label}</div>
        <div style={{fontSize:18,fontWeight:700,color:"#0f172a"}}>{value}</div>
        {sub&&<div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>{sub}</div>}
      </div>
    );
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <h1 style={{fontSize:22,fontWeight:700,margin:0}}>Dashboard</h1>
        <PeriodoChips periodo={periDash} setPeriodo={setPeriDash}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:11,marginBottom:16}}>
        <KPI label="Ventas adj." value={fmt(totalV)} color="#1d4ed8" tab="cotizaciones"/>
        <KPI label="Margen bruto" value={fmt(mgBruto)} sub={fmtPct(mgPct)} color="#10b981"/>
        <KPI label="Margen neto" value={fmt(mgNeto)} sub={dashGastos>0?`-${fmt(dashGastos)} gastos`:""} color={mgNeto>=0?"#6366f1":"#ef4444"}/>
        <KPI label="Cotizaciones" value={fmtN(cots.length)} color="#8b5cf6" tab="cotizaciones"/>
        <KPI label="Tasa éxito" value={fmtPct(tasa)} color="#f59e0b"/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:13,marginBottom:13}}>
        {/* Gráfico grande */}
        <div style={{background:"#fff",borderRadius:12,padding:"18px",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:14}}>Ventas mensuales</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:5,height:160,position:"relative"}}>
            {vMes.map((v,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,position:"relative"}} onMouseEnter={()=>setTooltip({i,v})} onMouseLeave={()=>setTooltip(null)}>
                {tooltip?.i===i&&v>0&&(
                  <div style={{position:"absolute",bottom:"calc(100% + 4px)",left:"50%",transform:"translateX(-50%)",background:"#0f172a",color:"#fff",borderRadius:6,padding:"4px 8px",fontSize:10,fontWeight:600,whiteSpace:"nowrap",zIndex:10}}>
                    {fmt(v)}
                    <div style={{position:"absolute",top:"100%",left:"50%",transform:"translateX(-50%)",border:"4px solid transparent",borderTopColor:"#0f172a"}}/>
                  </div>
                )}
                <div style={{width:"100%",background:v>0?"#1d4ed8":"#e2e8f0",borderRadius:"4px 4px 0 0",height:`${Math.max((v/maxV)*140,3)}px`,cursor:"pointer",transition:"opacity .15s",opacity:tooltip?.i===i?.8:1}} onClick={()=>setPeriDash(periDash==="mes"&&tooltip?.i===i?"todo":"mes")}/>
                <div style={{fontSize:8,color:"#94a3b8"}}>{MESES[i]}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:10,color:"#94a3b8",marginTop:6}}>Hover → total · Clic → filtrar</div>
        </div>
        {/* Gestión activa */}
        <div style={{background:"#fff",borderRadius:12,padding:"18px",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:11}}>Gestión activa</div>
          {[
            {label:"En curso",     val:enCurso,   color:"#1d4ed8",tab:"cotizaciones"},
            {label:"Para revisar", val:paraRev,   color:"#9d174d",tab:"revision"},
            {label:"En compra",    val:pendComp,  color:"#92400e",tab:"compras"},
            {label:"Vencen pronto",val:porVencer, color:"#b91c1c",tab:"cotizaciones"},
          ].map((r,i)=>{
            const [h,setH]=useState(false);
            return (
              <div key={i} onClick={()=>goTab(r.tab)} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 9px",borderRadius:8,marginBottom:5,cursor:"pointer",background:h?"#f8fafc":"transparent",border:"1px solid #f1f5f9",transition:"all .1s"}}>
                <span style={{fontSize:12,color:"#475569"}}>{r.label}</span>
                <span style={{fontWeight:700,fontSize:14,color:r.val>0?r.color:"#94a3b8"}}>{r.val}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Estados */}
      <div style={{background:"#fff",borderRadius:12,padding:"18px",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
        <div style={{fontWeight:600,fontSize:14,marginBottom:11}}>Estados de cotizaciones</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8}}>
          {[...ESTADOS_COT,"Para revisar"].map(e=>{
            const cnt=cots.filter(c=>c.estado===e).length;
            if(!cnt) return null;
            const col=ESTADO_COLORS[e]; const pct=cots.length>0?(cnt/cots.length*100):0;
            return (<div key={e} style={{padding:"8px 10px",background:"#f8fafc",borderRadius:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <EstadoBadge estado={e}/><span style={{fontSize:12,color:"#64748b",fontWeight:600}}>{cnt}</span>
              </div>
              <div style={{height:3,background:"#e2e8f0",borderRadius:2}}><div style={{height:"100%",width:`${pct}%`,background:col.text,borderRadius:2}}/></div>
            </div>);
          })}
        </div>
        {!cots.length&&<div style={{color:"#94a3b8",fontSize:13}}>Sin cotizaciones aún</div>}
      </div>
    </div>
  );
}

// ── PRODUCTOS ─────────────────────────────────────────────────
function ModuloProductos({productos,setProductos,onEdit,onNew,onClonar,bodegas,perfil,stockMinimo=5}) {
  const [busq,setBusq]=useState("");
  const [sort,setSort]=useState("nombre_asc");
  const fileRef=useRef();

  const handleImport=e=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const prods=importarProductosCSV(ev.target.result);
      if(!prods.length){toast("No se encontraron productos en el archivo","warning");return;}
      setProductos(prev=>[...prev,...prods]);
      toast(`${prods.length} productos importados`);
    };
    reader.readAsText(file,"UTF-8");
    e.target.value="";
  };

  const sorted=(()=>{
    let arr=productos.filter(p=>!busq||p.nombre.toLowerCase().includes(busq.toLowerCase())||p.sku.toLowerCase().includes(busq.toLowerCase()));
    const [k,d]=sort.split("_");const mul=d==="asc"?1:-1;
    return [...arr].sort((a,b)=>{
      if(k==="nombre") return mul*a.nombre.localeCompare(b.nombre);
      if(k==="precio") return mul*(calcPrecioVenta(a.costo,a.margen)-calcPrecioVenta(b.costo,b.margen));
      if(k==="modif")  return mul*((a.updatedAt||"").localeCompare(b.updatedAt||""));
      if(k==="stock")  return mul*((a.stock||0)-(b.stock||0));
      return 0;
    });
  })();

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <div><h1 style={{fontSize:22,fontWeight:700,marginBottom:2}}>Productos</h1><p style={{color:"#64748b",fontSize:13,margin:0}}>{sorted.length} de {productos.length}</p></div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          <input style={{display:"none"}} type="file" accept=".csv,.xlsx" ref={fileRef} onChange={handleImport}/>
          <Btn onClick={()=>fileRef.current?.click()} variant="ghost" size="sm"><span style={{display:"flex",alignItems:"center",gap:4}}>{Ic.upload} Importar CSV</span></Btn>
          <Btn onClick={()=>exportarProductosCSV(productos)} variant="ghost" size="sm"><span style={{display:"flex",alignItems:"center",gap:4}}>{Ic.download} Exportar CSV</span></Btn>
          <Btn onClick={onNew} size="sm">+ Nuevo</Btn>
        </div>
      </div>
      {/* Buscador + Sort */}
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:160}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}>{Ic.search}</span>
          <input value={busq} onChange={e=>setBusq(e.target.value)} placeholder="Buscar por nombre o SKU…" style={{width:"100%",padding:"7px 12px 7px 32px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
        </div>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={{padding:"7px 11px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,background:"#fff",cursor:"pointer"}}>
          <option value="nombre_asc">Nombre A→Z</option>
          <option value="nombre_desc">Nombre Z→A</option>
          <option value="precio_asc">Precio ↑</option>
          <option value="precio_desc">Precio ↓</option>
          <option value="modif_desc">Recién modificado</option>
          <option value="stock_asc">Stock ↑</option>
          <option value="stock_desc">Stock ↓</option>
        </select>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:13}}>
        {sorted.map(p=>{
          const pv=calcPrecioVenta(p.costo,p.margen);
          return (
            <div key={p.id} style={{background:"#fff",borderRadius:13,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.07)",cursor:"pointer",transition:"all .14s",border:"1px solid #f1f5f9"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 22px rgba(0,0,0,.11)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.07)";}}>
              <div onClick={()=>onEdit(p)} style={{width:"100%",paddingTop:"75%",position:"relative",background:"#f8fafc",overflow:"hidden"}}>
                {p.foto_url?<img src={p.foto_url} alt={p.nombre} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"contain",padding:"6px",boxSizing:"border-box",background:"#f8fafc"}}/>
                  :<div style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,color:"#cbd5e1"}}>📦</div>}
                {getStockTotal(p)<stockMinimo&&<div style={{position:"absolute",top:7,right:7,background:"#ef4444",color:"#fff",borderRadius:20,fontSize:9,fontWeight:700,padding:"2px 7px"}}>Stock bajo</div>}
              </div>
              <div style={{padding:"10px 12px"}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"#94a3b8",marginBottom:2}}>{p.sku}</div>
                <div onClick={()=>onEdit(p)} style={{fontWeight:600,fontSize:13,marginBottom:2,lineHeight:1.3}}>{p.nombre}</div>
                <div style={{color:"#64748b",fontSize:11,marginBottom:7}}>{p.proveedor}</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontSize:9,color:"#94a3b8"}}>Precio venta</div><div style={{fontWeight:700,fontSize:13,color:"#1d4ed8"}}>{fmt(pv)}</div></div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{background:p.margen<0?"#fee2e2":"#dcfce7",color:p.margen<0?"#b91c1c":"#15803d",padding:"1px 7px",borderRadius:20,fontSize:10,fontWeight:600}}>{fmtPct(p.margen)}</span>
                    <button onClick={e=>{e.stopPropagation();onClonar(p);}} title="Clonar" style={{background:"#eff6ff",border:"1px solid #bae6fd",borderRadius:5,padding:"2px 7px",cursor:"pointer",fontSize:11,color:"#1e40af"}}>⧉</button>
                  </div>
                </div>
                <div style={{marginTop:5,fontSize:10,color:"#94a3b8"}}>Stock total: {fmtN(getStockTotal(p))} uds</div>
              </div>
            </div>
          );
        })}
        {!sorted.length&&<div style={{gridColumn:"1/-1",padding:32,textAlign:"center",color:"#94a3b8",fontSize:13}}>Sin productos que coincidan</div>}
      </div>
    </div>
  );
}

// ── COTIZACIONES ──────────────────────────────────────────────
function ModuloCotizaciones({cots,total,busqueda,setBusqueda,filtroEst,setFiltroEst,periodo,setPeriodo,sortCot,setSortCot,onNew,onDetalle,onEditar,umbrales={}}) {
  const handleCopy=async (c,e)=>{
    e.stopPropagation();
    const ok=await copiarAlPortapapeles(`Cotización ${c.numero} — ${c.organismo} — ${fmt(c.total||0)}`);
    toast(ok?"Link copiado al portapapeles":"No se pudo copiar",ok?"success":"error");
  };
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:10}}>
        <div><h1 style={{fontSize:22,fontWeight:700,marginBottom:2}}>Cotizaciones</h1><p style={{color:"#64748b",fontSize:13,margin:0}}>{cots.length} de {total}</p></div>
        <Btn onClick={onNew}>+ Nueva</Btn>
      </div>
      <div style={{background:"#fff",borderRadius:10,padding:"10px 13px",marginBottom:10,boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
        <PeriodoChips periodo={periodo} setPeriodo={setPeriodo}/>
      </div>
      <div style={{display:"flex",gap:7,marginBottom:10,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:130}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8"}}>{Ic.search}</span>
          <input placeholder="Buscar…" value={busqueda} onChange={e=>setBusqueda(e.target.value)} style={{width:"100%",padding:"7px 12px 7px 30px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
        </div>
        <select value={sortCot} onChange={e=>setSortCot(e.target.value)} style={{padding:"6px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,background:"#fff",cursor:"pointer"}}>
          <option value="fecha_desc">Fecha ↓</option>
          <option value="fecha_asc">Fecha ↑</option>
          <option value="modificado_desc">Modificado ↓</option>
          <option value="valor_desc">Valor ↓</option>
          <option value="valor_asc">Valor ↑</option>
          <option value="margen_desc">Margen ↓</option>
          <option value="estado_asc">Estado A→Z</option>
        </select>
        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
          {["Todos",...ESTADOS_COT,"Para revisar"].map(e=>{
            const ec=ESTADO_COLORS[e];
            return <button key={e} onClick={()=>setFiltroEst(e)} style={{padding:"5px 9px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:11,cursor:"pointer",fontWeight:filtroEst===e?600:400,background:filtroEst===e?(ec?.bg||"#0f172a"):"#fff",color:filtroEst===e?(ec?.text||"#fff"):"#64748b",transition:"all .12s"}}>{e}</button>;
          })}
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:520}}>
            <thead><tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
              {["Número","Fecha","Vence","Organismo","Total","Margen","Estado",""].map(h=><th key={h} style={{padding:"8px 11px",textAlign:"left",fontWeight:600,color:"#64748b",fontSize:10,whiteSpace:"nowrap"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {cots.map((c,i)=>{
                const col=ESTADO_COLORS[c.estado]||{};const mg2=c.margenProm||0;
                const dv=c.fechaVencimiento&&["Borrador","Enviada"].includes(c.estado)?diffDays(c.fechaVencimiento):null;
                return (
                  <tr key={c.id} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"#fff":"#fafafa",cursor:"pointer"}}
                    onClick={()=>onDetalle(c)}
                    onMouseEnter={e=>e.currentTarget.style.background="#f0f9ff"}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#fff":"#fafafa"}>
                    <td style={{padding:"8px 11px"}}>
                      <button onClick={e=>handleCopy(c,e)} title="Copiar referencia" style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#1d4ed8",fontWeight:600,background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:4}}>
                        {c.numero} <span style={{opacity:.5}}>{Ic.copy}</span>
                      </button>
                    </td>
                    <td style={{padding:"8px 11px",color:"#64748b",whiteSpace:"nowrap"}}>{fmtFecha(c.fecha)}</td>
                    <td style={{padding:"8px 11px",whiteSpace:"nowrap"}}>
                      {dv!==null?<span style={{fontSize:10,fontWeight:600,color:dv<0?"#b91c1c":dv<=3?"#92400e":"#64748b",background:dv<0?"#fee2e2":dv<=3?"#fef3c7":"transparent",padding:"1px 6px",borderRadius:4}}>{dv<0?"Venció":`${dv}d`}</span>:<span style={{color:"#94a3b8",fontSize:10}}>—</span>}
                    </td>
                    <td style={{padding:"8px 11px",fontWeight:500,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.organismo}</td>
                    <td style={{padding:"8px 11px",fontWeight:700,whiteSpace:"nowrap"}}>{fmt(c.total||0)}</td>
                    <td style={{padding:"8px 11px",whiteSpace:"nowrap"}}><MargenBadge pct={mg2} monto={calcUtilidad(c.total,c.costoTotal)} umbrales={umbrales}/></td>
                    <td style={{padding:"8px 11px"}}><EstadoBadge estado={c.estado}/></td>
                    <td style={{padding:"8px 11px"}} onClick={e=>e.stopPropagation()}>
                      <button onClick={e=>{e.stopPropagation();onEditar(c);}} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:5,padding:"3px 8px",cursor:"pointer",fontSize:10,color:"#64748b",transition:"all .12s"}}>Editar</button>
                    </td>
                  </tr>
                );
              })}
              {!cots.length&&<tr><td colSpan={8} style={{padding:28,textAlign:"center",color:"#94a3b8",fontSize:13}}>Sin resultados</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── REVISIÓN ──────────────────────────────────────────────────
function ModuloRevision({cots,cambiarEstado,onDetalle}) {
  const lista=cots.filter(c=>c.estado==="Para revisar");
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:4}}>Revisión</h1>
      <p style={{color:"#64748b",fontSize:13,marginBottom:16}}>Workflow de aprobación antes de postular a Mercado Público</p>
      {!lista.length&&<div style={{background:"#fff",borderRadius:12,padding:36,textAlign:"center",color:"#94a3b8",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
        <div style={{fontSize:26,marginBottom:6}}>✓</div><div style={{fontSize:14,fontWeight:500}}>Sin cotizaciones para revisar</div>
      </div>}
      {lista.map(c=>{
        const {total,margenProm}=calcTotalesCot(c.items||[]);
        return (
          <div key={c.id} style={{background:"#fff",borderRadius:12,padding:"17px",marginBottom:11,boxShadow:"0 1px 3px rgba(0,0,0,.06)",border:"1px solid #fce7f3"}}>
            <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:11}}>
              <div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#1d4ed8",marginBottom:2}}>{c.numero}</div>
                <div style={{fontWeight:700,fontSize:15}}>{c.organismo}</div>
                <div style={{color:"#64748b",fontSize:12,marginTop:2}}>{fmtFecha(c.fecha)} · Ej: {c.ejecutivo||"—"}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:700,fontSize:17,color:"#1d4ed8"}}>{fmt(c.total||total)}</div>
                <div style={{fontSize:11,color:(c.margenProm||margenProm)>=25?"#15803d":"#b91c1c",fontWeight:600}}>Margen: {fmtPct(c.margenProm||margenProm)}</div>
              </div>
            </div>
            <div style={{background:"#f8fafc",borderRadius:7,padding:"8px 11px",marginBottom:11,fontSize:12}}>
              {(c.items||[]).slice(0,3).map((item,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"2px 0"}}><span style={{color:"#475569"}}>{item.nombre}</span><span style={{color:"#64748b"}}>{fmtN(item.cantidad)} uds.</span></div>
              ))}
              {(c.items||[]).length>3&&<div style={{color:"#94a3b8",fontSize:11,marginTop:2}}>+{(c.items||[]).length-3} más</div>}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"space-between"}}>
              <Btn onClick={()=>onDetalle(c)} variant="ghost" size="sm">Ver detalle</Btn>
              <div style={{display:"flex",gap:7}}>
                <Btn onClick={()=>{const m=prompt("Motivo (opcional):");cambiarEstado(c.id,"Rechazada",{nota:m||"Rechazada en revisión"});}} variant="danger" size="sm">✗ Rechazar</Btn>
                <Btn onClick={()=>cambiarEstado(c.id,"Borrador",{nota:"Aprobada para postulación"})} size="sm">✓ Aprobar</Btn>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── OPERACIONAL (Kanban Jira-style) ───────────────────────────
function ModuloOperacional({cots,productos,onCambiarEstado,onDetalle,setMovimientos,setProductos,perfil}) {
  const [periodo,setPeriodo]=useState("todo");
  const adj=cots.filter(c=>c.estado==="Adjudicada");
  const allOp=cots.filter(c=>c.estadoOp&&["En compra","En despacho","Entregado"].includes(c.estadoOp));
  const filtrados=filtrarPorPeriodo(allOp,periodo);

  const cambiarOp=(c,estadoOp,extra={})=>{
    if(estadoOp==="En despacho"){
      const itemsSinCompra=(c.items||[]).filter(item=>{
        const p=productos.find(x=>x.id===item.productoId||x.nombre===item.nombre);
        return !p||(p.stock||0)<1;
      });
      if(itemsSinCompra.length>0){
        toast(`Faltan productos por comprar: ${itemsSinCompra.map(i=>i.nombre).join(", ")}. Completa la compra primero.`,"warning",5000);
        return;
      }
    }
    if(estadoOp==="Entregado"){
      const receptor=prompt("¿Quién recibió el pedido?");
      if(!receptor) return;
      const fechaEnt=prompt("Fecha de entrega (YYYY-MM-DD):",today());
      onCambiarEstado(c.id,"Adjudicada",{estadoOp,receptor,fechaEntrega:fechaEnt||today(),nota:`Entregado a ${receptor}`,log:[...(c.log||[]),{ts:nowISO(),fecha:today(),estado:"Entregado",nota:`Entregado a ${receptor}`,usuario:"Felipe Alfaro"}]});
      toast(`Entregado a ${receptor}`,"success");
      // Deduct stock for each item and register movement
      if(setProductos && setMovimientos) {
        (c.items||[]).forEach(item=>{
          const prod=productos.find(p=>p.id===item.productoId||p.nombre===item.nombre);
          if(prod) {
            const stockAntes=getStockTotal(prod);
            // Deduct from first available bodega with enough stock
            let remaining=item.cantidad;
            const spbNew=(prod.stockPorBodega||[{bodega:"",cantidad:stockAntes}]).map(b=>{
              if(remaining<=0) return b;
              const deduct=Math.min(b.cantidad||0,remaining);
              remaining-=deduct;
              return{...b,cantidad:(b.cantidad||0)-deduct};
            });
            const stockDespues=spbNew.reduce((a,b)=>a+(b.cantidad||0),0);
            setProductos(prev=>prev.map(p=>p.id!==prod.id?p:{...p,stockPorBodega:spbNew,stock:stockDespues,updatedAt:nowISO()}));
            setMovimientos(prev=>[...prev,{
              id:uid(),ts:nowISO(),fecha:today(),tipo:"salida",
              productoId:prod.id,nombreProducto:prod.nombre,
              cantidad:item.cantidad,stockAntes,stockDespues,
              referencia:c.numero,motivo:"Despacho/Entrega",
              bodegaOrigen:prod.ubicacion||"",bodegaDestino:"Cliente",
              usuario:perfil?.nombre||""
            }]);
          }
        });
      }
      return;
    }
    onCambiarEstado(c.id,"Adjudicada",{estadoOp,...extra,nota:`→ ${estadoOp}`});
  };

  const deshacerOp=c=>{
    const estados=["En compra","En despacho","Entregado"];
    const idx=estados.indexOf(c.estadoOp);
    if(idx>0) cambiarOp(c,estados[idx-1]);
    else onCambiarEstado(c.id,"Adjudicada",{estadoOp:"",nota:"Operación revertida"});
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <div><h1 style={{fontSize:22,fontWeight:700,marginBottom:2}}>Operacional</h1><p style={{color:"#64748b",fontSize:13,margin:0}}>Kanban de cotizaciones adjudicadas</p></div>
        <PeriodoChips periodo={periodo} setPeriodo={setPeriodo}/>
      </div>

      {adj.filter(c=>!c.estadoOp).length>0&&(
        <div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:10,padding:"12px 16px",marginBottom:14}}>
          <div style={{fontWeight:600,fontSize:13,color:"#92400e",marginBottom:8}}>Sin estado operacional</div>
          {adj.filter(c=>!c.estadoOp).map(c=>(
            <div key={c.id} style={{background:"#fff",borderRadius:8,padding:"10px 14px",marginBottom:6,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <div style={{flex:1}}>
                <button onClick={()=>onDetalle(c)} style={{fontWeight:600,fontSize:13,background:"none",border:"none",cursor:"pointer",color:"#1d4ed8",padding:0,fontFamily:"'DM Mono',monospace",fontSize:11}}>{c.numero}</button>
                <span style={{fontSize:13,fontWeight:600,marginLeft:8}}>{c.organismo}</span>
                <div style={{fontSize:11,color:"#64748b"}}>{fmt(c.total||0)}</div>
              </div>
              <Btn onClick={()=>cambiarOp(c,"En compra",{fechaCompra:today()})} variant="yellow" size="sm">→ Iniciar compra</Btn>
            </div>
          ))}
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:13}}>
        {ESTADOS_OP.map(estado=>{
          const items=filtrados.filter(c=>c.estadoOp===estado);
          const col=ESTADO_COLORS[estado];
          return (
            <div key={estado} style={{background:"#fff",borderRadius:12,padding:"14px",boxShadow:"0 1px 3px rgba(0,0,0,.06)",minHeight:100}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:11}}>
                <span style={{background:col.bg,color:col.text,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600}}>{estado}</span>
                <span style={{color:"#94a3b8",fontSize:12}}>{items.length}</span>
              </div>
              {items.map(c=>(
                <div key={c.id} style={{background:"#f8fafc",borderRadius:8,padding:"10px 11px",marginBottom:8,border:"1px solid #f1f5f9"}}>
                  <button onClick={()=>onDetalle(c)} style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"#1d4ed8",background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:2}}>{c.numero}</button>
                  <div style={{fontWeight:600,fontSize:12,marginBottom:1}}>{c.organismo}</div>
                  <div style={{fontSize:12,fontWeight:700,color:"#0f172a",marginBottom:6}}>{fmt(c.total||0)}</div>
                  {c.fechaCompra&&<div style={{fontSize:9,color:"#94a3b8",marginBottom:2}}>Compra: {c.fechaCompra}</div>}
                  {c.fechaDespacho&&<div style={{fontSize:9,color:"#94a3b8",marginBottom:2}}>Despacho: {c.fechaDespacho}</div>}
                  {c.receptor&&<div style={{fontSize:9,color:"#065f46",marginBottom:4}}>Recibió: {c.receptor}</div>}
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:4}}>
                    <button onClick={()=>deshacerOp(c)} style={{background:"#f1f5f9",border:"none",borderRadius:5,padding:"3px 7px",cursor:"pointer",fontSize:10,color:"#64748b",display:"flex",alignItems:"center",gap:2,transition:"all .12s"}}>{Ic.undo} Deshacer</button>
                    {estado==="En compra"&&(
                      <button onClick={()=>{
                        const fd=prompt("Fecha de despacho (YYYY-MM-DD):",addDays(today(),1));
                        if(fd) cambiarOp(c,"En despacho",{fechaDespacho:fd});
                      }} style={{background:"#e0e7ff",border:"none",borderRadius:5,padding:"3px 8px",cursor:"pointer",fontSize:10,color:"#3730a3",fontWeight:500,transition:"all .12s"}}>→ Despacho</button>
                    )}
                    {estado==="En despacho"&&(
                      <button onClick={()=>cambiarOp(c,"Entregado")} style={{background:"#d1fae5",border:"none",borderRadius:5,padding:"3px 8px",cursor:"pointer",fontSize:10,color:"#065f46",fontWeight:500,transition:"all .12s"}}>✓ Entregado</button>
                    )}
                  </div>
                </div>
              ))}
              {!items.length&&<div style={{color:"#94a3b8",fontSize:12,textAlign:"center",padding:"10px 0"}}>Sin items</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── COMPRAS ───────────────────────────────────────────────────
function ModuloCompras({cots,productos,setProductos,perfil,config,setMovimientos,bodegas=[]}) {
  const [periodo,setPeriodo]=useState("todo");
  const [historial,setHistorial]=useState([]);
  const [compradas,setCompradas]=useState({});
  const [precios,setPrecios]=useState({});
  const [bodegasCompra,setBodegasCompra]=useState({});
  const [verHistorial,setVerHistorial]=useState(false);

  const pendientes=cots.filter(c=>c.estadoOp==="En compra");
  const allItems=pendientes.flatMap(c=>(c.items||[]).map(i=>({...i,cotNum:c.numero,cotOrg:c.organismo})));
  const agrupado=allItems.reduce((acc,item)=>{
    const k=item.productoId||item.nombre;
    if(!acc[k]) acc[k]={...item,cantidadTotal:0,cotizaciones:[]};
    acc[k].cantidadTotal+=item.cantidad;
    acc[k].cotizaciones.push(item.cotNum);
    return acc;
  },{});
  const lista=Object.values(agrupado);

  const getStockFaltante=(item)=>{
    const prod=productos.find(p=>p.id===item.productoId||p.nombre===item.nombre);
    const stockActual=prod?getStockTotal(prod):0;
    return Math.max(0,item.cantidadTotal-stockActual);
  };

  const alertaVariacion=(costoActual,precioNuevo)=>{
    if(!costoActual||!precioNuevo) return false;
    const pct=Math.abs((precioNuevo-costoActual)/costoActual*100);
    return pct>(config?.alertaVariacionCompra||30);
  };

  const marcarComprado=(key,precio,bodegaCompra)=>{
    const item=lista.find(i=>(i.productoId||i.nombre)===key);
    const prod=productos.find(p=>p.id===item?.productoId||p.nombre===item?.nombre);
    const qty=getStockFaltante(item);
    const precioReal=Number(precio)||prod?.costo||0;

    if(alertaVariacion(prod?.costo,precioReal)){
      const variacion=Math.round(Math.abs((precioReal-(prod?.costo||0))/(prod?.costo||1)*100));
      const ok=window.confirm(`⚠ Variación de precio alta: ${variacion}% respecto al costo registrado (${fmt(prod?.costo||0)}).\n\nPrecio ingresado: ${fmt(precioReal)}\n\n¿Confirmar de todos modos?`);
      if(!ok) return;
    }

    setCompradas(prev=>({...prev,[key]:true}));
    const entrada={id:uid(),key,ts:nowISO(),fecha:today(),precio:precioReal,qty,producto:item?.nombre||key,usuario:perfil?.nombre||"",cotizaciones:[...new Set(item?.cotizaciones||[])]};
    setHistorial(prev=>[entrada,...prev]);

    if(prod){
      const costoCPP=calcCPP(prod.stock||0,prod.costo||0,qty,precioReal);
      const nuevaHist=[...(prod.historialCostos||[]),{fecha:today(),costo:precioReal,cantidad:qty,usuario:perfil?.nombre||"",cpp:costoCPP}];
      setProductos(prev=>prev.map(p=>p.id!==prod.id?p:{...p,costo:costoCPP,stock:(p.stock||0)+qty,historialCostos:nuevaHist,updatedAt:nowISO()}));
      toast(`Comprado: +${fmtN(qty)} uds · Costo CPP: ${fmt(costoCPP)}`);
    // Register inventory movement
    if(setMovimientos) setMovimientos(prev=>[...prev,{
      id:uid(),ts:nowISO(),fecha:today(),tipo:"entrada",
      productoId:prod.id,nombreProducto:prod.nombre,
      cantidad:qty,stockAntes:prod.stock||0,stockDespues:(prod.stock||0)+qty,
      referencia:[...new Set(item?.cotizaciones||[])].join(", ")||"Compra",
      motivo:"Compra",bodegaDestino:prod.ubicacion||"",bodegaOrigen:"",
      usuario:perfil?.nombre||""
    }]);
    }
  };

  const deshacer=(key)=>{
    const h=historial.find(x=>x.key===key);
    if(!h) return;
    const prod=productos.find(p=>p.id===key||p.nombre===lista.find(i=>(i.productoId||i.nombre)===key)?.nombre);
    if(prod) {
      const bodegaDest=h.bodegaDest||(prod.stockPorBodega&&prod.stockPorBodega[0]?.bodega)||"";
      const spbNew=(prod.stockPorBodega||[]).map(b=>b.bodega===bodegaDest?{...b,cantidad:Math.max(0,(b.cantidad||0)-h.qty)}:b);
      const stockTotal=spbNew.reduce((a,b)=>a+(b.cantidad||0),0);
      setProductos(prev=>prev.map(p=>p.id!==prod.id?p:{...p,stockPorBodega:spbNew,stock:stockTotal,historialCostos:(p.historialCostos||[]).slice(0,-1)}));
    }
    setCompradas(prev=>{const n={...prev};delete n[key];return n;});
    setHistorial(prev=>prev.filter(x=>x.key!==key));
    toast("Compra deshecha","warning");
  };

  const histFiltrado=filtrarPorPeriodo(historial,periodo,"fecha");

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div><h1 style={{fontSize:22,fontWeight:700,marginBottom:2}}>Compras</h1><p style={{color:"#64748b",fontSize:13,margin:0}}>{pendientes.length} cotizaciones en proceso</p></div>
        <div style={{display:"flex",gap:7}}>
          <Btn onClick={()=>setVerHistorial(v=>!v)} variant="ghost" size="sm">{verHistorial?"Ver lista":"Ver historial"}</Btn>
          <Btn onClick={()=>lista.length?window.print():null} variant="dark" size="sm" disabled={!lista.length}><span style={{display:"flex",alignItems:"center",gap:4}}>{Ic.print} Imprimir</span></Btn>
        </div>
      </div>
      <style>{`@media print{body *{visibility:hidden}.print-table,.print-table *{visibility:visible}.print-table{position:fixed;top:0;left:0;width:100%;padding:20px}}`}</style>

      {verHistorial?(
        <div>
          <div style={{marginBottom:12}}><PeriodoChips periodo={periodo} setPeriodo={setPeriodo}/></div>
          <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
            {!histFiltrado.length?<div style={{padding:32,textAlign:"center",color:"#94a3b8"}}>Sin historial en este período</div>:(
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>{["Fecha/Hora","Producto","Cant.","Precio compra","Usuario","Cotizaciones"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,color:"#64748b",fontWeight:600}}>{h}</th>)}</tr></thead>
                <tbody>{histFiltrado.map((h,i)=>(
                  <tr key={h.id} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"#fff":"#f8fafc"}}>
                    <td style={{padding:"8px 12px",fontSize:11,color:"#64748b"}}>{fmtDateTime(h.ts)}</td>
                    <td style={{padding:"8px 12px",fontWeight:500}}>{h.producto}</td>
                    <td style={{padding:"8px 12px",color:"#1d4ed8",fontWeight:700}}>{fmtN(h.qty)}</td>
                    <td style={{padding:"8px 12px",fontWeight:700}}>{fmt(h.precio)}</td>
                    <td style={{padding:"8px 12px",color:"#64748b"}}>{h.usuario}</td>
                    <td style={{padding:"8px 12px",fontSize:11,color:"#64748b"}}>{h.cotizaciones.join(", ")}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>
      ):(
        !lista.length?(
          <div style={{background:"#fff",borderRadius:12,padding:36,textAlign:"center",color:"#94a3b8",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>Sin cotizaciones en "En compra"</div>
        ):(
          <div className="print-table" style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:560}}>
                <thead><tr style={{background:"#0f172a",color:"#fff"}}>
                  {["Producto","Proveedor","Stock actual","Faltante","Costo actual","Bodega destino","Precio compra","Total","Estado"].map(h=><th key={h} style={{padding:"9px 11px",textAlign:"left",fontSize:10,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {lista.map((item,i)=>{
                    const k=item.productoId||item.nombre;
                    const prod=productos.find(p=>p.id===item.productoId||p.nombre===item.nombre);
                    const stockFalt=getStockFaltante(item);
                    const ya=compradas[k];
                    const alerta=alertaVariacion(prod?.costo,precios[k]);
                    return (
                      <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:ya?"#f0fdf4":i%2===0?"#fff":"#f8fafc"}}>
                        <td style={{padding:"9px 11px"}}>
                          <div style={{fontWeight:500}}>{item.nombre}</div>
                          <div style={{fontSize:9,color:"#94a3b8",fontFamily:"'DM Mono',monospace"}}>{item.sku}</div>
                          {config?.mostrarCotizacionCompra&&<div style={{fontSize:9,color:"#64748b",marginTop:2}}>{[...new Set(item.cotizaciones)].join(", ")}</div>}
                        </td>
                        <td style={{padding:"9px 11px",color:"#64748b"}}>{item.proveedor||"—"}</td>
                        <td style={{padding:"9px 11px"}}><span style={{fontSize:11,fontWeight:500,color:(prod?.stock||0)<5?"#b91c1c":"#64748b"}}>{fmtN(prod?.stock||0)}</span></td>
                        <td style={{padding:"9px 11px",fontWeight:700,color:stockFalt>0?"#1d4ed8":"#15803d"}}>{stockFalt>0?fmtN(stockFalt):"✓ Suficiente"}</td>
                        <td style={{padding:"9px 11px",fontWeight:600}}>{fmt(prod?.costo||item.costo)}</td>
                      <td style={{padding:"9px 11px"}}>
                        <select value={bodegasCompra[k]||(prod?.stockPorBodega&&prod.stockPorBodega[0]?.bodega)||""}
                          onChange={e=>setBodegasCompra(prev=>({...prev,[k]:e.target.value}))}
                          disabled={ya} style={{padding:"3px 7px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,background:"#fff",maxWidth:110}}>
                          {bodegas.map(b=><option key={b}>{b}</option>)}
                        </select>
                      </td>
                        <td style={{padding:"9px 11px"}}>
                          <div>
                            <MilesInput value={precios[k]||""} onChange={v=>setPrecios(prev=>({...prev,[k]:v}))} placeholder={fmtMiles(prod?.costo||item.costo)} style={{width:90,padding:"3px 7px",fontSize:12}} disabled={ya}/>
                            {alerta&&<div style={{fontSize:9,color:"#b91c1c",marginTop:2,display:"flex",alignItems:"center",gap:2}}>{Ic.warn} Variación alta</div>}
                          </div>
                        </td>
                        <td style={{padding:"9px 11px",fontWeight:700}}>{fmt((precios[k]||prod?.costo||item.costo)*stockFalt)}</td>
                        <td style={{padding:"9px 11px"}}>
                          {ya?(
                            <div style={{display:"flex",gap:5,alignItems:"center"}}>
                              <span style={{background:"#dcfce7",color:"#15803d",padding:"2px 7px",borderRadius:20,fontSize:10,fontWeight:600}}>✓ Comprado</span>
                              <button onClick={()=>deshacer(k)} style={{background:"#f1f5f9",border:"none",borderRadius:5,padding:"2px 6px",cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",gap:2,color:"#64748b",transition:"all .12s"}}>{Ic.undo}</button>
                            </div>
                          ):(
                            <button onClick={()=>marcarComprado(k,precios[k],bodegasCompra[k])} disabled={stockFalt===0} style={{background:stockFalt===0?"#f1f5f9":"#1d4ed8",color:stockFalt===0?"#94a3b8":"#fff",border:"none",borderRadius:6,padding:"4px 10px",cursor:stockFalt===0?"default":"pointer",fontSize:11,fontWeight:600,transition:"all .12s"}}>
                              {stockFalt===0?"Sin faltante":"Comprar"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{background:"#eff6ff",fontWeight:700}}>
                    <td colSpan={6} style={{padding:"9px 11px",textAlign:"right",fontSize:13}}>Total estimado</td>
                    <td style={{padding:"9px 11px",fontSize:14,color:"#1d4ed8"}}>{fmt(lista.reduce((a,i)=>{const k=i.productoId||i.nombre;const falt=getStockFaltante(i);const prod=productos.find(p=>p.id===i.productoId||p.nombre===i.nombre);return a+(precios[k]||prod?.costo||i.costo)*falt;},0))}</td>
                    <td/>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ── GASTOS ────────────────────────────────────────────────────
function ModuloGastos({gastos,setGastos,adjFact,perfil,isAdmin=false,umbrales={}}) {
  const [form,setForm]=useState({descripcion:"",categoria:"Transporte",monto:"",fecha:today(),declaradoPor:perfil?.nombre||"",boletaUrl:""});
  const [periodo,setPeriodo]=useState("mes");
  const sf=(k,v)=>setForm(f=>({...f,[k]:v}));
  const gastosF=filtrarPorPeriodo(gastos,periodo);
  const totalG=gastosF.reduce((a,g)=>a+(g.monto||0),0);
  const ventasMB=filtrarPorPeriodo(adjFact,periodo).reduce((a,c)=>a+(c.total||0)-(c.costoTotal||0),0);
  const agregar=()=>{
    if(!form.descripcion.trim()||!form.monto){toast("Completa descripción y monto","warning");return;}
    setGastos(prev=>[...prev,{...form,id:uid(),monto:Number(form.monto),declaradoPor:perfil?.nombre||form.declaradoPor}]);
    sf("descripcion","");sf("monto","");sf("boletaUrl","");
    toast("Gasto registrado");
  };
  const porCat=CATEGORIAS_GASTO.map(cat=>({cat,total:gastosF.filter(g=>g.categoria===cat).reduce((a,g)=>a+(g.monto||0),0)})).filter(x=>x.total>0);
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:4}}>Gastos</h1>
      <p style={{color:"#64748b",fontSize:13,marginBottom:14}}>Gastos operacionales para calcular margen neto</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:11,marginBottom:16}}>
        {[{l:"Margen bruto",v:fmt(ventasMB),c:"#10b981"},{l:"Total gastos",v:fmt(totalG),c:"#ef4444"},{l:"Margen neto",v:fmt(ventasMB-totalG),c:ventasMB-totalG>=0?"#6366f1":"#ef4444"}].map((k,i)=>(
          <div key={i} style={{background:"#fff",borderRadius:12,padding:"13px 15px",boxShadow:"0 1px 3px rgba(0,0,0,.06)",borderTop:`3px solid ${k.c}`}}>
            <div style={{color:"#64748b",fontSize:11,marginBottom:3}}>{k.l}</div>
            <div style={{fontSize:18,fontWeight:700,color:k.c}}>{k.v}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:14}}>
        <div style={{background:"#fff",borderRadius:12,padding:"17px",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:13}}>Registrar gasto</div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:3}}>Descripción *</label><input value={form.descripcion} onChange={e=>sf("descripcion",e.target.value)} style={{width:"100%",padding:"7px 11px",borderRadius:7,border:"1px solid #e2e8f0",fontSize:13,boxSizing:"border-box",outline:"none"}}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:3}}>Categoría</label>
                <select value={form.categoria} onChange={e=>sf("categoria",e.target.value)} style={{width:"100%",padding:"7px 11px",borderRadius:7,border:"1px solid #e2e8f0",fontSize:13,background:"#fff"}}>
                  {CATEGORIAS_GASTO.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:3}}>Monto con IVA ($) *</label><MilesInput value={form.monto} onChange={v=>sf("monto",v)} placeholder="0"/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:3}}>Fecha</label><input type="date" value={form.fecha} onChange={e=>sf("fecha",e.target.value)} style={{width:"100%",padding:"7px 11px",borderRadius:7,border:"1px solid #e2e8f0",fontSize:13,boxSizing:"border-box"}}/></div>
              <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:3}}>Declarado por</label><input value={perfil?.nombre||""} disabled style={{width:"100%",padding:"7px 11px",borderRadius:7,border:"1px solid #e2e8f0",fontSize:13,boxSizing:"border-box",background:"#f8fafc",color:"#64748b"}}/></div>
            </div>
            <div><label style={{fontSize:11,color:"#64748b",display:"block",marginBottom:3}}>URL Boleta/Factura</label><input value={form.boletaUrl} onChange={e=>sf("boletaUrl",e.target.value)} placeholder="https://…" style={{width:"100%",padding:"7px 11px",borderRadius:7,border:"1px solid #e2e8f0",fontSize:13,boxSizing:"border-box",outline:"none"}}/></div>
            <Btn onClick={agregar}>+ Agregar gasto</Btn>
          </div>
        </div>
        <div style={{background:"#fff",borderRadius:12,padding:"17px",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11,flexWrap:"wrap",gap:8}}>
            <div style={{fontWeight:600,fontSize:14}}>Registrados</div>
            <PeriodoChips periodo={periodo} setPeriodo={setPeriodo}/>
          </div>
          {porCat.length>0&&<div style={{marginBottom:10}}>{porCat.map(({cat,total})=>(
            <div key={cat} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #f8fafc",fontSize:12}}>
              <span style={{color:"#475569"}}>{cat}</span><span style={{fontWeight:600}}>{fmt(total)}</span>
            </div>
          ))}</div>}
          <div style={{maxHeight:280,overflowY:"auto"}}>
            {!gastosF.length&&<div style={{color:"#94a3b8",fontSize:13,padding:"8px 0"}}>Sin gastos en este período</div>}
            {[...gastosF].reverse().map(g=>(
              <div key={g.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #f9fafb"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:500}}>{g.descripcion}</div>
                  <div style={{fontSize:10,color:"#94a3b8"}}>{fmtFecha(g.fecha)} · {g.categoria} · {g.declaradoPor}</div>
                  {g.boletaUrl&&<a href={g.boletaUrl} target="_blank" rel="noreferrer" style={{fontSize:9,color:"#1d4ed8",textDecoration:"none"}}>🔗 Ver boleta</a>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontWeight:700,fontSize:13,color:"#ef4444"}}>{fmt(g.monto)}</span>
                  {isAdmin ? <button onClick={()=>setGastos(prev=>prev.filter(x=>x.id!==g.id))} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:14,transition:"color .12s"}} title="Solo admin">×</button> : <span style={{fontSize:10,color:"#cbd5e1",padding:"0 4px"}} title="Solo admin puede eliminar">🔒</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── RENTABILIDAD ──────────────────────────────────────────────
function ModuloRentabilidad({adjFact,mesRent,setMesRent,gastos,umbrales={}}) {
  const filtMes=(arr,m)=>m===null?arr:arr.filter(c=>parseInt((c.fecha||"").slice(5,7))===m+1);
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div><h1 style={{fontSize:22,fontWeight:700,marginBottom:2}}>Rentabilidad</h1><p style={{color:"#64748b",fontSize:13,margin:0}}>Con gastos operacionales incluidos</p></div>
        <select value={mesRent??""} onChange={e=>setMesRent(e.target.value===""?null:parseInt(e.target.value))} style={{padding:"7px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,background:"#fff"}}>
          <option value="">Todo el año</option>
          {MESES_FULL.map((m,i)=><option key={i} value={i}>{m}</option>)}
        </select>
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:"17px",boxShadow:"0 1px 3px rgba(0,0,0,.06)",marginBottom:13}}>
        <div style={{fontWeight:600,fontSize:14,marginBottom:11}}>Por cotización {mesRent!==null?`— ${MESES_FULL[mesRent]}`:""}</div>
        {!filtMes(adjFact,mesRent).length&&<div style={{color:"#94a3b8",fontSize:13}}>Sin datos</div>}
        {filtMes(adjFact,mesRent).map(c=>{
          const util=(c.total||0)-(c.costoTotal||0);const mg3=c.margenProm||0;
          return (<div key={c.id} style={{display:"flex",alignItems:"center",gap:11,padding:"9px 0",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:90}}><div style={{fontWeight:500,fontSize:13}}>{c.organismo}</div><div style={{color:"#94a3b8",fontSize:10,fontFamily:"'DM Mono',monospace"}}>{c.numero}</div></div>
            <div style={{textAlign:"right",minWidth:80}}><div style={{fontSize:10,color:"#64748b"}}>Venta</div><div style={{fontWeight:700,fontSize:13}}>{fmt(c.total||0)}</div></div>
            <div style={{textAlign:"right",minWidth:80}}><div style={{fontSize:10,color:"#64748b"}}>Util. bruta</div><div style={{fontWeight:700,fontSize:13,color:"#10b981"}}>{fmt(util)}</div></div>
            <MargenBadge pct={mg3} monto={calcUtilidad(c.total,c.costoTotal)} umbrales={umbrales} size="md"/>
          </div>);
        })}
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:"17px",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
        <div style={{fontWeight:600,fontSize:14,marginBottom:11}}>Resumen mensual</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:440}}>
            <thead><tr style={{borderBottom:"2px solid #f1f5f9"}}>{["Mes","Cots.","Venta","Costo","Util. bruta","Gastos","Util. neta","Margen"].map(h=><th key={h} style={{padding:"6px 9px",textAlign:"left",fontSize:10,color:"#64748b",fontWeight:600}}>{h}</th>)}</tr></thead>
            <tbody>{MESES_FULL.map((m,i)=>{
              const cs=adjFact.filter(c=>parseInt((c.fecha||"").slice(5,7))===i+1);
              const vn=cs.reduce((a,c)=>a+(c.total||0),0);const cn=cs.reduce((a,c)=>a+(c.costoTotal||0),0);
              const ub=vn-cn;const gm=gastos.filter(g=>parseInt((g.fecha||"").slice(5,7))===i+1).reduce((a,g)=>a+(g.monto||0),0);
              const un=ub-gm;const mn=vn>0?(un/vn*100):0;const isSel=mesRent===i;
              return (<tr key={m} onClick={()=>setMesRent(isSel?null:i)} style={{borderBottom:"1px solid #f1f5f9",cursor:"pointer",background:isSel?"#f0f9ff":"transparent"}}>
                <td style={{padding:"7px 9px",fontWeight:isSel?600:500,color:isSel?"#1d4ed8":"inherit"}}>{m}</td>
                <td style={{padding:"7px 9px",color:"#64748b"}}>{cs.length||"—"}</td>
                <td style={{padding:"7px 9px",fontWeight:600}}>{vn>0?fmt(vn):"—"}</td>
                <td style={{padding:"7px 9px",color:"#64748b"}}>{cn>0?fmt(cn):"—"}</td>
                <td style={{padding:"7px 9px",color:"#10b981",fontWeight:600}}>{ub>0?fmt(ub):"—"}</td>
                <td style={{padding:"7px 9px",color:"#ef4444"}}>{gm>0?fmt(gm):"—"}</td>
                <td style={{padding:"7px 9px",color:un>=0?"#6366f1":"#ef4444",fontWeight:600}}>{vn>0?fmt(un):"—"}</td>
                <td style={{padding:"7px 9px"}}>{mn!==0?<MargenBadge pct={mn} umbrales={umbrales}/>:"—"}</td>
              </tr>);
            })}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── CONFIG ────────────────────────────────────────────────────
function ModuloConfig({proveedores,setProv,empresas,setEmpresas,bodegas,setBodegas,config,setConfigKey,cots,usuarios=[],setUsuarios,isAdmin=false}) {
  const [inputs,setInputs]=useState({prov:"",emp:"",bod:""});
  const si=(k,v)=>setInputs(p=>({...p,[k]:v}));
  const addItem=(items,setItems,val,k)=>{
    if(!val.trim()||items.includes(val.trim())){toast("Ya existe o vacío","warning");return;}
    setItems(prev=>[...prev,val.trim()]);si(k,"");toast("Agregado");
  };
  const delItem=(items,setItems,item,tipo)=>{
    const enUso=tipo==="prov"?cots.some(c=>(c.items||[]).some(i=>i.proveedor===item))
      :tipo==="emp"?cots.some(c=>c.organismo===item):false;
    if(enUso){toast(`"${item}" tiene cotizaciones — no se puede eliminar`,"warning");return;}
    setItems(prev=>prev.filter(x=>x!==item));toast("Eliminado");
  };
  const Toggle=({label,sub,k})=>(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #f1f5f9"}}>
      <div><div style={{fontSize:13,fontWeight:500}}>{label}</div>{sub&&<div style={{fontSize:11,color:"#64748b"}}>{sub}</div>}</div>
      <button onClick={()=>setConfigKey(k,!config[k])} style={{background:config[k]?"#1d4ed8":"#e2e8f0",border:"none",borderRadius:20,width:44,height:24,cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
        <span style={{position:"absolute",top:2,left:config[k]?20:2,width:20,height:20,background:"#fff",borderRadius:"50%",transition:"left .2s"}}/>
      </button>
    </div>
  );
  const MaestroSec=({title,items,setItems,k,tipo})=>(
    <div style={{background:"#fff",borderRadius:12,padding:"16px",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
      <div style={{fontWeight:600,fontSize:14,marginBottom:10}}>{title} <span style={{color:"#94a3b8",fontWeight:400,fontSize:12}}>({items.length})</span></div>
      <div style={{display:"flex",gap:5,marginBottom:8}}>
        <input value={inputs[k]||""} onChange={e=>si(k,e.target.value)} placeholder="Nuevo…" style={{flex:1,padding:"6px 10px",borderRadius:7,border:"1px solid #e2e8f0",fontSize:13,outline:"none"}}
          onKeyDown={e=>{if(e.key==="Enter")addItem(items,setItems,inputs[k]||"",k);}}/>
        <Btn onClick={()=>addItem(items,setItems,inputs[k]||"",k)} size="sm">+</Btn>
      </div>
      <div style={{maxHeight:200,overflowY:"auto"}}>
        {items.map((item,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 7px",background:i%2===0?"#f8fafc":"#fff",borderRadius:6,marginBottom:2}}>
            <span style={{fontSize:13}}>{item}</span>
            <button onClick={()=>delItem(items,setItems,item,tipo)} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:16,padding:"0 4px",transition:"color .12s"}}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:4}}>Configuración</h1>
      <p style={{color:"#64748b",fontSize:13,marginBottom:14}}>Maestros y preferencias · <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#94a3b8"}}>{BUILD_VERSION}</span></p>
      <div style={{background:"#fff",borderRadius:12,padding:"16px",boxShadow:"0 1px 3px rgba(0,0,0,.06)",marginBottom:13}}>
        <div style={{fontWeight:600,fontSize:14,marginBottom:10}}>Preferencias</div>
        <Toggle label="Mostrar margen por línea en cotizaciones" k="mostrarMargenLinea"/>
        <Toggle label="Mostrar cotización en lista de compras" sub="Ver a qué cotización aplica cada compra" k="mostrarCotizacionCompra"/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #f1f5f9"}}>
          <div><div style={{fontSize:13,fontWeight:500}}>Días de alerta antes de vencimiento</div></div>
          <input type="number" value={config.diasAlertaVenc||3} min={1} max={14} onChange={e=>setConfigKey("diasAlertaVenc",Number(e.target.value))} style={{width:60,padding:"5px 8px",borderRadius:7,border:"1px solid #e2e8f0",fontSize:13,textAlign:"center"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0"}}>
          <div>
            <div style={{fontSize:13,fontWeight:500}}>Stock mínimo para alerta</div>
            <div style={{fontSize:11,color:"#64748b"}}>Bajo este número el producto aparece como "Stock bajo"</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <input type="number" value={config.stockMinimo||5} min={1} max={999} onChange={e=>setConfigKey("stockMinimo",Number(e.target.value))} style={{width:70,padding:"5px 8px",borderRadius:7,border:"1px solid #e2e8f0",fontSize:13,textAlign:"center"}}/>
            <span style={{fontSize:12,color:"#64748b"}}>uds.</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0"}}>
          <div><div style={{fontSize:13,fontWeight:500}}>Alerta variación precio compra (%)</div><div style={{fontSize:11,color:"#64748b"}}>Avisa cuando el precio nuevo difiere más que este %</div></div>
          <input type="number" value={config.alertaVariacionCompra||30} min={5} max={200} onChange={e=>setConfigKey("alertaVariacionCompra",Number(e.target.value))} style={{width:60,padding:"5px 8px",borderRadius:7,border:"1px solid #e2e8f0",fontSize:13,textAlign:"center"}}/>
        </div>
      </div>
      {/* Umbrales de rentabilidad */}
      <div style={{background:"#fff",borderRadius:12,padding:"16px",boxShadow:"0 1px 3px rgba(0,0,0,.06)",marginBottom:13}}>
        <div style={{fontWeight:600,fontSize:14,marginBottom:11}}>Umbrales de rentabilidad</div>
        <div style={{fontSize:12,color:"#64748b",marginBottom:10}}>Define los colores de los indicadores de margen en toda la app</div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          {[{label:"Verde (bueno) ≥",k:"umbralVerde",color:"#15803d",bg:"#dcfce7"},{label:"Amarillo (aceptable) ≥",k:"umbralAmarillo",color:"#854d0e",bg:"#fef9c3"}].map(u=>(
            <div key={u.k} style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{background:u.bg,color:u.color,padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600}}>{u.label}</span>
              <input type="number" value={config[u.k]||30} min={0} max={100} onChange={e=>setConfigKey(u.k,Number(e.target.value))}
                style={{width:64,padding:"5px 8px",borderRadius:7,border:"1px solid #e2e8f0",fontSize:13,textAlign:"center"}}/>
              <span style={{fontSize:12,color:"#64748b"}}>%</span>
            </div>
          ))}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{background:"#fee2e2",color:"#b91c1c",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600}}>Rojo (malo) &lt;</span>
            <span style={{fontSize:12,color:"#64748b"}}>{config.umbralAmarillo||15}%</span>
          </div>
        </div>
      </div>

      {/* Gestión de usuarios */}
      <div style={{background:"#fff",borderRadius:12,padding:"16px",boxShadow:"0 1px 3px rgba(0,0,0,.06)",marginBottom:13}}>
        <div style={{fontWeight:600,fontSize:14,marginBottom:11}}>Usuarios del sistema</div>
        {!isAdmin && <div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#92400e",marginBottom:10}}>🔒 Solo administradores pueden gestionar usuarios</div>}
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
              {["Nombre","Cargo","Email","Rol",""].map(h=><th key={h} style={{padding:"7px 10px",textAlign:"left",fontSize:11,color:"#64748b",fontWeight:600}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {usuarios.map((u,i)=>(
                <tr key={u.id} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"#fff":"#f8fafc"}}>
                  <td style={{padding:"7px 10px",fontWeight:500}}>{u.nombre}</td>
                  <td style={{padding:"7px 10px",color:"#64748b"}}>{u.cargo}</td>
                  <td style={{padding:"7px 10px",color:"#64748b",fontSize:11}}>{u.email}</td>
                  <td style={{padding:"7px 10px"}}>
                    {isAdmin ? (
                      <select value={u.rol} onChange={e=>{if(setUsuarios)setUsuarios(prev=>prev.map(x=>x.id===u.id?{...x,rol:e.target.value}:x));toast("Rol actualizado");}}
                        style={{padding:"3px 8px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:12,background:"#fff",cursor:"pointer"}}>
                        <option value="admin">Admin</option>
                        <option value="ejecutivo">Ejecutivo</option>
                      </select>
                    ) : (
                      <span style={{background:u.rol==="admin"?"#dbeafe":"#f1f5f9",color:u.rol==="admin"?"#1d4ed8":"#475569",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:500}}>{u.rol}</span>
                    )}
                  </td>
                  <td style={{padding:"7px 10px"}}>
                    {isAdmin && usuarios.length>1 && <button onClick={()=>{if(window.confirm(`¿Eliminar a "${u.nombre}"? Esta acción no se puede deshacer.`)){if(setUsuarios)setUsuarios(prev=>prev.filter(x=>x.id!==u.id));toast("Usuario eliminado");}}} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:14}}>×</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isAdmin && (
          <button onClick={()=>{if(setUsuarios)setUsuarios(prev=>[...prev,{id:uid(),nombre:"Nuevo usuario",cargo:"Ejecutivo",email:"",rol:"ejecutivo"}]);toast("Usuario agregado — edita los datos en Mi perfil");}} style={{marginTop:10,background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:7,padding:"6px 14px",cursor:"pointer",fontSize:12,color:"#1d4ed8",fontWeight:500}}>+ Agregar usuario</button>
        )}
      </div>

      <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:20}}>🏭</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:600,fontSize:13,color:"#1d4ed8"}}>Proveedores, Organismos y Bodegas</div>
          <div style={{fontSize:12,color:"#64748b",marginTop:1}}>La gestión de maestros se ha movido a su propia sección en el menú</div>
        </div>
      </div>
    </div>
  );
}

// ── PERFIL ────────────────────────────────────────────────────
function ModuloPerfil({perfil,setPerfil}) {
  const [edit,setEdit]=useState(false);
  const [form,setForm]=useState({...perfil});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const inp={width:"100%",padding:"8px 11px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,boxSizing:"border-box",outline:"none"};
  return (
    <div style={{maxWidth:480}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h1 style={{fontSize:22,fontWeight:700,margin:0}}>Mi perfil</h1>
        {!edit&&<Btn onClick={()=>setEdit(true)}>Editar</Btn>}
      </div>
      <div style={{background:"#fff",borderRadius:14,padding:"22px",boxShadow:"0 1px 4px rgba(0,0,0,.07)"}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18,paddingBottom:14,borderBottom:"1px solid #f1f5f9"}}>
          <div style={{width:64,height:64,borderRadius:"50%",background:"#e0e7ff",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:"#6366f1"}}>
            {(edit?form:perfil).foto?<img src={(edit?form:perfil).foto} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span>{(edit?form:perfil).nombre?.charAt(0)||"?"}</span>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:17,color:"#0f172a"}}>{(edit?form:perfil).nombre||"—"}</div>
            <div style={{fontSize:13,color:"#64748b",marginTop:1}}>{(edit?form:perfil).cargo||"—"}</div>
            {edit&&<label style={{display:"inline-block",marginTop:6,background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:7,padding:"4px 11px",cursor:"pointer",fontSize:12,color:"#475569"}}>Foto<input type="file" accept="image/*" onChange={e=>{const f=e.target.files[0];if(f)set("foto",URL.createObjectURL(f));}} style={{display:"none"}}/></label>}
          </div>
        </div>
        {edit?(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[{label:"Nombre completo",k:"nombre"},{label:"Cargo",k:"cargo"},{label:"Teléfono",k:"telefono"},{label:"Email",k:"email"}].map(f=>(
              <div key={f.k}><label style={{fontSize:11,color:"#64748b",fontWeight:500,display:"block",marginBottom:3}}>{f.label}</label><input value={form[f.k]||""} onChange={e=>set(f.k,e.target.value)} style={inp}/></div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <Btn onClick={()=>{setPerfil(form);setEdit(false);toast("Perfil guardado");}}>Guardar</Btn>
              <Btn onClick={()=>{setForm({...perfil});setEdit(false);}} variant="ghost">Cancelar</Btn>
            </div>
          </div>
        ):(
          <div>{[{label:"Teléfono",val:perfil.telefono},{label:"Email",val:perfil.email}].map(r=>(
            <div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f1f5f9"}}>
              <span style={{fontSize:13,color:"#64748b"}}>{r.label}</span><span style={{fontSize:13,fontWeight:500}}>{r.val||"—"}</span>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}

// ── MODAL PRODUCTO ────────────────────────────────────────────
function ModalProducto({producto,proveedores,bodegas,onSave,onDelete,onClose,perfil}) {
  const [form,setForm]=useState({
    id:producto.id||"",sku:producto.sku||"",nombre:producto.nombre||"",proveedor:producto.proveedor||"",
    costo:Number(producto.costo)||0,margen:Number(producto.margen)||30,foto_url:producto.foto_url||"",
    stockPorBodega:producto.stockPorBodega||[{bodega:bodegas[0]||"",cantidad:producto.stock||0}],
    historialCostos:producto.historialCostos||[],
  });
  const [dirty,setDirty]=useState(false);
  const [confirmDel,setConfirmDel]=useState(false);
  const [pvFocus,setPvFocus]=useState(false);
  const [pvRaw,setPvRaw]=useState("");

  const set=(k,v)=>{setForm(f=>({...f,[k]:v}));setDirty(true);};
  const pv=form.costo>0?calcPrecioVenta(form.costo,form.margen):0;
  const margenNeg=Number(form.margen)<0;

  const handleFoto=e=>{const file=e.target.files[0];if(!file)return;set("foto_url",URL.createObjectURL(file));};
  const handlePVFocus=()=>{setPvFocus(true);setPvRaw(pv>0?String(pv):"");};
  const handlePVChange=e=>{
    const raw=e.target.value.replace(/[^0-9]/g,"");
    setPvRaw(raw);
    const num=parseInt(raw)||0;
    if(form.costo>0&&num>0) set("margen",parseFloat(calcMargenDesde(form.costo,num).toFixed(2)));
  };
  const handlePVBlur=()=>{setPvFocus(false);setPvRaw("");};

  // Enter saves, Escape closes
  useEffect(()=>{
    const h=e=>{
      if(e.key==="Enter"&&!e.shiftKey&&e.target.tagName!=="TEXTAREA"){e.preventDefault();handleSave();}
    };
    document.addEventListener("keydown",h);
    return()=>document.removeEventListener("keydown",h);
  },[form]);

  const handleClose=()=>{if(dirty){if(window.confirm("¿Cerrar sin guardar?"))onClose();}else onClose();};
  const handleSave=()=>{
    if(!form.nombre.trim()){toast("El nombre es obligatorio","warning");return;}
    const spb=(form.stockPorBodega||[]).filter(b=>b.bodega);
    onSave({...form,costo:Number(form.costo)||0,margen:Number(form.margen)||0,stockPorBodega:spb,stock:spb.reduce((a,b)=>a+(b.cantidad||0),0)});
  };
  const inp={width:"100%",padding:"8px 11px",borderRadius:7,border:"1px solid #e2e8f0",fontSize:13,boxSizing:"border-box",outline:"none"};
  return (
    <Modal onClose={handleClose} maxWidth={470}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h2 style={{fontSize:16,fontWeight:700,margin:0}}>{form.id?"Editar producto":"Nuevo producto"}</h2>
        <CloseBtn onClose={handleClose}/>
      </div>
      <div style={{marginBottom:13,display:"flex",gap:12,alignItems:"center"}}>
        <div style={{width:72,height:72,borderRadius:10,background:"#f8fafc",border:"2px dashed #e2e8f0",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {form.foto_url?<img src={form.foto_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center"}}/>:<span style={{fontSize:26,color:"#cbd5e1"}}>📷</span>}
        </div>
        <div>
          <label style={{display:"inline-block",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:7,padding:"5px 11px",cursor:"pointer",fontSize:12,color:"#475569",fontWeight:500}}>
            {form.foto_url?"Cambiar foto":"Subir foto"}<input type="file" accept="image/*" onChange={handleFoto} style={{display:"none"}}/>
          </label>
          {form.foto_url&&<button onClick={()=>set("foto_url","")} style={{display:"block",marginTop:3,background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:11}}>Quitar</button>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
        <div style={{gridColumn:"1/-1"}}><label style={{fontSize:11,color:"#64748b",fontWeight:500,display:"block",marginBottom:3}}>Nombre *</label><input value={form.nombre} onChange={e=>set("nombre",e.target.value)} style={inp}/></div>
        <div><label style={{fontSize:11,color:"#64748b",fontWeight:500,display:"block",marginBottom:3}}>SKU</label><input value={form.sku} onChange={e=>set("sku",e.target.value)} style={inp}/></div>
        <div><label style={{fontSize:11,color:"#64748b",fontWeight:500,display:"block",marginBottom:3}}>Proveedor</label><Combobox value={form.proveedor} onChange={v=>set("proveedor",v)} options={proveedores} placeholder="Buscar o crear…"/></div>
        <div><label style={{fontSize:11,color:"#64748b",fontWeight:500,display:"block",marginBottom:3}}>Costo neto ($)</label><MilesInput value={form.costo} onChange={v=>set("costo",v)}/></div>
        <div><label style={{fontSize:11,color:"#64748b",fontWeight:500,display:"block",marginBottom:3}}>Margen (%)</label>
          <input type="number" value={form.margen} onChange={e=>set("margen",e.target.value)} style={{...inp,borderColor:margenNeg?"#ef4444":"#e2e8f0",background:margenNeg?"#fff5f5":"#fff"}}/>
        </div>
      </div>
      {/* Stock por bodega */}
      <div style={{marginTop:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <label style={{fontSize:11,color:"#64748b",fontWeight:600}}>STOCK POR BODEGA</label>
          <span style={{fontSize:12,color:"#64748b"}}>Total: <strong>{fmtN((form.stockPorBodega||[]).reduce((a,b)=>a+(b.cantidad||0),0))}</strong> uds</span>
        </div>
        <div style={{border:"1px solid #e2e8f0",borderRadius:8,overflow:"hidden"}}>
          {(form.stockPorBodega||[]).map((sb,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 11px",borderBottom:i<(form.stockPorBodega||[]).length-1?"1px solid #f1f5f9":"none",background:i%2===0?"#fff":"#f8fafc"}}>
              <select value={sb.bodega} onChange={e=>{const spb=[...(form.stockPorBodega||[])];spb[i]={...spb[i],bodega:e.target.value};set("stockPorBodega",spb);}}
                style={{flex:1,padding:"5px 8px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:13,background:"#fff",cursor:"pointer"}}>
                <option value="">— Sin bodega —</option>
                {bodegas.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
              <MilesInput value={sb.cantidad} onChange={v=>{const spb=[...form.stockPorBodega];spb[i]={...spb[i],cantidad:Number(v)||0};set("stockPorBodega",spb);}} style={{width:90}}/>
              <span style={{fontSize:11,color:"#94a3b8"}}>uds</span>
              <button onClick={()=>set("stockPorBodega",(form.stockPorBodega||[]).filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#cbd5e1",cursor:"pointer",fontSize:16,padding:2,transition:"color .12s"}}
                onMouseEnter={e=>e.currentTarget.style.color="#ef4444"} onMouseLeave={e=>e.currentTarget.style.color="#cbd5e1"}>×</button>
            </div>
          ))}
          <div style={{padding:"7px 11px",background:"#f8fafc"}}>
            <button onClick={()=>set("stockPorBodega",[...(form.stockPorBodega||[]),{bodega:bodegas[0]||"",cantidad:0}])}
              style={{background:"none",border:"none",color:"#1d4ed8",cursor:"pointer",fontSize:12,fontWeight:500,display:"flex",alignItems:"center",gap:4,padding:0}}>
              <span style={{fontSize:16,lineHeight:1}}>+</span> Agregar bodega
            </button>
          </div>
        </div>
      </div>
      {/* Precio venta editable */}
      {form.costo>0&&(
        <div style={{marginTop:11,background:margenNeg?"#fff5f5":"#f0f9ff",border:`1px solid ${margenNeg?"#fca5a5":"#bae6fd"}`,borderRadius:10,padding:"11px 13px"}}>
          <div style={{fontSize:10,color:margenNeg?"#b91c1c":"#0369a1",fontWeight:600,marginBottom:5}}>{margenNeg?"⚠ Margen negativo":"Precio de venta (c/IVA) — editable"}</div>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{color:margenNeg?"#b91c1c":"#94a3b8",fontSize:14,fontWeight:500,flexShrink:0}}>$</span>
            <input type="text" inputMode="numeric"
              value={pvFocus?pvRaw:fmtMiles(pv)}
              onFocus={handlePVFocus} onChange={handlePVChange} onBlur={handlePVBlur}
              placeholder="0"
              style={{fontSize:20,fontWeight:700,color:margenNeg?"#b91c1c":"#1d4ed8",background:"transparent",border:"none",borderBottom:`2px solid ${margenNeg?"#ef4444":"#1d4ed8"}`,outline:"none",width:"100%",padding:"2px 0",fontFamily:"'DM Sans',sans-serif"}}/>
          </div>
          <div style={{fontSize:10,color:margenNeg?"#b91c1c":"#0369a1",marginTop:3}}>Edita el precio → margen se recalcula · Enter guarda</div>
        </div>
      )}
      {/* Historial costos CPP */}
      {form.historialCostos.length>0&&(
        <div style={{marginTop:10,background:"#f8fafc",borderRadius:8,padding:"8px 11px"}}>
          <div style={{fontSize:10,color:"#64748b",fontWeight:600,marginBottom:4}}>Historial CPP</div>
          {[...form.historialCostos].reverse().slice(0,4).map((h,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0",color:"#64748b"}}>
              <span>{fmtFecha(h.fecha)}</span><span>{fmtN(h.cantidad||0)} uds · {fmt(h.costo)}</span>
              {h.cpp&&<span style={{color:"#1d4ed8",fontWeight:500}}>CPP: {fmt(h.cpp)}</span>}
            </div>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:7,marginTop:14,justifyContent:"flex-end",flexWrap:"wrap"}}>
        {form.id&&!confirmDel&&<Btn onClick={()=>setConfirmDel(true)} variant="danger" size="sm">Eliminar</Btn>}
        {confirmDel&&<><span style={{fontSize:12,color:"#b91c1c",alignSelf:"center"}}>¿Seguro?</span><Btn onClick={()=>onDelete(form.id)} variant="danger" size="sm">Sí</Btn><Btn onClick={()=>setConfirmDel(false)} variant="ghost" size="sm">No</Btn></>}
        {!confirmDel&&<><Btn onClick={handleClose} variant="ghost" size="sm">Cancelar</Btn><Btn onClick={handleSave} size="sm">Guardar (Enter)</Btn></>}
      </div>
    </Modal>
  );
}

// ── MODAL COTIZACION (Odoo-style) ────────────────────────────
function ModalCotizacion({cotizacion,productos,empresas,config,onSave,onClose,logoB64,perfil}) {
  const [form,setForm]=useState({...cotizacion,ejecutivo:cotizacion.ejecutivo||perfil?.nombre||"",items:[...(cotizacion.items||[])]});
  const [showMargen,setShowMargen]=useState(config?.mostrarMargenLinea||false);
  const [searchIdx,setSearchIdx]=useState(null); // which row has the dropdown open
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const {subtotalNeto,iva,total,costoTotal,margenProm}=calcTotalesCot(form.items);

  // Add empty row for Odoo-style inline add
  const addEmptyRow=()=>{
    setSearchIdx("new");
  };

  const selectProductInRow=(idx,p)=>{
    const pv=calcPrecioVenta(p.costo,p.margen);
    if(idx==="new"){
      setForm(f=>({...f,items:[...f.items,{productoId:p.id,nombre:p.nombre,sku:p.sku,costo:p.costo,precioVenta:pv,cantidad:1,foto_url:p.foto_url||"",proveedor:p.proveedor||""}]}));
    } else {
      setForm(f=>{
        const items=[...f.items];
        items[idx]={...items[idx],productoId:p.id,nombre:p.nombre,sku:p.sku,costo:p.costo,precioVenta:pv,foto_url:p.foto_url||"",proveedor:p.proveedor||""};
        return{...f,items};
      });
    }
    setSearchIdx(null);
  };

  const removeItem=i=>setForm(f=>({...f,items:f.items.filter((_,j)=>j!==i)}));
  const updateItem=(i,k,v)=>{
    setForm(f=>{const items=[...f.items];items[i]={...items[i],[k]:v};return{...f,items};});
    if(k==="precioVenta") setShowMargen(true);
  };

  const handleSave=()=>{
    const realItems=form.items.filter(i=>i.nombre);
    if(!form.organismo?.trim()){toast("El organismo es obligatorio","warning");return;}
    onSave({...form,items:realItems,total,costoTotal,margenProm});
  };

  const inp={width:"100%",padding:"7px 10px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:13,boxSizing:"border-box",outline:"none"};

  // Full-screen overlay, not the small Modal wrapper
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"stretch",justifyContent:"center",zIndex:300,padding:"20px"}}
      onClick={e=>{if(e.target===e.currentTarget){if(form.items.length>0||form.organismo){if(window.confirm("¿Cerrar sin guardar los cambios?"))onClose();}else onClose();}}}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:1100,display:"flex",flexDirection:"column",boxShadow:"0 25px 60px rgba(0,0,0,.3)",overflow:"hidden"}}
        onClick={e=>e.stopPropagation()}>

        {/* ── Header fijo ─────────────────────────────── */}
        <div style={{padding:"16px 24px",borderBottom:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,background:"#fff"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:"#1d4ed8",fontWeight:700}}>{form.numero}</div>
            <EstadoBadge estado={form.estado||"Borrador"}/>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Btn onClick={()=>generarPDFCotizacion({...form,total,costoTotal,margenProm},logoB64)} variant="dark" size="sm">📄 PDF</Btn>
            <Btn onClick={handleSave}>Guardar</Btn>
            <CloseBtn onClose={onClose}/>
          </div>
        </div>

        {/* ── Cuerpo scrolleable ───────────────────────── */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>

          {/* Campos encabezado — 2 columnas */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px 20px",marginBottom:20}}>
            <div style={{gridColumn:"1/-1"}}>
              <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>ORGANISMO COMPRADOR *</label>
              <Combobox value={form.organismo||""} onChange={v=>set("organismo",v)} options={empresas} placeholder="Buscar o crear organismo…"/>
            </div>
            <div>
              <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>RUT CLIENTE</label>
              <input value={form.rut_cliente||""} onChange={e=>set("rut_cliente",formatRut(e.target.value))} placeholder="76.xxx.xxx-x" style={inp}/>
            </div>
            <div>
              <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>ID OPORTUNIDAD</label>
              <input value={form.oportunidad_id||""} onChange={e=>set("oportunidad_id",e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>EJECUTIVO</label>
              <input value={form.ejecutivo||""} onChange={e=>set("ejecutivo",e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>ESTADO</label>
              <select value={form.estado||"Borrador"} onChange={e=>set("estado",e.target.value)} style={{...inp,background:"#fff",cursor:"pointer"}}>
                {[...ESTADOS_COT,"Para revisar"].map(e=><option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>FECHA</label>
              <input type="date" value={form.fecha||""} onChange={e=>set("fecha",e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>VENCIMIENTO</label>
              <input type="date" value={form.fechaVencimiento||""} onChange={e=>set("fechaVencimiento",e.target.value)} style={inp}/>
            </div>
          </div>

          {/* ── Tabla de productos estilo Odoo ──────────── */}
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:12,fontWeight:700,color:"#0f172a",textTransform:"uppercase",letterSpacing:"0.5px"}}>Líneas de cotización</span>
              <button onClick={()=>setShowMargen(v=>!v)} style={{fontSize:11,color:showMargen?"#1d4ed8":"#94a3b8",background:"none",border:"none",cursor:"pointer",fontWeight:500}}>
                {showMargen?"▾ Ocultar margen":"▸ Mostrar margen"}
              </button>
            </div>

            <div style={{border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead>
                  <tr style={{background:"#f8fafc"}}>
                    <th style={{padding:"10px 12px",textAlign:"left",fontSize:11,color:"#64748b",fontWeight:700,width:36}}></th>
                    <th style={{padding:"10px 12px",textAlign:"left",fontSize:11,color:"#64748b",fontWeight:700}}>Producto</th>
                    <th style={{padding:"10px 12px",fontSize:11,color:"#64748b",fontWeight:700,width:70}}>Cant.</th>
                    <th style={{padding:"10px 12px",fontSize:11,color:"#64748b",fontWeight:700,width:120}}>Precio unit. (IVA)</th>
                    <th style={{padding:"10px 12px",fontSize:11,color:"#64748b",fontWeight:700,width:110}}>Subtotal neto</th>
                    {showMargen&&<th style={{padding:"10px 12px",fontSize:11,color:"#64748b",fontWeight:700,width:80}}>Margen</th>}
                    <th style={{width:36}}></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item,i)=>{
                    const mgL=item.precioVenta>0&&item.costo>0?((item.precioVenta/1.19-item.costo)/item.costo*100):0;
                    return (
                      <tr key={i} style={{borderTop:"1px solid #f1f5f9",background:"#fff"}}>
                        {/* Foto */}
                        <td style={{padding:"8px 10px",width:44}}>
                          {item.foto_url
                            ?<img src={item.foto_url} alt="" style={{width:30,height:30,objectFit:"cover",borderRadius:5,display:"block"}}/>
                            :<div style={{width:30,height:30,background:"#f1f5f9",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#94a3b8"}}>📦</div>
                          }
                        </td>
                        {/* Nombre del producto — clic abre buscador para reemplazar */}
                        <td style={{padding:"6px 10px",minWidth:200,position:"relative"}}>
                          {searchIdx===i ? (
                            <InlineProductSearch
                              productos={productos}
                              initialValue={item.nombre}
                              onSelect={p=>selectProductInRow(i,p)}
                              onClose={()=>setSearchIdx(null)}
                              autoFocus
                            />
                          ) : (
                            <div onClick={()=>setSearchIdx(i)} style={{cursor:"pointer",padding:"4px 6px",borderRadius:6,transition:"background .1s"}}
                              onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                              <div style={{fontWeight:500,fontSize:13}}>{item.nombre}</div>
                              {item.sku&&<div style={{fontSize:10,color:"#94a3b8",fontFamily:"'DM Mono',monospace"}}>{item.sku}</div>}
                            </div>
                          )}
                        </td>
                        {/* Cantidad */}
                        <td style={{padding:"6px 10px",width:80}}>
                          <input type="number" value={item.cantidad} min={1}
                            onChange={e=>updateItem(i,"cantidad",Number(e.target.value))}
                            style={{width:60,padding:"6px 8px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:13,textAlign:"center",outline:"none"}}/>
                        </td>
                        {/* Precio */}
                        <td style={{padding:"6px 10px",width:130}}>
                          <input type="number" value={item.precioVenta}
                            onChange={e=>updateItem(i,"precioVenta",Number(e.target.value))}
                            style={{width:110,padding:"6px 8px",borderRadius:6,border:"1px solid #e2e8f0",fontSize:13,outline:"none"}}/>
                        </td>
                        {/* Subtotal */}
                        <td style={{padding:"6px 10px",fontWeight:600,color:"#0f172a",width:120}}>
                          {item.precioVenta>0?fmt(Math.round(item.precioVenta/1.19)*item.cantidad):"—"}
                        </td>
                        {/* Margen */}
                        {showMargen&&<td style={{padding:"6px 10px",width:80}}>
                          <span style={{fontSize:11,fontWeight:600,color:mgL<0?"#b91c1c":mgL>=20?"#15803d":"#92400e"}}>{item.costo>0?fmtPct(mgL):"—"}</span>
                        </td>}
                        {/* Eliminar */}
                        <td style={{padding:"6px 8px",textAlign:"center",width:36}}>
                          <button onClick={()=>removeItem(i)} style={{background:"none",border:"none",color:"#cbd5e1",cursor:"pointer",fontSize:18,lineHeight:1,padding:2,borderRadius:4,transition:"color .12s"}}
                            onMouseEnter={e=>e.currentTarget.style.color="#ef4444"}
                            onMouseLeave={e=>e.currentTarget.style.color="#cbd5e1"}>×</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Botón agregar + buscador flotante — FUERA de la tabla */}
            <div style={{marginTop:0,borderTop:"1px solid #e2e8f0",background:"#f8fafc",borderRadius:"0 0 10px 10px",padding:"10px 12px",position:"relative"}}>
              {searchIdx==="new" ? (
                <InlineProductSearch
                  productos={productos}
                  initialValue=""
                  onSelect={p=>selectProductInRow("new",p)}
                  onClose={()=>setSearchIdx(null)}
                  autoFocus
                  placeholder="Buscar y seleccionar producto…"
                />
              ) : (
                <button onClick={addEmptyRow}
                  style={{background:"none",border:"none",color:"#1d4ed8",cursor:"pointer",fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:6,padding:0}}>
                  <span style={{fontSize:20,lineHeight:1,fontWeight:300}}>+</span> Agregar producto
                </button>
              )}
            </div>
          </div>

          {/* ── Totales + Notas ──────────────────────────── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:20,alignItems:"start"}}>
            <div>
              <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>NOTAS / CONDICIONES</label>
              <textarea value={form.notas||""} onChange={e=>set("notas",e.target.value)} rows={3}
                style={{width:"100%",padding:"8px 11px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,resize:"vertical",boxSizing:"border-box"}}/>
            </div>
            {total>0&&(
              <div style={{width:240,background:"#f8fafc",borderRadius:10,padding:"14px 16px",flexShrink:0}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13}}><span style={{color:"#64748b"}}>Importe base</span><span style={{fontWeight:500}}>{fmt(subtotalNeto)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13}}><span style={{color:"#64748b"}}>IVA 19%</span><span style={{fontWeight:500}}>{fmt(iva)}</span></div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:800,color:"#1d4ed8",borderTop:"2px solid #e2e8f0",paddingTop:8}}>
                  <span>Total</span><span>{fmt(total)}</span>
                </div>
                <div style={{marginTop:6,textAlign:"right"}}>
                  <MargenBadge pct={margenProm} monto={calcUtilidad(total,costoTotal)}/>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── INLINE PRODUCT SEARCH (para tabla Odoo) ───────────────────
function InlineProductSearch({productos,initialValue="",onSelect,onClose,autoFocus,placeholder}) {
  const [q,setQ]=useState(initialValue);
  const inputRef=useRef();
  const containerRef=useRef();

  useEffect(()=>{
    if(autoFocus&&inputRef.current) inputRef.current.focus();
  },[autoFocus]);

  // Close on Escape
  useEffect(()=>{
    const h=e=>{ if(e.key==="Escape") onClose?.(); };
    document.addEventListener("keydown",h);
    return()=>document.removeEventListener("keydown",h);
  },[onClose]);

  const filtered=productos.filter(p=>
    !q||p.nombre.toLowerCase().includes(q.toLowerCase())||(p.sku||"").toLowerCase().includes(q.toLowerCase())
  ).slice(0,8);

  return (
    <div ref={containerRef} style={{position:"relative"}}>
      <input
        ref={inputRef}
        value={q}
        onChange={e=>setQ(e.target.value)}
        onBlur={e=>{
          // Don't close if clicking inside the dropdown
          setTimeout(()=>{
            if(containerRef.current&&!containerRef.current.contains(document.activeElement)) onClose?.();
          },150);
        }}
        placeholder={placeholder||"Buscar producto…"}
        style={{width:"100%",padding:"7px 11px",borderRadius:7,border:"1.5px solid #1d4ed8",fontSize:13,outline:"none",background:"#eff6ff",boxSizing:"border-box"}}
      />
      {/* Dropdown — aparece debajo del input, con z-index alto */}
      {filtered.length>0&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,boxShadow:"0 12px 32px rgba(0,0,0,.16)",zIndex:9999,maxHeight:300,overflowY:"auto"}}>
          {filtered.map(p=>{
            const pv=calcPrecioVenta(p.costo,p.margen);
            return (
              <div key={p.id}
                onMouseDown={e=>{e.preventDefault();onSelect(p);}}
                style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #f8fafc"}}>
                <div style={{width:36,height:36,borderRadius:6,background:"#f8fafc",flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {p.foto_url?<img src={p.foto_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:18}}>📦</span>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.nombre}</div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>{p.sku&&`${p.sku} · `}{p.proveedor}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#1d4ed8"}}>{fmt(pv)}</div>
                  <div style={{fontSize:10,color:(p.stock||0)<5?"#ef4444":"#94a3b8"}}>Stock: {fmtN(p.stock||0)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {q&&filtered.length===0&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.12)",zIndex:9999,padding:"14px",fontSize:13,color:"#94a3b8",textAlign:"center"}}>
          Sin resultados para "{q}"
        </div>
      )}
    </div>
  );
}

// ── DETALLE COTIZACION ────────────────────────────────────────
function DetalleCotizacion({cotizacion:c,productos,onCambiarEstado,onEditar,onClose,logoB64,perfil,isAdmin=false}) {
  const [factNum,setFactNum]=useState(c.facturaNum||"");
  const [factUrl,setFactUrl]=useState(c.facturaUrl||"");
  const [facturando,setFacturando]=useState(false);
  const {subtotalNeto,iva,total}=calcTotalesCot(c.items||[]);
  const util=(c.total||total)-(c.costoTotal||0);
  const mg=c.margenProm||0;

  const handleEstado=nuevoEstado=>{
    const critico=ESTADOS_CRITICOS.includes(nuevoEstado);
    const retro=esRetroceso(c.estado,nuevoEstado);
    if((critico||retro)&&!window.confirm(`¿${retro?"Retroceder":"Cambiar"} a "${nuevoEstado}"?${retro?"\nRequiere revisión.":"\nEstado crítico."}`)) return;
    if(nuevoEstado==="Facturada"&&c.estado==="Adjudicada"){setFacturando(true);return;}
    if(nuevoEstado==="Adjudicada"){
      const sinStock=(c.items||[]).filter(item=>{
        const p=productos.find(x=>x.id===item.productoId||x.nombre===item.nombre);
        return !p||getStockTotal(p)<item.cantidad;
      });
      if(sinStock.length>0){
        const ok=window.confirm(`⚠ Stock insuficiente:\n${sinStock.map(i=>i.nombre).join(", ")}\n\n¿Adjudicar e iniciar compra?`);
        if(!ok) return;
        onCambiarEstado(c.id,"Adjudicada",{estadoOp:"En compra",fechaCompra:today(),nota:"Adjudicada — compra iniciada"});
        toast("Cotización adjudicada — proceso de compra iniciado","info");
        return;
      }
    }
    onCambiarEstado(c.id,nuevoEstado,{nota:`→ ${nuevoEstado}`});
    toast(`Estado: "${nuevoEstado}"`);
  };

  return (
    <Modal onClose={onClose} maxWidth={680}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div>
          <button onClick={async()=>{const ok=await copiarAlPortapapeles(`${c.numero} — ${c.organismo}`);toast(ok?"Copiado al portapapeles":"Error al copiar",ok?"success":"error");}} style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#1d4ed8",fontWeight:600,background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:3,display:"flex",alignItems:"center",gap:4}}>
            {c.numero} {Ic.copy}
          </button>
          <h2 style={{fontSize:16,fontWeight:700,margin:0}}>{c.organismo}</h2>
          <div style={{color:"#64748b",fontSize:12,marginTop:2}}>{fmtFecha(c.fecha)}{c.fechaVencimiento?` · Vence ${fmtFecha(c.fechaVencimiento)}`:""} · Ej: {c.ejecutivo||"—"}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}><EstadoBadge estado={c.estado}/><CloseBtn onClose={onClose}/></div>
      </div>
      {/* Estados */}
      <div style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
        <div style={{fontSize:11,color:"#64748b",fontWeight:500,marginBottom:6}}>Cambiar estado</div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {[...ESTADOS_COT,"Para revisar"].map(e=>{
            const ec=ESTADO_COLORS[e]||{bg:"#f1f5f9",text:"#475569"};const isA=c.estado===e;
            return <button key={e} onClick={()=>handleEstado(e)} style={{padding:"4px 10px",borderRadius:20,border:`2px solid ${isA?ec.text:"#e2e8f0"}`,background:isA?ec.bg:"#fff",color:isA?ec.text:"#64748b",fontWeight:isA?700:400,cursor:"pointer",fontSize:11,transition:"all .12s"}}>{e}</button>;
          })}
        </div>
      </div>
      {/* Facturación */}
      {(facturando||c.estado==="Facturada")&&(
        <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"10px 13px",marginBottom:10}}>
          <div style={{fontWeight:600,fontSize:13,color:"#92400e",marginBottom:7}}>🧾 {c.estado==="Facturada"?"Factura vinculada":"Vincular factura SII"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:7}}>
            <div><label style={{fontSize:10,color:"#64748b",display:"block",marginBottom:2}}>N° Factura (SII)</label><input value={factNum} onChange={e=>setFactNum(e.target.value)} disabled={c.estado==="Facturada"} placeholder="001234" style={{width:"100%",padding:"6px 10px",borderRadius:6,border:"1px solid #fde68a",fontSize:13,boxSizing:"border-box"}}/></div>
            <div><label style={{fontSize:10,color:"#64748b",display:"block",marginBottom:2}}>URL</label><input value={factUrl} onChange={e=>setFactUrl(e.target.value)} disabled={c.estado==="Facturada"} placeholder="https://…" style={{width:"100%",padding:"6px 10px",borderRadius:6,border:"1px solid #fde68a",fontSize:13,boxSizing:"border-box"}}/></div>
          </div>
          {c.facturaUrl&&<a href={c.facturaUrl} target="_blank" rel="noreferrer" style={{display:"inline-block",background:"#fde68a",color:"#92400e",padding:"3px 11px",borderRadius:6,fontSize:12,fontWeight:600,textDecoration:"none",marginBottom:5}}>🔗 Ver factura</a>}
          {facturando&&c.estado!=="Facturada"&&<div style={{display:"flex",gap:7}}>
            <Btn onClick={()=>setFacturando(false)} variant="ghost" size="sm">Cancelar</Btn>
            <Btn onClick={()=>{if(!factNum.trim()){toast("Ingresa N° de factura","warning");return;}onCambiarEstado(c.id,"Facturada",{facturaNum:factNum,facturaUrl:factUrl,nota:"Facturada"});setFacturando(false);toast("Facturada");}} size="sm">✓ Confirmar</Btn>
          </div>}
        </div>
      )}
      {/* Items */}
      {(c.items||[]).length>0&&(
        <div style={{marginBottom:10,overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:300}}>
            <thead><tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>{["","Producto","Cant.","P. Unit.","Subtotal"].map(h=><th key={h} style={{padding:"5px 9px",textAlign:"left",fontSize:10,color:"#64748b",fontWeight:600}}>{h}</th>)}</tr></thead>
            <tbody>{(c.items||[]).map((item,i)=>(
              <tr key={i} style={{borderBottom:"1px solid #f1f5f9"}}>
                <td style={{padding:"5px 9px",width:30}}>{item.foto_url?<img src={item.foto_url} alt="" style={{width:22,height:22,objectFit:"cover",borderRadius:4}}/>:<span style={{fontSize:12}}>📦</span>}</td>
                <td style={{padding:"5px 9px",fontWeight:500}}>{item.nombre}</td>
                <td style={{padding:"5px 9px"}}>{fmtN(item.cantidad)}</td>
                <td style={{padding:"5px 9px"}}>{fmt(Math.round(item.precioVenta/1.19))}</td>
                <td style={{padding:"5px 9px",fontWeight:600}}>{fmt(Math.round(item.precioVenta/1.19)*item.cantidad)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {/* Totales */}
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
        <div style={{width:218,background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:2,fontSize:12}}><span style={{color:"#64748b"}}>Base</span><span>{fmt(subtotalNeto)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}><span style={{color:"#64748b"}}>IVA 19%</span><span>{fmt(iva)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,color:"#1d4ed8",borderTop:"1px solid #e2e8f0",paddingTop:4}}><span>Total</span><span>{fmt(c.total||total)}</span></div>
          <div style={{fontSize:11,marginTop:3,display:"flex",justifyContent:"space-between"}}>
            <span style={{color:"#64748b"}}>Utilidad: {fmt(util)}</span>
            <span style={{color:mg>=25?"#15803d":"#b91c1c",fontWeight:600}}>{fmtPct(mg)}</span>
          </div>
        </div>
      </div>
      {c.notas&&<div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:7,padding:"6px 10px",marginBottom:8,fontSize:12,color:"#475569"}}>📝 {c.notas}</div>}
      {/* Log en tiempo real */}
      {(c.log||[]).length>0&&(
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#64748b",fontWeight:600,marginBottom:4}}>Historial</div>
          <div style={{background:"#f8fafc",borderRadius:7,padding:"7px 10px",maxHeight:100,overflowY:"auto"}}>
            {[...(c.log||[])].reverse().map((entry,i)=>(
              <div key={i} style={{display:"flex",gap:7,fontSize:11,padding:"2px 0",flexWrap:"wrap"}}>
                <span style={{color:"#94a3b8",flexShrink:0,fontFamily:"'DM Mono',monospace",fontSize:9}}>{fmtDateTime(entry.ts)||fmtFecha(entry.fecha)}</span>
                <EstadoBadge estado={entry.estado}/>
                {entry.usuario&&<span style={{color:"#1d4ed8",fontSize:10,fontWeight:500}}>{entry.usuario}</span>}
                {entry.nota&&<span style={{color:"#64748b"}}>{entry.nota}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:7,justifyContent:"space-between",flexWrap:"wrap"}}>
        {(isAdmin||!["Facturada","Adjudicada","Rechazada"].includes(c.estado)) ? <Btn onClick={onEditar} size="sm">Editar</Btn> : <span style={{fontSize:11,color:"#94a3b8",padding:"4px 8px",background:"#f1f5f9",borderRadius:7}} title="Solo admin puede editar">🔒 Solo admin</span>}
        <div style={{display:"flex",gap:7}}>
          <Btn onClick={()=>generarPDFCotizacion(c,logoB64)} variant="dark" size="sm">📄 PDF</Btn>
          <Btn onClick={onClose} variant="ghost" size="sm">Cerrar</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── MODULO INVENTARIO ─────────────────────────────────────────
function ModuloInventario({productos,setProductos,movimientos,setMovimientos,perfil,bodegas,stockMinimo=5}) {
  const [subTab,setSubTab]=useState("resumen");
  const [seenMovs,setSeenMovs]=useState(false);
  const [periodoInv,setPeriodoInv]=useState("todo");
  const [filtroProd,setFiltroProd]=useState("");
  const [filtroTipo,setFiltroTipo]=useState("todos");

  // Ajuste manual state
  const [ajuste,setAjuste]=useState({productoId:"",cantidad:"",tipo:"entrada",motivo:"Conteo físico",bodega:"",notas:""});
  // Transferencia state
  const [transf,setTransf]=useState({productoId:"",cantidad:"",bodegaOrigen:"",bodegaDestino:"",notas:""});

  const TIPO_COLORS={
    entrada: {bg:"#dcfce7",text:"#15803d",label:"Entrada"},
    salida:  {bg:"#fee2e2",text:"#b91c1c",label:"Salida"},
    ajuste:  {bg:"#fef9c3",text:"#854d0e",label:"Ajuste"},
    transferencia:{bg:"#e0e7ff",text:"#3730a3",label:"Transferencia"},
  };

  const movFiltrados = filtrarPorPeriodo(movimientos, periodoInv, "fecha")
    .filter(m=>filtroTipo==="todos"||m.tipo===filtroTipo)
    .filter(m=>!filtroProd||m.nombreProducto.toLowerCase().includes(filtroProd.toLowerCase()))
    .sort((a,b)=>b.ts.localeCompare(a.ts));

  const registrarAjuste=()=>{
    const prod=productos.find(p=>p.id===ajuste.productoId);
    if(!prod){toast("Selecciona un producto","warning");return;}
    const cant=Number(ajuste.cantidad)||0;
    if(!cant){toast("Ingresa una cantidad","warning");return;}
    const delta=ajuste.tipo==="entrada"?cant:-cant;
    const stockAntes=prod.stock||0;
    const stockDespues=Math.max(0,stockAntes+delta);
    setProductos(prev=>prev.map(p=>p.id!==prod.id?p:{...p,stock:stockDespues,updatedAt:nowISO()}));
    setMovimientos(prev=>[...prev,{
      id:uid(),ts:nowISO(),fecha:today(),tipo:"ajuste",
      productoId:prod.id,nombreProducto:prod.nombre,
      cantidad:Math.abs(delta),stockAntes,stockDespues,
      signo:ajuste.tipo==="entrada"?"+":"-",
      referencia:"Ajuste manual",motivo:ajuste.motivo,
      bodegaOrigen:"",bodegaDestino:ajuste.bodega||prod.ubicacion||"",
      usuario:perfil?.nombre||"",notas:ajuste.notas
    }]);
    setAjuste({productoId:"",cantidad:"",tipo:"entrada",motivo:"Conteo físico",bodega:"",notas:""});
    toast(`Ajuste registrado: ${ajuste.tipo==="entrada"?"+":"-"}${fmtN(cant)} uds de ${prod.nombre}`);
  };

  const registrarTransferencia=()=>{
    const prod=productos.find(p=>p.id===transf.productoId);
    if(!prod){toast("Selecciona un producto","warning");return;}
    const cant=Number(transf.cantidad)||0;
    if(!cant||!transf.bodegaOrigen||!transf.bodegaDestino){toast("Completa todos los campos","warning");return;}
    if(transf.bodegaOrigen===transf.bodegaDestino){toast("Origen y destino no pueden ser iguales","warning");return;}
    if((prod.stock||0)<cant){toast(`Stock insuficiente (disponible: ${fmtN(prod.stock||0)})`, "warning");return;}
    const stockAntes=prod.stock||0;
    setMovimientos(prev=>[...prev,{
      id:uid(),ts:nowISO(),fecha:today(),tipo:"transferencia",
      productoId:prod.id,nombreProducto:prod.nombre,
      cantidad:cant,stockAntes,stockDespues:stockAntes,
      referencia:"Transferencia entre bodegas",motivo:transf.notas||"Transferencia",
      bodegaOrigen:transf.bodegaOrigen,bodegaDestino:transf.bodegaDestino,
      usuario:perfil?.nombre||""
    }]);
    setProductos(prev=>prev.map(p=>p.id!==prod.id?p:{...p,ubicacion:transf.bodegaDestino,updatedAt:nowISO()}));
    setTransf({productoId:"",cantidad:"",bodegaOrigen:"",bodegaDestino:"",notas:""});
    toast(`Transferencia registrada: ${prod.nombre} → ${transf.bodegaDestino}`);
  };

  const hasMovs=movimientos.length>0&&!seenMovs;
  const tabs=[
    {id:"resumen",label:"Resumen de stock"},
    {id:"movimientos",label:"Movimientos",dot:hasMovs},
    {id:"ajuste",label:"Ajuste manual"},
    {id:"transferencia",label:"Transferencias"},
  ];

  const inpS={width:"100%",padding:"8px 11px",borderRadius:7,border:"1px solid #e2e8f0",fontSize:13,boxSizing:"border-box",outline:"none",background:"#fff"};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,marginBottom:2}}>Inventario</h1>
          <p style={{color:"#64748b",fontSize:13,margin:0}}>{productos.length} productos · {movimientos.length} movimientos registrados</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:2,marginBottom:18,background:"#f1f5f9",borderRadius:10,padding:4,width:"fit-content"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>{setSubTab(t.id);if(t.id==="movimientos")setSeenMovs(true);}} style={{
            padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:subTab===t.id?600:400,
            background:subTab===t.id?"#fff":"transparent",
            color:subTab===t.id?"#0f172a":"#64748b",
            boxShadow:subTab===t.id?"0 1px 3px rgba(0,0,0,.1)":"none",
            transition:"all .15s",whiteSpace:"nowrap",
            display:"flex",alignItems:"center",gap:5
          }}>
            {t.label}
            {t.dot&&subTab!==t.id&&<span style={{width:7,height:7,borderRadius:"50%",background:"#1d4ed8",display:"inline-block",flexShrink:0}}/>}
          </button>
        ))}
      </div>

      {/* ── RESUMEN ── */}
      {subTab==="resumen"&&(
        <ResumenStock productos={productos} setProductos={setProductos} movimientos={movimientos} setMovimientos={setMovimientos} stockMinimo={stockMinimo} perfil={perfil} TIPO_COLORS={TIPO_COLORS}/>
      )}

      {/* ── MOVIMIENTOS ── */}
      {subTab==="movimientos"&&(
        <div>
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
            <PeriodoChips periodo={periodoInv} setPeriodo={setPeriodoInv}/>
            <input value={filtroProd} onChange={e=>setFiltroProd(e.target.value)} placeholder="Filtrar producto…"
              style={{padding:"6px 11px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,outline:"none",width:160}}/>
            <select value={filtroTipo} onChange={e=>setFiltroTipo(e.target.value)}
              style={{padding:"6px 10px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,background:"#fff",cursor:"pointer"}}>
              <option value="todos">Todos los tipos</option>
              {Object.entries(TIPO_COLORS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
                  {["Fecha/Hora","Tipo","Producto","Cant.","Stock ant.","Stock res.","Referencia","Bodega","Usuario"].map(h=>(
                    <th key={h} style={{padding:"9px 12px",textAlign:"left",fontSize:10,color:"#64748b",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {movFiltrados.length===0&&(
                    <tr><td colSpan={9} style={{padding:28,textAlign:"center",color:"#94a3b8"}}>Sin movimientos en este período</td></tr>
                  )}
                  {movFiltrados.map((m,i)=>{
                    const tc=TIPO_COLORS[m.tipo]||{bg:"#f1f5f9",text:"#475569",label:m.tipo};
                    const esEntrada=m.tipo==="entrada"||m.tipo==="ajuste"&&m.stockDespues>m.stockAntes;
                    return (
                      <tr key={m.id} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"#fff":"#fafafa"}}>
                        <td style={{padding:"8px 12px",fontSize:11,color:"#64748b",fontFamily:"'DM Mono',monospace",whiteSpace:"nowrap"}}>
                          {fmtDateTime(m.ts)}
                        </td>
                        <td style={{padding:"8px 12px"}}>
                          <span style={{background:tc.bg,color:tc.text,padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600}}>{tc.label}</span>
                        </td>
                        <td style={{padding:"8px 12px",fontWeight:500}}>{m.nombreProducto}</td>
                        <MovSign m={m}/>
                        <td style={{padding:"8px 12px",color:"#64748b"}}>{fmtN(m.stockAntes)}</td>
                        <td style={{padding:"8px 12px",fontWeight:600}}>{fmtN(m.stockDespues)}</td>
                        <td style={{padding:"8px 12px",fontSize:11,color:"#64748b",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={m.referencia}>{m.referencia||"—"}</td>
                        <td style={{padding:"8px 12px",fontSize:11,color:"#64748b"}}>
                          {m.bodegaOrigen&&m.bodegaDestino?`${m.bodegaOrigen} → ${m.bodegaDestino}`:m.bodegaDestino||m.bodegaOrigen||"—"}
                        </td>
                        <td style={{padding:"8px 12px",fontSize:11,color:"#64748b"}}>{m.usuario||"—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── AJUSTE MANUAL ── */}
      {subTab==="ajuste"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
          <div style={{background:"#fff",borderRadius:12,padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
            <div style={{fontWeight:600,fontSize:15,marginBottom:14}}>Registrar ajuste de stock</div>
            <div style={{display:"flex",flexDirection:"column",gap:11}}>
              <div>
                <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>PRODUCTO *</label>
                <select value={ajuste.productoId} onChange={e=>setAjuste(a=>({...a,productoId:e.target.value}))} style={inpS}>
                  <option value="">Seleccionar producto…</option>
                  {productos.map(p=><option key={p.id} value={p.id}>{p.nombre} (Stock: {fmtN(p.stock||0)})</option>)}
                </select>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>TIPO</label>
                  <select value={ajuste.tipo} onChange={e=>setAjuste(a=>({...a,tipo:e.target.value}))} style={inpS}>
                    <option value="entrada">Entrada (+)</option>
                    <option value="salida">Salida (-)</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>CANTIDAD</label>
                  <MilesInput value={ajuste.cantidad} onChange={v=>setAjuste(a=>({...a,cantidad:v}))} placeholder="0"/>
                </div>
              </div>
              <div>
                <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>MOTIVO</label>
                <select value={ajuste.motivo} onChange={e=>setAjuste(a=>({...a,motivo:e.target.value}))} style={inpS}>
                  {["Conteo físico","Merma","Daño","Devolución","Corrección de error","Otro"].map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>BODEGA</label>
                <select value={ajuste.bodega} onChange={e=>setAjuste(a=>({...a,bodega:e.target.value}))} style={inpS}>
                  <option value="">Sin especificar</option>
                  {bodegas.map(b=><option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>NOTAS (opcional)</label>
                <textarea value={ajuste.notas} onChange={e=>setAjuste(a=>({...a,notas:e.target.value}))} rows={2}
                  style={{...inpS,resize:"vertical"}}/>
              </div>
              {ajuste.productoId&&ajuste.cantidad&&(
                <div style={{background:"#f0f9ff",border:"1px solid #bfdbfe",borderRadius:8,padding:"10px 13px",fontSize:12}}>
                  <div style={{color:"#1d4ed8",fontWeight:500}}>Resultado del ajuste:</div>
                  <AjustePreview productos={productos} ajuste={ajuste}/>
                </div>
              )}
              <Btn onClick={registrarAjuste}>Registrar ajuste</Btn>
            </div>
          </div>

          {/* Últimos ajustes */}
          <div style={{background:"#fff",borderRadius:12,padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
            <div style={{fontWeight:600,fontSize:15,marginBottom:14}}>Últimos ajustes</div>
            <div style={{maxHeight:400,overflowY:"auto"}}>
              {movimientos.filter(m=>m.tipo==="ajuste").sort((a,b)=>b.ts.localeCompare(a.ts)).slice(0,10).map(m=>(
                <div key={m.id} style={{padding:"10px 0",borderBottom:"1px solid #f1f5f9"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <div style={{fontWeight:500,fontSize:13}}>{m.nombreProducto}</div>
                      <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{m.motivo} · {m.usuario}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:700,fontSize:13,color:m.stockDespues>m.stockAntes?"#15803d":"#b91c1c"}}>
                        {m.stockDespues>m.stockAntes?"+":"-"}{fmtN(m.cantidad)}
                      </div>
                      <div style={{fontSize:10,color:"#94a3b8"}}>{fmtFecha(m.fecha)}</div>
                    </div>
                  </div>
                </div>
              ))}
              {!movimientos.filter(m=>m.tipo==="ajuste").length&&<div style={{color:"#94a3b8",fontSize:13}}>Sin ajustes registrados</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── TRANSFERENCIAS ── */}
      {subTab==="transferencia"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
          <div style={{background:"#fff",borderRadius:12,padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
            <div style={{fontWeight:600,fontSize:15,marginBottom:14}}>Transferir entre bodegas</div>
            <div style={{display:"flex",flexDirection:"column",gap:11}}>
              <div>
                <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>PRODUCTO *</label>
                <select value={transf.productoId} onChange={e=>{
                  const prod=productos.find(p=>p.id===e.target.value);
                  setTransf(t=>({...t,productoId:e.target.value,bodegaOrigen:prod?.ubicacion||""}));
                }} style={inpS}>
                  <option value="">Seleccionar producto…</option>
                  {productos.map(p=><option key={p.id} value={p.id}>{p.nombre} (Stock: {fmtN(p.stock||0)} · {p.ubicacion||"Sin bodega"})</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>CANTIDAD *</label>
                <MilesInput value={transf.cantidad} onChange={v=>setTransf(t=>({...t,cantidad:v}))} placeholder="0"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center"}}>
                <div>
                  <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>ORIGEN</label>
                  <select value={transf.bodegaOrigen} onChange={e=>setTransf(t=>({...t,bodegaOrigen:e.target.value}))} style={inpS}>
                    <option value="">Seleccionar…</option>
                    {bodegas.map(b=><option key={b}>{b}</option>)}
                  </select>
                </div>
                <div style={{textAlign:"center",color:"#94a3b8",fontSize:18,paddingTop:18}}>→</div>
                <div>
                  <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>DESTINO</label>
                  <select value={transf.bodegaDestino} onChange={e=>setTransf(t=>({...t,bodegaDestino:e.target.value}))} style={inpS}>
                    <option value="">Seleccionar…</option>
                    {bodegas.filter(b=>b!==transf.bodegaOrigen).map(b=><option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>NOTAS</label>
                <textarea value={transf.notas} onChange={e=>setTransf(t=>({...t,notas:e.target.value}))} rows={2} style={{...inpS,resize:"vertical"}}/>
              </div>
              <Btn onClick={registrarTransferencia}>Registrar transferencia</Btn>
            </div>
          </div>

          {/* Últimas transferencias */}
          <div style={{background:"#fff",borderRadius:12,padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
            <div style={{fontWeight:600,fontSize:15,marginBottom:14}}>Últimas transferencias</div>
            <div style={{maxHeight:400,overflowY:"auto"}}>
              {movimientos.filter(m=>m.tipo==="transferencia").sort((a,b)=>b.ts.localeCompare(a.ts)).slice(0,10).map(m=>(
                <div key={m.id} style={{padding:"10px 0",borderBottom:"1px solid #f1f5f9"}}>
                  <div style={{fontWeight:500,fontSize:13,marginBottom:2}}>{m.nombreProducto}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:12,color:"#475569"}}>{m.bodegaOrigen} → {m.bodegaDestino}</div>
                    <div style={{fontWeight:700,fontSize:13,color:"#3730a3"}}>{fmtN(m.cantidad)} uds</div>
                  </div>
                  <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{fmtFecha(m.fecha)} · {m.usuario}</div>
                </div>
              ))}
              {!movimientos.filter(m=>m.tipo==="transferencia").length&&<div style={{color:"#94a3b8",fontSize:13}}>Sin transferencias registradas</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AjustePreview({productos,ajuste}) {
  const prod=productos.find(p=>p.id===ajuste.productoId);
  if(!prod) return null;
  const delta=ajuste.tipo==="entrada"?Number(ajuste.cantidad):-Number(ajuste.cantidad);
  const res=Math.max(0,(prod.stock||0)+delta);
  return (
    <div style={{marginTop:4}}>
      Stock actual: <strong>{fmtN(prod.stock||0)}</strong>
      {" → "}Stock resultante: <strong style={{color:res<5?"#b91c1c":"#15803d"}}>{fmtN(res)}</strong>
    </div>
  );
}

// ── RESUMEN STOCK — expandable per-bodega with inline edit ────
function ResumenStock({productos,setProductos,movimientos,setMovimientos,stockMinimo,perfil,TIPO_COLORS}) {
  const [expandidos,setExpandidos]=useState({});
  const [editando,setEditando]=useState({}); // {productoId_bodegaIdx: cantidad}

  const toggleExpand=id=>setExpandidos(e=>({...e,[id]:!e[id]}));

  const guardarCantidad=(prod,bIdx,nuevaCant)=>{
    const key=`${prod.id}_${bIdx}`;
    const spbSafe=prod.stockPorBodega||[];
    const cantAnterior=(spbSafe[bIdx]?.cantidad)||0;
    const delta=nuevaCant-cantAnterior;
    if(delta===0){setEditando(e=>{const n={...e};delete n[key];return n;});return;}
    const spbNew=(prod.stockPorBodega||[]).map((b,i)=>i===bIdx?{...b,cantidad:nuevaCant}:b);
    const stockTotal=spbNew.reduce((a,b)=>a+(b.cantidad||0),0);
    setProductos(prev=>prev.map(p=>p.id!==prod.id?p:{...p,stockPorBodega:spbNew,stock:stockTotal,updatedAt:nowISO()}));
    setMovimientos(prev=>[...prev,{
      id:uid(),ts:nowISO(),fecha:today(),tipo:"ajuste",
      productoId:prod.id,nombreProducto:prod.nombre,
      cantidad:Math.abs(delta),
      signo:delta>0?"+":"-",
      stockAntes:getStockTotal(prod),
      stockDespues:stockTotal,
      referencia:"Ajuste desde inventario",
      motivo:"Corrección de stock",
      bodegaOrigen:"",bodegaDestino:(prod.stockPorBodega||[])[bIdx]?.bodega||"",
      usuario:perfil?.nombre||""
    }]);
    setEditando(e=>{const n={...e};delete n[key];return n;});
    toast(`Stock actualizado: ${prod.nombre} · ${prod.stockPorBodega[bIdx].bodega}`);
  };

  const prodOrdenados=[...productos].sort((a,b)=>getStockTotal(a)-getStockTotal(b));

  return (
    <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
      {/* Header */}
      <div style={{display:"grid",gridTemplateColumns:"40px 1fr 80px 80px 120px 120px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
        {["","Producto","SKU","Stock total","Último mov.",""].map((h,i)=>(
          <div key={i} style={{padding:"10px 13px",fontSize:11,color:"#64748b",fontWeight:700}}>{h}</div>
        ))}
      </div>

      {prodOrdenados.map((p,pi)=>{
        const stockTotal=getStockTotal(p);
        const ultimoMov=movimientos.filter(m=>m.productoId===p.id).sort((a,b)=>b.ts.localeCompare(a.ts))[0];
        const stockColor=stockTotal===0?"#b91c1c":stockTotal<stockMinimo?"#854d0e":"#15803d";
        const isExp=expandidos[p.id];
        const spb=p.stockPorBodega||[{bodega:p.ubicacion||"—",cantidad:stockTotal}];

        return (
          <div key={p.id} style={{borderBottom:"1px solid #f1f5f9"}}>
            {/* Fila producto */}
            <div style={{display:"grid",gridTemplateColumns:"40px 1fr 80px 80px 120px 120px",alignItems:"center",background:pi%2===0?"#fff":"#fafafa",cursor:"pointer"}}
              onClick={()=>toggleExpand(p.id)}>
              <div style={{padding:"10px 10px"}}>
                {p.foto_url
                  ?<img src={p.foto_url} alt="" style={{width:30,height:30,objectFit:"cover",borderRadius:5,display:"block"}}/>
                  :<div style={{width:30,height:30,background:"#f1f5f9",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📦</div>
                }
              </div>
              <div style={{padding:"10px 13px"}}>
                <div style={{fontWeight:600,fontSize:13}}>{p.nombre}</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{p.proveedor||""}</div>
              </div>
              <div style={{padding:"10px 13px",fontFamily:"'DM Mono',monospace",fontSize:11,color:"#94a3b8"}}>{p.sku||"—"}</div>
              <div style={{padding:"10px 13px",fontWeight:700,fontSize:15,color:stockColor}}>{fmtN(stockTotal)}</div>
              <div style={{padding:"10px 13px",fontSize:11,color:"#94a3b8"}}>
                {ultimoMov
                  ?<span style={{color:TIPO_COLORS[ultimoMov.tipo]?.text,fontWeight:500}}>
                    {ultimoMov.signo||(ultimoMov.tipo==="entrada"?"+":(ultimoMov.tipo==="salida"?"-":(ultimoMov.stockDespues>ultimoMov.stockAntes?"+":"-")))}{fmtN(ultimoMov.cantidad)} · {fmtFecha(ultimoMov.fecha)}
                  </span>
                  :"—"
                }
              </div>
              <div style={{padding:"10px 13px",fontSize:11,color:"#64748b",display:"flex",alignItems:"center",gap:4}}>
                <span style={{fontSize:16,transition:"transform .2s",display:"inline-block",transform:isExp?"rotate(90deg)":"rotate(0deg)"}}>›</span>
                <span>{isExp?"Ocultar":"Ver bodegas"} ({spb.length})</span>
              </div>
            </div>

            {/* Filas expandidas — una por bodega, con edición inline */}
            {isExp&&(
              <div style={{background:"#f8fafc",borderTop:"1px solid #f1f5f9"}}>
                {spb.map((sb,bi)=>{
                  const key=`${p.id}_${bi}`;
                  const isEdit=editando[key]!==undefined;
                  const bColor=(sb.cantidad||0)===0?"#b91c1c":(sb.cantidad||0)<stockMinimo?"#854d0e":"#15803d";
                  return (
                    <div key={bi} style={{display:"grid",gridTemplateColumns:"40px 1fr auto",alignItems:"center",padding:"8px 0",borderBottom:bi<spb.length-1?"1px solid #f1f5f9":"none",paddingLeft:52}}>
                      <div/>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:18,color:"#94a3b8"}}>🏬</span>
                        <span style={{fontSize:13,fontWeight:500,color:"#475569"}}>{sb.bodega||"Sin bodega"}</span>
                      </div>
                      <div style={{padding:"0 16px",display:"flex",alignItems:"center",gap:8}}>
                        {isEdit ? (
                          <>
                            <input
                              type="number"
                              value={editando[key]}
                              onChange={e=>setEditando(ed=>({...ed,[key]:Number(e.target.value)||0}))}
                              onKeyDown={e=>{
                                if(e.key==="Enter") guardarCantidad(p,bi,editando[key]);
                                if(e.key==="Escape") setEditando(ed=>{const n={...ed};delete n[key];return n;});
                              }}
                              autoFocus
                              style={{width:72,padding:"4px 8px",borderRadius:6,border:"1.5px solid #1d4ed8",fontSize:14,fontWeight:700,textAlign:"center",outline:"none",background:"#eff6ff"}}
                            />
                            <span style={{fontSize:11,color:"#64748b"}}>uds</span>
                            <button onClick={()=>guardarCantidad(p,bi,editando[key])} style={{background:"#1d4ed8",border:"none",borderRadius:6,color:"#fff",padding:"4px 10px",cursor:"pointer",fontSize:12,fontWeight:600}}>✓</button>
                            <button onClick={()=>setEditando(ed=>{const n={...ed};delete n[key];return n;})} style={{background:"#f1f5f9",border:"none",borderRadius:6,color:"#64748b",padding:"4px 8px",cursor:"pointer",fontSize:12}}>✗</button>
                          </>
                        ) : (
                          <>
                            <span style={{fontWeight:700,fontSize:15,color:bColor,minWidth:40,textAlign:"right"}}>{fmtN(sb.cantidad||0)}</span>
                            <span style={{fontSize:11,color:"#94a3b8"}}>uds</span>
                            <button
                              onClick={e=>{e.stopPropagation();setEditando(ed=>({...ed,[key]:sb.cantidad||0}));}}
                              style={{background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:6,color:"#64748b",padding:"3px 9px",cursor:"pointer",fontSize:11,fontWeight:500,marginLeft:4,transition:"all .12s"}}
                              onMouseEnter={e=>{e.currentTarget.style.background="#eff6ff";e.currentTarget.style.color="#1d4ed8";}}
                              onMouseLeave={e=>{e.currentTarget.style.background="#f1f5f9";e.currentTarget.style.color="#64748b";}}>
                              Editar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div style={{padding:"8px 16px 8px 52px",fontSize:11,color:"#94a3b8"}}>
                  Clic en "Editar" para ajustar stock · Enter confirma · Esc cancela
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── MOV SIGN — movement quantity with correct sign and color ──
function MovSign({m}) {
  const signo = m.signo || (
    m.tipo==="entrada" ? "+" :
    m.tipo==="salida"  ? "-" :
    m.stockDespues > m.stockAntes ? "+" : "-"
  );
  const color = signo==="+" ? "#15803d" : "#b91c1c";
  return (
    <td style={{padding:"8px 12px",fontWeight:700,color,whiteSpace:"nowrap"}}>
      {signo}{fmtN(m.cantidad)}
    </td>
  );
}

// ── MODULO MAESTROS — full CRUD for proveedores/organismos/bodegas ──
// ── MODULO MAESTROS ───────────────────────────────────────────
function ModuloMaestros({proveedores,setProv,empresas,setEmpresas,bodegas,setBodegas,cots}) {
  const [seccion,setSeccion]=useState("organismos");
  const [confirmDel,setConfirmDel]=useState(null);
  // Organismos: rich objects {nombre, rut, direccion, email, telefono}
  const [modalOrg,setModalOrg]=useState(null); // null | {idx, data}
  // Proveedores: rich objects {nombre, rut, contacto, email, telefono, web}
  const [modalProv,setModalProv]=useState(null);
  // Bodegas: simple strings
  const [nuevaBodega,setNuevaBodega]=useState("");
  const [editBodega,setEditBodega]=useState(null); // {idx, valor}
  const [confirmDelBod,setConfirmDelBod]=useState(null);

  // ── Organismos (objetos enriquecidos) ─────────────────────
  const orgList = empresas.map(e => typeof e==="object" ? e : {nombre:e,rut:"",direccion:"",email:"",telefono:""});
  const saveOrgList = list => setEmpresas(list);

  const EMPTY_ORG = {nombre:"",rut:"",direccion:"",email:"",telefono:""};
  const EMPTY_PROV = {nombre:"",rut:"",contacto:"",email:"",telefono:"",web:""};

  const isOrgEnUso = nombre => cots.some(c=>c.organismo===nombre);
  const isProvEnUso = nombre => cots.some(c=>(c.items||[]).some(i=>i.proveedor===nombre));

  const deleteOrg = idx => {
    const org=orgList[idx];
    if(isOrgEnUso(org.nombre)){toast(`"${org.nombre}" está en uso`,"warning");setConfirmDel(null);return;}
    saveOrgList(orgList.filter((_,i)=>i!==idx));
    setConfirmDel(null); toast("Eliminado");
  };

  // ── Proveedores (objetos enriquecidos) ────────────────────
  const provList = proveedores.map(p => typeof p==="object" ? p : {nombre:p,rut:"",contacto:"",email:"",telefono:"",web:""});
  const saveProvList = list => setProv(list);

  const deleteProv = idx => {
    const p=provList[idx];
    if(isProvEnUso(p.nombre)){toast(`"${p.nombre}" está en uso`,"warning");setConfirmDel(null);return;}
    saveProvList(provList.filter((_,i)=>i!==idx));
    setConfirmDel(null); toast("Eliminado");
  };

  const TABS=[
    {id:"organismos", label:"Organismos compradores"},
    {id:"proveedores",label:"Proveedores"},
    {id:"bodegas",    label:"Bodegas"},
  ];

  const inp={width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #e2e8f0",fontSize:13,boxSizing:"border-box",outline:"none"};

  return (
    <div>
      <div style={{marginBottom:18}}>
        <h1 style={{fontSize:22,fontWeight:700,marginBottom:2}}>Maestros</h1>
        <p style={{color:"#64748b",fontSize:13,margin:0}}>Gestión de organismos compradores, proveedores y bodegas</p>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:2,marginBottom:18,background:"#f1f5f9",borderRadius:10,padding:4,width:"fit-content"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setSeccion(t.id)} style={{
            padding:"7px 18px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,
            fontWeight:seccion===t.id?600:400,background:seccion===t.id?"#fff":"transparent",
            color:seccion===t.id?"#0f172a":"#64748b",
            boxShadow:seccion===t.id?"0 1px 3px rgba(0,0,0,.1)":"none",transition:"all .15s",whiteSpace:"nowrap"
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── ORGANISMOS ── */}
      {seccion==="organismos"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontSize:13,color:"#64748b"}}>{orgList.length} organismos registrados</span>
            <Btn onClick={()=>setModalOrg({idx:null,data:{...EMPTY_ORG}})} size="sm">+ Nuevo organismo</Btn>
          </div>
          <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
                {["Nombre / Organismo","RUT","Dirección","Email","Teléfono",""].map(h=>(
                  <th key={h} style={{padding:"9px 13px",textAlign:"left",fontSize:11,color:"#64748b",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {orgList.map((o,i)=>(
                  <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"#fff":"#fafafa"}}>
                    <td style={{padding:"10px 13px"}}>
                      <div style={{fontWeight:600}}>{o.nombre}</div>
                      {isOrgEnUso(o.nombre)&&<span style={{fontSize:10,color:"#94a3b8",background:"#f1f5f9",padding:"1px 6px",borderRadius:20}}>en uso</span>}
                    </td>
                    <td style={{padding:"10px 13px",fontFamily:"'DM Mono',monospace",fontSize:11,color:"#64748b"}}>{o.rut||"—"}</td>
                    <td style={{padding:"10px 13px",color:"#64748b",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.direccion||"—"}</td>
                    <td style={{padding:"10px 13px",color:"#64748b"}}>{o.email?<a href={`mailto:${o.email}`} style={{color:"#1d4ed8",textDecoration:"none"}}>{o.email}</a>:"—"}</td>
                    <td style={{padding:"10px 13px",color:"#64748b",whiteSpace:"nowrap"}}>{o.telefono||"—"}</td>
                    <td style={{padding:"10px 13px"}}>
                      <div style={{display:"flex",gap:5}}>
                        <button onClick={()=>setModalOrg({idx:i,data:{...o}})} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,color:"#475569",fontWeight:500}}>Editar</button>
                        <button onClick={()=>setConfirmDel({tipo:"org",idx:i,nombre:o.nombre})} style={{background:"#fff",border:"1px solid #fecaca",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,color:"#b91c1c",fontWeight:500}}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!orgList.length&&<tr><td colSpan={6} style={{padding:28,textAlign:"center",color:"#94a3b8"}}>Sin organismos registrados</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PROVEEDORES ── */}
      {seccion==="proveedores"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontSize:13,color:"#64748b"}}>{provList.length} proveedores registrados</span>
            <Btn onClick={()=>setModalProv({idx:null,data:{...EMPTY_PROV}})} size="sm">+ Nuevo proveedor</Btn>
          </div>
          <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
                {["Nombre","RUT","Contacto","Email","Teléfono","Web",""].map(h=>(
                  <th key={h} style={{padding:"9px 13px",textAlign:"left",fontSize:11,color:"#64748b",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {provList.map((p,i)=>(
                  <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"#fff":"#fafafa"}}>
                    <td style={{padding:"10px 13px"}}>
                      <div style={{fontWeight:600}}>{p.nombre}</div>
                      {isProvEnUso(p.nombre)&&<span style={{fontSize:10,color:"#94a3b8",background:"#f1f5f9",padding:"1px 6px",borderRadius:20}}>en uso</span>}
                    </td>
                    <td style={{padding:"10px 13px",fontFamily:"'DM Mono',monospace",fontSize:11,color:"#64748b"}}>{p.rut||"—"}</td>
                    <td style={{padding:"10px 13px",color:"#64748b"}}>{p.contacto||"—"}</td>
                    <td style={{padding:"10px 13px",color:"#64748b"}}>{p.email?<a href={`mailto:${p.email}`} style={{color:"#1d4ed8",textDecoration:"none"}}>{p.email}</a>:"—"}</td>
                    <td style={{padding:"10px 13px",color:"#64748b",whiteSpace:"nowrap"}}>{p.telefono||"—"}</td>
                    <td style={{padding:"10px 13px",color:"#1d4ed8",fontSize:12}}>{p.web?<a href={p.web.startsWith("http")?p.web:"https://"+p.web} target="_blank" rel="noreferrer" style={{color:"#1d4ed8",textDecoration:"none"}}>Ver web</a>:"—"}</td>
                    <td style={{padding:"10px 13px"}}>
                      <div style={{display:"flex",gap:5}}>
                        <button onClick={()=>setModalProv({idx:i,data:{...p}})} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,color:"#475569",fontWeight:500}}>Editar</button>
                        <button onClick={()=>setConfirmDel({tipo:"prov",idx:i,nombre:p.nombre})} style={{background:"#fff",border:"1px solid #fecaca",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,color:"#b91c1c",fontWeight:500}}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!provList.length&&<tr><td colSpan={7} style={{padding:28,textAlign:"center",color:"#94a3b8"}}>Sin proveedores registrados</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── BODEGAS ── */}
      {seccion==="bodegas"&&(
        <div style={{maxWidth:480}}>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <input value={nuevaBodega} onChange={e=>setNuevaBodega(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&nuevaBodega.trim()){if(bodegas.includes(nuevaBodega.trim())){toast("Ya existe","warning");return;}setBodegas(prev=>[...prev,nuevaBodega.trim()]);setNuevaBodega("");toast("Bodega agregada");}}}
              placeholder="Nombre de la bodega…"
              style={{flex:1,padding:"8px 12px",borderRadius:8,border:"1px solid #e2e8f0",fontSize:13,outline:"none"}}/>
            <Btn onClick={()=>{if(!nuevaBodega.trim()||bodegas.includes(nuevaBodega.trim())){toast("Nombre inválido o ya existe","warning");return;}setBodegas(prev=>[...prev,nuevaBodega.trim()]);setNuevaBodega("");toast("Bodega agregada");}} size="sm">+ Agregar</Btn>
          </div>
          <div style={{background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
            {bodegas.map((b,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 15px",borderBottom:i<bodegas.length-1?"1px solid #f1f5f9":"none",background:i%2===0?"#fff":"#fafafa"}}>
                {editBodega?.idx===i ? (
                  <>
                    <input autoFocus value={editBodega.valor} onChange={e=>setEditBodega(eb=>({...eb,valor:e.target.value}))}
                      onKeyDown={e=>{
                        if(e.key==="Enter"){if(!editBodega.valor.trim())return;setBodegas(prev=>prev.map((x,j)=>j===i?editBodega.valor.trim():x));setEditBodega(null);toast("Bodega actualizada");}
                        if(e.key==="Escape")setEditBodega(null);
                      }}
                      style={{flex:1,padding:"6px 10px",borderRadius:7,border:"1.5px solid #1d4ed8",fontSize:13,outline:"none",background:"#eff6ff"}}/>
                    <Btn onClick={()=>{if(!editBodega.valor.trim())return;setBodegas(prev=>prev.map((x,j)=>j===i?editBodega.valor.trim():x));setEditBodega(null);toast("Bodega actualizada");}} size="xs">Guardar</Btn>
                    <Btn onClick={()=>setEditBodega(null)} variant="ghost" size="xs">Cancelar</Btn>
                  </>
                ) : (
                  <>
                    <span style={{flex:1,fontSize:13,fontWeight:500}}>{b}</span>
                    <button onClick={()=>setEditBodega({idx:i,valor:b})} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,color:"#475569",fontWeight:500}}>Editar</button>
                    <button onClick={()=>setConfirmDelBod({idx:i,nombre:b})} style={{background:"#fff",border:"1px solid #fecaca",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,color:"#b91c1c",fontWeight:500}}>Eliminar</button>
                  </>
                )}
              </div>
            ))}
            {!bodegas.length&&<div style={{padding:28,textAlign:"center",color:"#94a3b8",fontSize:13}}>Sin bodegas registradas</div>}
          </div>
        </div>
      )}

      {/* Modal organismo */}
      {modalOrg&&(
        <Modal onClose={()=>setModalOrg(null)} maxWidth={500}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h2 style={{fontSize:16,fontWeight:700,margin:0}}>{modalOrg.idx===null?"Nuevo organismo":"Editar organismo"}</h2>
            <CloseBtn onClose={()=>setModalOrg(null)}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            {[{k:"nombre",label:"Nombre *"},{k:"rut",label:"RUT"},{k:"direccion",label:"Dirección"},{k:"email",label:"Email"},{k:"telefono",label:"Teléfono"}].map(f=>(
              <div key={f.k}>
                <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>{f.label}</label>
                <input value={modalOrg.data[f.k]||""} onChange={e=>setModalOrg(m=>({...m,data:{...m.data,[f.k]:e.target.value}}))}
                  style={inp} placeholder={f.k==="rut"?"76.xxx.xxx-x":f.k==="email"?"organismo@ejemplo.cl":""}/>
              </div>
            ))}
            <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
              <Btn onClick={()=>setModalOrg(null)} variant="ghost" size="sm">Cancelar</Btn>
              <Btn onClick={()=>{
                const d=modalOrg.data;
                if(!d.nombre?.trim()){toast("El nombre es obligatorio","warning");return;}
                const newList=[...orgList];
                if(modalOrg.idx===null) newList.push(d);
                else newList[modalOrg.idx]=d;
                saveOrgList(newList);
                setModalOrg(null);
                toast(modalOrg.idx===null?"Organismo creado":"Organismo actualizado");
              }} size="sm">Guardar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal proveedor */}
      {modalProv&&(
        <Modal onClose={()=>setModalProv(null)} maxWidth={500}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h2 style={{fontSize:16,fontWeight:700,margin:0}}>{modalProv.idx===null?"Nuevo proveedor":"Editar proveedor"}</h2>
            <CloseBtn onClose={()=>setModalProv(null)}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            {[{k:"nombre",label:"Nombre *"},{k:"rut",label:"RUT"},{k:"contacto",label:"Contacto"},{k:"email",label:"Email"},{k:"telefono",label:"Teléfono"},{k:"web",label:"Sitio web"}].map(f=>(
              <div key={f.k}>
                <label style={{fontSize:11,color:"#64748b",fontWeight:600,display:"block",marginBottom:4}}>{f.label}</label>
                <input value={modalProv.data[f.k]||""} onChange={e=>setModalProv(m=>({...m,data:{...m.data,[f.k]:e.target.value}}))}
                  style={inp} placeholder={f.k==="web"?"www.proveedor.cl":f.k==="rut"?"76.xxx.xxx-x":""}/>
              </div>
            ))}
            <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
              <Btn onClick={()=>setModalProv(null)} variant="ghost" size="sm">Cancelar</Btn>
              <Btn onClick={()=>{
                const d=modalProv.data;
                if(!d.nombre?.trim()){toast("El nombre es obligatorio","warning");return;}
                const newList=[...provList];
                if(modalProv.idx===null) newList.push(d);
                else newList[modalProv.idx]=d;
                saveProvList(newList);
                setModalProv(null);
                toast(modalProv.idx===null?"Proveedor creado":"Proveedor actualizado");
              }} size="sm">Guardar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm delete */}
      {(confirmDel||confirmDelBod)&&(
        <Modal onClose={()=>{setConfirmDel(null);setConfirmDelBod(null);}} maxWidth={360}>
          <div style={{textAlign:"center",padding:"8px 0"}}>
            <div style={{width:48,height:48,background:"#fee2e2",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:22,color:"#b91c1c"}}>!</div>
            <h3 style={{fontWeight:700,fontSize:15,marginBottom:8}}>¿Eliminar "{(confirmDel?.nombre||confirmDelBod?.nombre)}"?</h3>
            <p style={{color:"#64748b",fontSize:13,marginBottom:20}}>Esta acción no se puede deshacer.</p>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <Btn onClick={()=>{setConfirmDel(null);setConfirmDelBod(null);}} variant="ghost">Cancelar</Btn>
              <Btn onClick={()=>{
                if(confirmDel) {
                  if(confirmDel.tipo==="org") deleteOrg(confirmDel.idx);
                  else deleteProv(confirmDel.idx);
                } else if(confirmDelBod) {
                  setBodegas(prev=>prev.filter((_,i)=>i!==confirmDelBod.idx));
                  setConfirmDelBod(null);
                  toast("Bodega eliminada");
                }
              }} variant="danger">Sí, eliminar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
