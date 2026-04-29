import { pgTable, serial, text, boolean, timestamp, numeric } from "drizzle-orm/pg-core";

export const categoriasTable = pgTable("categorias", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  impuestoPct: numeric("impuesto_pct", { precision: 5, scale: 2 }).notNull().default("13"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Categoria = typeof categoriasTable.$inferSelect;
export type InsertCategoria = typeof categoriasTable.$inferInsert;
