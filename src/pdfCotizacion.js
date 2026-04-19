import { EMPRESA_INFO } from "./constants.js";

const fmt  = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n||0);
const fmtN = n => new Intl.NumberFormat("es-CL",{maximumFractionDigits:0}).format(n||0);
const fmtDate = s => { if(!s)return"—"; const[y,m,d]=s.split("-"); return`${d}/${m}/${y}`; };
const addDays = (s,n) => { const d=new Date(s||new Date()); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };

function calcTotales(items=[]) {
  const neto = items.reduce((a,i)=>a+(i.precioVenta/1.19)*i.cantidad,0);
  const iva  = neto*0.19;
  return {neto:Math.round(neto),iva:Math.round(iva),total:Math.round(neto+iva)};
}

export function generarPDFCotizacion(cot, logoB64) {
  const {neto,iva,total} = calcTotales(cot.items);
  const venc = addDays(cot.fecha, cot.diasVencimiento||10);

  const rows = (cot.items||[]).map(item => `
    <tr>
      <td class="img-cell">
        ${item.foto_url
          ? `<img src="${item.foto_url}" class="prod-img"/>`
          : `<div class="no-img">&#128230;</div>`}
      </td>
      <td class="prod-cell">
        <div class="prod-name">${item.nombre}</div>
        ${item.sku?`<div class="prod-sku">${item.sku}</div>`:""}
      </td>
      <td class="num-cell">${fmtN(item.cantidad)} uds.</td>
      <td class="num-cell">${fmt(Math.round(item.precioVenta/1.19))}</td>
      <td class="num-cell tax">IVA 19%</td>
      <td class="num-cell total-col">${fmt(Math.round(item.precioVenta/1.19*item.cantidad))}</td>
    </tr>`).join("");

  const notas = cot.notas
    ? cot.notas.split("\n").filter(l=>l.trim()).map(l=>`<li>${l.trim()}</li>`).join("")
    : `<li>Despacho incluido sin costo adicional, segun condiciones estandar.</li>
       <li>Oferta valida hasta la fecha de vencimiento indicada.</li>
       <li>Seguimiento y atencion comercial durante todo el proceso.</li>`;

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1e293b;background:#fff}
  .page{max-width:800px;margin:0 auto;padding:48px 52px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;padding-bottom:24px;border-bottom:2px solid #e2e8f0}
  .logo{height:56px;object-fit:contain}
  .company-meta{text-align:right;font-size:9.5px;color:#64748b;line-height:1.7}
  .doc-badge{display:inline-block;background:#0ea5e9;color:#fff;font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:4px 12px;border-radius:4px;margin-bottom:10px}
  .doc-title{font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;margin-bottom:4px}
  .doc-number{font-size:13px;color:#64748b;margin-bottom:28px}
  .info-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:28px}
  .info-box{border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;background:#f8fafc}
  .info-box-label{font-size:8.5px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:700;margin-bottom:8px}
  .info-line{margin-bottom:3px;line-height:1.5}
  .info-line strong{color:#0f172a;font-weight:600}
  table{width:100%;border-collapse:collapse;margin-bottom:24px}
  thead tr{background:#0f172a}
  thead th{padding:10px 14px;text-align:left;font-size:9.5px;font-weight:600;color:#f8fafc;letter-spacing:0.4px;white-space:nowrap}
  thead th.num-h{text-align:right}
  tbody tr{border-bottom:1px solid #f1f5f9}
  tbody tr:nth-child(even){background:#f8fafc}
  td{padding:10px 14px;vertical-align:middle}
  .img-cell{width:54px;padding:8px 10px}
  .prod-img{width:38px;height:38px;object-fit:cover;border-radius:5px;border:1px solid #e2e8f0;display:block}
  .no-img{width:38px;height:38px;background:#f1f5f9;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:20px;text-align:center;line-height:38px}
  .prod-cell{min-width:160px}
  .prod-name{font-weight:600;font-size:11px;color:#0f172a;line-height:1.4}
  .prod-sku{font-size:9px;color:#94a3b8;margin-top:2px}
  .num-cell{text-align:right;white-space:nowrap}
  .tax{color:#94a3b8;font-size:10px}
  .total-col{font-weight:700;color:#0f172a}
  .totals-wrap{display:flex;justify-content:flex-end;margin-bottom:32px}
  .totals{width:260px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
  .totals-row{display:flex;justify-content:space-between;padding:9px 16px;font-size:11px;border-bottom:1px solid #f1f5f9}
  .totals-row span:first-child{color:#64748b}
  .totals-final{display:flex;justify-content:space-between;padding:12px 16px;background:#0ea5e9;color:#fff;font-size:14px;font-weight:700}
  .conditions{border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:28px;background:#fafafa}
  .conditions h3{font-size:10px;font-weight:700;color:#0f172a;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.6px}
  .conditions ul{padding-left:16px}
  .conditions li{margin-bottom:5px;color:#475569;line-height:1.5;font-size:10.5px}
  .exec-box{border-left:3px solid #0ea5e9;padding:12px 18px;background:#f0f9ff;border-radius:0 8px 8px 0;margin-bottom:24px}
  .exec-title{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#0369a1;font-weight:700;margin-bottom:6px}
  .exec-name{font-size:12px;font-weight:700;color:#0f172a;margin-bottom:2px}
  .exec-sub{font-size:10px;color:#0369a1}
  .footer{border-top:1px solid #e2e8f0;padding-top:14px;text-align:center;font-size:9px;color:#94a3b8;line-height:1.7}
  .footer-brand{font-size:14px;font-weight:700;color:#0ea5e9;margin-bottom:4px}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:32px}}
</style></head><body>
<div class="page">
  <div class="header">
    <div>${logoB64?`<img src="data:image/png;base64,${logoB64}" class="logo"/>`:`<div style="font-size:24px;font-weight:700;color:#0ea5e9">Boreal</div>`}</div>
    <div class="company-meta">
      <div style="font-weight:700;color:#0f172a;font-size:11px;margin-bottom:4px">${EMPRESA_INFO.nombre}</div>
      <div>RUT: ${EMPRESA_INFO.rut}</div><div>${EMPRESA_INFO.giro}</div>
      <div>${EMPRESA_INFO.email}</div><div>${EMPRESA_INFO.web}</div>
    </div>
  </div>
  <div class="doc-badge">Presupuesto Comercial</div>
  <div class="doc-title">N&#176; ${cot.numero}</div>
  <div class="doc-number">Generado el ${fmtDate(cot.fecha)}</div>
  <div class="info-row">
    <div class="info-box">
      <div class="info-box-label">Detalles del presupuesto</div>
      <div class="info-line"><strong>Fecha:</strong> ${fmtDate(cot.fecha)}</div>
      <div class="info-line"><strong>Vencimiento:</strong> ${fmtDate(venc)}</div>
      <div class="info-line"><strong>Referencia OC:</strong> ${cot.oportunidad_id||"&#8212;"}</div>
      <div class="info-line"><strong>Ejecutivo:</strong> ${EMPRESA_INFO.ejecutivo}</div>
    </div>
    <div class="info-box">
      <div class="info-box-label">Destinatario</div>
      <div class="info-line" style="font-weight:700;color:#0f172a;font-size:12px">${cot.organismo||"&#8212;"}</div>
      ${cot.rut_cliente?`<div class="info-line">RUT: ${cot.rut_cliente}</div>`:""}
      ${cot.direccion_cliente?`<div class="info-line">${cot.direccion_cliente}</div>`:""}
    </div>
  </div>
  <table>
    <thead><tr>
      <th style="width:54px"></th><th>Producto</th>
      <th class="num-h" style="width:90px">Cantidad</th>
      <th class="num-h" style="width:110px">Precio unit.</th>
      <th class="num-h" style="width:70px">Impuesto</th>
      <th class="num-h" style="width:110px">Importe</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals-wrap">
    <div class="totals">
      <div class="totals-row"><span>Importe base</span><span>${fmt(neto)}</span></div>
      <div class="totals-row"><span>IVA 19%</span><span>${fmt(iva)}</span></div>
      <div class="totals-final"><span>Total</span><span>${fmt(total)}</span></div>
    </div>
  </div>
  <div class="conditions"><h3>Condiciones de la propuesta</h3><ul>${notas}</ul></div>
  <div class="exec-box">
    <div class="exec-title">Ejecutivo responsable</div>
    <div class="exec-name">${EMPRESA_INFO.ejecutivo}</div>
    <div class="exec-sub">${EMPRESA_INFO.cargo} &middot; ${EMPRESA_INFO.fono} &middot; ${EMPRESA_INFO.email}</div>
  </div>
  <div class="footer">
    <div class="footer-brand">Boreal</div>
    ${EMPRESA_INFO.nombre} &middot; RUT ${EMPRESA_INFO.rut}<br/>
    ${EMPRESA_INFO.giro}<br/>
    ${EMPRESA_INFO.email} &middot; ${EMPRESA_INFO.web}
  </div>
</div>
<script>setTimeout(function(){window.print();},600);</script>
</body></html>`;

  const w = window.open("","_blank","width=900,height=750");
  if(w){ w.document.write(html); w.document.close(); }
}
