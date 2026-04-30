-- ============================================================
--  GHF Inventarios -- Base de datos de PRODUCCION
--  Datos reales exportados el 30/04/2026
--  Uso: psql $DATABASE_URL -f scripts/db-produccion.sql
--  ADVERTENCIA: borra y reemplaza todos los datos existentes
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
  (1,  'GRUPO HUNG FUNG S.A',                          '3101653778', 'ldsalas@tabuenocr.com',                          '25734739', true),
  (2,  'CCSK CORPORACION SOCIEDAD ANONIMA',             '3101844593', 'ccskcorp.proveedores@tabuenocr.com',             '40013189', true),
  (3,  'MUNDO BUFFET AND GRILL S.A',                   '3101550987', 'mundo-buffet-grill.proveedores@tabuenocr.com',   '25199457', true),
  (4,  'KMG TOTAL MANAGEMENT S.A',                     '3101566664', 'kmg-total-man.proveedores@tabuenocr.com',        '25734739', true),
  (5,  'JAS GLOBAL S.A',                               '3101680598', 'jas-global.proveedores@tabuenocr.com',           '22378383', true),
  (6,  'HFKM TOTAL S.R.L.',                            '3102699228', 'hfkm-total.proveedores@tabuenocr.com',           '42005302', true),
  (7,  'GRUPO UNIDO SOLE MIO S.A',                     '3101539062', 'solemio.proveedores@tabuenocr.com',              '22881400', true),
  (8,  'COMIDA RAPIDA KAI MEI S.A',                    '3101653767', 'kai-mei.proveedores@tabuenocr.com',              '22373898', true),
  (9,  'COMIDA RAPIDA ASIA PANDA S.A',                 '3101653824', 'asia-panda.proveedores@tabuenocr.com',           '22372871', true),
  (10, 'ALNG GLOBALLHEY S.R.L',                        '3102713697', 'alng-global-hey.proveedores@tabuenocr.com',      '22019337', true),
  (11, 'CR MOLECULAR GASTRONOMIE SOCIEDAD ANONIMA',    '3101580029', 'SANSEBASTIAN@COMPADRESCR.COM',                   '22222222', true);

SELECT setval('sociedades_id_seq', (SELECT MAX(id) FROM sociedades));

-- ============================================================
--  CATEGORIAS
-- ============================================================
INSERT INTO categorias (id, nombre, impuesto_pct, activo) VALUES
  (4, 'Empaques',        13.00, true),
  (5, 'Bubble tea',      13.00, true),
  (6, 'Verduras',         1.00, true),
  (7, 'Florida bebidas', 13.00, true);

SELECT setval('categorias_id_seq', (SELECT MAX(id) FROM categorias));

-- ============================================================
--  LOCALES
-- ============================================================
INSERT INTO locales (id, marca_id, sociedad_id, nombre, correo, telefono, direccion, activo) VALUES
  (1,  2, 9, 'Satay Mall San Pedro',              'info@satay.co.cr',   '40003588', 'San José',                 true),
  (2,  1, 9, 'Tabueno City Mall',                 'info@tabuenocr.com', NULL,       'Alajuela',                 true),
  (3,  1, 9, 'Tabueno Paseo de las Flores',       'info@tabuenocr.com', '40003588', 'Heredia',                  true),
  (4,  1, 9, 'Tabueno Paseo Metrópoli',           'info@tabuenocr.com', '40003588', 'Cartago',                  true),
  (5,  2, 8, 'Satay Cariari',                     'info@satay.co.cr',   '40003588', 'Heredia',                  true),
  (6,  2, 8, 'Satay Lincoln',                     'info@satay.co.cr',   '40003588', 'Plaza Lincoln',            true),
  (7,  2, 8, 'Satay Multiplaza Curridabat',        'info@satay.co.cr',   '40003588', 'San José',                 true),
  (8,  2, 8, 'Satay Paseo de las Flores',         'info@satay.co.cr',   '40003588', 'Heredia',                  true),
  (9,  2, 8, 'Satay Terramall',                   'info@satay.co.cr',   '40003588', 'Tres Ríos',                true),
  (10, 2, 8, 'Satay Universal',                   'info@satay.co.cr',   '40003588', 'San José',                 true),
  (11, 2, 8, 'Satay Walmart',                     'info@satay.co.cr',   '40003588', 'San José',                 true),
  (12, 2, 6, 'Satay City Mall',                   'info@satay.co.cr',   '40010678', 'Alajuela',                 true),
  (13, 2, 6, 'Satay Multicentro Desamparados',    'info@satay.co.cr',   '40003588', 'San José, Desamparados',   true),
  (14, 2, 6, 'Satay Multiplaza Escazú',           'info@satay.co.cr',   '40003588', 'San José, Escazú',         true),
  (15, 2, 6, 'Satay Paseo Metrópoli',             'info@satay.co.cr',   '40003588', 'Cartago',                  true),
  (16, 2, 6, 'Satay Pavas',                       'info@satay.co.cr',   NULL,       'San José, Pavas',          true),
  (17, 3, 5, 'Hungry City Mall',                  'info@hungry.co.cr',  '40003588', 'Alajuela',                 true),
  (18, 3, 5, 'Hungry Moravia',                    'info@hungry.co.cr',  '40003588', 'San José',                 true),
  (19, 3, 5, 'Hungry Terramall',                  'info@hungry.co.cr',  '40003588', 'Tres Ríos',                true),
  (20, 1, 4, 'Tabueno Terramall',                 'info@tabuenocr.com', '40003588', 'Tres Ríos',                true),
  (21, 2, 3, 'Satay Plaza América',               'info@satay.co.cr',   '40003588', 'San José, Hatillo',        true),
  (22, 1, 3, 'TaBueno Lincoln',                   'info@tabuenocr.com', '40003588', 'San José, Plaza Lincoln',  true),
  (23, 1, 3, 'TaBueno Multiplaza Curridabat',     'info@tabuenocr.com', '40003588', 'San José, Curridabat',     true),
  (24, 1, 3, 'TaBueno Multiplaza Escazú',         'info@tabuenocr.com', '40003588', 'San José, Escazú',         true),
  (25, 1, 3, 'TaBueno Parque de Diversiones',     'info@tabuenocr.com', NULL,       'San José, Uruca',          true),
  (26, 1, 3, 'TaBueno Universal',                 'info@tabuenocr.com', '40003588', 'San José',                 true);

SELECT setval('locales_id_seq', (SELECT MAX(id) FROM locales));

-- ============================================================
--  PRODUCTOS
-- ============================================================
INSERT INTO productos (id, categoria_id, nombre, sku, descripcion, precio, precio_entrada, presentacion, stock_minimo, activo) VALUES
  (10,  4, 'Contenedor 8x8 _C/D -BagazoCaña x 100u',               'PSH083',             'TIRA x 100 UNI',              7944.69, 6750.00, 'TIRA x 100 UNI',          0, true),
  (11,  4, 'Bowl 8 oz (Pequeño) -Bagazo Caña x 10 UNI',            'ID-TW08',            '10',                           305.31,  305.31, '10',                      0, true),
  (12,  4, 'Bowl 16 oz (Grande) -Bagazo Caña x 10 UNI',            'ID-TW16-RP',         'PAQT X 10 UNI',                366.37,  366.37, 'PAQT X 10 UNI',           0, true),
  (13,  4, 'Plato Rdd #10 _S/D -BagazoCaña x 125u',                'YP10',               'tira x 125 UNI',              5884.96, 5000.00, 'tira x 125 UNI',          0, true),
  (14,  4, 'Plato Rdd #09 _S/D -BagazoCaña x 125u',                'YP09',               'tira x 125 UNI',              4414.30, 3750.00, 'tira x 125 UNI',          0, true),
  (15,  4, 'Plato Rdd #09 _C/D -BagazoCaña x 125u',                'YP09-1',             'tira x 125 UNI',              4707.96, 4000.00, 'tira x 125 UNI',          0, true),
  (16,  4, 'Plato Rdd # 6 -BagazoCaña x 125u',                     'YP06',               'tira x 125 UNI',              2199.50, 1868.75, 'tira x 125 UNI',          0, true),
  (17,  4, 'Contenedor 9x6 (HotDog) -BagazoCaña x 125u',           'PSH89',              'tira x 125 UNI',              8238.90, 7000.00, 'tira x 125 UNI',          0, true),
  (18,  4, 'Cont _ TazaEntero C/T -BagazoCaña x 50u',              'YW140',              'TIRA X 50 UNI',               4682.10, 3977.92, 'TIRA X 50 UNI',           0, true),
  (19,  4, 'Contd 6x4 (Porción) -BagazoCaña x 50u',                'GW006',              'tira x 50 u',                 1927.30, 1637.50, 'tira x 50 u',             0, true),
  (20,  4, 'Contenedor AlmidonMaiz _8x8 _C/D x 150u',              'PP803',              'caja x 150 u',               12946.90,11000.00, 'caja x 150 u',            0, true),
  (21,  4, 'Contenedor AlmidonMaiz _7x7 _S/D x 150u',              'PP781',              'caja x 150 u',               12946.90,11000.00, 'caja x 150 u',            0, true),
  (22,  4, 'Bolsa SATAY -Grande- 250u -LIQUIDACIÓN-',               'BB-G03',             '250',                        12729.00,12729.00, '250',                     0, true),
  (23,  4, 'Bolsa SATAY -Mediana 14 LB- 500 u',                     'BB-M02',             '500',                        13659.40,12348.00, '500',                     0, true),
  (24,  4, 'BolsaBlanca SATAY- p/Taco Antigrasa -500 u',            'BB-TAg01',           '500',                        11095.10,10029.90, '500',                     0, true),
  (25,  4, 'Papel HUNGRY- Antigrasa x 1000 u',                      'PAG-H01',            '1000',                       21625.40,19441.70, '1000',                    0, true),
  (26,  4, 'PAPEL Produccion HG- Antigrasa 6x10 3/4_x1000',         'P-AG-H02',           '1000',                        6875.00, 6215.00, '1000',                    0, true),
  (28,  4, 'Plato Ovalado #7 _S/D -Bagazo Caña x 100u',            'TY02-RP',            'TIRA X 100 UNI',              6945.20, 6945.20, 'TIRA X 100 UNI',          0, true),
  (29,  4, 'Plato Redondo #9 _C/D -BagazoCaña x 100u',             'ID-YP09-1-RP',       'TIRA X 100 UNI',              4296.00, 4296.00, 'TIRA X 100 UNI',          0, true),
  (30,  4, 'Plato Bowl 12 oz(MED) -BagazoCaña x1000u',             'TW12',               'caja x 1000 U',              36686.80,31170.00, 'caja x 1000 U',           0, true),
  (31,  4, 'Plato Bowl 16 oz(Grande) -BagazoCaña x 125u',          'TW16-B',             'TIRA X 125 UNI',              3825.00, 3250.00, 'TIRA X 125 UNI',          0, true),
  (32,  4, 'Contenedor AlmidonMaiz _9x6 -(HotDog) x 150u',         'PP205',              'caja x 150 u',               12946.90,11000.00, 'caja x 150 u',            0, true),
  (33,  4, 'Bowl 12 oz (Mediano) -Bagazo Caña x 500 u',            'TW12-RP',            'CAJA X 500 U',               16792.00,16792.00, 'CAJA X 500 U',            0, true),
  (34,  4, 'Plato Redd #9 _S/D -BagazoCaña  x 100u',               'YP09 -RP',           'TIRA X 100 UNI',              5292.04, 5292.04, 'TIRA X 100 UNI',          0, true),
  (35,  5, 'BT _LATA THAI 350ML',                                   'B -L THAI',          '350 ML',                       584.00,  584.00, '350 ML',                  0, true),
  (36,  5, 'BT _CREAMER 10KG',                                      'B -CREAMER',         '10 KG',                      55200.00,55200.00, '10 KG',                   0, true),
  (37,  5, 'BT _VASO BUBBLE x 50u',                                 'B -V-BUBBLE',        'TIRA X 50 UNI',               4446.90, 3750.00, 'TIRA X 50 UNI',           0, true),
  (39,  5, 'BT _HOJAS TÉ NEGRO 600g',                              'B -HOJAS TÉ',        '600g',                       13274.30,11300.00, '600g',                    0, true),
  (40,  5, 'BT _TARO en POLVO 1Kg',                                 'B -TARO',            'KG',                         13274.30,11300.00, 'KG',                      0, true),
  (41,  5, 'BT _CONCENTRADO FRESA 2.5 Kg',                         'B- LIQ-FRESA',       '2.5 Kg',                     14950.00,14950.00, '2.5 Kg',                  0, true),
  (42,  5, 'BT _TAPIOCA 3 Kg',                                      'B -TAPIOCA',         '3 kg',                       13274.30,11300.00, '3 kg',                    0, true),
  (43,  5, 'BT _PAJILLA GRUESA 100 UNI',                            'B -PAJILLA gru',     '100 UNI',                     4336.25, 3955.00, '100 UNI',                 0, true),
  (44,  5, 'BT _FRUCTOSA 5 Kg',                                     'B -FRUCTOSA',        '5 KG',                       13274.30,11300.00, '5 KG',                    0, true),
  (45,  5, 'BT _ROLLO ETIQUETAS -BUBBLE TEA x 400u',                'B -ETIQTS ROLLO',    '400 UNI',                    11500.00,11500.00, '400 UNI',                 0, true),
  (46,  4, 'Caja Arroz ENTERO 32 oz _ROJA_',                        'ZR-CAE-32',          'CAJA X 100 U',               18100.00,18100.00, 'CAJA X 100 U',            0, true),
  (47,  4, 'VINO SALSA ANGUILA SATAY 1 galon',                      'VST-1g',             'GALON',                       7224.00, 7224.00, 'GALON',                   0, true),
  (48,  5, 'BT -ROLLO SELLO P/ 3500 VASOS BT',                     'Rollo-Sello V BT',   'rollo x 3500u',              29303.50,24860.00, 'rollo x 3500u',           0, true),
  (49,  5, 'BT _Concentrado MARACUYA 2.5 Kg',                      'B- LIQ-MARACUYA',    'CONCENTRADO LIQUID 2.5 KG',  14950.00,14950.00, 'CONCENTRADO LIQUID 2.5 KG',0,true),
  (50,  5, 'BT _Lata Te Negro Sabor ORIGINAL 350ML',                'B -L TE NEGRO',      NULL,                           584.00,  584.00, NULL,                      0, true),
  (51,  5, 'BT _LATA TARO 350ML',                                   'B -L TARO',          'LATA 350ML',                   584.00,  584.00, 'LATA 350ML',              0, true),
  (52,  5, 'BT _LATA MATCHA 350 ML',                                'B -L MATCHA',        'CAJA 24u X 350ML',             584.00,  584.00, 'CAJA 24u X 350ML',        0, true),
  (53,  NULL,'BASA 7 A 9 ONZ - CAJA 10 KG',                        'BASA 10K',           '10 KG',                      16535.00,17650.00, '10 KG',                   0, true),
  (54,  4, 'Souffle VASO Transp  1 oz x 100u',                      'Souffle-VT-1 oz',    '100 u x tira',                 399.00,  339.00, '100 u x tira',            0, true),
  (55,  4, 'Souf  2 oz_ VASO  x 125u _hypl',                       'H-Souffle-VT-2oz',   'tira x 125 UNI',               399.00,  339.00, 'tira x 125 UNI',          0, true),
  (56,  4, 'Souffle TAPA Transp 1 oz x 100u',                       'Souf-TT-1 oz',       '100u x tira',                  332.50,  283.00, '100u x tira',             0, true),
  (57,  4, 'Souf  2 oz_Tapa  x 125u _hypl',                        'H-Souf-TT-2oz',      'tira x 125 UNI',               505.40,  429.00, 'tira x 125 UNI',          0, true),
  (58,  5, 'BT _TAPIOCA DORADA',                                    'B -TAP DORADA',      '3KG',                        12650.00,12650.00, '3KG',                     0, true),
  (59,  5, 'BT _Concentrado MELOCOTON 2.5 Kg',                     'B- LIQ-MELOCOTN',    'CONCENTRADO LIQUID 2.5 KG',   7475.00, 7475.00, 'CONCENTRADO LIQUID 2.5 KG',0,true),
  (60,  5, 'BT _PULPA FRESA GALON 5kg',                            'B -PULPA FRESA',     'Galon 3.78 L / 5kg',         14950.00,14950.00, 'Galon 3.78 L / 5kg',      0, true),
  (61,  5, 'BT _PULPA Maracuya GALON 5kg',                         'B -PULPA Maracuya',  'Galon 3.78 L / 5kg',         18975.00,18975.00, 'Galon 3.78 L / 5kg',      0, true),
  (62,  5, 'BT _POLVO -Taro BTC _ 1Kg',                            'B -TARO BTC',        '1 kg',                       18906.00,18906.00, '1 kg',                    0, true),
  (63,  5, 'BT _PAJILLA GRUESA 50 u',                               'B -PAJ Gr',          'Paqt 50 u',                   2455.75, 2090.50, 'Paqt 50 u',               0, true),
  (64,  4, 'Souffle VASO Transp  2 oz x 100u',                      'Souffle-VT-2oz',     '100u x tira',                  731.50,  622.00, '100u x tira',             0, true),
  (65,  4, 'Souffle TAPA Transp 2 oz x 100u',                       'Souf-TT-2oz',        '100u x tira',                  505.40,  429.00, '100u x tira',             0, true),
  (66,  4, 'Plato Bowl 8 onz (PEQ) - bagazoCaña X 125 u',          'TW08-B',             'tira x 125 UNI',              2928.30, 2487.50, 'tira x 125 UNI',          0, true),
  (67,  4, 'Plato Bowl 16 oz(GRANDE) -bagazoCaña x 50u',           'TW16 -A',            'tira x 50 u',                 2559.95, 2559.95, 'tira x 50 u',             0, true),
  (68,  4, 'Bio Almidon _CUCHARA _10 x 50u (500 UNI)',             'Bio- Cuchara',       '10 Paqt de 50 u',             7415.00, 6114.00, '10 Paqt de 50 u',         0, true),
  (69,  4, 'Bio Almidon _TENEDOR _10 x 50u (500 UNI)',             'Bio- Tenedor',       '10 Paqt de 50 uni',           7415.00, 6114.00, '10 Paqt de 50 uni',       0, true),
  (70,  4, 'Bio Almidon _Cuchara - BULTO x 1000 u',                'Bio- CHA 1',         'bulto x 1000 u',             15265.50,15265.50, 'bulto x 1000 u',          0, true),
  (71,  4, 'Bio Almidon_Tenedor - BULTO x 1000 u',                 'Bio- TD 1',          'bulto x 1000 u',             14391.10,12227.00, 'bulto x 1000 u',          0, true),
  (72,  4, 'Bio Almidon_Cuchillo - BULTO x 1000 u',                'Bio- CHI 1',         'bulto x 1000 u',             14391.10,12227.00, 'bulto x 1000 u',          0, true),
  (73,  5, 'BT _Lata HD MELON VERDE 350ML',                        'B- LT_HD MELONV',    'LATA',                        1032.45,  941.65, 'LATA',                    0, true),
  (74,  5, 'BT _Lata BS AZUCAR MORENO 350ML',                      'B- LT_BS AZ M',      'LATA',                        1032.45,  941.65, 'LATA',                    0, true),
  (75,  4, 'Souf  1 oz_ VASO  x 125u _hypl',                       'H-Souffle-VT-1 oz',  'tira x 125 UNI',               399.00,  339.00, 'tira x 125 UNI',          0, true),
  (76,  4, 'Souf  1 oz_Tapa  x 100u _hypl',                        'H-Souf-TT-1 oz',     'tira x 125 UNI',               333.00,  283.00, 'tira x 125 UNI',          0, true),
  (77,  5, 'BT _CREMA LACTEA _5 KG',                               'BT _CREMA LACTEA _5 KG','5 KG',                    29203.50,24860.00, '5 KG',                    0, true),
  (78,  5, 'BT _CREMA LACTEA_3 KG',                                'B -CREMA  _3 Kg',    'BT _CREMA LACTEA _3 KG',     16566.00,16566.00, 'BT _CREMA LACTEA _3 KG',  0, true),
  (79,  4, 'Caja ARROZ Negra_Medio 26oz -BULTO x 100u',            'CANM- 26',           'paquete de 100',             15815.00,15815.00, 'paquete de 100',           0, true),
  (80,  4, 'Caja ARROZ Roja _Entero 32oz -BULTO x 100u',           'CARE- 32',           '100',                        18100.00,18100.00, '100',                     0, true),
  (81,  4, 'Caja SUSHI Negra Pequeña p/10 - paqt x 100 u',        'CSN P- 10',          'paquete de 100',             20100.00,20100.00, 'paquete de 100',           0, true),
  (82,  4, 'Caja SUSHI Negra Grande p/30 - paqt x 100 u',         'CSN G- 30',          'paquete de 100',             20300.00,20300.00, 'paquete de 100',           0, true),
  (83,  4, 'TB _Salsa Caribeña 1 TANDA',                           'TB _S Caribe 1 T',   '1',                          39823.00,39823.00, '1',                       0, true),
  (84,  4, 'TB _Salsa Caribeña 0.5 Tanda',                         'TB _S Caribe 0.5 T', '1',                          21871.60,19011.00, '1',                       0, true),
  (85,  6, 'AGUACATE -KG',                                         'AGUACATE-01',        'KG',                          3712.00, 2900.00, 'KG',                      0, true),
  (86,  6, 'AJO PELADO-KG',                                        'AJO-02',             'KG',                          3520.00, 3030.00, 'KG',                      0, true),
  (87,  6, 'ALBAHACA KG',                                          'ALBAHACA-03',        'KG',                          7500.00, 3500.00, 'KG',                      0, true),
  (88,  6, 'ALBAHACA-UNIDAD',                                      'ALBAHACA-03-01',     'UNIDAD',                       750.00, 3500.00, 'UNIDAD',                  0, true),
  (89,  6, 'APIO MATA',                                            'APIO-04-01',         'UNIDAD',                      1800.00,  892.00, 'UNIDAD',                  0, true),
  (90,  6, 'AYOTE SAZON-KG',                                       'AYOTE SAZON-05-01',  'UNIDAD',                       375.00, 2500.00, 'UNIDAD',                  0, true),
  (91,  6, 'AYOTE TIERNO-UNIDAD',                                  'AYOTE TIERNO-06-01', 'UNIDAD',                       884.00,  758.00, 'UNIDAD',                  0, true),
  (92,  6, 'Banano VERDE-UNIDAD',                                  'Banano VERDE-07-01', 'UNIDAD',                        44.21,   26.00, 'UNIDAD',                  0, true),
  (93,  6, 'BERENJENA UNIDAD',                                     'BERENJENA-57',       'UNIDAD',                       525.00,  700.00, 'UNIDAD',                  0, true),
  (94,  6, 'BROCOLI-KG',                                           'BROCOLI-08',         'KG',                          2074.00, 3418.00, 'KG',                      0, true),
  (95,  6, 'CAMOTE-KG',                                            'CAMOTE-09',          'KG',                          1050.00,  909.00, 'KG',                      0, true),
  (96,  6, 'CEBOLLA Blanca-KG',                                    'CEBOLLA Blanca-10',  'KG',                          1275.00, 1515.00, 'KG',                      0, true),
  (97,  6, 'CEBOLLA MORADA-KG',                                    'CEBOLLA MORADA-11',  'KG',                          2700.00, 2525.00, 'KG',                      0, true),
  (98,  6, 'CEBOLLIN-KG',                                          'CEBOLLIN-12',        'KG',                          2925.00, 1600.00, 'KG',                      0, true),
  (99,  6, 'CHAYOTE-UNIDAD',                                       'CHAYOTE-13-01',      'UNIDAD',                       107.00,  157.00, 'UNIDAD',                  0, true),
  (100, 6, 'CHILE DULCE-UNIDAD',                                   'CHILE DULCE-14-01',  'UNIDAD',                       631.00,  476.00, 'UNIDAD',                  0, true),
  (101, 6, 'CHILE Panameño-1KG',                                   'CHILE Panameño-15',  'KG',                          3000.00, 2525.00, 'KG',                      0, true),
  (102, 6, 'COLIFLOR-1UNIDAD',                                     'COLIFLOR-16-01',     'UNIDAD',                      1200.00, 1500.00, 'UNIDAD',                  0, true),
  (103, 6, 'CULANTRO CASTILLA ROLLO (10 rollitos)',                 'CULANTRO Castilla-17','KG',                         1376.00, 1515.00, 'KG',                      0, true),
  (104, 6, 'CULANTRO COYOTE-10 UNIDADES',                          'Culantro COYOTE-18-01','ROLLO 10 UNI',                750.00,  606.00, 'ROLLO 10 UNI',            0, true),
  (105, 6, 'ELOTE-UNIDAD',                                         'ELOTE-19-01',        'UNIDAD',                       195.00,  120.00, 'UNIDAD',                  0, true),
  (106, 6, 'FRESA KG',                                             'FRESA 55',           'KG',                          3750.00, 2500.00, 'KG',                      0, true),
  (107, 6, 'FRIJOL TIERNO-KG',                                     'FRIJOL TIERNO-23',   'KG',                          2550.00, 1707.00, 'KG',                      0, true),
  (108, 6, 'COCOS-UNIDAD',                                         'COCOS-24',           'UNIDAD',                       975.00,  500.00, 'UNIDAD',                  0, true),
  (109, 6, 'JENGIBRE-KG',                                          'JENGIBRE-25',        'KG',                          1500.00, 1605.00, 'KG',                      0, true),
  (110, 6, 'HIERBA BUENA-KG',                                      'HIERBA BUENA-26',    'KG',                          6000.00, 3535.00, 'KG',                      0, true),
  (111, 6, 'HIERBA BUENA ROLLO UNI',                               'HIERBA BUENA-26-01', 'UNIDAD',                       600.00, 3535.00, 'UNIDAD',                  0, true),
  (112, 6, 'Lechuga AMERICANA-UNIDAD',                             'Lechuga AMERICANA-27','UNIDAD',                       375.00,  250.00, 'UNIDAD',                  0, true),
  (113, 6, 'ROMERO-KG',                                            'ROMERO-27',          'KG',                          8250.00,  303.00, 'KG',                      0, true),
  (114, 6, 'ROMERO-UNIDAD ROLLO',                                  'ROMERO-27-01',       'UNIDAD',                       450.00,  303.00, 'UNIDAD',                  0, true),
  (115, 6, 'LIMON MANDARINA-UNIDAD',                               'LIMON Mandarina-28-01','UNIDAD',                      150.00,   70.00, 'UNIDAD',                  0, true),
  (116, 6, 'MANZANA GALA-UNIDAD',                                  'MANZANA GALA-29',    'UNIDAD',                       570.00,  380.00, 'UNIDAD',                  0, true),
  (117, 6, 'MARACUYA KG',                                          'MARACUYA 56',        'KG',                          1500.00, 1800.00, 'KG',                      0, true),
  (118, 6, 'TAMARINDO KG',                                         'TAMARINDO-3.1',      'KG',                          3600.00, 2000.00, 'KG',                      0, true),
  (119, 6, 'MOSTAZA CHINA-UNIDAD',                                 'MOSTAZA CHINA-31',   'UNIDAD',                       600.00,  505.00, 'UNIDAD',                  0, true),
  (120, 6, 'NARANJA-UNIDAD',                                       'NARANJA-32-01',      'UNIDAD',                       187.00,  120.00, 'UNIDAD',                  0, true),
  (121, 6, 'OREGANO-ROLLO UNIDAD',                                 'OREGANO-33',         'UNIDAD',                       525.00,  505.00, 'UNIDAD',                  0, true),
  (122, 6, 'PAPA AMARILLA-KG',                                     'PAPA AMARILLA-34',   'KG',                           675.00, 2500.00, 'KG',                      0, true),
  (123, 6, 'PAPA ROJA-KG',                                         'PAPA ROJA-35',       'KG',                          1050.00, 2694.00, 'KG',                      0, true),
  (124, 6, 'PAPA SEMILLA-KG',                                      'PAPA SEMILLA-36',    'KG',                           675.00, 2245.00, 'KG',                      0, true),
  (125, 6, 'PAPAYA-KG',                                            'PAPAYA-37-1',        'KG',                           735.00, 1300.00, 'KG',                      0, true),
  (126, 6, 'PEPINO-KG',                                            'PEPINO-38-1',        'KG',                           417.00,  354.00, 'KG',                      0, true),
  (127, 6, 'PEREJIL-ROLLO UNIDAD',                                 'PEREJIL-39',         'UNIDAD',                      1200.00,  606.00, 'UNIDAD',                  0, true),
  (128, 6, 'PIÑA-UNIDAD',                                          'PIÑA-40',            'UNIDAD',                      1830.00, 1200.00, 'UNIDAD',                  0, true),
  (129, 6, 'PLATANO MADURO-UNIDAD',                                'PLATANO MADURO-41',  'UNIDAD',                       360.00,  232.00, 'UNIDAD',                  0, true),
  (130, 6, 'PLATANO VERDE-UNIDAD',                                 'PLATANO VERDE-42',   'UNIDAD',                       360.00,  232.00, 'UNIDAD',                  0, true),
  (131, 6, 'RABANO-ROLLO',                                         'RABANO-43',          'UNIDAD',                       450.00,  500.00, 'UNIDAD',                  0, true),
  (132, 6, 'REMOLACHA-UNIDAD',                                     'REMOLACHA-44-01',    'UNIDAD',                       450.00,  450.00, 'UNIDAD',                  0, true),
  (133, 6, 'REPOLLO BLANCO-KG',                                    'REPOLLO BLANCO-45',  'KG',                           525.00, 1111.00, 'KG',                      0, true),
  (134, 6, 'REPOLLO MORADO-KG',                                    'REPOLLO MORADO-46',  'KG',                          1050.00, 1500.00, 'KG',                      0, true),
  (135, 6, 'SANDIA KG',                                            'SANDIA-58',          'KG',                           565.00,  600.00, 'KG',                      0, true),
  (136, 6, 'TIQUISQUE-KG',                                         'TIQUISQUE-47',       'KG',                          2550.00,  808.00, 'KG',                      0, true),
  (137, 6, 'TOMATE-KG',                                            'TOMATE-48',          'KG',                          2750.00,  842.00, 'KG',                      0, true),
  (138, 6, 'TOMILLO-ROLLO UNIDAD',                                 'TOMILLO-49',         'UNIDAD',                      1500.00,  909.00, 'UNIDAD',                  0, true),
  (139, 6, 'VAINICA-KG',                                           'VAINICA-50',         'KG',                           750.00, 1350.00, 'KG',                      0, true),
  (140, 6, 'YUCA-KG',                                              'YUCA-51',            'KG',                           750.00,  606.00, 'KG',                      0, true),
  (141, 6, 'ZANAHORIA-KG',                                         'ZANAHORIA-52',       'KG',                           675.00, 1010.00, 'KG',                      0, true),
  (142, 6, 'ZUCHINNI-UNIDAD',                                      'ZUCHINNI-53',        'UNIDAD',                       484.00,  700.00, 'UNIDAD',                  0, true),
  (143, 6, 'MANZANA VERDE',                                        'MANZANA VERDE',      'UNIDAD',                       570.00,  360.00, 'UNIDAD',                  0, true),
  (144, 4, 'Contenedor 9x9 _S/D -BagazoCaña x 100u',              'SH09',               'tira x 100 ud',               9628.30, 8500.00, 'tira x 100 ud',           0, true),
  (145, 6, 'LIMON MESINO UNI',                                     'LIMON MESINO UNI',   'UNI',                          195.00,  150.00, 'UNI',                     0, true),
  (146, 6, 'TOMATE SLM KG',                                        'TOMATE SLM KG',      'KG',                          2832.00, 1500.00, 'KG',                      0, true),
  (147, 5, 'BT- Jelly Brown Sugar Noodles 3,8 kg',                 'B- Jelly Brw Noodles','1',                          11769.90,10735.00, '1',                       0, true),
  (148, 5, 'BT- Pooping Boba Fresa 3,5 kg',                        'B- Pooping FRESA',   '1',                          17345.10,15820.00, '1',                       0, true),
  (149, NULL,'TB _Salsa CARIBEÑA ( 1 galón de 3,6 Litros)',        'TB _S Caribe 1g',    '3.6 L',                       3898.75, 3388.90, '3.6 L',                   0, true),
  (150, NULL,'Envase 3,6L p/ S.Caribeña (¢700 c/u, retornable)',   'Tb_SC_recip 1g',     'galón plástico',               619.45,  553.10, 'galón plástico',           0, true),
  (151, NULL,'TB _ Salsa CARIBEÑA (1 Pichinga de 5 Litros)',       'TB _S Caribe 5L',    'Pichinga',                    5414.92, 4706.81, 'Pichinga',                 0, true),
  (152, NULL,'Envase 5L_p/ S.Caribeña (¢1,700 c/u, retornable)',  'Tb_SC_recip 5L',     'Pichinga 5L',                 1504.40, 1504.40, 'Pichinga 5L',              0, true),
  (153, 6, 'TOMILLO KG',                                           NULL,                 'KG',                         15000.00,    0.00, 'KG',                      0, true),
  (154, 5, 'BT- Jelly Rainbow Fruits 3,8 kg',                      'B-Jelly Rainbow F',  'galón',                      14867.20,13560.00, 'galón',                   0, true),
  (155, 5, 'BT- Cuchara Medidora',                                 'B- CucharaMed',      '1',                           1425.30, 1300.00, '1',                       0, true),
  (156, 4, 'Contndr 6x6 -bagazoCaña x 50u (Porción SLM)',         'GW026',              '50u',                         2531.50, 2151.00, '50u',                     0, true),
  (157, 4, 'Souf VASO Transp  5,5 oz x 125u _SLM',                'H-Souffle-V-5,5oz',  '125 unidades',                1619.25, 1375.75, '125 unidades',             0, true),
  (158, 4, 'Souf Tapa Transp  5,5 oz x 100u  __25 tiras SLM',     'H-Souf-T-5,5oz',     'tira x 100 ud',                706.25,  600.10, 'tira x 100 ud',           0, true),
  (159, 4, 'Contenedor AlmidonMaiz _7x7 _S/D x 100u',             'PD717',              'tira x 100 ud',              12635.00,10735.00, 'tira x 100 ud',            0, true),
  (160, 4, 'Bowl NEGRO Redondo c/tapa transp  x 50 u _HG-TB-SL',  'TY-7832',            'tira x 50 ud',                6720.00, 5932.50, 'tira x 50 ud',             0, true),
  (161, 4, 'Cont NEGRO c/3div c/tapa transp -BULTO x 150u',       'SW-30',              'Bulto x 150',                25884.90,22500.00, 'Bulto x 150',              0, true),
  (162, 7, 'FL_AGUA CRISTAL 600ML x PAQT 12 UNIDS',               'AC600',              'X 12u',                       6610.00, 6610.00, 'X 12u',                   0, true),
  (163, 7, 'Fl_PEPSI 355ML x PAQT 12 UNIDS',                      'PEP335',             'X 12u',                       4385.00, 4385.00, 'X 12u',                   0, true),
  (164, 4, 'CONO CHICHRR PEQ TaBueno x 50 u',                     'C.PEQ TB',           'X 50',                       15750.00,15750.00, 'X 50',                    0, true),
  (165, 4, 'CONO CHICHRR Grande Hungry x 50u',                     'C.Grand HG',         'X 50',                       17250.00,17250.00, 'X 50',                    0, true);

SELECT setval('productos_id_seq', (SELECT MAX(id) FROM productos));

-- ============================================================
--  FIN
-- ============================================================
