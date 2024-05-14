import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1715726792192 implements MigrationInterface {
    name = 'Migration1715726792192'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "token_address_idx"`);
        await queryRunner.query(`DROP INDEX "chat_id_idx"`);
        await queryRunner.query(`CREATE TABLE "temporary_config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "chatId" varchar NOT NULL, "value" json NOT NULL, "tokenAddress" varchar, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "firstSync" boolean NOT NULL DEFAULT (1))`);
        await queryRunner.query(`INSERT INTO "temporary_config"("id", "chatId", "value", "tokenAddress", "createdAt", "updatedAt") SELECT "id", "chatId", "value", "tokenAddress", "createdAt", "updatedAt" FROM "config"`);
        await queryRunner.query(`DROP TABLE "config"`);
        await queryRunner.query(`ALTER TABLE "temporary_config" RENAME TO "config"`);
        await queryRunner.query(`CREATE INDEX "token_address_idx" ON "config" ("tokenAddress") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "chat_id_idx" ON "config" ("chatId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "chat_id_idx"`);
        await queryRunner.query(`DROP INDEX "token_address_idx"`);
        await queryRunner.query(`ALTER TABLE "config" RENAME TO "temporary_config"`);
        await queryRunner.query(`CREATE TABLE "config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "chatId" varchar NOT NULL, "value" json NOT NULL, "tokenAddress" varchar, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`);
        await queryRunner.query(`INSERT INTO "config"("id", "chatId", "value", "tokenAddress", "createdAt", "updatedAt") SELECT "id", "chatId", "value", "tokenAddress", "createdAt", "updatedAt" FROM "temporary_config"`);
        await queryRunner.query(`DROP TABLE "temporary_config"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "chat_id_idx" ON "config" ("chatId") `);
        await queryRunner.query(`CREATE INDEX "token_address_idx" ON "config" ("tokenAddress") `);
    }

}
