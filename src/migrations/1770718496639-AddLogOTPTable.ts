import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";
import { LOG_OTP_TABLE } from "src/models/otp-log.entity";

export class AddLogOTPTable1770718496639 implements MigrationInterface {
    name = 'AddLogOTPTable1770718496639'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable(LOG_OTP_TABLE);
        if (!hasTable) {
            await queryRunner.createTable(new Table({
                name: LOG_OTP_TABLE,
                columns: [
                    {
                        name: 'id',
                        type: 'SERIAL',
                        isPrimary: true,
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'otp',
                        type: 'varchar',
                        length: '6',
                        isNullable: false,
                    },
                    {
                        name: 'is_verified',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'verified_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'attempt',
                        type: 'int',
                        default: 1,
                    },
                    {
                        name: 'expires_at',
                        type: 'timestamp',
                        isNullable: false,
                    },
                    {
                        name: 'user_agent',
                        type: 'text',
                        isNullable: true,
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

            await queryRunner.createIndex(LOG_OTP_TABLE, new TableIndex({
                name: 'IDX_log_otp_email_verified_expires_at',
                columnNames: ['email', 'is_verified', 'expires_at'],
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable(LOG_OTP_TABLE);
    }

}
