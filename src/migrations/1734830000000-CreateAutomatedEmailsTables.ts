import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAutomatedEmailsTablesRevisado1734830000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabla automated_email_templates
    await queryRunner.createTable(
      new Table({
        name: 'automated_email_templates',
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
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'content_body',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'available_variables',
            type: 'jsonb',
            default: "'[]'",
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
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

    // Índice único por gym_id + type
    await queryRunner.createIndex(
      'automated_email_templates',
      new TableIndex({
        name: 'IDX_AUTOMATED_EMAIL_GYM_TYPE',
        columnNames: ['gym_id', 'type'],
        isUnique: true,
      }),
    );

    // Tabla mass_emails
    await queryRunner.createTable(
      new Table({
        name: 'mass_emails',
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
            name: 'created_by_user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'content_body',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'filter_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'filter_params',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'total_recipients',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'sent_count',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'failed_count',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'DRAFT'",
            isNullable: false,
          },
          {
            name: 'sent_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'created_at',
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
          {
            columnNames: ['created_by_user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Índice para consultas de historial
    await queryRunner.createIndex(
      'mass_emails',
      new TableIndex({
        name: 'IDX_MASS_EMAILS_GYM_CREATED',
        columnNames: ['gym_id', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('mass_emails');
    await queryRunner.dropTable('automated_email_templates');
  }
}
