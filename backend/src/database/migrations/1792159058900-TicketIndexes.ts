import { MigrationInterface, QueryRunner } from "typeorm";

export class TicketIndexes1792159058900 implements MigrationInterface {
    name = 'TicketIndexes1792159058900'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_12b901b34113688b4786368510" ON "tickets" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_41de538b3eed286f53dd678b03" ON "tickets" ("createdById") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_41de538b3eed286f53dd678b03"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_12b901b34113688b4786368510"`);
    }

}
