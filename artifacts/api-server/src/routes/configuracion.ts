import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, configuracionTable } from "@workspace/db";
import { UpdateConfiguracionBody } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/auth";

const router: IRouter = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get("/", async (_req, res) => {
  const rows = await db.select().from(configuracionTable).orderBy(configuracionTable.clave);
  res.json(rows);
});

router.put("/", async (req, res) => {
  const parsed = UpdateConfiguracionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Datos inválidos" });
    return;
  }
  for (const item of parsed.data.items) {
    await db
      .insert(configuracionTable)
      .values({ clave: item.clave, valor: item.valor })
      .onConflictDoUpdate({ target: configuracionTable.clave, set: { valor: item.valor } });
  }
  const rows = await db.select().from(configuracionTable).orderBy(configuracionTable.clave);
  res.json(rows);
});

export default router;
