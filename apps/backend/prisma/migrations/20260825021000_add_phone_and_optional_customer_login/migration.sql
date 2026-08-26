-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT,
ALTER COLUMN "password" DROP NOT NULL;
