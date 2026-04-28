import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const localesTable = pgTable("locales", {
  id: serial("id").primaryKey(),
  marcaId: integer("marca_id"),
  sociedadId: integer("sociedad_id"),
  nombre: text("nombre").notNull(),
  codigo: text("codigo"),
  correo: text("correo"),
  telefono: text("telefono"),
  direccion: text("direccion"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Local = typeof localesTable.$inferSelect;
export type InsertLocal = typeof localesTable.$inferInsert;
