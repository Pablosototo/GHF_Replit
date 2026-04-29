import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, categoriasTable, productosTable, categoriaHorariosTable } from "@workspace/db";
import { CreateCategoriaBody, UpdateCategoriaBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();
router.use(requireAuth);

/** Determines if a category is available right now based on its horarios (Costa Rica UTC-6). */
function calcDisponibleAhora(horarios: Array<{ diaSemana: number; horaInicio: string; horaFin: string; activo: boolean }>): boolean {
  const active = horarios.filter(h => h.activo);
  if (active.length === 0) return true; // no restrictions → always available

  // Compute current Costa Rica time (UTC-6, no DST)
  const now = new Date();
  const utcTotalMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  const crTotalMin = ((utcTotalMin - 360) % 1440 + 1440) % 1440; // UTC-6
  const crH = Math.floor(crTotalMin / 60);
  const crM = crTotalMin % 60;
  const utcDay = now.getUTCDay();
  // Adjust day if CR time crossed midnight
  const crDay = utcTotalMin < 360 ? ((utcDay - 1 + 7) % 7) : utcDay;
  const currentTime = `${String(crH).padStart(2, "0")}:${String(crM).padStart(2, "0")}`;

  return active.some(h => h.diaSemana === crDay && h.horaInicio <= currentTime && currentTime < h.horaFin);
}

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

  // Fetch all horarios in one query and group by categoriaId
  const allHorarios = await db.select().from(categoriaHorariosTable);
  const horariosByCat = new Map<number, typeof allHorarios>();
  for (const h of allHorarios) {
    if (!horariosByCat.has(h.categoriaId)) horariosByCat.set(h.categoriaId, []);
    horariosByCat.get(h.categoriaId)!.push(h);
  }

  res.json(rows.map((r) => ({
    ...r,
    impuestoPct: Number(r.impuestoPct),
    disponibleAhora: calcDisponibleAhora(horariosByCat.get(r.id) ?? []),
  })));
});

router.post("/", async (req, res) => {
  const parsed = CreateCategoriaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const impuestoPct = req.body.impuestoPct != null ? Number(req.body.impuestoPct) : 13;
  const [row] = await db
    .insert(categoriasTable)
    .values({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion ?? null,
      impuestoPct: String(impuestoPct),
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
  const impuestoPct = req.body.impuestoPct != null ? Number(req.body.impuestoPct) : 13;
  const [row] = await db
    .update(categoriasTable)
    .set({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion ?? null,
      impuestoPct: String(impuestoPct),
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
