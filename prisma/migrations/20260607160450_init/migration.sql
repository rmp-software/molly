-- CreateEnum
CREATE TYPE "SeizureType" AS ENUM ('tonic_clonic', 'focal', 'absence', 'other');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('mild', 'moderate', 'severe');

-- CreateEnum
CREATE TYPE "MedCategory" AS ENUM ('continuous', 'otc', 'compounded');

-- CreateEnum
CREATE TYPE "MedForm" AS ENUM ('pill', 'capsule', 'tablet');

-- CreateEnum
CREATE TYPE "StockTxType" AS ENUM ('restock', 'adjustment', 'consumption');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dogs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT,
    "birthdate" DATE,
    "diagnosis" TEXT,
    "vet_name" TEXT,
    "emergency_contact" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_entries" (
    "id" TEXT NOT NULL,
    "dog_id" TEXT NOT NULL,
    "measured_on" DATE NOT NULL,
    "weight_kg" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seizure_episodes" (
    "id" TEXT NOT NULL,
    "dog_id" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "type" "SeizureType" NOT NULL,
    "duration_seconds" INTEGER,
    "severity" "Severity",
    "is_cluster" BOOLEAN NOT NULL DEFAULT false,
    "rescue_given" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seizure_episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "dog_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "MedCategory" NOT NULL,
    "form" "MedForm" NOT NULL,
    "strength_mg" DECIMAL(8,2),
    "reorder_lead_time_days" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_schedules" (
    "id" TEXT NOT NULL,
    "medication_id" TEXT NOT NULL,
    "dose_times" TEXT[],
    "units_per_dose" DECIMAL(8,2) NOT NULL,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medication_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transactions" (
    "id" TEXT NOT NULL,
    "medication_id" TEXT NOT NULL,
    "type" "StockTxType" NOT NULL,
    "quantity" DECIMAL(8,2) NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "weight_entries_dog_id_idx" ON "weight_entries"("dog_id");

-- CreateIndex
CREATE INDEX "seizure_episodes_dog_id_idx" ON "seizure_episodes"("dog_id");

-- CreateIndex
CREATE INDEX "medications_dog_id_idx" ON "medications"("dog_id");

-- CreateIndex
CREATE INDEX "medication_schedules_medication_id_idx" ON "medication_schedules"("medication_id");

-- CreateIndex
CREATE INDEX "stock_transactions_medication_id_idx" ON "stock_transactions"("medication_id");

-- AddForeignKey
ALTER TABLE "weight_entries" ADD CONSTRAINT "weight_entries_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "dogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seizure_episodes" ADD CONSTRAINT "seizure_episodes_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "dogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_dog_id_fkey" FOREIGN KEY ("dog_id") REFERENCES "dogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_schedules" ADD CONSTRAINT "medication_schedules_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
