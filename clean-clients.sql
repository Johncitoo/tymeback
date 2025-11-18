-- Script para eliminar todos los clientes y registros relacionados
-- USAR CON PRECAUCIÓN

-- Eliminar registros de tablas relacionadas primero (para evitar foreign key constraints)
DELETE FROM attendance WHERE user_id IN (SELECT id FROM users WHERE role = 'client');
DELETE FROM payments WHERE client_id IN (SELECT id FROM users WHERE role = 'client');
DELETE FROM appointments WHERE client_id IN (SELECT id FROM users WHERE role = 'client');
DELETE FROM body_evaluations WHERE client_id IN (SELECT id FROM users WHERE role = 'client');
DELETE FROM inbody_scans WHERE client_id IN (SELECT id FROM users WHERE role = 'client');
DELETE FROM nutrition_anamneses WHERE client_id IN (SELECT id FROM users WHERE role = 'client');
DELETE FROM nutrition_plans WHERE client_id IN (SELECT id FROM users WHERE role = 'client');
DELETE FROM progress_photos WHERE client_id IN (SELECT id FROM users WHERE role = 'client');
DELETE FROM pr_records WHERE client_id IN (SELECT id FROM users WHERE role = 'client');
DELETE FROM session_burns WHERE client_id IN (SELECT id FROM users WHERE role = 'client');
DELETE FROM workouts WHERE client_id IN (SELECT id FROM users WHERE role = 'client');
DELETE FROM client_metrics WHERE client_id IN (SELECT id FROM users WHERE role = 'client');

-- Finalmente, eliminar los usuarios clientes
DELETE FROM users WHERE role = 'client';

-- Opcional: También limpiar logs de emails
DELETE FROM email_logs;

SELECT 'Todos los clientes han sido eliminados' as resultado;
