import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1715723711483 implements MigrationInterface {
    name = 'Migration1715723711483'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "holder_token_address_idx"`);
        await queryRunner.query(`CREATE INDEX "holder_token_address_idx" ON "holder" ("tokenAddress") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "holder_token_address_idx"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "holder_token_address_idx" ON "holder" ("tokenAddress") `);
    }

}
