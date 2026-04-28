import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const categoriasTable = pgTable("categorias", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Categoria = typeof categoriasTable.$inferSelect;
export type InsertCategoria = typeof categoriasTable.$inferInsert;
