import { Router, type IRouter } from "express";
import { eq, and, desc, type SQL } from "drizzle-orm";
import {
  db,
  facturasTable,
  facturaDetallesTable,
  localesTable,
} from "@workspace/db";
import { ListFacturasQueryParams } from "@workspace/api-zod";
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
