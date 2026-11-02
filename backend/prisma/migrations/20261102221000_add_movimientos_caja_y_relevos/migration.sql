-- CreateEnum
CREATE TYPE "TipoMovimientoCaja" AS ENUM ('SANGRIA_RETIRO', 'GASTO_MENOR', 'INGRESO_MANUAL');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "authProvider" TEXT NOT NULL DEFAULT 'LOCAL',
ADD COLUMN     "googleId" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "MovimientoCaja" (
    "id" SERIAL NOT NULL,
    "sesionCajaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "tipo" "TipoMovimientoCaja" NOT NULL,
    "montoCop" INTEGER NOT NULL,
    "concepto" TEXT NOT NULL,
    "comprobanteSoporte" TEXT,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MovimientoCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelevoTurnoCaja" (
    "id" SERIAL NOT NULL,
    "sesionCajaId" INTEGER NOT NULL,
    "cajeroSalienteId" INTEGER NOT NULL,
    "cajeroEntranteId" INTEGER NOT NULL,
    "efectivoContadoCop" INTEGER NOT NULL,
    "efectivoEsperadoHastaCorteCop" INTEGER NOT NULL,
    "diferenciaCop" INTEGER NOT NULL,
    "observacion" TEXT,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelevoTurnoCaja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MovimientoCaja_sesionCajaId_fechaHora_idx" ON "MovimientoCaja"("sesionCajaId", "fechaHora");

-- CreateIndex
CREATE INDEX "RelevoTurnoCaja_sesionCajaId_fechaHora_idx" ON "RelevoTurnoCaja"("sesionCajaId", "fechaHora");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_googleId_key" ON "Usuario"("googleId");

-- AddForeignKey
ALTER TABLE "MovimientoCaja" ADD CONSTRAINT "MovimientoCaja_sesionCajaId_fkey" FOREIGN KEY ("sesionCajaId") REFERENCES "SesionCaja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCaja" ADD CONSTRAINT "MovimientoCaja_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelevoTurnoCaja" ADD CONSTRAINT "RelevoTurnoCaja_sesionCajaId_fkey" FOREIGN KEY ("sesionCajaId") REFERENCES "SesionCaja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelevoTurnoCaja" ADD CONSTRAINT "RelevoTurnoCaja_cajeroSalienteId_fkey" FOREIGN KEY ("cajeroSalienteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelevoTurnoCaja" ADD CONSTRAINT "RelevoTurnoCaja_cajeroEntranteId_fkey" FOREIGN KEY ("cajeroEntranteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
