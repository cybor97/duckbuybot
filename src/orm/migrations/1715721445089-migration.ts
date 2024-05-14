import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1715721445089 implements MigrationInterface {
    name = 'Migration1715721445089'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "chatId" varchar NOT NULL, "value" json NOT NULL, "tokenAddress" varchar, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "chat_id_idx" ON "config" ("chatId") `);
        await queryRunner.query(`CREATE INDEX "token_address_idx" ON "config" ("tokenAddress") `);
        await queryRunner.query(`CREATE TABLE "holder" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "address" varchar NOT NULL, "tokenAddress" varchar NOT NULL, "balance" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "address_idx" ON "holder" ("address") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "holder_token_address_idx" ON "holder" ("tokenAddress") `);
        await queryRunner.query(`CREATE TABLE "ticker" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "tokenAddress" varchar NOT NULL, "conmarketcapId" varchar, "value" varchar, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ticker_token_address_idx" ON "ticker" ("tokenAddress") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "ticker_token_address_idx"`);
        await queryRunner.query(`DROP TABLE "ticker"`);
        await queryRunner.query(`DROP INDEX "holder_token_address_idx"`);
        await queryRunner.query(`DROP INDEX "address_idx"`);
        await queryRunner.query(`DROP TABLE "holder"`);
        await queryRunner.query(`DROP INDEX "token_address_idx"`);
        await queryRunner.query(`DROP INDEX "chat_id_idx"`);
        await queryRunner.query(`DROP TABLE "config"`);
    }

}
