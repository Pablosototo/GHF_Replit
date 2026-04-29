import { Router, type IRouter } from "express";
import { eq, ilike, and, type SQL } from "drizzle-orm";
import { db, productosTable, categoriasTable } from "@workspace/db";
import {
  CreateProductoBody,
  UpdateProductoBody,
  ListProductosQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();
router.use(requireAuth);

function rowToDto(row: {
  id: number;
  categoriaId: number | null;
  categoriaNombre: string | null;
  nombre: string;
  sku: string | null;
  descripcion: string | null;
  precio: string;
  precioEntrada: string;
  presentacion: string | null;
  stockMinimo: number;
  activo: boolean;
}) {
  return {
    ...row,
    precio: Number(row.precio),
    precioEntrada: Number(row.precioEntrada),
  };
}

router.get("/", async (req, res) => {
  const parsed = ListProductosQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ message: "Parámetros inválidos" });
    return;
  }
  const { search, categoriaId } = parsed.data;
  const conditions: SQL[] = [];
  if (search) conditions.push(ilike(productosTable.nombre, `%${search}%`));
  if (categoriaId) conditions.push(eq(productosTable.categoriaId, categoriaId));

  const rows = await db
    .select({
      id: productosTable.id,
      categoriaId: productosTable.categoriaId,
      categoriaNombre: categoriasTable.nombre,
      nombre: productosTable.nombre,
      sku: productosTable.sku,
      descripcion: productosTable.descripcion,
      precio: productosTable.precio,
      precioEntrada: productosTable.precioEntrada,
      presentacion: productosTable.presentacion,
      stockMinimo: productosTable.stockMinimo,
      activo: productosTable.activo,
    })
    .from(productosTable)
    .leftJoin(categoriasTable, eq(categoriasTable.id, productosTable.categoriaId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(productosTable.nombre);

  res.json(rows.map(rowToDto));
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select({
      id: productosTable.id,
      categoriaId: productosTable.categoriaId,
      categoriaNombre: categoriasTable.nombre,
      nombre: productosTable.nombre,
      sku: productosTable.sku,
      descripcion: productosTable.descripcion,
      precio: productosTable.precio,
      precioEntrada: productosTable.precioEntrada,
      presentacion: productosTable.presentacion,
      stockMinimo: productosTable.stockMinimo,
      activo: productosTable.activo,
    })
    .from(productosTable)
    .leftJoin(categoriasTable, eq(categoriasTable.id, productosTable.categoriaId))
    .where(eq(productosTable.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ message: "No encontrado" });
    return;
  }
  res.json(rowToDto(row));
});

router.post("/", async (req, res) => {
  const parsed = CreateProductoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const [row] = await db
    .insert(productosTable)
    .values({
      categoriaId: parsed.data.categoriaId ?? null,
      nombre: parsed.data.nombre,
      sku: parsed.data.sku ?? null,
      descripcion: parsed.data.descripcion ?? null,
      precio: String(parsed.data.precio),
      precioEntrada: String(parsed.data.precioEntrada ?? 0),
      presentacion: parsed.data.presentacion ?? null,
      stockMinimo: parsed.data.stockMinimo ?? 0,
      activo: parsed.data.activo ?? true,
    })
    .returning();
  res.status(201).json({
    ...row,
    precio: Number(row.precio),
    precioEntrada: Number(row.precioEntrada),
    categoriaNombre: null,
  });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateProductoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const [row] = await db
    .update(productosTable)
    .set({
      categoriaId: parsed.data.categoriaId ?? null,
      nombre: parsed.data.nombre,
      sku: parsed.data.sku ?? null,
      descripcion: parsed.data.descripcion ?? null,
      precio: String(parsed.data.precio),
      precioEntrada: String(parsed.data.precioEntrada ?? 0),
      presentacion: parsed.data.presentacion ?? null,
      stockMinimo: parsed.data.stockMinimo ?? 0,
      activo: parsed.data.activo ?? true,
    })
    .where(eq(productosTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ message: "No encontrado" });
    return;
  }
  res.json({
    ...row,
    precio: Number(row.precio),
    precioEntrada: Number(row.precioEntrada),
    categoriaNombre: null,
  });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(productosTable).where(eq(productosTable.id, id));
  res.json({ ok: true });
});

export default router;
