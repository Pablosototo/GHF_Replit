import { pgTable, serial, integer, boolean } from "drizzle-orm/pg-core";

export const localProductosTable = pgTable("local_productos", {
  id: serial("id").primaryKey(),
  localId: integer("local_id").notNull(),
  productoId: integer("producto_id").notNull(),
  habilitado: boolean("habilitado").notNull().default(true),
});

export type LocalProducto = typeof localProductosTable.$inferSelect;
