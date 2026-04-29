import { pgTable, serial, integer, text, boolean } from "drizzle-orm/pg-core";

export const categoriaHorariosTable = pgTable("categoria_horarios", {
  id: serial("id").primaryKey(),
  categoriaId: integer("categoria_id").notNull(),
  diaSemana: integer("dia_semana").notNull(), // 0=Dom, 1=Lun, ..., 6=Sab
  horaInicio: text("hora_inicio").notNull(), // "HH:MM" 24h
  horaFin: text("hora_fin").notNull(),       // "HH:MM" 24h
  activo: boolean("activo").notNull().default(true),
});

export type CategoriaHorario = typeof categoriaHorariosTable.$inferSelect;
export type InsertCategoriaHorario = typeof categoriaHorariosTable.$inferInsert;
