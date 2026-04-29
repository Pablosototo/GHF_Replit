import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, localProductosTable, productosTable, categoriasTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();
router.use(requireAuth);

// GET /api/locales/:id/productos — list all products with enabled/disabled state for this local
router.get("/:id/productos", async (req, res) => {
  const localId = Number(req.params.id);

  const allProducts = await db
    .select({
      id: productosTable.id,
      nombre: productosTable.nombre,
      sku: productosTable.sku,
      categoriaNombre: categoriasTable.nombre,
      activo: productosTable.activo,
    })
    .from(productosTable)
    .leftJoin(categoriasTable, eq(categoriasTable.id, productosTable.categoriaId))
    .where(eq(productosTable.activo, true))
    .orderBy(categoriasTable.nombre, productosTable.nombre);

  const localProds = await db
    .select()
    .from(localProductosTable)
    .where(eq(localProductosTable.localId, localId));

  const disabledSet = new Set(
    localProds.filter((p) => !p.habilitado).map((p) => p.productoId)
  );

  res.json(
    allProducts.map((p) => ({
      ...p,
      habilitado: !disabledSet.has(p.id),
    }))
  );
});

// PUT /api/locales/:id/productos — set enabled state for list of products
router.put("/:id/productos", async (req, res) => {
  const localId = Number(req.params.id);
  const { habilitados } = req.body as { habilitados: number[] };

  if (!Array.isArray(habilitados)) {
    res.status(400).json({ message: "habilitados debe ser array de IDs" });
    return;
  }

  const allProducts = await db
    .select({ id: productosTable.id })
    .from(productosTable)
    .where(eq(productosTable.activo, true));

  // Delete existing overrides for this local
  await db.delete(localProductosTable).where(eq(localProductosTable.localId, localId));

  // Insert disabled ones (those NOT in habilitados list)
  const habSet = new Set(habilitados);
  const disabled = allProducts.filter((p) => !habSet.has(p.id));
  for (const p of disabled) {
    await db.insert(localProductosTable).values({
      localId,
      productoId: p.id,
      habilitado: false,
    });
  }

  res.json({ ok: true });
});

export default router;
