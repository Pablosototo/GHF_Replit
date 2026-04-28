import { Router, type IRouter } from "express";
import { eq, ilike, and, desc, type SQL } from "drizzle-orm";
import {
  db,
  stockTable,
  movimientosTable,
  productosTable,
  localesTable,
  categoriasTable,
  usersTable,
} from "@workspace/db";
import {
  CreateMovimientoBody,
  ListStockQueryParams,
  ListMovimientosQueryParams,
} from "@workspace/api-zod";
import { requireAuth, getUser } from "../lib/auth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const parsed = ListStockQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Parámetros inválidos" });
    return;
  }
  const user = getUser(req)!;
  let { localId, search } = parsed.data;
  if (user.role !== "admin" && user.localId) {
    localId = user.localId;
  }
  const conditions: SQL[] = [];
  if (localId) conditions.push(eq(stockTable.localId, localId));
  if (search) conditions.push(ilike(productosTable.nombre, `%${search}%`));

  const rows = await db
    .select({
      productoId: productosTable.id,
      productoNombre: productosTable.nombre,
      sku: productosTable.sku,
      categoriaNombre: categoriasTable.nombre,
      localId: localesTable.id,
      localNombre: localesTable.nombre,
      cantidad: stockTable.cantidad,
      stockMinimo: productosTable.stockMinimo,
    })
    .from(stockTable)
    .innerJoin(productosTable, eq(productosTable.id, stockTable.productoId))
    .innerJoin(localesTable, eq(localesTable.id, stockTable.localId))
    .leftJoin(categoriasTable, eq(categoriasTable.id, productosTable.categoriaId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(localesTable.nombre, productosTable.nombre);

  res.json(
    rows.map((r) => ({
      ...r,
      estado:
        r.cantidad <= 0 ? "agotado" : r.cantidad <= r.stockMinimo ? "bajo" : "ok",
    })),
  );
});

router.get("/movimientos", async (req, res) => {
  const parsed = ListMovimientosQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Parámetros inválidos" });
    return;
  }
  const user = getUser(req)!;
  let { localId, limite } = parsed.data;
  if (user.role !== "admin" && user.localId) {
    localId = user.localId;
  }
  const conditions: SQL[] = [];
  if (localId) conditions.push(eq(movimientosTable.localId, localId));

  const rows = await db
    .select({
      id: movimientosTable.id,
      productoId: movimientosTable.productoId,
      productoNombre: productosTable.nombre,
      localId: movimientosTable.localId,
      localNombre: localesTable.nombre,
      tipo: movimientosTable.tipo,
      cantidad: movimientosTable.cantidad,
      nota: movimientosTable.nota,
      usuarioNombre: usersTable.name,
      createdAt: movimientosTable.createdAt,
    })
    .from(movimientosTable)
    .innerJoin(productosTable, eq(productosTable.id, movimientosTable.productoId))
    .innerJoin(localesTable, eq(localesTable.id, movimientosTable.localId))
    .leftJoin(usersTable, eq(usersTable.id, movimientosTable.usuarioId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(movimientosTable.createdAt))
    .limit(limite ?? 50);

  res.json(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.post("/movimientos", async (req, res) => {
  const parsed = CreateMovimientoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const user = getUser(req)!;
  const { productoId, localId, tipo, cantidad, nota } = parsed.data;

  // Compute delta
  let delta = 0;
  if (tipo === "entrada") delta = Math.abs(cantidad);
  else if (tipo === "salida" || tipo === "venta") delta = -Math.abs(cantidad);
  else if (tipo === "ajuste") delta = cantidad;
  else {
    res.status(400).json({ message: "Tipo inválido" });
    return;
  }

  // Upsert stock row
  const [existing] = await db
    .select()
    .from(stockTable)
    .where(and(eq(stockTable.productoId, productoId), eq(stockTable.localId, localId)))
    .limit(1);

  if (existing) {
    await db
      .update(stockTable)
      .set({ cantidad: existing.cantidad + delta })
      .where(eq(stockTable.id, existing.id));
  } else {
    await db.insert(stockTable).values({ productoId, localId, cantidad: delta });
  }

  const [mov] = await db
    .insert(movimientosTable)
    .values({
      productoId,
      localId,
      tipo,
      cantidad: Math.abs(cantidad),
      nota: nota ?? null,
      usuarioId: user.id,
    })
    .returning();

  const [info] = await db
    .select({ productoNombre: productosTable.nombre, localNombre: localesTable.nombre })
    .from(productosTable)
    .innerJoin(localesTable, eq(localesTable.id, localId))
    .where(eq(productosTable.id, productoId))
    .limit(1);

  res.status(201).json({
    id: mov.id,
    productoId: mov.productoId,
    productoNombre: info?.productoNombre ?? "",
    localId: mov.localId,
    localNombre: info?.localNombre ?? "",
    tipo: mov.tipo,
    cantidad: mov.cantidad,
    nota: mov.nota,
    usuarioNombre: user.name,
    createdAt: mov.createdAt.toISOString(),
  });
});

export default router;
