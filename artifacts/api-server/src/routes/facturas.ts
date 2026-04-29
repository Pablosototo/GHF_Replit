import { Router, type IRouter } from "express";
import { eq, and, desc, type SQL } from "drizzle-orm";
import {
  db,
  facturasTable,
  facturaDetallesTable,
  localesTable,
  productosTable,
  stockTable,
  movimientosTable,
} from "@workspace/db";
import { CreateFacturaBody, ListFacturasQueryParams } from "@workspace/api-zod";
import { requireAuth, getUser } from "../lib/auth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const parsed = ListFacturasQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Parámetros inválidos" });
    return;
  }
  const user = getUser(req)!;
  let { localId, estado } = parsed.data;
  if (user.role !== "admin" && user.localId) {
    localId = user.localId;
  }
  const conditions: SQL[] = [];
  if (estado) conditions.push(eq(facturasTable.estado, estado));
  if (localId) conditions.push(eq(facturasTable.localId, localId));

  const rows = await db
    .select({
      id: facturasTable.id,
      pedidoId: facturasTable.pedidoId,
      localId: facturasTable.localId,
      localNombre: localesTable.nombre,
      numeroFactura: facturasTable.numeroFactura,
      clienteNombre: facturasTable.clienteNombre,
      clienteTelefono: facturasTable.clienteTelefono,
      clienteEmail: facturasTable.clienteEmail,
      fecha: facturasTable.fecha,
      subtotal: facturasTable.subtotal,
      impuesto: facturasTable.impuesto,
      total: facturasTable.total,
      estado: facturasTable.estado,
      observaciones: facturasTable.observaciones,
    })
    .from(facturasTable)
    .leftJoin(localesTable, eq(localesTable.id, facturasTable.localId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(facturasTable.fecha));

  res.json(
    rows.map((r) => ({
      ...r,
      fecha: r.fecha.toISOString(),
      subtotal: Number(r.subtotal),
      impuesto: Number(r.impuesto),
      total: Number(r.total),
      detalles: [],
    })),
  );
});

router.post("/", async (req, res) => {
  const parsed = CreateFacturaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const user = getUser(req)!;
  if (user.role !== "admin") {
    res.status(403).json({ message: "Solo administradores pueden crear facturas manuales" });
    return;
  }
  const data = parsed.data;
  if (!data.detalles || data.detalles.length === 0) {
    res.status(400).json({ message: "La factura debe tener al menos una línea" });
    return;
  }

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

  const numero = `F-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const localId = data.localId ?? null;

  const [factura] = await db
    .insert(facturasTable)
    .values({
      pedidoId: null,
      localId,
      numeroFactura: numero,
      clienteNombre: data.clienteNombre ?? null,
      clienteTelefono: data.clienteTelefono ?? null,
      clienteEmail: data.clienteEmail ?? null,
      observaciones: data.observaciones ?? null,
      subtotal: subtotal.toFixed(2),
      impuesto: impuesto.toFixed(2),
      total: total.toFixed(2),
      estado: "emitida",
    })
    .returning();

  for (const d of enriched) {
    await db.insert(facturaDetallesTable).values({
      facturaId: factura.id,
      productoId: d.productoId,
      descripcion: d.descripcion,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario.toFixed(2),
      subtotal: d.subtotal.toFixed(2),
    });

    if (localId) {
      const [existing] = await db
        .select()
        .from(stockTable)
        .where(
          and(
            eq(stockTable.productoId, d.productoId),
            eq(stockTable.localId, localId),
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
          localId,
          cantidad: -d.cantidad,
        });
      }
      await db.insert(movimientosTable).values({
        productoId: d.productoId,
        localId,
        tipo: "venta",
        cantidad: d.cantidad,
        nota: `Factura ${numero}`,
        usuarioId: user.id,
      });
    }
  }

  res.status(201).json({
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
    detalles: enriched.map((d, idx) => ({
      id: idx + 1,
      productoId: d.productoId,
      descripcion: d.descripcion,
      cantidad: d.cantidad,
      precioUnitario: d.precioUnitario,
      subtotal: d.subtotal,
    })),
  });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [f] = await db
    .select({
      id: facturasTable.id,
      pedidoId: facturasTable.pedidoId,
      localId: facturasTable.localId,
      localNombre: localesTable.nombre,
      numeroFactura: facturasTable.numeroFactura,
      clienteNombre: facturasTable.clienteNombre,
      clienteTelefono: facturasTable.clienteTelefono,
      clienteEmail: facturasTable.clienteEmail,
      fecha: facturasTable.fecha,
      subtotal: facturasTable.subtotal,
      impuesto: facturasTable.impuesto,
      total: facturasTable.total,
      estado: facturasTable.estado,
      observaciones: facturasTable.observaciones,
    })
    .from(facturasTable)
    .leftJoin(localesTable, eq(localesTable.id, facturasTable.localId))
    .where(eq(facturasTable.id, id))
    .limit(1);
  if (!f) {
    res.status(404).json({ message: "No encontrado" });
    return;
  }
  const detalles = await db
    .select()
    .from(facturaDetallesTable)
    .where(eq(facturaDetallesTable.facturaId, id));
  res.json({
    ...f,
    fecha: f.fecha.toISOString(),
    subtotal: Number(f.subtotal),
    impuesto: Number(f.impuesto),
    total: Number(f.total),
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
