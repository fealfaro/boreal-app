// ── OPORTUNIDADES — Módulo completo ──────────────────────────
// Arquitectura:
//   nueva       → importada con coincidencias, sin analizar
//   analizada   → procesada por IA
//   cotizada    → cotización generada
//   archivada   → sin coincidencias, cerrada, o descartada manualmente
//   perdida     → fecha cierre pasada (auto)
// Limpieza automática: archivadas/perdidas > 30 días se eliminan

function calcPotencial(ia, productos) {
  if (!ia) return null;
  const enCatalogo = ia.productosEnCatalogo || ia.productosEncontrados || [];
  const detectados = ia.productosDetectados || [];
  const nuevos = ia.productosNuevos || [];
  const totalDetectados = detectados.length || (enCatalogo.length + nuevos.length) || 1;
  const coincidencia = enCatalogo.length / totalDetectados;
  const stockScore = enCatalogo.length > 0 ? enCatalogo.reduce((acc, p) => {
    const prod = productos.find(pr => pr.sku === p.sku || (pr.nombre||"").toLowerCase() === (p.nombre||"").toLowerCase());
    return acc + (prod && getStockTotal(prod) >= (p.cantidadEstimada||1) ? 1 : 0.5);
  }, 0) / enCatalogo.length : 0;
  const confMap = { alta:1, media:0.6, baja:0.3 };
  const confScore = enCatalogo.length > 0
    ? enCatalogo.reduce((a,p) => a + (confMap[p.confianza]||0.5), 0) / enCatalogo.length : 0;
  const score = coincidencia*0.5 + stockScore*0.3 + confScore*0.2;
  if (score >= 0.65) return { nivel:"alto",  color:"#15803d", bg:"#dcfce7", score };
  if (score >= 0.35) return { nivel:"medio", color:"#854d0e", bg:"#fef9c3", score };
  return                    { nivel:"bajo",  color:"#b91c1c", bg:"#fee2e2", score };
}

function BtnCotizar({op, nuevos, overrides, onCrearYCotizar}) {
  const [procesando, setProcesando] = useState(false);
  return (
    <Btn disabled={procesando} onClick={async()=>{
      setProcesando(true);
      try { await onCrearYCotizar(op, overrides); }
      catch(e) { console.error(e); toast("Error al generar cotización","danger"); }
      setProcesando(false);
    }} size="sm">
      {procesando ? "Procesando…" : nuevos.length>0 ? "Crear productos y cotizar" : "Generar cotización"}
    </Btn>
  );
}

function ModuloOportunidades({oportunidades,setOportunidades,productos,setProductos,
  empresas,setEmpresas,cots,setCots,config,perfil,nuevaCot,setModalCot,
  guardarProductoDB,guardarCotDB,empresasNombres=[],setDetalleCot,setTab}) {

  const [filtro,     setFiltro]     = useState("nuevas");
  const [sortBy,     setSortBy]     = useState("monto_desc");
  const [busqueda,   setBusqueda]   = useState("");
  const [analizando, setAnalizando] = useState(null);
  const [cola,       setCola]       = useState([]);
  const [seleccion,  setSeleccion]  = useState(new Set());
  const [modoSel,    setModoSel]    = useState(false);
  const [expandida,  setExpandida]  = useState(null);
  const [pagina,     setPagina]     = useState(1);
  const [showConfig, setShowConfig] = useState(false);
  const POR_PAGINA = 25;
  const fileRef = useRef();
  const colaRef = useRef([]);
  const detenerRef = useRef(false);
  const isMob = window.innerWidth < 768;

  // ── Limpieza automática 30 días ────────────────────────────
  useEffect(()=>{
    const hace30=new Date(); hace30.setDate(hace30.getDate()-30);
    const viejas=oportunidades.filter(o=>
      ["archivada","perdida"].includes(o.estado) &&
      o.importadaEn && new Date(o.importadaEn)<hace30
    );
    if(viejas.length>0){
      setOportunidades(prev=>prev.filter(o=>!viejas.find(v=>v.id===o.id)));
    }
  },[]);

  // ── Palabras clave ─────────────────────────────────────────
  const kwConfig  = (config.palabrasClave||"").split("\n").map(s=>s.trim().toLowerCase()).filter(Boolean);
  const kwProds   = productos.map(p=>p.nombre.toLowerCase().split(" ")).flat().filter(w=>w.length>3);
  const todasKW   = [...new Set([...kwConfig,...kwProds])];
  const matchKW   = nombre => { const n=nombre.toLowerCase(); return todasKW.filter(kw=>n.includes(kw)); };

  // ── Importar Excel ─────────────────────────────────────────
  const importarExcel = async(file) => {
    try {
      const XLSX=window.XLSX;
      if(!XLSX){toast("Librería Excel no cargada","danger");return;}
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:"array"});
      const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{raw:false});
      const hoy=new Date(); hoy.setHours(0,0,0,0);

      const nuevas=rows.map(r=>{
        const fechaCierre=r["Fecha de cierre"]||"";
        const parts=fechaCierre.split(" ")[0]; const [d,m,y]=parts.split("/");
        const cerrada=d&&m&&y&&new Date(y,m-1,d)<hoy;
        const matches=matchKW(r["Nombre"]||"");
        // Sin coincidencias o cerrada → archivada/perdida directamente
        const estado=cerrada?"perdida":matches.length===0?"archivada":"nueva";
        return {
          id: r["ID"]||uid(),
          nombre: r["Nombre"]||"",
          institucion: r["Institución"]||"",
          unidadCompra: r["Unidad de compra"]||"",
          fechaPublicacion: r["Fecha de publicación"]||"",
          fechaCierre,
          presupuesto: parseFloat(String(r["Presupuesto estimado"]||"0").replace(/[^0-9.]/g,""))||0,
          estadoConvocatoria: r["Estado de Convocatoria"]||"",
          cotizacionesEnviadas: Number(r["Cotizaciones enviadas"]||0),
          estado, matches, analisisIA:null, cotizacionId:null,
          importadaEn:nowISO(),
        };
      }).filter(o=>o.nombre);

      setOportunidades(prev=>{
        const existingIds=new Set(prev.map(o=>o.id));
        const novas=nuevas.filter(o=>!existingIds.has(o.id));
        const activas=novas.filter(o=>o.estado==="nueva").length;
        const archivadas=novas.filter(o=>o.estado==="archivada").length;
        const perdidas=novas.filter(o=>o.estado==="perdida").length;
        const dupes=nuevas.length-novas.length;
        toast(`${activas} nuevas con coincidencias · ${archivadas} sin coincidencias → archivadas · ${perdidas} cerradas → perdidas${dupes>0?" · "+dupes+" ya existían":""}`);
        // Save to DB
        if(novas.length>0 && supabase){
          supabase.from("oportunidades").upsert(novas.map(o=>({
            id:o.id, nombre:o.nombre, institucion:o.institucion,
            unidad_compra:o.unidadCompra, fecha_publicacion:o.fechaPublicacion,
            fecha_cierre:o.fechaCierre, presupuesto:o.presupuesto,
            estado_convocatoria:o.estadoConvocatoria,
            cotizaciones_enviadas:o.cotizacionesEnviadas,
            estado:o.estado, matches:o.matches||[],
          }))).then(({error})=>{if(error)console.error("Error guardando oportunidades:",error);});
        }
        return [...novas,...prev];
      });
      setPagina(1); setFiltro("nuevas");
    } catch(e){console.error(e);toast("Error al leer el Excel","danger");}
  };

  // ── Análisis IA ────────────────────────────────────────────
  const WORKER_URL="https://boreal-api-proxy.borealgroupsolutions.workers.dev";

  const analizarConIA = async(op) => {
    setAnalizando(op.id);
    try {
      const catalogoResumen=productos.map(p=>
        `- ${p.nombre} (SKU:${p.sku}, precio:${fmt(calcPrecioVenta(p.costo,p.margen))}, stock:${getStockTotal(p)} uds)`
      ).join("\n");
      const params=new URLSearchParams({id:op.id,catalogo:catalogoResumen});
      const resp=await fetch(`${WORKER_URL}/mp?${params}`);
      const data=await resp.json();
      const getAnalisis=(d)=>{
        if(!d.ok) return null;
        const a=d.analisis;
        if(a.productosEnCatalogo&&!a.productosEncontrados) a.productosEncontrados=a.productosEnCatalogo;
        a._source="web"; return a;
      };
      let analisis=getAnalisis(data);
      if(!analisis){
        // fallback
        const fb=await fetch(`${WORKER_URL}/anthropic`,{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:1000,
            messages:[{role:"user",content:`Eres asistente de ventas de limpieza en Chile. LICITACIÓN: ID:${op.id} Nombre:"${op.nombre}" Institución:${op.institucion} Presupuesto:${fmt(op.presupuesto)} Cierre:${op.fechaCierre}\nCATÁLOGO:\n${catalogoResumen}\nResponde SOLO JSON: {"relevante":true,"razon":"...","productosEncontrados":[{"sku":"...","nombre":"...","cantidadEstimada":1,"confianza":"alta/media/baja"}],"productosNuevos":[{"nombre":"...","descripcion":"...","cantidadEstimada":1}],"resumen":"...","recomendacion":"cotizar/descartar/revisar"}`}]})});
        const fd=await fb.json();
        const txt=fd.content?.[0]?.text||"{}";
        try{analisis=JSON.parse(txt.replace(/```json|```/g,"").trim());analisis._source="nombre";}catch{analisis={resumen:txt.slice(0,200),_source:"nombre"};}
      }
      const ts=nowISO();
      setOportunidades(prev=>prev.map(o=>o.id===op.id?{...o,estado:"analizada",analisisIA:analisis,analisisTs:ts}:o));
      if(supabase) supabase.from("oportunidades").upsert({id:op.id,estado:"analizada",analisis_ia:analisis,
        nombre:op.nombre,institucion:op.institucion,unidad_compra:op.unidadCompra,
        fecha_publicacion:op.fechaPublicacion,fecha_cierre:op.fechaCierre,presupuesto:op.presupuesto,
        estado_convocatoria:op.estadoConvocatoria,cotizaciones_enviadas:op.cotizacionesEnviadas,matches:op.matches||[]
      }).then(({error})=>{if(error)console.error("Error guardando analisis:",error);});
    } catch(e){console.error("Error IA:",e);toast("Error en análisis","danger");}
    setAnalizando(null);
  };

  // ── Cola ───────────────────────────────────────────────────
  const procesarCola = async(ids, snap) => {
    detenerRef.current=false;
    let completados=0;
    for(const id of ids){
      if(detenerRef.current){toast("Cola detenida — "+completados+" analizadas","warning");break;}
      const op=snap.find(o=>o.id===id);
      if(!op||op.analisisIA){completados++;continue;}
      await analizarConIA(op);
      completados++;
      if(completados<ids.length) await new Promise(r=>setTimeout(r,800));
    }
    setAnalizando(null); setCola([]); colaRef.current=[];
    setSeleccion(new Set()); setModoSel(false);
    if(!detenerRef.current){
      toast(`${completados} oportunidades analizadas`,"success",4000);
      setFiltro("analizadas");
      document.dispatchEvent(new CustomEvent("boreal-analisis-completo",{detail:{completados}}));
    }
  };

  const encolarAnalisis = (ids) => {
    const pendientes=ids.filter(id=>oportunidades.find(o=>o.id===id&&!o.analisisIA));
    if(!pendientes.length){toast("Todas ya fueron analizadas","warning");return;}
    toast(`Analizando ${pendientes.length} oportunidades…`);
    setCola(pendientes); colaRef.current=pendientes;
    procesarCola(pendientes,[...oportunidades]);
  };

  // ── Crear y cotizar ────────────────────────────────────────
  const crearYCotizar = async(op, overrides={}) => {
    const {analisisIA}=op; if(!analisisIA){toast("Primero analiza con IA","warning");return;}
    const enCatalogo=analisisIA.productosEnCatalogo||analisisIA.productosEncontrados||[];
    const detectados=analisisIA.productosDetectados||[];
    const nuevosIA=analisisIA.productosNuevos||[];
    const productosActuales=[...productos];
    const productosCreados=[];

    for(const pNuevo of nuevosIA){
      const yaExiste=productosActuales.find(p=>p.nombre.toLowerCase()===pNuevo.nombre.toLowerCase());
      if(yaExiste){productosCreados.push(yaExiste);continue;}
      const nuevo={id:uid(),sku:"MP-"+op.id.replace(/-/g,"").slice(0,6)+"-"+String(productosCreados.length+1).padStart(2,"0"),
        nombre:pNuevo.nombre,proveedor:"",costo:0,margen:30,foto_url:"",categoria:"Pendiente",
        stock:0,stockPorBodega:[],historialCostos:[],activo:false,updatedAt:nowISO()};
      productosActuales.push(nuevo);
      setProductos(prev=>[...prev,nuevo]);
      guardarProductoDB(nuevo);
      productosCreados.push(nuevo);
    }

    const todosItemsOrden=detectados.length>0?detectados:
      [...enCatalogo.map(p=>({nombre:p.nombre,cantidad:p.cantidadEstimada||1,unidad:"un"})),
       ...nuevosIA.map(p=>({nombre:p.nombre,cantidad:p.cantidadEstimada||1,unidad:"un"}))];

    const items=[];
    todosItemsOrden.forEach((det,i)=>{
      const cant=det.cantidad||1;
      const ovId=overrides[i];
      let prod=null;
      if(ovId==="nuevo"){ /* crear nuevo */ }
      else if(ovId){ prod=productosActuales.find(p=>p.id===ovId); }
      else {
        const m=enCatalogo.find(p=>
          det.nombre.toLowerCase().includes((p.nombre||"").toLowerCase().split(" ")[0])||
          (p.nombre||"").toLowerCase().includes(det.nombre.toLowerCase().split(" ")[0]));
        if(m) prod=productosActuales.find(p=>(m.sku&&p.sku===m.sku)||(p.nombre||"").toLowerCase()===(m.nombre||"").toLowerCase());
        if(!prod) prod=productosCreados.find(p=>p.nombre.toLowerCase().includes(det.nombre.toLowerCase().split(" ")[0]));
      }
      if(prod){
        const pv=calcPrecioVenta(prod.costo,prod.margen);
        items.push({productoId:prod.id,nombre:prod.nombre,sku:prod.sku,costo:prod.costo,precioVenta:pv,cantidad:cant,foto_url:prod.foto_url||"",proveedor:prod.proveedor||""});
      } else if(ovId==="nuevo"||(!prod&&nuevosIA.find(n=>n.nombre.toLowerCase().includes(det.nombre.toLowerCase().split(" ")[0])))){
        const pc=productosCreados.find(p=>p.nombre.toLowerCase().includes(det.nombre.toLowerCase().split(" ")[0]));
        if(pc) items.push({productoId:pc.id,nombre:pc.nombre,sku:pc.sku,costo:0,precioVenta:0,cantidad:cant,foto_url:"",proveedor:""});
      }
    });

    if(!items.length){toast("No se pudieron armar los ítems","warning");return;}
    const instNorm=(op.institucion||"").trim();
    if(instNorm&&!empresasNombres.includes(instNorm)) setEmpresas(prev=>[...prev,{nombre:instNorm,rut:"",email:"",telefono:"",direccion:""}]);
    const numCot="BOT-"+new Date().getFullYear()+"-"+String(cots.length+1).padStart(3,"0");
    const fechaVenc=op.fechaCierre?op.fechaCierre.split(" ")[0].split("/").reverse().join("-"):"";
    const notasInternas="Compra Ágil MP — ID: "+op.id+"\nPresupuesto: "+fmt(op.presupuesto)+(productosCreados.length>0?"\nProductos pendientes de precio: "+productosCreados.map(p=>p.nombre).join(", "):"");
    const tots=calcTotalesCot(items);
    const cot={id:uid(),numero:numCot,organismo:instNorm,rut_cliente:"",oportunidad_id:op.id,
      ejecutivo:perfil?.nombre||"",estado:"Para revisar",fecha:today(),fechaVencimiento:fechaVenc,
      items:items.map(({_pendiente,...r})=>r),notas:"",notasInternas,creadaEn:nowISO(),origenMP:true,
      total:tots.total,costoTotal:tots.costoTotal,margenProm:tots.margenProm};
    setCots(prev=>[cot,...prev]);
    guardarCotDB(cot);
    setOportunidades(prev=>prev.map(o=>o.id===op.id?{...o,estado:"cotizada",cotizacionId:cot.id}:o));
    if(setDetalleCot) setDetalleCot(cot);
    if(setTab) setTab("cotizaciones");
    toast("Cotización "+numCot+" creada"+(productosCreados.length>0?" — "+productosCreados.length+" productos pendientes de precio":""),"success",4000);
  };

  // ── Datos filtrados ────────────────────────────────────────
  const FILTROS=[
    {id:"nuevas",    label:"Con coincidencias", estados:["nueva","analizada","cotizada"]},
    {id:"analizadas",label:"Analizadas",         estados:["analizada","cotizada"]},
    {id:"archivadas",label:"Archivadas",          estados:["archivada"]},
    {id:"perdidas",  label:"Perdidas",            estados:["perdida"]},
    {id:"todas",     label:"Todas",               estados:["nueva","analizada","cotizada","archivada","perdida"]},
  ];
  const filtroActivo=FILTROS.find(f=>f.id===filtro)||FILTROS[0];

  const base=oportunidades.filter(o=>{
    if(!filtroActivo.estados.includes(o.estado)) return false;
    if(busqueda){
      const b=busqueda.toLowerCase();
      if(![o.nombre,o.institucion,o.id].some(x=>(x||"").toLowerCase().includes(b))) return false;
    }
    return true;
  });

  const sorted=[...base].sort((a,b)=>{
    if(sortBy==="monto_desc") return (b.presupuesto||0)-(a.presupuesto||0);
    if(sortBy==="monto_asc")  return (a.presupuesto||0)-(b.presupuesto||0);
    if(sortBy==="cierre_asc") return (a.fechaCierre||"").localeCompare(b.fechaCierre||"");
    if(sortBy==="potencial")  return (calcPotencial(b.analisisIA,productos)?.score||0)-(calcPotencial(a.analisisIA,productos)?.score||0);
    return 0;
  });

  const totalPags=Math.ceil(sorted.length/POR_PAGINA);
  const paginadas=sorted.slice((pagina-1)*POR_PAGINA,pagina*POR_PAGINA);

  const counts={
    nuevas:    oportunidades.filter(o=>["nueva","analizada","cotizada"].includes(o.estado)).length,
    analizadas:oportunidades.filter(o=>["analizada","cotizada"].includes(o.estado)).length,
    archivadas:oportunidades.filter(o=>o.estado==="archivada").length,
    perdidas:  oportunidades.filter(o=>o.estado==="perdida").length,
    todas:     oportunidades.length,
  };

  const ESTADOS_OP_COLORS={
    nueva:    {bg:"#eff6ff",text:"#1d4ed8",label:"Nueva"},
    analizada:{bg:"#fef9c3",text:"#854d0e",label:"Analizada"},
    cotizada: {bg:"#dcfce7",text:"#15803d",label:"Cotizada"},
    archivada:{bg:"#f1f5f9",text:"#94a3b8",label:"Archivada"},
    perdida:  {bg:"#fee2e2",text:"#b91c1c",label:"Perdida"},
  };

  const MP_URL = id => `https://buscador.mercadopublico.cl/ficha?code=${id}`;

  return (
    <div>
      {/* ── HEADER ──────────────────────────────────────────── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:10}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,marginBottom:2}}>Oportunidades</h1>
          <p style={{fontSize:13,color:"#64748b",margin:0}}>
            {counts.nuevas} con coincidencias · {counts.analizadas} analizadas · {counts.perdidas} perdidas
            {cola.length>0&&<span style={{marginLeft:8,color:"#1d4ed8",fontWeight:600}}>· Analizando {cola.indexOf(analizando)+1}/{cola.length}</span>}
          </p>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          {/* Filtros palabras clave */}
          <Btn onClick={()=>setShowConfig(v=>!v)} variant="ghost" size="sm">
            Filtros activos ({todasKW.length})
          </Btn>
          {/* Selección */}
          {!modoSel&&cola.length===0&&(
            <Btn onClick={()=>setModoSel(true)} variant="ghost" size="sm">Seleccionar</Btn>
          )}
          {modoSel&&(
            <>
              <span style={{fontSize:12,color:"#64748b"}}>{seleccion.size} sel.</span>
              <Btn onClick={()=>{setModoSel(false);setSeleccion(new Set());}} variant="ghost" size="sm">Cancelar</Btn>
              {seleccion.size>0&&<Btn onClick={()=>encolarAnalisis([...seleccion])} size="sm">Analizar {seleccion.size}</Btn>}
              {seleccion.size>0&&<Btn onClick={()=>{setOportunidades(prev=>prev.map(o=>seleccion.has(o.id)?{...o,estado:"archivada"}:o));setSeleccion(new Set());setModoSel(false);toast("Archivadas");}} variant="ghost" size="sm">Archivar sel.</Btn>}
            </>
          )}
          {/* Analizar todas con coincidencias */}
          {!modoSel&&cola.length===0&&oportunidades.filter(o=>o.estado==="nueva"&&!o.analisisIA).length>0&&(
            <Btn onClick={()=>encolarAnalisis(oportunidades.filter(o=>o.estado==="nueva"&&!o.analisisIA).map(o=>o.id))} variant="ghost" size="sm">
              Analizar todas ({oportunidades.filter(o=>o.estado==="nueva"&&!o.analisisIA).length})
            </Btn>
          )}
          {/* Detener cola */}
          {cola.length>0&&(
            <button onClick={()=>{detenerRef.current=true;}}
              style={{fontSize:12,color:"#b91c1c",background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:7,padding:"4px 12px",cursor:"pointer",fontWeight:600}}>
              Detener
            </button>
          )}
          {/* Reprocesar archivadas */}
          {filtro==="archivadas"&&counts.archivadas>0&&(
            <Btn onClick={()=>{
              setOportunidades(prev=>prev.map(o=>o.estado==="archivada"?{...o,matches:matchKW(o.nombre),estado:matchKW(o.nombre).length>0?"nueva":"archivada"}:o));
              toast("Reprocesando con filtros actualizados");
            }} variant="ghost" size="sm">Reprocesar con filtros actuales</Btn>
          )}
          <input type="file" ref={fileRef} accept=".xlsx,.xls" style={{display:"none"}}
            onChange={e=>{if(e.target.files[0])importarExcel(e.target.files[0]);e.target.value="";}}/>
          <Btn onClick={()=>fileRef.current?.click()} variant="dark" size="sm">Importar Excel</Btn>
        </div>
      </div>

      {/* ── CONFIG PALABRAS CLAVE ────────────────────────────── */}
      {showConfig&&(
        <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8}}>PALABRAS CLAVE ACTIVAS</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
            {todasKW.map(kw=>(
              <span key={kw} style={{fontSize:11,background:"#dbeafe",color:"#1d4ed8",padding:"2px 10px",borderRadius:20,border:"1px solid #bfdbfe"}}>{kw}</span>
            ))}
          </div>
          <div style={{fontSize:11,color:"#94a3b8"}}>Edita las palabras clave en Configuración → Oportunidades. Las palabras de tus productos se agregan automáticamente.</div>
          <button onClick={()=>setShowConfig(false)} style={{marginTop:8,fontSize:11,color:"#64748b",background:"none",border:"none",cursor:"pointer",padding:0}}>Cerrar</button>
        </div>
      )}

      {/* ── BARRA COLA ───────────────────────────────────────── */}
      {cola.length>0&&(
        <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
          <div style={{display:"flex",gap:3,flexShrink:0}}>
            {cola.slice(0,20).map((id,i)=>(
              <div key={id} style={{width:6,height:6,borderRadius:"50%",
                background:id===analizando?"#1d4ed8":i<cola.indexOf(analizando)?"#22c55e":"#cbd5e1"}}/>
            ))}
            {cola.length>20&&<span style={{fontSize:10,color:"#64748b"}}>+{cola.length-20}</span>}
          </div>
          <div style={{flex:1,fontSize:13,color:"#1d4ed8",fontWeight:500}}>
            {cola.indexOf(analizando)+1}/{cola.length} — {oportunidades.find(o=>o.id===analizando)?.nombre?.slice(0,60)||"…"}
          </div>
        </div>
      )}

      {/* ── EMPTY STATE ──────────────────────────────────────── */}
      {oportunidades.length===0&&(
        <div style={{background:"#fff",borderRadius:16,padding:"48px 24px",textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
          <div style={{width:56,height:56,background:"#f1f5f9",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",color:"#94a3b8"}}>{Ic.file}</div>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:8}}>Sin oportunidades</h3>
          <p style={{color:"#64748b",fontSize:13,marginBottom:20}}>Importa el Excel diario de Compras Ágiles desde mercadopublico.cl</p>
          <Btn onClick={()=>fileRef.current?.click()}>Importar Excel</Btn>
        </div>
      )}

      {/* ── TABS + BÚSQUEDA + SORT ───────────────────────────── */}
      {oportunidades.length>0&&(
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
          {/* Tabs */}
          <div style={{display:"flex",gap:2,background:"#f1f5f9",borderRadius:8,padding:3}}>
            {FILTROS.map(f=>(
              <button key={f.id} onClick={()=>{setFiltro(f.id);setPagina(1);}}
                style={{padding:"5px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,
                  fontWeight:filtro===f.id?600:400,
                  background:filtro===f.id?"#fff":"transparent",
                  color:filtro===f.id?"#0f172a":"#64748b",
                  boxShadow:filtro===f.id?"0 1px 3px rgba(0,0,0,.1)":"none",whiteSpace:"nowrap"}}>
                {f.label}{counts[f.id]>0?` (${counts[f.id]})`:""}</button>
            ))}
          </div>
          {/* Búsqueda */}
          <div style={{flex:1,minWidth:160,display:"flex",alignItems:"center",gap:8,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:"0 10px"}}>
            <span style={{color:"#94a3b8",display:"flex",flexShrink:0}}>{Ic.search}</span>
            <input value={busqueda} onChange={e=>{setBusqueda(e.target.value);setPagina(1);}}
              placeholder="Buscar nombre, ID o institución…"
              style={{flex:1,border:"none",outline:"none",fontSize:13,padding:"7px 0",background:"transparent"}}/>
            {busqueda&&<button onClick={()=>setBusqueda("")} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:16}}>×</button>}
          </div>
          {/* Sort */}
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
            style={{fontSize:12,padding:"6px 10px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#475569",cursor:"pointer"}}>
            <option value="monto_desc">Mayor monto primero</option>
            <option value="monto_asc">Menor monto primero</option>
            <option value="cierre_asc">Cierre más próximo</option>
            <option value="potencial">Mayor potencial</option>
          </select>
        </div>
      )}

      {/* ── LISTA ────────────────────────────────────────────── */}
      {paginadas.map(op=>(
        <OpCard key={op.id} op={op} expandida={expandida} setExpandida={setExpandida}
          analizando={analizando} enCola={cola.includes(op.id)}
          onAnalizar={analizarConIA} onCrearYCotizar={crearYCotizar}
          onArchivar={()=>setOportunidades(prev=>prev.map(o=>o.id===op.id?{...o,estado:"archivada"}:o))}
          onRestaurar={()=>setOportunidades(prev=>prev.map(o=>o.id===op.id?{...o,estado:o.matches?.length?"nueva":"archivada"}:o))}
          ESTADOS_OP_COLORS={ESTADOS_OP_COLORS} productos={productos}
          modoSel={modoSel} seleccionada={seleccion.has(op.id)}
          onToggleSel={()=>setSeleccion(prev=>{const s=new Set(prev);s.has(op.id)?s.delete(op.id):s.add(op.id);return s;})}
          mpUrl={MP_URL(op.id)}/>
      ))}

      {/* ── PAGINACIÓN ───────────────────────────────────────── */}
      {totalPags>1&&(
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,marginTop:16,paddingTop:16,borderTop:"1px solid #f1f5f9"}}>
          <Btn onClick={()=>setPagina(p=>Math.max(1,p-1))} disabled={pagina===1} variant="ghost" size="sm">← Anterior</Btn>
          <span style={{fontSize:13,color:"#64748b"}}>Pág. {pagina} de {totalPags} · {sorted.length} resultados</span>
          <Btn onClick={()=>setPagina(p=>Math.min(totalPags,p+1))} disabled={pagina===totalPags} variant="ghost" size="sm">Siguiente →</Btn>
        </div>
      )}
    </div>
  );
}

function OpCard({op,expandida,setExpandida,analizando,enCola,onAnalizar,onCrearYCotizar,
  onArchivar,onRestaurar,ESTADOS_OP_COLORS,productos,modoSel,seleccionada,onToggleSel,mpUrl}) {
  const isExp=expandida===op.id;
  const ec=ESTADOS_OP_COLORS[op.estado]||ESTADOS_OP_COLORS.nueva;
  const ia=op.analisisIA;
  const [copied,setCopied]=useState(false);
  const [overrides,setOverrides]=useState({});
  const [buscandoFila,setBuscandoFila]=useState(null);
  const [busqFila,setBusqFila]=useState("");
  const [dropPos,setDropPos]=useState({top:0,left:0,width:320});
  const potencial=ia?calcPotencial(ia,productos):null;

  const parseCierre=str=>{
    if(!str) return null;
    const [fecha,hora]=str.split(" ");
    const [d,m,y]=fecha.split("/");
    if(!d||!m||!y) return null;
    return {date:new Date(y,m-1,d),hora:hora||"",label:fecha};
  };
  const cierre=parseCierre(op.fechaCierre);
  const diasCierre=cierre?Math.ceil((cierre.date-new Date())/(1000*60*60*24)):null;
  const esCerrada=diasCierre!==null&&diasCierre<0;

  const copyUrl=e=>{
    e.stopPropagation();
    navigator.clipboard.writeText(mpUrl).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500);});
  };

  const enCatalogo=ia?(ia.productosEnCatalogo||ia.productosEncontrados||[]):[];
  const detectados=ia?(ia.productosDetectados||[]):[];
  const nuevos=ia?(ia.productosNuevos||[]):[];
  const puedeGenerar=ia&&(enCatalogo.length>0||nuevos.length>0);
  const UNITS={"EA":"un","BX":"cajas","GL":"galones","KG":"kg","LT":"lts","MT":"mts","UN":"un","UNI":"un","PACK":"pack"};

  const handleExpand=e=>{
    if(modoSel){e.stopPropagation();onToggleSel();return;}
    setExpandida(isExp?null:op.id);
  };

  return (
    <div style={{background:"#fff",borderRadius:12,marginBottom:8,
      boxShadow:potencial?.nivel==="alto"?"0 0 0 1.5px #86efac,0 1px 3px rgba(0,0,0,.06)":"0 1px 3px rgba(0,0,0,.06)",
      border:potencial?.nivel==="alto"?"1px solid #86efac":op.matches?.length?"1px solid #bfdbfe":"1px solid #f1f5f9",
      opacity:["archivada","perdida"].includes(op.estado)?.6:1,overflow:"hidden"}}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div style={{padding:"11px 14px",cursor:"pointer",display:"flex",alignItems:"flex-start",gap:10}}
        onClick={handleExpand}>
        {modoSel&&(
          <div onClick={e=>{e.stopPropagation();onToggleSel();}}
            style={{width:18,height:18,borderRadius:5,border:`2px solid ${seleccionada?"#1d4ed8":"#cbd5e1"}`,
              background:seleccionada?"#1d4ed8":"#fff",flexShrink:0,marginTop:2,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center"}}>
            {seleccionada&&<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="1.5,5 4,7.5 8.5,2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          </div>
        )}
        {enCola&&!modoSel&&<div style={{width:6,height:6,borderRadius:"50%",background:"#1d4ed8",flexShrink:0,marginTop:5,animation:"pulse 1s infinite"}}/>}

        <div style={{flex:1,minWidth:0}}>
          {/* Row 1: badges */}
          <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3,flexWrap:"wrap"}}>
            <button onClick={copyUrl} title="Copiar URL de Mercado Público"
              style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:copied?"#15803d":"#94a3b8",
                background:copied?"#dcfce7":"#f8fafc",border:"1px solid #e2e8f0",borderRadius:5,
                padding:"1px 6px",cursor:"pointer",display:"flex",alignItems:"center",gap:3,flexShrink:0}}>
              {op.id}{copied?" ✓":` `}{Ic.copy}
            </button>
            <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:ec.bg,color:ec.text,flexShrink:0}}>{ec.label}</span>
            {op.analisisTs&&<span style={{fontSize:9,color:"#94a3b8",flexShrink:0}}>analizado {op.analisisTs.slice(0,10)}</span>}
            {potencial&&<span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:potencial.bg,color:potencial.color,flexShrink:0}}>Potencial {potencial.nivel}</span>}
            {op.cotizacionesEnviadas>0&&<span style={{fontSize:10,color:"#854d0e",background:"#fef9c3",padding:"1px 6px",borderRadius:20,flexShrink:0}}>{op.cotizacionesEnviadas} cot.</span>}
            {op.matches?.slice(0,2).map(kw=><span key={kw} style={{fontSize:10,padding:"1px 5px",borderRadius:20,background:"#dbeafe",color:"#1d4ed8",flexShrink:0}}>{kw}</span>)}
          </div>
          {/* Row 2: nombre */}
          <div style={{fontSize:13,fontWeight:600,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{op.nombre}</div>
          {/* Row 3: institución + cierre + link */}
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:"#64748b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:300}}>{op.institucion}</span>
            {cierre&&<span style={{fontSize:10,fontWeight:esCerrada||diasCierre<=3?700:400,flexShrink:0,
              color:esCerrada?"#b91c1c":diasCierre<=1?"#b91c1c":diasCierre<=3?"#854d0e":"#94a3b8"}}>
              · {esCerrada?"Cerrada":"Cierra"} {cierre.label}{cierre.hora?" "+cierre.hora:""}{diasCierre!==null&&!esCerrada?` (${diasCierre===0?"hoy":diasCierre===1?"mañana":diasCierre+"d"})`:esCerrada?" (vencida)":""}
            </span>}
            <a href={mpUrl} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
              style={{fontSize:10,color:"#1d4ed8",textDecoration:"none",flexShrink:0}}>Ver en MP →</a>
          </div>
        </div>

        {/* Derecha: monto + prod count + chevron */}
        <div style={{textAlign:"right",flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
          <div style={{fontSize:14,fontWeight:700}}>{fmt(op.presupuesto)}</div>
          {ia&&enCatalogo.length>0&&<div style={{fontSize:10,color:"#64748b"}}>{enCatalogo.length}/{detectados.length||enCatalogo.length+nuevos.length} prod.</div>}
          <div style={{color:"#94a3b8",fontSize:11,transform:isExp?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</div>
        </div>
      </div>

      {/* ── EXPANDIDO ───────────────────────────────────────── */}
      {isExp&&(
        <div style={{borderTop:"1px solid #f1f5f9",background:"#fafafa",padding:"14px 16px"}}>

          {/* Sin análisis — botón directo sin texto extra */}
          {!ia&&(
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:0}}>
              <Btn onClick={()=>onAnalizar(op)} disabled={analizando===op.id} size="sm"
                style={{opacity:analizando===op.id?.6:1}}>
                {analizando===op.id?"Analizando…":"Analizar con IA"}
              </Btn>
              {!esCerrada&&<span style={{fontSize:12,color:"#94a3b8"}}>La IA leerá el detalle real desde Mercado Público</span>}
              {esCerrada&&<span style={{fontSize:12,color:"#b91c1c"}}>Licitación cerrada — solo análisis histórico</span>}
            </div>
          )}

          {/* Con análisis */}
          {ia&&(
            <>
              {/* Resumen + recomendación */}
              <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:12}}>
                <div style={{flex:1}}>
                  {ia._source&&<span style={{fontSize:10,background:ia._source==="web"?"#dcfce7":"#fef9c3",color:ia._source==="web"?"#15803d":"#854d0e",padding:"1px 7px",borderRadius:20,marginRight:6}}>{ia._source==="web"?"con detalle MP":"solo nombre"}</span>}
                  <p style={{fontSize:13,color:"#475569",lineHeight:1.5,margin:"6px 0 0"}}>{ia.resumen}</p>
                </div>
                {ia.recomendacion&&(
                  <span style={{flexShrink:0,fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20,
                    background:ia.recomendacion.includes("cotizar")&&!ia.recomendacion.includes("no")?"#dcfce7":ia.recomendacion.includes("descartar")?"#fee2e2":"#fef9c3",
                    color:ia.recomendacion.includes("cotizar")&&!ia.recomendacion.includes("no")?"#15803d":ia.recomendacion.includes("descartar")?"#b91c1c":"#854d0e"}}>
                    {ia.recomendacion.includes("cotizar")&&!ia.recomendacion.includes("no")?"Cotizar":ia.recomendacion.includes("descartar")?"Descartar":"Revisar"}
                  </span>
                )}
              </div>

              {/* Tabla productos */}
              {(()=>{
                const todosItems=detectados.length>0?detectados.map(det=>{
                  const m=enCatalogo.find(p=>det.nombre.toLowerCase().includes((p.nombre||"").toLowerCase().split(" ")[0])||(p.nombre||"").toLowerCase().includes(det.nombre.toLowerCase().split(" ")[0]));
                  const prod=m?productos.find(pr=>pr.sku===m.sku||(pr.nombre||"").toLowerCase()===(m.nombre||"").toLowerCase()):null;
                  return {det,prod,esNuevo:!prod};
                }):[...enCatalogo.map(p=>{
                  const prod=productos.find(pr=>pr.sku===p.sku||(pr.nombre||"").toLowerCase()===(p.nombre||"").toLowerCase());
                  return {det:{nombre:p.nombre,cantidad:p.cantidadEstimada||1,unidad:"un"},prod,esNuevo:!prod};
                }),...nuevos.map(p=>({det:{nombre:p.nombre,cantidad:p.cantidadEstimada||1,unidad:"un"},prod:null,esNuevo:true}))];
                if(!todosItems.length) return null;
                return (
                  <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",marginBottom:12,overflow:"hidden"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 80px 1fr",padding:"6px 12px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
                      <span style={{fontSize:10,fontWeight:700,color:"#64748b"}}>SOLICITAN</span>
                      <span style={{fontSize:10,fontWeight:700,color:"#64748b",textAlign:"center"}}>CANT.</span>
                      <span style={{fontSize:10,fontWeight:700,color:"#64748b",textAlign:"right"}}>EN TU CATÁLOGO</span>
                    </div>
                    {todosItems.map(({det,prod:prodIA,esNuevo},i)=>{
                      const ovId=overrides[i];
                      const prod=ovId==="nuevo"?null:ovId?productos.find(p=>p.id===ovId):prodIA;
                      const crearNuevo=ovId==="nuevo"||(esNuevo&&ovId===undefined);
                      const cant=det.cantidad||1;
                      const unidad=UNITS[det.unidad?.toUpperCase()]||det.unidad||"un";
                      const stock=prod?getStockTotal(prod):0;
                      const stockOk=prod&&stock>=cant;
                      const prodsFiltrados=productos.filter(p=>p.activo!==false&&(!busqFila||p.nombre.toLowerCase().includes(busqFila.toLowerCase())||(p.sku||"").toLowerCase().includes(busqFila.toLowerCase()))).slice(0,8);
                      return (
                        <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 80px 1fr",padding:"8px 12px",borderBottom:i<todosItems.length-1?"1px solid #f8fafc":"none",alignItems:"center",gap:8,background:crearNuevo?"#fffbeb":"#fff"}}>
                          <div style={{minWidth:0}}>
                            <div style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{det.nombre}</div>
                            {det.descripcionOriginal&&det.descripcionOriginal!==det.nombre&&(
                              <div style={{fontSize:10,color:"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={det.descripcionOriginal}>{det.descripcionOriginal}</div>
                            )}
                            {crearNuevo&&<div style={{fontSize:10,color:"#d97706"}}>Nuevo — se creará inactivo</div>}
                          </div>
                          <div style={{fontSize:12,fontWeight:500,textAlign:"center"}}>{cant} {unidad}</div>
                          <div style={{minWidth:0}}>
                            {buscandoFila===i?(
                              <div style={{position:"relative"}}>
                                <input autoFocus value={busqFila} onChange={e=>setBusqFila(e.target.value)}
                                  placeholder="Buscar…" onBlur={()=>setTimeout(()=>{setBuscandoFila(null);setBusqFila("");},250)}
                                  style={{width:"100%",fontSize:12,padding:"4px 8px",borderRadius:6,border:"1px solid #1d4ed8",outline:"none",boxSizing:"border-box"}}/>
                                <div style={{position:"fixed",top:dropPos.top,left:dropPos.left,width:Math.max(dropPos.width,300),background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,.15)",zIndex:9999,maxHeight:260,overflowY:"auto"}}>
                                  <div onMouseDown={e=>e.preventDefault()} onClick={()=>{setOverrides(p=>({...p,[i]:"nuevo"}));setBuscandoFila(null);setBusqFila("");}}
                                    style={{padding:"8px 12px",fontSize:12,color:"#d97706",fontWeight:600,cursor:"pointer",borderBottom:"1px solid #f1f5f9",background:"#fffbeb"}}
                                    onMouseEnter={e=>e.currentTarget.style.background="#fef3c7"}
                                    onMouseLeave={e=>e.currentTarget.style.background="#fffbeb"}>
                                    + Crear como producto nuevo
                                  </div>
                                  {prodsFiltrados.map(p=>(
                                    <div key={p.id} onMouseDown={e=>e.preventDefault()} onClick={()=>{setOverrides(prev=>({...prev,[i]:p.id}));setBuscandoFila(null);setBusqFila("");}}
                                      style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",cursor:"pointer",borderBottom:"1px solid #f8fafc"}}
                                      onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                                      onMouseLeave={e=>e.currentTarget.style.background=""}>
                                      {p.foto_url?<img src={p.foto_url} alt="" style={{width:32,height:32,objectFit:"contain",borderRadius:5,background:"#f8fafc",flexShrink:0}}/>
                                        :<div style={{width:32,height:32,background:"#f1f5f9",borderRadius:5,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#cbd5e1"}}>{Ic.box}</div>}
                                      <div style={{flex:1,minWidth:0}}>
                                        <div style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.nombre}</div>
                                        <div style={{fontSize:11,color:"#94a3b8"}}>{p.sku} · {getStockTotal(p)} uds · {fmt(calcPrecioVenta(p.costo,p.margen))}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ):(
                              <button onClick={e=>{const r=e.currentTarget.getBoundingClientRect();setDropPos({top:r.bottom+4,left:r.left,width:Math.max(r.width,300)});setBuscandoFila(i);setBusqFila("");}}
                                style={{width:"100%",textAlign:"left",background:"none",border:"1px solid #e2e8f0",borderRadius:6,padding:"5px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                                {prod?(
                                  <>
                                    {prod.foto_url?<img src={prod.foto_url} alt="" style={{width:24,height:24,objectFit:"contain",borderRadius:4,background:"#f8fafc",flexShrink:0}}/>
                                      :<div style={{width:24,height:24,background:"#f1f5f9",borderRadius:4,flexShrink:0}}/>}
                                    <div style={{flex:1,minWidth:0}}>
                                      <div style={{fontSize:11,fontWeight:600,color:stockOk?"#15803d":"#b91c1c",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{stockOk?"✓":"⚠"} {prod.nombre}</div>
                                      <div style={{fontSize:10,color:"#94a3b8"}}>{stock} disp.</div>
                                    </div>
                                  </>
                                ):crearNuevo?(
                                  <span style={{fontSize:11,color:"#d97706",fontWeight:500}}>Crear nuevo</span>
                                ):(
                                  <span style={{fontSize:11,color:"#94a3b8"}}>Sin match — elegir</span>
                                )}
                                <span style={{color:"#94a3b8",fontSize:10,flexShrink:0,marginLeft:"auto"}}>✎</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </>
          )}

          {/* Acciones */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            {ia&&op.estado!=="cotizada"&&op.estado!=="archivada"&&op.estado!=="perdida"&&puedeGenerar&&(
              <BtnCotizar op={op} nuevos={nuevos} overrides={overrides} onCrearYCotizar={onCrearYCotizar}/>
            )}
            {ia&&<Btn onClick={()=>onAnalizar(op)} variant="ghost" size="sm" disabled={analizando===op.id}
              style={{opacity:analizando===op.id?.6:1}}>{analizando===op.id?"Analizando…":"Re-analizar"}</Btn>}
            {!["archivada","perdida","cotizada"].includes(op.estado)&&(
              <Btn onClick={onArchivar} variant="ghost" size="sm">Archivar</Btn>
            )}
            {["archivada","perdida"].includes(op.estado)&&(
              <Btn onClick={onRestaurar} variant="ghost" size="sm">Restaurar</Btn>
            )}
            <a href={mpUrl} target="_blank" rel="noreferrer"
              style={{fontSize:12,color:"#1d4ed8",textDecoration:"none",marginLeft:"auto"}}>Ver en MP →</a>
          </div>
        </div>
      )}
    </div>
  );
}

