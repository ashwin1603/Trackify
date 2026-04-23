/*
  Warnings:

  - A unique constraint covering the columns `[devCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Bug" ADD COLUMN     "assignedToDevCode" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "devCode" TEXT,
ADD COLUMN     "dob" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_devCode_key" ON "User"("devCode");
