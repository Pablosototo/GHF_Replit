import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, categoriasTable, productosTable, categoriaHorariosTable } from "@workspace/db";
import { CreateCategoriaBody, UpdateCategoriaBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();
router.use(requireAuth);

type HorarioRow = { diaInicio: number; horaInicio: string; diaFin: number; horaFin: string; activo: boolean };

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Returns current Costa Rica time as { crDay (0=Sun..6=Sat), crWeekMin (minutes from Sunday 00:00) } */
function crNow() {
  const now = new Date();
  const utcTotalMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  const crTotalMin = ((utcTotalMin - 360) % 1440 + 1440) % 1440; // UTC-6
  const utcDay = now.getUTCDay();
  const crDay = utcTotalMin < 360 ? ((utcDay - 1 + 7) % 7) : utcDay;
  return { crDay, crWeekMin: crDay * 1440 + crTotalMin };
}

/** Whether the category is available right now (Costa Rica UTC-6). Multi-day spans supported. */
function calcDisponibleAhora(horarios: HorarioRow[]): boolean {
  const active = horarios.filter(h => h.activo);
  if (active.length === 0) return true; // no restrictions → always available

  const { crWeekMin } = crNow();

  return active.some(h => {
    const startMin = h.diaInicio * 1440 + timeToMin(h.horaInicio);
    const endMin = h.diaFin * 1440 + timeToMin(h.horaFin);
    return startMin <= crWeekMin && crWeekMin < endMin;
  });
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

  const allHorarios = await db.select().from(categoriaHorariosTable);
  const horariosByCat = new Map<number, typeof allHorarios>();
  for (const h of allHorarios) {
    if (!horariosByCat.has(h.categoriaId)) horariosByCat.set(h.categoriaId, []);
    horariosByCat.get(h.categoriaId)!.push(h);
  }

  res.json(rows.map((r) => {
    const horarios = horariosByCat.get(r.id) ?? [];
    return {
      ...r,
      impuestoPct: Number(r.impuestoPct),
      disponibleAhora: calcDisponibleAhora(horarios),
      horarios: horarios.map(h => ({
        id: h.id,
        diaInicio: h.diaInicio,
        horaInicio: h.horaInicio,
        diaFin: h.diaFin,
        horaFin: h.horaFin,
        activo: h.activo,
      })),
    };
  }));
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
  res.status(201).json({ ...row, impuestoPct: Number(row.impuestoPct), productosCount: 0, disponibleAhora: true, horarios: [] });
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
  res.json({ ...row, impuestoPct: Number(row.impuestoPct), productosCount: 0, disponibleAhora: true, horarios: [] });
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
  const { diaInicio, horaInicio, diaFin, horaFin, activo } = req.body;
  if (diaInicio == null || diaFin == null || !horaInicio || !horaFin) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const [row] = await db
    .insert(categoriaHorariosTable)
    .values({ categoriaId: id, diaInicio: Number(diaInicio), horaInicio, diaFin: Number(diaFin), horaFin, activo: activo !== false })
    .returning();
  res.status(201).json(row);
});

router.put("/:id/horarios/:hid", async (req, res) => {
  const hid = Number(req.params.hid);
  const { diaInicio, horaInicio, diaFin, horaFin, activo } = req.body;
  const [row] = await db
    .update(categoriaHorariosTable)
    .set({ diaInicio: Number(diaInicio), horaInicio, diaFin: Number(diaFin), horaFin, activo: activo !== false })
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
