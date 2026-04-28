# GHF Inventarios

Sistema de gestión de inventarios, pedidos y facturación para múltiples sociedades, marcas y locales (estilo Costa Rica).

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies. UI completamente en español.

## Artifacts

- `inventarios` (web app, React+Vite, path `/`) — UI principal
- `api-server` (Express, path `/api`) — backend API

## Stack

- **Monorepo**: pnpm workspaces, Node 24, TypeScript 5.9
- **API**: Express 5, express-session + connect-pg-simple
- **DB**: PostgreSQL + Drizzle ORM
- **Auth**: contraseñas con bcryptjs, sesiones cookie en Postgres
- **API codegen**: OpenAPI → Orval → React Query hooks + zod
- **Frontend**: React 18, Vite, TanStack Query, wouter, shadcn/ui, Tailwind, recharts

## Domain model

- `sociedades` — entidades legales
- `marcas` — marcas comerciales (Café Central, Pizza Express, etc.)
- `locales` — sucursales (pertenecen a una sociedad y una marca)
- `categorias` + `productos` (con sku, precio, costo, stock mínimo)
- `stock` por producto×local + `movimientos_stock` (entrada/salida/ajuste/venta)
- `pedidos` con `pedido_detalles` (estado: pendiente/facturado/anulado)
- `facturas` con `factura_detalles` (numeradas F-YYYY-XXXXXX)
- `users` con rol (admin | local) y opcional `localId` (los usuarios de local sólo ven datos de su local)

## Auth & roles

- Sesión vía cookie HttpOnly almacenada en tabla `user_sessions` (Postgres).
- `admin` ve y administra todo.
- `local` ve únicamente datos de su local (stock, movimientos, pedidos, facturas).
- Usuarios sembrados:
  - `admin / admin123` (rol admin)
  - `centro / local123` (Café Central – Centro)
  - `escazu / local123` (Pizza Express – Escazú)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — solo libs (composite)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks/zod
- `pnpm --filter @workspace/db run push` — push schema changes
- `pnpm --filter @workspace/scripts run seed` — siembra datos demo (usuarios, productos, locales, stock)

## Páginas (artifacts/inventarios/src/pages)

- `dashboard` — KPIs, ventas/día, top productos, ventas por local, stock bajo, actividad reciente
- `sociedades`, `marcas`, `locales` — organización
- `categorias`, `productos` — catálogo (búsqueda + filtro por categoría)
- `stock` — inventario por local con badges (ok/bajo/agotado)
- `movimientos` — registro y creación de movimientos
- `pedidos` — listado, creación dinámica con líneas, facturar/anular
- `facturas` — listado y vista detalle imprimible
- `usuarios` — admin only

## Convenciones de UI

- Moneda: ₡ con 2 decimales (`formatCurrency`)
- Fechas: DD/MM/AAAA (`formatDate` / `formatDateTime`)
- Sin emojis. Iconos lucide-react.
- Componentes shadcn/ui en `components/ui/*`.
