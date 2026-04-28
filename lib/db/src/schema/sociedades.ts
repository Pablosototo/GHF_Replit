import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const sociedadesTable = pgTable("sociedades", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  cedulaJuridica: text("cedula_juridica"),
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

export type Sociedad = typeof sociedadesTable.$inferSelect;
export type InsertSociedad = typeof sociedadesTable.$inferInsert;
