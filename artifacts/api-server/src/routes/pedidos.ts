import { Router, type IRouter } from "express";
import { eq, and, desc, type SQL } from "drizzle-orm";
import {
  db,
  pedidosTable,
  pedidoDetallesTable,
  productosTable,
  localesTable,
  facturasTable,
  facturaDetallesTable,
  stockTable,
  movimientosTable,
} from "@workspace/db";
import { CreatePedidoBody, ListPedidosQueryParams } from "@workspace/api-zod";
import { requireAuth, getUser } from "../lib/auth";

const router: IRouter = Router();
router.use(requireAuth);

async function buildPedidoDto(pedido: typeof pedidosTable.$inferSelect) {
  const [localRow] = pedido.localId
    ? await db
        .select({ nombre: localesTable.nombre })
        .from(localesTable)
        .where(eq(localesTable.id, pedido.localId))
        .limit(1)
    : [];
  const detalles = await db
    .select({
      id: pedidoDetallesTable.id,
      productoId: pedidoDetallesTable.productoId,
      productoNombre: pedidoDetallesTable.descripcion,
      cantidad: pedidoDetallesTable.cantidad,
      precioUnitario: pedidoDetallesTable.precioUnitario,
      subtotal: pedidoDetallesTable.subtotal,
    })
    .from(pedidoDetallesTable)
    .where(eq(pedidoDetallesTable.pedidoId, pedido.id));

  return {
    id: pedido.id,
    localId: pedido.localId,
    localNombre: localRow?.nombre ?? null,
    clienteNombre: pedido.clienteNombre,
    clienteTelefono: pedido.clienteTelefono,
    clienteEmail: pedido.clienteEmail,
    observaciones: pedido.observaciones,
    subtotal: Number(pedido.subtotal),
    impuesto: Number(pedido.impuesto),
    total: Number(pedido.total),
    estado: pedido.estado,
    createdAt: pedido.createdAt.toISOString(),
    detalles: detalles.map((d) => ({
      id: d.id,
      productoId: d.productoId ?? 0,
      productoNombre: d.productoNombre,
      cantidad: d.cantidad,
      precioUnitario: Number(d.precioUnitario),
      subtotal: Number(d.subtotal),
    })),
  };
}

router.get("/", async (req, res) => {
  const parsed = ListPedidosQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Parámetros inválidos" });
    return;
  }
  const user = getUser(req)!;
  let { estado, localId } = parsed.data;
  if (user.role !== "admin" && user.localId) {
    localId = user.localId;
  }
  const conditions: SQL[] = [];
  if (estado) conditions.push(eq(pedidosTable.estado, estado));
  if (localId) conditions.push(eq(pedidosTable.localId, localId));

  const rows = await db
    .select({
      id: pedidosTable.id,
      localId: pedidosTable.localId,
      localNombre: localesTable.nombre,
      clienteNombre: pedidosTable.clienteNombre,
      clienteTelefono: pedidosTable.clienteTelefono,
      clienteEmail: pedidosTable.clienteEmail,
      observaciones: pedidosTable.observaciones,
      subtotal: pedidosTable.subtotal,
      impuesto: pedidosTable.impuesto,
      total: pedidosTable.total,
      estado: pedidosTable.estado,
      createdAt: pedidosTable.createdAt,
    })
    .from(pedidosTable)
    .leftJoin(localesTable, eq(localesTable.id, pedidosTable.localId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(pedidosTable.createdAt));

  res.json(
    rows.map((r) => ({
      ...r,
      subtotal: Number(r.subtotal),
      impuesto: Number(r.impuesto),
      total: Number(r.total),
      createdAt: r.createdAt.toISOString(),
      detalles: [],
    })),
  );
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [p] = await db.select().from(pedidosTable).where(eq(pedidosTable.id, id)).limit(1);
  if (!p) {
    res.status(404).json({ message: "No encontrado" });
    return;
  }
  res.json(await buildPedidoDto(p));
});

router.post("/", async (req, res) => {
  const parsed = CreatePedidoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const user = getUser(req)!;
  const data = parsed.data;
  if (!data.detalles || data.detalles.length === 0) {
    res.status(400).json({ message: "El pedido debe tener al menos una línea" });
    return;
  }

  let localId = data.localId ?? null;
  if (user.role !== "admin" && user.localId) localId = user.localId;

  // Compute totals
  let subtotal = 0;
  const enriched: Array<{
    productoId: number;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }> = [];
  for (const d of data.detalles) {
    const [prod] = await db
      .select()
      .from(productosTable)
      .where(eq(productosTable.id, d.productoId))
      .limit(1);
    if (!prod) {
      res.status(400).json({ message: `Producto ${d.productoId} no existe` });
      return;
    }
    const lineSubtotal = Number((d.precioUnitario * d.cantidad).toFixed(2));
    subtotal += lineSubtotal;
    enriched.push({
      productoId: d.productoId,
      descripcion: prod.nombre,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
      subtotal: lineSubtotal,
    });
  }
  const impuestoPct = data.impuestoPct ?? 0;
  const impuesto = Number((subtotal * (impuestoPct / 100)).toFixed(2));
  const total = Number((subtotal + impuesto).toFixed(2));

  const [pedido] = await db
    .insert(pedidosTable)
    .values({
      localId,
      clienteNombre: data.clienteNombre ?? null,
      clienteTelefono: data.clienteTelefono ?? null,
      clienteEmail: data.clienteEmail ?? null,
      observaciones: data.observaciones ?? null,
      subtotal: subtotal.toFixed(2),
      impuesto: impuesto.toFixed(2),
      total: total.toFixed(2),
      estado: "pendiente",
    })
    .returning();

  for (const d of enriched) {
    await db.insert(pedidoDetallesTable).values({
      pedidoId: pedido.id,
      productoId: d.productoId,
      descripcion: d.descripcion,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario.toFixed(2),
      subtotal: d.subtotal.toFixed(2),
    });
  }

  res.status(201).json(await buildPedidoDto(pedido));
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [p] = await db.select().from(pedidosTable).where(eq(pedidosTable.id, id)).limit(1);
  if (!p) {
    res.status(404).json({ message: "No encontrado" });
    return;
  }
  if (p.estado === "facturado") {
    res.status(400).json({ message: "No se puede anular un pedido facturado" });
    return;
  }
  await db
    .update(pedidosTable)
    .set({ estado: "anulado" })
    .where(eq(pedidosTable.id, id));
  res.json({ ok: true });
});

router.post("/:id/facturar", async (req, res) => {
  const id = Number(req.params.id);
  const user = getUser(req)!;
  const [p] = await db.select().from(pedidosTable).where(eq(pedidosTable.id, id)).limit(1);
  if (!p) {
    res.status(404).json({ message: "No encontrado" });
    return;
  }
  if (p.estado !== "pendiente") {
    res.status(400).json({ message: "El pedido no está pendiente" });
    return;
  }

  const detalles = await db
    .select()
    .from(pedidoDetallesTable)
    .where(eq(pedidoDetallesTable.pedidoId, id));

  // Generate factura number: F-YYYY-XXXXXX
  const numero = `F-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

  const [factura] = await db
    .insert(facturasTable)
    .values({
      pedidoId: p.id,
      localId: p.localId,
      numeroFactura: numero,
      clienteNombre: p.clienteNombre,
      clienteTelefono: p.clienteTelefono,
      clienteEmail: p.clienteEmail,
      subtotal: p.subtotal,
      impuesto: p.impuesto,
      total: p.total,
      estado: "emitida",
    })
    .returning();

  for (const d of detalles) {
    await db.insert(facturaDetallesTable).values({
      facturaId: factura.id,
      productoId: d.productoId,
      descripcion: d.descripcion,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
      subtotal: d.subtotal,
    });

    // Decrement stock if local available
    if (p.localId && d.productoId) {
      const [existing] = await db
        .select()
        .from(stockTable)
        .where(
          and(
            eq(stockTable.productoId, d.productoId),
            eq(stockTable.localId, p.localId),
          ),
        )
        .limit(1);
      if (existing) {
        await db
          .update(stockTable)
          .set({ cantidad: existing.cantidad - d.cantidad })
          .where(eq(stockTable.id, existing.id));
      } else {
        await db.insert(stockTable).values({
          productoId: d.productoId,
          localId: p.localId,
          cantidad: -d.cantidad,
        });
      }
      await db.insert(movimientosTable).values({
        productoId: d.productoId,
        localId: p.localId,
        tipo: "venta",
        cantidad: d.cantidad,
        nota: `Factura ${numero}`,
        usuarioId: user.id,
        pedidoId: p.id,
      });
    }
  }

  await db
    .update(pedidosTable)
    .set({ estado: "facturado" })
    .where(eq(pedidosTable.id, id));

  res.json({
    id: factura.id,
    pedidoId: factura.pedidoId,
    localId: factura.localId,
    localNombre: null,
    numeroFactura: factura.numeroFactura,
    clienteNombre: factura.clienteNombre,
    clienteTelefono: factura.clienteTelefono,
    clienteEmail: factura.clienteEmail,
    fecha: factura.fecha.toISOString(),
    subtotal: Number(factura.subtotal),
    impuesto: Number(factura.impuesto),
    total: Number(factura.total),
    estado: factura.estado,
    observaciones: factura.observaciones,
    detalles: detalles.map((d) => ({
      id: d.id,
      productoId: d.productoId,
      descripcion: d.descripcion,
      cantidad: d.cantidad,
      precioUnitario: Number(d.precioUnitario),
      subtotal: Number(d.subtotal),
    })),
  });
});

export default router;
