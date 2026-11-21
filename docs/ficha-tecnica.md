# Ficha técnica · Nova Bella

Fuente: entrevista con la propietaria (Naty). Los precios del ejemplo y el tipo de producto (calzado, por "tallas" y "cajitas") son supuestos a confirmar.

## Fase 1 · Sistema de inventario (prioridad)

| Necesidad dicha en la entrevista | Cómo lo resuelve el boceto |
|---|---|
| Distinguir **talla, modelo y color**; antes el código se repetía entre colores | Cada variante (modelo + color + talla) tiene código único |
| Por cada lote: talla, línea (maneja 3), color, modelo y precio de costo | Pantalla "Ingreso de mercadería" |
| Paga en dólares a fábrica **70 / 30**, cada parte con distinto tipo de cambio | Dos tipos de cambio y % configurable; costo real por par en Bs |
| Flete opcional (transporte de las cajas) | Campo de flete, prorrateado por par |
| Precios que se actualizan según el tipo de cambio | "Tipo de cambio" recalcula costos y, si se quiere, precios |
| Super administrador y vendedor | Roles; el vendedor solo vende |
| **El vendedor no debe ver el costo**, solo el precio de venta | Costos ocultos en todas las pantallas del vendedor |
| Descuento personalizado (ej. 450 → 440) | Precio editable en la venta; reporte de descuentos |
| Exportar a Excel, con ingresos y detalle | CSV con `;` de stock, ingresos y ventas |
| Pagos mixtos (parte efectivo, parte QR) | Se registra efectivo + QR por venta |
| QR / código de barras por modelo, color y talla | Etiquetas QR imprimibles; escaneo en caja |
| Factura o solo nota de venta | Botón "Facturar" / "Nota de venta" |
| Cambio de modelo o talla (regalos) | Botón "Cambio" en Ventas, ajusta stock y diferencia |
| Clientes, reportes por periodo, estadísticas | Clientes; reportes hoy/semana/mes/año, modelos y tallas top |
| Sucursal futura en La Paz | Estructura de sucursales preparada |
| **No** necesita: cotizaciones, abastecimiento, empleados complejos, cajero por sucursal | Excluidos; interfaz mínima |

## Fase 2 · Web de ventas

- Productos con su precio **primero**; métodos de compra al final (menos cargada).
- Compra directa, **sin sistema de reservas**.
- Pago online con **QR**, **delivery**, **factura digital** en compras en línea.
- Opción de pedir por WhatsApp, porque sus clientes compran así hoy.
- Después: conectar las compras de la web al inventario (stock en vivo).

## Pendientes por definir

1. Tipo de producto, líneas reales y catálogo con fotos.
2. Pasarela/banco para QR y facturación digital (SIN Bolivia): proveedor y costos.
3. Sistema real (base de datos, login con contraseñas, copias de seguridad) y hosting.
4. Soporte y pagos: la clienta mencionó un cargo anual de soporte con el proveedor anterior; definir condiciones.
5. Escáner: se puede usar el celular o un lector USB.
6. Número de WhatsApp y datos de la tienda.
