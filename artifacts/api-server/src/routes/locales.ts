import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, localesTable, marcasTable, sociedadesTable } from "@workspace/db";
import { CreateLocalBody, UpdateLocalBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();
router.use(requireAuth);

router.get("/", async (_req, res) => {
  const rows = await db
    .select({
      id: localesTable.id,
      marcaId: localesTable.marcaId,
      sociedadId: localesTable.sociedadId,
      marcaNombre: marcasTable.nombre,
      sociedadNombre: sociedadesTable.nombre,
      nombre: localesTable.nombre,
      codigo: localesTable.codigo,
      correo: localesTable.correo,
      telefono: localesTable.telefono,
      direccion: localesTable.direccion,
      activo: localesTable.activo,
    })
    .from(localesTable)
    .leftJoin(marcasTable, eq(marcasTable.id, localesTable.marcaId))
    .leftJoin(sociedadesTable, eq(sociedadesTable.id, localesTable.sociedadId))
    .orderBy(localesTable.nombre);
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db
    .select({
      id: localesTable.id,
      marcaId: localesTable.marcaId,
      sociedadId: localesTable.sociedadId,
      marcaNombre: marcasTable.nombre,
      sociedadNombre: sociedadesTable.nombre,
      nombre: localesTable.nombre,
      codigo: localesTable.codigo,
      correo: localesTable.correo,
      telefono: localesTable.telefono,
      direccion: localesTable.direccion,
      activo: localesTable.activo,
    })
    .from(localesTable)
    .leftJoin(marcasTable, eq(marcasTable.id, localesTable.marcaId))
    .leftJoin(sociedadesTable, eq(sociedadesTable.id, localesTable.sociedadId))
    .where(eq(localesTable.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ message: "No encontrado" });
    return;
  }
  res.json(row);
});

router.post("/", async (req, res) => {
  const parsed = CreateLocalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const [row] = await db
    .insert(localesTable)
    .values({
      marcaId: parsed.data.marcaId ?? null,
      sociedadId: parsed.data.sociedadId ?? null,
      nombre: parsed.data.nombre,
      codigo: parsed.data.codigo ?? null,
      correo: parsed.data.correo ?? null,
      telefono: parsed.data.telefono ?? null,
      direccion: parsed.data.direccion ?? null,
      activo: parsed.data.activo ?? true,
    })
    .returning();
  res.status(201).json(row);
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateLocalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const [row] = await db
    .update(localesTable)
    .set({
      marcaId: parsed.data.marcaId ?? null,
      sociedadId: parsed.data.sociedadId ?? null,
      nombre: parsed.data.nombre,
      codigo: parsed.data.codigo ?? null,
      correo: parsed.data.correo ?? null,
      telefono: parsed.data.telefono ?? null,
      direccion: parsed.data.direccion ?? null,
      activo: parsed.data.activo ?? true,
    })
    .where(eq(localesTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ message: "No encontrado" });
    return;
  }
  res.json(row);
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(localesTable).where(eq(localesTable.id, id));
  res.json({ ok: true });
});

export default router;
