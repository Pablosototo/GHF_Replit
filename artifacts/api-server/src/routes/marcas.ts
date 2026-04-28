import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, marcasTable, localesTable } from "@workspace/db";
import { CreateMarcaBody, UpdateMarcaBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const rows = await db
    .select({
      id: marcasTable.id,
      nombre: marcasTable.nombre,
      slug: marcasTable.slug,
      activo: marcasTable.activo,
      localesCount: sql<number>`count(${localesTable.id})::int`.as("locales_count"),
    })
    .from(marcasTable)
    .leftJoin(localesTable, eq(localesTable.marcaId, marcasTable.id))
    .groupBy(marcasTable.id)
    .orderBy(marcasTable.nombre);
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db.select().from(marcasTable).where(eq(marcasTable.id, id)).limit(1);
  if (!row) {
    res.status(404).json({ message: "No encontrado" });
    return;
  }
  res.json({ ...row, localesCount: 0 });
});

router.post("/", async (req, res) => {
  const parsed = CreateMarcaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const [row] = await db
    .insert(marcasTable)
    .values({
      nombre: parsed.data.nombre,
      slug: parsed.data.slug ?? null,
      activo: parsed.data.activo ?? true,
    })
    .returning();
  res.status(201).json({ ...row, localesCount: 0 });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateMarcaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const [row] = await db
    .update(marcasTable)
    .set({
      nombre: parsed.data.nombre,
      slug: parsed.data.slug ?? null,
      activo: parsed.data.activo ?? true,
    })
    .where(eq(marcasTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ message: "No encontrado" });
    return;
  }
  res.json({ ...row, localesCount: 0 });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(marcasTable).where(eq(marcasTable.id, id));
  res.json({ ok: true });
});

export default router;
