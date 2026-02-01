-- CreateEnum
CREATE TYPE "CallType" AS ENUM ('AUDIO', 'VIDEO');

-- AlterTable
ALTER TABLE "CallLog" ADD COLUMN     "call_type" "CallType" NOT NULL DEFAULT 'AUDIO',
ADD COLUMN     "callee_id" TEXT;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_callee_id_fkey" FOREIGN KEY ("callee_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
