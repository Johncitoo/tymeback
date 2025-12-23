import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProviderMessageIdToEmailLogs1734920000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la columna ya existe
    const table = await queryRunner.getTable('email_logs');
    const column = table?.findColumnByName('provider_message_id');

    if (!column) {
      await queryRunner.addColumn(
        'email_logs',
        new TableColumn({
          name: 'provider_message_id',
          type: 'text',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('email_logs', 'provider_message_id');
  }
}
