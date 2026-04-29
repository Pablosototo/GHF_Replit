import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const configuracionTable = pgTable("configuracion", {
  clave: text("clave").primaryKey(),
  valor: text("valor"),
  descripcion: text("descripcion"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Configuracion = typeof configuracionTable.$inferSelect;
