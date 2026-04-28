import bcrypt from "bcryptjs";
import {
  db,
  usersTable,
  sociedadesTable,
  marcasTable,
  localesTable,
  categoriasTable,
  productosTable,
  stockTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Wipe (idempotent reseed) — only truncate tables that exist
  const tables = [
    "factura_detalles",
    "facturas",
    "pedido_detalles",
    "pedidos",
    "movimientos",
    "stock",
    "productos",
    "categorias",
    "locales",
    "marcas",
    "sociedades",
    "users",
  ];
  for (const t of tables) {
    try {
      await db.execute(sql.raw(`TRUNCATE TABLE "${t}" RESTART IDENTITY CASCADE`));
    } catch {
      // table may not exist on first seed — ignore
    }
  }

  const passwordHash = await bcrypt.hash("admin123", 10);
  const localPasswordHash = await bcrypt.hash("local123", 10);

  // Sociedades
  const [soc1, soc2] = await db
    .insert(sociedadesTable)
    .values([
      {
        nombre: "GHF Holdings S.A.",
        cedulaJuridica: "3-101-456789",
        correo: "contacto@ghfholdings.com",
        telefono: "2222-3344",
        direccion: "San José, Costa Rica",
        activo: true,
      },
      {
        nombre: "Distribuidora del Norte S.A.",
        cedulaJuridica: "3-101-987654",
        correo: "info@distnorte.com",
        telefono: "2433-5566",
        direccion: "Alajuela, Costa Rica",
        activo: true,
      },
    ])
    .returning();

  // Marcas
  const [marca1, marca2, marca3] = await db
    .insert(marcasTable)
    .values([
      { nombre: "Café Central", slug: "cafe-central", activo: true },
      { nombre: "Pizza Express", slug: "pizza-express", activo: true },
      { nombre: "Helados Polar", slug: "helados-polar", activo: true },
    ])
    .returning();

  // Locales
  const [local1, local2, local3] = await db
    .insert(localesTable)
    .values([
      {
        marcaId: marca1.id,
        sociedadId: soc1.id,
        nombre: "Café Central - Centro",
        codigo: "CC-001",
        correo: "centro@cafecentral.com",
        telefono: "2200-1100",
        direccion: "Av. Central, San José",
        activo: true,
      },
      {
        marcaId: marca2.id,
        sociedadId: soc1.id,
        nombre: "Pizza Express - Escazú",
        codigo: "PE-001",
        correo: "escazu@pizzaexpress.com",
        telefono: "2289-2200",
        direccion: "Plaza Tempo, Escazú",
        activo: true,
      },
      {
        marcaId: marca3.id,
        sociedadId: soc2.id,
        nombre: "Helados Polar - Heredia",
        codigo: "HP-001",
        correo: "heredia@polar.com",
        telefono: "2260-3300",
        direccion: "Centro, Heredia",
        activo: true,
      },
    ])
    .returning();

  // Users
  await db.insert(usersTable).values([
    {
      name: "Administrador",
      username: "admin",
      email: "admin@ghf.com",
      passwordHash,
      role: "admin",
      localId: null,
    },
    {
      name: "Encargado Centro",
      username: "centro",
      email: "centro@ghf.com",
      passwordHash: localPasswordHash,
      role: "local",
      localId: local1.id,
    },
    {
      name: "Encargado Escazú",
      username: "escazu",
      email: "escazu@ghf.com",
      passwordHash: localPasswordHash,
      role: "local",
      localId: local2.id,
    },
  ]);

  // Categorías
  const [catBebidas, catComidas, catPostres] = await db
    .insert(categoriasTable)
    .values([
      { nombre: "Bebidas", descripcion: "Bebidas frías y calientes", activo: true },
      { nombre: "Comidas", descripcion: "Platos principales", activo: true },
      { nombre: "Postres", descripcion: "Postres y dulces", activo: true },
    ])
    .returning();

  // Productos
  const productos = await db
    .insert(productosTable)
    .values([
      {
        categoriaId: catBebidas.id,
        nombre: "Café Americano",
        sku: "BEB-001",
        descripcion: "Café negro 12oz",
        precio: "1500.00",
        costo: "450.00",
        stockMinimo: 20,
        activo: true,
      },
      {
        categoriaId: catBebidas.id,
        nombre: "Capuchino",
        sku: "BEB-002",
        descripcion: "Capuchino con espuma de leche",
        precio: "2200.00",
        costo: "700.00",
        stockMinimo: 15,
        activo: true,
      },
      {
        categoriaId: catBebidas.id,
        nombre: "Jugo Natural",
        sku: "BEB-003",
        descripcion: "Jugo de fruta natural 16oz",
        precio: "1800.00",
        costo: "550.00",
        stockMinimo: 10,
        activo: true,
      },
      {
        categoriaId: catComidas.id,
        nombre: "Pizza Margherita",
        sku: "COM-001",
        descripcion: "Pizza tradicional, mozzarella y albahaca",
        precio: "6500.00",
        costo: "2200.00",
        stockMinimo: 10,
        activo: true,
      },
      {
        categoriaId: catComidas.id,
        nombre: "Pizza Pepperoni",
        sku: "COM-002",
        descripcion: "Pizza con pepperoni y queso",
        precio: "7200.00",
        costo: "2500.00",
        stockMinimo: 10,
        activo: true,
      },
      {
        categoriaId: catComidas.id,
        nombre: "Sandwich Club",
        sku: "COM-003",
        descripcion: "Sandwich triple con pollo",
        precio: "4500.00",
        costo: "1500.00",
        stockMinimo: 8,
        activo: true,
      },
      {
        categoriaId: catPostres.id,
        nombre: "Helado Vainilla",
        sku: "POS-001",
        descripcion: "Helado artesanal de vainilla",
        precio: "2500.00",
        costo: "800.00",
        stockMinimo: 12,
        activo: true,
      },
      {
        categoriaId: catPostres.id,
        nombre: "Helado Chocolate",
        sku: "POS-002",
        descripcion: "Helado artesanal de chocolate belga",
        precio: "2700.00",
        costo: "900.00",
        stockMinimo: 12,
        activo: true,
      },
      {
        categoriaId: catPostres.id,
        nombre: "Cheesecake",
        sku: "POS-003",
        descripcion: "Cheesecake porción individual",
        precio: "3200.00",
        costo: "1100.00",
        stockMinimo: 5,
        activo: true,
      },
    ])
    .returning();

  // Stock por local
  const stockRows: { productoId: number; localId: number; cantidad: number }[] = [];
  for (const local of [local1, local2, local3]) {
    for (const p of productos) {
      stockRows.push({
        productoId: p.id,
        localId: local.id,
        cantidad: Math.floor(Math.random() * 80) + 5,
      });
    }
  }
  await db.insert(stockTable).values(stockRows);

  console.log("Seed completed successfully.");
  console.log("Login: admin / admin123  (rol: admin)");
  console.log("Login: centro / local123 (rol: local)");
  console.log("Login: escazu / local123 (rol: local)");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
