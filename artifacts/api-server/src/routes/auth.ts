import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, localesTable, marcasTable } from "@workspace/db";
import { LoginBody, LoginLocalBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (!user) {
    res.status(401).json({ message: "Credenciales inválidas" });
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ message: "Credenciales inválidas" });
    return;
  }

  let localNombre: string | null = null;
  if (user.localId) {
    const [local] = await db
      .select({ nombre: localesTable.nombre })
      .from(localesTable)
      .where(eq(localesTable.id, user.localId))
      .limit(1);
    localNombre = local?.nombre ?? null;
  }

  const sessionUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    localId: user.localId,
  };
  req.session.user = sessionUser;
  res.json({ ...sessionUser, localNombre });
});

router.post("/login-local", async (req, res) => {
  const parsed = LoginLocalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  const { localId, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.localId, localId))
    .limit(1);

  if (!user) {
    res.status(401).json({ message: "Credenciales inválidas" });
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ message: "Credenciales inválidas" });
    return;
  }

  const [local] = await db
    .select({ nombre: localesTable.nombre })
    .from(localesTable)
    .where(eq(localesTable.id, localId))
    .limit(1);

  const sessionUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    localId: user.localId,
  };
  req.session.user = sessionUser;
  res.json({ ...sessionUser, localNombre: local?.nombre ?? null });
});

router.get("/marcas-login", async (_req, res) => {
  const rows = await db
    .selectDistinct({ id: marcasTable.id, nombre: marcasTable.nombre })
    .from(marcasTable)
    .innerJoin(localesTable, eq(localesTable.marcaId, marcasTable.id))
    .innerJoin(usersTable, eq(usersTable.localId, localesTable.id))
    .where(eq(usersTable.role, "local"))
    .orderBy(marcasTable.nombre);
  res.json(rows);
});

router.get("/locales-login", async (req, res) => {
  const marcaId = Number(req.query.marcaId);
  if (!marcaId) {
    res.json([]);
    return;
  }
  const rows = await db
    .selectDistinct({ id: localesTable.id, nombre: localesTable.nombre })
    .from(localesTable)
    .innerJoin(usersTable, eq(usersTable.localId, localesTable.id))
    .where(eq(localesTable.marcaId, marcaId))
    .orderBy(localesTable.nombre);
  res.json(rows);
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const u = req.session.user!;
  let localNombre: string | null = null;
  if (u.localId) {
    const [local] = await db
      .select({ nombre: localesTable.nombre })
      .from(localesTable)
      .where(eq(localesTable.id, u.localId))
      .limit(1);
    localNombre = local?.nombre ?? null;
  }
  res.json({ ...u, localNombre });
});

export default router;
