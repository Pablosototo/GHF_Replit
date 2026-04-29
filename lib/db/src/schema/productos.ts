import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";

export const productosTable = pgTable("productos", {
  id: serial("id").primaryKey(),
  categoriaId: integer("categoria_id"),
  nombre: text("nombre").notNull(),
  sku: text("sku"),
  descripcion: text("descripcion"),
  precio: numeric("precio", { precision: 12, scale: 2 }).notNull().default("0"),
  stockMinimo: integer("stock_minimo").notNull().default(0),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Producto = typeof productosTable.$inferSelect;
export type InsertProducto = typeof productosTable.$inferInsert;
