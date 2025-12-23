import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddReceiptFileIdToPayments20251220T1200 implements MigrationInterface {
  name = 'AddReceiptFileIdToPayments20251220T1200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna receipt_file_id a la tabla payments
    await queryRunner.addColumn(
      'payments',
      new TableColumn({
        name: 'receipt_file_id',
        type: 'uuid',
        isNullable: true,
        comment: 'ID del archivo de comprobante de pago almacenado en GCS',
      }),
    );

    console.log('✅ Columna receipt_file_id agregada a payments');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('payments', 'receipt_file_id');
    console.log('⬇️ Columna receipt_file_id eliminada de payments');
  }
}
