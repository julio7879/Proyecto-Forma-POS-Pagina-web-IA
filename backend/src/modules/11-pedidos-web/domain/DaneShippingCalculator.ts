import { AppError } from '../../../shared/domain/AppError.js';

export interface InfoMunicipioDane {
  codigoDane: string;
  departamentoId: string;
  regionId: number;
  atendidoWeb: boolean;
}

export interface ExcepcionTarifa {
  municipioOrigenId: string;
  municipioDestinoId: string;
  tarifaCop: number;
  diasEstimados: number;
}

export interface ResultadoTarifaEnvio {
  zona: number;
  tarifaCop: number; // COP entero (RN-GEN-04)
  diasEstimados: number;
  esExcepcion: boolean;
}

export const TARIFAS_ZONAS_DEFAULT: Record<number, { tarifaCop: number; diasEstimados: number }> = {
  1: { tarifaCop: 8000, diasEstimados: 2 },
  2: { tarifaCop: 12000, diasEstimados: 3 },
  3: { tarifaCop: 16000, diasEstimados: 4 },
  4: { tarifaCop: 22000, diasEstimados: 6 },
};

/**
 * Calculador de Fletes y Zonas DANE 1 a 4 (RN-ENV-01 a RN-ENV-07, CA-37)
 * Dominio puro sin dependencias de base de datos ni Express.
 */
export class DaneShippingCalculator {
  static calcular(
    origen: InfoMunicipioDane,
    destino: InfoMunicipioDane,
    excepciones: ExcepcionTarifa[] = [],
    tarifasPersonalizadas?: Record<number, { tarifaCop: number; diasEstimados: number }>
  ): ResultadoTarifaEnvio {
    // CA-37: Validación estricta de municipio atendido web
    if (!destino.atendidoWeb) {
      throw AppError.unprocessable(
        `El municipio de destino (${destino.codigoDane}) no cuenta con cobertura de entrega web (CA-37).`
      );
    }

    // 1. Verificar excepciones de tarifa origen-destino (RN-ENV-03)
    const excepcion = excepciones.find(
      (e) => e.municipioOrigenId === origen.codigoDane && e.municipioDestinoId === destino.codigoDane
    );

    if (excepcion) {
      return {
        zona: 0, // Zona 0 indica tarifa por excepción específica
        tarifaCop: Math.round(excepcion.tarifaCop),
        diasEstimados: excepcion.diasEstimados,
        esExcepcion: true,
      };
    }

    // 2. Determinar Zona Geográfica DANE
    let zona = 4;
    if (origen.codigoDane === destino.codigoDane) {
      zona = 1; // Mismo municipio
    } else if (origen.departamentoId === destino.departamentoId) {
      zona = 2; // Mismo departamento
    } else if (origen.regionId === destino.regionId) {
      zona = 3; // Misma región geográfica
    } else {
      zona = 4; // Diferente región
    }

    const tablaTarifas = tarifasPersonalizadas ?? TARIFAS_ZONAS_DEFAULT;
    const datosZona = tablaTarifas[zona] ?? TARIFAS_ZONAS_DEFAULT[zona]!;

    return {
      zona,
      tarifaCop: datosZona.tarifaCop,
      diasEstimados: datosZona.diasEstimados,
      esExcepcion: false,
    };
  }
}
