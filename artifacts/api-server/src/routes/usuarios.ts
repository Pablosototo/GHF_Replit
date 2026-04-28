import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, localesTable } from "@workspace/db";
import { CreateUsuarioBody, UpdateUsuarioBody } from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();
router.use(requireAdmin);

router.get("/", async (_req, res) => {
  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      localId: usersTable.localId,
      localNombre: localesTable.nombre,
    })
    .from(usersTable)
    .leftJoin(localesTable, eq(localesTable.id, usersTable.localId))
    .orderBy(usersTable.name);
  res.json(rows);
});

router.post("/", async (req, res) => {
  const parsed = CreateUsuarioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const { name, username, email, password, role, localId } = parsed.data;
  if (!password || password.length < 4) {
    res.status(400).json({ message: "La contraseña debe tener al menos 4 caracteres" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const [row] = await db
      .insert(usersTable)
      .values({
        name,
        username,
        email: email ?? null,
        passwordHash,
        role,
        localId: localId ?? null,
      })
      .returning();
    res.status(201).json({
      id: row.id,
      name: row.name,
      username: row.username,
      email: row.email,
      role: row.role,
      localId: row.localId,
      localNombre: null,
    });
  } catch (e) {
    res.status(400).json({ message: "El nombre de usuario ya existe" });
  }
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const parsed = UpdateUsuarioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const { name, username, email, password, role, localId } = parsed.data;
  const update: Record<string, unknown> = {
    name,
    username,
    email: email ?? null,
    role,
    localId: localId ?? null,
  };
  if (password && password.length >= 4) {
    update.passwordHash = await bcrypt.hash(password, 10);
  }
  const [row] = await db
    .update(usersTable)
    .set(update)
    .where(eq(usersTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ message: "No encontrado" });
    return;
  }
  res.json({
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    role: row.role,
    localId: row.localId,
    localNombre: null,
  });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ ok: true });
});

export default router;
