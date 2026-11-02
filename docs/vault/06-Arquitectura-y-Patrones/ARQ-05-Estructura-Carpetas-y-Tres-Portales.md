---
id: ARQ-05
tags: [arquitectura, carpetas, estructura, portales, frontend, backend]
---
# Estructura Canónica de Carpetas y Portales (Sección 4.1 y 4.2)

Relacionado con: [[00-Indice-Mapa-Mental-MOC]] | [[ARQ-02-Stack-Tecnologico-y-Despliegue]]

## 1. Integración de los 3 Portales en un Único Frontend
```text
React 18.3+ / Vite / Tailwind CSS
 ├── Portal 1: Tienda Web Pública (StorefrontLayout) -> Catálogo, semáforo, carrito, checkout DANE, Ley 1581.
 ├── Portal 2: Terminal POS (PosLayout)             -> Pantalla completa >= 1024px, caja, venta rápida, cambios.
 └── Portal 3: Panel Admin (AdminLayout)            -> Catálogo, inventario, compras, traslados, reportes, auditoría.
```

## 2. Árbol de Directorios Oficial del Proyecto
```text
pos-tienda-web/
├── backend/
│   ├── prisma/                  # schema.prisma, migrations/, constraints_post_migrate.sql, seed.ts
│   ├── src/
│   │   ├── config/              # env.ts (Zod), database.ts, constants.ts
│   │   ├── shared/
│   │   │   ├── domain/          # MoneyCOP.ts, ColombiaTime.ts, AppError.ts
│   │   │   ├── middlewares/     # authPermission.ts, idempotency.ts, validateZod.ts, errorHandler.ts
│   │   │   └── ports/           # PagoPort, NotificacionPort, DespachoTransportadoraPort, FacturacionPort
│   │   ├── modules/             # 12 Vertical Slices (Commands & Queries):
│   │   │   ├── 01-identidad/    ├── 02-ubicaciones/  ├── 03-catalogo/             ├── 04-inventario/
│   │   │   ├── 05-compras/      ├── 06-traslados/    ├── 07-caja/                 ├── 08-ventas-pos/
│   │   │   ├── 09-descuentos/   ├── 10-devoluciones/ ├── 11-pedidos-web/          └── 12-reportes-auditoria/
│   │   ├── workers/             # reservaExpirationWorker.ts, kardexIntegrityWorker.ts
│   │   ├── app.ts               # Configuración Express, middlewares y rutas
│   │   └── server.ts            # Arranque del servidor HTTP en PORT
│   └── tests/                   # Vitest unitarias, integración y concurrencia
└── frontend/
    ├── src/
    │   ├── api/                 # Cliente HTTP centralizado con inyección de Idempotency-Key
    │   ├── layouts/             # StorefrontLayout.tsx, PosLayout.tsx, AdminLayout.tsx
    │   ├── features/            # Submódulos por portal: storefront/, pos/, admin/
    │   ├── routes/              # AppRouter.tsx con carga diferida (React.lazy)
    │   └── main.tsx             # Entrada React DOM
    ├── package.json
    └── vite.config.ts
```
