import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const stockTable = pgTable(
  "stock",
  {
    id: serial("id").primaryKey(),
    productoId: integer("producto_id").notNull(),
    localId: integer("local_id").notNull(),
    cantidad: integer("cantidad").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    productoLocalUq: uniqueIndex("stock_producto_local_uq").on(
      t.productoId,
      t.localId,
    ),
  }),
);

export const movimientosTable = pgTable("movimientos_stock", {
  id: serial("id").primaryKey(),
  productoId: integer("producto_id").notNull(),
  localId: integer("local_id").notNull(),
  tipo: text("tipo").notNull(), // entrada | salida | ajuste | venta
  cantidad: integer("cantidad").notNull(), // signed for ajuste, positive for entrada/salida
  nota: text("nota"),
  usuarioId: integer("usuario_id"),
  pedidoId: integer("pedido_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type StockRow = typeof stockTable.$inferSelect;
export type Movimiento = typeof movimientosTable.$inferSelect;
export type InsertMovimiento = typeof movimientosTable.$inferInsert;
