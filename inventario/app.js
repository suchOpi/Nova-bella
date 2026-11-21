/* Nova Bella · Boceto del sistema de inventario (prototipo navegable)
   Sin servidor: los datos se guardan en localStorage del navegador. */
"use strict";

const KEY = "nb_inv_v1";
const COLORS = { Negro:"#2b2b2b", Beige:"#d9c3a5", Rosado:"#f4a6c1", Blanco:"#ffffff", Rojo:"#c0283d", Nude:"#e8c4b0" };
const LINEAS = ["Clásica", "Urbana", "Fiesta"];           // "manejo 3 líneas" (nombres de ejemplo, editables)
const TALLAS = ["35","36","37","38","39","40"];

/* ---------- utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const bs = n => "Bs " + (Math.round(n * 100) / 100).toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = v => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; };
const today = () => new Date().toISOString().slice(0, 10);
const noAcc = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const makeCode = (linea, modelo, color, talla) =>
  noAcc(`NB-${linea.slice(0,2)}${modelo.slice(0,3)}-${color.slice(0,3)}-${talla}`).toUpperCase().replace(/\s+/g, "");
const unitCost = (usd, pct, tc1, tc2, flete, qty) => usd * (pct / 100 * tc1 + (1 - pct / 100) * tc2) + (qty ? flete / qty : 0);
const roundPrice = n => Math.round(n / 10) * 10;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("show"), 2200); }

/* ---------- datos ---------- */
function addStock(s, lot) {
  const total = lot.items.reduce((a, i) => a + i.qty, 0);
  lot.costBsUnit = unitCost(lot.costUsd, lot.pct1, lot.tc1, lot.tc2, lot.flete, total);
  const fleteUnit = total ? lot.flete / total : 0;
  lot.items.forEach(it => {
    let v = s.variants.find(x => x.modelo === lot.modelo && x.color === lot.color && x.talla === it.talla);
    if (!v) {
      v = { id: "v" + (s.variants.length + 1) + Math.random().toString(36).slice(2, 5), code: makeCode(lot.linea, lot.modelo, lot.color, it.talla),
            modelo: lot.modelo, linea: lot.linea, color: lot.color, talla: it.talla, stock: 0, costUsd: lot.costUsd, fleteUnit, costBs: lot.costBsUnit, precio: lot.precio };
      s.variants.push(v);
    }
    const old = v.stock, nw = it.qty, tot = old + nw;
    v.costUsd = (v.costUsd * old + lot.costUsd * nw) / tot;      // costo promedio ponderado
    v.fleteUnit = (v.fleteUnit * old + fleteUnit * nw) / tot;
    v.costBs = (v.costBs * old + lot.costBsUnit * nw) / tot;
    v.stock = tot; v.precio = lot.precio; v.code = v.code || makeCode(lot.linea, lot.modelo, lot.color, it.talla);
    it.code = v.code;
  });
  s.lots.unshift(lot);
}

function seed() {
  const s = {
    cfg: { tc: 11.60, tc2: 11.90, pct1: 70, margen: 55 },
    users: [
      { id: "u1", name: "Naty (Propietaria)", rol: "super" },
      { id: "u2", name: "Vendedora 1", rol: "vendedor" }
    ],
    branches: [
      { id: "b1", name: "Santa Cruz · Tienda principal", activa: true },
      { id: "b2", name: "La Paz · apertura prevista", activa: false }
    ],
    variants: [], lots: [], sales: [],
    clients: [
      { id: "c1", name: "Mostrador", tel: "", nit: "0" },
      { id: "c2", name: "María Fernández", tel: "70012345", nit: "4521890" },
      { id: "c3", name: "Lucía Rojas", tel: "76543210", nit: "6677123" }
    ],
    seq: { sale: 1 }
  };
  const models = [
    ["Clásica","Aurora","Negro",22,[["36",4],["37",6],["38",6],["39",3]]],
    ["Clásica","Aurora","Beige",22,[["36",3],["37",5],["38",5],["39",2]]],
    ["Clásica","Luna","Nude",24,[["36",2],["37",4],["38",4],["39",1]]],
    ["Urbana","Brisa","Blanco",26,[["37",5],["38",6],["39",4],["40",2]]],
    ["Urbana","Nube","Rosado",26,[["36",3],["37",4],["38",3],["39",2]]],
    ["Fiesta","Estrella","Rojo",30,[["35",2],["36",3],["37",3],["38",2]]],
    ["Fiesta","Dalia","Negro",30,[["36",2],["37",3],["38",3],["39",2]]]
  ];
  models.forEach((m, i) => {
    const cu = unitCost(m[3], 70, 11.6, 11.9, 0, 1) + 14;
    addStock(s, { id: "L" + (i + 1), fecha: "2026-10-" + String(5 + i).padStart(2, "0"), linea: m[0], modelo: m[1], color: m[2],
      items: m[4].map(([talla, qty]) => ({ talla, qty })), costUsd: m[3], tc1: 11.6, tc2: 11.9, pct1: 70, flete: 14 * m[4].reduce((a, x) => a + x[1], 0),
      precio: roundPrice(cu * 1.55), proveedor: "Fábrica", pagoEf: 0 });
  });
  // ventas de ejemplo (últimos 45 días) para que los reportes tengan datos
  let r = 7; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  for (let d = 45; d >= 0; d--) {
    const n = Math.floor(rnd() * 3);
    for (let k = 0; k < n; k++) {
      const v = s.variants[Math.floor(rnd() * s.variants.length)];
      if (v.stock < 2) continue;
      const qty = 1; const desc = rnd() < .25 ? 10 : 0;
      const dt = new Date(Date.now() - d * 864e5).toISOString();
      const total = (v.precio - desc) * qty, ef = rnd() < .5 ? total : Math.round(total * .4);
      v.stock -= qty;
      s.sales.push({ id: "V-" + String(s.seq.sale++).padStart(4, "0"), fecha: dt, userId: rnd() < .5 ? "u1" : "u2", clientId: "c1",
        items: [{ vid: v.id, code: v.code, desc: `${v.modelo} ${v.color} T${v.talla}`, qty, lista: v.precio, precio: v.precio - desc, costBs: v.costBs }],
        total, efectivo: ef, qr: total - ef, doc: rnd() < .35 ? "factura" : "nota", nit: "", cambios: [] });
    }
  }
  return s;
}

let S = (() => { try { const j = localStorage.getItem(KEY); if (j) return JSON.parse(j); } catch (e) {} return seed(); })();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

/* ---------- estado de UI ---------- */
const ui = { user: null, view: "dashboard", cart: [], q: "", doc: "nota", clientId: "c1", efectivo: null, nit: "", period: "mes", stockQ: "", ingreso: null, menu: false };
const isSuper = () => ui.user && ui.user.rol === "super";

const NAV = [
  ["dashboard", "🏠", "Panel", ["super", "vendedor"]],
  ["pos", "🛍️", "Punto de venta", ["super", "vendedor"]],
  ["stock", "👠", "Productos y stock", ["super", "vendedor"]],
  ["ingreso", "📦", "Ingreso de mercadería", ["super"]],
  ["ventas", "🧾", "Ventas y cambios", ["super", "vendedor"]],
  ["clientes", "👥", "Clientes", ["super", "vendedor"]],
  ["reportes", "📊", "Reportes y Excel", ["super"]],
  ["sucursales", "🏬", "Sucursales", ["super"]],
  ["usuarios", "🔐", "Usuarios y permisos", ["super"]],
  ["ajustes", "💱", "Tipo de cambio", ["super"]]
];

/* ---------- render raíz ---------- */
function render() {
  const app = $("#app");
  if (!ui.user) { app.innerHTML = loginView(); return; }
  const items = NAV.filter(n => n[3].includes(ui.user.rol));
  if (!items.find(n => n[0] === ui.view)) ui.view = "dashboard";
  app.innerHTML = `
  <div class="shell">
    <aside class="side ${ui.menu ? "open" : ""}">
      <div class="logo">Nova Bella<small>Inventario</small></div>
      ${items.map(n => `<button class="nav ${ui.view === n[0] ? "active" : ""}" data-act="nav" data-v="${n[0]}"><span>${n[1]}</span>${n[2]}</button>`).join("")}
      <div class="who"><b>${esc(ui.user.name)}</b><br><span class="muted">${ui.user.rol === "super" ? "Super administrador" : "Vendedor"}</span>
        <button class="btn ghost sm" style="margin-top:8px;width:100%" data-act="logout">Cerrar sesión</button></div>
    </aside>
    <main class="main">
      <div class="top">
        <div class="row"><button class="btn ghost sm menu-btn" data-act="menu">☰</button><h1>${esc(items.find(n => n[0] === ui.view)[2])}</h1></div>
        ${isSuper() ? `<span class="tc-pill">💱 TC 70%: <b>${S.cfg.tc.toFixed(2)}</b> · TC 30%: <b>${S.cfg.tc2.toFixed(2)}</b></span>` : ""}
      </div>
      ${VIEWS[ui.view]()}
    </main>
  </div>`;
}

function loginView() {
  return `<div class="login"><div class="login-card">
    <div class="logo">Nova Bella<small>Sistema de inventario</small></div>
    <p class="muted">Boceto navegable. Elige un perfil para ver cómo cambia lo que se puede hacer.</p>
    ${S.users.map(u => `<button class="btn ${u.rol === "super" ? "" : "ghost"}" data-act="login" data-id="${u.id}">Entrar como ${esc(u.name)}</button>`).join("")}
    <p class="muted" style="margin-top:18px">Los datos son de ejemplo y se guardan solo en este navegador.</p>
    <button class="btn ghost sm" data-act="reset">Restablecer datos de ejemplo</button>
  </div></div>`;
}

/* ---------- vistas ---------- */
const sum = (a, f) => a.reduce((t, x) => t + f(x), 0);
const periodRange = p => {
  const now = new Date(), s = new Date(now); s.setHours(0, 0, 0, 0);
  if (p === "semana") s.setDate(s.getDate() - 6);
  else if (p === "mes") s.setDate(1);
  else if (p === "anio") { s.setMonth(0, 1); }
  return s;
};
const salesIn = p => S.sales.filter(x => new Date(x.fecha) >= periodRange(p) && (isSuper() || x.userId === ui.user.id || true));
const cost = x => sum(x.items, i => i.costBs * i.qty);

const VIEWS = {
  dashboard() {
    const hoy = salesIn("hoy"), mes = salesIn("mes");
    const stockTotal = sum(S.variants, v => v.stock);
    const low = S.variants.filter(v => v.stock <= 2);
    const valor = sum(S.variants, v => v.stock * v.costBs);
    return `<div class="grid kpis">
      <div class="card kpi"><div class="l">Ventas de hoy</div><div class="v">${bs(sum(hoy, x => x.total))}</div></div>
      <div class="card kpi"><div class="l">Ventas del mes</div><div class="v">${bs(sum(mes, x => x.total))}</div></div>
      <div class="card kpi"><div class="l">Pares en stock</div><div class="v">${stockTotal}</div></div>
      ${isSuper() ? `<div class="card kpi"><div class="l">Utilidad del mes</div><div class="v">${bs(sum(mes, x => x.total - cost(x)))}</div></div>
      <div class="card kpi"><div class="l">Capital en mercadería (costo)</div><div class="v">${bs(valor)}</div></div>` : ""}
    </div>
    <div class="grid two" style="margin-top:14px">
      <div class="card"><h2>⚠️ Stock bajo (2 o menos)</h2>
        ${low.length ? `<table><tr><th>Modelo</th><th>Color</th><th>Talla</th><th>Stock</th></tr>${low.slice(0, 8).map(v =>
          `<tr><td>${esc(v.modelo)}</td><td>${esc(v.color)}</td><td>${v.talla}</td><td><span class="badge ${v.stock ? "warn" : "bad"}">${v.stock}</span></td></tr>`).join("")}</table>` : `<p class="muted">Todo en orden.</p>`}
      </div>
      <div class="card"><h2>Lo más vendido (mes)</h2>${topModels(mes)}</div>
    </div>
    ${isSuper() ? "" : `<p class="note" style="margin-top:14px">Vista de vendedor: no se muestran costos ni utilidades.</p>`}`;
  },

  stock() {
    const q = noAcc(ui.stockQ.toLowerCase());
    const list = S.variants.filter(v => !q || noAcc(`${v.code} ${v.modelo} ${v.color} ${v.linea} ${v.talla}`.toLowerCase()).includes(q));
    return `<div class="card">
      <div class="row" style="margin-bottom:12px">
        <input style="max-width:320px" placeholder="Buscar código, modelo, color, talla…" value="${esc(ui.stockQ)}" data-in="stockQ">
        <span class="spacer"></span>
        <button class="btn ghost sm" data-act="labels">🏷️ Etiquetas QR</button>
        ${isSuper() ? `<button class="btn sm" data-act="csv-stock">⬇️ Exportar a Excel</button>` : ""}
      </div>
      <div class="tscroll"><table><tr><th>Código (QR)</th><th>Línea</th><th>Modelo</th><th>Color</th><th>Talla</th><th>Stock</th>
        ${isSuper() ? "<th>Costo Bs</th>" : ""}<th>Precio venta</th></tr>
      ${list.map(v => `<tr><td class="nowrap"><b>${esc(v.code)}</b></td><td>${esc(v.linea)}</td><td>${esc(v.modelo)}</td>
        <td><span class="swatch" style="background:${COLORS[v.color] || "#ccc"}"></span>${esc(v.color)}</td><td>${v.talla}</td>
        <td><span class="badge ${v.stock === 0 ? "bad" : v.stock <= 2 ? "warn" : "ok"}">${v.stock}</span></td>
        ${isSuper() ? `<td>${bs(v.costBs)}</td>` : ""}<td><b>${bs(v.precio)}</b></td></tr>`).join("")}</table></div>
      <p class="muted">Cada fila es una combinación <b>modelo + color + talla</b> con su propio código: así no se repite el código entre colores.</p>
    </div>`;
  },

  ingreso() {
    const f = ui.ingreso || (ui.ingreso = { linea: LINEAS[0], modelo: "", color: "Negro", costUsd: 0, tc1: S.cfg.tc, tc2: S.cfg.tc2, pct1: S.cfg.pct1, flete: 0, precio: "", prov: "", tallas: {} });
    const qty = sum(Object.values(f.tallas), n => num(n));
    const cu = unitCost(num(f.costUsd), num(f.pct1), num(f.tc1), num(f.tc2), num(f.flete), qty);
    const sug = roundPrice(cu * (1 + S.cfg.margen / 100));
    const totalUsd = num(f.costUsd) * qty;
    const part1 = totalUsd * num(f.pct1) / 100, part2 = totalUsd - part1;
    const models = [...new Set(S.variants.map(v => v.modelo))];
    return `<div class="grid two">
    <div class="card"><h2>Nuevo lote</h2>
      <div class="form">
        <div><label>Línea</label><select data-in="ing.linea">${LINEAS.map(l => `<option ${f.linea === l ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        <div><label>Modelo</label><input list="models" data-in="ing.modelo" value="${esc(f.modelo)}" placeholder="Ej. Aurora"><datalist id="models">${models.map(m => `<option>${esc(m)}`).join("")}</datalist></div>
        <div><label>Color</label><select data-in="ing.color">${Object.keys(COLORS).map(c => `<option ${f.color === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
        <div><label>Costo por par (USD)</label><input type="number" step="0.01" data-in="ing.costUsd" value="${f.costUsd || ""}"></div>
        <div><label>% pagado 1.º (anticipo)</label><input type="number" data-in="ing.pct1" value="${f.pct1}"></div>
        <div><label>TC del 1.er pago</label><input type="number" step="0.01" data-in="ing.tc1" value="${f.tc1}"></div>
        <div><label>TC del 2.º pago (${100 - num(f.pct1)}%)</label><input type="number" step="0.01" data-in="ing.tc2" value="${f.tc2}"></div>
        <div><label>Flete total del lote (Bs) · opcional</label><input type="number" step="0.01" data-in="ing.flete" value="${f.flete || ""}"></div>
        <div><label>Proveedor / fábrica</label><input data-in="ing.prov" value="${esc(f.prov)}"></div>
      </div>
      <h3 style="margin-top:16px">Cantidad por talla</h3>
      <div class="row">${TALLAS.map(t => `<div style="width:64px"><label>T ${t}</label><input type="number" min="0" data-in="ing.t.${t}" value="${f.tallas[t] || ""}"></div>`).join("")}</div>
    </div>
    <div class="card"><h2>Resumen del lote</h2>
      <table>
        <tr><td>Pares</td><td class="right"><b>${qty}</b></td></tr>
        <tr><td>Total a pagar a fábrica</td><td class="right">USD ${totalUsd.toFixed(2)}</td></tr>
        <tr><td>• 1.er pago (${num(f.pct1)}% a ${num(f.tc1).toFixed(2)})</td><td class="right">${bs(part1 * num(f.tc1))}</td></tr>
        <tr><td>• 2.º pago (${100 - num(f.pct1)}% a ${num(f.tc2).toFixed(2)})</td><td class="right">${bs(part2 * num(f.tc2))}</td></tr>
        <tr><td>Flete</td><td class="right">${bs(num(f.flete))}</td></tr>
        <tr><td><b>Costo real por par</b></td><td class="right"><b>${bs(cu)}</b></td></tr>
        <tr><td>Precio sugerido (margen ${S.cfg.margen}%)</td><td class="right">${bs(sug)}</td></tr>
      </table>
      <div style="margin-top:12px"><label>Precio de venta (Bs)</label><input type="number" data-in="ing.precio" value="${f.precio}" placeholder="${sug}"></div>
      <div class="row" style="margin-top:14px"><button class="btn" data-act="save-lot" ${qty && f.modelo && num(f.costUsd) ? "" : "disabled"}>Guardar ingreso y generar códigos</button></div>
      <p class="note" style="margin-top:12px">Se crea un código por <b>modelo + color + talla</b>. Si ya existía, se suma al stock y el costo se promedia.</p>
    </div></div>
    <div class="card" style="margin-top:14px"><div class="row"><h2>Historial de ingresos</h2><span class="spacer"></span><button class="btn sm ghost" data-act="csv-lots">⬇️ Excel</button></div>
      <div class="tscroll"><table><tr><th>Fecha</th><th>Lote</th><th>Modelo</th><th>Color</th><th>Pares</th><th>USD/par</th><th>Costo Bs/par</th><th>Precio</th></tr>
      ${S.lots.slice(0, 12).map(l => `<tr><td>${l.fecha}</td><td>${l.id}</td><td>${esc(l.modelo)}</td><td>${esc(l.color)}</td><td>${sum(l.items, i => i.qty)}</td><td>${l.costUsd}</td><td>${bs(l.costBsUnit)}</td><td>${bs(l.precio)}</td></tr>`).join("")}</table></div></div>`;
  },

  pos() {
    const q = noAcc(ui.q.toLowerCase());
    const avail = S.variants.filter(v => !q || noAcc(`${v.code} ${v.modelo} ${v.color} ${v.talla}`.toLowerCase()).includes(q)).slice(0, 40);
    const total = sum(ui.cart, l => l.precio * l.qty);
    const ef = ui.efectivo === null ? total : Math.min(num(ui.efectivo), total);
    return `<div class="grid pos">
    <div class="card"><div class="row"><input id="scan" placeholder="📷 Escanear QR / escribir código, modelo o talla…" data-in="q" value="${esc(ui.q)}" autofocus></div>
      <div class="pgrid">${avail.map(v => `<button class="pitem ${v.stock ? "" : "out"}" data-act="add" data-id="${v.id}">
        <b>${esc(v.modelo)}</b><span class="swatch" style="background:${COLORS[v.color] || "#ccc"}"></span>${esc(v.color)} · T${v.talla}
        <div class="muted" style="font-size:.74rem">${esc(v.code)}</div><div><b style="color:var(--pink-600)">${bs(v.precio)}</b> · <span class="badge ${v.stock ? "ok" : "bad"}">${v.stock}</span></div></button>`).join("")}</div></div>
    <div class="card"><h2>Venta actual</h2>
      ${ui.cart.length ? ui.cart.map((l, i) => { const v = S.variants.find(x => x.id === l.vid); return `
        <div class="cartline"><div><b>${esc(v.modelo)}</b> ${esc(v.color)} T${v.talla}<br><span class="muted">Lista ${bs(v.precio)}</span></div>
        <input type="number" data-in="cart.${i}.precio" value="${l.precio}" title="Precio editable (descuento)">
        <div class="right">${l.qty} × <button class="btn ghost sm" data-act="qty" data-i="${i}" data-d="1">+</button></div>
        <button class="btn ghost sm" data-act="del" data-i="${i}">✕</button></div>`; }).join("") : `<p class="muted">Escanea o toca un producto para agregarlo.</p>`}
      <div class="row" style="margin:12px 0"><span>Total</span><span class="spacer"></span><span class="total">${bs(total)}</span></div>
      <div class="form" style="grid-template-columns:1fr 1fr">
        <div><label>Pago en efectivo</label><input type="number" data-in="efectivo" value="${ui.efectivo === null ? total : ui.efectivo}"></div>
        <div><label>Pago por QR / transferencia</label><input disabled value="${bs(total - ef)}"></div>
        <div style="grid-column:1/-1"><label>Cliente</label><select data-in="clientId">${S.clients.map(c => `<option value="${c.id}" ${ui.clientId === c.id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select></div>
      </div>
      <div class="row" style="margin:12px 0"><div class="seg"><button class="${ui.doc === "nota" ? "on" : ""}" data-act="doc" data-d="nota">Nota de venta</button><button class="${ui.doc === "factura" ? "on" : ""}" data-act="doc" data-d="factura">Facturar</button></div></div>
      ${ui.doc === "factura" ? `<div><label>NIT / CI para la factura</label><input data-in="nit" value="${esc(ui.nit)}"></div>` : ""}
      <button class="btn" style="width:100%;margin-top:12px" data-act="sell" ${ui.cart.length ? "" : "disabled"}>Cobrar y emitir ${ui.doc === "factura" ? "factura" : "nota de venta"}</button>
      <p class="muted" style="font-size:.78rem">El vendedor ve solo el precio de venta y puede ajustar el precio (ej. 450 → 440). El costo nunca se muestra.</p>
    </div></div>`;
  },

  ventas() {
    const list = S.sales.slice().reverse().slice(0, 30);
    return `<div class="card"><div class="tscroll"><table><tr><th>N.º</th><th>Fecha</th><th>Detalle</th><th>Pago</th><th>Doc.</th><th class="right">Total</th><th></th></tr>
      ${list.map(x => `<tr><td><b>${x.id}</b></td><td>${new Date(x.fecha).toLocaleDateString("es-BO")}</td>
        <td>${x.items.map(i => `${esc(i.desc)} ×${i.qty}${i.cambio ? ' <span class="badge">cambiado</span>' : ""}`).join("<br>")}</td>
        <td class="muted">Ef ${bs(x.efectivo)}<br>QR ${bs(x.qr)}</td><td><span class="badge">${x.doc === "factura" ? "Factura" : "Nota"}</span></td>
        <td class="right"><b>${bs(x.total)}</b></td><td class="nowrap"><button class="btn ghost sm" data-act="ticket" data-id="${x.id}">Ticket</button> <button class="btn sm" data-act="swap" data-id="${x.id}">Cambio</button></td></tr>`).join("")}</table></div>
      <p class="muted">“Cambio” permite cambiar talla o modelo (por ejemplo, regalos): el par devuelto vuelve al stock y el nuevo sale del stock.</p></div>`;
  },

  clientes() {
    return `<div class="grid two"><div class="card"><h2>Nuevo cliente</h2><div class="form">
      <div><label>Nombre</label><input id="cn"></div><div><label>Teléfono / WhatsApp</label><input id="ct"></div><div><label>NIT / CI</label><input id="cnit"></div></div>
      <button class="btn" style="margin-top:12px" data-act="add-client">Guardar cliente</button></div>
      <div class="card"><h2>Compradores</h2><table><tr><th>Nombre</th><th>Teléfono</th><th>NIT/CI</th><th>Compras</th></tr>
      ${S.clients.map(c => `<tr><td>${esc(c.name)}</td><td>${esc(c.tel)}</td><td>${esc(c.nit)}</td><td>${S.sales.filter(s => s.clientId === c.id).length}</td></tr>`).join("")}</table></div></div>`;
  },

  reportes() {
    const ps = [["hoy", "Hoy"], ["semana", "Esta semana"], ["mes", "Este mes"], ["anio", "Este año"]];
    const list = salesIn(ui.period);
    const tot = sum(list, x => x.total), ut = tot - sum(list, cost);
    const desc = sum(list, x => sum(x.items, i => (i.lista - i.precio) * i.qty));
    const byTalla = {}; list.forEach(x => x.items.forEach(i => { const t = i.desc.split(" T").pop(); byTalla[t] = (byTalla[t] || 0) + i.qty; }));
    const maxT = Math.max(1, ...Object.values(byTalla));
    return `<div class="row" style="margin-bottom:14px"><div class="seg">${ps.map(p => `<button class="${ui.period === p[0] ? "on" : ""}" data-act="period" data-p="${p[0]}">${p[1]}</button>`).join("")}</div>
      <span class="spacer"></span><button class="btn sm" data-act="csv-sales">⬇️ Ventas a Excel</button><button class="btn ghost sm" data-act="csv-stock">⬇️ Stock a Excel</button></div>
    <div class="grid kpis"><div class="card kpi"><div class="l">Ventas</div><div class="v">${bs(tot)}</div></div>
      <div class="card kpi"><div class="l">Utilidad</div><div class="v">${bs(ut)}</div></div>
      <div class="card kpi"><div class="l">Pares vendidos</div><div class="v">${sum(list, x => sum(x.items, i => i.qty))}</div></div>
      <div class="card kpi"><div class="l">Cobrado en efectivo</div><div class="v">${bs(sum(list, x => x.efectivo))}</div></div>
      <div class="card kpi"><div class="l">Cobrado por QR</div><div class="v">${bs(sum(list, x => x.qr))}</div></div>
      <div class="card kpi"><div class="l">Descuentos dados</div><div class="v">${bs(desc)}</div></div></div>
    <div class="grid two" style="margin-top:14px"><div class="card"><h2>Modelos más vendidos</h2>${topModels(list)}</div>
      <div class="card"><h2>Tallas que más salen</h2>${Object.entries(byTalla).sort((a, b) => a[0] - b[0]).map(([t, n]) => `<div class="row" style="margin:6px 0"><span style="width:56px">Talla ${t}</span><div class="bar spacer"><i style="width:${n / maxT * 100}%"></i></div><b>${n}</b></div>`).join("") || '<p class="muted">Sin datos.</p>'}</div></div>`;
  },

  sucursales() {
    return `<div class="card"><table><tr><th>Sucursal</th><th>Estado</th><th></th></tr>${S.branches.map(b => `<tr><td>${esc(b.name)}</td>
      <td><span class="badge ${b.activa ? "ok" : "warn"}">${b.activa ? "Activa" : "Pendiente"}</span></td><td><button class="btn ghost sm" data-act="toggle-branch" data-id="${b.id}">${b.activa ? "Desactivar" : "Activar"}</button></td></tr>`).join("")}</table>
      <p class="note" style="margin-top:12px">Se deja preparada la estructura para la sucursal de La Paz (stock y ventas por sucursal). En el boceto, todo opera en la tienda principal.</p></div>`;
  },

  usuarios() {
    return `<div class="grid two"><div class="card"><h2>Usuarios</h2><table><tr><th>Nombre</th><th>Rol</th></tr>${S.users.map(u => `<tr><td>${esc(u.name)}</td><td><span class="badge">${u.rol === "super" ? "Super administrador" : "Vendedor"}</span></td></tr>`).join("")}</table>
      <div class="form" style="margin-top:12px"><div><label>Nuevo vendedor</label><input id="un" placeholder="Nombre"></div></div><button class="btn" style="margin-top:10px" data-act="add-user">Agregar vendedor</button></div>
      <div class="card"><h2>Matriz de permisos</h2><table><tr><th>Acción</th><th>Super admin</th><th>Vendedor</th></tr>
      ${[["Vender y emitir nota/factura", 1, 1], ["Editar precio en la venta (descuento)", 1, 1], ["Cambio de talla/modelo", 1, 1], ["Ver stock y precio de venta", 1, 1], ["Ver precio de costo", 1, 0], ["Ingresar mercadería", 1, 0], ["Reportes y utilidades", 1, 0], ["Exportar a Excel", 1, 0], ["Usuarios y tipo de cambio", 1, 0]]
        .map(r => `<tr><td>${r[0]}</td><td>${r[1] ? "✅" : "—"}</td><td>${r[2] ? "✅" : "⛔"}</td></tr>`).join("")}</table></div></div>`;
  },

  ajustes() {
    const c = S.cfg;
    const changes = S.variants.map(v => ({ v, nuevo: v.costUsd * (c.pct1 / 100 * c.tc + (1 - c.pct1 / 100) * c.tc2) + v.fleteUnit })).filter(x => Math.abs(x.nuevo - x.v.costBs) > .01);
    return `<div class="grid two"><div class="card"><h2>Tipo de cambio y margen</h2><div class="form">
      <div><label>TC oficial (pago del ${c.pct1}%)</label><input type="number" step="0.01" data-in="cfg.tc" value="${c.tc}"></div>
      <div><label>TC actualizado (pago del ${100 - c.pct1}%)</label><input type="number" step="0.01" data-in="cfg.tc2" value="${c.tc2}"></div>
      <div><label>% primer pago</label><input type="number" data-in="cfg.pct1" value="${c.pct1}"></div>
      <div><label>Margen para precio sugerido (%)</label><input type="number" data-in="cfg.margen" value="${c.margen}"></div></div>
      <p class="note" style="margin-top:12px">Se paga a fábrica 70% / 30%, cada parte con su tipo de cambio. Al cambiarlo, el sistema recalcula el costo en bolivianos y propone nuevos precios.</p></div>
      <div class="card"><h2>Actualizar costos y precios</h2><p>${changes.length} productos cambiarían de costo con este tipo de cambio.</p>
      ${changes.slice(0, 5).map(x => `<div class="row"><span>${esc(x.v.modelo)} ${esc(x.v.color)} T${x.v.talla}</span><span class="spacer"></span><span class="muted">${bs(x.v.costBs)} → <b>${bs(x.nuevo)}</b></span></div>`).join("")}
      <div class="row" style="margin-top:12px"><button class="btn" data-act="reprice" data-m="cost" ${changes.length ? "" : "disabled"}>Solo costos</button>
      <button class="btn ghost" data-act="reprice" data-m="all" ${changes.length ? "" : "disabled"}>Costos y precios de venta</button></div></div></div>`;
  }
};

function topModels(list) {
  const m = {}; list.forEach(x => x.items.forEach(i => { const k = i.desc.split(" ")[0]; m[k] = (m[k] || 0) + i.qty; }));
  const arr = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5), max = Math.max(1, ...arr.map(a => a[1]));
  return arr.map(([k, n]) => `<div class="row" style="margin:6px 0"><span style="width:90px">${esc(k)}</span><div class="bar spacer"><i style="width:${n / max * 100}%"></i></div><b>${n}</b></div>`).join("") || '<p class="muted">Sin ventas en el periodo.</p>';
}

/* ---------- modales ---------- */
function modal(html) { $("#modal-root").innerHTML = `<div class="modal-bg" data-act="close-bg"><div class="modal printable">${html}</div></div>`; }
const closeModal = () => { $("#modal-root").innerHTML = ""; };

function ticketHtml(x) {
  const c = S.clients.find(c => c.id === x.clientId);
  return `<div class="ticket"><div class="logo" style="text-align:center">Nova Bella</div>
    <div style="text-align:center">${x.doc === "factura" ? "FACTURA (demostración)" : "NOTA DE VENTA"} ${x.id}<br>${new Date(x.fecha).toLocaleString("es-BO")}</div><hr>
    ${x.items.map(i => `<div class="row"><span>${esc(i.desc)} ×${i.qty}</span><span class="spacer"></span><span>${bs(i.precio * i.qty)}</span></div>`).join("")}<hr>
    <div class="row"><b>TOTAL</b><span class="spacer"></span><b>${bs(x.total)}</b></div>
    <div class="row"><span>Efectivo</span><span class="spacer"></span><span>${bs(x.efectivo)}</span></div>
    <div class="row"><span>QR / transferencia</span><span class="spacer"></span><span>${bs(x.qr)}</span></div><hr>
    <div>Cliente: ${esc(c ? c.name : "—")} ${x.nit ? "· NIT " + esc(x.nit) : ""}</div><div style="text-align:center;margin-top:8px">¡Gracias por tu compra!</div></div>
    <div class="row" style="margin-top:14px"><button class="btn" onclick="window.print()">Imprimir</button><button class="btn ghost" data-act="close">Cerrar</button></div>`;
}

function labelsModal() {
  modal(`<h2>Etiquetas QR por modelo, color y talla</h2><p class="muted">Imprime y pega en cada caja. Al escanear con el celular se abre el producto en el punto de venta.</p>
    <div class="labels">${S.variants.map(v => `<div class="label"><div class="qr" data-qr="${esc(v.code)}"></div><b>${esc(v.modelo)}</b><br>${esc(v.color)} · T${v.talla}<br>${esc(v.code)}</div>`).join("")}</div>
    <div class="row" style="margin-top:14px"><button class="btn" onclick="window.print()">Imprimir etiquetas</button><button class="btn ghost" data-act="close">Cerrar</button></div>`);
  document.querySelectorAll("[data-qr]").forEach(el => {
    if (window.QRCode) new QRCode(el, { text: el.dataset.qr, width: 90, height: 90, colorDark: "#a8214f" });
    else el.innerHTML = `<span class="muted">[QR]</span>`;
  });
}

function swapModal(id) {
  const x = S.sales.find(s => s.id === id);
  modal(`<h2>Cambio de modelo / talla · ${x.id}</h2>
    <div><label>Producto a devolver</label><select id="sw-old">${x.items.map((i, k) => `<option value="${k}">${esc(i.desc)} (${bs(i.precio)})</option>`).join("")}</select></div>
    <div style="margin-top:10px"><label>Producto nuevo</label><select id="sw-new">${S.variants.filter(v => v.stock > 0).map(v => `<option value="${v.id}">${esc(v.modelo)} ${esc(v.color)} T${v.talla} · stock ${v.stock} · ${bs(v.precio)}</option>`).join("")}</select></div>
    <p class="note" style="margin-top:12px">Si el precio del producto nuevo es distinto, se cobra o devuelve la diferencia.</p>
    <div class="row" style="margin-top:14px"><button class="btn" data-act="do-swap" data-id="${id}">Confirmar cambio</button><button class="btn ghost" data-act="close">Cancelar</button></div>`);
}

/* ---------- exportar (CSV con ; para abrir directo en Excel) ---------- */
function downloadCsv(name, rows) {
  const csv = "sep=;\n" + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500);
  toast("Archivo listo para abrir en Excel");
}
const csvs = {
  "csv-stock": () => downloadCsv("stock-nova-bella.csv", [["Código", "Línea", "Modelo", "Color", "Talla", "Stock", "Costo Bs", "Precio venta"], ...S.variants.map(v => [v.code, v.linea, v.modelo, v.color, v.talla, v.stock, v.costBs.toFixed(2), v.precio])]),
  "csv-lots": () => downloadCsv("ingresos-nova-bella.csv", [["Fecha", "Lote", "Línea", "Modelo", "Color", "Pares", "USD/par", "TC1", "TC2", "% 1.er pago", "Flete Bs", "Costo Bs/par", "Precio"], ...S.lots.map(l => [l.fecha, l.id, l.linea, l.modelo, l.color, sum(l.items, i => i.qty), l.costUsd, l.tc1, l.tc2, l.pct1, l.flete, l.costBsUnit.toFixed(2), l.precio])]),
  "csv-sales": () => downloadCsv("ventas-nova-bella.csv", [["N.º", "Fecha", "Producto", "Cant.", "Precio lista", "Precio cobrado", "Costo", "Efectivo", "QR", "Documento"], ...salesIn(ui.period).flatMap(x => x.items.map(i => [x.id, x.fecha.slice(0, 10), i.desc, i.qty, i.lista, i.precio, i.costBs.toFixed(2), x.efectivo, x.qr, x.doc]))])
};

/* ---------- acciones ---------- */
const ACT = {
  login: el => { ui.user = S.users.find(u => u.id === el.dataset.id); ui.view = "dashboard"; ui.cart = []; },
  logout: () => { ui.user = null; },
  reset: () => { if (confirm("¿Restablecer los datos de ejemplo?")) { S = seed(); save(); } },
  nav: el => { ui.view = el.dataset.v; ui.menu = false; },
  menu: () => { ui.menu = !ui.menu; },
  close: closeModal,
  "close-bg": (el, e) => { if (e.target === el) closeModal(); },
  labels: labelsModal,
  period: el => { ui.period = el.dataset.p; },
  doc: el => { ui.doc = el.dataset.d; },
  add: el => {
    const v = S.variants.find(x => x.id === el.dataset.id); const l = ui.cart.find(c => c.vid === v.id);
    if (l) { if (l.qty < v.stock) l.qty++; else toast("No hay más stock de este producto"); } else ui.cart.push({ vid: v.id, qty: 1, precio: v.precio });
    ui.efectivo = null;
  },
  qty: el => { const l = ui.cart[+el.dataset.i], v = S.variants.find(x => x.id === l.vid); if (l.qty < v.stock) l.qty++; ui.efectivo = null; },
  del: el => { ui.cart.splice(+el.dataset.i, 1); ui.efectivo = null; },
  sell: () => {
    const total = sum(ui.cart, l => l.precio * l.qty); const ef = ui.efectivo === null ? total : Math.min(num(ui.efectivo), total);
    if (ui.doc === "factura" && !ui.nit.trim()) return toast("Ingresa el NIT/CI para facturar");
    const items = ui.cart.map(l => { const v = S.variants.find(x => x.id === l.vid); v.stock -= l.qty;
      return { vid: v.id, code: v.code, desc: `${v.modelo} ${v.color} T${v.talla}`, qty: l.qty, lista: v.precio, precio: num(l.precio), costBs: v.costBs }; });
    const sale = { id: "V-" + String(S.seq.sale++).padStart(4, "0"), fecha: new Date().toISOString(), userId: ui.user.id, clientId: ui.clientId, items, total, efectivo: ef, qr: total - ef, doc: ui.doc, nit: ui.nit, cambios: [] };
    S.sales.push(sale); save(); ui.cart = []; ui.efectivo = null; ui.q = ""; ui.nit = "";
    render(); modal(ticketHtml(sale)); return "skip";
  },
  ticket: el => { modal(ticketHtml(S.sales.find(s => s.id === el.dataset.id))); return "skip"; },
  swap: el => { swapModal(el.dataset.id); return "skip"; },
  "do-swap": el => {
    const x = S.sales.find(s => s.id === el.dataset.id), k = +$("#sw-old").value, it = x.items[k];
    const nv = S.variants.find(v => v.id === $("#sw-new").value), ov = S.variants.find(v => v.id === it.vid);
    if (nv.id === ov.id) return toast("Elige un producto distinto");
    const nuevoPrecio = nv.modelo === ov.modelo ? it.precio : nv.precio, diff = (nuevoPrecio - it.precio) * it.qty;
    ov.stock += it.qty; nv.stock -= it.qty;
    x.cambios.push({ fecha: new Date().toISOString(), de: it.desc, a: `${nv.modelo} ${nv.color} T${nv.talla}`, diff, por: ui.user.id });
    x.items[k] = { ...it, vid: nv.id, code: nv.code, desc: `${nv.modelo} ${nv.color} T${nv.talla}`, lista: nv.precio, precio: nuevoPrecio, costBs: nv.costBs, cambio: true };
    x.total += diff; if (diff > 0) x.efectivo += diff; else if (diff < 0) x.efectivo = Math.max(0, x.efectivo + diff);
    save(); closeModal(); toast(diff ? `Cambio hecho · diferencia ${bs(diff)}` : "Cambio hecho sin diferencia");
  },
  "add-client": () => { const n = $("#cn").value.trim(); if (!n) return toast("Escribe un nombre"); S.clients.push({ id: "c" + Date.now(), name: n, tel: $("#ct").value, nit: $("#cnit").value }); save(); },
  "add-user": () => { const n = $("#un").value.trim(); if (!n) return; S.users.push({ id: "u" + Date.now(), name: n, rol: "vendedor" }); save(); },
  "toggle-branch": el => { const b = S.branches.find(b => b.id === el.dataset.id); b.activa = !b.activa; save(); },
  "save-lot": () => {
    const f = ui.ingreso; const items = TALLAS.filter(t => num(f.tallas[t]) > 0).map(t => ({ talla: t, qty: num(f.tallas[t]) }));
    const qty = sum(items, i => i.qty), cu = unitCost(num(f.costUsd), num(f.pct1), num(f.tc1), num(f.tc2), num(f.flete), qty);
    addStock(S, { id: "L" + (S.lots.length + 1), fecha: today(), linea: f.linea, modelo: f.modelo.trim(), color: f.color, items, costUsd: num(f.costUsd),
      tc1: num(f.tc1), tc2: num(f.tc2), pct1: num(f.pct1), flete: num(f.flete), precio: num(f.precio) || roundPrice(cu * (1 + S.cfg.margen / 100)), proveedor: f.prov });
    save(); ui.ingreso = null; ui.view = "stock"; toast(`Ingreso guardado: ${qty} pares, ${items.length} códigos`);
  },
  reprice: el => {
    S.variants.forEach(v => { const n = v.costUsd * (S.cfg.pct1 / 100 * S.cfg.tc + (1 - S.cfg.pct1 / 100) * S.cfg.tc2) + v.fleteUnit; v.costBs = n; if (el.dataset.m === "all") v.precio = roundPrice(n * (1 + S.cfg.margen / 100)); });
    save(); toast("Costos" + (el.dataset.m === "all" ? " y precios" : "") + " actualizados");
  },
  ...csvs
};

/* ---------- eventos ---------- */
document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]"); if (!el) return;
  const fn = ACT[el.dataset.act]; if (!fn) return;
  const r = fn(el, e);
  if (r !== "skip") { render(); }
});

document.addEventListener("input", e => {
  const el = e.target; const k = el.dataset && el.dataset.in; if (!k) return;
  const v = el.value, pos = el.selectionStart;
  let rerender = true;
  if (k === "q") { ui.q = v; const hit = S.variants.find(x => x.code.toLowerCase() === v.trim().toLowerCase());
    if (hit && hit.stock) { const l = ui.cart.find(c => c.vid === hit.id); l ? l.qty++ : ui.cart.push({ vid: hit.id, qty: 1, precio: hit.precio }); ui.q = ""; ui.efectivo = null; toast(`Agregado: ${hit.modelo} ${hit.color} T${hit.talla}`); } }
  else if (k === "stockQ") ui.stockQ = v;
  else if (k === "efectivo") ui.efectivo = v;
  else if (k === "clientId") ui.clientId = v;
  else if (k === "nit") ui.nit = v;
  else if (k.startsWith("cart.")) { const [, i] = k.split("."); ui.cart[+i].precio = num(v); }
  else if (k.startsWith("cfg.")) { S.cfg[k.slice(4)] = num(v); save(); }
  else if (k.startsWith("ing.t.")) ui.ingreso.tallas[k.slice(6)] = v;
  else if (k.startsWith("ing.")) ui.ingreso[k.slice(4)] = (k === "ing.modelo" || k === "ing.prov" || k === "ing.linea" || k === "ing.color") ? v : v;
  if (!rerender) return;
  render();
  const again = document.querySelector(`[data-in="${k}"]`);
  if (again && el.tagName === "INPUT") { again.focus(); try { again.setSelectionRange(pos, pos); } catch (_) {} }
});

document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
render();
