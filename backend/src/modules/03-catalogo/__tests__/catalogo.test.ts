import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';

describe('Módulo 03: Catálogo, Categorías y Variantes (RF-CAT)', () => {
  it('GET /api/catalogo/health responde status ready', async () => {
    const res = await request(app).get('/api/catalogo/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
  });

  it('GET /api/catalogo/categorias retorna lista de categorías activas', async () => {
    const res = await request(app).get('/api/catalogo/categorias');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.datos)).toBe(true);
    expect(res.body.datos.length).toBeGreaterThan(0);
  });

  it('GET /api/catalogo/productos retorna el catálogo con variantes y stock calculado', async () => {
    const res = await request(app).get('/api/catalogo/productos?limite=10');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.datos)).toBe(true);
    expect(res.body.datos.length).toBeGreaterThan(0);

    const primerProd = res.body.datos[0];
    expect(primerProd).toHaveProperty('id');
    expect(primerProd).toHaveProperty('nombre');
    expect(primerProd).toHaveProperty('slug');
    expect(primerProd).toHaveProperty('categoriaNombre');
    expect(Array.isArray(primerProd.variantes)).toBe(true);
    expect(primerProd.variantes.length).toBeGreaterThan(0);
    expect(primerProd.variantes[0]).toHaveProperty('sku');
    expect(primerProd.variantes[0]).toHaveProperty('precioVentaCop');
    expect(primerProd.variantes[0]).toHaveProperty('stockDisponible');
  });

  it('GET /api/catalogo/productos con filtro de categoría retorna solo esa categoría', async () => {
    const res = await request(app).get('/api/catalogo/productos?categoria=Ropa&limite=5');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    if (res.body.datos.length > 0) {
      for (const p of res.body.datos) {
        expect(p.categoriaNombre).toBe('Ropa');
      }
    }
  });

  it('GET /api/catalogo/productos/:slug retorna detalle de producto existente', async () => {
    const listaRes = await request(app).get('/api/catalogo/productos?limite=1');
    const slug = listaRes.body.datos[0]?.slug;
    if (slug) {
      const res = await request(app).get(`/api/catalogo/productos/${slug}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.datos.slug).toBe(slug);
      expect(res.body.datos.variantes[0]).toHaveProperty('stockPorSede');
    }
  });

  it('GET /api/catalogo/productos/:slug con slug inexistente retorna 404', async () => {
    const res = await request(app).get('/api/catalogo/productos/slug-que-no-existe-12345');
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
  });
});
