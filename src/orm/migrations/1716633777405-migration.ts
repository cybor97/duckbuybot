import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1716633777405 implements MigrationInterface {
    name = 'Migration1716633777405'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "pool_address" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "address" varchar NOT NULL, "tokenAddress" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`);
        await queryRunner.query(`CREATE INDEX "pool_address_idx" ON "pool_address" ("address") `);
        await queryRunner.query(`CREATE INDEX "pool_token_address_idx" ON "pool_address" ("tokenAddress") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "pool_token_address_idx"`);
        await queryRunner.query(`DROP INDEX "pool_address_idx"`);
        await queryRunner.query(`DROP TABLE "pool_address"`);
    }

}
