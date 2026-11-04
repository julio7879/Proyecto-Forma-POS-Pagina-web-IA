import { AppError } from '../../../shared/domain/AppError.js';
import {
  DaneShippingCalculator,
  type ExcepcionTarifa,
  type InfoMunicipioDane,
  type ResultadoTarifaEnvio,
} from './DaneShippingCalculator.js';

export interface ItemCarrito {
  varianteId: number;
  cantidad: number;
}

export interface StockSedeVariante {
  varianteId: number;
  disponible: number;
  bloqueadoDespachoWeb: boolean;
}

export interface EvaluacionSede {
  id: number;
  nombre: string;
  activa: boolean;
  despachaWeb: boolean;
  prioridadDespacho: number;
  municipioDane: InfoMunicipioDane;
  saldos: Map<number, StockSedeVariante>;
}

export interface SedeElegidaConTarifa {
  sede: EvaluacionSede;
  tarifaEnvio: ResultadoTarifaEnvio;
}

/**
 * Algoritmo Determinista de Asignación de Sedes para Pedidos Web (RN-WEB-05, CA-35, CA-36)
 * Cero envíos divididos. Desempate canónico por:
 * 1. Menor tarifa de envío hacia destino.
 * 2. Menor prioridad de despacho (menor número gana: Centro 10, Ocaña 20, Bucaramanga 30, Central 40).
 * 3. Menor ID numérico de ubicación.
 */
export class OrderAssignmentEngine {
  static seleccionarSedeDespacho(
    items: ItemCarrito[],
    municipioDestino: InfoMunicipioDane,
    sedes: EvaluacionSede[],
    excepcionesTarifa: ExcepcionTarifa[] = [],
    tarifasPersonalizadas?: Record<number, { tarifaCop: number; diasEstimados: number }>
  ): SedeElegidaConTarifa {
    if (items.length === 0) {
      throw AppError.badRequest('El carrito no contiene items para asignar despacho.');
    }

    // 1. Filtrar sedes que cumplan la condición de stock completo para TODO el carrito (RN-WEB-05)
    const candidatasAptas: Array<{ sede: EvaluacionSede; tarifaEnvio: ResultadoTarifaEnvio }> = [];

    for (const sede of sedes) {
      // Regla: Sede debe estar activa y habilitada para despacho web (RN-UBI-03)
      if (!sede.activa || !sede.despachaWeb) {
        continue;
      }

      let tieneStockCompleto = true;

      for (const item of items) {
        const saldoVariante = sede.saldos.get(item.varianteId);

        // Regla: Si la sede no tiene registro, tiene cuarentena activa o disponible < requerido, se descarta
        if (!saldoVariante) {
          tieneStockCompleto = false;
          break;
        }

        if (saldoVariante.bloqueadoDespachoWeb) {
          tieneStockCompleto = false;
          break;
        }

        if (saldoVariante.disponible < item.cantidad) {
          tieneStockCompleto = false;
          break;
        }
      }

      if (tieneStockCompleto) {
        // Calcular tarifa de envío desde esta sede candidata hacia el municipio destino
        const tarifaEnvio = DaneShippingCalculator.calcular(
          sede.municipioDane,
          municipioDestino,
          excepcionesTarifa,
          tarifasPersonalizadas
        );

        candidatasAptas.push({ sede, tarifaEnvio });
      }
    }

    // CA-35: Si ninguna sede individual tiene stock para todo el carrito, se rechaza
    if (candidatasAptas.length === 0) {
      throw AppError.conflict(
        'No hay inventario suficiente en una sola sede para despachar el pedido completo. La empresa no realiza envíos divididos (CA-35).'
      );
    }

    // 2. Desempate estricto determinista (RN-WEB-05, CA-36):
    // 1) Menor tarifaCop
    // 2) Menor prioridadDespacho
    // 3) Menor id
    candidatasAptas.sort((a, b) => {
      // 1. Menor tarifa de envío
      if (a.tarifaEnvio.tarifaCop !== b.tarifaEnvio.tarifaCop) {
        return a.tarifaEnvio.tarifaCop - b.tarifaEnvio.tarifaCop;
      }

      // 2. Menor prioridad de despacho
      if (a.sede.prioridadDespacho !== b.sede.prioridadDespacho) {
        return a.sede.prioridadDespacho - b.sede.prioridadDespacho;
      }

      // 3. Menor ID numérico
      return a.sede.id - b.sede.id;
    });

    return candidatasAptas[0]!;
  }
}
