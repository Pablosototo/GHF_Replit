import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, categoriasTable, productosTable } from "@workspace/db";
import { CreateCategoriaBody, UpdateCategoriaBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const rows = await db
    .select({
      id: categoriasTable.id,
      nombre: categoriasTable.nombre,
      descripcion: categoriasTable.descripcion,
      activo: categoriasTable.activo,
      productosCount: sql<number>`count(${productosTable.id})::int`.as("productos_count"),
    })
    .from(categoriasTable)
    .leftJoin(productosTable, eq(productosTable.categoriaId, categoriasTable.id))
    .groupBy(categoriasTable.id)
    .orderBy(categoriasTable.nombre);
  res.json(rows);
});

router.post("/", async (req, res) => {
  const parsed = CreateCategoriaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const [row] = await db
    .insert(categoriasTable)
    .values({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion ?? null,
      activo: parsed.data.activo ?? true,
    })
    .returning();
  res.status(201).json({ ...row, productosCount: 0 });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateCategoriaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const [row] = await db
    .update(categoriasTable)
    .set({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion ?? null,
      activo: parsed.data.activo ?? true,
    })
    .where(eq(categoriasTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ message: "No encontrado" });
    return;
  }
  res.json({ ...row, productosCount: 0 });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(categoriasTable).where(eq(categoriasTable.id, id));
  res.json({ ok: true });
});

export default router;
