import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, sociedadesTable, localesTable } from "@workspace/db";
import { CreateSociedadBody, UpdateSociedadBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/", async (_req, res) => {
  const rows = await db
    .select({
      id: sociedadesTable.id,
      nombre: sociedadesTable.nombre,
      cedulaJuridica: sociedadesTable.cedulaJuridica,
      correo: sociedadesTable.correo,
      telefono: sociedadesTable.telefono,
      direccion: sociedadesTable.direccion,
      activo: sociedadesTable.activo,
      localesCount: sql<number>`count(${localesTable.id})::int`.as("locales_count"),
    })
    .from(sociedadesTable)
    .leftJoin(localesTable, eq(localesTable.sociedadId, sociedadesTable.id))
    .groupBy(sociedadesTable.id)
    .orderBy(sociedadesTable.nombre);
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select()
    .from(sociedadesTable)
    .where(eq(sociedadesTable.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ message: "No encontrado" });
    return;
  }
  res.json({ ...row, localesCount: 0 });
});

router.post("/", async (req, res) => {
  const parsed = CreateSociedadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const [row] = await db
    .insert(sociedadesTable)
    .values({
      nombre: parsed.data.nombre,
      cedulaJuridica: parsed.data.cedulaJuridica ?? null,
      correo: parsed.data.correo ?? null,
      telefono: parsed.data.telefono ?? null,
      direccion: parsed.data.direccion ?? null,
      activo: parsed.data.activo ?? true,
    })
    .returning();
  res.status(201).json({ ...row, localesCount: 0 });
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateSociedadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const [row] = await db
    .update(sociedadesTable)
    .set({
      nombre: parsed.data.nombre,
      cedulaJuridica: parsed.data.cedulaJuridica ?? null,
      correo: parsed.data.correo ?? null,
      telefono: parsed.data.telefono ?? null,
      direccion: parsed.data.direccion ?? null,
      activo: parsed.data.activo ?? true,
    })
    .where(eq(sociedadesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ message: "No encontrado" });
    return;
  }
  res.json({ ...row, localesCount: 0 });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(sociedadesTable).where(eq(sociedadesTable.id, id));
  res.json({ ok: true });
});

export default router;
