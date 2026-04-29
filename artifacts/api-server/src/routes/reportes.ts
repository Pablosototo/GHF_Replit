import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sum, type SQL } from "drizzle-orm";
import { db, pedidoDetallesTable, pedidosTable, productosTable, categoriasTable } from "@workspace/db";
import { requireAuth, getUser } from "../lib/auth";

const router: IRouter = Router();
router.use(requireAuth);

// Unidades pedidas por producto con filtros de fecha
router.get("/unidades-pedidas", async (req, res) => {
  const user = getUser(req)!;
  const { fechaInicio, fechaFin, productoId, localId: localIdQ } = req.query as Record<string, string>;

  const pedidoConditions: SQL[] = [];
  if (user.role !== "admin" && user.localId) {
    pedidoConditions.push(eq(pedidosTable.localId, user.localId));
  } else if (localIdQ) {
    pedidoConditions.push(eq(pedidosTable.localId, Number(localIdQ)));
  }
  if (fechaInicio) pedidoConditions.push(gte(pedidosTable.createdAt, new Date(fechaInicio)));
  if (fechaFin) {
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);
    pedidoConditions.push(lte(pedidosTable.createdAt, fin));
  }
  // Exclude cancelled orders
  pedidoConditions.push(
    ...[]
  );

  // Subquery approach: join pedido_detalles → pedidos → productos
  const rows = await db
    .select({
      productoId: pedidoDetallesTable.productoId,
      productoNombre: productosTable.nombre,
      categoriaNombre: categoriasTable.nombre,
      totalUnidades: sum(pedidoDetallesTable.cantidad).mapWith(Number),
    })
    .from(pedidoDetallesTable)
    .innerJoin(pedidosTable, eq(pedidosTable.id, pedidoDetallesTable.pedidoId))
    .leftJoin(productosTable, eq(productosTable.id, pedidoDetallesTable.productoId))
    .leftJoin(categoriasTable, eq(categoriasTable.id, productosTable.categoriaId))
    .where(
      and(
        ...pedidoConditions,
        productoId ? eq(pedidoDetallesTable.productoId, Number(productoId)) : undefined,
      ) ?? undefined
    )
    .groupBy(
      pedidoDetallesTable.productoId,
      productosTable.nombre,
      categoriasTable.nombre,
    )
    .orderBy(productosTable.nombre);

  res.json(rows.map((r) => ({
    productoId: r.productoId,
    productoNombre: r.productoNombre ?? "(sin nombre)",
    categoriaNombre: r.categoriaNombre ?? "-",
    totalUnidades: r.totalUnidades ?? 0,
  })));
});

export default router;
