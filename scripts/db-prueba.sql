-- ============================================================
--  GHF Inventarios -- Base de datos de PRUEBA
--  Datos ficticios para desarrollo y testing local
--  Uso: psql $DATABASE_URL -f scripts/db-prueba.sql
-- ============================================================

-- Limpiar tablas en orden seguro (FK)
TRUNCATE TABLE
  movimientos_stock,
  pedido_detalles,
  pedido_eventos,
  pedidos,
  factura_detalles,
  facturas,
  local_productos,
  stock,
  categoria_horarios,
  productos,
  locales,
  sociedades,
  marcas,
  categorias,
  configuracion,
  users,
  user_sessions
RESTART IDENTITY CASCADE;

-- ============================================================
--  MARCAS
-- ============================================================
INSERT INTO marcas (id, nombre, activo) VALUES
  (1, 'TaBueno',    true),
  (2, 'Satay',      true),
  (3, 'Hungry',     true),
  (4, 'Solemio',    true),
  (5, 'Compadres',  true);

SELECT setval('marcas_id_seq', (SELECT MAX(id) FROM marcas));

-- ============================================================
--  SOCIEDADES
-- ============================================================
INSERT INTO sociedades (id, nombre, cedula_juridica, correo, telefono, activo) VALUES
  (1, 'Sociedad Alpha S.A.',    '3101000001', 'alpha@prueba.com',    '22220001', true),
  (2, 'Sociedad Beta S.A.',     '3101000002', 'beta@prueba.com',     '22220002', true),
  (3, 'Sociedad Gamma S.R.L.',  '3102000003', 'gamma@prueba.com',    '22220003', true);

SELECT setval('sociedades_id_seq', (SELECT MAX(id) FROM sociedades));

-- ============================================================
--  CATEGORIAS
-- ============================================================
INSERT INTO categorias (id, nombre, descripcion, impuesto_pct, activo) VALUES
  (1, 'Empaques',        'Empaques y envases',          13.00, true),
  (2, 'Bubble Tea',      'Insumos para bubble tea',     13.00, true),
  (3, 'Florida Bebidas', 'Bebidas Florida',             13.00, true),
  (4, 'Verduras',        'Verduras y hortalizas',        1.00, true);

SELECT setval('categorias_id_seq', (SELECT MAX(id) FROM categorias));

-- ============================================================
--  LOCALES
-- ============================================================
INSERT INTO locales (id, marca_id, sociedad_id, nombre, correo, telefono, direccion, activo) VALUES
  (1, 1, 1, 'TaBueno Centro',     'info@tabueno.com',  '22220100', 'San José Centro',  true),
  (2, 2, 1, 'Satay Mall Norte',   'info@satay.co.cr',  '22220200', 'Alajuela',         true),
  (3, 3, 2, 'Hungry Terramall',   'info@hungry.co.cr', '22220300', 'Tres Ríos',        true),
  (4, 4, 3, 'Solemio Escazú',     'info@solemio.com',  '22220400', 'San José, Escazú', true),
  (5, 5, 3, 'Compadres Lincoln',  'info@comp.com',     '22220500', 'Plaza Lincoln',    true);

SELECT setval('locales_id_seq', (SELECT MAX(id) FROM locales));

-- ============================================================
--  PRODUCTOS
-- ============================================================
INSERT INTO productos (id, categoria_id, nombre, sku, descripcion, precio, precio_entrada, presentacion, stock_minimo, activo) VALUES
  (1,  1, 'Contenedor 8x8 C/D Bagazo x100u',    'PSH083',    'Tira x 100 uni',     7944.69,  6750.00, 'TIRA x 100 UNI',     0, true),
  (2,  1, 'Bowl 8 oz Bagazo x10u',               'ID-TW08',   '10 unidades',         305.31,   305.31, '10',                 0, true),
  (3,  1, 'Bowl 16 oz Bagazo x10u',              'ID-TW16-RP','Paqt x 10 uni',       366.37,   366.37, 'PAQT X 10 UNI',      0, true),
  (4,  1, 'Plato Rdd #10 S/D Bagazo x125u',      'YP10',      'Tira x 125 uni',     5884.96,  5000.00, 'TIRA x 125 UNI',     0, true),
  (5,  1, 'Plato Rdd #9 C/D Bagazo x125u',       'YP09-1',    'Tira x 125 uni',     4707.96,  4000.00, 'TIRA x 125 UNI',     0, true),
  (6,  1, 'Bolsa Satay Grande 250u',              'BB-G03',    '250 unidades',       12729.00, 12729.00,'250',                 0, true),
  (7,  1, 'Bolsa Satay Mediana 500u',             'BB-M02',    '500 unidades',       13659.40, 12348.00,'500',                 0, true),
  (8,  2, 'BT Lata Té Negro 350ml',              'B-L TE NEGRO','350 ml',              584.00,   584.00, '350 ML',             0, true),
  (9,  2, 'BT Lata Thai 350ml',                  'B-L THAI',  '350 ml',               584.00,   584.00, '350 ML',             0, true),
  (10, 2, 'BT Creamer 10kg',                     'B-CREAMER', '10 kg',              55200.00, 55200.00, '10 KG',              0, true),
  (11, 2, 'BT Vaso Bubble x50u',                 'B-V-BUBBLE','Tira x 50 uni',       4446.90,  3750.00, 'TIRA X 50 UNI',      0, true),
  (12, 2, 'BT Tapioca 3kg',                      'B-TAPIOCA', '3 kg',              13274.30, 11300.00, '3 kg',               0, true),
  (13, 3, 'Agua Cristal 600ml x12u',             'AC600',     'x 12 unidades',       6610.00,  6610.00, 'X 12u',              0, true),
  (14, 3, 'Pepsi 355ml x12u',                    'PEP335',    'x 12 unidades',       4385.00,  4385.00, 'X 12u',              0, true),
  (15, 4, 'Aguacate kg',                         'AGUACATE-01','kg',                 3712.00,  2900.00, 'KG',                 0, true),
  (16, 4, 'Tomate kg',                           'TOMATE-48', 'kg',                  2750.00,   842.00, 'KG',                 0, true),
  (17, 4, 'Zanahoria kg',                        'ZANAHORIA-52','kg',                  675.00,  1010.00, 'KG',                 0, true),
  (18, 4, 'Cebolla Blanca kg',                   'CEBOLLA-10','kg',                  1275.00,  1515.00, 'KG',                 0, true),
  (19, 4, 'Chile Dulce unidad',                  'CHILE-14-01','unidad',               631.00,   476.00, 'UNIDAD',             0, true),
  (20, 4, 'Brócoli kg',                          'BROCOLI-08','kg',                  2074.00,  3418.00, 'KG',                 0, true);

SELECT setval('productos_id_seq', (SELECT MAX(id) FROM productos));

-- ============================================================
--  STOCK (cantidades de prueba)
-- ============================================================
INSERT INTO stock (producto_id, local_id, cantidad) VALUES
  (1,  1, 50),  (1,  2, 30),
  (2,  1, 100), (2,  2, 80),
  (3,  1, 75),  (3,  3, 40),
  (4,  1, 60),  (4,  2, 25),
  (5,  1, 45),
  (8,  1, 200), (8,  2, 150),
  (13, 1, 120), (13, 2, 90), (13, 3, 60),
  (15, 1, 30),  (15, 3, 20),
  (16, 1, 40),  (16, 3, 35),
  (17, 1, 80),  (17, 2, 60),
  (18, 1, 55),  (18, 3, 45),
  (19, 1, 100), (19, 2, 80),
  (20, 1, 25);

-- ============================================================
--  HORARIOS DE CATEGORIAS (prueba: lunes a viernes)
-- ============================================================
INSERT INTO categoria_horarios (categoria_id, dia_inicio, hora_inicio, dia_fin, hora_fin, activo) VALUES
  (2, 1, '08:00', 5, '18:00', true),   -- Bubble Tea: Lun-Vie
  (3, 1, '09:00', 5, '17:00', true);   -- Bebidas: Lun-Vie

-- ============================================================
--  FIN
-- ============================================================
