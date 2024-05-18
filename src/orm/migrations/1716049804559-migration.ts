import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1716049804559 implements MigrationInterface {
    name = 'Migration1716049804559'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "address_idx"`);
        await queryRunner.query(`DROP INDEX "holder_token_address_idx"`);
        await queryRunner.query(`CREATE TABLE "temporary_holder" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "address" varchar NOT NULL, "tokenAddress" varchar NOT NULL, "balance" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "lastLT" varchar NULL)`);
        await queryRunner.query(`INSERT INTO "temporary_holder"("id", "address", "tokenAddress", "balance", "createdAt", "updatedAt") SELECT "id", "address", "tokenAddress", "balance", "createdAt", "updatedAt" FROM "holder"`);
        await queryRunner.query(`DROP TABLE "holder"`);
        await queryRunner.query(`ALTER TABLE "temporary_holder" RENAME TO "holder"`);
        await queryRunner.query(`CREATE INDEX "holder_token_address_idx" ON "holder" ("tokenAddress") `);
        await queryRunner.query(`CREATE INDEX "address_idx" ON "holder" ("address") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "address_idx"`);
        await queryRunner.query(`DROP INDEX "holder_token_address_idx"`);
        await queryRunner.query(`ALTER TABLE "holder" RENAME TO "temporary_holder"`);
        await queryRunner.query(`CREATE TABLE "holder" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "address" varchar NOT NULL, "tokenAddress" varchar NOT NULL, "balance" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`);
        await queryRunner.query(`INSERT INTO "holder"("id", "address", "tokenAddress", "balance", "createdAt", "updatedAt") SELECT "id", "address", "tokenAddress", "balance", "createdAt", "updatedAt" FROM "temporary_holder"`);
        await queryRunner.query(`DROP TABLE "temporary_holder"`);
        await queryRunner.query(`CREATE INDEX "holder_token_address_idx" ON "holder" ("tokenAddress") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "address_idx" ON "holder" ("address") `);
    }

}
