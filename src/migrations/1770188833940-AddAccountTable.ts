import { ACCOUNT_TABLE } from "src/models/account.entity";
import { MEMBER_TABLE } from "src/models/member.entity";
import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class AddAccountTable1770188833940 implements MigrationInterface {
    name = 'AddAccountTable1770188833940'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable(ACCOUNT_TABLE);
        if (!hasTable) {
            await queryRunner.createTable(new Table({
                name: ACCOUNT_TABLE,
                columns: [
                    {
                        name: 'id',
                        type: 'SERIAL',
                        isPrimary: true,
                    },
                    {
                        name: 'member_id',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'secure_password',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'is_admin',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'admin_auth_index',
                        type: 'smallint',
                        default: '0',
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                      },
                      {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                      },
                      {
                        name: 'deleted_at',
                        type: 'timestamp',
                        isNullable: true,
                      },
                ]
            }));

            await queryRunner.createForeignKey(ACCOUNT_TABLE, new TableForeignKey({
                columnNames: ['member_id'],
                referencedColumnNames: ['id'],
                referencedTableName: MEMBER_TABLE,
                onDelete: 'SET NULL'
            }));

            await queryRunner.createIndices(ACCOUNT_TABLE, [
                new TableIndex({
                    name: 'IDX_account_member_id',
                    columnNames: ['member_id'],
                    isUnique: true
                }),
                new TableIndex({
                    name: 'IDX_account_email',
                    columnNames: ['email'],
                    isUnique: true
                })
            ])
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable(ACCOUNT_TABLE)
    }

}
