import { EMPRESA_INFO } from "./constants";

const fmt = n => new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n||0);

export async function generarPDFCotizacion(cotizacion, logoB64) {
  const { subtotalNeto, iva, total } = calcTotales(cotizacion.items || []);
  const vencimiento = addDays(cotizacion.fecha, 10);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: #fff; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; }
  .logo { height: 60px; }
  .company-info { text-align: right; font-size: 10px; color: #64748b; line-height: 1.6; }
  .doc-title { color: #0ea5e9; font-size: 20px; font-weight: 700; margin-bottom: 4px; }
  .doc-number { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 20px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  .info-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; background: #f8fafc; }
  .info-box-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; font-weight: 600; margin-bottom: 6px; }
  .info-row { margin-bottom: 3px; }
  .info-row strong { color: #0f172a; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead tr { background: #0f172a; color: #fff; }
  thead th { padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; }
  thead th:last-child { text-align: right; }
  tbody tr { border-bottom: 1px solid #f1f5f9; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  td { padding: 10px 12px; vertical-align: middle; }
  td.num { text-align: right; font-weight: 500; }
  .prod-img { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0; }
  .prod-img-placeholder { width: 40px; height: 40px; background: #f1f5f9; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .totals { margin-left: auto; width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
  .totals-total { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; font-weight: 700; color: #0ea5e9; border-top: 2px solid #0ea5e9; margin-top: 4px; }
  .conditions { border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px; margin-bottom: 20px; }
  .conditions h3 { font-size: 11px; font-weight: 700; margin-bottom: 8px; color: #0f172a; }
  .conditions li { margin-left: 16px; margin-bottom: 4px; color: #475569; }
  .footer { border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; font-size: 9px; color: #94a3b8; margin-top: 20px; }
  .exec { margin-top: 16px; padding: 12px 16px; background: #f8fafc; border-radius: 6px; }
  .exec strong { color: #0f172a; font-size: 11px; }
  .exec span { color: #64748b; font-size: 10px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      ${logoB64 ? `<img src="data:image/png;base64,${logoB64}" class="logo"/>` : `<div style="font-size:22px;font-weight:700;color:#0ea5e9">Boreal</div>`}
      <div style="font-size:10px;color:#64748b;margin-top:6px">${EMPRESA_INFO.nombre}</div>
    </div>
    <div class="company-info">
      <div>RUT: ${EMPRESA_INFO.rut}</div>
      <div>${EMPRESA_INFO.giro}</div>
      <div>${EMPRESA_INFO.email}</div>
      <div>${EMPRESA_INFO.web}</div>
    </div>
  </div>

  <div class="doc-title">Presupuesto Comercial</div>
  <div class="doc-number">N° ${cotizacion.numero}</div>

  <div class="info-grid">
    <div class="info-box">
      <div class="info-box-label">Información del presupuesto</div>
      <div class="info-row"><strong>Fecha:</strong> ${formatDate(cotizacion.fecha)}</div>
      <div class="info-row"><strong>Vencimiento:</strong> ${formatDate(vencimiento)}</div>
      <div class="info-row"><strong>OC / Referencia:</strong> ${cotizacion.oportunidad_id || "—"}</div>
      <div class="info-row"><strong>Ejecutivo:</strong> ${EMPRESA_INFO.ejecutivo}</div>
    </div>
    <div class="info-box">
      <div class="info-box-label">Destinatario</div>
      <div class="info-row"><strong>${cotizacion.organismo}</strong></div>
      ${cotizacion.rut_cliente ? `<div class="info-row">RUT: ${cotizacion.rut_cliente}</div>` : ""}
      ${cotizacion.direccion_cliente ? `<div class="info-row">${cotizacion.direccion_cliente}</div>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:50px">Imagen</th>
        <th>Producto</th>
        <th style="width:90px">Cantidad</th>
        <th style="width:110px;text-align:right">Precio unitario</th>
        <th style="width:70px;text-align:right">Impuesto</th>
        <th style="width:110px;text-align:right">Importe</th>
      </tr>
    </thead>
    <tbody>
      ${(cotizacion.items||[]).map(item => `
      <tr>
        <td>
          ${item.foto_url
            ? `<img src="${item.foto_url}" class="prod-img" onerror="this.style.display='none'"/>`
            : `<div class="prod-img-placeholder">📦</div>`
          }
        </td>
        <td>
          <div style="font-weight:600;font-size:11px">${item.nombre}</div>
          ${item.sku ? `<div style="font-size:9px;color:#94a3b8">${item.sku}</div>` : ""}
        </td>
        <td>${item.cantidad} Unidades</td>
        <td class="num">${fmt(Math.round(item.precioVenta / 1.19))}</td>
        <td class="num" style="color:#64748b">IVA 19%</td>
        <td class="num">${fmt(Math.round(item.precioVenta / 1.19 * item.cantidad))}</td>
      </tr>`).join("")}
    </tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;margin-bottom:24px">
    <div class="totals">
      <div class="totals-row"><span>Importe base</span><span>${fmt(subtotalNeto)}</span></div>
      <div class="totals-row"><span>IVA 19%</span><span>${fmt(iva)}</span></div>
      <div class="totals-total"><span>Total</span><span>${fmt(total)}</span></div>
    </div>
  </div>

  ${cotizacion.notas ? `
  <div class="conditions">
    <h3>Condiciones de la propuesta</h3>
    <ul>
      ${cotizacion.notas.split("\n").filter(l=>l.trim()).map(l=>`<li>${l.trim()}</li>`).join("")}
    </ul>
  </div>` : `
  <div class="conditions">
    <h3>Condiciones de la propuesta</h3>
    <ul>
      <li>Despacho incluido sin costo adicional, según condiciones estándar.</li>
      <li>Oferta válida hasta la fecha indicada en el presente documento.</li>
      <li>Seguimiento y atención comercial durante todo el proceso.</li>
    </ul>
  </div>`}

  <div class="exec">
    <div><strong>Ejecutivo responsable</strong></div>
    <div><strong>${EMPRESA_INFO.ejecutivo}</strong> — <span>${EMPRESA_INFO.cargo}</span></div>
    <div><span>${EMPRESA_INFO.fono} | ${EMPRESA_INFO.email}</span></div>
  </div>

  <div class="footer">
    ${EMPRESA_INFO.nombre} · RUT ${EMPRESA_INFO.rut}<br/>
    ${EMPRESA_INFO.giro}<br/>
    ${EMPRESA_INFO.email} · ${EMPRESA_INFO.web}
  </div>
</body>
</html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

function calcTotales(items) {
  const subtotalNeto = items.reduce((a,i) => a + (i.precioVenta/1.19)*i.cantidad, 0);
  const iva = subtotalNeto * 0.19;
  return { subtotalNeto: Math.round(subtotalNeto), iva: Math.round(iva), total: Math.round(subtotalNeto + iva) };
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const [y,m,d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function addDays(dateStr, days) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0,10);
}
