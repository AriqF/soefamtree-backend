import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateMemberTables1733912400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create members table
    await queryRunner.createTable(
      new Table({
        name: 'members',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'fullname',
            type: 'varchar',
          },
          {
            name: 'nickname',
            type: 'varchar',
          },
          {
            name: 'gender',
            type: 'varchar',
          },
          {
            name: 'birth_date',
            type: 'date',
          },
          {
            name: 'death_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'photo_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'bio',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'spouse_id',
            type: 'int',
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
        ],
      }),
      true,
    );

    // Add self-referencing foreign key for spouse
    await queryRunner.createForeignKey(
      'members',
      new TableForeignKey({
        columnNames: ['spouse_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'members',
        onDelete: 'SET NULL',
      }),
    );

    // Add indexes for members table
    await queryRunner.createIndex(
      'members',
      new TableIndex({
        name: 'IDX_members_birth_date',
        columnNames: ['birth_date'],
      }),
    );

    await queryRunner.createIndex(
      'members',
      new TableIndex({
        name: 'IDX_members_spouse_id',
        columnNames: ['spouse_id'],
      }),
    );

    await queryRunner.createIndex(
      'members',
      new TableIndex({
        name: 'IDX_members_deleted_at',
        columnNames: ['deleted_at'],
      }),
    );

    // Create member_parents table
    await queryRunner.createTable(
      new Table({
        name: 'member_parents',
        columns: [
          {
            name: 'child_id',
            type: 'int',
            isPrimary: true,
          },
          {
            name: 'parent_id',
            type: 'int',
            isPrimary: true,
          },
          {
            name: 'relation',
            type: 'varchar',
          },
        ],
      }),
      true,
    );

    // Add foreign keys for member_parents
    await queryRunner.createForeignKey(
      'member_parents',
      new TableForeignKey({
        columnNames: ['child_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'members',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'member_parents',
      new TableForeignKey({
        columnNames: ['parent_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'members',
        onDelete: 'CASCADE',
      }),
    );

    // Add index for member_parents table
    await queryRunner.createIndex(
      'member_parents',
      new TableIndex({
        name: 'IDX_member_parents_parent_id',
        columnNames: ['parent_id'],
      }),
    );

    // Create member_closure table
    await queryRunner.createTable(
      new Table({
        name: 'member_closure',
        columns: [
          {
            name: 'ancestor_id',
            type: 'int',
            isPrimary: true,
          },
          {
            name: 'descendant_id',
            type: 'int',
            isPrimary: true,
          },
          {
            name: 'depth',
            type: 'int',
          },
        ],
      }),
      true,
    );

    // Add foreign keys for member_closure
    await queryRunner.createForeignKey(
      'member_closure',
      new TableForeignKey({
        columnNames: ['ancestor_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'members',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'member_closure',
      new TableForeignKey({
        columnNames: ['descendant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'members',
        onDelete: 'CASCADE',
      }),
    );

    // Add indexes for member_closure table
    await queryRunner.createIndex(
      'member_closure',
      new TableIndex({
        name: 'IDX_member_closure_descendant_id',
        columnNames: ['descendant_id'],
      }),
    );

    await queryRunner.createIndex(
      'member_closure',
      new TableIndex({
        name: 'IDX_member_closure_depth',
        columnNames: ['depth'],
      }),
    );

    // Create member_details table
    await queryRunner.createTable(
      new Table({
        name: 'member_details',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'member_id',
            type: 'int',
            isUnique: true,
          },
          {
            name: 'profession',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'domicile',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'full_address',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'whatsapp_number',
            type: 'varchar',
            isNullable: true,
            comment: 'format 628xxx',
          },
          {
            name: 'instagram_handle',
            type: 'varchar',
            isNullable: true,
            comment: 'without @',
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
        ],
      }),
      true,
    );

    // Add foreign key for member_details
    await queryRunner.createForeignKey(
      'member_details',
      new TableForeignKey({
        columnNames: ['member_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'members',
        onDelete: 'CASCADE',
      }),
    );

    // Add composite index for member_details table
    await queryRunner.createIndex(
      'member_details',
      new TableIndex({
        name: 'IDX_member_details_deleted_at_member_id',
        columnNames: ['deleted_at', 'member_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (respecting foreign key constraints)

    // Drop member_details indexes and table
    await queryRunner.dropIndex(
      'member_details',
      'IDX_member_details_deleted_at_member_id',
    );
    const memberDetailsTable = await queryRunner.getTable('member_details');
    if (memberDetailsTable) {
      const foreignKey = memberDetailsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('member_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('member_details', foreignKey);
      }
    }
    await queryRunner.dropTable('member_details');

    // Drop member_closure indexes and table
    await queryRunner.dropIndex(
      'member_closure',
      'IDX_member_closure_descendant_id',
    );
    await queryRunner.dropIndex('member_closure', 'IDX_member_closure_depth');
    const memberClosureTable = await queryRunner.getTable('member_closure');
    if (memberClosureTable) {
      for (const foreignKey of memberClosureTable.foreignKeys) {
        await queryRunner.dropForeignKey('member_closure', foreignKey);
      }
    }
    await queryRunner.dropTable('member_closure');

    // Drop member_parents index and table
    await queryRunner.dropIndex(
      'member_parents',
      'IDX_member_parents_parent_id',
    );
    const memberParentsTable = await queryRunner.getTable('member_parents');
    if (memberParentsTable) {
      for (const foreignKey of memberParentsTable.foreignKeys) {
        await queryRunner.dropForeignKey('member_parents', foreignKey);
      }
    }
    await queryRunner.dropTable('member_parents');

    // Drop members indexes and table
    await queryRunner.dropIndex('members', 'IDX_members_birth_date');
    await queryRunner.dropIndex('members', 'IDX_members_spouse_id');
    await queryRunner.dropIndex('members', 'IDX_members_deleted_at');
    const membersTable = await queryRunner.getTable('members');
    if (membersTable) {
      const spouseFk = membersTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('spouse_id') !== -1,
      );
      if (spouseFk) {
        await queryRunner.dropForeignKey('members', spouseFk);
      }
    }
    await queryRunner.dropTable('members');

    // Drop enum types
    await queryRunner.query(`DROP TYPE "parent_relation_enum"`);
    await queryRunner.query(`DROP TYPE "gender_enum"`);
  }
}
