import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, categoriasTable, productosTable, categoriaHorariosTable } from "@workspace/db";
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
      impuestoPct: categoriasTable.impuestoPct,
      activo: categoriasTable.activo,
      productosCount: sql<number>`count(${productosTable.id})::int`.as("productos_count"),
    })
    .from(categoriasTable)
    .leftJoin(productosTable, eq(productosTable.categoriaId, categoriasTable.id))
    .groupBy(categoriasTable.id)
    .orderBy(categoriasTable.nombre);
  res.json(rows.map((r) => ({ ...r, impuestoPct: Number(r.impuestoPct) })));
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
      impuestoPct: String((parsed.data as any).impuestoPct ?? 13),
      activo: parsed.data.activo ?? true,
    })
    .returning();
  res.status(201).json({ ...row, impuestoPct: Number(row.impuestoPct), productosCount: 0 });
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
      impuestoPct: String((parsed.data as any).impuestoPct ?? 13),
      activo: parsed.data.activo ?? true,
    })
    .where(eq(categoriasTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ message: "No encontrado" });
    return;
  }
  res.json({ ...row, impuestoPct: Number(row.impuestoPct), productosCount: 0 });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(categoriasTable).where(eq(categoriasTable.id, id));
  res.json({ ok: true });
});

// --- Horarios de disponibilidad ---
router.get("/:id/horarios", async (req, res) => {
  const id = Number(req.params.id);
  const rows = await db
    .select()
    .from(categoriaHorariosTable)
    .where(eq(categoriaHorariosTable.categoriaId, id));
  res.json(rows);
});

router.post("/:id/horarios", async (req, res) => {
  const id = Number(req.params.id);
  const { diaSemana, horaInicio, horaFin, activo } = req.body;
  if (diaSemana == null || !horaInicio || !horaFin) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const [row] = await db
    .insert(categoriaHorariosTable)
    .values({ categoriaId: id, diaSemana: Number(diaSemana), horaInicio, horaFin, activo: activo !== false })
    .returning();
  res.status(201).json(row);
});

router.put("/:id/horarios/:hid", async (req, res) => {
  const hid = Number(req.params.hid);
  const { diaSemana, horaInicio, horaFin, activo } = req.body;
  const [row] = await db
    .update(categoriaHorariosTable)
    .set({ diaSemana: Number(diaSemana), horaInicio, horaFin, activo: activo !== false })
    .where(eq(categoriaHorariosTable.id, hid))
    .returning();
  res.json(row);
});

router.delete("/:id/horarios/:hid", async (req, res) => {
  const hid = Number(req.params.hid);
  await db.delete(categoriaHorariosTable).where(eq(categoriaHorariosTable.id, hid));
  res.json({ ok: true });
});

export default router;
