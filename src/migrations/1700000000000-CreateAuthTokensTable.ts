import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthTokensTable1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear enum para tipos de token
    await queryRunner.query(`
      CREATE TYPE token_type_enum AS ENUM (
        'ACCOUNT_ACTIVATION',
        'PASSWORD_RESET',
        'EMAIL_VERIFICATION'
      );
    `);

    // Crear tabla auth_tokens
    await queryRunner.query(`
      CREATE TABLE auth_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        type token_type_enum NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        is_used BOOLEAN NOT NULL DEFAULT false,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Crear índices
    await queryRunner.query(`
      CREATE INDEX idx_auth_tokens_token ON auth_tokens(token);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_auth_tokens_user_type ON auth_tokens(user_id, type);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS auth_tokens;`);
    await queryRunner.query(`DROP TYPE IF EXISTS token_type_enum;`);
  }
}
