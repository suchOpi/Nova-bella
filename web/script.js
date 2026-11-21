"use strict";
/* Catálogo de ejemplo. En producción saldrá del sistema de inventario (modelo + color + talla + stock + precio). */
const WHATSAPP = "59100000000"; // TODO: reemplazar con el número real de la tienda
const COLORS = { Negro:"#2b2b2b", Beige:"#d9c3a5", Rosado:"#f4a6c1", Blanco:"#f7f7f7", Rojo:"#c0283d", Nude:"#e8c4b0" };
const BG = { Negro:"#e9e1e5", Beige:"#f6ede1", Rosado:"#ffe3ee", Blanco:"#fbeef3", Rojo:"#ffd9de", Nude:"#fbeadf" };

const PRODUCTS = [
  { id:"aurora", name:"Aurora", linea:"Clásica", price:420, tag:"Más vendido", variants:{ Negro:{36:4,37:6,38:6,39:3}, Beige:{36:3,37:5,38:5,39:2} } },
  { id:"luna", name:"Luna", linea:"Clásica", price:460, variants:{ Nude:{36:2,37:4,38:4,39:1} } },
  { id:"brisa", name:"Brisa", linea:"Urbana", price:480, variants:{ Blanco:{37:5,38:6,39:4,40:2}, Negro:{37:3,38:4,39:0,40:1} } },
  { id:"nube", name:"Nube", linea:"Urbana", price:450, tag:"Nuevo", variants:{ Rosado:{36:3,37:4,38:3,39:2} } },
  { id:"estrella", name:"Estrella", linea:"Fiesta", price:520, variants:{ Rojo:{35:2,36:3,37:3,38:2} } },
  { id:"dalia", name:"Dalia", linea:"Fiesta", price:540, tag:"Edición limitada", variants:{ Negro:{36:2,37:3,38:3,39:2}, Rojo:{36:1,37:2,38:0,39:1} } }
];

const SHOE = c => `<svg viewBox="0 0 200 120" aria-hidden="true"><path d="M12 84c0-10 6-16 16-18l38-8c10-2 16-10 18-22l2-12c1-4 6-6 9-3 12 12 22 20 40 24 22 5 46 14 52 34 1 6-2 10-8 10H24c-8 0-12-2-12-5z" fill="${c}"/><path d="M12 92h176v6c0 3-2 5-5 5H17c-3 0-5-2-5-5z" fill="#0003"/></svg>`;
const bs = n => "Bs " + n.toLocaleString("es-BO");
const $ = (s, r = document) => r.querySelector(s);

let filtro = "Todas";
const pick = {};   // selección por producto { color, talla }
const cart = [];   // { id, color, talla, qty }

function render() {
  const lineas = ["Todas", ...new Set(PRODUCTS.map(p => p.linea))];
  $("#filtros").innerHTML = lineas.map(l => `<button class="chip ${l === filtro ? "on" : ""}" data-linea="${l}">${l}</button>`).join("");
  $("#catalogo").innerHTML = PRODUCTS.filter(p => filtro === "Todas" || p.linea === filtro).map(card).join("");
}

function card(p) {
  const colors = Object.keys(p.variants);
  const s = pick[p.id] || (pick[p.id] = { color: colors[0], talla: null });
  const sizes = p.variants[s.color];
  return `<article class="prod" data-id="${p.id}">
    <div class="shot" style="background:${BG[s.color] || "#fff0f5"}">${SHOE(COLORS[s.color])}${p.tag ? `<span class="tag">${p.tag}</span>` : ""}</div>
    <div class="pbody">
      <h3>${p.name} <small style="color:var(--muted);font-weight:400">· ${p.linea}</small></h3>
      <div class="price">${bs(p.price)}</div>
      <div class="colors" aria-label="Color">${colors.map(c => `<button class="dot ${c === s.color ? "on" : ""}" style="background:${COLORS[c]}" title="${c}" aria-label="${c}" data-color="${c}"></button>`).join("")}</div>
      <div class="sizes" aria-label="Talla">${Object.entries(sizes).map(([t, n]) => `<button class="size ${s.talla === t ? "on" : ""}" data-talla="${t}" ${n ? "" : "disabled"}>${t}</button>`).join("")}</div>
      <button class="btn" data-add ${s.talla ? "" : "disabled"}>${s.talla ? "Agregar al carrito" : "Elige tu talla"}</button>
    </div></article>`;
}

function drawCart() {
  const total = cart.reduce((a, l) => a + PRODUCTS.find(p => p.id === l.id).price * l.qty, 0);
  $("#cart-count").textContent = cart.reduce((a, l) => a + l.qty, 0);
  $("#cart-total").textContent = bs(total);
  $("#cart-items").innerHTML = cart.length ? cart.map((l, i) => {
    const p = PRODUCTS.find(p => p.id === l.id);
    return `<div class="cart-line"><div class="mini shot" style="background:${BG[l.color]}">${SHOE(COLORS[l.color])}</div>
      <div><b>${p.name}</b><br><span style="color:var(--muted)">${l.color} · Talla ${l.talla} · ×${l.qty}</span></div>
      <div style="text-align:right"><b>${bs(p.price * l.qty)}</b><br><button data-del="${i}">Quitar</button></div></div>`;
  }).join("") : `<p class="empty">Tu carrito está vacío.</p>`;
  $("#pay-qr").disabled = $("#pay-wa").disabled = !cart.length;
  return total;
}

function orderText() {
  const entrega = document.querySelector('input[name=entrega]:checked').value === "delivery" ? "Delivery a domicilio" : "Retiro en tienda";
  const lines = cart.map(l => { const p = PRODUCTS.find(p => p.id === l.id); return `• ${p.name} ${l.color} talla ${l.talla} ×${l.qty} — ${bs(p.price * l.qty)}`; });
  return `Hola Nova Bella, quiero comprar:\n${lines.join("\n")}\nTotal: ${$("#cart-total").textContent}\nEntrega: ${entrega}${$("#factura").checked ? "\nNecesito factura" : ""}`;
}

const drawer = open => { $("#drawer").classList.toggle("open", open); $("#scrim").classList.toggle("show", open); $("#drawer").setAttribute("aria-hidden", !open); };

document.addEventListener("click", e => {
  const t = e.target;
  if (t.dataset.linea) { filtro = t.dataset.linea; render(); return; }
  const prod = t.closest(".prod");
  if (prod) {
    const p = PRODUCTS.find(x => x.id === prod.dataset.id), s = pick[p.id];
    if (t.dataset.color) { s.color = t.dataset.color; s.talla = null; render(); }
    else if (t.dataset.talla) { s.talla = t.dataset.talla; render(); }
    else if ("add" in t.dataset && s.talla) {
      const l = cart.find(c => c.id === p.id && c.color === s.color && c.talla === s.talla);
      const stock = p.variants[s.color][s.talla];
      if (l) { if (l.qty < stock) l.qty++; } else cart.push({ id: p.id, color: s.color, talla: s.talla, qty: 1 });
      drawCart(); drawer(true);
    }
    return;
  }
  if (t.dataset.del) { cart.splice(+t.dataset.del, 1); drawCart(); }
  else if (t.id === "open-cart" || t.closest("#open-cart")) drawer(true);
  else if (t.id === "close-cart" || t.id === "scrim") drawer(false);
  else if (t.id === "pay-wa") window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(orderText())}`, "_blank", "noopener");
  else if (t.id === "pay-qr") { $("#qr-total").textContent = $("#cart-total").textContent; $("#qr-modal").classList.add("open"); }
  else if (t.id === "qr-close") $("#qr-modal").classList.remove("open");
});
document.addEventListener("keydown", e => { if (e.key === "Escape") { drawer(false); $("#qr-modal").classList.remove("open"); } });

$("#wa-contact").href = `https://wa.me/${WHATSAPP}`;
render(); drawCart();
