-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "externalLink" TEXT;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
