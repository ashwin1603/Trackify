-- AlterTable
ALTER TABLE "SecurityAlert" ADD COLUMN     "mlAnomalyScore" DOUBLE PRECISION,
ADD COLUMN     "mlRiskScore" DOUBLE PRECISION;
