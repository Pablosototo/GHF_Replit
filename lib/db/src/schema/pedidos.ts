import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";

export const pedidosTable = pgTable("pedidos", {
  id: serial("id").primaryKey(),
  localId: integer("local_id"),
  clienteNombre: text("cliente_nombre"),
  clienteTelefono: text("cliente_telefono"),
  clienteEmail: text("cliente_email"),
  observaciones: text("observaciones"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  impuesto: numeric("impuesto", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  estado: text("estado").notNull().default("pendiente"), // pendiente|facturado|anulado
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const pedidoDetallesTable = pgTable("pedido_detalles", {
  id: serial("id").primaryKey(),
  pedidoId: integer("pedido_id").notNull(),
  productoId: integer("producto_id"),
  descripcion: text("descripcion").notNull(),
  cantidad: integer("cantidad").notNull(),
  precioUnitario: numeric("precio_unitario", { precision: 12, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
});

export const pedidoEventosTable = pgTable("pedido_eventos", {
  id: serial("id").primaryKey(),
  pedidoId: integer("pedido_id").notNull(),
  estado: text("estado").notNull(),
  nota: text("nota"),
  usuarioId: integer("usuario_id"),
  fecha: timestamp("fecha", { withTimezone: true }).notNull().defaultNow(),
});

export type Pedido = typeof pedidosTable.$inferSelect;
export type PedidoDetalle = typeof pedidoDetallesTable.$inferSelect;
export type PedidoEvento = typeof pedidoEventosTable.$inferSelect;
