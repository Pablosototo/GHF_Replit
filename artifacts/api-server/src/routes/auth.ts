import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, localesTable } from "@workspace/db";
import { LoginBody } from "@workspace/api-zod";
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
