import { Router, type IRouter } from "express";
import { eq, and, sql, gte, desc, type SQL } from "drizzle-orm";
import {
  db,
  facturasTable,
  pedidosTable,
  productosTable,
  stockTable,
  localesTable,
  marcasTable,
  facturaDetallesTable,
} from "@workspace/db";
import { requireAuth, getUser } from "../lib/auth";

const router: IRouter = Router();
router.use(requireAuth);

function diasDesde(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(0, 0, 0, 0);
  return d;
}

function scopedLocalId(req: any): number | undefined {
  const user = getUser(req)!;
  if (user.role !== "admin" && user.localId) return user.localId;
  if (req.query.localId) return Number(req.query.localId);
  return undefined;
}

router.get("/resumen", async (req, res) => {
  const dias = req.query.dias ? Number(req.query.dias) : 30;
  const desde = diasDesde(dias);
  const localId = scopedLocalId(req);

  const facturaConds: SQL[] = [
    eq(facturasTable.estado, "emitida"),
    gte(facturasTable.fecha, desde),
  ];
  const pedidoConds: SQL[] = [gte(pedidosTable.createdAt, desde)];
  const stockConds: SQL[] = [];
  if (localId !== undefined) {
    facturaConds.push(eq(facturasTable.localId, localId));
    pedidoConds.push(eq(pedidosTable.localId, localId));
    stockConds.push(eq(stockTable.localId, localId));
  }

  const [v] = await db
    .select({
      total: sql<string>`coalesce(sum(${facturasTable.total}),0)`,
      cantidad: sql<number>`count(*)::int`,
    })
    .from(facturasTable)
    .where(and(...facturaConds));

  const [p] = await db
    .select({ cantidad: sql<number>`count(*)::int` })
    .from(pedidosTable)
    .where(and(...pedidoConds));

  const [prods] = await db
    .select({ cantidad: sql<number>`count(*)::int` })
    .from(productosTable);

  const [stockBajo] = await db
    .select({ cantidad: sql<number>`count(*)::int` })
    .from(stockTable)
    .innerJoin(productosTable, eq(productosTable.id, stockTable.productoId))
    .where(
      and(
        sql`${stockTable.cantidad} <= ${productosTable.stockMinimo}`,
        ...stockConds,
      ),
    );

  const ventasTotales = Number(v.total);
  const facturasCount = v.cantidad;
  const ticketPromedio =
    facturasCount > 0 ? Number((ventasTotales / facturasCount).toFixed(2)) : 0;

  res.json({
    ventasTotales,
    pedidosCount: p.cantidad,
    facturasCount,
    productosCount: prods.cantidad,
    ticketPromedio,
    stockBajoCount: stockBajo.cantidad,
  });
});

router.get("/ventas-por-dia", async (req, res) => {
  const dias = req.query.dias ? Number(req.query.dias) : 30;
  const desde = diasDesde(dias - 1);
  const localId = scopedLocalId(req);

  const conds: SQL[] = [
    eq(facturasTable.estado, "emitida"),
    gte(facturasTable.fecha, desde),
  ];
  if (localId !== undefined) conds.push(eq(facturasTable.localId, localId));

  const rows = await db
    .select({
      fecha: sql<string>`to_char(${facturasTable.fecha}, 'YYYY-MM-DD')`.as("fecha"),
      total: sql<string>`coalesce(sum(${facturasTable.total}),0)`,
      pedidos: sql<number>`count(*)::int`,
    })
    .from(facturasTable)
    .where(and(...conds))
    .groupBy(sql`to_char(${facturasTable.fecha}, 'YYYY-MM-DD')`);

  const map = new Map(rows.map((r) => [r.fecha, { total: Number(r.total), pedidos: r.pedidos }]));
  const out: Array<{ fecha: string; total: number; pedidos: number }> = [];
  for (let i = 0; i < dias; i++) {
    const d = new Date(desde);
    d.setDate(desde.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const v = map.get(key);
    out.push({ fecha: key, total: v?.total ?? 0, pedidos: v?.pedidos ?? 0 });
  }
  res.json(out);
});

router.get("/top-productos", async (req, res) => {
  const dias = req.query.dias ? Number(req.query.dias) : 30;
  const limite = req.query.limite ? Number(req.query.limite) : 5;
  const desde = diasDesde(dias);
  const localId = scopedLocalId(req);

  const conds: SQL[] = [
    eq(facturasTable.estado, "emitida"),
    gte(facturasTable.fecha, desde),
  ];
  if (localId !== undefined) conds.push(eq(facturasTable.localId, localId));

  const rows = await db
    .select({
      productoId: productosTable.id,
      productoNombre: productosTable.nombre,
      cantidadVendida: sql<number>`coalesce(sum(${facturaDetallesTable.cantidad}),0)::int`,
      ingresos: sql<string>`coalesce(sum(${facturaDetallesTable.subtotal}),0)`,
    })
    .from(facturaDetallesTable)
    .innerJoin(productosTable, eq(productosTable.id, facturaDetallesTable.productoId))
    .innerJoin(facturasTable, eq(facturasTable.id, facturaDetallesTable.facturaId))
    .where(and(...conds))
    .groupBy(productosTable.id, productosTable.nombre)
    .orderBy(desc(sql`coalesce(sum(${facturaDetallesTable.subtotal}),0)`))
    .limit(limite);

  res.json(
    rows.map((r) => ({
      productoId: r.productoId,
      productoNombre: r.productoNombre,
      cantidadVendida: r.cantidadVendida,
      ingresos: Number(r.ingresos),
    })),
  );
});

router.get("/ventas-por-local", async (req, res) => {
  const dias = req.query.dias ? Number(req.query.dias) : 30;
  const desde = diasDesde(dias);

  const rows = await db
    .select({
      localId: localesTable.id,
      localNombre: localesTable.nombre,
      marcaNombre: marcasTable.nombre,
      total: sql<string>`coalesce(sum(${facturasTable.total}),0)`,
      pedidos: sql<number>`count(${facturasTable.id})::int`,
    })
    .from(localesTable)
    .leftJoin(marcasTable, eq(marcasTable.id, localesTable.marcaId))
    .leftJoin(
      facturasTable,
      and(
        eq(facturasTable.localId, localesTable.id),
        eq(facturasTable.estado, "emitida"),
        gte(facturasTable.fecha, desde),
      ),
    )
    .groupBy(localesTable.id, localesTable.nombre, marcasTable.nombre)
    .orderBy(desc(sql`coalesce(sum(${facturasTable.total}),0)`));

  res.json(
    rows.map((r) => ({
      localId: r.localId,
      localNombre: r.localNombre,
      marcaNombre: r.marcaNombre,
      total: Number(r.total),
      pedidos: r.pedidos,
    })),
  );
});

router.get("/stock-bajo", async (req, res) => {
  const limite = req.query.limite ? Number(req.query.limite) : 10;
  const localId = scopedLocalId(req);
  const conds: SQL[] = [sql`${stockTable.cantidad} <= ${productosTable.stockMinimo}`];
  if (localId !== undefined) conds.push(eq(stockTable.localId, localId));

  const rows = await db
    .select({
      productoId: productosTable.id,
      productoNombre: productosTable.nombre,
      localId: localesTable.id,
      localNombre: localesTable.nombre,
      cantidad: stockTable.cantidad,
      stockMinimo: productosTable.stockMinimo,
    })
    .from(stockTable)
    .innerJoin(productosTable, eq(productosTable.id, stockTable.productoId))
    .innerJoin(localesTable, eq(localesTable.id, stockTable.localId))
    .where(and(...conds))
    .orderBy(stockTable.cantidad)
    .limit(limite);

  res.json(rows);
});

router.get("/actividad-reciente", async (req, res) => {
  const localId = scopedLocalId(req);
  const facturaConds: SQL[] = [];
  const pedidoConds: SQL[] = [];
  if (localId !== undefined) {
    facturaConds.push(eq(facturasTable.localId, localId));
    pedidoConds.push(eq(pedidosTable.localId, localId));
  }

  const facts = await db
    .select({
      tipo: sql<string>`'factura'`.as("tipo"),
      id: facturasTable.id,
      titulo: facturasTable.numeroFactura,
      subtitulo: facturasTable.clienteNombre,
      monto: facturasTable.total,
      createdAt: facturasTable.fecha,
    })
    .from(facturasTable)
    .where(facturaConds.length ? and(...facturaConds) : undefined)
    .orderBy(desc(facturasTable.fecha))
    .limit(10);

  const peds = await db
    .select({
      tipo: sql<string>`'pedido'`.as("tipo"),
      id: pedidosTable.id,
      titulo: sql<string>`'Pedido #' || ${pedidosTable.id}`.as("titulo"),
      subtitulo: pedidosTable.clienteNombre,
      monto: pedidosTable.total,
      createdAt: pedidosTable.createdAt,
    })
    .from(pedidosTable)
    .where(pedidoConds.length ? and(...pedidoConds) : undefined)
    .orderBy(desc(pedidosTable.createdAt))
    .limit(10);

  const all = [
    ...facts.map((f) => ({
      tipo: f.tipo,
      id: f.id,
      titulo: f.titulo,
      subtitulo: f.subtitulo,
      monto: Number(f.monto),
      createdAt: f.createdAt.toISOString(),
    })),
    ...peds.map((p) => ({
      tipo: p.tipo,
      id: p.id,
      titulo: p.titulo,
      subtitulo: p.subtitulo,
      monto: Number(p.monto),
      createdAt: p.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 15);

  res.json(all);
});

export default router;
