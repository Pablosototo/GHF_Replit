import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const marcasTable = pgTable("marcas", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  slug: text("slug"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Marca = typeof marcasTable.$inferSelect;
export type InsertMarca = typeof marcasTable.$inferInsert;
