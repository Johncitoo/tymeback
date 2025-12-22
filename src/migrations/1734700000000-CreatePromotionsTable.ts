import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePromotionsTable1734700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'promotions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'gym_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '20',
            isNullable: false,
            comment: 'PERCENTAGE or FIXED',
          },
          {
            name: 'discount_value',
            type: 'int',
            isNullable: false,
            comment: 'For PERCENTAGE: 10 = 10%. For FIXED: amount in CLP',
          },
          {
            name: 'valid_from',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'valid_until',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'max_uses',
            type: 'int',
            isNullable: true,
            comment: 'NULL = unlimited uses',
          },
          {
            name: 'times_used',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'applicable_plan_ids',
            type: 'jsonb',
            isNullable: true,
            comment: 'Array of plan UUIDs. NULL = applies to all plans',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['gym_id'],
            referencedTableName: 'gyms',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create unique index on gym_id + code
    await queryRunner.createIndex(
      'promotions',
      new TableIndex({
        name: 'IDX_PROMOTIONS_GYM_CODE',
        columnNames: ['gym_id', 'code'],
        isUnique: true,
      }),
    );

    // Create index on valid dates for fast lookups
    await queryRunner.createIndex(
      'promotions',
      new TableIndex({
        name: 'IDX_PROMOTIONS_VALID_DATES',
        columnNames: ['valid_from', 'valid_until'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('promotions');
  }
}
