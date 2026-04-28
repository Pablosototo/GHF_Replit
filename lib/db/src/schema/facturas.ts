import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";

export const facturasTable = pgTable("facturas", {
  id: serial("id").primaryKey(),
  pedidoId: integer("pedido_id"),
  localId: integer("local_id"),
  numeroFactura: text("numero_factura").notNull().unique(),
  clienteNombre: text("cliente_nombre"),
  clienteTelefono: text("cliente_telefono"),
  clienteEmail: text("cliente_email"),
  fecha: timestamp("fecha", { withTimezone: true }).notNull().defaultNow(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  impuesto: numeric("impuesto", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  estado: text("estado").notNull().default("emitida"),
  observaciones: text("observaciones"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const facturaDetallesTable = pgTable("factura_detalles", {
  id: serial("id").primaryKey(),
  facturaId: integer("factura_id").notNull(),
  productoId: integer("producto_id"),
  descripcion: text("descripcion").notNull(),
  cantidad: integer("cantidad").notNull(),
  precioUnitario: numeric("precio_unitario", { precision: 12, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
});

export type Factura = typeof facturasTable.$inferSelect;
export type FacturaDetalle = typeof facturaDetallesTable.$inferSelect;
